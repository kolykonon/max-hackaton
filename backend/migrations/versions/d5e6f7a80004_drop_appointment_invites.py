"""drop appointment invites: replaced by donation groups

Revision ID: d5e6f7a80004
Revises: c3d4e5f60003
"""

import sqlalchemy as sa
from alembic import op

revision = "d5e6f7a80004"
down_revision = "c3d4e5f60003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_appointments_invited_by_appointment_id", "appointments")
    op.drop_constraint(
        "fk_appointments_invited_by_appointment_id", "appointments", type_="foreignkey"
    )
    op.drop_constraint("uq_appointments_invite_code", "appointments", type_="unique")
    op.drop_column("appointments", "invited_by_appointment_id")
    op.drop_column("appointments", "invite_code")


def downgrade() -> None:
    op.add_column(
        "appointments", sa.Column("invite_code", sa.String(16), nullable=True)
    )
    op.add_column(
        "appointments",
        sa.Column("invited_by_appointment_id", sa.Integer(), nullable=True),
    )
    op.create_unique_constraint(
        "uq_appointments_invite_code", "appointments", ["invite_code"]
    )
    op.create_foreign_key(
        "fk_appointments_invited_by_appointment_id",
        "appointments",
        "appointments",
        ["invited_by_appointment_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_appointments_invited_by_appointment_id",
        "appointments",
        ["invited_by_appointment_id"],
    )
