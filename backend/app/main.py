import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.bot import webhook
from app.integrations.max_api import MaxBotClient
from app.core.config import settings

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.max = MaxBotClient()
    log.info("MaxBotClient создан, base_url=%s", app.state.max.base_url)
    try:
        yield
    finally:
        await app.state.max.aclose()
        log.info("MaxBotClient закрыт")


app = FastAPI(title="Капля API", version="0.1.0", lifespan=lifespan)

app.include_router(webhook.router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
