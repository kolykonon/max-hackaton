"""Сервис карты-светофора: статусы групп крови по регионам."""
import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Region, RegionBloodStatus
from app.models.enums import StockStatus
from app.schemas.map import MapRegion, MapStatus

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

        by_region: dict[str, dict[str, str]] = {}
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

    @staticmethod
    def _worst(statuses: dict[str, str]) -> StockStatus | None:
        if not statuses:
            return None
        worst = max(
            statuses.values(),
            key=lambda s: _WORST_ORDER.get(StockStatus(s), 0),
        )
        return StockStatus(worst)