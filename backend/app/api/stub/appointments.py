from app.api.stub.data import MOSCOW
from app.api.stub.profile import StubProfileService
from app.api.stub.slots import SlotCalendar
from app.api.stub.state import StubState
from app.core.errors import AppError
from app.core.utils.dates import now_msk
from app.models import User
from app.schemas.appointments import Appointment, AppointmentCenter
from app.schemas.common import ErrorCode


class StubAppointmentService:
    def __init__(
        self,
        state: StubState,
        profile: StubProfileService,
        calendar: SlotCalendar,
    ) -> None:
        self._state = state
        self._profile = profile
        self._calendar = calendar

    async def get_current(self, user: User) -> Appointment | None:
        return self._state.appointment

    async def create(self, user: User, slot_id: int) -> Appointment:
        if self._state.appointment is not None:
            raise AppError(409, ErrorCode.ACTIVE_EXISTS, "У вас уже есть запись")
        return await self._book(user, slot_id, appointment_id=1)

    async def reschedule(
        self, user: User, appointment_id: int, slot_id: int
    ) -> Appointment:
        current = self.get_active(appointment_id)
        self._state.appointment = None
        try:
            return await self._book(user, slot_id, appointment_id=current.id + 1)
        except AppError:
            self._state.appointment = current
            raise

    async def cancel(self, user: User, appointment_id: int) -> None:
        self.get_active(appointment_id)
        self._state.appointment = None

    def get_active(self, appointment_id: int) -> Appointment:
        current = self._state.appointment
        if current is None or current.id != appointment_id:
            raise AppError(404, ErrorCode.APPOINTMENT_NOT_FOUND, "Запись не найдена")
        return current

    async def _book(self, user: User, slot_id: int, appointment_id: int) -> Appointment:
        center, donation_type, starts_at = self._calendar.decode_slot_id(slot_id)
        if starts_at <= now_msk():
            raise AppError(409, ErrorCode.SLOT_TAKEN, "Это время уже заняли")
        next_allowed = await self._profile.get_next_allowed(user, donation_type)
        if starts_at.date() < next_allowed:
            raise AppError(
                422,
                ErrorCode.INTERVAL_NOT_PASSED,
                "Интервал после прошлой донации ещё не прошёл",
            )
        appointment = Appointment(
            id=appointment_id,
            donation_type=donation_type,
            starts_at=starts_at,
            local_date=starts_at.date(),
            local_time=f"{starts_at:%H:%M}",
            center=AppointmentCenter(
                id=center.id,
                name=center.name,
                address=center.address,
                region_id=MOSCOW.id,
            ),
        )
        self._state.appointment = appointment
        return appointment
