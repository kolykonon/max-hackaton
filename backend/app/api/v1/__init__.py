from fastapi import APIRouter

from app.api.v1 import appointments, booking, demo, health, map, me, regions

api_router = APIRouter()
for module in (me, regions, map, booking, appointments, demo, health):
    api_router.include_router(module.router)
