import secrets

from fastapi import Header
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.core.db import SessionDep
from app.core.errors import AppError
from app.core.utils.data_validate import validate_init_data
from app.models import User
from app.services.demo_profile import create_demo_profile


async def get_current_user(
    session: SessionDep,
    x_max_init_data: str | None = Header(default=None),
    x_dev_user_id: int | None = Header(default=None),
) -> User | None:
    """Завиимость пользователя, которая проверяет кто делает запрос"""

    if x_max_init_data:
        data = validate_init_data(
            x_max_init_data,
            settings.bot_settings.max_bot_token,
            settings.bot_settings.init_data_ttl,
        )
        user = data["user"]
        max_user_id = int(user.get("id"))
        profile = {
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "username": user.get("username"),
            "photo_url": user.get("photo_url"),
        }
        start_param = data.get("start_param")
    elif settings.dev_settings.auth_dev_mode and x_dev_user_id:
        max_user_id = x_dev_user_id
        profile = {
            "first_name": "Иван",
            "last_name": "Иванов",
            "username": "ivanov",
            "photo_url": None,
        }
        start_param = None  # pyright: ignore[reportUnusedVariable]  # noqa: F841
    else:
        raise AppError(401, "Unauthorized")

    stmt = (
        insert(User)
        .values(
            max_user_id=max_user_id, referral_code=secrets.token_urlsafe(6), **profile
        )
        .on_conflict_do_nothing(index_elements=[User.max_user_id])
        .returning(User.id)
    )
    result = await session.execute(stmt)
    created_id = result.scalar_one_or_none()
    query_result = await session.execute(
        select(User).where(User.max_user_id == max_user_id)
    )
    user = query_result.scalar_one_or_none()
    if created_id:
        await create_demo_profile(session, user)
    else:
        for k, v in profile.items():
            setattr(user, k, v)
    await session.commit()
    return user
