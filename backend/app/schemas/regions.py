from app.schemas.common import Schema


class Region(Schema):
    id: int
    code: str
    name: str
    has_centers: bool


class LocateRegionResponse(Schema):
    region: Region | None
