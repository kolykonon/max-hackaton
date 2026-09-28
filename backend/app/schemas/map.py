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


class MapCenter(Schema):
    id: int
    name: str
    address: str
    lat: float
    lon: float
    region_id: int
    city: str | None
    center_type: str | None
    phone: str | None
    work_hours: str | None
    booking_info: str | None
    donation_types: str | None
    donor_requirements: str | None
    notes: str | None
    data_status: str | None
    source_url: str | None
    source_url_2: str | None
    verified_on: str | None
    statuses: dict[BloodGroup, StockStatus]
    worst: StockStatus | None
