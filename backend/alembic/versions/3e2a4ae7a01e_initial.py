"""
Initial migration (Dummy script to fix broken alembic graph)
"""
from alembic import op
import sqlalchemy as sa

revision = '3e2a4ae7a01e'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    pass

def downgrade():
    pass
