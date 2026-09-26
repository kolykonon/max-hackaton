from dataclasses import dataclass

from app.models.enums import StockStatus
from app.schemas.profile import PersonalDataInput
from app.schemas.regions import Region


@dataclass(frozen=True)
class DemoCenter:
    id: int
    name: str
    address: str
    lat: float
    lon: float
    group_status: StockStatus | None
    has_evening: bool


DEMO_PERSONAL_DATA = PersonalDataInput(
    last_name="Иванов",
    first_name="Иван",
    middle_name="Иванович",
    passport_series="4510",
    passport_number="123456",
    passport_issued_by="ГУ МВД России по г. Москве",
    passport_division_code="770-001",
    oms_number="1234567890123456",
    phone="+79001234567",
    email="ivanov@mail.ru",
)

REGIONS = sorted(
    [
        Region(id=1, code="RU-AD", name="Адыгея", has_centers=True),
        Region(id=50, code="RU-MOS", name="Московская область", has_centers=True),
        Region(id=77, code="RU-MOW", name="Москва", has_centers=True),
        Region(id=78, code="RU-SPE", name="Санкт-Петербург", has_centers=True),
        Region(id=16, code="RU-TA", name="Татарстан", has_centers=True),
        Region(
            id=87, code="RU-CHU", name="Чукотский автономный округ", has_centers=False
        ),
    ],
    key=lambda r: r.name,
)

MOSCOW = next(r for r in REGIONS if r.code == "RU-MOW")

CENTERS = [
    DemoCenter(
        1,
        "Центр крови ФМБА России",
        "ул. Поликарпова, 14",
        55.7766,
        37.5305,
        StockStatus.LOW,
        True,
    ),
    DemoCenter(
        2,
        "Донорский пункт №1 (демо)",
        "ул. Примерная, 1",
        55.7512,
        37.6184,
        StockStatus.URGENT,
        False,
    ),
    DemoCenter(
        3,
        "Станция переливания крови (демо)",
        "пр-т Демонстрационный, 10",
        55.6900,
        37.5600,
        None,
        False,
    ),
]

DONATION_CENTER_NAMES = ["Центр крови ФМБА России", "Донорский пункт (демо)"]
