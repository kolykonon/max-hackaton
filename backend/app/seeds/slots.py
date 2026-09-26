"""Генерация слотов на 60 дней вперёд.

Правило из ТЗ:
- пн–сб 08:00–14:00;
- у части центров ещё 17:00–19:00;
- 30–60% слотов занято;
- 1–2 дня в каждом центре заняты полностью;
- шаг между слотами — 15 минут (из §5.5).
"""
import asyncio
import logging
import random
import zlib
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.db import sessionmaker
from app.models import Center, Region, Slot

log = logging.getLogger(__name__)

DAYS_AHEAD = 60
SLOT_STEP_MIN = 15
MORNING_START = time(8, 0)
MORNING_END = time(14, 0)
EVENING_START = time(17, 0)
EVENING_END = time(19, 0)
DONATION_TYPES = ["whole_blood", "plasma"]


def _rng_for(center_id: int) -> random.Random:
    return random.Random(zlib.crc32(f"center:{center_id}".encode()))


def _center_has_evening(center_id: int) -> bool:
    return _rng_for(center_id).random() < 0.3


def _fully_booked_days(center_id: int, today: date) -> set[date]:
    rng = _rng_for(center_id + 1000)
    n = rng.randint(1, 2)
    return {today + timedelta(days=rng.randint(1, DAYS_AHEAD - 1)) for _ in range(n)}


def _iter_slots_for_day(
    center_id: int,
    day: date,
    tz: ZoneInfo,
    has_evening: bool,
) -> list[tuple[str, datetime]]:
    slots: list[tuple[str, datetime]] = []

    def _add_range(start: time, end: time) -> None:
        current = datetime.combine(day, start, tzinfo=tz)
        finish = datetime.combine(day, end, tzinfo=tz)
        while current < finish:
            for dtype in DONATION_TYPES:
                slots.append((dtype, current.astimezone(timezone.utc)))
            current += timedelta(minutes=SLOT_STEP_MIN)

    _add_range(MORNING_START, MORNING_END)
    if has_evening:
        _add_range(EVENING_START, EVENING_END)

    return slots


async def generate_slots(reset: bool = True) -> None:
    today = date.today()

    async with sessionmaker() as session:
        if reset:
            log.info("Удаляем все существующие слоты")
            await session.execute(delete(Slot))
            await session.commit()

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
                for dtype, starts_at_utc in _iter_slots_for_day(
                    center_id, day, tz, has_evening
                ):
                    if full_day:
                        is_blocked = True
                    else:
                        is_blocked = rng.random() < rng.uniform(0.3, 0.6)

                    all_values.append(
                        {
                            "center_id": center_id,
                            "donation_type": dtype,
                            "starts_at": starts_at_utc,
                            "is_blocked": is_blocked,
                        }
                    )

        log.info("Сгенерировано слотов: %s", len(all_values))

        BATCH = 5000
        for i in range(0, len(all_values), BATCH):
            batch = all_values[i : i + BATCH]
            stmt = pg_insert(Slot).values(batch)
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