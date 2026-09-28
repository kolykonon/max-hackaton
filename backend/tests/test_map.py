"""Тесты /map/centers: статусы по центрам и худший статус."""

import pytest

from app.models import Center, CenterBloodStatus
from app.models.enums import BloodGroup, StockStatus
from app.services.map import MapService


@pytest.mark.asyncio
async def test_map_centers_statuses_and_worst(session, region, center):
    session.add_all(
        [
            CenterBloodStatus(
                center_id=center.id,
                blood_group=BloodGroup("1+"),
                status=StockStatus.ENOUGH,
            ),
            CenterBloodStatus(
                center_id=center.id,
                blood_group=BloodGroup("2-"),
                status=StockStatus.URGENT,
            ),
        ]
    )
    empty = Center(
        region_id=region.id, name="Без данных", address="ул. Пустая, 2", lat=55.7, lon=37.6
    )
    session.add(empty)
    await session.flush()

    result = {c.id: c for c in await MapService(session).centers()}

    got = result[center.id]
    assert got.region_id == region.id
    assert got.statuses == {BloodGroup("1+"): StockStatus.ENOUGH, BloodGroup("2-"): StockStatus.URGENT}
    assert got.worst == StockStatus.URGENT

    assert result[empty.id].statuses == {}
    assert result[empty.id].worst is None
