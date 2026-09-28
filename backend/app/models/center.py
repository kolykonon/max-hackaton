from sqlalchemy import Double, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.mixins import IDMixin


DETAIL_FIELDS = (
    "external_id", "city", "center_type", "phone", "work_hours", "booking_info",
    "donation_types", "donor_requirements", "notes", "data_status",
    "source_url", "source_url_2", "verified_on",
)


class Center(Base, IDMixin):
    """ORM модель центра крови из тзшки"""

    __tablename__ = "centers"

    region_id: Mapped[int] = mapped_column(
        ForeignKey("regions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    address: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )

    lat: Mapped[float] = mapped_column(
        Double(),
        nullable=False,
    )
    lon: Mapped[float] = mapped_column(
        Double(),
        nullable=False,
    )

    photo_url: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    # Подробности из реестра службы крови (CSV). Все необязательные.
    external_id: Mapped[str | None] = mapped_column(String(16), unique=True)
    city: Mapped[str | None] = mapped_column(String(255))
    center_type: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(255))
    work_hours: Mapped[str | None] = mapped_column(Text)
    booking_info: Mapped[str | None] = mapped_column(Text)
    donation_types: Mapped[str | None] = mapped_column(Text)
    donor_requirements: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    data_status: Mapped[str | None] = mapped_column(String(255))
    source_url: Mapped[str | None] = mapped_column(String(2048))
    source_url_2: Mapped[str | None] = mapped_column(String(2048))
    verified_on: Mapped[str | None] = mapped_column(String(10))
