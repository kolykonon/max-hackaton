import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.utils.data_validate import InitDataError
from app.schemas.common import ErrorCode
from app.schemas.profile import PERSONAL_DATA_ERRORS

log = logging.getLogger(__name__)


class AppError(Exception):
    """Общая ошибка приложения. Отдаётся как {"error": {"code", "message", "fields"}}."""

    def __init__(
        self,
        status_code: int,
        code: ErrorCode,
        message: str,
        fields: dict[str, str] | None = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.fields = fields


def error_json(
    status_code: int,
    code: ErrorCode,
    message: str,
    fields: dict[str, str] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "fields": fields}},
    )


def register_errors(app: FastAPI) -> None:
    """Регистрирует обработчики, чтобы все ошибки шли в едином формате."""

    @app.exception_handler(AppError)
    async def app_error(_: Request, e: AppError):
        return error_json(e.status_code, e.code, e.message, e.fields)

    @app.exception_handler(InitDataError)
    async def init_data_error(_: Request, e: InitDataError):
        return error_json(401, ErrorCode.UNAUTHORIZED, str(e))

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, e: RequestValidationError):
        fields: dict[str, str] = {}
        for err in e.errors():
            loc = err.get("loc", ())
            if len(loc) >= 2 and loc[0] == "body" and isinstance(loc[1], str):
                fields.setdefault(
                    loc[1], PERSONAL_DATA_ERRORS.get(loc[1], "Проверьте значение")
                )
        return error_json(
            422, ErrorCode.VALIDATION_ERROR, "Проверьте данные", fields or None
        )

    @app.exception_handler(Exception)
    async def unhandled(_: Request, e: Exception):
        log.exception("Необработанная ошибка")
        return error_json(500, ErrorCode.INTERNAL_ERROR, "Внутренняя ошибка")
