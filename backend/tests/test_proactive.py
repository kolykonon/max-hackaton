"""Проактивные пуши: интервал прошёл, дефицит группы, день отдыха."""

import datetime as dt

import pytest
from sqlalchemy import select

from app.core.utils.dates import now_msk
from app.models import Appointment, Donation, NotificationLog, RegionBloodStatus
from app.models.enums import AppointmentStatus, BloodGroup, DonationType, StockStatus
from app.services import proactive
from tests.conftest import FakeBot

TODAY = dt.date(2026, 9, 28)


def days(n: int) -> dt.timedelta:
    return dt.timedelta(days=n)


def mine(planned, user):
    return [p for p in planned if p.user_id == user.id]


async def _donor(
    session, user, donated_on, kind=DonationType.WHOLE_BLOOD, is_demo=True
):
    user.onboarding_completed_at = now_msk()
    donation = Donation(
        user_id=user.id, donation_type=kind, donated_on=donated_on, is_demo=is_demo
    )
    session.add(donation)
    await session.flush()
    return donation


@pytest.mark.asyncio
async def test_interval_open_once(session, user):
    await _donor(session, user, TODAY - days(60))
    planned = mine(await proactive.plan_availability_pushes(session, TODAY), user)
    assert [(p.kind, p.key) for p in planned] == [
        ("interval_open", "whole_blood:2026-09-28")
    ]

    bot = FakeBot()
    assert await proactive.deliver(session, bot, planned) == 1
    assert "кровь" in bot.messages[0]["text"]
    # второй раз не шлём
    assert mine(await proactive.plan_availability_pushes(session, TODAY), user) == []


@pytest.mark.asyncio
async def test_interval_not_yet_and_too_old(session, user):
    await _donor(session, user, TODAY - days(10))
    assert mine(await proactive.plan_availability_pushes(session, TODAY), user) == []
    # плазма после крови открылась 30 дней назад — за пределами окна, не шлём
    assert mine(
        await proactive.plan_availability_pushes(session, TODAY + days(50)), user
    )[0].key == ("whole_blood:2026-11-17")


@pytest.mark.asyncio
async def test_no_push_with_active_appointment_or_without_onboarding(
    session, user, slot_free
):
    await _donor(session, user, TODAY - days(60))
    session.add(
        Appointment(
            user_id=user.id,
            slot_id=slot_free.id,
            center_id=slot_free.center_id,
            donation_type=slot_free.donation_type,
            starts_at=slot_free.starts_at,
            status=AppointmentStatus.ACTIVE,
        )
    )
    await session.flush()
    assert mine(await proactive.plan_availability_pushes(session, TODAY), user) == []


@pytest.mark.asyncio
async def test_no_onboarding_no_push(session, user):
    await _donor(session, user, TODAY - days(60))
    user.onboarding_completed_at = None
    await session.flush()
    assert mine(await proactive.plan_availability_pushes(session, TODAY), user) == []


@pytest.mark.asyncio
async def test_deficit_push_covers_interval_and_has_cooldown(session, user, region):
    await _donor(session, user, TODAY - days(60))
    user.region_id = region.id
    session.add(
        RegionBloodStatus(
            region_id=region.id, blood_group=BloodGroup.A_POS, status=StockStatus.URGENT
        )
    )
    await session.flush()

    planned = mine(await proactive.plan_availability_pushes(session, TODAY), user)
    assert len(planned) == 1 and planned[0].kind == "deficit"
    assert planned[0].also == [("interval_open", "whole_blood:2026-09-28")]

    bot = FakeBot()
    await proactive.deliver(session, bot, planned)
    assert (
        "Тестовый регион" in bot.messages[0]["text"] and "2+" in bot.messages[0]["text"]
    )
    # кулдаун 2 недели, интервал тоже помечен
    assert (
        mine(await proactive.plan_availability_pushes(session, TODAY + days(1)), user)
        == []
    )


@pytest.mark.asyncio
async def test_deficit_needs_open_interval(session, user, region):
    await _donor(session, user, TODAY - days(5))
    user.region_id = region.id
    session.add(
        RegionBloodStatus(
            region_id=region.id, blood_group=BloodGroup.A_POS, status=StockStatus.URGENT
        )
    )
    await session.flush()
    assert mine(await proactive.plan_availability_pushes(session, TODAY), user) == []


@pytest.mark.asyncio
async def test_deficit_low_is_not_urgent(session, user, region):
    await _donor(session, user, TODAY - days(90))
    user.region_id = region.id
    session.add(
        RegionBloodStatus(
            region_id=region.id, blood_group=BloodGroup.A_POS, status=StockStatus.LOW
        )
    )
    await session.flush()
    assert mine(await proactive.plan_availability_pushes(session, TODAY), user) == []


@pytest.mark.asyncio
async def test_region_fallback_from_last_appointment(session, user, slot_free, center):
    session.add(
        Appointment(
            user_id=user.id,
            slot_id=slot_free.id,
            center_id=center.id,
            donation_type=slot_free.donation_type,
            starts_at=slot_free.starts_at,
            status=AppointmentStatus.CANCELLED,
        )
    )
    await session.flush()
    assert (await proactive.effective_regions(session, [user]))[
        user.id
    ] == center.region_id


@pytest.mark.asyncio
async def test_rest_day_reminders(session, user):
    donation = await _donor(session, user, TODAY - days(14), is_demo=False)
    planned = mine(await proactive.plan_rest_day_pushes(session, TODAY), user)
    assert [(p.kind, p.key) for p in planned] == [("rest_day_14", str(donation.id))]

    bot = FakeBot()
    await proactive.deliver(session, bot, planned)
    assert "день отдыха" in bot.messages[0]["text"]
    assert mine(await proactive.plan_rest_day_pushes(session, TODAY), user) == []

    # за 30 дней до конца года — следующее напоминание
    later = dt.date(2027, 8, 15)
    planned = mine(await proactive.plan_rest_day_pushes(session, later), user)
    assert planned[0].kind == "rest_day_30"

    # отметил «использовал» — больше не напоминаем
    donation.rest_day_used_at = now_msk()
    await session.flush()
    assert mine(await proactive.plan_rest_day_pushes(session, later), user) == []


@pytest.mark.asyncio
async def test_rest_day_sends_only_latest_stage(session, user):
    await _donor(session, user, TODAY - days(340), is_demo=False)
    planned = mine(await proactive.plan_rest_day_pushes(session, TODAY), user)
    assert planned[0].kind == "rest_day_30"
    assert [k for k, _ in planned[0].also] == ["rest_day_14"]


@pytest.mark.asyncio
async def test_rest_day_skips_demo_donations(session, user):
    await _donor(session, user, TODAY - days(14), is_demo=True)
    assert mine(await proactive.plan_rest_day_pushes(session, TODAY), user) == []


@pytest.mark.asyncio
async def test_failed_send_is_retried_next_time(session, user):
    await _donor(session, user, TODAY - days(60))
    planned = mine(await proactive.plan_availability_pushes(session, TODAY), user)
    assert await proactive.deliver(session, FakeBot(fail=True), planned) == 0
    logged = await session.scalar(
        select(NotificationLog.id).where(NotificationLog.user_id == user.id)
    )
    assert logged is None
    assert mine(await proactive.plan_availability_pushes(session, TODAY), user)
