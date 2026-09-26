import logging
import ssl
from functools import lru_cache
from typing import Any

import httpx

from app.core.config import settings

log = logging.getLogger(__name__)

CERT_SUFFIXES = {".cer", ".crt", ".pem"}


@lru_cache(maxsize=1)
def _build_ssl_context() -> ssl.SSLContext:
    """Контекст с сертификатами НУЦ Минцифры (для MAX API).

    Грузит все сертификаты из папки SSL_CERTS_DIR (по умолчанию certs/ в корне
    репозитория). Если папки нет — только системные сертификаты.
    """
    ctx = ssl.create_default_context()
    certs_dir = settings.bot_settings.ssl_certs_dir
    if not certs_dir.is_dir():
        log.warning("SSL: папка с сертификатами %s не найдена", certs_dir)
        return ctx

    for path in sorted(certs_dir.iterdir()):
        if path.suffix.lower() not in CERT_SUFFIXES:
            continue
        try:
            ctx.load_verify_locations(path)
            log.info("SSL: загружен сертификат %s", path.name)
        except Exception:
            log.exception("SSL: не удалось загрузить сертификат %s", path)
    return ctx


class MaxBotClient:
    """Клиент MAX Bot API. https://dev.max.ru/docs-api"""

    def __init__(self, token: str | None = None, base_url: str | None = None) -> None:
        self.token = token or settings.bot_settings.max_bot_token
        self.base_url = (base_url or settings.bot_settings.max_api_base_url).rstrip("/")
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={"Authorization": self.token},
            timeout=httpx.Timeout(60.0, connect=10.0),
            verify=_build_ssl_context(),
        )

    async def aclose(self) -> None:
        await self._client.aclose()

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


def link_keyboard(
    button_text: str, start_param: str | None = None
) -> list[dict[str, Any]]:
    """Кнопка-ссылка. Работает без задеплоенного мини-приложения.

    Когда появится веб-апп и он будет привязан к боту в кабинете MAX —
    можно будет вернуть open_app.
    """
    url = settings.bot_settings.webapp_url
    if start_param:
        url = f"{url}?startapp={start_param}"
    return [
        {
            "type": "inline_keyboard",
            "payload": {
                "buttons": [
                    [
                        {
                            "type": "link",
                            "text": button_text,
                            "url": url,
                        }
                    ]
                ]
            },
        }
    ]
