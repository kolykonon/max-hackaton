from enum import StrEnum

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot import pushes
from app.bot.handlers import send_reminder_1d
from app.core.errors import AppError
from app.core.utils.dates import now_msk, today_msk
from app.integrations.max_api import MaxBotClient
from app.models import (
    Appointment,
    DonationGroup,
    DonationGroupMember,
    Region,
    RegionBloodStatus,
    User,
)
from app.models.enums import AppointmentStatus, BloodGroup, DonationType
from app.schemas.common import ErrorCode
from app.services import proactive
from app.services.after_donation import (
    DOCUMENTS,
    latest_rest_day_donation,
    register_donation,
    rest_day_deadline,
)
from app.services.demo_profile import create_demo_profile
from app.services.eligibility import interval_ends, load_stats


class DemoPushKind(StrEnum):
    INTERVAL_OPEN = "interval_open"
    DEFICIT = "deficit"
    REST_DAY = "rest_day"


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
        # Свои группы удаляются целиком (участники — через ON DELETE CASCADE),
        # из чужих — просто выходим.
        await self.session.execute(
            delete(DonationGroup).where(DonationGroup.owner_user_id == user.id)
        )
        await self.session.execute(
            delete(DonationGroupMember).where(DonationGroupMember.user_id == user.id)
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
        """Засчитать донацию сегодняшним днём и сразу прислать «что делать после»."""
        appointment = await self._get_active(user, appointment_id)
        donation = await register_donation(self.session, appointment, today_msk())
        await pushes.send_after_donation(
            self.bot,
            user.max_user_id,
            donation.id,
            DOCUMENTS,
            rest_day_deadline(donation.donated_on).strftime("%d.%m.%Y"),
        )

    async def ask_donated(self, user: User, appointment_id: int) -> None:
        """Вопрос «Сдали кровь?» сразу, не дожидаясь 3 часов после записи."""
        appointment = await self._get_active(user, appointment_id)
        await pushes.send_donation_question(self.bot, user.max_user_id, appointment.id)

    async def push(self, user: User, kind: DemoPushKind) -> None:
        """Прислать проактивный пуш сейчас, без проверки условий и журнала."""
        max_id = user.max_user_id
        if kind == DemoPushKind.INTERVAL_OPEN:
            stats = await load_stats(self.session, user.id)
            today = today_msk()
            ends = interval_ends(stats.last_whole, stats.last_plasma)
            types = [t.value for t, d in ends.items() if d is None or d <= today]
            await pushes.send_interval_open(
                self.bot, max_id, types or [DonationType.WHOLE_BLOOD.value]
            )
        elif kind == DemoPushKind.DEFICIT:
            group = (
                BloodGroup(user.blood_group) if user.blood_group else BloodGroup.A_POS
            )
            regions = await proactive.effective_regions(self.session, [user])
            region_id = regions.get(user.id) or await self.session.scalar(
                select(RegionBloodStatus.region_id)
                .where(
                    RegionBloodStatus.blood_group == group,
                    RegionBloodStatus.status.in_(proactive.DEFICIT_STATUSES),
                )
                .limit(1)
            )
            region = await self.session.get(Region, region_id) if region_id else None
            await pushes.send_deficit(
                self.bot, max_id, region.name if region else "Москва", group.value
            )
        else:
            donation = await latest_rest_day_donation(self.session, user)
            if donation is None:
                raise AppError(
                    404,
                    ErrorCode.DONATION_NOT_FOUND,
                    "Нет донации из приложения — сначала засчитайте донацию",
                )
            deadline = rest_day_deadline(donation.donated_on)
            await pushes.send_rest_day_reminder(
                self.bot,
                max_id,
                donation.id,
                donation.donated_on.strftime("%d.%m.%Y"),
                deadline.strftime("%d.%m.%Y"),
                (deadline - today_msk()).days,
            )

    async def run_daily(self) -> int:
        """Прогнать ежедневную рассылку сейчас (с журналом, как по расписанию)."""
        planned = await proactive.plan_availability_pushes(self.session)
        planned += await proactive.plan_rest_day_pushes(self.session)
        return await proactive.deliver(self.session, self.bot, planned)

    async def _get_active(self, user: User, appointment_id: int) -> Appointment:
        appointment = await self.session.get(Appointment, appointment_id)
        if appointment is None or appointment.user_id != user.id:
            raise AppError(404, ErrorCode.APPOINTMENT_NOT_FOUND, "Запись не найдена")
        if appointment.status != AppointmentStatus.ACTIVE:
            raise AppError(409, ErrorCode.APPOINTMENT_NOT_ACTIVE, "Запись не активна")
        return appointment
