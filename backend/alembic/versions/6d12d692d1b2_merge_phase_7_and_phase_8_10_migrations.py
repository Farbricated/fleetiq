"""merge phase 7 and phase 8-10 migrations

Revision ID: 6d12d692d1b2
Revises: 06ddb286a848, a756af4ec22f
Create Date: 2026-09-01 15:13:54.638330

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6d12d692d1b2'
down_revision: Union[str, Sequence[str], None] = ('06ddb286a848', 'a756af4ec22f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
