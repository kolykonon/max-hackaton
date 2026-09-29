"""Групповая донация и новые ручки /me через HTTP."""

import datetime as dt
from datetime import UTC, datetime

import httpx
import pytest
import pytest_asyncio

from app.api.deps import _apply_referral
from app.core.db import get_session
from app.core.errors import AppError
from app.core.utils.dates import today_msk
from app.main import app
from app.models import Slot, User
from app.models.enums import DonationType
from app.schemas.groups import GroupCreate
from app.services.appointments import AppointmentService
from app.services.groups import GroupService


def _body(center, date=None) -> GroupCreate:
    return GroupCreate(
        center_id=center.id,
        date=date or today_msk() + dt.timedelta(days=1),
        donation_type=DonationType.WHOLE_BLOOD,
    )


@pytest.mark.asyncio
async def test_create_join_and_booked(session, user, user2, center, slot_free):
    service = GroupService(session)
    group = await service.create(user, _body(center, slot_free.starts_at.date()))
    assert group.is_owner and group.members_count == 1
    assert group.link.endswith(f"startapp=grp_{group.code}")
    assert group.free_slots == 1

    joined, is_new = await service.join(user2, group.code)
    assert is_new and joined.members_count == 2 and not joined.is_owner
    _, again = await service.join(user2, group.code)
    assert again is False

    await AppointmentService(session).create(user2, slot_free.id)
    view = await service.get(user2, group.code)
    assert view.is_booked
    assert [m.is_booked for m in view.members] == [False, True]
    assert view.free_slots == 0
    assert [g.code for g in await service.my_groups(user2)] == [group.code]


@pytest.mark.asyncio
async def test_group_date_validation(session, user, center):
    service = GroupService(session)
    with pytest.raises(AppError) as exc:
        await service.create(user, _body(center, today_msk() + dt.timedelta(days=90)))
    assert exc.value.status_code == 422
    with pytest.raises(AppError) as exc:
        await service.get(user, "nope")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_group_link_counts_as_referral(session, user, user2, center):
    group = await GroupService(session).create(user, _body(center))
    await _apply_referral(session, user2, f"grp_{group.code}")
    assert user2.referred_by_user_id == user.id


# ---------- HTTP ----------

DEV_ID = 777_001


@pytest_asyncio.fixture
async def client(session, bot):
    async def override():
        yield session

    app.dependency_overrides[get_session] = override
    app.state.max = bot
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://test/api/v1",
        headers={"X-Dev-User-Id": str(DEV_ID)},
    ) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_http_me_region_impact_share(client, region):
    me = (await client.get("/me")).json()
    assert me["region"] is None

    r = await client.put("/me/region", json={"region_id": region.id})
    assert r.status_code == 200 and r.json()["region"]["name"] == "Тестовый регион"
    assert (
        await client.put("/me/region", json={"region_id": 10**9})
    ).status_code == 404

    impact = (await client.get("/me/impact")).json()
    # демо-профиль: 10 крови + 2 плазмы
    assert impact["whole_count"] == 10 and impact["plasma_count"] == 2
    assert impact["whole_liters"] == 4.5
    assert impact["total_liters_max"] == 6.0
    assert impact["patients_helped_max"] == 30
    assert len(impact["sources"]) == 2

    card = (await client.get("/me/share-card", params={"kind": "level"})).json()
    assert card["title"] == "Мой уровень: Опытный донор"
    assert "startapp=ref_" in card["link"]
    assert "12 донаций" in card["text"]


@pytest.mark.asyncio
async def test_http_groups_notify_owner(client, session, center, user, bot):
    group = await GroupService(session).create(user, _body(center))
    r = await client.post(f"/groups/{group.code}/join")
    assert r.status_code == 200 and r.json()["members_count"] == 2
    assert bot.messages[-1]["user_id"] == user.max_user_id
    assert "Иван" in bot.messages[-1]["text"]

    created = await client.post(
        "/groups",
        json={
            "center_id": center.id,
            "date": str(today_msk()),
            "donation_type": "plasma",
        },
    )
    assert created.status_code == 201
    assert len((await client.get("/groups/my")).json()) == 2


@pytest.mark.asyncio
async def test_http_after_donation_flow(client, session, center, bot):
    me = await session.get(User, (await client.get("/me")).json()["id"])
    assert (await client.get("/me/after-donation")).json() == {"after_donation": None}

    # демо-профиль: кровь 45 дней назад → можно только плазму
    slot = Slot(
        center_id=center.id,
        donation_type=DonationType.PLASMA,
        starts_at=datetime.now(UTC).replace(microsecond=0) + dt.timedelta(days=1),
    )
    session.add(slot)
    await session.flush()
    r = await client.post("/appointments", json={"slot_id": slot.id})
    assert r.status_code == 201, r.text
    appt = r.json()
    assert me.region_id == center.region_id  # регион проставился по записи

    r = await client.post(f"/demo/appointments/{appt['appointment']['id']}/complete")
    assert r.status_code == 204
    assert "186" in bot.messages[-1]["text"]

    after = (await client.get("/me/after-donation")).json()["after_donation"]
    assert after["rest_day"]["used"] is False and len(after["documents"]) == 2
    donation_id = after["donation_id"]

    pdf = await client.post(
        f"/me/donations/{donation_id}/leave-application",
        params={"format": "pdf"},
        json={"employer_name": "ООО «Ромашка»"},
    )
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF")
    assert pdf.headers["content-type"] == "application/pdf"
    assert "attachment" in pdf.headers["content-disposition"]

    sent = await client.post(
        f"/me/donations/{donation_id}/leave-application/send",
        params={"format": "docx"},
        json={},
    )
    assert sent.status_code == 204 and bot.files[-1]["filename"].endswith(".docx")

    bad = await client.post(
        f"/me/donations/{donation_id}/leave-application",
        json={"rest_date": "2000-01-01"},
    )
    assert bad.status_code == 422 and "rest_date" in bad.json()["error"]["fields"]

    r = await client.put(f"/me/donations/{donation_id}/rest-day", json={"used": True})
    assert r.json()["rest_day"]["used"] is True

    for kind in ("interval_open", "deficit", "rest_day"):
        assert (await client.post(f"/demo/pushes/{kind}")).status_code == 204
    assert (await client.post("/demo/pushes-run")).status_code == 200
    assert (await client.get("/me/donations/999999/after")).status_code == 404
