from enum import StrEnum

from sqlalchemy import Enum


class BloodGroup(StrEnum):
    """Группа крови и резус"""

    O_POS = "1+"
    O_NEG = "1-"
    A_POS = "2+"
    A_NEG = "2-"
    B_POS = "3+"
    B_NEG = "3-"
    AB_POS = "4+"
    AB_NEG = "4-"


class DonationType(StrEnum):
    """Вид донации: цельная кровь или плазма."""

    WHOLE_BLOOD = "whole_blood"
    PLASMA = "plasma"


class StockStatus(StrEnum):
    """Запас крови группы: нет строки в таблице — «нет данных»."""

    URGENT = "urgent"
    LOW = "low"
    ENOUGH = "enough"


class AppointmentStatus(StrEnum):
    """Статус записи на донацию."""

    ACTIVE = "active"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    COMPLETED = "completed"


def _pg_enum(
    enum_cls: type[StrEnum], name: str
) -> Enum:  # чтобы не писать везде values callable и не хардкодить енум в модель
    return Enum(
        enum_cls,
        name=name,
        values_callable=lambda e: [member.value for member in e],
    )


blood_group_enum = _pg_enum(BloodGroup, "blood_group")
donation_type_enum = _pg_enum(DonationType, "donation_type")
stock_status_enum = _pg_enum(StockStatus, "stock_status")
appointment_status_enum = _pg_enum(AppointmentStatus, "appointment_status")
