from dataclasses import dataclass

from app.schemas.appointments import Appointment
from app.schemas.profile import PersonalDataInput


@dataclass
class StubState:
    onboarding_completed: bool = False
    personal_data: PersonalDataInput | None = None
    appointment: Appointment | None = None

    def reset(self) -> None:
        self.onboarding_completed = False
        self.personal_data = None
        self.appointment = None
