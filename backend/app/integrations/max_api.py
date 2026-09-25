import logging
import ssl
from functools import lru_cache
from typing import Any

import httpx

from app.core.config import get_settings

log = logging.getLogger(__name__)
settings = get_settings()


@lru_cache(maxsize=1)
def _build_ssl_context() -> ssl.SSLContext:
    """Контекст с сертификатами НУЦ Минцифры (для MAX API).

    Пути берутся из SSL_CERT_FILES в .env (через запятую).
    Если пусто — используется стандартный certifi.
    """
    ctx = ssl.create_default_context()
    for path in settings.ssl_cert_files_list:
        try:
            ctx.load_verify_locations(path)
            log.info("SSL: загружен сертификат %s", path)
        except Exception:
            log.exception("SSL: не удалось загрузить сертификат %s", path)
    return ctx


class MaxBotClient:
    """Клиент MAX Bot API. https://dev.max.ru/docs-api"""

    def __init__(self, token: str | None = None, base_url: str | None = None) -> None:
        self.token = token or settings.max_bot_token
        self.base_url = (base_url or settings.max_api_base_url).rstrip("/")
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={"Authorization": self.token},
            timeout=httpx.Timeout(60.0, connect=10.0),
            verify=_build_ssl_context(),
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    # --- Внутренний хелпер ---

    @staticmethod
    def _check(resp: httpx.Response) -> None:
        if resp.status_code >= 400:
            log.error(
                "MAX API %s %s → %s: %s",
                resp.request.method,
                resp.request.url.path,
                resp.status_code,
                resp.text,
            )
        resp.raise_for_status()

    # --- Получение обновлений (Long Polling) ---

    async def get_updates(
        self, marker: int | None = None, timeout: int = 30, limit: int = 100
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"timeout": timeout, "limit": limit}
        if marker is not None:
            params["marker"] = marker
        resp = await self._client.get("/updates", params=params)
        self._check(resp)
        return resp.json()

    # --- Отправка сообщений ---

    async def send_message(
        self,
        user_id: int,
        text: str,
        *,
        attachments: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {"text": text}
        if attachments:
            body["attachments"] = attachments
        resp = await self._client.post(
            "/messages", params={"user_id": user_id}, json=body
        )
        self._check(resp)
        return resp.json()

    # --- Подписки на вебхуки ---

    async def subscribe_webhook(
        self,
        url: str,
        secret: str,
        update_types: list[str] | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {"url": url}
        if secret:
            body["secret"] = secret
        if update_types:
            body["update_types"] = update_types
        resp = await self._client.post("/subscriptions", json=body)
        self._check(resp)
        return resp.json()

    async def unsubscribe_webhook(self, url: str) -> dict[str, Any]:
        resp = await self._client.delete("/subscriptions", params={"url": url})
        self._check(resp)
        return resp.json()

    async def get_subscriptions(self) -> dict[str, Any]:
        resp = await self._client.get("/subscriptions")
        self._check(resp)
        return resp.json()


def open_app_keyboard(
    button_text: str, start_param: str | None = None
) -> list[dict[str, Any]]:
    url = settings.webapp_url
    if start_param:
        url = f"{url}?startapp={start_param}"
    return [
        {
            "type": "inline_keyboard",
            "payload": {
                "buttons": [
                    [
                        {
                            "type": "open_app",
                            "text": button_text,
                            "web_app": url,
                        }
                    ]
                ]
            },
        }
    ]