"""Нажатия callback-кнопок бота (update_type = message_callback)."""

import logging

from sqlalchemy import select

from app.bot import pushes, texts
from app.core.db import sessionmaker
from app.core.errors import AppError
from app.integrations.max_api import MaxBotClient, link_keyboard
from app.models import Appointment, Donation, User
from app.services.after_donation import (
    DOCUMENTS,
    decline_donation,
    make_application,
    register_donation,
    rest_day_deadline,
    set_rest_day_used,
)
from app.services.leave_application import DocFormat, EmployerFields

log = logging.getLogger(__name__)


def after_donation_body(donation: Donation) -> dict:
    """Сообщение «после донации» в формате NewMessageBody."""
    deadline = rest_day_deadline(donation.donated_on).strftime("%d.%m.%Y")
    return {
        "text": texts.after_donation_message(DOCUMENTS, deadline),
        "attachments": pushes.after_donation_keyboard(donation.id),
    }


async def handle_callback(
    client: MaxBotClient, update: dict, session_factory=sessionmaker
) -> None:
    callback = update.get("callback") or {}
    callback_id = callback.get("callback_id")
    payload = callback.get("payload") or ""
    max_user_id = (callback.get("user") or {}).get("user_id")
    if not callback_id or max_user_id is None:
        return

    action, _, rest = payload.partition(":")
    arg, _, extra = rest.partition(":")
    try:
        obj_id = int(arg)
    except ValueError:
        log.warning("Непонятный payload callback: %r", payload)
        return

    async with session_factory() as session:
        user = await session.scalar(select(User).where(User.max_user_id == max_user_id))
        if user is None:
            await client.answer_callback(callback_id, notification=texts.START_BUTTON)
            return

        match action:
            case pushes.CB_DONATED:
                appointment = await session.get(Appointment, obj_id)
                if appointment is None or appointment.user_id != user.id:
                    return
                existing = await session.scalar(
                    select(Donation).where(Donation.appointment_id == appointment.id)
                )
                if existing is not None:
                    await client.answer_callback(
                        callback_id, notification=texts.ANSWER_ALREADY
                    )
                    return
                if extra == "y":
                    try:
                        donation = await register_donation(session, appointment)
                    except AppError:
                        await client.answer_callback(
                            callback_id, notification=texts.ANSWER_ALREADY
                        )
                        return
                    await client.answer_callback(
                        callback_id,
                        notification=texts.ANSWER_THANKS,
                        message=after_donation_body(donation),
                    )
                else:
                    await decline_donation(session, appointment)
                    await client.answer_callback(
                        callback_id,
                        message={
                            "text": texts.DECLINED_MESSAGE,
                            "attachments": link_keyboard(
                                texts.BOOK_BUTTON, pushes.START_BOOK
                            ),
                        },
                    )

            case pushes.CB_APPLICATION:
                donation = await session.get(Donation, obj_id)
                if donation is None or donation.user_id != user.id:
                    return
                fmt = DocFormat.DOCX if extra == "docx" else DocFormat.PDF
                await client.answer_callback(
                    callback_id, notification=texts.APPLICATION_SENDING
                )
                content, name, mime = await make_application(
                    session, user, donation, EmployerFields(), fmt
                )
                if not await pushes.send_application_file(
                    client, max_user_id, content, name, mime
                ):
                    await client.send_message(max_user_id, texts.APPLICATION_ERROR)

            case pushes.CB_REST_USED:
                donation = await session.get(Donation, obj_id)
                if donation is None or donation.user_id != user.id:
                    return
                await set_rest_day_used(session, donation, True)
                await client.answer_callback(
                    callback_id, notification=texts.REST_USED_ANSWER
                )

            case _:
                log.warning("Неизвестное действие callback: %r", payload)
