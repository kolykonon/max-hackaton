"""Сервис записи на донацию: даты, центры, слоты.

Окно записи — 2 месяца. День доступен, если в регионе есть свободный слот
нужного вида и день >= next_allowed для этого вида.

Свободен = не is_blocked и на него нет active-записи.
"""
import logging
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.utils.dates import add_months, days_between, today_msk
from app.core.utils.geo import distance_km
from app.models import Appointment, Center, CenterBloodStatus, Region, Slot
from app.models.enums import AppointmentStatus, DonationType, StockStatus
from app.models import User
from app.schemas.booking import (
    BookingCenter,
    BookingDates,
    BookingDay,
    BookingSlots,
    Slot as SlotSchema,
    SlotGroup,
    SlotPeriod,
    SlotsCenter,
)
from app.schemas.common import ErrorCode
from app.services.eligibility import get_next_allowed

log = logging.getLogger(__name__)

WINDOW_MONTHS = 2

MORNING_START = time(0, 0)
MORNING_END = time(12, 0)
DAY_START = time(12, 0)
DAY_END = time(17, 0)
EVENING_START = time(17, 0)
EVENING_END = time(23, 59, 59)


def _period(local_time: time) -> SlotPeriod:
    if MORNING_START <= local_time < MORNING_END:
        return SlotPeriod.MORNING
    if DAY_START <= local_time < DAY_END:
        return SlotPeriod.DAY
    return SlotPeriod.EVENING


def _day_bounds_utc(target: date, tz: ZoneInfo) -> tuple[datetime, datetime]:
    """Границы дня в таймзоне региона, приведённые к UTC."""
    day_start_local = datetime.combine(target, time.min, tzinfo=tz)
    day_end_local = datetime.combine(target, time.max, tzinfo=tz)
    return day_start_local.astimezone(timezone.utc), day_end_local.astimezone(timezone.utc)


def _taken_slot_exists():
    """EXISTS: на слот есть active-запись."""
    return (
        select(Appointment.id)
        .where(
            Appointment.slot_id == Slot.id,
            Appointment.status == AppointmentStatus.ACTIVE,
        )
        .exists()
    )


