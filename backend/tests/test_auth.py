import hashlib
import hmac
import json
import time
from urllib.parse import urlencode

import pytest

from app.core.utils.data_validate import InitDataError, validate_init_data

TOKEN = "test-bot-token"
TTL = 86400


def sign(params: dict[str, str], token: str = TOKEN) -> str:
    check = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
    secret = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    return hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()


def make_init_data(auth_date: int | None = None, token: str = TOKEN, **extra) -> str:
    params = {
        "auth_date": str(auth_date or int(time.time())),
        "query_id": "q1",
        "user": json.dumps({"id": 42, "first_name": "Иван"}, ensure_ascii=False),
        **extra,
    }
    params["hash"] = sign(params, token)
    return urlencode(params)


def test_valid():
    data = validate_init_data(make_init_data(start_param="ref_abc"), TOKEN, TTL)
    assert data["user"]["id"] == 42
    assert data["start_param"] == "ref_abc"


def test_wrong_token():
    with pytest.raises(InitDataError):
        validate_init_data(make_init_data(token="other"), TOKEN, TTL)


def test_tampered():
    raw = make_init_data().replace("q1", "q2")
    with pytest.raises(InitDataError):
        validate_init_data(raw, TOKEN, TTL)


def test_no_hash():
    with pytest.raises(InitDataError):
        validate_init_data("auth_date=1&user=%7B%7D", TOKEN, TTL)


def test_expired():
    old = int(time.time()) - TTL - 60
    with pytest.raises(InitDataError):
        validate_init_data(make_init_data(auth_date=old), TOKEN, TTL)
