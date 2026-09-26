import datetime as dt

from fastapi import APIRouter

from app.api.stub.auth import CurrentUser
from app.api.stub.services import booking_service
from app.models.enums import DonationType
from app.schemas.booking import BookingCenter, BookingDates, BookingSlots
from app.schemas.common import error_responses

router = APIRouter(
    prefix="/booking",
    tags=["booking"],
    responses=error_responses(401, 404, 422),
)


@router.get("/dates", summary="Календарь доступности на 2 месяца")
async def get_booking_dates(
    user: CurrentUser, region_id: int, donation_type: DonationType
) -> BookingDates:
    return await booking_service.get_dates(user, region_id, donation_type)


@router.get("/centers", summary="Центры со свободными слотами на дату")
async def get_booking_centers(
    user: CurrentUser,
    region_id: int,
    donation_type: DonationType,
    date: dt.date,
    lat: float | None = None,
    lon: float | None = None,
    pin_center_id: int | None = None,
) -> list[BookingCenter]:
    return await booking_service.get_centers(
        user, region_id, donation_type, date, lat, lon, pin_center_id
    )


@router.get("/slots", summary="Слоты центра на дату")
async def get_booking_slots(
    user: CurrentUser, center_id: int, donation_type: DonationType, date: dt.date
) -> BookingSlots:
    return await booking_service.get_slots(user, center_id, donation_type, date)
