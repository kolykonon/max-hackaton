import logging

from app.bot import texts
from app.integrations.max_api import MaxBotClient, open_app_keyboard

log = logging.getLogger(__name__)


async def handle_update(client: MaxBotClient, update: dict) -> None:
    update_type = update.get("update_type")

    if update_type == "bot_started":
        user_id = _user_id(update)
        if user_id is not None:
            await _send_start(client, user_id)
        return

    if update_type == "message_created":
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
            attachments=open_app_keyboard(texts.START_BUTTON),
        )
    except Exception:
        log.exception("Не удалось отправить приветствие user_id=%s", user_id)


async def _send_fallback(client: MaxBotClient, user_id: int) -> None:
    try:
        await client.send_message(
            user_id,
            texts.FALLBACK_MESSAGE,
            attachments=open_app_keyboard(texts.START_BUTTON),
        )
    except Exception:
        log.exception("Не удалось отправить заглушку user_id=%s", user_id)


async def send_appointment_confirmed(client: MaxBotClient, max_user_id: int) -> None:
    """Вызывается после создания/переноса записи через BackgroundTasks."""
    try:
        await client.send_message(
            max_user_id,
            texts.CONFIRMED_MESSAGE,
            attachments=open_app_keyboard(texts.CONFIRMED_BUTTON, start_param="appointment"),
        )
    except Exception:
        # По ТЗ: запись всё равно создаётся, ошибку пишем в лог
        log.exception("Не удалось отправить подтверждение user_id=%s", max_user_id)


async def send_reminder(client: MaxBotClient, max_user_id: int) -> None:
    try:
        await client.send_message(
            max_user_id,
            texts.REMINDER_MESSAGE,
            attachments=open_app_keyboard(texts.REMINDER_BUTTON, start_param="appointment"),
        )
    except Exception:
        log.exception("Не удалось отправить напоминание user_id=%s", max_user_id)