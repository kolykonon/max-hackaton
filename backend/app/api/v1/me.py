from fastapi import APIRouter, Request, Response, status

from app.api.deps import CurrentUser, ProfileServiceDep
from app.bot import pushes
from app.core.db import SessionDep
from app.core.errors import AppError
from app.schemas.after_donation import (
    AfterDonation,
    AfterDonationResponse,
    LeaveApplicationInput,
    RestDayUpdate,
)
from app.schemas.common import ErrorCode, error_responses
from app.schemas.profile import (
    DonationHistory,
    Eligibility,
    Impact,
    Me,
    OnboardingRequest,
    PersonalData,
    PersonalDataInput,
    Progress,
    Referrals,
    RegionUpdate,
    ShareCard,
    ShareCardKind,
)
from app.services import after_donation
from app.services.leave_application import MIME, DocFormat, EmployerFields

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


@router.put(
    "/region",
    summary="Регион донора (для пушей о дефиците крови)",
    responses=error_responses(404, 422),
)
async def update_region(
    service: ProfileServiceDep, user: CurrentUser, body: RegionUpdate
) -> Me:
    return await service.set_region(user, body.region_id)


@router.get("/impact", summary="Вклад: литры и сколько людям могли помочь")
async def get_impact(service: ProfileServiceDep, user: CurrentUser) -> Impact:
    return await service.get_impact(user)


@router.get(
    "/share-card", summary="Карточка «Я сдал кровь» / «Мой уровень» для shareMaxContent"
)
async def get_share_card(
    service: ProfileServiceDep,
    user: CurrentUser,
    kind: ShareCardKind = ShareCardKind.DONATION,
) -> ShareCard:
    return await service.get_share_card(user, kind)


# --- После донации: документы, заявление, доп. день отдыха (ст. 186 ТК РФ) ---


@router.get(
    "/after-donation",
    summary="Последняя донация за год: документы и статус дня отдыха",
)
async def get_after_donation(
    session: SessionDep, user: CurrentUser
) -> AfterDonationResponse:
    donation = await after_donation.latest_rest_day_donation(session, user)
    return AfterDonationResponse(
        after_donation=after_donation.to_schema(donation) if donation else None
    )


@router.get(
    "/donations/{donation_id}/after",
    summary="Документы и день отдыха по конкретной донации",
    responses=error_responses(404),
)
async def get_donation_after(
    session: SessionDep, user: CurrentUser, donation_id: int
) -> AfterDonation:
    donation = await after_donation.get_user_donation(session, user, donation_id)
    return after_donation.to_schema(donation)


@router.put(
    "/donations/{donation_id}/rest-day",
    summary="Отметить, использован ли доп. день отдыха",
    responses=error_responses(404, 422),
)
async def update_rest_day(
    session: SessionDep, user: CurrentUser, donation_id: int, body: RestDayUpdate
) -> AfterDonation:
    donation = await after_donation.get_user_donation(session, user, donation_id)
    await after_donation.set_rest_day_used(session, donation, body.used)
    return after_donation.to_schema(donation)


APPLICATION_FILE_RESPONSES: dict[int | str, dict] = {
    200: {
        "description": "Файл заявления",
        "content": {
            mime: {"schema": {"type": "string", "format": "binary"}}
            for mime in MIME.values()
        },
    },
    **error_responses(404, 422),
}


@router.post(
    "/donations/{donation_id}/leave-application",
    summary="Скачать заявление на доп. день отдыха (PDF или DOCX)",
    response_class=Response,
    responses=APPLICATION_FILE_RESPONSES,
)
async def download_leave_application(
    session: SessionDep,
    user: CurrentUser,
    donation_id: int,
    body: LeaveApplicationInput,
    format: DocFormat = DocFormat.PDF,
) -> Response:
    donation = await after_donation.get_user_donation(session, user, donation_id)
    content, name, mime = await after_donation.make_application(
        session, user, donation, EmployerFields(**body.model_dump()), format
    )
    return Response(
        content=content,
        media_type=mime,
        headers={"Content-Disposition": f'attachment; filename="{name}"'},
    )


@router.post(
    "/donations/{donation_id}/leave-application/send",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Прислать заявление файлом в чат с ботом",
    responses=error_responses(404, 422, 502),
)
async def send_leave_application(
    request: Request,
    session: SessionDep,
    user: CurrentUser,
    donation_id: int,
    body: LeaveApplicationInput,
    format: DocFormat = DocFormat.PDF,
) -> None:
    donation = await after_donation.get_user_donation(session, user, donation_id)
    content, name, mime = await after_donation.make_application(
        session, user, donation, EmployerFields(**body.model_dump()), format
    )
    if not await pushes.send_application_file(
        request.app.state.max, user.max_user_id, content, name, mime
    ):
        raise AppError(
            502, ErrorCode.BOT_SEND_FAILED, "Не удалось отправить файл в чат"
        )
