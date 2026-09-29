"""proactive pushes, after donation flow, donation groups

Revision ID: b7e1a2c30002
Revises: a1c0de5e0001
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "b7e1a2c30002"
down_revision = "a1c0de5e0001"
branch_labels = None
depends_on = None

# тип уже создан в initial schema
donation_type = postgresql.ENUM(
    "whole_blood", "plasma", name="donation_type", create_type=False
)


def upgrade() -> None:
    # регион донора
    op.add_column("users", sa.Column("region_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_users_region_id",
        "users",
        "regions",
        ["region_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # донация ← запись, отметка о дне отдыха
    op.add_column("donations", sa.Column("appointment_id", sa.Integer(), nullable=True))
    op.add_column(
        "donations",
        sa.Column("rest_day_used_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_unique_constraint(
        "uq_donations_appointment_id", "donations", ["appointment_id"]
    )
    op.create_foreign_key(
        "fk_donations_appointment_id",
        "donations",
        "appointments",
        ["appointment_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # журнал проактивных пушей
    op.create_table(
        "notification_log",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("key", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "kind", "key", name="uq_notification_log"),
    )
    op.create_index("ix_notification_log_user_id", "notification_log", ["user_id"])

    # групповая донация
    op.create_table(
        "donation_groups",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=16), nullable=False),
        sa.Column("owner_user_id", sa.Integer(), nullable=False),
        sa.Column("center_id", sa.Integer(), nullable=False),
        sa.Column("donation_type", donation_type, nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["center_id"], ["centers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_donation_groups_code"),
    )
    op.create_index(
        "ix_donation_groups_owner_user_id", "donation_groups", ["owner_user_id"]
    )
    op.create_table(
        "donation_group_members",
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["group_id"], ["donation_groups.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("group_id", "user_id"),
    )
    op.create_index(
        "ix_donation_group_members_user_id", "donation_group_members", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_donation_group_members_user_id", "donation_group_members")
    op.drop_table("donation_group_members")
    op.drop_index("ix_donation_groups_owner_user_id", "donation_groups")
    op.drop_table("donation_groups")
    op.drop_index("ix_notification_log_user_id", "notification_log")
    op.drop_table("notification_log")
    op.drop_constraint("fk_donations_appointment_id", "donations", type_="foreignkey")
    op.drop_constraint("uq_donations_appointment_id", "donations", type_="unique")
    op.drop_column("donations", "rest_day_used_at")
    op.drop_column("donations", "appointment_id")
    op.drop_constraint("fk_users_region_id", "users", type_="foreignkey")
    op.drop_column("users", "region_id")
