"""Сервис регионов: список и определение по координатам.

Пока нет russia.topo.json от Андрея — locate всегда возвращает None.
Когда файл появится, добавим shapely-проверку: point in polygon.
"""
import logging

from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Center, Region
from app.schemas.regions import Region as RegionSchema

log = logging.getLogger(__name__)

LOCATE_ENABLED = False


class RegionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_regions(self) -> list[RegionSchema]:
        rows = (
            await self.session.execute(
                select(
                    Region.id,
                    Region.code,
                    Region.name,
                    exists()
                    .where(Center.region_id == Region.id)
                    .label("has_centers"),
                ).order_by(Region.name)
            )
        ).all()

        return [
            RegionSchema(
                id=r.id,
                code=r.code,
                name=r.name,
                has_centers=bool(r.has_centers),
            )
            for r in rows
        ]

    async def locate(self, lat: float, lon: float) -> RegionSchema | None:
        if not LOCATE_ENABLED:
            return None

        # TODO: shapely, когда Андрей принесёт russia.topo.json:
        # point = Point(lon, lat)
        # для каждого региона: if polygon.contains(point): вернуть регион
        return None