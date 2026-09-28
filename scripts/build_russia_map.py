#!/usr/bin/env python3
"""Сборка границ 89 субъектов РФ:
  - frontend/src/assets/geo/russia.topo.json — карта на фронте (TopoJSON, сильно упрощена);
  - backend/app/seeds/russia.geojson — /regions/locate на бэке (GeoJSON, подробнее — точнее у границ).

Источники — OpenStreetMap (ODbL, © OpenStreetMap contributors):
  1. 85 субъектов — выгрузка OSM из github.com/timurkanaz/Russia_geojson_OSM;
  2. ДНР, ЛНР, Запорожская и Херсонская области — границы областей из OSM через Overpass
     (по Конституции РФ границы субъектов совпадают с границами этих областей).

У каждого региона свойство `code` — такой же код, как `Region.code` в API (/regions, /map/status).
Упрощение и перевод в TopoJSON — mapshaper (npx), нужен Node.js.

Запуск из корня репозитория: python3 scripts/build_russia_map.py
"""

import json
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "frontend" / "src" / "assets" / "geo" / "russia.topo.json"
BACKEND_OUTPUT = ROOT / "backend" / "app" / "seeds" / "russia.geojson"

REGIONS_URL = (
    "https://raw.githubusercontent.com/timurkanaz/Russia_geojson_OSM/master/"
    "GeoJson's/Countries/Russia_regions.geojson"
)
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
OVERPASS_QUERY = (
    '[out:json][timeout:240];'
    'rel["boundary"="administrative"]["admin_level"="4"]["ISO3166-2"~"^UA-(14|09|23|65)$"];'
    "out geom;"
)
USER_AGENT = "kaplya-hackathon-map-build/1.0"

# Процент точек, который оставляет mapshaper. Для фронта — чтобы файл был около 500 КБ
SIMPLIFY = "4%"
# Бэк грузит границы один раз в память, размер не важен — оставляем больше точек
BACKEND_SIMPLIFY = "12%"

# Коды ISO 3166-2:RU. Для субъектов, которых нет в ISO, — коды проекта; должны совпадать с сидами бэка
CODES = {
    "Алтайский край": "RU-ALT",
    "Амурская обл.": "RU-AMU",
    "Архангельская обл.": "RU-ARK",
    "Астраханская обл.": "RU-AST",
    "Белгородская обл.": "RU-BEL",
    "Брянская обл.": "RU-BRY",
    "Владимирская обл.": "RU-VLA",
    "Волгоградская обл.": "RU-VGG",
    "Вологодская обл.": "RU-VLG",
    "Воронежская обл.": "RU-VOR",
    "Еврейская АО": "RU-YEV",
    "Забайкальский край": "RU-ZAB",
    "Ивановская обл.": "RU-IVA",
    "Иркутская обл.": "RU-IRK",
    "Кабардино-Балкарская Республика": "RU-KB",
    "Калининградская обл.": "RU-KGD",
    "Калужская обл.": "RU-KLU",
    "Камчатский край": "RU-KAM",
    "Карачаево-Черкесская Республика": "RU-KC",
    "Кемеровская обл. - Кузбасс": "RU-KEM",
    "Кировская обл.": "RU-KIR",
    "Костромская обл.": "RU-KOS",
    "Краснодарский край": "RU-KDA",
    "Красноярский край": "RU-KYA",
    "Курганская обл.": "RU-KGN",
    "Курская обл.": "RU-KRS",
    "Ленинградская обл.": "RU-LEN",
    "Липецкая обл.": "RU-LIP",
    "Магаданская обл.": "RU-MAG",
    "Московская обл.": "RU-MOS",
    "Мурманская обл.": "RU-MUR",
    "Ненецкий АО": "RU-NEN",
    "Нижегородская обл.": "RU-NIZ",
    "Новгородская обл.": "RU-NGR",
    "Новосибирская обл.": "RU-NVS",
    "Омская обл.": "RU-OMS",
    "Оренбургская обл.": "RU-ORE",
    "Орловская обл.": "RU-ORL",
    "Пензенская обл.": "RU-PNZ",
    "Пермский край": "RU-PER",
    "Приморский край": "RU-PRI",
    "Псковская обл.": "RU-PSK",
    "Республика Адыгея (Адыгея)": "RU-AD",
    "Республика Алтай": "RU-AL",
    "Республика Башкортостан": "RU-BA",
    "Республика Бурятия": "RU-BU",
    "Республика Дагестан": "RU-DA",
    "Республика Ингушетия": "RU-IN",
    "Республика Калмыкия": "RU-KL",
    "Республика Карелия": "RU-KR",
    "Республика Коми": "RU-KO",
    "Республика Крым": "RU-CR",
    "Республика Марий Эл": "RU-ME",
    "Республика Мордовия": "RU-MO",
    "Республика Саха (Якутия)": "RU-SA",
    "Республика Северная Осетия - Алания": "RU-SE",
    "Республика Татарстан (Татарстан)": "RU-TA",
    "Республика Тыва": "RU-TY",
    "Республика Хакасия": "RU-KK",
    "Ростовская обл.": "RU-ROS",
    "Рязанская обл.": "RU-RYA",
    "Самарская обл.": "RU-SAM",
    "Саратовская обл.": "RU-SAR",
    "Сахалинская обл.": "RU-SAK",
    "Свердловская обл.": "RU-SVE",
    "Смоленская обл.": "RU-SMO",
    "Ставропольский край": "RU-STA",
    "Тамбовская обл.": "RU-TAM",
    "Тверская обл.": "RU-TVE",
    "Томская обл.": "RU-TOM",
    "Тульская обл.": "RU-TUL",
    "Тюменская обл.": "RU-TYU",
    "Удмуртская Республика": "RU-UD",
    "Ульяновская обл.": "RU-ULY",
    "Хабаровский край": "RU-KHA",
    "Ханты-Мансийский АО - Югра": "RU-KHM",
    "Челябинская обл.": "RU-CHE",
    "Чеченская Республика": "RU-CE",
    "Чувашская Республика - Чувашия": "RU-CU",
    "Чукотский АО": "RU-CHU",
    "Ямало-Ненецкий АО": "RU-YAN",
    "Ярославская обл.": "RU-YAR",
    "г. Москва": "RU-MOW",
    "г. Санкт-Петербург": "RU-SPE",
    "город федерального значения Севастополь": "RU-SEV",
}

