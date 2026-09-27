import asyncio
import logging

import uvicorn

from app.bot.handlers import handle_update
from app.core.config import settings
from app.integrations.max_api import MaxBotClient

log = logging.getLogger(__name__)


async def poll_loop(client: MaxBotClient) -> None:
    """Пока на задеплоим на HTTPS - в лонг полинге"""
    marker: int | None = None
    while True:
        try:
            data = await client.get_updates(
                marker=marker, timeout=30, limit=100
            )  # получаем обновления
        except Exception:
            log.exception("Ошибка long polling, повтор через 5 сек")
            await asyncio.sleep(5)
            continue

        updates = data.get("updates") or []
        for update in updates:
            try:
                await handle_update(client, update)  # обработка обновления
            except Exception:
                log.exception("Ошибка обработки update: %s", update)

        if updates:
            marker = updates[-1].get("marker") or marker  # обновляем маркер


async def run_polling() -> None:
    """Запуск long polling для получения обновлений от бота."""

    if not settings.bot_settings.max_bot_token:
        log.error("Не задан токен для бота")
        return
    client = MaxBotClient()
    log.info("Бот запущен в режиме long-polling на %s", client.base_url)
    try:
        await poll_loop(client)
    finally:
        await client.aclose()


def run_webhook() -> None:
    """Запуск webhook-сервера после деплоя."""

    log.info("Запуск webhook-сервера на 0.0.0.0:8000")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
    )


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    if settings.bot_settings.max_mode == "polling":
        asyncio.run(run_polling())
    else:
        run_webhook()


if __name__ == "__main__":
    main()
