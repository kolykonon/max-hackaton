from typing import Literal

from fastapi import APIRouter

from app.schemas.common import Schema

router = APIRouter(tags=["service"])


class Health(Schema):
    status: Literal["ok"]


@router.get("/health", summary="Проверка живости")
async def health() -> Health:
    return Health(status="ok")
