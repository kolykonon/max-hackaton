from fastapi import APIRouter

from app.api.deps import AppointmentServiceDep, CurrentUser
from app.schemas.appointments import Invite
from app.schemas.common import error_responses

router = APIRouter(
    prefix="/invites",
    tags=["invites"],
    responses=error_responses(401),
)


@router.get(
    "/{code}",
    summary="Приглашение «Сдать кровь вместе»",
    responses=error_responses(404),
)
async def get_invite(
    user: CurrentUser, service: AppointmentServiceDep, code: str
) -> Invite:
    return await service.get_invite(user, code)
