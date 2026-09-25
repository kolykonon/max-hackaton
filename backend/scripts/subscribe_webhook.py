"""Одноразовый скрипт: подписать бота на вебхук.
Запускать после деплоя, когда MAX_WEBHOOK_URL доступен извне.
"""
import asyncio
import logging

from app.core.config import get_settings
from app.integrations.max_api import MaxBotClient

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)
settings = get_settings()


async def main() -> None:
    if not settings.max_webhook_url:
        log.error("MAX_WEBHOOK_URL не задан")
        return

    client = MaxBotClient()
    try:
        # Сначала отпишемся от старых подписок (если есть)
        try:
            await client.unsubscribe_webhook(settings.max_webhook_url)
            log.info("Старая подписка удалена (если была)")
        except Exception:
            log.info("Старых подписок не было")

        # update_types не указываем — подписываемся на все события,
        # чтобы не потерять нужные. MAX при отсутствии поля шлёт всё.
        result = await client.subscribe_webhook(
            url=settings.max_webhook_url,
            secret=settings.max_webhook_secret,
        )
        log.info("Подписка создана: %s", result)

        subs = await client.get_subscriptions()
        log.info("Активные подписки: %s", subs)
    finally:
        await client.aclose()


if __name__ == "__main__":
    asyncio.run(main())