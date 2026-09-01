"""Add forecasting models

Revision ID: 06ddb286a848
Revises: 4ab3a6ad7469
Create Date: 2026-09-01 14:38:40.893543

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '06ddb286a848'
down_revision: Union[str, None] = '4ab3a6ad7469'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to model_runs
    op.add_column('model_runs', sa.Column('method', sa.String(length=100), nullable=True))
    op.add_column('model_runs', sa.Column('source', sa.String(length=255), nullable=True))
    op.add_column('model_runs', sa.Column('parameters', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('model_runs', sa.Column('horizon_days', sa.Integer(), nullable=True))
    op.add_column('model_runs', sa.Column('provenance', sa.String(length=100), nullable=True))
    op.add_column('model_runs', sa.Column('status', sa.String(length=50), nullable=True))

    # Add columns to forecasts
    op.add_column('forecasts', sa.Column('equipment_type_name', sa.String(length=255), nullable=True))
    op.add_column('forecasts', sa.Column('period_start', sa.Date(), nullable=True))
    op.add_column('forecasts', sa.Column('period_end', sa.Date(), nullable=True))
    op.add_column('forecasts', sa.Column('available_supply', sa.Integer(), nullable=True))
    op.add_column('forecasts', sa.Column('demand_gap', sa.Integer(), nullable=True))
    op.add_column('forecasts', sa.Column('confidence', sa.Float(), nullable=True))
    op.add_column('forecasts', sa.Column('evidence', sa.Text(), nullable=True))
    op.add_column('forecasts', sa.Column('provenance', sa.String(length=100), nullable=True))
    op.add_column('forecasts', sa.Column('method', sa.String(length=100), nullable=True))


def downgrade() -> None:
    # Remove columns from forecasts
    op.drop_column('forecasts', 'method')
    op.drop_column('forecasts', 'provenance')
    op.drop_column('forecasts', 'evidence')
    op.drop_column('forecasts', 'confidence')
    op.drop_column('forecasts', 'demand_gap')
    op.drop_column('forecasts', 'available_supply')
    op.drop_column('forecasts', 'period_end')
    op.drop_column('forecasts', 'period_start')
    op.drop_column('forecasts', 'equipment_type_name')

    # Remove columns from model_runs
    op.drop_column('model_runs', 'status')
    op.drop_column('model_runs', 'provenance')
    op.drop_column('model_runs', 'horizon_days')
    op.drop_column('model_runs', 'parameters')
    op.drop_column('model_runs', 'source')
    op.drop_column('model_runs', 'method')
