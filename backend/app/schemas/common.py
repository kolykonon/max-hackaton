from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class ErrorCode(StrEnum):
    UNAUTHORIZED = "unauthorized"
    NOT_FOUND = "not_found"
    VALIDATION_ERROR = "validation_error"
    SLOT_NOT_FOUND = "slot_not_found"
    SLOT_TAKEN = "slot_taken"
    ACTIVE_EXISTS = "active_exists"
    INTERVAL_NOT_PASSED = "interval_not_passed"
    PERSONAL_DATA_INCOMPLETE = "personal_data_incomplete"
    APPOINTMENT_NOT_FOUND = "appointment_not_found"
    APPOINTMENT_NOT_ACTIVE = "appointment_not_active"
    INVITE_NOT_FOUND = "invite_not_found"
    DEMO_DISABLED = "demo_disabled"
    DONATION_NOT_FOUND = "donation_not_found"
    GROUP_NOT_FOUND = "group_not_found"
    GROUP_CLOSED = "group_closed"
    BOT_SEND_FAILED = "bot_send_failed"
    INTERNAL_ERROR = "internal_error"


class ErrorBody(BaseModel):
    code: ErrorCode
    message: str
    fields: dict[str, str] | None


class ErrorResponse(BaseModel):
    error: ErrorBody


class Schema(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)


LocalTime = Annotated[
    str,
    Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$", examples=["09:30"]),
]


def error_responses(*statuses: int) -> dict[int | str, dict]:
    descriptions = {
        401: "Нет или невалидна initData",
        404: "Не найдено",
        409: "Конфликт",
        422: "Ошибка валидации",
        502: "Бот не смог отправить сообщение",
    }
    return {
        s: {"model": ErrorResponse, "description": descriptions.get(s, "Ошибка")}
        for s in statuses
    }
