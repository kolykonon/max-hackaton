import logging
from collections.abc import Mapping
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Center, CenterBloodStatus, Region, RegionBloodStatus
from app.models.enums import BloodGroup, StockStatus
from app.schemas.map import MapCenter, MapRegion, MapStatus

log = logging.getLogger(__name__)

_WORST_ORDER = {
    StockStatus.URGENT: 3,
    StockStatus.LOW: 2,
    StockStatus.ENOUGH: 1,
}


class MapService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def status(self) -> MapStatus:
        updated_at = await self.session.scalar(
            select(func.max(RegionBloodStatus.updated_at))
        )
        if updated_at is None:
            updated_at = datetime.now(timezone.utc)

        rows = (
            await self.session.execute(
                select(
                    Region.code,
                    RegionBloodStatus.blood_group,
                    RegionBloodStatus.status,
                )
                .join(
                    RegionBloodStatus,
                    RegionBloodStatus.region_id == Region.id,
                    isouter=True,
                )
                .order_by(Region.code)
            )
        ).all()

        by_region: dict[str, dict[BloodGroup, StockStatus]] = {}
        for code, group, status in rows:
            by_region.setdefault(code, {})
            if group is not None and status is not None:
                by_region[code][group] = status

        regions = [
            MapRegion(
                code=code,
                statuses=statuses,
                worst=self._worst(statuses),
            )
            for code, statuses in by_region.items()
        ]

        return MapStatus(updated_at=updated_at, regions=regions)

    async def centers(self) -> list[MapCenter]:
        """Все центры со статусами по всем группам крови"""
        rows = (
            await self.session.execute(
                select(
                    Center,
                    CenterBloodStatus.blood_group,
                    CenterBloodStatus.status,
                )
                .join(
                    CenterBloodStatus,
                    CenterBloodStatus.center_id == Center.id,
                    isouter=True,
                )
                .order_by(Center.id)
            )
        ).all()

        centers: dict[int, Center] = {}
        statuses: dict[int, dict[BloodGroup, StockStatus]] = {}
        for center, group, status in rows:
            centers[center.id] = center
            statuses.setdefault(center.id, {})
            if group is not None and status is not None:
                statuses[center.id][group] = status

        return [
            MapCenter(
                id=center.id,
                name=center.name,
                address=center.address,
                lat=center.lat,
                lon=center.lon,
                region_id=center.region_id,
                statuses=statuses[center_id],
                worst=self._worst(statuses[center_id]),
            )
            for center_id, center in centers.items()
        ]

    @staticmethod
    def _worst(statuses: Mapping[Any, str]) -> StockStatus | None:
        if not statuses:
            return None
        worst = max(
            statuses.values(),
            key=lambda s: _WORST_ORDER.get(StockStatus(s), 0),
        )
        return StockStatus(worst)
