import datetime as dt

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import AppError
from app.core.utils.dates import now_msk, today_msk
from app.models import Donation as DonationModel
from app.models import PersonalData as PersonalDataModel
from app.models import Region, User
from app.models.enums import DonationType
from app.schemas.common import ErrorCode
from app.schemas.profile import (
    BloodInfo,
    Donation,
    DonationHistory,
    DonationYear,
    Eligibility,
    Impact,
    ImpactSource,
    IntervalActive,
    Me,
    NextAllowed,
    PersonalData,
    PersonalDataField,
    PersonalDataInput,
    Progress,
    Referrals,
    RegionShort,
    ShareCard,
    ShareCardKind,
)
from app.services.eligibility import DonationStats, next_allowed
from app.services.impact import SOURCES, ImpactNumbers
from app.services.progress import get_honorary, get_level

REQUIRED_FIELDS = [f for f in PersonalDataField if f != PersonalDataField.MIDDLE_NAME]


def _missing_fields(row: PersonalDataModel | None) -> list[PersonalDataField]:
    return [f for f in REQUIRED_FIELDS if not (row and getattr(row, f.value))]


def _donations_word(n: int) -> str:
    if n % 10 == 1 and n % 100 != 11:
        return "донация"
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
        return "донации"
    return "донаций"


def referral_link(user: User) -> str:
    bot = settings.bot_settings.max_bot_username or "kaplya_bot"
    return f"https://max.ru/{bot}?startapp=ref_{user.referral_code}"


