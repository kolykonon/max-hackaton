from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import (
    BloodGroup,
    StockStatus,
    blood_group_enum,
    stock_status_enum,
)
from app.models.mixins import UpdatedAtMixin


class RegionBloodStatus(Base, UpdatedAtMixin):
    """ORM модель запасов крови по региону (карта-светофор) из тзшки."""

    __tablename__ = "region_blood_status"

    region_id: Mapped[int] = mapped_column(
        ForeignKey("regions.id", ondelete="CASCADE"),
        primary_key=True,
    )
    blood_group: Mapped[BloodGroup] = mapped_column(
        blood_group_enum,
        primary_key=True,
    )
    status: Mapped[StockStatus] = mapped_column(
        stock_status_enum,
        nullable=False,
    )


class CenterBloodStatus(Base):
    """ORM модель запасов крови по центру из тзшки."""

    __tablename__ = "center_blood_status"

    center_id: Mapped[int] = mapped_column(
        ForeignKey("centers.id", ondelete="CASCADE"),
        primary_key=True,
    )
    blood_group: Mapped[BloodGroup] = mapped_column(
        blood_group_enum,
        primary_key=True,
    )
    status: Mapped[StockStatus] = mapped_column(
        stock_status_enum,
        nullable=False,
    )
