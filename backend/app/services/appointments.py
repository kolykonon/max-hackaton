"""Сервис записей на донацию: создание, перенос, отмена.

Создание и перенос — в одной транзакции. Гонка за слот ловится
partial unique index (uq_active_slot), гонка за активную запись
пользователя — uq_active_user. Оба → IntegrityError → 409.
"""

import logging
import secrets
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import AppError
from app.core.utils.dates import today_msk
from app.models import Appointment, Center, PersonalData, Region, Slot, User
from app.models.enums import AppointmentStatus, DonationType
from app.schemas.appointments import (
    Appointment as AppointmentSchema,
    AppointmentCenter,
    Invite,
    InviteLink,
)
from app.schemas.common import ErrorCode
from app.services.eligibility import get_next_allowed

log = logging.getLogger(__name__)

INVITE_PREFIX = "together_"


def invite_link(code: str) -> str:
    bot = settings.bot_settings.max_bot_username or "kaplya_bot"
    return f"https://max.ru/{bot}?startapp={INVITE_PREFIX}{code}"


def _to_schema(
    appointment: Appointment, center: Center, tz_name: str
) -> AppointmentSchema:
    tz = ZoneInfo(tz_name)
    local_dt = appointment.starts_at.astimezone(tz)
    return AppointmentSchema(
        id=appointment.id,
        donation_type=DonationType(appointment.donation_type),
        starts_at=appointment.starts_at,
        local_date=local_dt.date(),
        local_time=local_dt.strftime("%H:%M"),
        center=AppointmentCenter(
            id=center.id,
            name=center.name,
            address=center.address,
            region_id=center.region_id,
        ),
    )


