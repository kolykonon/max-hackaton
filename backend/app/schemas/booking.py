import datetime as dt
from enum import StrEnum

from pydantic import Field

from app.models.enums import StockStatus
from app.schemas.common import LocalTime, Schema


class BookingDay(Schema):
    date: dt.date
    available: bool


class BookingDates(Schema):
    from_: dt.date = Field(alias="from")
    to: dt.date
    earliest_allowed: dt.date
    first_available: dt.date | None
    days: list[BookingDay]


class BookingCenter(Schema):
    id: int
    name: str
    address: str
    lat: float
    lon: float
    photo_url: str | None
    free_slots: int = Field(ge=1)
    distance_km: float | None
    group_status: StockStatus | None


class SlotPeriod(StrEnum):
    MORNING = "morning"
    DAY = "day"
    EVENING = "evening"


class Slot(Schema):
    id: int
    starts_at: dt.datetime
    local_time: LocalTime
    is_free: bool


class SlotGroup(Schema):
    period: SlotPeriod
    slots: list[Slot]


class SlotsCenter(Schema):
    id: int
    name: str
    address: str


class BookingSlots(Schema):
    center: SlotsCenter
    date: dt.date
    groups: list[SlotGroup]
