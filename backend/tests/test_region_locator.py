"""Тесты определения региона по координатам (без БД)."""

import pytest

from app.services.region_locator import get_region_locator


@pytest.mark.parametrize(
    ("lat", "lon", "code"),
    [
        (55.7558, 37.6173, "RU-MOW"),  # Москва, Красная площадь
        (55.8890, 37.4450, "RU-MOS"),  # Химки
        (59.9386, 30.3141, "RU-SPE"),  # Санкт-Петербург
        (55.7963, 49.1088, "RU-TA"),  # Казань
        (54.7104, 20.4522, "RU-KGD"),  # Калининград
        (43.1155, 131.8855, "RU-PRI"),  # Владивосток
        (64.7337, 177.5089, "RU-CHU"),  # Анадырь
        (66.1600, -169.8100, "RU-CHU"),  # Уэлен — Чукотка за 180-м меридианом
        (44.9521, 34.1024, "RU-CR"),  # Симферополь
        (44.6166, 33.5254, "RU-SEV"),  # Севастополь
        (48.0159, 37.8029, "RU-DPR"),  # Донецк
    ],
)
def test_finds_region_by_point(lat, lon, code):
    assert get_region_locator().find_code(lat, lon) == code


def test_point_near_coast_goes_to_nearest_region():
    # Амурский залив у Владивостока — в воде, но в паре километров от берега
    assert get_region_locator().find_code(43.0800, 131.8500) == "RU-PRI"


@pytest.mark.parametrize(
    ("lat", "lon"),
    [
        (52.5200, 13.4050),  # Берлин
        (43.0000, 34.0000),  # середина Чёрного моря
        (41.7151, 44.8271),  # Тбилиси
    ],
)
def test_point_outside_russia(lat, lon):
    assert get_region_locator().find_code(lat, lon) is None
