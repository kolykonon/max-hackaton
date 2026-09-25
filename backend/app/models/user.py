from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import BloodGroup
from app.models.mixins import CreatedAtMixin, IDMixin


class User(Base, IDMixin, CreatedAtMixin):
    """ORM модель пользователя из тзшки"""

    __tablename__ = "users"

    max_user_id: Mapped[int] = mapped_column(
        BigInteger(),
        unique=True,
        nullable=False,
    )
    first_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    last_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    username: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    photo_url: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    onboarding_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    consent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    blood_group: Mapped[BloodGroup | None] = mapped_column(
        Enum(
            BloodGroup,
            name="blood_group",
            values_callable=lambda e: [member.value for member in e],
        ),
        nullable=True,
    )
    kell: Mapped[str | None] = mapped_column(
        String(2),
        nullable=True,
    )
    phenotype: Mapped[str | None] = mapped_column(
        String(16),
        nullable=True,
    )
    donor_code: Mapped[str | None] = mapped_column(
        String(9),
        nullable=True,
    )

    referral_code: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        nullable=False,
    )
    referred_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
