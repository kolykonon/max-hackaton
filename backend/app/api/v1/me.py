from fastapi import APIRouter, status

from app.api.deps import CurrentUser, ProfileServiceDep
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
async def get_me(service: ProfileServiceDep, user: CurrentUser) -> Me:
    return await service.get_me(user)


@router.post(
    "/onboarding",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Завершить онбординг",
    responses=error_responses(422),
)
async def complete_onboarding(
    service: ProfileServiceDep, user: CurrentUser, body: OnboardingRequest
) -> None:
    await service.complete_onboarding(user)


@router.get("/personal-data", summary="Личные данные")
async def get_personal_data(
    service: ProfileServiceDep, user: CurrentUser
) -> PersonalData:
    return await service.get_personal_data(user)


@router.put(
    "/personal-data",
    summary="Сохранить личные данные",
    responses=error_responses(422),
)
async def update_personal_data(
    service: ProfileServiceDep, user: CurrentUser, body: PersonalDataInput
) -> PersonalData:
    return await service.save_personal_data(user, body)


@router.get("/eligibility", summary="Ближайшие разрешённые даты донации")
async def get_eligibility(service: ProfileServiceDep, user: CurrentUser) -> Eligibility:
    return await service.get_eligibility(user)


@router.get("/progress", summary="Уровень донора и путь к званию")
async def get_progress(service: ProfileServiceDep, user: CurrentUser) -> Progress:
    return await service.get_progress(user)


@router.get("/donations", summary="История донаций")
async def get_donations(
    service: ProfileServiceDep, user: CurrentUser
) -> DonationHistory:
    return await service.get_donations(user)


@router.get("/referrals", summary="Рефералы")
async def get_referrals(service: ProfileServiceDep, user: CurrentUser) -> Referrals:
    return await service.get_referrals(user)
