from datetime import timedelta

import pytest

from app.core.errors import AppError
from app.models import Slot
from app.models.enums import DonationType
from app.schemas.common import ErrorCode
from app.services.appointments import AppointmentService


async def _slot_near(session, slot: Slot, delta: timedelta) -> Slot:
    s = Slot(
        center_id=slot.center_id,
        donation_type=DonationType.WHOLE_BLOOD,
        starts_at=slot.starts_at + delta,
        is_blocked=False,
    )
    session.add(s)
    await session.flush()
    return s


@pytest.mark.asyncio
async def test_invite_link_is_stable(session, user, slot_free):
    service = AppointmentService(session)
    appointment, _, _ = await service.create(user, slot_free.id)

    first = await service.create_invite(user, appointment.id)
    second = await service.create_invite(user, appointment.id)

    assert first.code == second.code
    assert first.link.endswith(f"?startapp=together_{first.code}")


@pytest.mark.asyncio
async def test_friend_booking_links_to_inviter(session, user, user2, slot_free):
    service = AppointmentService(session)
    appointment, _, _ = await service.create(user, slot_free.id)
    invite = await service.create_invite(user, appointment.id)

    info = await service.get_invite(user2, invite.code)
    assert info.inviter_name == "Иван"
    assert info.is_own is False
    assert info.appointment.id == appointment.id

    nearby = await _slot_near(session, slot_free, timedelta(minutes=15))
    _, friend, _ = await service.create(user2, nearby.id, invite.code)

    assert friend.invited_by_appointment_id == appointment.id
    inviter = await service.get_inviter(friend)
    assert inviter is not None and inviter.id == user.id


@pytest.mark.asyncio
async def test_invite_ignored_for_other_day(session, user, user2, slot_free):
    service = AppointmentService(session)
    appointment, _, _ = await service.create(user, slot_free.id)
    invite = await service.create_invite(user, appointment.id)

    next_day = await _slot_near(session, slot_free, timedelta(days=1))
    _, friend, _ = await service.create(user2, next_day.id, invite.code)

    assert friend.invited_by_appointment_id is None
    assert await service.get_inviter(friend) is None


@pytest.mark.asyncio
async def test_unknown_invite_code_does_not_block_booking(session, user, slot_free):
    service = AppointmentService(session)
    _, appointment, _ = await service.create(user, slot_free.id, "nope")

    assert appointment.invited_by_appointment_id is None


@pytest.mark.asyncio
async def test_cancelled_invite_returns_404(session, user, user2, slot_free):
    service = AppointmentService(session)
    appointment, _, _ = await service.create(user, slot_free.id)
    invite = await service.create_invite(user, appointment.id)
    await service.cancel(user, appointment.id)

    with pytest.raises(AppError) as exc:
        await service.get_invite(user2, invite.code)

    assert exc.value.status_code == 404
    assert exc.value.code == ErrorCode.INVITE_NOT_FOUND


@pytest.mark.asyncio
async def test_reschedule_keeps_invite(session, user, slot_free, slot_free_2):
    service = AppointmentService(session)
    appointment, _, _ = await service.create(user, slot_free.id)
    invite = await service.create_invite(user, appointment.id)

    moved, _, _ = await service.reschedule(user, appointment.id, slot_free_2.id)
    info = await service.get_invite(user, invite.code)

    assert info.appointment.id == moved.id
    assert info.is_own is True