class AppointmentService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_current(self, user: User) -> AppointmentSchema | None:
        appointment = await self.session.scalar(
            select(Appointment).where(
                Appointment.user_id == user.id,
                Appointment.status == AppointmentStatus.ACTIVE,
            )
        )
        if appointment is None:
            return None
        center, tz = await self._center_and_tz(appointment.center_id)
        return _to_schema(appointment, center, tz)

    async def create(
        self, user: User, slot_id: int, invite_code: str | None = None
    ) -> tuple[AppointmentSchema, Appointment, str]:
        slot = await self._load_free_slot(slot_id)
        await self._check_active_not_exists(user)
        await self._check_personal_data(user)
        await self._check_interval(user, slot)
        inviting = await self._inviting_appointment(user, slot, invite_code)

        appointment = Appointment(
            user_id=user.id,
            slot_id=slot.id,
            center_id=slot.center_id,
            donation_type=slot.donation_type,
            starts_at=slot.starts_at,
            status=AppointmentStatus.ACTIVE,
            invited_by_appointment_id=inviting.id if inviting else None,
        )
        self.session.add(appointment)
        if user.region_id is None:
            # регион донора для пушей о дефиците — по центру первой записи
            user.region_id = await self.session.scalar(
                select(Center.region_id).where(Center.id == slot.center_id)
            )
        await self._commit_or_slot_taken()

        center, tz = await self._center_and_tz(slot.center_id)
        log.info(
            "Создана запись id=%s user_id=%s slot_id=%s",
            appointment.id,
            user.id,
            slot.id,
        )
        return _to_schema(appointment, center, tz), appointment, tz

    async def reschedule(
        self, user: User, appointment_id: int, slot_id: int
    ) -> tuple[AppointmentSchema, Appointment, str]:
        old = await self._load_active(user, appointment_id)
        slot = await self._load_free_slot(slot_id)
        await self._check_interval(user, slot)

        old.status = AppointmentStatus.RESCHEDULED
        invite_code, old.invite_code = old.invite_code, None
        await self.session.flush()

        new = Appointment(
            user_id=user.id,
            slot_id=slot.id,
            center_id=slot.center_id,
            donation_type=slot.donation_type,
            starts_at=slot.starts_at,
            status=AppointmentStatus.ACTIVE,
            rescheduled_from_id=old.id,
            invite_code=invite_code,
        )
        self.session.add(new)
        await self._commit_or_slot_taken()

        center, tz = await self._center_and_tz(slot.center_id)
        log.info("Перенос: old_id=%s new_id=%s user_id=%s", old.id, new.id, user.id)
        return _to_schema(new, center, tz), new, tz

    async def cancel(self, user: User, appointment_id: int) -> None:
        appointment = await self._load_active(user, appointment_id)
        appointment.status = AppointmentStatus.CANCELLED
        appointment.cancelled_at = datetime.now(timezone.utc)
        await self.session.commit()
        log.info("Отменена запись id=%s user_id=%s", appointment.id, user.id)

    async def create_invite(self, user: User, appointment_id: int) -> InviteLink:
        appointment = await self._load_active(user, appointment_id)
        if appointment.invite_code is None:
            appointment.invite_code = secrets.token_urlsafe(6)
            await self.session.commit()
            log.info(
                "Приглашение создано appointment_id=%s user_id=%s",
                appointment.id,
                user.id,
            )
        return InviteLink(
            code=appointment.invite_code, link=invite_link(appointment.invite_code)
        )

    async def get_invite(self, user: User, code: str) -> Invite:
        appointment = await self._load_invite(code)
        inviter = await self.session.get(User, appointment.user_id)
        center, tz = await self._center_and_tz(appointment.center_id)
        return Invite(
            code=code,
            inviter_name=inviter.first_name if inviter else "",
            is_own=appointment.user_id == user.id,
            appointment=_to_schema(appointment, center, tz),
        )

    async def get_inviter(self, appointment: Appointment) -> User | None:
        if appointment.invited_by_appointment_id is None:
            return None
        inviting = await self.session.get(
            Appointment, appointment.invited_by_appointment_id
        )
        if inviting is None:
            return None
        return await self.session.get(User, inviting.user_id)

    # ---------- helpers ----------

    async def _load_invite(self, code: str) -> Appointment:
        appointment = await self.session.scalar(
            select(Appointment).where(Appointment.invite_code == code)
        )
        if (
            appointment is None
            or appointment.status != AppointmentStatus.ACTIVE
            or appointment.starts_at <= datetime.now(timezone.utc)
        ):
            raise AppError(
                404, ErrorCode.INVITE_NOT_FOUND, "Приглашение больше не действует"
            )
        return appointment

    async def _inviting_appointment(
        self, user: User, slot: Slot, invite_code: str | None
    ) -> Appointment | None:
        if not invite_code:
            return None
        try:
            inviting = await self._load_invite(invite_code)
        except AppError:
            return None
        if inviting.user_id == user.id or inviting.center_id != slot.center_id:
            return None
        _, tz_name = await self._center_and_tz(slot.center_id)
        tz = ZoneInfo(tz_name)
        if (
            inviting.starts_at.astimezone(tz).date()
            != slot.starts_at.astimezone(tz).date()
        ):
            return None
        return inviting

    async def _load_free_slot(self, slot_id: int) -> Slot:
        slot = await self.session.get(Slot, slot_id)
        if slot is None:
            raise AppError(404, ErrorCode.SLOT_NOT_FOUND, "Слот не найден")
        if slot.is_blocked or slot.starts_at <= datetime.now(timezone.utc):
            raise AppError(404, ErrorCode.SLOT_NOT_FOUND, "Слот недоступен")
        taken = await self.session.scalar(
            select(Appointment.id).where(
                Appointment.slot_id == slot_id,
                Appointment.status == AppointmentStatus.ACTIVE,
            )
        )
        if taken is not None:
            raise AppError(409, ErrorCode.SLOT_TAKEN, "Слот уже занят")
        return slot

    async def _load_active(self, user: User, appointment_id: int) -> Appointment:
        appointment = await self.session.get(Appointment, appointment_id)
        if appointment is None or appointment.user_id != user.id:
            raise AppError(404, ErrorCode.APPOINTMENT_NOT_FOUND, "Запись не найдена")
        if appointment.status != AppointmentStatus.ACTIVE:
            raise AppError(409, ErrorCode.APPOINTMENT_NOT_ACTIVE, "Запись не активна")
        return appointment

    async def _check_active_not_exists(self, user: User) -> None:
        exists = await self.session.scalar(
            select(Appointment.id).where(
                Appointment.user_id == user.id,
                Appointment.status == AppointmentStatus.ACTIVE,
            )
        )
        if exists is not None:
            raise AppError(
                409, ErrorCode.ACTIVE_EXISTS, "У вас уже есть активная запись"
            )

    async def _check_personal_data(self, user: User) -> None:
        pd = await self.session.get(PersonalData, user.id)
        if pd is None:
            raise AppError(
                422, ErrorCode.PERSONAL_DATA_INCOMPLETE, "Заполните личные данные"
            )
        required = (
            "last_name",
            "first_name",
            "passport_series",
            "passport_number",
            "passport_issued_by",
            "passport_division_code",
            "oms_number",
            "phone",
            "email",
        )
        missing = [f for f in required if not getattr(pd, f, None)]
        if missing:
            raise AppError(
                422,
                ErrorCode.PERSONAL_DATA_INCOMPLETE,
                "Заполните личные данные",
                fields={f: "Обязательное поле" for f in missing},
            )

    async def _check_interval(self, user: User, slot: Slot) -> None:
        today = today_msk()
        earliest = await get_next_allowed(
            self.session, user.id, DonationType(slot.donation_type), today
        )
        slot_local_date: date = slot.starts_at.date()
        if slot_local_date < earliest:
            raise AppError(
                422,
                ErrorCode.INTERVAL_NOT_PASSED,
                f"Сдать можно с {earliest.isoformat()}",
            )

    async def _center_and_tz(self, center_id: int) -> tuple[Center, str]:
        center = await self.session.get(Center, center_id)
        if center is None:
            raise AppError(404, ErrorCode.NOT_FOUND, "Центр не найден")
        region = await self.session.get(Region, center.region_id)
        return center, (region.timezone if region else "Europe/Moscow")

    async def _commit_or_slot_taken(self) -> None:
        try:
            await self.session.commit()
        except IntegrityError as e:
            await self.session.rollback()
            text = str(e.orig).lower()
            if "uq_active_user" in text:
                raise AppError(
                    409, ErrorCode.ACTIVE_EXISTS, "У вас уже есть активная запись"
                )
            raise AppError(409, ErrorCode.SLOT_TAKEN, "Слот уже занят")
