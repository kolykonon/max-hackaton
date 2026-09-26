from fastapi import APIRouter, Depends, status

from app.api.stub.auth import CurrentUser
from app.api.stub.services import demo_service
from app.core.config import settings
from app.core.errors import AppError
from app.schemas.common import ErrorCode, error_responses


async def require_demo_mode() -> None:
    if not settings.dev_settings.demo_mode:
        raise AppError(404, ErrorCode.DEMO_DISABLED, "Демо-режим выключен")


router = APIRouter(
    prefix="/demo",
    tags=["demo"],
    dependencies=[Depends(require_demo_mode)],
    responses=error_responses(401, 404),
)


@router.post(
    "/reset",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Сбросить демо-профиль",
)
async def demo_reset(user: CurrentUser) -> None:
    await demo_service.reset(user)


@router.post(
    "/appointments/{appointment_id}/remind",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Отправить напоминание сразу",
)
async def demo_remind(user: CurrentUser, appointment_id: int) -> None:
    await demo_service.remind(user, appointment_id)


@router.post(
    "/appointments/{appointment_id}/complete",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Засчитать донацию",
    responses=error_responses(409),
)
async def demo_complete(user: CurrentUser, appointment_id: int) -> None:
    await demo_service.complete(user, appointment_id)
