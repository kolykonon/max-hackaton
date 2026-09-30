import logging
from contextlib import asynccontextmanager

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.routing import APIRoute

from app.api.v1 import api_router
from app.bot import webhook
from app.core.config import settings
from app.core.errors import register_errors
from app.integrations.max_api import MaxBotClient
from app.services.proactive import PUSH_HOUR_MSK, run_daily_pushes
from app.services.reminders import restore_reminders

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.max = MaxBotClient()
    log.info("Клиент макса создан, ссылка на апи=%s", app.state.max.base_url)

    if settings.bot_settings.max_bot_token:
        try:
            await app.state.max.configure_username()
        except (httpx.HTTPError, ValueError):
            log.warning("MAX недоступен или отклонил токен; веб-проверка в AUTH_DEV_MODE доступна. Проверьте логи bot.")

    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(
        run_daily_pushes,
        "cron",
        hour=PUSH_HOUR_MSK,
        timezone="Europe/Moscow",
        args=[app.state.max],
        id="daily_pushes",
        replace_existing=True,
    )
    scheduler.start()
    app.state.scheduler = scheduler
    log.info("Планировщик запущен")

    try:
        await restore_reminders(scheduler, app.state.max)
    except Exception:
        log.exception("Не удалось восстановить напоминания")

    try:
        yield
    finally:
        scheduler.shutdown(wait=False)
        log.info("Планировщик остановлен")
        await app.state.max.aclose()
        log.info("Клиент макса закрыт")


def operation_id(route: APIRoute) -> str:
    return route.name


app = FastAPI(
    title="Капля API",
    version="0.1.0",
    lifespan=lifespan,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",  # сваггер переехал с /docs на /api/docs
    redoc_url=None,
    generate_unique_id_function=operation_id,
)
register_errors(app)

app.include_router(api_router, prefix=settings.dev_settings.api_v1_prefix)
app.include_router(
    webhook.router, prefix=settings.dev_settings.api_v1_prefix, include_in_schema=False
)
