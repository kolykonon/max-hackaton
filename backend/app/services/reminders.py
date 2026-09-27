"""Отложенные напоминания через APScheduler.

Три типа:
1. За 2 дня — не есть жирную пищу.
2. За 1 день — напоминание о записи.
3. В 5:00 по местному времени региона — рекомендации по еде.

Задачи хранятся в памяти процесса. При перезапуске бэкенда
они восстанавливаются из БД через `restore_reminders` (см. lifespan).

Если задача не восстанавливается — значит момент уже прошёл,
и напоминание было отправлено ранее. Дублей при рестарте нет.
"""
import logging
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.bot.handlers import (
    send_reminder_1d,
    send_reminder_2d,
    send_reminder_morning,
)
from app.core.db import sessionmaker
from app.integrations.max_api import MaxBotClient
from app.models import Appointment, Center, Region, User

log = logging.getLogger(__name__)


def _job_id(kind: str, appointment_id: int) -> str:
    return f"rem_{kind}_{appointment_id}"


def schedule_reminders(
    scheduler: AsyncIOScheduler,
    appointment: Appointment,
    max_user_id: int,
    client: MaxBotClient,
    tz_name: str = "Europe/Moscow",
) -> None:
    """Регистрирует три отложенные задачи на запись.

    Если момент отправки уже прошёл — задача не ставится.
    Это защищает от дублей при восстановлении после рестарта.
    """
    now = datetime.now(timezone.utc)
    starts_at = appointment.starts_at
    tz = ZoneInfo(tz_name)

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

    # В 5:00 по местному времени региона
    starts_local = starts_at.astimezone(tz)
    morning_local = starts_local.replace(hour=5, minute=0, second=0, microsecond=0)
    run_morning = morning_local.astimezone(timezone.utc)
    if run_morning > now:
        scheduler.add_job(
            send_reminder_morning,
            "date",
            run_date=run_morning,
            args=[client, max_user_id],
            id=_job_id("morning", appointment.id),
            replace_existing=True,
        )

    log.info(
        "Напоминания запланированы для appointment_id=%s (tz=%s, morning=%s UTC)",
        appointment.id,
        tz_name,
        run_morning,
    )


def cancel_reminders(scheduler: AsyncIOScheduler, appointment_id: int) -> None:
    """Снимает все три задачи при отмене или переносе записи."""
    for kind in ("2d", "1d", "morning"):
        try:
            scheduler.remove_job(_job_id(kind, appointment_id))
        except Exception:
            pass  # задачи могло не быть — это нормально


async def restore_reminders(
    scheduler: AsyncIOScheduler,
    client: MaxBotClient,
) -> None:
    """Восстанавливает задачи для всех активных записей при старте бэкенда."""
    now = datetime.now(timezone.utc)
    async with sessionmaker() as session:
        rows = (
            await session.execute(
                select(Appointment, User, Region.timezone)
                .join(User, User.id == Appointment.user_id)
                .join(Center, Center.id == Appointment.center_id)
                .join(Region, Region.id == Center.region_id)
                .where(
                    Appointment.status == "active",
                    Appointment.starts_at > now,
                )
            )
        ).all()

    for appointment, user, tz_name in rows:
        schedule_reminders(
            scheduler,
            appointment,
            user.max_user_id,
            client,
            tz_name or "Europe/Moscow",
        )

    log.info("Восстановлено напоминаний: %s", len(rows))