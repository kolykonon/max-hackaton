import logging

from fastapi import APIRouter, BackgroundTasks, Request, status

from app.api.deps import AppointmentServiceDep, CurrentUser, GroupServiceDep
from app.bot import pushes
from app.bot.handlers import send_appointment_confirmed
from app.models.enums import DonationType
from app.schemas.appointments import AppointmentResponse, SlotRequest
from app.schemas.common import error_responses
from app.services.groups import human_date
from app.services.reminders import cancel_reminders, schedule_reminders

log = logging.getLogger(__name__)

router = APIRouter(
    prefix="/appointments",
    tags=["appointments"],
    responses=error_responses(401),
)


@router.get("/current", summary="Активная запись")
async def get_current_appointment(
    user: CurrentUser, service: AppointmentServiceDep
) -> AppointmentResponse:
    return AppointmentResponse(appointment=await service.get_current(user))


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Записаться",
    responses=error_responses(404, 409, 422),
)
async def create_appointment(
    request: Request,
    user: CurrentUser,
    service: AppointmentServiceDep,
    groups: GroupServiceDep,
    body: SlotRequest,
    background: BackgroundTasks,
) -> AppointmentResponse:
    schema, orm, _tz_name = await service.create(user, body.slot_id)

    background.add_task(
        send_appointment_confirmed, request.app.state.max, user.max_user_id
    )

    for owner_max_id, group in await groups.groups_of_booking(user, orm):
        background.add_task(
            pushes.send_group_booked,
            request.app.state.max,
            owner_max_id,
            group.code,
            user.first_name,
            group.center.name,
            human_date(group.date),
            # у цельной крови время не выбирали — пишем только день
            schema.local_time if schema.donation_type == DonationType.PLASMA else None,
            sum(member.is_booked for member in group.members),
            group.members_count,
        )

    scheduler = getattr(request.app.state, "scheduler", None)
    if scheduler is not None:
        schedule_reminders(scheduler, orm, user.max_user_id, request.app.state.max)

    return AppointmentResponse(appointment=schema)


@router.post(
    "/{appointment_id}/reschedule",
    status_code=status.HTTP_201_CREATED,
    summary="Перенести запись",
    responses=error_responses(404, 409, 422),
)
async def reschedule_appointment(
    request: Request,
    user: CurrentUser,
    service: AppointmentServiceDep,
    appointment_id: int,
    body: SlotRequest,
    background: BackgroundTasks,
) -> AppointmentResponse:
    schema, orm, _tz_name = await service.reschedule(user, appointment_id, body.slot_id)

    scheduler = getattr(request.app.state, "scheduler", None)
    if scheduler is not None:
        cancel_reminders(scheduler, appointment_id)
        schedule_reminders(scheduler, orm, user.max_user_id, request.app.state.max)

    background.add_task(
        send_appointment_confirmed, request.app.state.max, user.max_user_id
    )

    return AppointmentResponse(appointment=schema)


@router.post(
    "/{appointment_id}/cancel",
    summary="Отменить запись",
    responses=error_responses(404, 409),
)
async def cancel_appointment(
    request: Request,
    user: CurrentUser,
    service: AppointmentServiceDep,
    appointment_id: int,
) -> AppointmentResponse:
    await service.cancel(user, appointment_id)

    scheduler = getattr(request.app.state, "scheduler", None)
    if scheduler is not None:
        cancel_reminders(scheduler, appointment_id)

    return AppointmentResponse(appointment=None)
