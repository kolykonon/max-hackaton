import datetime as dt

from app.api.stub.data import DEMO_PERSONAL_DATA, DONATION_CENTER_NAMES
from app.api.stub.state import StubState
from app.core.config import settings
from app.core.utils.dates import today_msk
from app.models import User
from app.models.enums import BloodGroup, DonationType
from app.schemas.profile import (
    BloodInfo,
    Donation,
    DonationHistory,
    DonationYear,
    Eligibility,
    Honorary,
    HonoraryCounter,
    HonoraryEta,
    HonoraryMixed,
    IntervalActive,
    Level,
    LevelCode,
    Me,
    NextAllowed,
    NextLevel,
    PersonalData,
    PersonalDataInput,
    Progress,
    Referrals,
)


class StubProfileService:
    LAST_DONATION_DAYS_AGO = 45
    WHOLE_BLOOD_INTERVAL_DAYS = 60

    def __init__(self, state: StubState) -> None:
        self._state = state

    async def get_me(self, user: User) -> Me:
        return Me(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            photo_url=user.photo_url,
            onboarding_completed=self._state.onboarding_completed,
            blood=BloodInfo(
                group=BloodGroup.A_POS,
                kell="K-",
                phenotype="CcDee",
                donor_code="1234-5678",
            ),
            referrals_count=3,
        )

    async def complete_onboarding(self, user: User) -> None:
        self._state.onboarding_completed = True

    async def get_personal_data(self, user: User) -> PersonalData:
        data = self._state.personal_data or DEMO_PERSONAL_DATA
        return PersonalData(
            **data.model_dump(),
            is_demo=self._state.personal_data is None,
            missing_fields=[],
        )

    async def save_personal_data(
        self, user: User, data: PersonalDataInput
    ) -> PersonalData:
        self._state.personal_data = data
        return await self.get_personal_data(user)

    async def get_eligibility(self, user: User) -> Eligibility:
        today = today_msk()
        days_left = self.WHOLE_BLOOD_INTERVAL_DAYS - self.LAST_DONATION_DAYS_AGO
        return Eligibility(
            next_allowed=NextAllowed(
                whole_blood=today + dt.timedelta(days=days_left),
                plasma=today,
            ),
            interval_active=IntervalActive(whole_blood=True, plasma=False),
        )

    async def get_next_allowed(
        self, user: User, donation_type: DonationType
    ) -> dt.date:
        allowed = (await self.get_eligibility(user)).next_allowed
        if donation_type == DonationType.WHOLE_BLOOD:
            return allowed.whole_blood
        return allowed.plasma

    async def get_progress(self, user: User) -> Progress:
        return Progress(
            total=12,
            level=Level(
                code=LevelCode.EXPERIENCED,
                name="Опытный донор",
                threshold=10,
                next=NextLevel(
                    code=LevelCode.MENTOR, name="Наставник", threshold=20, remaining=8
                ),
                is_max=False,
            ),
            honorary=Honorary(
                whole=HonoraryCounter(count=10, goal=40),
                plasma=HonoraryCounter(count=2, goal=60),
                mixed=HonoraryMixed(count=12, goal=60, whole_needed_for_40=15),
                achieved=False,
                eta=HonoraryEta(
                    date=today_msk() + dt.timedelta(days=5 * 365 + 182),
                    years=5,
                    months=6,
                ),
            ),
        )

    async def get_donations(self, user: User) -> DonationHistory:
        items = self._demo_donations()
        by_year: dict[int, list[Donation]] = {}
        for donation in items:
            by_year.setdefault(donation.donated_on.year, []).append(donation)
        return DonationHistory(
            total=len(items),
            years=[
                DonationYear(year=year, count=len(year_items), items=year_items)
                for year, year_items in by_year.items()
            ],
        )

    async def get_referrals(self, user: User) -> Referrals:
        bot = settings.bot_settings.max_bot_username or "kaplya_bot"
        link = f"https://max.ru/{bot}?startapp=ref_{user.referral_code}"
        return Referrals(count=3, link=link)

    def _demo_donations(self) -> list[Donation]:
        last = today_msk() - dt.timedelta(days=self.LAST_DONATION_DAYS_AGO)
        dates = [
            (DonationType.WHOLE_BLOOD, last - dt.timedelta(days=90 * i))
            for i in range(10)
        ] + [
            (DonationType.PLASMA, last - dt.timedelta(days=45)),
            (DonationType.PLASMA, last - dt.timedelta(days=315)),
        ]
        dates.sort(key=lambda x: x[1], reverse=True)
        return [
            Donation(
                id=len(dates) - i,
                donation_type=donation_type,
                donated_on=donated_on,
                center_name=DONATION_CENTER_NAMES[i % len(DONATION_CENTER_NAMES)],
            )
            for i, (donation_type, donated_on) in enumerate(dates)
        ]
