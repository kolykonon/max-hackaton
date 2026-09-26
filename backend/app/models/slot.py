from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, UniqueConstraint, false
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import DonationType, donation_type_enum
from app.models.mixins import IDMixin


class Slot(Base, IDMixin):
    """ORM модель слота записи из тзшки"""

    __tablename__ = "slots"

    center_id: Mapped[int] = mapped_column(
        ForeignKey("centers.id", ondelete="CASCADE"),
        nullable=False,
    )
    donation_type: Mapped[DonationType] = mapped_column(
        donation_type_enum,
        nullable=False,
    )
    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    is_blocked: Mapped[bool] = mapped_column(
        Boolean(),
        nullable=False,
        default=False,
        server_default=false(),
    )

    __table_args__ = (
        # один слот на центр/вид/время; индекс заодно покрывает выборку
        # слотов центра по виду донации и дате
        UniqueConstraint(
            "center_id",
            "donation_type",
            "starts_at",
            name="uq_slots_center_type_starts_at",
        ),
    )
