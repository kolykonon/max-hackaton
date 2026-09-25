from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Общая ошибка для приложения.
    Кастомные исключения наследовать CustomException(AppError)"""

    def __init__(
        self, status: int, code: str, message: str, fields: dict | None = None
    ):
        self.status = status
        self.code = code
        self.message = message
        self.fields = fields


def register_errors(app: FastAPI):
    """Регает хендлеры"""

    @app.exception_handler(AppError)
    async def app_error(_: Request, e: AppError):
        """Перехватывает ошибку приложения и выдает ее в едином формате"""
        return JSONResponse(
            status_code=e.status,
            content={
                "error": {"code": e.code, "message": e.message, "fieds": e.fields}
            },
        )
