import logging

from fastapi import APIRouter, Header, Request, Response
from fastapi.responses import JSONResponse

from app.bot.handlers import handle_update
from app.core.config import settings

log = logging.getLogger(__name__)
router = APIRouter()


@router.post("/webhook/max")
async def max_webhook(
    request: Request,
    x_max_bot_api_secret: str | None = Header(
        default=None, alias="X-Max-Bot-Api-Secret"
    ),
) -> Response:
    if settings.bot_settings.max_webhook_secret:
        if x_max_bot_api_secret != settings.bot_settings.max_webhook_secret:
            log.warning("Webhook: неверный секрет")
            return JSONResponse({"ok": False}, status_code=401)

    update = await request.json()
    log.info("Webhook update_type=%s", update.get("update_type"))

    client = request.app.state.max

    try:
        await handle_update(client, update)
    except Exception:
        log.exception("Ошибка обработки webhook")

    return JSONResponse({"ok": True}, status_code=200)
