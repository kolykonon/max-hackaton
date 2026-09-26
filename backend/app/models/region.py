from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.mixins import IDMixin


class Region(Base, IDMixin):
    """ORM модель субъекта РФ из тзшки"""

    __tablename__ = "regions"

    code: Mapped[str] = mapped_column(
        String(8),
        unique=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    timezone: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
