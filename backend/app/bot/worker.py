import asyncio
import logging
from pathlib import Path

import httpx
import uvicorn

from app.bot.handlers import handle_update
from app.core.config import settings
from app.integrations.max_api import MaxBotClient

log = logging.getLogger(__name__)
HEARTBEAT = Path("/tmp/bot-heartbeat")
TOKEN_ERROR = (
    "MAX API отклонил токен. Укажите действующий MAX_BOT_TOKEN в .env "
    "и выполните docker compose up -d --force-recreate backend bot."
)


async def poll_loop(client: MaxBotClient) -> None:
    """Long polling для локальной проверки; сценарии обрабатывает handle_update."""
    marker: int | None = None
    while True:
        try:
            data = await client.get_updates(marker=marker, timeout=30, limit=100)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (401, 403):
                raise
            log.warning("MAX API: HTTP %s; повтор через 5 секунд", exc.response.status_code)
            await asyncio.sleep(5)
            continue
        except httpx.RequestError:
            log.warning("Нет соединения с MAX API; проверьте сеть и сертификаты. Повтор через 5 секунд")
            await asyncio.sleep(5)
            continue

        HEARTBEAT.touch()
        for update in data.get("updates") or []:
            try:
                await handle_update(client, update)
            except Exception:
                log.exception("Ошибка обработки update_type=%s", update.get("update_type"))

        # MAX возвращает курсор на уровне ответа, а не отдельного события.
        if data.get("marker") is not None:
            marker = data["marker"]


async def run_polling() -> int:
    HEARTBEAT.unlink(missing_ok=True)
    if not settings.bot_settings.max_bot_token.strip():
        log.error("Не задан MAX_BOT_TOKEN. Скопируйте .env.example в .env, впишите токен своего бота MAX и запустите docker compose up -d --force-recreate backend bot.")
        return 1

    client = MaxBotClient()
    try:
        username = await client.configure_username()
        log.info("Бот запущен в режиме long polling: https://max.ru/%s", username)
        HEARTBEAT.touch()
        await poll_loop(client)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (401, 403):
            log.error(TOKEN_ERROR)
        else:
            log.error("MAX API вернул HTTP %s. Проверьте доступность MAX и MAX_API_BASE_URL; Docker повторит запуск.", exc.response.status_code)
        return 1
    except (httpx.RequestError, ValueError):
        log.error("Не удалось подключиться к MAX API. Проверьте сеть, MAX_API_BASE_URL и SSL_CERTS_DIR; Docker повторит запуск.")
        return 1
    finally:
        HEARTBEAT.unlink(missing_ok=True)
        await client.aclose()
    return 0


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    # httpx пишет полный URL; он может содержать чувствительные query-параметры.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    mode = settings.bot_settings.max_mode
    if mode == "polling":
        raise SystemExit(asyncio.run(run_polling()))
    if mode == "webhook":
        if not settings.bot_settings.max_bot_token.strip():
            log.error("Не задан MAX_BOT_TOKEN: впишите токен своего бота в .env.")
            raise SystemExit(1)
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_level="info")
        return
    log.error("Неизвестный MAX_MODE. Укажите polling (локально) или webhook.")
    raise SystemExit(1)


if __name__ == "__main__":
    main()
