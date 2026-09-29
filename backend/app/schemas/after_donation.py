import datetime as dt

from pydantic import Field

from app.models.enums import DonationType
from app.schemas.common import Schema


class RestDay(Schema):
    deadline: dt.date = Field(description="До какой даты можно взять день отдыха")
    days_left: int = Field(description="Дней до deadline, < 0 — срок прошёл")
    used: bool
    used_at: dt.datetime | None


class AfterDonation(Schema):
    """Что делать после донации: документы и доп. день отдыха (ст. 186 ТК РФ)."""

    donation_id: int
    donation_type: DonationType
    donated_on: dt.date
    center_name: str | None
    documents: list[str] = Field(description="Что взять в центре крови")
    rest_day: RestDay


class AfterDonationResponse(Schema):
    after_donation: AfterDonation | None


class RestDayUpdate(Schema):
    used: bool


class LeaveApplicationInput(Schema):
    """Реквизиты для заявления. Не сохраняются. Пустые поля — линии в документе."""

    employer_name: str | None = Field(
        default=None, max_length=255, examples=["ООО «Ромашка»"]
    )
    head_position: str | None = Field(
        default=None,
        max_length=255,
        description="Должность руководителя в дательном падеже",
        examples=["Генеральному директору"],
    )
    head_name: str | None = Field(
        default=None,
        max_length=255,
        description="ФИО руководителя в дательном падеже",
        examples=["Петрову П. П."],
    )
    employee_position: str | None = Field(
        default=None, max_length=255, examples=["менеджер"]
    )
    rest_date: dt.date | None = Field(
        default=None,
        description="Желаемый день отдыха: после дня донации, в течение года",
    )
    attach_to_vacation: bool = Field(
        default=False, description="Присоединить к отпуску вместо rest_date"
    )
