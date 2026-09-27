from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, RegionServiceDep
from app.schemas.common import error_responses
from app.schemas.regions import LocateRegionResponse, Region

router = APIRouter(prefix="/regions", tags=["regions"], responses=error_responses(401))


@router.get("", summary="Все субъекты РФ по алфавиту")
async def list_regions(user: CurrentUser, service: RegionServiceDep) -> list[Region]:
    return await service.list_regions()


@router.get(
    "/locate", summary="Регион по координатам", responses=error_responses(422)
)
async def locate_region(
    user: CurrentUser,
    service: RegionServiceDep,
    lat: Annotated[float, Query(ge=-90, le=90)],
    lon: Annotated[float, Query(ge=-180, le=180)],
) -> LocateRegionResponse:
    return LocateRegionResponse(region=await service.locate(lat, lon))