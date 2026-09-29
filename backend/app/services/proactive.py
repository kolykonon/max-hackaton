"""Проактивные пуши: бот сам пишет, когда можно сдавать.

Раз в день (PUSH_HOUR_MSK) планировщик бэкенда вызывает run_daily_pushes:
  • interval_open — закончился интервал после прошлой донации;
  • deficit — в регионе донора не хватает его группы крови, а сдавать уже можно;
  • rest_day_* — не использован доп. день отдыха за донацию (ст. 186 ТК РФ).
Каждый пуш пишется в notification_log и второй раз не уходит.
"""

import datetime as dt
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot import pushes
from app.core.db import sessionmaker
from app.core.utils.dates import now_msk, today_msk
from app.integrations.max_api import MaxBotClient
from app.models import (
    Appointment,
    Center,
    Donation,
    NotificationLog,
    Region,
    RegionBloodStatus,
    User,
)
from app.models.enums import AppointmentStatus, BloodGroup, DonationType, StockStatus
from app.services.after_donation import (
    REST_DAY_REMINDERS,
    reminder_due_date,
    rest_day_deadline,
)
from app.services.eligibility import interval_ends

log = logging.getLogger(__name__)

PUSH_HOUR_MSK = 10
# Статусы светофора, при которых считаем, что группы «не хватает»
DEFICIT_STATUSES = {StockStatus.URGENT}
# Не чаще раза в 2 недели на пользователя
DEFICIT_COOLDOWN = dt.timedelta(days=14)
# Если бэк лежал пару дней, всё равно сообщим об открывшемся интервале
INTERVAL_LOOKBACK = dt.timedelta(days=3)

KIND_INTERVAL = "interval_open"
KIND_DEFICIT = "deficit"

Sender = Callable[[MaxBotClient], Awaitable[bool]]


@dataclass
class PlannedPush:
    user_id: int
    kind: str
    key: str
    send: Sender
    # Что ещё пометить отправленным (пуш покрывает и их)
    also: list[tuple[str, str]] = field(default_factory=list)


@dataclass(frozen=True)
class _UserStats:
    last_whole: dt.date | None = None
    last_plasma: dt.date | None = None


def _interval_key(donation_type: DonationType, day: dt.date) -> str:
    return f"{donation_type.value}:{day.isoformat()}"


async def _users_without_active_appointment(session: AsyncSession) -> list[User]:
    active = (
        select(Appointment.id)
        .where(
            Appointment.user_id == User.id,
            Appointment.status == AppointmentStatus.ACTIVE,
        )
        .exists()
    )
    rows = await session.scalars(
        select(User).where(User.onboarding_completed_at.is_not(None), ~active)
    )
    return list(rows)


async def _stats(session: AsyncSession, user_ids: list[int]) -> dict[int, _UserStats]:
    if not user_ids:
        return {}
    rows = await session.execute(
        select(Donation.user_id, Donation.donation_type, func.max(Donation.donated_on))
        .where(Donation.user_id.in_(user_ids))
        .group_by(Donation.user_id, Donation.donation_type)
    )
    raw: dict[int, dict[DonationType, dt.date]] = {}
    for user_id, donation_type, last in rows:
        raw.setdefault(user_id, {})[DonationType(donation_type)] = last
    return {
        uid: _UserStats(d.get(DonationType.WHOLE_BLOOD), d.get(DonationType.PLASMA))
        for uid, d in raw.items()
    }


async def effective_regions(session: AsyncSession, users: list[User]) -> dict[int, int]:
    """Регион донора: из профиля, иначе — регион центра последней записи."""
    result = {u.id: u.region_id for u in users if u.region_id}
    missing = [u.id for u in users if not u.region_id]
    if missing:
        rows = await session.execute(
            select(Appointment.user_id, Center.region_id)
            .join(Center, Center.id == Appointment.center_id)
            .where(Appointment.user_id.in_(missing))
            .order_by(Appointment.created_at.desc(), Appointment.id.desc())
        )
        for uid, rid in rows:
            result.setdefault(uid, rid)
    return result


async def _logged(
    session: AsyncSession, kinds: list[str], since: dt.datetime | None = None
) -> set[tuple[int, str, str]]:
    q = select(
        NotificationLog.user_id, NotificationLog.kind, NotificationLog.key
    ).where(NotificationLog.kind.in_(kinds))
    if since is not None:
        q = q.where(NotificationLog.created_at >= since)
    return {tuple(r) for r in await session.execute(q)}


