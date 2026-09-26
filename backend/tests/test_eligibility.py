import datetime as dt

from app.services.eligibility import next_allowed

TODAY = dt.date(2026, 9, 26)


def days(n: int) -> dt.timedelta:
    return dt.timedelta(days=n)


def test_no_donations():
    r = next_allowed(None, None, TODAY)
    assert r.whole_blood == TODAY
    assert r.plasma == TODAY


def test_after_whole():
    r = next_allowed(TODAY - days(10), None, TODAY)
    assert r.whole_blood == TODAY + days(50)
    assert r.plasma == TODAY + days(20)


def test_after_plasma():
    r = next_allowed(None, TODAY - days(5), TODAY)
    assert r.whole_blood == TODAY + days(25)
    assert r.plasma == TODAY + days(9)


def test_both_takes_max():
    # кровь 45 дней назад, плазма 100 дней назад — как в демо-профиле
    r = next_allowed(TODAY - days(45), TODAY - days(100), TODAY)
    assert r.whole_blood == TODAY + days(15)
    assert r.plasma == TODAY


def test_old_donations_give_today():
    r = next_allowed(TODAY - days(365), TODAY - days(365), TODAY)
    assert r.whole_blood == TODAY
    assert r.plasma == TODAY


def test_boundary_exactly_60_days():
    r = next_allowed(TODAY - days(60), None, TODAY)
    assert r.whole_blood == TODAY
