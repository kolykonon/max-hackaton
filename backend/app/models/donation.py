from datetime import date

from sqlalchemy import Boolean, Date, Enum, ForeignKey, String, false
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import DonationType
from app.models.mixins import IDMixin


class Donation(Base, IDMixin):
    """ORM модель донации из тзшки"""

    __tablename__ = "donations"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    donation_type: Mapped[DonationType] = mapped_column(
        Enum(
            DonationType,
            name="donation_type",
            values_callable=lambda e: [member.value for member in e],
        ),
        nullable=False,
    )
    donated_on: Mapped[date] = mapped_column(
        Date(),
        nullable=False,
    )
    center_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    is_demo: Mapped[bool] = mapped_column(
        Boolean(),
        nullable=False,
        default=False,
        server_default=false(),
    )
