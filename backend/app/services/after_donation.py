"""После донации: засчитать донацию, документы, доп. день отдыха (ст. 186 ТК РФ).

ст. 186 ТК РФ, ч. 4: «После каждого дня сдачи крови и ее компонентов работнику
предоставляется дополнительный день отдыха. Указанный день отдыха по желанию
работника может быть присоединен к ежегодному оплачиваемому отпуску или
использован в другое время в течение года после дня сдачи крови».
"""

import datetime as dt
import logging
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.utils.dates import add_months, now_msk, today_msk
from app.models import Appointment, Center, Donation, PersonalData, Region, User
from app.models.enums import AppointmentStatus
from app.schemas.after_donation import AfterDonation as AfterDonationSchema
from app.schemas.after_donation import RestDay
from app.schemas.common import ErrorCode
from app.services.leave_application import (
    MIME,
    DocFormat,
    EmployerFields,
    build_application,
    filename,
    render,
)

log = logging.getLogger(__name__)

# Что взять в центре крови. Формы — приказ Минздрава СССР от 07.08.1985 № 1055
DOCUMENTS: list[str] = [
    (
        "Справку о донации (форма № 402/у) — для отдела кадров: по ней оплачивают "
        "день донации и дают дополнительный день отдыха"
    ),
    (
        "Справку о медосмотре (форма № 401/у), если медосмотр был в другой день — "
        "в день медосмотра работник тоже освобождается от работы"
    ),
]

REST_DAY_REMINDERS: list[tuple[str, int | None, int | None]] = [
    # (kind, дней после донации, дней до конца срока)
    ("rest_day_14", 14, None),
    ("rest_day_30", None, 30),
    ("rest_day_7", None, 7),
]


def rest_day_deadline(donated_on: dt.date) -> dt.date:
    """Последний день, когда можно использовать доп. день отдыха (в течение года)."""
    return add_months(donated_on, 12)


def reminder_due_date(
    donated_on: dt.date, after: int | None, before: int | None
) -> dt.date:
    if after is not None:
        return donated_on + dt.timedelta(days=after)
    assert before is not None
    return rest_day_deadline(donated_on) - dt.timedelta(days=before)


async def _center_local_date(
    session: AsyncSession, appointment: Appointment
) -> dt.date:
    center = await session.get(Center, appointment.center_id)
    region = await session.get(Region, center.region_id) if center else None
    tz = ZoneInfo(region.timezone if region else "Europe/Moscow")
    return appointment.starts_at.astimezone(tz).date()


async def register_donation(
    session: AsyncSession, appointment: Appointment, donated_on: dt.date | None = None
) -> Donation:
    """Засчитывает донацию по записи. Повторный вызов вернёт ту же донацию."""
    existing = await session.scalar(
        select(Donation).where(Donation.appointment_id == appointment.id)
    )
    if existing is not None:
        return existing
    if appointment.status != AppointmentStatus.ACTIVE:
        raise AppError(409, ErrorCode.APPOINTMENT_NOT_ACTIVE, "Запись не активна")

    center_name = await session.scalar(
        select(Center.name).where(Center.id == appointment.center_id)
    )
    if donated_on is None:
        donated_on = min(await _center_local_date(session, appointment), today_msk())
    appointment.status = AppointmentStatus.COMPLETED
    donation = Donation(
        user_id=appointment.user_id,
        donation_type=appointment.donation_type,
        donated_on=donated_on,
        center_name=center_name,
        appointment_id=appointment.id,
    )
    session.add(donation)
    await session.commit()
    log.info("Засчитана донация id=%s appointment_id=%s", donation.id, appointment.id)
    return donation


async def decline_donation(session: AsyncSession, appointment: Appointment) -> None:
    """Донор ответил «не получилось» — отменяем запись, чтобы можно было записаться снова."""
    if appointment.status != AppointmentStatus.ACTIVE:
        return
    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancelled_at = now_msk()
    await session.commit()


async def get_user_donation(
    session: AsyncSession, user: User, donation_id: int
) -> Donation:
    donation = await session.get(Donation, donation_id)
    if donation is None or donation.user_id != user.id:
        raise AppError(404, ErrorCode.DONATION_NOT_FOUND, "Донация не найдена")
    return donation


async def latest_rest_day_donation(
    session: AsyncSession, user: User
) -> Donation | None:
    """Последняя настоящая (не демо) донация, по которой ещё идёт год на день отдыха."""
    since = add_months(today_msk(), -12)
    return await session.scalar(
        select(Donation)
        .where(
            Donation.user_id == user.id,
            Donation.is_demo.is_(False),
            Donation.donated_on >= since,
        )
        .order_by(Donation.donated_on.desc(), Donation.id.desc())
        .limit(1)
    )


async def set_rest_day_used(
    session: AsyncSession, donation: Donation, used: bool
) -> None:
    donation.rest_day_used_at = (
        (donation.rest_day_used_at or now_msk()) if used else None
    )
    await session.commit()


async def make_application(
    session: AsyncSession,
    user: User,
    donation: Donation,
    fields: EmployerFields,
    fmt: DocFormat,
) -> tuple[bytes, str, str]:
    """Собирает заявление: (содержимое, имя файла, mime)."""
    if fields.rest_date is not None and not fields.attach_to_vacation:
        deadline = rest_day_deadline(donation.donated_on)
        if not (donation.donated_on < fields.rest_date <= deadline):
            raise AppError(
                422,
                ErrorCode.VALIDATION_ERROR,
                "Проверьте дату дня отдыха",
                fields={
                    "rest_date": (
                        "День отдыха — после дня донации и не позже "
                        f"{deadline.strftime('%d.%m.%Y')}"
                    )
                },
            )
    pd = await session.get(PersonalData, user.id)
    app = build_application(user, pd, donation, fields)
    return render(app, fmt), filename(donation, fmt), MIME[fmt]


def to_schema(donation: Donation) -> AfterDonationSchema:
    today = today_msk()
    deadline = rest_day_deadline(donation.donated_on)
    return AfterDonationSchema(
        donation_id=donation.id,
        donation_type=donation.donation_type,
        donated_on=donation.donated_on,
        center_name=donation.center_name,
        documents=DOCUMENTS,
        rest_day=RestDay(
            deadline=deadline,
            days_left=(deadline - today).days,
            used=donation.rest_day_used_at is not None,
            used_at=donation.rest_day_used_at,
        ),
    )
