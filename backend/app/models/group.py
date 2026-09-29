from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import DonationType, donation_type_enum
from app.models.mixins import CreatedAtMixin, IDMixin


class DonationGroup(Base, IDMixin, CreatedAtMixin):
    """Групповая донация: общий центр, дата и вид донации.

    Каждый участник записывается на свой слот обычным флоу.
    """

    __tablename__ = "donation_groups"

    code: Mapped[str] = mapped_column(String(16), nullable=False)
    owner_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    center_id: Mapped[int] = mapped_column(
        ForeignKey("centers.id", ondelete="CASCADE"),
        nullable=False,
    )
    donation_type: Mapped[DonationType] = mapped_column(
        donation_type_enum,
        nullable=False,
    )
    # Локальная дата центра
    date: Mapped[date] = mapped_column(Date(), nullable=False)

    __table_args__ = (UniqueConstraint("code", name="uq_donation_groups_code"),)


class DonationGroupMember(Base):
    __tablename__ = "donation_group_members"

    group_id: Mapped[int] = mapped_column(
        ForeignKey("donation_groups.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
        server_default=func.now(),
    )
