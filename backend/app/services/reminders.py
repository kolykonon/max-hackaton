import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.bot.handlers import (
    send_reminder_1d,
    send_reminder_2d,
    send_reminder_morning,
)
from app.bot.pushes import send_donation_question
from app.core.db import sessionmaker
from app.integrations.max_api import MaxBotClient
from app.models import Appointment, User

log = logging.getLogger(__name__)

# Через сколько после начала записи спросить «Сдали кровь?»
ASK_DONATED_DELAY = timedelta(hours=3)
KINDS = ("2d", "1d", "morning", "ask")


def _job_id(kind: str, appointment_id: int) -> str:
    return f"rem_{kind}_{appointment_id}"


def schedule_reminders(
    scheduler: AsyncIOScheduler,
    appointment: Appointment,
    max_user_id: int,
    client: MaxBotClient,
) -> None:
    """Регистрирует отложенные задачи на запись: 3 напоминания и вопрос «сдали?»."""
    now = datetime.now(timezone.utc)
    starts_at = appointment.starts_at

    # За 2 дня
    run_2d = starts_at - timedelta(days=2)
    if run_2d > now:
        scheduler.add_job(
            send_reminder_2d,
            "date",
            run_date=run_2d,
            args=[client, max_user_id],
            id=_job_id("2d", appointment.id),
            replace_existing=True,
        )

    # За 1 день
    run_1d = starts_at - timedelta(days=1)
    if run_1d > now:
        scheduler.add_job(
            send_reminder_1d,
            "date",
            run_date=run_1d,
            args=[client, max_user_id],
            id=_job_id("1d", appointment.id),
            replace_existing=True,
        )

    # В 5:00 UTC дня записи
    run_morning = starts_at.replace(hour=5, minute=0, second=0, microsecond=0)
    if run_morning > now:
        scheduler.add_job(
            send_reminder_morning,
            "date",
            run_date=run_morning,
            args=[client, max_user_id],
            id=_job_id("morning", appointment.id),
            replace_existing=True,
        )

    # Через 3 часа после начала — «Сдали кровь?» (дальше — документы и заявление)
    run_ask = starts_at + ASK_DONATED_DELAY
    if run_ask > now:
        scheduler.add_job(
            send_donation_question,
            "date",
            run_date=run_ask,
            args=[client, max_user_id, appointment.id],
            id=_job_id("ask", appointment.id),
            replace_existing=True,
        )

    log.info(
        "Напоминания запланированы для appointment_id=%s",
        appointment.id,
    )


def cancel_reminders(scheduler: AsyncIOScheduler, appointment_id: int) -> None:
    """Снимает все задачи при отмене или переносе записи."""
    for kind in KINDS:
        try:
            scheduler.remove_job(_job_id(kind, appointment_id))
        except Exception:
            pass  # задачи могло не быть


async def restore_reminders(
    scheduler: AsyncIOScheduler,
    client: MaxBotClient,
) -> None:
    """Восстанавливает задачи для всех активных записей.

    Вызывается в lifespan при старте бэкенда: если бэк перезапустили,
    все отложенные задачи в памяти пропали — надо поднять их заново.
    """
    now = datetime.now(timezone.utc)
    async with sessionmaker() as session:
        rows = (
            await session.execute(
                select(Appointment, User)
                .join(User, User.id == Appointment.user_id)
                .where(
                    Appointment.status == "active",
                    # запас на вопрос «сдали?», который идёт после начала
                    Appointment.starts_at > now - ASK_DONATED_DELAY,
                )
            )
        ).all()

    for appointment, user in rows:
        schedule_reminders(scheduler, appointment, user.max_user_id, client)

    log.info("Восстановлено напоминаний: %s", len(rows))
