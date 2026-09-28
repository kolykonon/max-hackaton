"""Сервис регионов: список и определение по координатам (границы — region_locator)."""

import logging

from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Center, Region
from app.schemas.regions import Region as RegionSchema
from app.services.region_locator import get_region_locator

log = logging.getLogger(__name__)


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
                    exists().where(Center.region_id == Region.id).label("has_centers"),
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
        code = get_region_locator().find_code(lat, lon)
        if code is None:
            return None

        row = (
            await self.session.execute(
                select(
                    Region.id,
                    Region.code,
                    Region.name,
                    exists().where(Center.region_id == Region.id).label("has_centers"),
                ).where(Region.code == code)
            )
        ).one_or_none()
        if row is None:
            log.warning("Регион %s есть в границах, но не в БД", code)
            return None

        return RegionSchema(
            id=row.id, code=row.code, name=row.name, has_centers=bool(row.has_centers)
        )
