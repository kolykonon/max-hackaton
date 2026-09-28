"""center details from blood stations registry

Revision ID: a1c0de5e0001
Revises: 678d5805b4e0
"""

import sqlalchemy as sa
from alembic import op

revision = "a1c0de5e0001"
down_revision = "678d5805b4e0"
branch_labels = None
depends_on = None

COLUMNS = [
    ("external_id", sa.String(16)),
    ("city", sa.String(255)),
    ("center_type", sa.String(255)),
    ("phone", sa.String(255)),
    ("work_hours", sa.Text()),
    ("booking_info", sa.Text()),
    ("donation_types", sa.Text()),
    ("donor_requirements", sa.Text()),
    ("notes", sa.Text()),
    ("data_status", sa.String(255)),
    ("source_url", sa.String(2048)),
    ("source_url_2", sa.String(2048)),
    ("verified_on", sa.String(10)),
]


def upgrade() -> None:
    for name, type_ in COLUMNS:
        op.add_column("centers", sa.Column(name, type_, nullable=True))
    op.create_unique_constraint("uq_centers_external_id", "centers", ["external_id"])


def downgrade() -> None:
    op.drop_constraint("uq_centers_external_id", "centers", type_="unique")
    for name, _ in reversed(COLUMNS):
        op.drop_column("centers", name)
