"""Проверяем запуск без секретов/сети и обработку ошибок MAX."""
import asyncio
import logging

import httpx
import pytest
from app.bot import worker
from app.core.config import BotSettings, settings
from app.integrations.max_api import MaxBotClient


@pytest.mark.asyncio
async def test_empty_token_exits_before_network(monkeypatch, caplog, tmp_path):
    monkeypatch.setattr(settings.bot_settings, "max_bot_token", "")
    monkeypatch.setattr(worker, "HEARTBEAT", tmp_path / "heartbeat")
    with caplog.at_level(logging.ERROR):
        assert await worker.run_polling() == 1
    assert "Не задан MAX_BOT_TOKEN" in caplog.text
    assert "Traceback" not in caplog.text
    assert not worker.HEARTBEAT.exists()


@pytest.mark.asyncio
@pytest.mark.parametrize("status", [401, 403])
async def test_rejected_token_is_redacted_and_closed(monkeypatch, caplog, tmp_path, status):
    token = "synthetic-secret-must-not-appear-in-logs"
    monkeypatch.setattr(settings.bot_settings, "max_bot_token", token)
    monkeypatch.setattr(worker, "HEARTBEAT", tmp_path / "heartbeat")
    client = MaxBotClient(token=token, base_url="https://max.test")
    await client._client.aclose()
    client._client = httpx.AsyncClient(
        base_url="https://max.test",
        transport=httpx.MockTransport(lambda request: httpx.Response(status, text=token)),
    )
    monkeypatch.setattr(worker, "MaxBotClient", lambda: client)
    with caplog.at_level(logging.INFO):
        assert await worker.run_polling() == 1
    assert "MAX API отклонил токен" in caplog.text
    assert token not in caplog.text
    assert "Traceback" not in caplog.text
    assert client._client.is_closed
    assert not worker.HEARTBEAT.exists()


@pytest.mark.asyncio
async def test_polling_uses_top_level_marker_even_on_empty_batch(monkeypatch, tmp_path):
    monkeypatch.setattr(worker, "HEARTBEAT", tmp_path / "heartbeat")
    markers, handled = [], []

    class Client:
        async def get_updates(self, *, marker, **kwargs):
            markers.append(marker)
            if len(markers) == 1:
                return {"updates": [{"update_type": "bot_started"}], "marker": 41}
            if len(markers) == 2:
                return {"updates": [], "marker": 42}
            raise asyncio.CancelledError

    async def handle(client, update):
        handled.append(update)

    monkeypatch.setattr(worker, "handle_update", handle)
    with pytest.raises(asyncio.CancelledError):
        await worker.poll_loop(Client())
    assert markers == [None, 41, 42]
    assert len(handled) == 1
    assert worker.HEARTBEAT.exists()


@pytest.mark.asyncio
async def test_revoked_token_does_not_retry_forever(monkeypatch, tmp_path):
    monkeypatch.setattr(worker, "HEARTBEAT", tmp_path / "heartbeat")

    class Client:
        async def get_updates(self, **kwargs):
            response = httpx.Response(401, request=httpx.Request("GET", "https://max.test/updates"))
            response.raise_for_status()

    with pytest.raises(httpx.HTTPStatusError):
        await worker.poll_loop(Client())


@pytest.mark.asyncio
async def test_username_discovered_without_extra_configuration(monkeypatch):
    monkeypatch.setattr(settings.bot_settings, "max_bot_username", "")
    client = MaxBotClient(token="fake", base_url="https://max.test")
    await client._client.aclose()
    client._client = httpx.AsyncClient(
        base_url="https://max.test",
        transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"username": "test_bot"})),
    )
    try:
        assert await client.configure_username() == "test_bot"
        assert settings.bot_settings.max_bot_username == "test_bot"
        monkeypatch.setattr(settings.bot_settings, "max_bot_username", "explicit_bot")
        assert await client.configure_username() == "explicit_bot"
    finally:
        await client.aclose()


def test_missing_token_does_not_prevent_web_settings(monkeypatch):
    monkeypatch.delenv("MAX_BOT_TOKEN", raising=False)
    cfg = BotSettings(_env_file=None)
    assert cfg.max_bot_token == ""
    assert cfg.max_mode == "polling"
