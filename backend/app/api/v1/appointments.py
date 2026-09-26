from fastapi import APIRouter, status

from app.api.stub.auth import CurrentUser
from app.api.stub.services import appointment_service
from app.schemas.appointments import AppointmentResponse, SlotRequest
from app.schemas.common import error_responses

router = APIRouter(
    prefix="/appointments",
    tags=["appointments"],
    responses=error_responses(401),
)


@router.get("/current", summary="Активная запись")
async def get_current_appointment(user: CurrentUser) -> AppointmentResponse:
    return AppointmentResponse(appointment=await appointment_service.get_current(user))


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Записаться",
    responses=error_responses(404, 409, 422),
)
async def create_appointment(
    user: CurrentUser, body: SlotRequest
) -> AppointmentResponse:
    appointment = await appointment_service.create(user, body.slot_id)
    return AppointmentResponse(appointment=appointment)


@router.post(
    "/{appointment_id}/reschedule",
    status_code=status.HTTP_201_CREATED,
    summary="Перенести запись",
    responses=error_responses(404, 409, 422),
)
async def reschedule_appointment(
    user: CurrentUser, appointment_id: int, body: SlotRequest
) -> AppointmentResponse:
    appointment = await appointment_service.reschedule(
        user, appointment_id, body.slot_id
    )
    return AppointmentResponse(appointment=appointment)


@router.post(
    "/{appointment_id}/cancel",
    summary="Отменить запись",
    responses=error_responses(404, 409),
)
async def cancel_appointment(
    user: CurrentUser, appointment_id: int
) -> AppointmentResponse:
    await appointment_service.cancel(user, appointment_id)
    return AppointmentResponse(appointment=None)
