"""
Migration: Yeni tablo ve kolon eklemeleri
- query_logs.sources (JSON) — kaynak doküman takibi
- password_reset_tokens tablosu — şifre sıfırlama
Tarih: 2026-05-16
"""
from alembic import op
import sqlalchemy as sa


def upgrade():
    # query_logs.sources kolonu
    op.add_column(
        "query_logs",
        sa.Column("sources", sa.JSON(), nullable=True),
    )

    # password_reset_tokens tablosu
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_prt_user_id", "password_reset_tokens", ["user_id"])


def downgrade():
    op.drop_index("ix_prt_user_id", "password_reset_tokens")
    op.drop_table("password_reset_tokens")
    op.drop_column("query_logs", "sources")
