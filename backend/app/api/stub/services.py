from app.api.stub.appointments import StubAppointmentService
from app.api.stub.booking import StubBookingService
from app.api.stub.demo import StubDemoService
from app.api.stub.profile import StubProfileService
from app.api.stub.regions import StubRegionService
from app.api.stub.slots import SlotCalendar
from app.api.stub.state import StubState

state = StubState()
calendar = SlotCalendar(state)

profile_service = StubProfileService(state)
region_service = StubRegionService()
booking_service = StubBookingService(profile_service, region_service, calendar)
appointment_service = StubAppointmentService(state, profile_service, calendar)
demo_service = StubDemoService(state, appointment_service)
