import datetime as dt

from app.models.enums import BloodGroup, StockStatus
from app.schemas.common import Schema


class MapRegion(Schema):
    code: str
    statuses: dict[BloodGroup, StockStatus]
    worst: StockStatus | None


class MapStatus(Schema):
    updated_at: dt.datetime
    regions: list[MapRegion]
