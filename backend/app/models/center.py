from sqlalchemy import Double, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.mixins import IDMixin


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
