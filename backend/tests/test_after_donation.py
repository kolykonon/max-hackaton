"""После донации: засчитать, заявление PDF/DOCX, день отдыха, кнопки бота."""

import datetime as dt
import io
import zipfile

import pytest
from docx import Document as DocxDocument

from app.bot.callbacks import handle_callback
from app.core.errors import AppError
from app.core.utils.dates import today_msk
from app.models import Appointment, Donation
from app.models.enums import AppointmentStatus
from app.services import after_donation
from app.services.appointments import AppointmentService
from app.services.leave_application import DocFormat, EmployerFields


async def _appointment(session, user, slot) -> Appointment:
    _, orm, _ = await AppointmentService(session).create(user, slot.id)
    return orm


def _cb(user, payload: str) -> dict:
    return {
        "update_type": "message_callback",
        "callback": {
            "callback_id": "cb1",
            "payload": payload,
            "user": {"user_id": user.max_user_id},
        },
    }


@pytest.mark.asyncio
async def test_register_donation_is_idempotent(session, user, slot_free):
    appointment = await _appointment(session, user, slot_free)
    donation = await after_donation.register_donation(session, appointment, today_msk())
    again = await after_donation.register_donation(session, appointment)

    assert again.id == donation.id
    assert appointment.status == AppointmentStatus.COMPLETED
    assert donation.appointment_id == appointment.id
    assert donation.is_demo is False


def test_rest_day_deadline_is_one_year():
    assert after_donation.rest_day_deadline(dt.date(2026, 9, 28)) == dt.date(
        2027, 9, 28
    )
    assert after_donation.rest_day_deadline(dt.date(2028, 2, 29)) == dt.date(
        2029, 2, 28
    )


@pytest.mark.asyncio
async def test_application_pdf_and_docx(session, user, slot_free):
    appointment = await _appointment(session, user, slot_free)
    donation = await after_donation.register_donation(
        session, appointment, dt.date(2026, 9, 28)
    )
    fields = EmployerFields(
        employer_name="ООО «Ромашка»",
        head_position="Генеральному директору",
        rest_date=dt.date(2026, 10, 5),
    )

    pdf, name, mime = await after_donation.make_application(
        session, user, donation, fields, DocFormat.PDF
    )
    assert pdf.startswith(b"%PDF")
    assert name.endswith("2026-09-28.pdf") and mime == "application/pdf"

    docx, name, _ = await after_donation.make_application(
        session, user, donation, fields, DocFormat.DOCX
    )
    assert zipfile.is_zipfile(io.BytesIO(docx)) and name.endswith(".docx")
    text = "\n".join(p.text for p in DocxDocument(io.BytesIO(docx)).paragraphs)
    assert "Иванов Иван Иванович" in text
    assert "ООО «Ромашка»" in text
    assert "статьи 186" in text
    assert "«05» октября 2026 г." in text
    assert "«28» сентября 2026 г." in text


@pytest.mark.asyncio
async def test_application_rejects_rest_date_out_of_year(session, user, slot_free):
    appointment = await _appointment(session, user, slot_free)
    donation = await after_donation.register_donation(
        session, appointment, dt.date(2026, 9, 28)
    )
    for bad in (dt.date(2026, 9, 28), dt.date(2027, 9, 29)):
        with pytest.raises(AppError) as exc:
            await after_donation.make_application(
                session, user, donation, EmployerFields(rest_date=bad), DocFormat.PDF
            )
        assert exc.value.status_code == 422
    # к отпуску — дата не важна
    await after_donation.make_application(
        session,
        user,
        donation,
        EmployerFields(rest_date=dt.date(2030, 1, 1), attach_to_vacation=True),
        DocFormat.PDF,
    )


@pytest.mark.asyncio
async def test_callback_yes_registers_and_replies(
    session, session_factory, bot, user, slot_free
):
    appointment = await _appointment(session, user, slot_free)
    await handle_callback(bot, _cb(user, f"don:{appointment.id}:y"), session_factory)

    assert appointment.status == AppointmentStatus.COMPLETED
    answer = bot.answers[-1]
    assert "186" in answer["message"]["text"]
    assert "402/у" in answer["message"]["text"]
    # повторное нажатие не создаёт вторую донацию
    await handle_callback(bot, _cb(user, f"don:{appointment.id}:y"), session_factory)
    assert bot.answers[-1]["notification"]


@pytest.mark.asyncio
async def test_callback_no_cancels(session, session_factory, bot, user, slot_free):
    appointment = await _appointment(session, user, slot_free)
    await handle_callback(bot, _cb(user, f"don:{appointment.id}:n"), session_factory)
    assert appointment.status == AppointmentStatus.CANCELLED


@pytest.mark.asyncio
async def test_callback_application_and_rest_used(
    session, session_factory, bot, user, slot_free
):
    appointment = await _appointment(session, user, slot_free)
    donation = await after_donation.register_donation(session, appointment, today_msk())

    await handle_callback(bot, _cb(user, f"app:{donation.id}:docx"), session_factory)
    assert bot.files[-1]["filename"].endswith(".docx")
    assert bot.files[-1]["user_id"] == user.max_user_id

    await handle_callback(bot, _cb(user, f"rest:{donation.id}"), session_factory)
    assert donation.rest_day_used_at is not None
    assert after_donation.to_schema(donation).rest_day.used is True


@pytest.mark.asyncio
async def test_callback_ignores_foreign_donation(
    session, session_factory, bot, user, user2, slot_free
):
    appointment = await _appointment(session, user, slot_free)
    donation = await after_donation.register_donation(session, appointment, today_msk())
    await handle_callback(bot, _cb(user2, f"rest:{donation.id}"), session_factory)
    assert donation.rest_day_used_at is None


@pytest.mark.asyncio
async def test_latest_rest_day_donation_skips_demo(session, user):
    session.add(
        Donation(
            user_id=user.id,
            donation_type="whole_blood",
            donated_on=today_msk(),
            is_demo=True,
        )
    )
    await session.flush()
    assert await after_donation.latest_rest_day_donation(session, user) is None
