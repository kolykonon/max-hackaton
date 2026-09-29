"""MaxBotClient: загрузка файла и отправка вложением (HTTP подменён)."""

import json

import httpx
import pytest

from app.integrations.max_api import MaxBotClient, callback_button, keyboard


def _client(handler) -> MaxBotClient:
    client = MaxBotClient(token="t", base_url="https://api.test")
    client._client = httpx.AsyncClient(
        base_url="https://api.test", transport=httpx.MockTransport(handler)
    )
    return client


@pytest.mark.asyncio
async def test_send_file_uploads_and_retries_until_ready(monkeypatch):
    monkeypatch.setattr("app.integrations.max_api.RETRY_DELAY", 0)
    calls: list[str] = []
    attempts = {"messages": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(f"{request.method} {request.url.host}{request.url.path}")
        if request.url.path == "/uploads":
            return httpx.Response(200, json={"url": "https://upload.test/f"})
        if request.url.host == "upload.test":
            return httpx.Response(200, json={"token": "tok123"})
        if request.url.path == "/messages":
            attempts["messages"] += 1
            if attempts["messages"] == 1:
                return httpx.Response(400, json={"code": "attachment.not.ready"})
            body = json.loads(request.content)
            assert body["attachments"][0] == {
                "type": "file",
                "payload": {"token": "tok123"},
            }
            return httpx.Response(200, json={"message": {}})
        return httpx.Response(404)

    client = _client(handler)
    await client.send_file(
        1, "hi", filename="a.pdf", content=b"%PDF", mime="application/pdf"
    )
    assert calls == [
        "POST api.test/uploads",
        "POST upload.test/f",
        "POST api.test/messages",
        "POST api.test/messages",
    ]


@pytest.mark.asyncio
async def test_answer_callback_body():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["params"] = dict(request.url.params)
        seen["body"] = json.loads(request.content)
        return httpx.Response(200, json={"success": True})

    client = _client(handler)
    await client.answer_callback("cb1", notification="ok", message={"text": "x"})
    assert seen == {
        "params": {"callback_id": "cb1"},
        "body": {"notification": "ok", "message": {"text": "x"}},
    }


def test_keyboard_layout():
    kb = keyboard([callback_button("A", "a:1")], [callback_button("B", "b:2")])
    assert kb[0]["payload"]["buttons"] == [
        [{"type": "callback", "text": "A", "payload": "a:1"}],
        [{"type": "callback", "text": "B", "payload": "b:2"}],
    ]
