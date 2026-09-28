"""Определение субъекта РФ по координатам: point in polygon по границам из seeds/russia.geojson.

Границы собирает scripts/build_russia_map.py (OpenStreetMap), у каждого полигона
code — тот же, что Region.code. Грузим один раз при первом запросе и держим в памяти.
"""

import json
from functools import lru_cache
from pathlib import Path

from shapely import STRtree
from shapely.geometry import Point, shape
from shapely.ops import nearest_points

from app.core.utils.geo import distance_km

BOUNDARIES_PATH = Path(__file__).resolve().parent.parent / "seeds" / "russia.geojson"

# Точка у берега или на острове, которого нет в упрощённых границах, не попадёт ни в один
# полигон. Если ближайший регион ближе этого — считаем, что человек в нём
NEAREST_MAX_KM = 10.0


class RegionLocator:
    def __init__(self, features: list[dict]) -> None:
        self._codes = [f["properties"]["code"] for f in features]
        self._polygons = [shape(f["geometry"]) for f in features]
        self._tree = STRtree(self._polygons)

    def find_code(self, lat: float, lon: float) -> str | None:
        """Код региона (RU-MOW) или None, если точка вне России."""
        point = Point(lon, lat)  # у shapely порядок (x, y) = (долгота, широта)

        for index in self._tree.query(point, predicate="within"):
            return self._codes[int(index)]

        index = int(self._tree.nearest(point))
        nearest = nearest_points(point, self._polygons[index])[1]
        if distance_km(lat, lon, nearest.y, nearest.x) <= NEAREST_MAX_KM:
            return self._codes[index]
        return None


@lru_cache(maxsize=1)
def get_region_locator() -> RegionLocator:
    with BOUNDARIES_PATH.open(encoding="utf-8") as f:
        return RegionLocator(json.load(f)["features"])
