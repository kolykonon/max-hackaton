import datetime as dt
from typing import ClassVar

from app.api.stub.data import CENTERS, MOSCOW, REGIONS, DemoCenter
from app.core.errors import AppError
from app.core.utils.dates import MSK, today_msk
from app.models.enums import BloodGroup, StockStatus
from app.schemas.common import ErrorCode
from app.schemas.regions import MapCenter, MapRegion, MapStatus, Region


class StubRegionService:
    STATUS_CYCLE: ClassVar[tuple[StockStatus, ...]] = (
        StockStatus.URGENT,
        StockStatus.LOW,
        StockStatus.ENOUGH,
        StockStatus.ENOUGH,
    )
    SEVERITY: ClassVar[dict[StockStatus, int]] = {
        StockStatus.URGENT: 0,
        StockStatus.LOW: 1,
        StockStatus.ENOUGH: 2,
    }

    async def list_regions(self) -> list[Region]:
        return REGIONS

    async def get_region(self, region_id: int) -> Region:
        region = next((r for r in REGIONS if r.id == region_id), None)
        if region is None:
            raise AppError(404, ErrorCode.NOT_FOUND, "Регион не найден")
        return region

    async def locate(self, lat: float, lon: float) -> Region | None:
        return MOSCOW

    async def get_map_status(self) -> MapStatus:
        return MapStatus(
            updated_at=dt.datetime.combine(today_msk(), dt.time(9, 0), tzinfo=MSK),
            regions=[self._map_region(r) for r in REGIONS],
        )

    def _map_region(self, region: Region) -> MapRegion:
        if not region.has_centers:
            return MapRegion(code=region.code, statuses={}, worst=None)
        statuses = {
            group: self.STATUS_CYCLE[(region.id + i) % len(self.STATUS_CYCLE)]
            for i, group in enumerate(BloodGroup)
        }
        worst = min(statuses.values(), key=self.SEVERITY.__getitem__)
        return MapRegion(code=region.code, statuses=statuses, worst=worst)

    async def get_map_centers(self) -> list[MapCenter]:
        return [self._map_center(center) for center in CENTERS]

    def _map_center(self, center: DemoCenter) -> MapCenter:
        # Все демо-центры в Москве (как в /booking/centers). Без group_status — нет данных
        if center.group_status is None:
            return MapCenter(
                id=center.id,
                name=center.name,
                address=center.address,
                lat=center.lat,
                lon=center.lon,
                region_id=MOSCOW.id,
                statuses={},
                worst=None,
            )
        statuses = {
            group: self.STATUS_CYCLE[(center.id + i) % len(self.STATUS_CYCLE)]
            for i, group in enumerate(BloodGroup)
        }
        # Группа демо-пользователя — тот же статус, что центр отдаёт в /booking/centers
        statuses[BloodGroup.A_POS] = center.group_status
        worst = min(statuses.values(), key=self.SEVERITY.__getitem__)
        return MapCenter(
            id=center.id,
            name=center.name,
            address=center.address,
            lat=center.lat,
            lon=center.lon,
            region_id=MOSCOW.id,
            statuses=statuses,
            worst=worst,
        )
