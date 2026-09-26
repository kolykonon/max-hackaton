import datetime as dt
import re

from app.models.enums import DonationType
from app.services.demo_profile import demo_donations, random_donor_code
from app.services.eligibility import next_allowed

TODAY = dt.date(2026, 9, 26)


def test_demo_donations_shape():
    items = demo_donations(TODAY)
    kinds = [k for k, _ in items]
    assert kinds.count(DonationType.WHOLE_BLOOD) == 10
    assert kinds.count(DonationType.PLASMA) == 2
    assert items[-1] == (DonationType.WHOLE_BLOOD, TODAY - dt.timedelta(days=45))
    assert (TODAY - items[0][1]).days < 4 * 365


def test_demo_donations_respect_intervals():
    last_whole = last_plasma = None
    for kind, day in demo_donations(TODAY):
        allowed = next_allowed(last_whole, last_plasma, day)
        assert allowed.for_type(kind) == day
        if kind == DonationType.WHOLE_BLOOD:
            last_whole = day
        else:
            last_plasma = day


def test_donor_code_format():
    assert re.fullmatch(r"\d{4}-\d{4}", random_donor_code())
