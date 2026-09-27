"""Фикстуры для тестов: сессия в транзакции, откат после теста.

Каждый тест получает свою транзакцию и откатывает её в конце.
Это быстрее, чем чистить БД, и не мешает параллельным тестам.
"""

import asyncio
import os
from datetime import date, datetime, time, timedelta, timezone

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.db import Base
from app.models import (
    Appointment,
    Center,
    Donation,
    PersonalData,
    Region,
    Slot,
    User,
)
from app.models.enums import AppointmentStatus, BloodGroup, DonationType


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def engine():
    eng = create_async_engine(settings.postgres_settings.postgres_dsn, future=True)
    # один раз создаём таблицы (если их нет — тесты на чистой БД)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def session(engine):
    """Сессия в транзакции. После теста — откат."""
    async with engine.connect() as conn:
        trans = await conn.begin()
        maker = async_sessionmaker(bind=conn, expire_on_commit=False)
        async with maker() as s:
            yield s
        await trans.rollback()


@pytest_asyncio.fixture
async def region(session: AsyncSession) -> Region:
    r = Region(code="RU-TEST", name="Тестовый регион", timezone="Europe/Moscow")
    session.add(r)
    await session.flush()
    return r


@pytest_asyncio.fixture
async def center(session: AsyncSession, region: Region) -> Center:
    c = Center(
        region_id=region.id,
        name="Тестовый центр",
        address="ул. Тестовая, 1",
        lat=55.75,
        lon=37.62,
        photo_url=None,
    )
    session.add(c)
    await session.flush()
    return c


@pytest_asyncio.fixture
async def user(session: AsyncSession) -> User:
    u = User(
        max_user_id=999001,
        first_name="Иван",
        last_name="Иванов",
        blood_group=BloodGroup.A_POS.value,
        referral_code="test-ref-1",
    )
    session.add(u)
    await session.flush()
    # персональные данные — по ТЗ они нужны для записи
    session.add(
        PersonalData(
            user_id=u.id,
            last_name="Иванов",
            first_name="Иван",
            middle_name="Иванович",
            passport_series="4510",
            passport_number="123456",
            passport_issued_by="ГУ МВД",
            passport_division_code="770-001",
            oms_number="1234567890123456",
            phone="+79001234567",
            email="ivanov@mail.ru",
        )
    )
    await session.flush()
    return u


@pytest_asyncio.fixture
async def user2(session: AsyncSession) -> User:
    u = User(
        max_user_id=999002,
        first_name="Пётр",
        last_name="Петров",
        blood_group=BloodGroup.A_POS.value,
        referral_code="test-ref-2",
    )
    session.add(u)
    await session.flush()
    session.add(
        PersonalData(
            user_id=u.id,
            last_name="Петров",
            first_name="Пётр",
            middle_name="Петрович",
            passport_series="4511",
            passport_number="654321",
            passport_issued_by="ГУ МВД",
            passport_division_code="770-002",
            oms_number="6543210987654321",
            phone="+79007654321",
            email="petrov@mail.ru",
        )
    )
    await session.flush()
    return u


def _make_slot(center: Center, dt: datetime) -> Slot:
    return Slot(
        center_id=center.id,
        donation_type=DonationType.WHOLE_BLOOD,
        starts_at=dt,
        is_blocked=False,
    )


@pytest_asyncio.fixture
async def slot_free(session: AsyncSession, center: Center) -> Slot:
    """Слот на завтра в 10:00 UTC."""
    dt = datetime.now(timezone.utc).replace(
        hour=10, minute=0, second=0, microsecond=0
    ) + timedelta(days=1)
    s = _make_slot(center, dt)
    session.add(s)
    await session.flush()
    return s


@pytest_asyncio.fixture
async def slot_free_2(session: AsyncSession, center: Center) -> Slot:
    """Второй свободный слот (для переноса)."""
    dt = datetime.now(timezone.utc).replace(
        hour=11, minute=0, second=0, microsecond=0
    ) + timedelta(days=2)
    s = _make_slot(center, dt)
    session.add(s)
    await session.flush()
    return s
