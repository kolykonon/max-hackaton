"""Проактивные сообщения бота: пуши, вопрос «сдали?», после донации, группы.

Все функции возвращают True, если сообщение ушло, и не бросают исключений.
"""

import logging
from collections.abc import Awaitable

from app.bot import texts
from app.integrations.max_api import (
    MaxBotClient,
    callback_button,
    keyboard,
    link_keyboard,
    open_app_button,
)

log = logging.getLogger(__name__)

# payload callback-кнопок: "<действие>:<id>[:<аргумент>]"
CB_DONATED = "don"  # don:<appointment_id>:y|n
CB_APPLICATION = "app"  # app:<donation_id>:pdf|docx
CB_REST_USED = "rest"  # rest:<donation_id>

# start_param для кнопок open_app — обрабатывает фронт
START_BOOK = texts.BOOK_START_PARAM


def start_rest(donation_id: int) -> str:
    return f"rest_{donation_id}"


def start_group(code: str) -> str:
    return f"grp_{code}"


async def _safe(what: str, max_user_id: int, coro: Awaitable) -> bool:
    try:
        await coro
        log.info("%s отправлено user_id=%s", what, max_user_id)
        return True
    except Exception:
        log.exception("Не удалось отправить %s user_id=%s", what, max_user_id)
        return False


def after_donation_keyboard(donation_id: int) -> list[dict]:
    return keyboard(
        [
            callback_button(
                texts.APPLICATION_PDF_BUTTON, f"{CB_APPLICATION}:{donation_id}:pdf"
            ),
            callback_button(
                texts.APPLICATION_DOCX_BUTTON, f"{CB_APPLICATION}:{donation_id}:docx"
            ),
        ],
        [open_app_button(texts.APPLICATION_FILL_BUTTON, start_rest(donation_id))],
        [callback_button(texts.REST_USED_BUTTON, f"{CB_REST_USED}:{donation_id}")],
    )


async def send_interval_open(
    client: MaxBotClient, max_user_id: int, types: list[str]
) -> bool:
    return await _safe(
        "Пуш «интервал прошёл»",
        max_user_id,
        client.send_message(
            max_user_id,
            texts.interval_open_message(types),
            attachments=link_keyboard(texts.BOOK_BUTTON, START_BOOK),
        ),
    )


async def send_deficit(
    client: MaxBotClient, max_user_id: int, region_name: str, blood_group: str
) -> bool:
    return await _safe(
        "Пуш «не хватает группы»",
        max_user_id,
        client.send_message(
            max_user_id,
            texts.deficit_message(region_name, blood_group),
            attachments=link_keyboard(texts.BOOK_BUTTON, START_BOOK),
        ),
    )


async def send_donation_question(
    client: MaxBotClient, max_user_id: int, appointment_id: int
) -> bool:
    return await _safe(
        "Вопрос «сдали кровь?»",
        max_user_id,
        client.send_message(
            max_user_id,
            texts.ASK_DONATED_MESSAGE,
            attachments=keyboard(
                [
                    callback_button(
                        texts.ASK_DONATED_YES, f"{CB_DONATED}:{appointment_id}:y"
                    ),
                    callback_button(
                        texts.ASK_DONATED_NO, f"{CB_DONATED}:{appointment_id}:n"
                    ),
                ]
            ),
        ),
    )


async def send_after_donation(
    client: MaxBotClient,
    max_user_id: int,
    donation_id: int,
    documents: list[str],
    deadline: str,
) -> bool:
    return await _safe(
        "Сообщение после донации",
        max_user_id,
        client.send_message(
            max_user_id,
            texts.after_donation_message(documents, deadline),
            attachments=after_donation_keyboard(donation_id),
        ),
    )


async def send_application_file(
    client: MaxBotClient,
    max_user_id: int,
    content: bytes,
    filename: str,
    mime: str,
) -> bool:
    return await _safe(
        "Заявление на день отдыха",
        max_user_id,
        client.send_file(
            max_user_id,
            texts.APPLICATION_CAPTION,
            filename=filename,
            content=content,
            mime=mime,
        ),
    )


async def send_rest_day_reminder(
    client: MaxBotClient,
    max_user_id: int,
    donation_id: int,
    donated_on: str,
    deadline: str,
    days_left: int | None,
) -> bool:
    return await _safe(
        "Напоминание о дне отдыха",
        max_user_id,
        client.send_message(
            max_user_id,
            texts.rest_day_reminder_message(donated_on, deadline, days_left),
            attachments=after_donation_keyboard(donation_id),
        ),
    )


async def send_group_booked(
    client: MaxBotClient,
    max_user_id: int,
    code: str,
    name: str,
    center: str,
    date: str,
    time: str,
    booked: int,
    count: int,
) -> bool:
    return await _safe(
        "Уведомление о записи участника группы",
        max_user_id,
        client.send_message(
            max_user_id,
            texts.group_booked_message(name, center, date, time, booked, count),
            attachments=link_keyboard(texts.GROUP_OPEN_BUTTON, start_group(code)),
        ),
    )
