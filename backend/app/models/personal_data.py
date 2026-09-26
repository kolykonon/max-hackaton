from sqlalchemy import Boolean, ForeignKey, String, false
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.mixins import UpdatedAtMixin


class PersonalData(Base, UpdatedAtMixin):
    """ORM модель личных данных пользователя из тзшки."""

    __tablename__ = "personal_data"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    last_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    first_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    middle_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    passport_series: Mapped[str | None] = mapped_column(
        String(4),
        nullable=True,
    )
    passport_number: Mapped[str | None] = mapped_column(
        String(6),
        nullable=True,
    )
    passport_issued_by: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
    )
    passport_division_code: Mapped[str | None] = mapped_column(
        String(7),
        nullable=True,
    )

    oms_number: Mapped[str | None] = mapped_column(
        String(16),
        nullable=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(12),
        nullable=True,
    )
    email: Mapped[str | None] = mapped_column(
        String(254),
        nullable=True,
    )

    is_demo: Mapped[bool] = mapped_column(
        Boolean(),
        nullable=False,
        default=False,
        server_default=false(),
    )
