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
from app.models import User
from app.schemas.common import ErrorCode
from app.services.demo import DemoService
from app.services.demo_profile import create_demo_profile
from app.services.profile import ProfileService

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
    if not start_param or not start_param.startswith(REF_PREFIX):
        return
    code = start_param.removeprefix(REF_PREFIX)
    referrer_id = await session.scalar(
        select(User.id).where(User.referral_code == code, User.id != user.id)
    )
    if referrer_id:
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


# --- сервисы ---


async def get_profile_service(session: SessionDep) -> ProfileService:
    return ProfileService(session)


async def get_demo_service(request: Request, session: SessionDep) -> DemoService:
    return DemoService(session, request.app.state.max)


ProfileServiceDep = Annotated[ProfileService, Depends(get_profile_service)]
DemoServiceDep = Annotated[DemoService, Depends(get_demo_service)]

from app.services.booking import BookingService


async def get_booking_service(session: SessionDep) -> BookingService:
    return BookingService(session)


BookingServiceDep = Annotated[BookingService, Depends(get_booking_service)]

from app.services.appointments import AppointmentService
from app.services.booking import BookingService
from app.services.map import MapService
from app.services.regions import RegionService


async def get_booking_service(session: SessionDep) -> BookingService:
    return BookingService(session)


async def get_appointment_service(session: SessionDep) -> AppointmentService:
    return AppointmentService(session)


async def get_region_service(session: SessionDep) -> RegionService:
    return RegionService(session)


async def get_map_service(session: SessionDep) -> MapService:
    return MapService(session)


BookingServiceDep = Annotated[BookingService, Depends(get_booking_service)]
AppointmentServiceDep = Annotated[AppointmentService, Depends(get_appointment_service)]
RegionServiceDep = Annotated[RegionService, Depends(get_region_service)]
MapServiceDep = Annotated[MapService, Depends(get_map_service)]

from app.services.appointments import AppointmentService
from app.services.booking import BookingService
from app.services.map import MapService
from app.services.regions import RegionService


async def get_booking_service(session: SessionDep) -> BookingService:
    return BookingService(session)


async def get_appointment_service(session: SessionDep) -> AppointmentService:
    return AppointmentService(session)


async def get_region_service(session: SessionDep) -> RegionService:
    return RegionService(session)


async def get_map_service(session: SessionDep) -> MapService:
    return MapService(session)


BookingServiceDep = Annotated[BookingService, Depends(get_booking_service)]
AppointmentServiceDep = Annotated[AppointmentService, Depends(get_appointment_service)]
RegionServiceDep = Annotated[RegionService, Depends(get_region_service)]
MapServiceDep = Annotated[MapService, Depends(get_map_service)]