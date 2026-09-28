from fastapi import APIRouter

from app.api.deps import CurrentUser, MapServiceDep
from app.schemas.common import error_responses
from app.schemas.map import MapStatus

router = APIRouter(prefix="/map", tags=["map"], responses=error_responses(401))


@router.get("/status", summary="Карта-светофор по регионам")
async def get_map_status(user: CurrentUser, service: MapServiceDep) -> MapStatus:
    return await service.status()
