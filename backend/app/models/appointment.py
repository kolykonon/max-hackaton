from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import (
    AppointmentStatus,
    DonationType,
    appointment_status_enum,
    donation_type_enum,
)
from app.models.mixins import CreatedAtMixin


class Appointment(Base, CreatedAtMixin):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    slot_id: Mapped[int] = mapped_column(ForeignKey("slots.id"), index=True)
    center_id: Mapped[int] = mapped_column(ForeignKey("centers.id"))
    donation_type: Mapped[DonationType] = mapped_column(donation_type_enum)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    status: Mapped[AppointmentStatus] = mapped_column(
        appointment_status_enum,
        default=AppointmentStatus.ACTIVE,
        server_default=AppointmentStatus.ACTIVE.value,
        index=True,
    )
    rescheduled_from_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id")
    )
    reminder_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        Index(
            "uq_active_user",
            "user_id",
            unique=True,
            postgresql_where=text("status = 'active'"),
        ),
    )
