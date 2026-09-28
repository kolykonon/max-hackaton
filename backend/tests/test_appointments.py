"""Тесты записи: 409 на двойную запись, 422 на интервал, атомарный перенос."""
from datetime import date, datetime, timedelta, timezone

import pytest

from app.core.errors import AppError
from app.models import Appointment, Donation
from app.models.enums import AppointmentStatus, DonationType
from app.schemas.common import ErrorCode
from app.services.appointments import AppointmentService


@pytest.mark.asyncio
async def test_double_booking_returns_409(session, user, user2, slot_free):
    """Первый пользователь записался, второй на тот же слот → 409 slot_taken."""
    service = AppointmentService(session)

    # Первый занял слот
    await service.create(user, slot_free.id)

    # Второй пробует тот же слот
    with pytest.raises(AppError) as exc:
        await service.create(user2, slot_free.id)

    assert exc.value.status_code == 409
    assert exc.value.code == ErrorCode.SLOT_TAKEN


@pytest.mark.asyncio
async def test_second_active_returns_409_active_exists(
    session, user, slot_free, slot_free_2
):
    """Пользователь уже имеет активную запись → вторая → 409 active_exists."""
    service = AppointmentService(session)

    await service.create(user, slot_free.id)

    with pytest.raises(AppError) as exc:
        await service.create(user, slot_free_2.id)

    assert exc.value.status_code == 409
    assert exc.value.code == ErrorCode.ACTIVE_EXISTS


@pytest.mark.asyncio
async def test_booking_before_interval_returns_422(session, user, center):
    """Если недавно была донация, слот раньше next_allowed → 422 interval_not_passed."""
    # Кладём донацию «вчера» — тогда whole_blood next_allowed = вчера + 60 дней
    session.add(
        Donation(
            user_id=user.id,
            donation_type=DonationType.WHOLE_BLOOD,
            donated_on=date.today() - timedelta(days=1),
            center_name="Старый центр",
            is_demo=True,
        )
    )
    await session.flush()

    # Слот на завтра — раньше, чем через 60 дней
    from app.models import Slot

    dt = datetime.now(timezone.utc).replace(
        hour=10, minute=0, second=0, microsecond=0
    ) + timedelta(days=1)
    slot = Slot(
        center_id=center.id,
        donation_type=DonationType.WHOLE_BLOOD,
        starts_at=dt,
        is_blocked=False,
    )
    session.add(slot)
    await session.flush()

    service = AppointmentService(session)
    with pytest.raises(AppError) as exc:
        await service.create(user, slot.id)

    assert exc.value.status_code == 422
    assert exc.value.code == ErrorCode.INTERVAL_NOT_PASSED


@pytest.mark.asyncio
async def test_reschedule_is_atomic(session, user, slot_free, slot_free_2):
    """Перенос: старая → rescheduled, новая → active, оба видны в БД."""
    service = AppointmentService(session)

    schema1, orm1, _tz1 = await service.create(user, slot_free.id)
    assert orm1.status == AppointmentStatus.ACTIVE

    _schema2, orm2, _tz2 = await service.reschedule(user, orm1.id, slot_free_2.id)

    # Перечитываем из БД — обе записи должны быть в ожидаемом статусе
    old_db = await session.get(Appointment, orm1.id)
    new_db = await session.get(Appointment, orm2.id)

    assert old_db is not None and old_db.status == AppointmentStatus.RESCHEDULED
    assert new_db is not None and new_db.status == AppointmentStatus.ACTIVE
    assert new_db.rescheduled_from_id == old_db.id
    assert new_db.slot_id == slot_free_2.id
    # Старый слот теперь свободен: нет active-записи на slot_free.id
    from sqlalchemy import select

    still_active_on_old = await session.scalar(
        select(Appointment.id).where(
            Appointment.slot_id == slot_free.id,
            Appointment.status == AppointmentStatus.ACTIVE,
        )
    )
    assert still_active_on_old is None


@pytest.mark.asyncio
async def test_reschedule_to_taken_slot_returns_409(
    session, user, user2, slot_free, slot_free_2
):
    """Перенос на слот, который уже занят другим → 409."""
    service = AppointmentService(session)

    # user занимает slot_free
    _, orm1, _ = await service.create(user, slot_free.id)
    # user2 занимает slot_free_2
    await service.create(user2, slot_free_2.id)

    # user пытается перенести свою на slot_free_2
    with pytest.raises(AppError) as exc:
        await service.reschedule(user, orm1.id, slot_free_2.id)

    assert exc.value.status_code == 409
    assert exc.value.code == ErrorCode.SLOT_TAKEN


@pytest.mark.asyncio
async def test_cancel_frees_slot(session, user, user2, slot_free):
    """После отмены слот снова свободен — другой пользователь может записаться."""
    service = AppointmentService(session)

    _, orm, _ = await service.create(user, slot_free.id)
    await service.cancel(user, orm.id)

    # user2 теперь может занять тот же слот
    _, orm2, _ = await service.create(user2, slot_free.id)
    assert orm2.status == AppointmentStatus.ACTIVE