class BookingService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ---------- dates ----------

    async def get_dates(
        self, user: User, region_id: int, donation_type: DonationType
    ) -> BookingDates:
        today = today_msk()
        window_to = add_months(today, WINDOW_MONTHS)
        earliest = await get_next_allowed(self.session, user.id, donation_type, today)

        # Все дни окна, в которых в регионе есть хотя бы один свободный слот
        # нужного вида. Учитываем таймзону региона: «день» — это локальный день центра.
        region = await self.session.get(Region, region_id)
        if region is None:
            raise AppError(404, ErrorCode.NOT_FOUND, "Регион не найден")
        tz = ZoneInfo(region.timezone)

        # Берём все свободные слоты нужного вида в окне и считаем локальные даты
        window_start_utc = datetime.combine(today, time.min, tzinfo=timezone.utc)
        window_end_utc = datetime.combine(window_to, time.max, tzinfo=timezone.utc)

        rows = (
            await self.session.execute(
                select(Slot.starts_at)
                .join(Center, Center.id == Slot.center_id)
                .where(
                    Center.region_id == region_id,
                    Slot.donation_type == donation_type,
                    Slot.is_blocked.is_(False),
                    Slot.starts_at >= window_start_utc,
                    Slot.starts_at <= window_end_utc,
                    ~_taken_slot_exists(),
                )
            )
        ).all()

        available_days: set[date] = {r.starts_at.astimezone(tz).date() for r in rows}

        days: list[BookingDay] = []
        first_available: date | None = None
        for d in days_between(today, window_to):
            ok = d >= earliest and d in available_days
            days.append(BookingDay(date=d, available=ok))
            if ok and first_available is None:
                first_available = d

        return BookingDates(
            **{"from": today},
            to=window_to,
            earliest_allowed=earliest,
            first_available=first_available,
            days=days,
        )

    # ---------- centers ----------

    async def get_centers(
        self,
        user: User,
        region_id: int,
        donation_type: DonationType,
        target_date: date,
        lat: float | None,
        lon: float | None,
        pin_center_id: int | None,
    ) -> list[BookingCenter]:
        region = await self.session.get(Region, region_id)
        if region is None:
            raise AppError(404, ErrorCode.NOT_FOUND, "Регион не найден")
        tz = ZoneInfo(region.timezone)

        day_start_utc, day_end_utc = _day_bounds_utc(target_date, tz)

        rows = (
            await self.session.execute(
                select(
                    Center.id,
                    Center.name,
                    Center.address,
                    Center.lat,
                    Center.lon,
                    Center.photo_url,
                    func.count(Slot.id).label("free_slots"),
                )
                .join(Slot, Slot.center_id == Center.id)
                .where(
                    Center.region_id == region_id,
                    Slot.donation_type == donation_type,
                    Slot.is_blocked.is_(False),
                    Slot.starts_at >= day_start_utc,
                    Slot.starts_at <= day_end_utc,
                    ~_taken_slot_exists(),
                )
                .group_by(
                    Center.id,
                    Center.name,
                    Center.address,
                    Center.lat,
                    Center.lon,
                    Center.photo_url,
                )
            )
        ).all()

        # Статусы по центрам для группы крови пользователя
        group = user.blood_group
        center_status: dict[int, StockStatus] = {}
        if group:
            status_rows = (
                await self.session.execute(
                    select(CenterBloodStatus.center_id, CenterBloodStatus.status)
                    .where(CenterBloodStatus.blood_group == group)
                )
            ).all()
            center_status = {cid: StockStatus(s) for cid, s in status_rows}

        centers: list[BookingCenter] = []
        for r in rows:
            km: float | None = None
            # Если у центра нет координат (0.0), расстояние не считаем
            if lat is not None and lon is not None and (r.lat != 0.0 or r.lon != 0.0):
                km = distance_km(lat, lon, r.lat, r.lon)

            centers.append(
                BookingCenter(
                    id=r.id,
                    name=r.name,
                    address=r.address,
                    lat=r.lat,
                    lon=r.lon,
                    photo_url=r.photo_url,
                    free_slots=r.free_slots,
                    distance_km=km,
                    group_status=center_status.get(r.id),
                )
            )

        # Сортировка: сначала pinned, потом urgent для группы, потом расстояние,
        # потом алфавит.
        def sort_key(c: BookingCenter):
            pinned = 0 if c.id == pin_center_id else 1
            urgent = 0 if c.group_status == StockStatus.URGENT else 1
            dist = c.distance_km if c.distance_km is not None else 1e9
            return (pinned, urgent, dist, c.name)

        centers.sort(key=sort_key)
        return centers

    # ---------- slots ----------

    async def get_slots(
        self,
        user: User,
        center_id: int,
        donation_type: DonationType,
        target_date: date,
    ) -> BookingSlots:
        center = await self.session.get(Center, center_id)
        if center is None:
            raise AppError(404, ErrorCode.NOT_FOUND, "Центр не найден")
        region = await self.session.get(Region, center.region_id)
        tz = ZoneInfo(region.timezone) if region else ZoneInfo("Europe/Moscow")

        day_start_utc, day_end_utc = _day_bounds_utc(target_date, tz)

        rows = (
            await self.session.execute(
                select(
                    Slot.id,
                    Slot.starts_at,
                    Slot.is_blocked,
                    _taken_slot_exists().label("taken"),
                )
                .where(
                    Slot.center_id == center_id,
                    Slot.donation_type == donation_type,
                    Slot.starts_at >= day_start_utc,
                    Slot.starts_at <= day_end_utc,
                )
                .order_by(Slot.starts_at)
            )
        ).all()

        groups: dict[SlotPeriod, list[SlotSchema]] = {}
        for r in rows:
            local_dt = r.starts_at.astimezone(tz)
            period = _period(local_dt.time())
            groups.setdefault(period, []).append(
                SlotSchema(
                    id=r.id,
                    starts_at=r.starts_at,
                    local_time=local_dt.strftime("%H:%M"),
                    is_free=not r.is_blocked and not r.taken,
                )
            )

        ordered = [
            SlotGroup(period=p, slots=groups[p])
            for p in (SlotPeriod.MORNING, SlotPeriod.DAY, SlotPeriod.EVENING)
            if p in groups
        ]

        return BookingSlots(
            center=SlotsCenter(id=center.id, name=center.name, address=center.address),
            date=target_date,
            groups=ordered,
        )