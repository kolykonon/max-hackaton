import datetime as dt

import pytest

from app.schemas.profile import LevelCode
from app.services.eligibility import DonationStats
from app.services.progress import (
    _approx_duration,
    get_honorary,
    get_level,
    honorary_eta,
    is_honorary,
)

TODAY = dt.date(2026, 9, 26)


def days(n: int) -> dt.timedelta:
    return dt.timedelta(days=n)


@pytest.mark.parametrize(
    ("total", "code", "next_threshold", "remaining"),
    [
        (0, LevelCode.FUTURE_DONOR, 1, 1),
        (1, LevelCode.NOVICE, 5, 4),
        (4, LevelCode.NOVICE, 5, 1),
        (5, LevelCode.ACTIVE, 10, 5),
        (12, LevelCode.EXPERIENCED, 20, 8),
        (20, LevelCode.MENTOR, 40, 20),
    ],
)
def test_level(total, code, next_threshold, remaining):
    level = get_level(total)
    assert level.code == code
    assert level.next is not None
    assert level.next.threshold == next_threshold
    assert level.next.remaining == remaining
    assert not level.is_max


def test_level_max():
    level = get_level(55)
    assert level.code == LevelCode.LEGEND
    assert level.next is None
    assert level.is_max


@pytest.mark.parametrize(
    ("x", "y", "achieved"),
    [
        (40, 0, True),
        (39, 0, False),
        (0, 60, True),
        (0, 59, False),
        (25, 15, True),
        (25, 14, False),
        (24, 16, False),
        (24, 36, True),
    ],
)
def test_is_honorary(x, y, achieved):
    assert is_honorary(x, y) is achieved


def test_mixed_goal_and_counters():
    h = get_honorary(DonationStats(whole_count=10, plasma_count=2), TODAY)
    assert h.whole.count == 10 and h.whole.goal == 40
    assert h.plasma.count == 2 and h.plasma.goal == 60
    assert h.mixed.count == 12 and h.mixed.goal == 60
    assert h.mixed.whole_needed_for_40 == 15
    assert not h.achieved

    h = get_honorary(DonationStats(whole_count=25, plasma_count=3), TODAY)
    assert h.mixed.goal == 40
    assert h.mixed.whole_needed_for_40 == 0


def test_eta_none_when_achieved():
    assert honorary_eta(DonationStats(whole_count=40), TODAY) is None


def test_eta_plasma_only_is_fastest_for_newcomer():
    # с нуля: плазма раз в 14 дней, 60 донаций → 59 интервалов
    eta = honorary_eta(DonationStats(), TODAY)
    assert eta is not None
    assert eta.date == TODAY + days(14 * 59)


def test_eta_one_donation_left_plasma_today():
    # X=39: хватит одной плазмы (X ≥ 25, X+Y = 40), плазма разрешена сегодня
    stats = DonationStats(whole_count=39, last_whole=TODAY - days(45))
    eta = honorary_eta(stats, TODAY)
    assert eta is not None
    assert eta.date == TODAY
    assert (eta.years, eta.months) == (0, 0)


@pytest.mark.parametrize(
    ("end", "expected"),
    [
        (dt.date(2026, 10, 10), (0, 0)),
        (dt.date(2026, 10, 11), (0, 1)),
        (dt.date(2027, 9, 26), (1, 0)),
        (dt.date(2028, 3, 20), (1, 6)),
    ],
)
def test_approx_duration(end, expected):
    assert _approx_duration(TODAY, end) == expected


def test_eta_mixed_strategy_wins():
    # X=25, Y=10: нужно ещё 5 плазмы (стратегия 3), плазма разрешена сегодня
    stats = DonationStats(
        whole_count=25,
        plasma_count=10,
        last_whole=TODAY - days(100),
        last_plasma=TODAY - days(100),
    )
    eta = honorary_eta(stats, TODAY)
    assert eta is not None
    assert eta.date == TODAY + days(14 * 4)


def test_eta_demo_profile_is_reasonable():
    stats = DonationStats(
        whole_count=10,
        plasma_count=2,
        last_whole=TODAY - days(45),
        last_plasma=TODAY - days(100),
    )
    eta = honorary_eta(stats, TODAY)
    assert eta is not None
    # 48 плазмы раз в 14 дней, начиная с сегодня (стратегия 4)
    assert eta.date == TODAY + days(14 * 47)
    assert eta.years == 1


def test_eta_alternate_strategy():
    # X=24, Y=14: кровь сегодня (X=25), плазма через 30 дней (X+Y=40)
    stats = DonationStats(
        whole_count=24,
        plasma_count=14,
        last_whole=TODAY - days(100),
        last_plasma=TODAY - days(100),
    )
    eta = honorary_eta(stats, TODAY)
    assert eta is not None
    assert eta.date == TODAY + days(30)
