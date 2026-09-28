"""CSV службы крови -> app/seeds/centers.json (с геокодированием через Nominatim).

Запуск: python scripts/build_centers.py path/to/blood_stations_russia.csv
Координаты кэшируются в scripts/.geocache.json, повторный запуск быстрый.
Старые центры из centers.json с тем же адресом сохраняют свои координаты
и legacy_name (чтобы сид обновил строку, а не создал дубль).
"""

import csv
import json
import re
import sys
import time
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent
SEEDS = ROOT.parent / "app" / "seeds"
CACHE = ROOT / ".geocache.json"
REGION_ALIAS = {"г. Москва": "Москва", "г. Севастополь": "Севастополь"}
# Нормальная центроида РФ: всё, что вне, — мусор геокодера.
RU_BOX = (41.0, 19.0, 82.0, 180.0)  # lat_min, lon_min, lat_max, lon_max


def norm(s: str) -> str:
    return re.sub(r"[^0-9а-яё]", "", s.lower().replace("г.", "").replace("ул.", "").replace("д.", ""))


ABBR = {"ул.": "улица", "пр-т": "проспект", "пр.": "проспект", "пер.": "переулок",
        "б-р": "бульвар", "наб.": "набережная", "ш.": "шоссе", "пл.": "площадь"}


def clean(addr: str) -> str:
    """Nominatim не понимает «д.»/«корп.»/сокращения — раскрываем."""
    addr = re.sub(r"\bд\.\s*", "", addr)
    addr = re.sub(r",\s*корп\.\s*", " к", addr)
    for k, v in ABBR.items():
        addr = addr.replace(k, v)
    return addr


def geocode(client: httpx.Client, cache: dict, q: str):
    if q not in cache:
        time.sleep(1.1)  # ponytail: лимит Nominatim 1 rps
        r = client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": q, "format": "json", "limit": 1},
        )
        r.raise_for_status()
        j = r.json()
        cache[q] = [float(j[0]["lat"]), float(j[0]["lon"])] if j else None
        CACHE.write_text(json.dumps(cache, ensure_ascii=False))
    return cache[q]


def main(csv_path: str) -> None:
    regions = {r["name"]: r["code"] for r in json.loads((SEEDS / "regions.json").read_text())}
    # Старые (ручные) центры — без external_id; результат прошлых запусков не считаем.
    old = [o for o in json.loads((SEEDS / "centers.json").read_text()) if "external_id" not in o]
    old_by_addr = {(o["region_code"], norm(o["address"])): o for o in old}
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    rows = list(csv.DictReader(open(csv_path, encoding="utf-8-sig"), delimiter=";"))
    out, approx, failed, used_old = [], [], [], set()

    with httpx.Client(headers={"User-Agent": "kaplya-seed/1.0"}, timeout=30) as client:
        for r in rows:
            subj = REGION_ALIAS.get(r["Субъект РФ"], r["Субъект РФ"])
            code = regions[subj]  # KeyError = неизвестный регион, пусть падает громко
            city, street = r["Населённый пункт"], r["Адрес"]
            place = re.sub(r"^(р\.п\.|пгт|с\.|п\.|г\.)\s*", "", city)  # для геокодера
            full = f"{city}, {street}" if street else city
            hit = old_by_addr.get((code, norm(full)))
            if hit:
                used_old.add(id(hit))
                lat, lon, legacy = hit["lat"], hit["lon"], hit["name"]
            else:
                legacy = None
                pt = geocode(client, cache, clean(f"{place}, {street}"))
                if not pt:
                    pt = geocode(client, cache, f"{place}, {subj}")
                    approx.append(r["ID"])
                if not pt or not (RU_BOX[0] < pt[0] < RU_BOX[2] and RU_BOX[1] < pt[1] < RU_BOX[3]):
                    failed.append(r["ID"])
                    continue
                lat, lon = pt
            out.append({
                "external_id": r["ID"],
                "region_code": code,
                "name": r["Название"],
                "legacy_name": legacy,
                "address": full,
                "lat": lat,
                "lon": lon,
                "city": city,
                "center_type": r["Тип учреждения"],
                "phone": r["Телефон"],
                "work_hours": r["Часы приёма доноров"],
                "booking_info": r["Запись"],
                "donation_types": r["Виды донаций (подтверждено)"],
                "donor_requirements": r["Требования к донору"],
                "notes": r["Примечания / проверить"],
                "data_status": r["Статус данных"],
                "source_url": r["Источник 1"],
                "source_url_2": r["Источник 2 (часы, запись)"],
                "verified_on": r["Дата проверки"],
                "is_demo": False,
            })

    assert len(out) == len(rows) and len({o["external_id"] for o in out}) == len(out), "потеряны или задвоены центры"
    (SEEDS / "centers.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print(f"центров: {len(out)}/{len(rows)}; по городу (неточно): {len(approx)} {approx}")
    print(f"не найдены: {failed}")
    print("старые центры без пары в CSV:", [o["name"] for o in old if id(o) not in used_old])


if __name__ == "__main__":
    main(sys.argv[1])