async def plan_availability_pushes(
    session: AsyncSession, today: dt.date | None = None
) -> list[PlannedPush]:
    """Пуши «интервал прошёл» и «не хватает вашей группы»."""
    today = today or today_msk()
    users = await _users_without_active_appointment(session)
    stats = await _stats(session, [u.id for u in users])
    regions = await effective_regions(session, users)

    statuses = {
        (region_id, BloodGroup(group)): StockStatus(status)
        for region_id, group, status in await session.execute(
            select(
                RegionBloodStatus.region_id,
                RegionBloodStatus.blood_group,
                RegionBloodStatus.status,
            )
        )
    }
    region_names = dict((await session.execute(select(Region.id, Region.name))).all())
    logged_interval = await _logged(session, [KIND_INTERVAL])
    recent_deficit = {
        uid
        for uid, _, _ in await _logged(
            session, [KIND_DEFICIT], since=now_msk() - DEFICIT_COOLDOWN
        )
    }

    planned: list[PlannedPush] = []
    for user in users:
        st = stats.get(user.id, _UserStats())
        ends = interval_ends(st.last_whole, st.last_plasma)
        opened = [
            (t, d)
            for t, d in ends.items()
            if d is not None
            and today - INTERVAL_LOOKBACK <= d <= today
            and (user.id, KIND_INTERVAL, _interval_key(t, d)) not in logged_interval
        ]
        interval_keys = [(KIND_INTERVAL, _interval_key(t, d)) for t, d in opened]
        can_donate_now = any(d is None or d <= today for d in ends.values())

        region_id = regions.get(user.id)
        group = BloodGroup(user.blood_group) if user.blood_group else None
        in_deficit = (
            region_id is not None
            and group is not None
            and statuses.get((region_id, group)) in DEFICIT_STATUSES
        )

        if in_deficit and can_donate_now and user.id not in recent_deficit:
            planned.append(
                PlannedPush(
                    user_id=user.id,
                    kind=KIND_DEFICIT,
                    key=today.isoformat(),
                    send=_deficit_sender(
                        user.max_user_id, region_names[region_id], group.value
                    ),
                    also=interval_keys,
                )
            )
        elif opened:
            (kind, key), *rest = interval_keys
            planned.append(
                PlannedPush(
                    user_id=user.id,
                    kind=kind,
                    key=key,
                    send=_interval_sender(
                        user.max_user_id, [t.value for t, _ in opened]
                    ),
                    also=rest,
                )
            )
    return planned


async def plan_rest_day_pushes(
    session: AsyncSession, today: dt.date | None = None
) -> list[PlannedPush]:
    """Напоминания о неиспользованном доп. дне отдыха: через 14 дней,
    за 30 и за 7 дней до конца года со дня донации."""
    today = today or today_msk()
    kinds = [kind for kind, _, _ in REST_DAY_REMINDERS]
    logged = await _logged(session, kinds)
    rows = await session.execute(
        select(Donation, User.max_user_id)
        .join(User, User.id == Donation.user_id)
        .where(
            Donation.is_demo.is_(False),
            Donation.rest_day_used_at.is_(None),
            Donation.donated_on > today - dt.timedelta(days=366),
        )
    )
    planned: list[PlannedPush] = []
    for donation, max_user_id in rows:
        deadline = rest_day_deadline(donation.donated_on)
        if today > deadline:
            continue
        key = str(donation.id)
        due = [
            (kind, before)
            for kind, after, before in REST_DAY_REMINDERS
            if reminder_due_date(donation.donated_on, after, before) <= today
            and (donation.user_id, kind, key) not in logged
        ]
        if not due:
            continue
        # шлём самое свежее, остальные помечаем — чтобы не было пачки сразу
        (kind, before), *older = due[::-1]
        planned.append(
            PlannedPush(
                user_id=donation.user_id,
                kind=kind,
                key=key,
                send=_rest_day_sender(
                    max_user_id,
                    donation.id,
                    donation.donated_on,
                    deadline,
                    (deadline - today).days if before is not None else None,
                ),
                also=[(k, key) for k, _ in older],
            )
        )
    return planned


async def _claim(session: AsyncSession, user_id: int, kind: str, key: str) -> bool:
    inserted = await session.scalar(
        insert(NotificationLog)
        .values(user_id=user_id, kind=kind, key=key)
        .on_conflict_do_nothing(constraint="uq_notification_log")
        .returning(NotificationLog.id)
    )
    return inserted is not None


async def deliver(
    session: AsyncSession, client: MaxBotClient, planned: list[PlannedPush]
) -> int:
    """Помечает пуш в журнале и отправляет. Если отправка упала — снимаем отметку."""
    sent = 0
    for push in planned:
        if not await _claim(session, push.user_id, push.kind, push.key):
            continue
        for kind, key in push.also:
            await _claim(session, push.user_id, kind, key)
        await session.commit()
        if await push.send(client):
            sent += 1
        else:
            await session.execute(
                delete(NotificationLog).where(
                    NotificationLog.user_id == push.user_id,
                    NotificationLog.kind == push.kind,
                    NotificationLog.key == push.key,
                )
            )
            await session.commit()
    return sent


async def run_daily_pushes(client: MaxBotClient) -> None:
    """Задача планировщика: раз в день в PUSH_HOUR_MSK по Москве."""
    try:
        async with sessionmaker() as session:
            planned = await plan_availability_pushes(session)
            planned += await plan_rest_day_pushes(session)
            sent = await deliver(session, client, planned)
        log.info(
            "Проактивные пуши: запланировано %s, отправлено %s", len(planned), sent
        )
    except Exception:
        log.exception("Ошибка рассылки проактивных пушей")


# --- отправители: замыкания, чтобы план можно было проверить без сети ---


def _interval_sender(max_user_id: int, types: list[str]) -> Sender:
    return lambda client: pushes.send_interval_open(client, max_user_id, types)


def _deficit_sender(max_user_id: int, region_name: str, group: str) -> Sender:
    return lambda client: pushes.send_deficit(client, max_user_id, region_name, group)


def _rest_day_sender(
    max_user_id: int,
    donation_id: int,
    donated_on: dt.date,
    deadline: dt.date,
    days_left: int | None,
) -> Sender:
    return lambda client: pushes.send_rest_day_reminder(
        client,
        max_user_id,
        donation_id,
        donated_on.strftime("%d.%m.%Y"),
        deadline.strftime("%d.%m.%Y"),
        days_left,
    )
