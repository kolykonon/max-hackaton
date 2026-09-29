import secrets
from typing import Annotated, Any

from fastapi import Depends, Header, Request
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import SessionDep
from app.core.errors import AppError
from app.core.utils.data_validate import InitDataError, validate_init_data
from app.models import Appointment, DonationGroup, User
from app.schemas.common import ErrorCode
from app.services.appointments import INVITE_PREFIX, AppointmentService
from app.services.booking import BookingService
from app.services.demo import DemoService
from app.services.demo_profile import create_demo_profile
from app.services.groups import GROUP_PREFIX, GroupService
from app.services.map import MapService
from app.services.profile import ProfileService
from app.services.regions import RegionService

REF_PREFIX = "ref_"

DEV_PROFILE = {
    "first_name": "Иван",
    "last_name": "Иванов",
    "username": "ivanov",
    "photo_url": None,
}


def _profile_from_init_data(init_data: str) -> tuple[int, dict[str, Any], str | None]:
    data = validate_init_data(
        init_data,
        settings.bot_settings.max_bot_token,
        settings.bot_settings.init_data_ttl,
    )
    user = data["user"]
    if not user.get("id"):
        raise InitDataError("User not found")
    profile = {
        "first_name": user.get("first_name") or "",
        "last_name": user.get("last_name"),
        "username": user.get("username"),
        "photo_url": user.get("photo_url"),
    }
    return int(user["id"]), profile, data.get("start_param")


async def _apply_referral(
    session: AsyncSession, user: User, start_param: str | None
) -> None:
    """Новый пользователь по ref_<код>, together_<код> или grp_<код> — засчитываем приглашение."""
    if not start_param:
        return
    if start_param.startswith(REF_PREFIX):
        code = start_param.removeprefix(REF_PREFIX)
        query = select(User.id).where(User.referral_code == code)
    elif start_param.startswith(INVITE_PREFIX):
        code = start_param.removeprefix(INVITE_PREFIX)
        query = select(Appointment.user_id).where(Appointment.invite_code == code)
    elif start_param.startswith(GROUP_PREFIX):
        code = start_param.removeprefix(GROUP_PREFIX)
        query = select(DonationGroup.owner_user_id).where(DonationGroup.code == code)
    else:
        return
    referrer_id = await session.scalar(query)
    if referrer_id and referrer_id != user.id:
        user.referred_by_user_id = referrer_id


async def get_current_user(
    session: SessionDep,
    x_max_init_data: str | None = Header(default=None),
    x_dev_user_id: int | None = Header(default=None),
) -> User:
    """Проверяет initData (или X-Dev-User-Id в dev-режиме) и делает upsert пользователя."""

    if x_max_init_data:
        max_user_id, profile, start_param = _profile_from_init_data(x_max_init_data)
    elif settings.dev_settings.auth_dev_mode and x_dev_user_id:
        max_user_id, profile, start_param = x_dev_user_id, DEV_PROFILE, None
    else:
        raise AppError(401, ErrorCode.UNAUTHORIZED, "Unauthorized")

    created_id = await session.scalar(
        insert(User)
        .values(
            max_user_id=max_user_id,
            referral_code=secrets.token_urlsafe(6),
            **profile,
        )
        .on_conflict_do_nothing(index_elements=[User.max_user_id])
        .returning(User.id)
    )
    user = await session.scalar(select(User).where(User.max_user_id == max_user_id))
    assert user is not None

    if created_id:
        await create_demo_profile(session, user)
        await _apply_referral(session, user, start_param)
    else:
        for key, value in profile.items():
            setattr(user, key, value)
    await session.commit()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_profile_service(session: SessionDep) -> ProfileService:
    return ProfileService(session)


async def get_demo_service(request: Request, session: SessionDep) -> DemoService:
    return DemoService(session, request.app.state.max)


ProfileServiceDep = Annotated[ProfileService, Depends(get_profile_service)]
DemoServiceDep = Annotated[DemoService, Depends(get_demo_service)]


async def get_booking_service(session: SessionDep) -> BookingService:
    return BookingService(session)


async def get_appointment_service(session: SessionDep) -> AppointmentService:
    return AppointmentService(session)


async def get_region_service(session: SessionDep) -> RegionService:
    return RegionService(session)


async def get_map_service(session: SessionDep) -> MapService:
    return MapService(session)


async def get_group_service(session: SessionDep) -> GroupService:
    return GroupService(session)


GroupServiceDep = Annotated[GroupService, Depends(get_group_service)]
BookingServiceDep = Annotated[BookingService, Depends(get_booking_service)]
AppointmentServiceDep = Annotated[AppointmentService, Depends(get_appointment_service)]
RegionServiceDep = Annotated[RegionService, Depends(get_region_service)]
MapServiceDep = Annotated[MapService, Depends(get_map_service)]
