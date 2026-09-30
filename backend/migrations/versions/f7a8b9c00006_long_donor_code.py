"""donor_code: 20 цифр вместо NNNN-NNNN

Revision ID: f7a8b9c00006
Revises: e6f7a8b90005
Create Date: 2026-09-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f7a8b9c00006"
down_revision: Union[str, None] = "e6f7a8b90005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("users", "donor_code", type_=sa.String(20))
    # Старые коды демо-профилей не пройдут новый pattern в /me — выдаём новые
    op.execute(
        "UPDATE users SET donor_code = "
        "lpad(floor(random() * 1e10)::bigint::text, 10, '0') || "
        "lpad(floor(random() * 1e10)::bigint::text, 10, '0') "
        "WHERE donor_code IS NOT NULL"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE users SET donor_code = substr(donor_code, 1, 4) || '-' || substr(donor_code, 17, 4) "
        "WHERE donor_code IS NOT NULL"
    )
    op.alter_column("users", "donor_code", type_=sa.String(9))
