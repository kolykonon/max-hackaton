import asyncio
import logging
import ssl
from functools import lru_cache
from typing import Any

import httpx

from app.core.config import settings

log = logging.getLogger(__name__)

CERT_SUFFIXES = {".cer", ".crt", ".pem"}
# Пауза между попытками отправить только что загруженный файл, сек
RETRY_DELAY = 1.0


@lru_cache(maxsize=1)  # кешируем контекст
def _build_ssl_context() -> ssl.SSLContext:
    """
    Грузит все сертификаты из папки SSL_CERTS_DIR.Если папки нет — только системные сертификаты.
    """
    ctx = ssl.create_default_context()
    certs_dir = settings.bot_settings.ssl_certs_dir
    if not certs_dir.is_dir():
        log.warning("Папка с сертификатами %s не найдена", certs_dir)
        return ctx

    for path in sorted(certs_dir.iterdir()):
        if path.suffix.lower() not in CERT_SUFFIXES:
            continue
        try:
            ctx.load_verify_locations(path)
            log.info("Загружен сертификат %s", path.name)
        except Exception:
            log.exception("Не удалось загрузить сертификат %s", path)
    return ctx


class MaxBotClient:
    """Клиент макса."""

    def __init__(self, token: str | None = None, base_url: str | None = None) -> None:
        self.token = token or settings.bot_settings.max_bot_token
        self.base_url = (base_url or settings.bot_settings.max_api_base_url).rstrip("/")
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={"Authorization": self.token},
            timeout=httpx.Timeout(60.0, connect=10.0),
            verify=_build_ssl_context(),
        )  # создаем асинхронный клиент с токеном и ssl

    async def aclose(self) -> None:
        await self._client.aclose()  # обертка над методом клиента

    @staticmethod
    def _check(resp: httpx.Response) -> None:
        """Проверка ответа на ошибки."""
        if resp.status_code >= 400:
            log.error(
                "MAX API %s %s → %s: %s",
                resp.request.method,
                resp.request.url.path,
                resp.status_code,
                resp.text,
            )  # отдаем ошибку в логи в формате метод путь -> статус текст
        resp.raise_for_status()

    async def get_updates(
        self, marker: int | None = None, timeout: int = 30, limit: int = 100
    ) -> dict[str, Any]:
        """Получение обновлений long-polling."""

        params: dict[str, Any] = {"timeout": timeout, "limit": limit}
        if marker is not None:
            params["marker"] = marker
        resp = await self._client.get("/updates", params=params)
        self._check(resp)
        return resp.json()

    async def send_message(
        self,
        user_id: int,
        text: str,
        *,
        attachments: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Отправка сообщения"""

        body: dict[str, Any] = {"text": text}
        if attachments:
            body["attachments"] = attachments
        resp = await self._client.post(
            "/messages", params={"user_id": user_id}, json=body
        )
        self._check(resp)
        return resp.json()

    async def answer_callback(
        self,
        callback_id: str,
        *,
        notification: str | None = None,
        message: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Ответ на нажатие callback-кнопки: всплывашка и/или замена сообщения."""

        body: dict[str, Any] = {}
        if notification:
            body["notification"] = notification
        if message:
            body["message"] = message
        resp = await self._client.post(
            "/answers", params={"callback_id": callback_id}, json=body
        )
        self._check(resp)
        return resp.json()

    async def upload_file(self, filename: str, content: bytes, mime: str) -> str:
        """Загружает файл в MAX и возвращает token для вложения type=file.

        Шаг 1: POST /uploads?type=file → url (+ token у некоторых версий API).
        Шаг 2: multipart на url → token, если его не было в шаге 1.
        """
        resp = await self._client.post("/uploads", params={"type": "file"})
        self._check(resp)
        endpoint = resp.json()
        token = endpoint.get("token")

        upload = await self._client.post(
            endpoint["url"],
            files={"data": (filename, content, mime)},
        )
        self._check(upload)
        if not token:
            try:
                token = upload.json().get("token")
            except ValueError:
                token = None
        if not token:
            raise RuntimeError("MAX не вернул token загруженного файла")
        return token

    async def send_file(
        self,
        user_id: int,
        text: str,
        *,
        filename: str,
        content: bytes,
        mime: str,
        attachments: list[dict[str, Any]] | None = None,
        retries: int = 5,
    ) -> dict[str, Any]:
        """Отправка файла сообщением. Файл обрабатывается на стороне MAX не сразу,
        поэтому при ошибке attachment.not.ready повторяем с паузой."""

        token = await self.upload_file(filename, content, mime)
        body_attachments = [{"type": "file", "payload": {"token": token}}]
        body_attachments += attachments or []
        for attempt in range(retries):
            try:
                return await self.send_message(
                    user_id, text, attachments=body_attachments
                )
            except httpx.HTTPStatusError as e:
                not_ready = "not.ready" in e.response.text or "not_ready" in e.response.text
                if not not_ready or attempt == retries - 1:
                    raise
                await asyncio.sleep(RETRY_DELAY * (1 + attempt))
        raise RuntimeError("unreachable")

    async def subscribe_webhook(
        self,
        url: str,
        secret: str,
        update_types: list[str] | None = None,
    ) -> dict[str, Any]:
        """Подписка на вебхук"""

        body: dict[str, Any] = {"url": url}
        if secret:
            body["secret"] = secret
        if update_types:
            body["update_types"] = update_types
        resp = await self._client.post("/subscriptions", json=body)
        self._check(resp)
        return resp.json()

    async def unsubscribe_webhook(self, url: str) -> dict[str, Any]:
        """Отписка от вебхука"""
        resp = await self._client.delete("/subscriptions", params={"url": url})
        self._check(resp)
        return resp.json()

    async def get_subscriptions(self) -> dict[str, Any]:
        """Получение списка подписок"""

        resp = await self._client.get("/subscriptions")
        self._check(resp)
        return resp.json()


def open_app_button(text: str, start_param: str | None = None) -> dict[str, Any]:
    """Кнопка open_app: открывает мини-приложение (WebApp) внутри MAX.

    start_param приходит во фронт как initDataUnsafe.start_param.
    """
    button: dict[str, Any] = {
        "type": "open_app",
        "text": text,
        "web_app": settings.bot_settings.max_bot_username,
    }
    if start_param:
        button["payload"] = start_param
    return button


def callback_button(text: str, payload: str) -> dict[str, Any]:
    """Кнопка callback: нажатие приходит боту апдейтом message_callback."""
    return {"type": "callback", "text": text, "payload": payload}


def keyboard(*rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Inline-клавиатура: каждый аргумент — ряд кнопок."""
    return [{"type": "inline_keyboard", "payload": {"buttons": [list(r) for r in rows]}}]


def link_keyboard(
    button_text: str, start_param: str | None = None
) -> list[dict[str, Any]]:
    """Одна кнопка open_app."""
    return keyboard([open_app_button(button_text, start_param)])
