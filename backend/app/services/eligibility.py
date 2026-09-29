import datetime as dt
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.utils.dates import today_msk
from app.models import Donation
from app.models.enums import DonationType

WHOLE_AFTER_WHOLE = dt.timedelta(days=60)
WHOLE_AFTER_PLASMA = dt.timedelta(days=30)
PLASMA_AFTER_PLASMA = dt.timedelta(days=14)
PLASMA_AFTER_WHOLE = dt.timedelta(days=30)


@dataclass(frozen=True)
class DonationStats:
    """Сводка по донациям пользователя: сколько и когда последняя."""

    whole_count: int = 0
    plasma_count: int = 0
    last_whole: dt.date | None = None
    last_plasma: dt.date | None = None

    @property
    def total(self) -> int:
        return self.whole_count + self.plasma_count


@dataclass(frozen=True)
class NextAllowed:
    whole_blood: dt.date
    plasma: dt.date

    def for_type(self, donation_type: DonationType) -> dt.date:
        if donation_type == DonationType.WHOLE_BLOOD:
            return self.whole_blood
        return self.plasma


def next_allowed(
    last_whole: dt.date | None, last_plasma: dt.date | None, today: dt.date
) -> NextAllowed:
    """Ближайшие даты, когда можно сдать кровь и плазму. Нет донаций вида — слагаемое пропускаем."""
    whole = [today]
    plasma = [today]
    if last_whole:
        whole.append(last_whole + WHOLE_AFTER_WHOLE)
        plasma.append(last_whole + PLASMA_AFTER_WHOLE)
    if last_plasma:
        whole.append(last_plasma + WHOLE_AFTER_PLASMA)
        plasma.append(last_plasma + PLASMA_AFTER_PLASMA)
    return NextAllowed(whole_blood=max(whole), plasma=max(plasma))


async def load_stats(session: AsyncSession, user_id: int) -> DonationStats:
    rows = await session.execute(
        select(
            Donation.donation_type,
            func.count(),
            func.max(Donation.donated_on),
        )
        .where(Donation.user_id == user_id)
        .group_by(Donation.donation_type)
    )
    data: dict[DonationType, tuple[int, dt.date]] = {
        row[0]: (row[1], row[2]) for row in rows
    }
    whole = data.get(DonationType.WHOLE_BLOOD, (0, None))
    plasma = data.get(DonationType.PLASMA, (0, None))
    return DonationStats(
        whole_count=whole[0],
        plasma_count=plasma[0],
        last_whole=whole[1],
        last_plasma=plasma[1],
    )


async def get_next_allowed(
    session: AsyncSession,
    user_id: int,
    donation_type: DonationType,
    today: dt.date | None = None,
) -> dt.date:
    """Для записи: с какой даты пользователь может сдать donation_type."""
    stats = await load_stats(session, user_id)
    allowed = next_allowed(stats.last_whole, stats.last_plasma, today or today_msk())
    return allowed.for_type(donation_type)


def interval_ends(
    last_whole: dt.date | None, last_plasma: dt.date | None
) -> dict[DonationType, dt.date | None]:
    """Когда закончится интервал для каждого вида — без подрезки «сегодня».

    None — ограничений нет (донаций не было). В отличие от next_allowed,
    дата не «ползёт» вместе с today, поэтому по ней можно один раз прислать
    пуш «интервал прошёл».
    """
    whole: list[dt.date] = []
    plasma: list[dt.date] = []
    if last_whole:
        whole.append(last_whole + WHOLE_AFTER_WHOLE)
        plasma.append(last_whole + PLASMA_AFTER_WHOLE)
    if last_plasma:
        whole.append(last_plasma + WHOLE_AFTER_PLASMA)
        plasma.append(last_plasma + PLASMA_AFTER_PLASMA)
    return {
        DonationType.WHOLE_BLOOD: max(whole) if whole else None,
        DonationType.PLASMA: max(plasma) if plasma else None,
    }
