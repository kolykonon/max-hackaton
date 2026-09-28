"""Идемпотентный сид: регионы, центры, статусы светофора.

Запуск: python -m app.seeds.seed (выполняется при старте backend).
Слоты только дополняются; полностью пересоздать их — python -m app.seeds.slots
"""

import asyncio
import json
import logging
import random
import zlib
from pathlib import Path

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.db import sessionmaker
from app.models import (
    Center,
    CenterBloodStatus,
    Region,
    RegionBloodStatus,
)
from app.models.enums import BloodGroup, StockStatus
from app.seeds.slots import generate_slots

log = logging.getLogger(__name__)

SEEDS_DIR = Path(__file__).resolve().parent
BLOOD_GROUPS = [g.value for g in BloodGroup]
STATUSES = [s.value for s in StockStatus]


def _load_json(name: str) -> list[dict]:
    path = SEEDS_DIR / name
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _region_statuses(region_code: str) -> dict[str, str]:
    """Детерминированный набор статусов: данные есть у всех регионов."""
    rng = random.Random(zlib.crc32(region_code.encode()))
    return {g: rng.choice(STATUSES) for g in BLOOD_GROUPS}


def _center_statuses(center_name: str) -> dict[str, str]:
    rng = random.Random(zlib.crc32(center_name.encode()))
    return {g: rng.choice(STATUSES) for g in BLOOD_GROUPS}


async def seed_regions(session) -> dict[str, int]:
    """Upsert регионов. Возвращает {code: id}."""
    data = _load_json("regions.json")
    log.info("Регионов во входных данных: %s", len(data))

    stmt = pg_insert(Region).values(
        [
            {"code": r["code"], "name": r["name"], "timezone": r["timezone"]}
            for r in data
        ]
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=[Region.code],
        set_={
            "name": stmt.excluded.name,
            "timezone": stmt.excluded.timezone,
        },
    )
    await session.execute(stmt)
    await session.commit()

    rows = (await session.execute(select(Region.id, Region.code))).all()
    return {code: rid for rid, code in rows}


async def seed_centers(session, region_ids: dict[str, int]) -> None:
    """Upsert центров из centers.json по паре (регион, название).

    Уникального индекса на centers нет, поэтому сначала читаем, что уже есть:
    существующие центры обновляем, новые вставляем. Повторный запуск дублей не создаёт.
    """
    data = _load_json("centers.json")
    log.info("Центров во входных данных: %s", len(data))

    existing = {
        (region_id, name): center_id
        for center_id, region_id, name in (
            await session.execute(select(Center.id, Center.region_id, Center.name))
        ).all()
    }

    to_insert = []
    updated = 0
    for c in data:
        region_id = region_ids.get(c["region_code"])
        if region_id is None:
            log.warning("Пропускаем центр — нет региона %s", c["region_code"])
            continue
        fields = {"address": c["address"], "lat": c["lat"], "lon": c["lon"]}
        center_id = existing.get((region_id, c["name"]))
        if center_id is None:
            to_insert.append(
                {"region_id": region_id, "name": c["name"], "photo_url": None, **fields}
            )
        else:
            await session.execute(
                update(Center).where(Center.id == center_id).values(**fields)
            )
            updated += 1

    if to_insert:
        await session.execute(pg_insert(Center).values(to_insert))
    await session.commit()
    log.info("Центров добавлено: %s, обновлено: %s", len(to_insert), updated)

    with_centers = {region_ids.get(c["region_code"]) for c in data}
    missing = sorted(
        code for code, rid in region_ids.items() if rid not in with_centers
    )
    if missing:
        log.warning("Регионы без центров крови: %s", ", ".join(missing))


async def seed_blood_statuses(session, region_ids: dict[str, int]) -> None:
    """Статусы светофора для регионов и центров. Детерминированные."""
    region_rows = []
    for code, rid in region_ids.items():
        for group, status in _region_statuses(code).items():
            region_rows.append(
                {"region_id": rid, "blood_group": group, "status": status}
            )

    if region_rows:
        stmt = pg_insert(RegionBloodStatus).values(region_rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=[
                RegionBloodStatus.region_id,
                RegionBloodStatus.blood_group,
            ],
            set_={"status": stmt.excluded.status},
        )
        await session.execute(stmt)

    centers = (await session.execute(select(Center.id, Center.name))).all()
    center_rows = []
    for cid, cname in centers:
        for group, status in _center_statuses(cname).items():
            center_rows.append(
                {"center_id": cid, "blood_group": group, "status": status}
            )

    if center_rows:
        stmt = pg_insert(CenterBloodStatus).values(center_rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=[
                CenterBloodStatus.center_id,
                CenterBloodStatus.blood_group,
            ],
            set_={"status": stmt.excluded.status},
        )
        await session.execute(stmt)

    await session.commit()


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    async with sessionmaker() as session:
        region_ids = await seed_regions(session)
        await seed_centers(session, region_ids)
        await seed_blood_statuses(session, region_ids)
    await generate_slots(reset=False)
    log.info("Сиды применены.")


if __name__ == "__main__":
    asyncio.run(main())
