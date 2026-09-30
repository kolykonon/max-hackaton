"""slot capacity: несколько записей на слот, Москва — регион по умолчанию

Revision ID: e6f7a8b90005
Revises: d5e6f7a80004
Create Date: 2026-09-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e6f7a8b90005"
down_revision: Union[str, None] = "d5e6f7a80004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "slots",
        sa.Column("capacity", sa.SmallInteger(), server_default="1", nullable=False),
    )
    # Вместимость проверяем под блокировкой строки слота, а не уникальным индексом
    op.drop_index("uq_active_slot", table_name="appointments")
    op.execute(
        "UPDATE users SET region_id = (SELECT id FROM regions WHERE code = 'RU-MOW') "
        "WHERE region_id IS NULL"
    )


def downgrade() -> None:
    op.create_index(
        "uq_active_slot",
        "appointments",
        ["slot_id"],
        unique=True,
        postgresql_where=sa.text("status = 'active'"),
    )
    op.drop_column("slots", "capacity")