class ProfileService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # --- для других сервисов (запись) ---

    async def get_stats(self, user_id: int) -> DonationStats:
        rows = await self.session.execute(
            select(
                DonationModel.donation_type,
                func.count(),
                func.max(DonationModel.donated_on),
            )
            .where(DonationModel.user_id == user_id)
            .group_by(DonationModel.donation_type)
        )
        data = {row[0]: (row[1], row[2]) for row in rows}
        whole_count, last_whole = data.get(DonationType.WHOLE_BLOOD, (0, None))
        plasma_count, last_plasma = data.get(DonationType.PLASMA, (0, None))
        return DonationStats(
            whole_count=whole_count,
            plasma_count=plasma_count,
            last_whole=last_whole,
            last_plasma=last_plasma,
        )

    async def get_next_allowed(
        self, user_id: int, donation_type: DonationType
    ) -> dt.date:
        """С какой даты пользователь может сдать donation_type (422 interval_not_passed)."""
        stats = await self.get_stats(user_id)
        allowed = next_allowed(stats.last_whole, stats.last_plasma, today_msk())
        return allowed.for_type(donation_type)

    async def is_personal_data_complete(self, user_id: int) -> bool:
        """Для записи (422 personal_data_incomplete)."""
        row = await self.session.get(PersonalDataModel, user_id)
        return not _missing_fields(row)

    # --- эндпоинты /me ---

    async def get_me(self, user: User) -> Me:
        return Me(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            photo_url=user.photo_url,
            onboarding_completed=user.onboarding_completed_at is not None,
            blood=BloodInfo(
                group=user.blood_group,
                kell=user.kell,
                phenotype=user.phenotype,
                donor_code=user.donor_code,
            ),
            referrals_count=await self._referrals_count(user),
            region=await self._region(user),
        )

    async def set_region(self, user: User, region_id: int) -> Me:
        if await self.session.get(Region, region_id) is None:
            raise AppError(404, ErrorCode.NOT_FOUND, "Регион не найден")
        user.region_id = region_id
        await self.session.commit()
        return await self.get_me(user)

    async def _region(self, user: User) -> RegionShort | None:
        if not user.region_id:
            return None
        region = await self.session.get(Region, user.region_id)
        return RegionShort(id=region.id, name=region.name) if region else None

    async def get_impact(self, user: User) -> Impact:
        stats = await self.get_stats(user.id)
        n = ImpactNumbers(
            whole_count=stats.whole_count, plasma_count=stats.plasma_count
        )
        return Impact(
            whole_count=n.whole_count,
            plasma_count=n.plasma_count,
            whole_liters=n.whole_liters,
            plasma_liters_max=n.plasma_liters_max,
            total_liters_max=n.total_liters_max,
            patients_helped_max=n.patients_helped_max,
            sources=[ImpactSource(**vars(s)) for s in SOURCES],
        )

    async def get_share_card(self, user: User, kind: ShareCardKind) -> ShareCard:
        stats = await self.get_stats(user.id)
        level = get_level(stats.total)
        helped = ImpactNumbers(
            stats.whole_count, stats.plasma_count
        ).patients_helped_max
        last = max(filter(None, (stats.last_whole, stats.last_plasma)), default=None)
        link = referral_link(user)
        if kind == ShareCardKind.DONATION:
            title = "Я сдал(а) кровь"
            subtitle = f"Уже {stats.total} {_donations_word(stats.total)} в «Капле»"
            text = (
                f"Я сдал(а) кровь — это уже {stats.total} {_donations_word(stats.total)}. "
                "Стать донором просто: запись в центр крови прямо в MAX. Присоединяйся!"
            )
        else:
            title = f"Мой уровень: {level.name}"
            subtitle = (
                f"До уровня «{level.next.name}» — {level.next.remaining} "
                f"{_donations_word(level.next.remaining)}"
                if level.next
                else "Максимальный уровень донора"
            )
            text = (
                f"Мой уровень донора в «Капле» — «{level.name}», "
                f"{stats.total} {_donations_word(stats.total)}. "
                "Записаться на донацию можно прямо в MAX. Присоединяйся!"
            )
        return ShareCard(
            kind=kind,
            title=title,
            subtitle=subtitle,
            total=stats.total,
            level=level,
            patients_helped_max=helped,
            last_donation_on=last,
            text=text,
            link=link,
        )

    async def complete_onboarding(self, user: User) -> None:
        now = now_msk()
        user.consent_at = user.consent_at or now
        user.onboarding_completed_at = user.onboarding_completed_at or now
        await self.session.commit()

    async def get_personal_data(self, user: User) -> PersonalData:
        row = await self.session.get(PersonalDataModel, user.id)
        values = {
            f.value: getattr(row, f.value) if row else None for f in PersonalDataField
        }
        return PersonalData(
            **values,
            is_demo=bool(row and row.is_demo),
            missing_fields=_missing_fields(row),
        )

    async def save_personal_data(
        self, user: User, data: PersonalDataInput
    ) -> PersonalData:
        values = data.model_dump()
        values["middle_name"] = values["middle_name"] or None
        row = await self.session.get(PersonalDataModel, user.id)
        if row is None:
            row = PersonalDataModel(user_id=user.id)
            self.session.add(row)
        for key, value in values.items():
            setattr(row, key, value)
        row.is_demo = False
        await self.session.commit()
        return await self.get_personal_data(user)

    async def get_eligibility(self, user: User) -> Eligibility:
        today = today_msk()
        stats = await self.get_stats(user.id)
        allowed = next_allowed(stats.last_whole, stats.last_plasma, today)
        return Eligibility(
            next_allowed=NextAllowed(
                whole_blood=allowed.whole_blood, plasma=allowed.plasma
            ),
            interval_active=IntervalActive(
                whole_blood=allowed.whole_blood > today,
                plasma=allowed.plasma > today,
            ),
        )

    async def get_progress(self, user: User) -> Progress:
        stats = await self.get_stats(user.id)
        return Progress(
            total=stats.total,
            level=get_level(stats.total),
            honorary=get_honorary(stats, today_msk()),
        )

    async def get_donations(self, user: User) -> DonationHistory:
        rows = await self.session.scalars(
            select(DonationModel)
            .where(DonationModel.user_id == user.id)
            .order_by(DonationModel.donated_on.desc(), DonationModel.id.desc())
        )
        by_year: dict[int, list[Donation]] = {}
        for row in rows:
            by_year.setdefault(row.donated_on.year, []).append(
                Donation(
                    id=row.id,
                    donation_type=row.donation_type,
                    donated_on=row.donated_on,
                    center_name=row.center_name,
                )
            )
        return DonationHistory(
            total=sum(len(items) for items in by_year.values()),
            years=[
                DonationYear(year=year, count=len(items), items=items)
                for year, items in by_year.items()
            ],
        )

    async def get_referrals(self, user: User) -> Referrals:
        return Referrals(
            count=await self._referrals_count(user), link=referral_link(user)
        )

    async def _referrals_count(self, user: User) -> int:
        count = await self.session.scalar(
            select(func.count()).where(User.referred_by_user_id == user.id)
        )
        return count or 0
