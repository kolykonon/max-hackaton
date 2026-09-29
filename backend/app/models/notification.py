from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.mixins import CreatedAtMixin, IDMixin


class NotificationLog(Base, IDMixin, CreatedAtMixin):
    """Журнал проактивных пушей: чтобы не слать одно и то же дважды.

    kind — вид пуша (interval_open, deficit, rest_day_14 …),
    key — чем отличаются пуши одного вида (дата, id донации).
    """

    __tablename__ = "notification_log"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    key: Mapped[str] = mapped_column(String(64), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "kind", "key", name="uq_notification_log"),
    )
