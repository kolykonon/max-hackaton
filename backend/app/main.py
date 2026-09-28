import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.routing import APIRoute

from app.api.v1 import api_router
from app.bot import webhook
from app.core.errors import register_errors
from app.integrations.max_api import MaxBotClient
from app.services.reminders import restore_reminders

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MAX client
    app.state.max = MaxBotClient()
    log.info("MaxBotClient создан, base_url=%s", app.state.max.base_url)

    # APScheduler для отложенных напоминаний
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.start()
    app.state.scheduler = scheduler
    log.info("APScheduler запущен")

    # Восстанавливаем задачи из БД (после перезапуска бэкенда)
    try:
        await restore_reminders(scheduler, app.state.max)
    except Exception:
        log.exception("Не удалось восстановить напоминания при старте")

    try:
        yield
    finally:
        scheduler.shutdown(wait=False)
        log.info("APScheduler остановлен")
        await app.state.max.aclose()
        log.info("MaxBotClient закрыт")


def operation_id(route: APIRoute) -> str:
    return route.name


app = FastAPI(
    title="Капля API",
    version="0.1.0",
    lifespan=lifespan,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url=None,
    generate_unique_id_function=operation_id,
)
register_errors(app)

app.include_router(api_router, prefix="/api/v1")
app.include_router(webhook.router, prefix="/api/v1", include_in_schema=False)