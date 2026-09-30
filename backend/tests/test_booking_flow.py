"""Новый сценарий записи: одно место на окно, гонка за последнее место,
«ваш центр» первым, личные данные сохраняются по разделам."""

import asyncio
import datetime as dt
from datetime import UTC, datetime

import pytest
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.errors import AppError
from app.models import Appointment, Center, Donation, PersonalData, Region, Slot, User
from app.models.enums import DonationType
from app.schemas.common import ErrorCode
from app.schemas.profile import PersonalDataInput
from app.services.appointments import AppointmentService
from app.services.booking import BookingService
from app.services.profile import ProfileService
from tests.conftest import DEMO_PD


def _user(n: int) -> User:
    return User(max_user_id=990_000 + n, first_name=f"Донор{n}", referral_code=f"cap-{n}")


def _plasma_slot(center: Center) -> Slot:
    starts = datetime.now(UTC).replace(hour=9, minute=0, second=0, microsecond=0)
    return Slot(
        center_id=center.id,
        donation_type=DonationType.PLASMA,
        starts_at=starts + dt.timedelta(days=1),
    )


async def _donor(session, n: int) -> User:
    u = _user(n)
    session.add(u)
    await session.flush()
    session.add(PersonalData(user_id=u.id, **DEMO_PD))
    return u


@pytest.mark.asyncio
async def test_plasma_slot_holds_one(session, center):
    slot = _plasma_slot(center)
    session.add(slot)
    await session.flush()
    assert slot.capacity == 1

    service = AppointmentService(session)
    await service.create(await _donor(session, 0), slot.id)

    slots = await BookingService(session).get_slots(
        await _donor(session, 99), center.id, DonationType.PLASMA, slot.starts_at.date()
    )
    info = slots.groups[0].slots[0]
    assert not info.is_free

    with pytest.raises(AppError) as exc:
        await service.create(await _donor(session, 1), slot.id)
    assert exc.value.code == ErrorCode.SLOT_TAKEN


@pytest.mark.asyncio
async def test_last_place_race(engine, monkeypatch):
    """Двое одновременно подтверждают последнее место — проходит ровно один."""
    # Пауза между проверкой мест и коммитом — чтобы запросы точно пересеклись
    check_interval = AppointmentService._check_interval

    async def slow_check(self, user, slot):
        await asyncio.sleep(0.2)
        await check_interval(self, user, slot)

    monkeypatch.setattr(AppointmentService, "_check_interval", slow_check)
    maker = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with maker() as s:
        region = Region(code="RU-RACE", name="Гонка", timezone="Europe/Moscow")
        s.add(region)
        await s.flush()
        center = Center(region_id=region.id, name="Центр гонки", address="—", lat=0, lon=0)
        s.add(center)
        await s.flush()
        slot = _plasma_slot(center)
        s.add(slot)
        users = [await _donor(s, 500 + n) for n in range(2)]
        await s.commit()

    async def book(user: User) -> bool:
        async with maker() as s:
            try:
                await AppointmentService(s).create(user, slot.id)
                return True
            except AppError as e:
                assert e.code == ErrorCode.SLOT_TAKEN
                return False

    try:
        results = await asyncio.gather(*(book(u) for u in users))
        assert sorted(results) == [False, True]
    finally:
        async with maker() as s:
            await s.execute(delete(Appointment).where(Appointment.slot_id == slot.id))
            await s.execute(delete(Slot).where(Slot.id == slot.id))
            await s.execute(delete(User).where(User.id.in_([u.id for u in users])))
            await s.execute(delete(Center).where(Center.id == center.id))
            await s.execute(delete(Region).where(Region.id == region.id))
            await s.commit()


@pytest.mark.asyncio
async def test_usual_center_first(session, user, region, center):
    other = Center(region_id=region.id, name="Аааа центр", address="—", lat=0, lon=0)
    session.add(other)
    await session.flush()
    day = dt.date.today() + dt.timedelta(days=1)
    starts = datetime.combine(day, dt.time(9), tzinfo=UTC)
    for c in (center, other):
        session.add(Slot(center_id=c.id, donation_type=DonationType.WHOLE_BLOOD, starts_at=starts))
    await session.flush()
    service = BookingService(session)
    args = (region.id, DonationType.WHOLE_BLOOD, day, None, None, None)

    # Без истории — обычная сортировка (по алфавиту)
    assert [c.name for c in await service.get_centers(user, *args)] == ["Аааа центр", "Тестовый центр"]

    for days_ago in (100, 200):
        session.add(Donation(user_id=user.id, donation_type=DonationType.WHOLE_BLOOD,
                             donated_on=dt.date.today() - dt.timedelta(days=days_ago),
                             center_name=center.name))
    await session.flush()
    centers = await service.get_centers(user, *args)
    assert centers[0].id == center.id and centers[0].is_usual

    # В «вашем центре» мест нет — он всё равно первый, но с free_slots=0
    await session.execute(delete(Slot).where(Slot.center_id == center.id))
    centers = await service.get_centers(user, *args)
    assert centers[0].id == center.id and centers[0].free_slots == 0


@pytest.mark.asyncio
async def test_personal_data_saved_by_section(session):
    u = _user(700)
    session.add(u)
    await session.flush()
    service = ProfileService(session)
    pd = await service.save_personal_data(u, PersonalDataInput(oms_number="1111222233334444"))
    assert pd.oms_number == "1111222233334444" and "phone" in pd.missing_fields

    pd = await service.save_personal_data(u, PersonalDataInput(phone="+79990000000", email="a@example.ru"))
    assert pd.oms_number == "1111222233334444"  # прошлый раздел не затёрт
    assert "phone" not in pd.missing_fields
