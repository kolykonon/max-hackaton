import logging
from enum import StrEnum

from app.bot import texts
from app.integrations.max_api import MaxBotClient, link_keyboard

log = logging.getLogger(__name__)


class UpdateType(StrEnum):
    """Енум для обработки типов обновлений"""

    BOT_STARTED = "bot_started"
    MESSAGE_CREATED = "message_created"
    MESSAGE_CALLBACK = "message_callback"


async def handle_update(client: MaxBotClient, update: dict) -> None:
    """Главная функция обработки обновления"""

    update_type = update.get("update_type")

    match update_type:  # можно было ифом, но матчем прикольнее
        case UpdateType.BOT_STARTED:
            user_id = _user_id(update)
            if user_id is not None:
                await _send_start(client, user_id)
            return

        case UpdateType.MESSAGE_CREATED:
            message = update.get("message", {})
            sender = message.get("sender", {})
            user_id = sender.get("user_id")
            if user_id is None:
                return

            text = (message.get("body") or {}).get("text", "").strip()
            if text.startswith("/start"):
                await _send_start(client, user_id)
            else:
                await _send_fallback(client, user_id)
            return

        case UpdateType.MESSAGE_CALLBACK:
            # импорт здесь: callbacks тянет сервисы, а сервисы импортируют handlers
            from app.bot.callbacks import handle_callback

            await handle_callback(client, update)
            return


def _user_id(update: dict) -> int | None:
    if isinstance(update.get("user"), dict):
        return update["user"].get("user_id")
    message = update.get("message", {})
    return (message.get("sender") or {}).get("user_id")


async def _send_start(client: MaxBotClient, user_id: int) -> None:
    try:
        await client.send_message(
            user_id,
            texts.START_MESSAGE,
            attachments=link_keyboard(texts.START_BUTTON),
        )
    except Exception:
        log.exception("Не удалось отправить приветствие user_id=%s", user_id)


async def _send_fallback(client: MaxBotClient, user_id: int) -> None:
    try:
        await client.send_message(
            user_id,
            texts.FALLBACK_MESSAGE,
            attachments=link_keyboard(texts.START_BUTTON),
        )
    except Exception:
        log.exception("Не удалось отправить заглушку user_id=%s", user_id)


async def send_appointment_confirmed(client: MaxBotClient, max_user_id: int) -> None:
    """Подтверждение записи — вызывается из POST /appointments."""
    try:
        await client.send_message(
            max_user_id,
            texts.CONFIRMED_MESSAGE,
            attachments=link_keyboard(
                texts.CONFIRMED_BUTTON, start_param="appointment"
            ),
        )
    except Exception:
        log.exception("Не удалось отправить подтверждение user_id=%s", max_user_id)


async def send_reminder_2d(client: MaxBotClient, max_user_id: int) -> None:
    try:
        await client.send_message(
            max_user_id,
            texts.REMINDER_2D_MESSAGE,
            attachments=link_keyboard(
                texts.REMINDER_2D_BUTTON, start_param="appointment"
            ),
        )
        log.info("Напоминание за 2 дня отправлено user_id=%s", max_user_id)
    except Exception:
        log.exception(
            "Не удалось отправить напоминание за 2 дня user_id=%s", max_user_id
        )


async def send_reminder_1d(client: MaxBotClient, max_user_id: int) -> None:
    try:
        await client.send_message(
            max_user_id,
            texts.REMINDER_1D_MESSAGE,
            attachments=link_keyboard(
                texts.REMINDER_1D_BUTTON, start_param="appointment"
            ),
        )
        log.info("Напоминание за 1 день отправлено user_id=%s", max_user_id)
    except Exception:
        log.exception(
            "Не удалось отправить напоминание за 1 день user_id=%s", max_user_id
        )


async def send_reminder_morning(client: MaxBotClient, max_user_id: int) -> None:
    try:
        await client.send_message(
            max_user_id,
            texts.REMINDER_MORNING_MESSAGE,
            attachments=link_keyboard(
                texts.REMINDER_MORNING_BUTTON, start_param="appointment"
            ),
        )
        log.info("Утреннее напоминание отправлено user_id=%s", max_user_id)
    except Exception:
        log.exception(
            "Не удалось отправить утреннее напоминание user_id=%s", max_user_id
        )
