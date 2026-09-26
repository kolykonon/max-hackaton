import datetime as dt

MSK = dt.timezone(dt.timedelta(hours=3))


def now_msk() -> dt.datetime:
    return dt.datetime.now(MSK)


def today_msk() -> dt.date:
    return now_msk().date()


def add_months(d: dt.date, months: int) -> dt.date:
    m = d.month - 1 + months
    year, month = d.year + m // 12, m % 12 + 1
    for day in (d.day, 30, 29, 28):
        try:
            return dt.date(year, month, day)
        except ValueError:
            continue
    raise ValueError(d)


def days_between(start: dt.date, end: dt.date) -> list[dt.date]:
    return [start + dt.timedelta(days=i) for i in range((end - start).days + 1)]
