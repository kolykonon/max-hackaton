"""Одноразовый скрипт: подписать бота на вебхук.
Запускать после деплоя, когда MAX_WEBHOOK_URL доступен извне.
"""
import asyncio
import logging

from app.core.config import settings
from app.integrations.max_api import MaxBotClient

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


async def main() -> None:
    if not settings.bot_settings.max_webhook_url:
        log.error("MAX_WEBHOOK_URL не задан")
        return

    client = MaxBotClient()
    try:
        try:
            await client.unsubscribe_webhook(settings.bot_settings.max_webhook_url)
            log.info("Старая подписка удалена (если была)")
        except Exception:
            log.info("Старых подписок не было")

        result = await client.subscribe_webhook(
            url=settings.bot_settings.max_webhook_url,
            secret=settings.bot_settings.max_webhook_secret,
        )
        log.info("Подписка создана: %s", result)

        subs = await client.get_subscriptions()
        log.info("Активные подписки: %s", subs)
    finally:
        await client.aclose()


if __name__ == "__main__":
    asyncio.run(main())