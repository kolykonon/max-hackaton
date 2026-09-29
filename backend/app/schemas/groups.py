import datetime as dt

from pydantic import Field

from app.models.enums import DonationType
from app.schemas.common import LocalTime, Schema


class GroupCreate(Schema):
    center_id: int
    date: dt.date = Field(description="Локальная дата центра")
    donation_type: DonationType


class GroupCenter(Schema):
    id: int
    name: str
    address: str
    region_id: int


class GroupMember(Schema):
    name: str = Field(description="Имя и первая буква фамилии: «Иван П.»")
    photo_url: str | None
    is_owner: bool
    is_booked: bool = Field(description="Есть запись в этот центр на эту дату")
    booked_time: LocalTime | None = Field(description="Время записи участника")


class Group(Schema):
    code: str
    center: GroupCenter
    date: dt.date
    donation_type: DonationType
    owner_name: str
    members: list[GroupMember]
    members_count: int = Field(ge=1)
    donated_count: int = Field(
        ge=0, description="Участники, у которых донация в группе засчитана"
    )
    is_member: bool
    is_owner: bool
    is_booked: bool = Field(description="Текущий пользователь уже записан")
    is_past: bool
    free_slots: int = Field(ge=0, description="Свободных слотов в центре на дату")
    link: str = Field(description="https://max.ru/<бот>?startapp=grp_<code>")
    share_text: str = Field(description="Текст для shareMaxContent")
