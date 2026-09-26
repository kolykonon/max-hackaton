from typing import Annotated

from fastapi import APIRouter, Query

from app.api.stub.auth import CurrentUser
from app.api.stub.services import region_service
from app.schemas.common import error_responses
from app.schemas.regions import LocateRegionResponse, Region

router = APIRouter(prefix="/regions", tags=["regions"], responses=error_responses(401))


@router.get("", summary="Все субъекты РФ по алфавиту")
async def list_regions(user: CurrentUser) -> list[Region]:
    return await region_service.list_regions()


@router.get("/locate", summary="Регион по координатам", responses=error_responses(422))
async def locate_region(
    user: CurrentUser,
    lat: Annotated[float, Query(ge=-90, le=90)],
    lon: Annotated[float, Query(ge=-180, le=180)],
) -> LocateRegionResponse:
    return LocateRegionResponse(region=await region_service.locate(lat, lon))
