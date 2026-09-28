#!/usr/bin/env python3
"""Деление Москвы и Московской области на зоны для экрана «Карта»:
  frontend/src/assets/geo/moscow.topo.json — 132 района Москвы + 56 округов области.

Источники — OpenStreetMap (ODbL, © OpenStreetMap contributors):
  1. районы Москвы — legacy/russia-map/data/moscow-districts.geojson (как в прототипе карты России);
  2. городские и муниципальные округа области (admin_level=6) — Overpass.

У зоны свойства: code (RU-MOW-<osm id> / RU-MOS-<osm id>), name, parent — код субъекта.
Статус зоны фронт считает сам по центрам крови внутри неё.

Запуск из корня репозитория: python3 scripts/build_moscow_zones.py (нужен Node.js для npx)
"""

import json
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

from build_russia_map import OVERPASS_URL, ROOT, fetch

MOSCOW_DISTRICTS = ROOT / "legacy" / "russia-map" / "data" / "moscow-districts.geojson"
OUTPUT = ROOT / "frontend" / "src" / "assets" / "geo" / "moscow.topo.json"
OBLAST_QUERY = (
    '[out:json][timeout:240];area["ISO3166-2"="RU-MOS"]->.a;'
    'rel(area.a)["boundary"="administrative"]["admin_level"="6"];out geom;'
)
SIMPLIFY = "8%"
EXPECTED = {"RU-MOW": 132, "RU-MOS": 56}


def moscow() -> list[dict]:
    source = json.loads(MOSCOW_DISTRICTS.read_text(encoding="utf-8"))
    return [
        {
            "type": "Feature",
            "properties": {
                "code": f"RU-MOW-{f['properties']['id']}",
                "name": f"{f['properties']['name']}, {f['properties']['okrug']}",
                "parent": "RU-MOW",
            },
            "geometry": f["geometry"],
        }
        for f in source["features"]
    ]


def oblast(workdir: Path) -> list[dict]:
    print("Скачиваю округа Московской области из Overpass…")
    osm_path = workdir / "oblast.osm.json"
    osm_path.write_bytes(fetch(OVERPASS_URL, urllib.parse.urlencode({"data": OBLAST_QUERY}).encode()))
    converted = subprocess.run(
        ["npx", "-y", "osmtogeojson@3.0.0-beta.5", str(osm_path)], check=True, capture_output=True, text=True
    ).stdout
    return [
        {
            "type": "Feature",
            "properties": {"code": f"RU-MOS-{f['id'].split('/')[-1]}", "name": f["properties"]["name"], "parent": "RU-MOS"},
            "geometry": f["geometry"],
        }
        for f in json.loads(converted)["features"]
        if f["id"].startswith("relation/") and f["geometry"]["type"] in ("Polygon", "MultiPolygon")
    ]


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        workdir = Path(tmp)
        features = moscow() + oblast(workdir)
        for parent, count in EXPECTED.items():
            got = sum(f["properties"]["parent"] == parent for f in features)
            if got != count:
                sys.exit(f"{parent}: ожидалось {count} зон, получилось {got}")

        merged = workdir / "zones.geojson"
        merged.write_text(json.dumps({"type": "FeatureCollection", "features": features}), encoding="utf-8")
        subprocess.run(
            [
                "npx", "-y", "mapshaper@0.7.68",
                str(merged),
                "-simplify", SIMPLIFY, "weighted", "keep-shapes",
                "-o", "format=topojson", "quantization=1e5", "id-field=code", str(OUTPUT),
            ],
            check=True,
        )
    print(f"Готово: {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size / 1024:.0f} КБ, {len(features)} зон)")


if __name__ == "__main__":
    main()
