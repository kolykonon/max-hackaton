from fastapi import APIRouter, status

from app.api.deps import CurrentUser, GroupServiceDep
from app.schemas.common import error_responses
from app.schemas.groups import Group, GroupCreate

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


@router.get("/my", summary="Мои групповые донации: предстоящие или прошедшие")
async def my_groups(
    user: CurrentUser, service: GroupServiceDep, past: bool = False
) -> list[Group]:
    return await service.my_groups(user, past)


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
async def join_group(user: CurrentUser, service: GroupServiceDep, code: str) -> Group:
    group, _ = await service.join(user, code)
    return group
