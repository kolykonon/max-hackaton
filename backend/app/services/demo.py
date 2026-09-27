from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.handlers import send_reminder_1d
from app.core.errors import AppError
from app.core.utils.dates import now_msk, today_msk
from app.integrations.max_api import MaxBotClient
from app.models import Appointment, Center, Donation, User
from app.models.enums import AppointmentStatus
from app.schemas.common import ErrorCode
from app.services.demo_profile import create_demo_profile


class DemoService:
    def __init__(self, session: AsyncSession, bot: MaxBotClient) -> None:
        self.session = session
        self.bot = bot

    async def reset(self, user: User) -> None:
        await self.session.execute(
            update(Appointment)
            .where(
                Appointment.user_id == user.id,
                Appointment.status == AppointmentStatus.ACTIVE,
            )
            .values(status=AppointmentStatus.CANCELLED, cancelled_at=now_msk())
        )
        user.onboarding_completed_at = None
        user.consent_at = None
        await create_demo_profile(self.session, user)
        await self.session.commit()

    async def remind(self, user: User, appointment_id: int) -> None:
        appointment = await self._get_active(user, appointment_id)
        await send_reminder_1d(self.bot, user.max_user_id)
        appointment.reminder_sent_at = now_msk()
        await self.session.commit()

    async def complete(self, user: User, appointment_id: int) -> None:
        appointment = await self._get_active(user, appointment_id)
        center_name = await self.session.scalar(
            select(Center.name).where(Center.id == appointment.center_id)
        )
        appointment.status = AppointmentStatus.COMPLETED
        self.session.add(
            Donation(
                user_id=user.id,
                donation_type=appointment.donation_type,
                donated_on=today_msk(),
                center_name=center_name,
            )
        )
        await self.session.commit()

    async def _get_active(self, user: User, appointment_id: int) -> Appointment:
        appointment = await self.session.get(Appointment, appointment_id)
        if appointment is None or appointment.user_id != user.id:
            raise AppError(404, ErrorCode.APPOINTMENT_NOT_FOUND, "Запись не найдена")
        if appointment.status != AppointmentStatus.ACTIVE:
            raise AppError(409, ErrorCode.APPOINTMENT_NOT_ACTIVE, "Запись не активна")
        return appointment