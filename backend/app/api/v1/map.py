from fastapi import APIRouter

from app.api.stub.auth import CurrentUser
from app.api.stub.services import region_service
from app.schemas.common import error_responses
from app.schemas.regions import MapStatus

router = APIRouter(prefix="/map", tags=["regions"], responses=error_responses(401))


@router.get("/status", summary="Карта-светофор по регионам")
async def get_map_status(user: CurrentUser) -> MapStatus:
    return await region_service.get_map_status()
