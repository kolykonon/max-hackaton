"""Идемпотентный сид: регионы, центры, статусы светофора.

Запуск: python -m app.seeds.seed
"""

import asyncio
import json
import logging
import random
import zlib
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.db import sessionmaker
from app.models import (
    Center,
    CenterBloodStatus,
    Region,
    RegionBloodStatus,
)
from app.models.enums import BloodGroup, StockStatus

log = logging.getLogger(__name__)

SEEDS_DIR = Path(__file__).resolve().parent
BLOOD_GROUPS = [g.value for g in BloodGroup]
STATUSES = [s.value for s in StockStatus]


def _load_json(name: str) -> list[dict]:
    path = SEEDS_DIR / name
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _region_statuses(region_code: str) -> dict[str, str]:
    """~10% регионов без данных. Остальным — детерминированный набор."""
    rng = random.Random(zlib.crc32(region_code.encode()))
    if rng.random() < 0.1:
        return {}
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
    """Upsert центров. Реальные из centers.json + по одной заглушке на регион."""
    data = _load_json("centers.json")
    log.info("Центров во входных данных: %s", len(data))

    existing_names: set[tuple[int, str]] = set()
    values = []

    for c in data:
        region_id = region_ids.get(c["region_code"])
        if region_id is None:
            log.warning("Пропускаем центр — нет региона %s", c["region_code"])
            continue
        values.append(
            {
                "region_id": region_id,
                "name": c["name"],
                "address": c["address"],
                "lat": c["lat"],
                "lon": c["lon"],
                "photo_url": None,
            }
        )
        existing_names.add((region_id, c["name"]))

    # Заглушки для регионов без реальных центров
    regions_with_centers = {rid for rid, _ in existing_names}
    all_region_ids = set(region_ids.values())
    missing = all_region_ids - regions_with_centers
    if missing:
        name_by_id = {v: k for k, v in region_ids.items()}
        for rid in sorted(missing):
            values.append(
                {
                    "region_id": rid,
                    "name": f"Станция переливания крови ({name_by_id[rid]})",
                    "address": "адрес уточняется",
                    "lat": 0.0,
                    "lon": 0.0,
                    "photo_url": None,
                }
            )

    if values:
        stmt = pg_insert(Center).values(values)
        stmt = stmt.on_conflict_do_nothing()
        await session.execute(stmt)
        await session.commit()


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
    log.info("Сиды применены.")


if __name__ == "__main__":
    asyncio.run(main())
