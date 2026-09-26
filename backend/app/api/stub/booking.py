import datetime as dt

from app.api.stub.data import CENTERS, DemoCenter
from app.api.stub.profile import StubProfileService
from app.api.stub.regions import StubRegionService
from app.api.stub.slots import SlotCalendar
from app.core.utils.dates import add_months, days_between, today_msk
from app.core.utils.geo import distance_km
from app.models import User
from app.models.enums import DonationType, StockStatus
from app.schemas.booking import (
    BookingCenter,
    BookingDates,
    BookingDay,
    BookingSlots,
    SlotsCenter,
)


class StubBookingService:
    WINDOW_MONTHS = 2

    def __init__(
        self,
        profile: StubProfileService,
        regions: StubRegionService,
        calendar: SlotCalendar,
    ) -> None:
        self._profile = profile
        self._regions = regions
        self._calendar = calendar

    async def get_dates(
        self, user: User, region_id: int, donation_type: DonationType
    ) -> BookingDates:
        await self._regions.get_region(region_id)
        start = today_msk()
        end = add_months(start, self.WINDOW_MONTHS)
        earliest = await self._profile.get_next_allowed(user, donation_type)
        days = [
            BookingDay(
                date=day,
                available=day >= earliest and self._calendar.is_working_day(day),
            )
            for day in days_between(start, end)
        ]
        return BookingDates(
            from_=start,  # pyright: ignore[reportCallIssue] почему то ругается мб из за алиаса
            to=end,
            earliest_allowed=earliest,
            first_available=next((d.date for d in days if d.available), None),
            days=days,
        )

    async def get_centers(
        self,
        user: User,
        region_id: int,
        donation_type: DonationType,
        day: dt.date,
        lat: float | None,
        lon: float | None,
        pin_center_id: int | None,
    ) -> list[BookingCenter]:
        await self._regions.get_region(region_id)
        result = []
        for center in CENTERS:
            free = self._calendar.free_count(center, donation_type, day)
            if free:
                result.append(self._to_booking_center(center, free, lat, lon))
        return sorted(result, key=lambda c: self._sort_key(c, pin_center_id))

    async def get_slots(
        self, user: User, center_id: int, donation_type: DonationType, day: dt.date
    ) -> BookingSlots:
        center = self._calendar.get_center(center_id)
        return BookingSlots(
            center=SlotsCenter(id=center.id, name=center.name, address=center.address),
            date=day,
            groups=self._calendar.groups(center, donation_type, day),
        )

    @staticmethod
    def _to_booking_center(
        center: DemoCenter, free_slots: int, lat: float | None, lon: float | None
    ) -> BookingCenter:
        distance = None
        if lat is not None and lon is not None:
            distance = distance_km(lat, lon, center.lat, center.lon)
        return BookingCenter(
            id=center.id,
            name=center.name,
            address=center.address,
            lat=center.lat,
            lon=center.lon,
            photo_url=None,
            free_slots=free_slots,
            distance_km=distance,
            group_status=center.group_status,
        )

    @staticmethod
    def _sort_key(center: BookingCenter, pin_center_id: int | None) -> tuple:
        return (
            center.id != pin_center_id,
            center.group_status != StockStatus.URGENT,
            center.distance_km or 0,
            center.name,
        )
