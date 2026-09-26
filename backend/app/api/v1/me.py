from fastapi import APIRouter, status

from app.api.stub.auth import CurrentUser
from app.api.stub.services import profile_service
from app.schemas.common import error_responses
from app.schemas.profile import (
    DonationHistory,
    Eligibility,
    Me,
    OnboardingRequest,
    PersonalData,
    PersonalDataInput,
    Progress,
    Referrals,
)

router = APIRouter(prefix="/me", tags=["profile"], responses=error_responses(401))


@router.get("", summary="Текущий пользователь")
async def get_me(user: CurrentUser) -> Me:
    return await profile_service.get_me(user)


@router.post(
    "/onboarding",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Завершить онбординг",
    responses=error_responses(422),
)
async def complete_onboarding(user: CurrentUser, body: OnboardingRequest) -> None:
    await profile_service.complete_onboarding(user)


@router.get("/personal-data", summary="Личные данные")
async def get_personal_data(user: CurrentUser) -> PersonalData:
    return await profile_service.get_personal_data(user)


@router.put(
    "/personal-data",
    summary="Сохранить личные данные",
    responses=error_responses(422),
)
async def update_personal_data(
    user: CurrentUser, body: PersonalDataInput
) -> PersonalData:
    return await profile_service.save_personal_data(user, body)


@router.get("/eligibility", summary="Ближайшие разрешённые даты донации")
async def get_eligibility(user: CurrentUser) -> Eligibility:
    return await profile_service.get_eligibility(user)


@router.get("/progress", summary="Уровень донора и путь к званию")
async def get_progress(user: CurrentUser) -> Progress:
    return await profile_service.get_progress(user)


@router.get("/donations", summary="История донаций")
async def get_donations(user: CurrentUser) -> DonationHistory:
    return await profile_service.get_donations(user)


@router.get("/referrals", summary="Рефералы")
async def get_referrals(user: CurrentUser) -> Referrals:
    return await profile_service.get_referrals(user)
