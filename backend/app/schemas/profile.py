import datetime as dt
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import Field

from app.models.enums import BloodGroup, DonationType
from app.schemas.common import Schema


class BloodInfo(Schema):
    group: BloodGroup | None
    kell: Literal["K+", "K-"] | None
    phenotype: str | None
    donor_code: str | None = Field(pattern=r"^\d{4}-\d{4}$")


class Me(Schema):
    id: int
    first_name: str
    last_name: str | None
    photo_url: str | None
    onboarding_completed: bool
    blood: BloodInfo
    referrals_count: int = Field(ge=0)


class OnboardingRequest(Schema):
    consent: Literal[True]


class PersonalDataField(StrEnum):
    LAST_NAME = "last_name"
    FIRST_NAME = "first_name"
    MIDDLE_NAME = "middle_name"
    PASSPORT_SERIES = "passport_series"
    PASSPORT_NUMBER = "passport_number"
    PASSPORT_ISSUED_BY = "passport_issued_by"
    PASSPORT_DIVISION_CODE = "passport_division_code"
    OMS_NUMBER = "oms_number"
    PHONE = "phone"
    EMAIL = "email"


PERSONAL_DATA_ERRORS: dict[str, str] = {
    "last_name": "Введите фамилию",
    "first_name": "Введите имя",
    "passport_series": "Серия — 4 цифры",
    "passport_number": "Номер — 6 цифр",
    "passport_issued_by": "Укажите, кем выдан паспорт",
    "passport_division_code": "Код подразделения — 6 цифр",
    "oms_number": "Номер полиса — 16 цифр",
    "phone": "Введите номер телефона полностью",
    "email": "Проверьте адрес почты",
}

NamePart = Annotated[
    str, Field(min_length=1, max_length=255, pattern=r"^[A-Za-zА-Яа-яЁё-]+$")
]
PassportSeries = Annotated[str, Field(pattern=r"^\d{4}$", examples=["4510"])]
PassportNumber = Annotated[str, Field(pattern=r"^\d{6}$", examples=["123456"])]
DivisionCode = Annotated[str, Field(pattern=r"^\d{3}-\d{3}$", examples=["770-001"])]
OmsNumber = Annotated[str, Field(pattern=r"^\d{16}$", examples=["1234567890123456"])]
Phone = Annotated[str, Field(pattern=r"^\+7\d{10}$", examples=["+79001234567"])]
Email = Annotated[
    str,
    Field(
        max_length=254,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        examples=["ivanov@mail.ru"],
    ),
]


class PersonalDataInput(Schema):
    last_name: NamePart
    first_name: NamePart
    middle_name: str | None = Field(default=None, max_length=255)
    passport_series: PassportSeries
    passport_number: PassportNumber
    passport_issued_by: str = Field(min_length=1, max_length=512)
    passport_division_code: DivisionCode
    oms_number: OmsNumber
    phone: Phone
    email: Email


class PersonalData(Schema):
    last_name: str | None
    first_name: str | None
    middle_name: str | None
    passport_series: str | None
    passport_number: str | None
    passport_issued_by: str | None
    passport_division_code: str | None
    oms_number: str | None
    phone: str | None
    email: str | None
    is_demo: bool
    missing_fields: list[PersonalDataField]


class NextAllowed(Schema):
    whole_blood: dt.date
    plasma: dt.date


class IntervalActive(Schema):
    whole_blood: bool
    plasma: bool


class Eligibility(Schema):
    next_allowed: NextAllowed
    interval_active: IntervalActive


class LevelCode(StrEnum):
    """0 — Будущий донор, 1 — Новичок, 5 — Активный, 10 — Опытный, 20 — Наставник, 40 — Легенда."""

    FUTURE_DONOR = "future_donor"
    NOVICE = "novice"
    ACTIVE = "active"
    EXPERIENCED = "experienced"
    MENTOR = "mentor"
    LEGEND = "legend"


class NextLevel(Schema):
    code: LevelCode
    name: str
    threshold: int
    remaining: int = Field(ge=1)


class Level(Schema):
    code: LevelCode
    name: str
    threshold: int
    next: NextLevel | None
    is_max: bool


class HonoraryCounter(Schema):
    count: int = Field(ge=0)
    goal: int = Field(description="40 для крови, 60 для плазмы")


class HonoraryMixed(Schema):
    count: int = Field(ge=0)
    goal: Literal[40, 60]
    whole_needed_for_40: int = Field(ge=0)


class HonoraryEta(Schema):
    date: dt.date
    years: int = Field(ge=0)
    months: int = Field(ge=0, le=11)


class Honorary(Schema):
    whole: HonoraryCounter
    plasma: HonoraryCounter
    mixed: HonoraryMixed
    achieved: bool
    eta: HonoraryEta | None


class Progress(Schema):
    total: int = Field(ge=0)
    level: Level
    honorary: Honorary


class Donation(Schema):
    id: int
    donation_type: DonationType
    donated_on: dt.date
    center_name: str | None


class DonationYear(Schema):
    year: int
    count: int
    items: list[Donation]


class DonationHistory(Schema):
    total: int = Field(ge=0)
    years: list[DonationYear]


class Referrals(Schema):
    count: int = Field(ge=0)
    link: str
