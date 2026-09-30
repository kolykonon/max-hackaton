"""Групповая донация: общий центр и дата, каждый записывается на свой слот."""

import datetime as dt
import logging
import secrets
import string
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import AppError
from app.core.utils.dates import add_months, today_msk
from app.models import (
    Appointment,
    Center,
    DonationGroup,
    DonationGroupMember,
    Region,
    Slot,
    User,
)
from app.models.enums import AppointmentStatus, DonationType
from app.schemas.common import ErrorCode
from app.schemas.groups import Group, GroupCenter, GroupCreate, GroupMember
from app.services.booking import WINDOW_MONTHS, _day_bounds_utc, _places_left

log = logging.getLogger(__name__)

CODE_ALPHABET = string.ascii_lowercase + string.digits
CODE_LEN = 8
GROUP_PREFIX = "grp_"

MONTHS_GEN = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
]


def _new_code() -> str:
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LEN))


def group_link(code: str) -> str:
    bot = settings.bot_settings.max_bot_username or "kaplya_bot"
    return f"https://max.ru/{bot}?startapp={GROUP_PREFIX}{code}"


def human_date(d: dt.date) -> str:
    return f"{d.day} {MONTHS_GEN[d.month - 1]}"


def display_name(user: User) -> str:
    initial = f" {user.last_name[0]}." if user.last_name else ""
    return f"{user.first_name}{initial}"


