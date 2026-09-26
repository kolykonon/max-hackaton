import datetime as dt
from typing import ClassVar

from app.api.stub.data import CENTERS, DemoCenter
from app.api.stub.state import StubState
from app.core.errors import AppError
from app.core.utils.dates import MSK, now_msk, today_msk
from app.models.enums import DonationType
from app.schemas.booking import Slot, SlotGroup, SlotPeriod
from app.schemas.common import ErrorCode


class SlotCalendar:
    TIME_FORMAT = "%Y%m%d%H%M"
    TYPE_CODES: ClassVar[dict[DonationType, str]] = {
        DonationType.WHOLE_BLOOD: "1",
        DonationType.PLASMA: "2",
    }
    TYPES_BY_CODE: ClassVar[dict[str, DonationType]] = {
        code: t for t, code in TYPE_CODES.items()
    }
    FULLY_BOOKED_DAY_OFFSET = 20
    MORNING_HOURS = range(8, 14)
    EVENING_HOURS = range(17, 19)
    STEP_MINUTES = (0, 15, 30, 45)

    def __init__(self, state: StubState) -> None:
        self._state = state

    def get_center(self, center_id: int) -> DemoCenter:
        center = next((c for c in CENTERS if c.id == center_id), None)
        if center is None:
            raise AppError(404, ErrorCode.NOT_FOUND, "Центр не найден")
        return center

    def is_working_day(self, day: dt.date) -> bool:
        fully_booked = today_msk() + dt.timedelta(days=self.FULLY_BOOKED_DAY_OFFSET)
        return day.weekday() != 6 and day != fully_booked

    def encode_slot_id(
        self, center_id: int, donation_type: DonationType, starts_at: dt.datetime
    ) -> int:
        type_code = self.TYPE_CODES[donation_type]
        return int(f"{center_id}{type_code}{starts_at:{self.TIME_FORMAT}}")

    def decode_slot_id(
        self, slot_id: int
    ) -> tuple[DemoCenter, DonationType, dt.datetime]:
        raw = str(slot_id)
        try:
            center = self.get_center(int(raw[:-13]))
            donation_type = self.TYPES_BY_CODE[raw[-13]]
            starts_at = dt.datetime.strptime(raw[-12:], self.TIME_FORMAT).replace(
                tzinfo=MSK
            )
        except (ValueError, KeyError, AppError):
            raise AppError(404, ErrorCode.SLOT_NOT_FOUND, "Слот не найден") from None
        return center, donation_type, starts_at

    def groups(
        self, center: DemoCenter, donation_type: DonationType, day: dt.date
    ) -> list[SlotGroup]:
        if not self.is_working_day(day):
            return []
        taken_id = self._taken_slot_id()
        groups: dict[SlotPeriod, list[Slot]] = {}
        for time in self._times(center):
            starts_at = dt.datetime.combine(day, time, tzinfo=MSK)
            slot_id = self.encode_slot_id(center.id, donation_type, starts_at)
            is_free = (
                starts_at > now_msk()
                and not self._is_demo_busy(center, day, time)
                and slot_id != taken_id
            )
            groups.setdefault(self._period(time), []).append(
                Slot(
                    id=slot_id,
                    starts_at=starts_at,
                    local_time=f"{time:%H:%M}",
                    is_free=is_free,
                )
            )
        return [SlotGroup(period=p, slots=s) for p, s in groups.items()]

    def free_count(
        self, center: DemoCenter, donation_type: DonationType, day: dt.date
    ) -> int:
        groups = self.groups(center, donation_type, day)
        return sum(slot.is_free for group in groups for slot in group.slots)

    def _times(self, center: DemoCenter) -> list[dt.time]:
        hours = list(self.MORNING_HOURS)
        if center.has_evening:
            hours += list(self.EVENING_HOURS)
        return [dt.time(h, m) for h in hours for m in self.STEP_MINUTES]

    @staticmethod
    def _period(time: dt.time) -> SlotPeriod:
        if time.hour < 12:
            return SlotPeriod.MORNING
        if time.hour < 17:
            return SlotPeriod.DAY
        return SlotPeriod.EVENING

    @staticmethod
    def _is_demo_busy(center: DemoCenter, day: dt.date, time: dt.time) -> bool:
        return (time.hour * 4 + time.minute // 15 + center.id + day.day) % 3 == 0

    def _taken_slot_id(self) -> int | None:
        taken = self._state.appointment
        if taken is None:
            return None
        return self.encode_slot_id(
            taken.center.id, taken.donation_type, taken.starts_at
        )
