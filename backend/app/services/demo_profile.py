import datetime as dt
import secrets

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.utils.dates import today_msk
from app.models import Donation, PersonalData, User
from app.models.enums import BloodGroup, DonationType

DEMO_PERSONAL_DATA = {
    "last_name": "Иванов",
    "first_name": "Иван",
    "middle_name": "Иванович",
    "passport_series": "4510",
    "passport_number": "123456",
    "passport_issued_by": "ГУ МВД России по г. Москве",
    "passport_division_code": "770-001",
    "oms_number": "1234567890123456",
    "phone": "+79001234567",
    "email": "ivanov@mail.ru",
}

DEMO_CENTER_NAMES = [
    "Центр крови ФМБА России",
    "Центр крови им. О. К. Гаврилова",
]

LAST_WHOLE_DAYS_AGO = 45
WHOLE_STEP_DAYS = 110
WHOLE_COUNT = 10
PLASMA_BETWEEN = (0, 5)


def random_donor_code() -> str:
    return f"{secrets.randbelow(10**4):04d}-{secrets.randbelow(10**4):04d}"


def demo_donations(today: dt.date) -> list[tuple[DonationType, dt.date]]:
    last = today - dt.timedelta(days=LAST_WHOLE_DAYS_AGO)
    items = [
        (DonationType.WHOLE_BLOOD, last - dt.timedelta(days=WHOLE_STEP_DAYS * i))
        for i in range(WHOLE_COUNT)
    ]
    items += [
        (
            DonationType.PLASMA,
            last - dt.timedelta(days=WHOLE_STEP_DAYS * i + WHOLE_STEP_DAYS // 2),
        )
        for i in PLASMA_BETWEEN
    ]
    return sorted(items, key=lambda item: item[1])


async def create_demo_profile(
    session: AsyncSession, user: User, today: dt.date | None = None
) -> None:
    user.blood_group = BloodGroup.A_POS
    user.kell = "K-"
    user.phenotype = "CcDee"
    user.donor_code = user.donor_code or random_donor_code()

    await session.merge(
        PersonalData(user_id=user.id, is_demo=True, **DEMO_PERSONAL_DATA)
    )

    await session.execute(delete(Donation).where(Donation.user_id == user.id))
    for i, (donation_type, donated_on) in enumerate(
        demo_donations(today or today_msk())
    ):
        session.add(
            Donation(
                user_id=user.id,
                donation_type=donation_type,
                donated_on=donated_on,
                center_name=DEMO_CENTER_NAMES[i % len(DEMO_CENTER_NAMES)],
                is_demo=True,
            )
        )
