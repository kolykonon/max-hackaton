import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.bot.handlers import send_reminder
from app.core.db import SessionLocal
from app.integrations.max_api import MaxBotClient
from app.models import Appointment, User

log = logging.getLogger(__name__)

REMINDER_INTERVAL = timedelta(minutes=5)
REMINDER_WINDOW = timedelta(hours=24)


async def _process_due_reminders(client: MaxBotClient) -> None:
    now = datetime.now(timezone.utc)
    horizon = now + REMINDER_WINDOW

    async with SessionLocal() as session:
        rows = (
            await session.execute(
                select(Appointment, User)
                .join(User, User.id == Appointment.user_id)
                .where(
                    Appointment.status == "active",
                    Appointment.reminder_sent_at.is_(None),
                    Appointment.starts_at > now,
                    Appointment.starts_at <= horizon,
                )
            )
        ).all()

        for appointment, user in rows:
            await send_reminder(client, user.max_user_id)
            appointment.reminder_sent_at = now

        if rows:
            await session.commit()
            log.info("Отправлено напоминаний: %s", len(rows))


async def reminders_loop(client: MaxBotClient) -> None:
    while True:
        try:
            await _process_due_reminders(client)
        except Exception:
            log.exception("Ошибка цикла напоминаний")
        await asyncio.sleep(REMINDER_INTERVAL.total_seconds())
