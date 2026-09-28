# Источники геоданных

Выгрузка: 23 сентября 2026 года.

Основной источник: **© OpenStreetMap contributors**, лицензия **Open Database License (ODbL) 1.0**.

- Атрибуция: https://www.openstreetmap.org/copyright
- Лицензия базы: https://opendatacommons.org/licenses/odbl/1-0/

## Карта субъектов РФ — `frontend/src/assets/geo/russia.topo.json`

Собирается скриптом `scripts/build_russia_map.py` (запуск: `python3 scripts/build_russia_map.py`, нужны curl и Node.js).

- 85 субъектов — выгрузка OpenStreetMap из https://github.com/timurkanaz/Russia_geojson_OSM;
- ДНР, ЛНР, Запорожская и Херсонская области — отношения OpenStreetMap `admin_level=4` (ISO3166-2 UA-14, UA-09, UA-23, UA-65) через Overpass API.

Геометрия упрощена mapshaper до ~4% точек, острова меньше 30 км² убраны. У каждого региона `id` и свойство `code` — код субъекта, совпадающий с `Region.code` в API: ISO 3166-2:RU, а для субъектов без ISO-кода — RU-CR, RU-SEV, RU-DPR, RU-LPR, RU-ZAP, RU-KHE. Данные распространяются на условиях ODbL 1.0, в интерфейсе карты указана атрибуция © OpenStreetMap contributors.

## Подложка интерактивных карт

Экран «Карта» и вкладка «Карта» на шаге 3 записи используют MapLibre GL JS с векторными тайлами OpenFreeMap (https://openfreemap.org, стиль `positron`): бесплатно, без ключа и лимитов, данные © OpenMapTiles и © OpenStreetMap contributors. Атрибуцию показывает сама карта (кнопка «i» в углу).