class GroupService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, user: User, body: GroupCreate) -> Group:
        center = await self.session.get(Center, body.center_id)
        if center is None:
            raise AppError(404, ErrorCode.NOT_FOUND, "Центр не найден")
        today = today_msk()
        if not today <= body.date <= add_months(today, WINDOW_MONTHS):
            raise AppError(
                422,
                ErrorCode.VALIDATION_ERROR,
                "Дата вне окна записи",
                fields={"date": "Выберите дату в ближайшие 2 месяца"},
            )

        existing = await self.session.scalar(
            select(DonationGroup).where(
                DonationGroup.owner_user_id == user.id,
                DonationGroup.center_id == center.id,
                DonationGroup.donation_type == body.donation_type,
                DonationGroup.date == body.date,
            )
        )
        if existing is not None:
            return await self._to_schema(user, existing)

        code = _new_code()
        while await self.session.scalar(
            select(DonationGroup.id).where(DonationGroup.code == code)
        ):
            code = _new_code()
        group = DonationGroup(
            code=code,
            owner_user_id=user.id,
            center_id=center.id,
            donation_type=body.donation_type,
            date=body.date,
        )
        self.session.add(group)
        await self.session.flush()

        self.session.add(DonationGroupMember(group_id=group.id, user_id=user.id))
        await self.session.commit()
        log.info("Группа %s создана user_id=%s", group.code, user.id)
        return await self.get(user, group.code)

    async def get(self, user: User, code: str) -> Group:
        group = await self._load(code)
        return await self._to_schema(user, group)

    async def join(self, user: User, code: str) -> tuple[Group, bool]:
        """Возвращает (группа, присоединился ли только что)."""
        group = await self._load(code)
        if group.date < today_msk():
            raise AppError(409, ErrorCode.GROUP_CLOSED, "Дата группы уже прошла")
        joined = False
        if await self.session.get(DonationGroupMember, (group.id, user.id)) is None:
            self.session.add(DonationGroupMember(group_id=group.id, user_id=user.id))
            await self.session.commit()
            joined = True
        return await self._to_schema(user, group), joined

    async def my_groups(self, user: User, past: bool = False) -> list[Group]:
        today = today_msk()
        groups = await self.session.scalars(
            select(DonationGroup)
            .join(DonationGroupMember, DonationGroupMember.group_id == DonationGroup.id)
            .where(
                DonationGroupMember.user_id == user.id,
                DonationGroup.date < today if past else DonationGroup.date >= today,
            )
            .order_by(
                *(
                    (DonationGroup.date.desc(), DonationGroup.id.desc())
                    if past
                    else (DonationGroup.date, DonationGroup.id)
                )
            )
        )
        return [await self._to_schema(user, g) for g in groups]

    async def groups_of_booking(
        self, user: User, appointment: Appointment
    ) -> list[tuple[int, Group]]:
        center = await self.session.get(Center, appointment.center_id)
        region = await self.session.get(Region, center.region_id)
        tz = ZoneInfo(region.timezone if region else "Europe/Moscow")
        groups = await self.session.scalars(
            select(DonationGroup)
            .join(DonationGroupMember, DonationGroupMember.group_id == DonationGroup.id)
            .where(
                DonationGroupMember.user_id == user.id,
                DonationGroup.owner_user_id != user.id,
                DonationGroup.center_id == appointment.center_id,
                DonationGroup.donation_type == appointment.donation_type,
                DonationGroup.date == appointment.starts_at.astimezone(tz).date(),
            )
        )
        result = []
        for group in groups:
            owner = await self.session.get(User, group.owner_user_id)
            if owner is not None:
                result.append((owner.max_user_id, await self._to_schema(user, group)))
        return result

    # ---------- helpers ----------

    async def _load(self, code: str) -> DonationGroup:
        group = await self.session.scalar(
            select(DonationGroup).where(DonationGroup.code == code)
        )
        if group is None:
            raise AppError(404, ErrorCode.GROUP_NOT_FOUND, "Группа не найдена")
        return group

    async def _to_schema(self, user: User, group: DonationGroup) -> Group:
        center = await self.session.get(Center, group.center_id)
        region = await self.session.get(Region, center.region_id)
        tz = ZoneInfo(region.timezone if region else "Europe/Moscow")
        day_start, day_end = _day_bounds_utc(group.date, tz)

        members = (
            await self.session.execute(
                select(User, DonationGroupMember.joined_at)
                .join(DonationGroupMember, DonationGroupMember.user_id == User.id)
                .where(DonationGroupMember.group_id == group.id)
                .order_by(DonationGroupMember.joined_at, User.id)
            )
        ).all()
        member_ids = [m.id for m, _ in members]
        appointments = (
            await self.session.execute(
                select(
                    Appointment.user_id, Appointment.starts_at, Appointment.status
                ).where(
                    Appointment.user_id.in_(member_ids),
                    Appointment.center_id == group.center_id,
                    Appointment.donation_type == group.donation_type,
                    Appointment.status.in_(
                        [AppointmentStatus.ACTIVE, AppointmentStatus.COMPLETED]
                    ),
                    Appointment.starts_at >= day_start,
                    Appointment.starts_at <= day_end,
                )
            )
        ).all()
        booked = {row.user_id: row.starts_at for row in appointments}
        donated = {
            row.user_id
            for row in appointments
            if row.status == AppointmentStatus.COMPLETED
        }
        free_slots = await self.session.scalar(
            select(func.coalesce(func.sum(_places_left()), 0)).where(
                Slot.center_id == group.center_id,
                Slot.donation_type == group.donation_type,
                Slot.is_blocked.is_(False),
                Slot.starts_at >= max(day_start, dt.datetime.now(dt.UTC)),
                Slot.starts_at <= day_end,
                _places_left() > 0,
            )
        )
        owner = next((m for m, _ in members if m.id == group.owner_user_id), None)
        owner_name = display_name(owner) if owner else ""
        link = group_link(group.code)
        return Group(
            code=group.code,
            center=GroupCenter(
                id=center.id,
                name=center.name,
                address=center.address,
                region_id=center.region_id,
            ),
            date=group.date,
            donation_type=group.donation_type,
            owner_name=owner_name,
            members=[
                GroupMember(
                    name=display_name(m),
                    photo_url=m.photo_url,
                    is_owner=m.id == group.owner_user_id,
                    is_booked=m.id in booked,
                    # у цельной крови время не выбирают — только день
                    booked_time=(
                        booked[m.id].astimezone(tz).strftime("%H:%M")
                        if m.id in booked
                        and group.donation_type == DonationType.PLASMA
                        else None
                    ),
                )
                for m, _ in members
            ],
            members_count=len(members),
            donated_count=len(donated),
            is_member=user.id in member_ids,
            is_owner=user.id == group.owner_user_id,
            is_booked=user.id in booked,
            is_past=group.date < today_msk(),
            free_slots=free_slots or 0,
            link=link,
            share_text=(
                f"Пойдём сдавать кровь вместе? {human_date(group.date)}, "
                f"«{center.name}». Присоединяйся:"
            ),
        )
