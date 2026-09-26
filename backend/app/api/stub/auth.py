from typing import Annotated

from fastapi import Depends, Header

from app.models import User


async def stub_current_user(
    x_max_init_data: str | None = Header(default=None),
    x_dev_user_id: int | None = Header(default=None),
) -> User:
    return User(
        id=1,
        max_user_id=x_dev_user_id or 1,
        first_name="Иван",
        last_name="Иванов",
        username="ivanov",
        photo_url=None,
        referral_code="demo42",
    )


CurrentUser = Annotated[User, Depends(stub_current_user)]
