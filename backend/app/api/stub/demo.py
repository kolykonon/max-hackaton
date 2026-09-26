from app.api.stub.appointments import StubAppointmentService
from app.api.stub.state import StubState
from app.models import User


class StubDemoService:
    def __init__(self, state: StubState, appointments: StubAppointmentService) -> None:
        self._state = state
        self._appointments = appointments

    async def reset(self, user: User) -> None:
        self._state.reset()

    async def remind(self, user: User, appointment_id: int) -> None:
        self._appointments.get_active(appointment_id)

    async def complete(self, user: User, appointment_id: int) -> None:
        self._appointments.get_active(appointment_id)
        self._state.appointment = None
