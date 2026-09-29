from fastapi import APIRouter, BackgroundTasks, Request, status

from app.api.deps import CurrentUser, GroupServiceDep
from app.bot import pushes
from app.schemas.common import error_responses
from app.schemas.groups import Group, GroupCreate
from app.services.groups import human_date

router = APIRouter(prefix="/groups", tags=["groups"], responses=error_responses(401))


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Создать групповую донацию",
    responses=error_responses(404, 422),
)
async def create_group(
    user: CurrentUser, service: GroupServiceDep, body: GroupCreate
) -> Group:
    return await service.create(user, body)


@router.get("/my", summary="Мои предстоящие групповые донации")
async def my_groups(user: CurrentUser, service: GroupServiceDep) -> list[Group]:
    return await service.my_groups(user)


@router.get(
    "/{code}",
    summary="Группа по коду из ссылки grp_<code>",
    responses=error_responses(404),
)
async def get_group(user: CurrentUser, service: GroupServiceDep, code: str) -> Group:
    return await service.get(user, code)


@router.post(
    "/{code}/join",
    summary="Присоединиться к группе",
    responses=error_responses(404, 409),
)
async def join_group(
    request: Request,
    background: BackgroundTasks,
    user: CurrentUser,
    service: GroupServiceDep,
    code: str,
) -> Group:
    group, joined = await service.join(user, code)
    if joined and not group.is_owner:
        owner_max_id = await service.owner_max_user_id(code)
        if owner_max_id is not None:
            background.add_task(
                pushes.send_group_joined,
                request.app.state.max,
                owner_max_id,
                group.code,
                user.first_name,
                group.center.name,
                human_date(group.date),
                group.members_count,
            )
    return group
