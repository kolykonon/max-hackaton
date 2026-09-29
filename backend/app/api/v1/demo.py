from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DemoServiceDep
from app.core.config import settings
from app.core.errors import AppError
from app.schemas.common import ErrorCode, Schema, error_responses
from app.services.demo import DemoPushKind


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
async def demo_reset(service: DemoServiceDep, user: CurrentUser) -> None:
    await service.reset(user)


@router.post(
    "/appointments/{appointment_id}/remind",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Отправить напоминание сразу",
    responses=error_responses(409),
)
async def demo_remind(
    service: DemoServiceDep, user: CurrentUser, appointment_id: int
) -> None:
    await service.remind(user, appointment_id)


@router.post(
    "/appointments/{appointment_id}/complete",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Засчитать донацию",
    responses=error_responses(409),
)
async def demo_complete(
    service: DemoServiceDep, user: CurrentUser, appointment_id: int
) -> None:
    await service.complete(user, appointment_id)


@router.post(
    "/appointments/{appointment_id}/ask-donated",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Спросить «Сдали кровь?» сразу",
    responses=error_responses(409),
)
async def demo_ask_donated(
    service: DemoServiceDep, user: CurrentUser, appointment_id: int
) -> None:
    await service.ask_donated(user, appointment_id)


@router.post(
    "/pushes/{kind}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Прислать проактивный пуш сейчас (без проверки условий)",
)
async def demo_push(
    service: DemoServiceDep, user: CurrentUser, kind: DemoPushKind
) -> None:
    await service.push(user, kind)


class DailyRunResult(Schema):
    sent: int


@router.post("/pushes-run", summary="Прогнать ежедневную рассылку пушей сейчас")
async def demo_run_daily(service: DemoServiceDep, user: CurrentUser) -> DailyRunResult:
    return DailyRunResult(sent=await service.run_daily())
