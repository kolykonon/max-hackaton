from typing import Literal

from fastapi import APIRouter
from sqlalchemy import text

from app.core.db import SessionDep
from app.schemas.common import Schema

router = APIRouter(tags=["service"])


class Health(Schema):
    status: Literal["ok"]


@router.get("/health", summary="Проверка живости")
async def health(session: SessionDep) -> Health:
    await session.execute(text("SELECT 1"))
    return Health(status="ok")
