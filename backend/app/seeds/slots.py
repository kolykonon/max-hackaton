"""Генерация слотов на 60 дней вперёд.

Правило из ТЗ:
- пн–сб 08:00–14:00;
- у части центров ещё 17:00–19:00;
- плазма — окна по 30 минут, одно окно — один человек;
- цельная кровь — один слот на день: время донор не выбирает;
- часть мест занята, 1–2 дня в каждом центре заняты полностью.
"""

import asyncio
import logging
import random
import zlib
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.db import sessionmaker
from app.models import Appointment, Center, Region, Slot

log = logging.getLogger(__name__)

DAYS_AHEAD = 60
PLASMA_STEP = timedelta(minutes=30)
PLASMA_CAPACITY = 1
WHOLE_BLOOD_DAY_CAPACITY = 40
MORNING_START = time(8, 0)
MORNING_END = time(14, 0)
EVENING_START = time(17, 0)
EVENING_END = time(19, 0)


def _rng_for(center_id: int) -> random.Random:
    return random.Random(zlib.crc32(f"center:{center_id}".encode()))


def _center_has_evening(center_id: int) -> bool:
    return _rng_for(center_id).random() < 0.3


def _fully_booked_days(center_id: int, today: date) -> set[date]:
    rng = _rng_for(center_id + 1000)
    n = rng.randint(1, 2)
    return {today + timedelta(days=rng.randint(1, DAYS_AHEAD - 1)) for _ in range(n)}


def _iter_slots_for_day(
    day: date, tz: ZoneInfo, has_evening: bool
) -> list[tuple[str, datetime, int]]:
    """(вид донации, начало в UTC, вместимость)."""

    def at(t: time) -> datetime:
        return datetime.combine(day, t, tzinfo=tz).astimezone(timezone.utc)

    slots = [("whole_blood", at(MORNING_START), WHOLE_BLOOD_DAY_CAPACITY)]

    def _add_plasma(start: time, end: time) -> None:
        current, finish = at(start), at(end)
        while current < finish:
            slots.append(("plasma", current, PLASMA_CAPACITY))
            current += PLASMA_STEP

    _add_plasma(MORNING_START, MORNING_END)
    if has_evening:
        _add_plasma(EVENING_START, EVENING_END)
    return slots


async def generate_slots(reset: bool = True) -> None:
    today = date.today()

    async with sessionmaker() as session:
        if reset:
            # ponytail: слоты с записями оставляем как есть (со старой вместимостью),
            # иначе FK appointments_slot_id_fkey; новые на то же время пропустит on_conflict
            log.info("Удаляем слоты без записей")
            await session.execute(delete(Slot).where(Slot.id.not_in(select(Appointment.slot_id))))
            await session.commit()
        else:
            latest = await session.scalar(select(func.max(Slot.starts_at)))
            # Новые центры из сида тоже должны получить слоты, иначе на карте их нет
            without_slots = await session.scalar(
                select(func.count(Center.id)).where(Center.id.not_in(select(Slot.center_id)))
            )
            if not without_slots and latest is not None and latest.date() >= today + timedelta(days=DAYS_AHEAD - 2):
                log.info("Слоты уже сгенерированы до %s, пропускаем", latest.date())
                return

        rows = (
            await session.execute(
                select(Center.id, Region.timezone).join(
                    Region, Region.id == Center.region_id
                )
            )
        ).all()
        log.info("Центров для генерации слотов: %s", len(rows))

        all_values: list[dict] = []
        for center_id, tz_name in rows:
            try:
                tz = ZoneInfo(tz_name)
            except Exception:
                log.warning(
                    "Неизвестная таймзона %s, используем Europe/Moscow", tz_name
                )
                tz = ZoneInfo("Europe/Moscow")

            has_evening = _center_has_evening(center_id)
            booked_days = _fully_booked_days(center_id, today)
            rng = _rng_for(center_id + 2000)

            for offset in range(DAYS_AHEAD):
                day = today + timedelta(days=offset)
                if day.weekday() == 6:  # воскресенье — выходной
                    continue

                full_day = day in booked_days
                for dtype, starts_at_utc, capacity in _iter_slots_for_day(
                    day, tz, has_evening
                ):
                    # ponytail: места, занятые не через приложение, моделируем
                    # уменьшенной вместимостью; настоящий учёт — из МИС центра
                    all_values.append(
                        {
                            "center_id": center_id,
                            "donation_type": dtype,
                            "starts_at": starts_at_utc,
                            "capacity": rng.randint(0, capacity),
                            "is_blocked": full_day,
                        }
                    )

        log.info("Сгенерировано слотов: %s", len(all_values))

        BATCH = 5000
        for i in range(0, len(all_values), BATCH):
            batch = all_values[i : i + BATCH]
            stmt = pg_insert(Slot).values(batch).on_conflict_do_nothing(
                constraint="uq_slots_center_type_starts_at"
            )
            await session.execute(stmt)
            await session.commit()
            log.info(
                "Вставлено %s / %s",
                min(i + BATCH, len(all_values)),
                len(all_values),
            )


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    await generate_slots(reset=True)
    log.info("Слоты сгенерированы.")


if __name__ == "__main__":
    asyncio.run(main())
