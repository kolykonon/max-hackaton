import datetime as dt
import secrets

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.utils.dates import today_msk
from app.models import Donation, PersonalData, Region, User
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
    "email": "ivanov@example.ru",
}

# Названия как в seeds/centers.json: по ним «ваш центр» идёт первым при записи.
# Первый встречается чаще — он и будет «вашим».
DEMO_CENTER_NAMES = [
    "ГБУЗ «Центр крови им. О.К. Гаврилова ДЗМ» (м. Беговая)",
    "ГБУЗ «Центр крови им. О.К. Гаврилова ДЗМ» (м. Беговая)",
    "НМИЦ гематологии Минздрава России (отделение переливания крови)",
]
DEFAULT_REGION_CODE = "RU-MOW"

LAST_WHOLE_DAYS_AGO = 45
WHOLE_STEP_DAYS = 110
WHOLE_COUNT = 10
PLASMA_BETWEEN = (0, 5)
DEMO_REFERRAL_NAMES = ("Анна", "Максим", "Ольга", "Дмитрий")


def random_donor_code() -> str:
    # 20 цифр — как код в «Службе крови» (АИСТ)
    return f"{secrets.randbelow(10**20):020d}"


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


async def ensure_demo_referrals(session: AsyncSession, user: User) -> None:
    """Демо-профиль сразу показывает непустой реферальный сценарий."""
    for index, first_name in enumerate(DEMO_REFERRAL_NAMES, start=1):
        code = f"demo-ref-{user.id}-{index}"
        referral = await session.scalar(
            select(User).where(User.referral_code == code)
        )
        if referral is None:
            session.add(
                User(
                    max_user_id=-(user.id * 10 + index),
                    first_name=first_name,
                    referral_code=code,
                    referred_by_user_id=user.id,
                )
            )
        else:
            referral.referred_by_user_id = user.id


async def create_demo_profile(
    session: AsyncSession, user: User, today: dt.date | None = None
) -> None:
    user.blood_group = BloodGroup.A_POS
    user.kell = "K-"
    user.phenotype = "CcDee"
    user.donor_code = user.donor_code or random_donor_code()
    user.region_id = user.region_id or await session.scalar(
        select(Region.id).where(Region.code == DEFAULT_REGION_CODE)
    )

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

    await ensure_demo_referrals(session, user)