# Области из Overpass: ISO-код области в OSM → код субъекта в проекте
NEW_REGIONS = {
    "UA-14": "RU-DPR",  # Донецкая Народная Республика
    "UA-09": "RU-LPR",  # Луганская Народная Республика
    "UA-23": "RU-ZAP",  # Запорожская область
    "UA-65": "RU-KHE",  # Херсонская область
}

EXPECTED_COUNT = 89


def fetch(url: str, data: bytes | None = None) -> bytes:
    """Скачивание через curl: у Python с python.org на macOS часто нет корневых сертификатов."""
    command = ["curl", "--fail", "--silent", "--show-error", "--location", "--max-time", "300", "-A", USER_AGENT]
    if data is not None:
        command += ["--data-binary", "@-"]
    return subprocess.run([*command, url], input=data, check=True, capture_output=True).stdout


def load_regions() -> list[dict]:
    print("Скачиваю 85 субъектов…")
    source = json.loads(fetch(REGIONS_URL))
    features = []
    for feature in source["features"]:
        name = feature["properties"]["region"]
        if name not in CODES:
            sys.exit(f"Нет кода для региона «{name}» — добавьте его в CODES")
        features.append({"type": "Feature", "properties": {"code": CODES[name]}, "geometry": feature["geometry"]})
    return features


def load_new_regions(workdir: Path) -> list[dict]:
    print("Скачиваю ДНР, ЛНР, Запорожскую и Херсонскую области из Overpass…")
    raw = fetch(OVERPASS_URL, urllib.parse.urlencode({"data": OVERPASS_QUERY}).encode())
    osm_path = workdir / "new_regions.osm.json"
    osm_path.write_bytes(raw)
    # osmtogeojson собирает полигоны отношений из линий-границ
    converted = subprocess.run(
        ["npx", "-y", "osmtogeojson@3.0.0-beta.5", str(osm_path)],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    features = []
    for feature in json.loads(converted)["features"]:
        iso = feature["properties"].get("ISO3166-2")
        if iso in NEW_REGIONS and feature["geometry"]["type"] in ("Polygon", "MultiPolygon"):
            features.append(
                {"type": "Feature", "properties": {"code": NEW_REGIONS[iso]}, "geometry": feature["geometry"]}
            )
    return features


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        workdir = Path(tmp)
        features = load_regions() + load_new_regions(workdir)

        codes = [f["properties"]["code"] for f in features]
        if len(set(codes)) != EXPECTED_COUNT:
            sys.exit(f"Ожидалось {EXPECTED_COUNT} субъектов, получилось {len(set(codes))}")

        merged = workdir / "russia.geojson"
        merged.write_text(json.dumps({"type": "FeatureCollection", "features": features}), encoding="utf-8")

        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        print(f"Упрощаю до {SIMPLIFY} точек и сохраняю TopoJSON…")
        subprocess.run(
            [
                "npx", "-y", "mapshaper@0.7.68",
                str(merged),
                "-simplify", SIMPLIFY, "weighted", "keep-shapes",
                # Мелкие острова без заметной площади только утяжеляют файл
                "-filter-islands", "min-area=30km2", "remove-empty",
                "-o", "format=topojson", "quantization=1e5", f"id-field=code", str(OUTPUT),
            ],
            check=True,
        )

        print(f"Упрощаю до {BACKEND_SIMPLIFY} точек и сохраняю GeoJSON для бэка…")
        subprocess.run(
            [
                "npx", "-y", "mapshaper@0.7.68",
                str(merged),
                "-simplify", BACKEND_SIMPLIFY, "weighted", "keep-shapes",
                # Острова оставляем почти все: точка на острове должна найти свой регион
                "-filter-islands", "min-area=1km2", "remove-empty",
                # 4 знака после запятой — около 10 м, точнее не нужно
                "-o", "format=geojson", "precision=0.0001", str(BACKEND_OUTPUT),
            ],
            check=True,
        )

    for path in (OUTPUT, BACKEND_OUTPUT):
        print(f"Готово: {path.relative_to(ROOT)} ({path.stat().st_size / 1024:.0f} КБ, {EXPECTED_COUNT} субъектов)")


if __name__ == "__main__":
    main()
