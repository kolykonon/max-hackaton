import datetime as dt

from pydantic import Field

from app.models.enums import DonationType
from app.schemas.common import LocalTime, Schema


class SlotRequest(Schema):
    slot_id: int


class CreateAppointmentRequest(SlotRequest):
    invite_code: str | None = Field(default=None, max_length=16)


class AppointmentCenter(Schema):
    id: int
    name: str
    address: str
    region_id: int


class Appointment(Schema):
    id: int
    donation_type: DonationType
    starts_at: dt.datetime
    local_date: dt.date
    local_time: LocalTime
    center: AppointmentCenter


class AppointmentResponse(Schema):
    appointment: Appointment | None


class InviteLink(Schema):
    code: str
    link: str


class Invite(Schema):
    code: str
    inviter_name: str
    is_own: bool
    appointment: Appointment
