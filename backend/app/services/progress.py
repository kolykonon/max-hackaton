import datetime as dt
from collections.abc import Callable
from dataclasses import dataclass

from app.core.utils.dates import add_months
from app.models.enums import DonationType
from app.schemas.profile import (
    Honorary,
    HonoraryCounter,
    HonoraryEta,
    HonoraryMixed,
    Level,
    LevelCode,
    NextLevel,
)
from app.services.eligibility import DonationStats, next_allowed

LEVELS: list[tuple[int, LevelCode, str]] = [
    (0, LevelCode.FUTURE_DONOR, "Будущий донор"),
    (1, LevelCode.NOVICE, "Новичок"),
    (5, LevelCode.ACTIVE, "Активный донор"),
    (10, LevelCode.EXPERIENCED, "Опытный донор"),
    (20, LevelCode.MENTOR, "Наставник"),
    (40, LevelCode.LEGEND, "Легенда донорства"),
]

WHOLE_GOAL = 40
PLASMA_GOAL = 60
MIXED_GOAL_LOW = 40
MIXED_GOAL_HIGH = 60
MIXED_WHOLE_MIN = 25


def get_level(total: int) -> Level:
    idx = max(i for i, (threshold, _, _) in enumerate(LEVELS) if total >= threshold)
    threshold, code, name = LEVELS[idx]
    nxt = None
    if idx + 1 < len(LEVELS):
        n_threshold, n_code, n_name = LEVELS[idx + 1]
        nxt = NextLevel(
            code=n_code,
            name=n_name,
            threshold=n_threshold,
            remaining=n_threshold - total,
        )
    return Level(
        code=code, name=name, threshold=threshold, next=nxt, is_max=nxt is None
    )


def is_honorary(whole: int, plasma: int) -> bool:
    total = whole + plasma
    return (
        whole >= WHOLE_GOAL
        or plasma >= PLASMA_GOAL
        or (whole >= MIXED_WHOLE_MIN and total >= MIXED_GOAL_LOW)
        or total >= MIXED_GOAL_HIGH
    )


@dataclass
class _Sim:
    whole: int
    plasma: int
    last_whole: dt.date | None
    last_plasma: dt.date | None
    today: dt.date
    last_date: dt.date | None = None

    def donate(self, kind: DonationType) -> None:
        allowed = next_allowed(self.last_whole, self.last_plasma, self.today)
        day = allowed.for_type(kind)
        if kind == DonationType.WHOLE_BLOOD:
            self.whole += 1
            self.last_whole = day
        else:
            self.plasma += 1
            self.last_plasma = day
        self.last_date = day


Strategy = tuple[Callable[[_Sim], bool], Callable[[_Sim], DonationType]]


def _only_whole() -> Strategy:
    return (lambda s: s.whole >= WHOLE_GOAL, lambda s: DonationType.WHOLE_BLOOD)


def _only_plasma() -> Strategy:
    return (lambda s: s.plasma >= PLASMA_GOAL, lambda s: DonationType.PLASMA)


def _alternate_then_plasma() -> Strategy:
    turn = {"next": DonationType.WHOLE_BLOOD}

    def choose(s: _Sim) -> DonationType:
        if s.whole >= MIXED_WHOLE_MIN:
            return DonationType.PLASMA
        kind = turn["next"]
        turn["next"] = (
            DonationType.PLASMA
            if kind == DonationType.WHOLE_BLOOD
            else DonationType.WHOLE_BLOOD
        )
        return kind

    return (
        lambda s: s.whole >= MIXED_WHOLE_MIN and s.whole + s.plasma >= MIXED_GOAL_LOW,
        choose,
    )


def _plasma_to_60() -> Strategy:
    return (
        lambda s: s.whole + s.plasma >= MIXED_GOAL_HIGH,
        lambda s: DonationType.PLASMA,
    )


def _run(stats: DonationStats, today: dt.date, strategy: Strategy) -> dt.date:
    done, choose = strategy
    sim = _Sim(
        whole=stats.whole_count,
        plasma=stats.plasma_count,
        last_whole=stats.last_whole,
        last_plasma=stats.last_plasma,
        today=today,
    )
    while not done(sim):
        sim.donate(choose(sim))
    assert sim.last_date is not None
    return sim.last_date


def _approx_duration(start: dt.date, end: dt.date) -> tuple[int, int]:
    months = (end.year - start.year) * 12 + (end.month - start.month)
    if add_months(start, months) > end:
        months -= 1
    if (end - add_months(start, months)).days >= 15:
        months += 1
    return divmod(months, 12)


def honorary_eta(stats: DonationStats, today: dt.date) -> HonoraryEta | None:
    if is_honorary(stats.whole_count, stats.plasma_count):
        return None
    strategies = (_only_whole, _only_plasma, _alternate_then_plasma, _plasma_to_60)
    date = min(_run(stats, today, make()) for make in strategies)
    years, months = _approx_duration(today, date)
    return HonoraryEta(date=date, years=years, months=months)


def get_honorary(stats: DonationStats, today: dt.date) -> Honorary:
    x, y = stats.whole_count, stats.plasma_count
    return Honorary(
        whole=HonoraryCounter(count=x, goal=WHOLE_GOAL),
        plasma=HonoraryCounter(count=y, goal=PLASMA_GOAL),
        mixed=HonoraryMixed(
            count=x + y,
            goal=MIXED_GOAL_LOW if x >= MIXED_WHOLE_MIN else MIXED_GOAL_HIGH,
            whole_needed_for_40=max(0, MIXED_WHOLE_MIN - x),
        ),
        achieved=is_honorary(x, y),
        eta=honorary_eta(stats, today),
    )
