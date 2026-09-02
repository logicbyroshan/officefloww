"""Phase 3 automation, intelligence, quotations, and capacity schema

Revision ID: 0003_phase3_automation_intelligence
Revises: 0002_phase2_operational_layer
Create Date: 2026-09-02 15:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0003_phase3_automation_intelligence'
down_revision: Union[str, None] = '0002_phase2_operational_layer'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Pricing Rules & Tiers
    op.create_table(
        'pricing_rules',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_pricing_rules_product_id', 'pricing_rules', ['product_id'])

    op.create_table(
        'pricing_tiers',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('pricing_rule_id', sa.Uuid(), nullable=False),
        sa.Column('min_quantity', sa.Integer(), nullable=False),
        sa.Column('max_quantity', sa.Integer(), nullable=True),
        sa.Column('base_unit_price', sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column('discount_percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['pricing_rule_id'], ['pricing_rules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Quotations & Versions
    op.create_table(
        'quotations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('quotation_number', sa.String(length=50), nullable=False),
        sa.Column('client_id', sa.Uuid(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('current_version_number', sa.Integer(), nullable=False),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('subtotal', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('tax_amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('converted_order_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('quotation_number')
    )

    op.create_table(
        'quotation_items',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('quotation_id', sa.Uuid(), nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('specifications_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['quotation_id'], ['quotations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'quotation_versions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('quotation_id', sa.Uuid(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('snapshot_json', sa.JSON(), nullable=False),
        sa.Column('created_by_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['quotation_id'], ['quotations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'cost_calculation_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('quotation_id', sa.Uuid(), nullable=True),
        sa.Column('product_id', sa.Uuid(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('material_cost', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('wastage_cost', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('labour_cost', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('machine_cost', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('packing_cost', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('delivery_cost_estimate', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('overhead_cost', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('margin_amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('total_cost', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('suggested_unit_price', sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column('breakdown_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. Capacity & Absence
    op.create_table(
        'absence_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('handover_recommendations_json', sa.JSON(), nullable=True),
        sa.Column('approved_by_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'capacity_logs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('log_date', sa.Date(), nullable=False),
        sa.Column('resource_type', sa.String(length=50), nullable=False),
        sa.Column('resource_id', sa.Uuid(), nullable=False),
        sa.Column('total_capacity_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('allocated_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('available_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('utilization_percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 4. ETA Histories
    op.create_table(
        'eta_histories',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('order_id', sa.Uuid(), nullable=False),
        sa.Column('estimated_delivery_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('critical_path_hours', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('trigger_reason', sa.String(length=255), nullable=False),
        sa.Column('details_json', sa.JSON(), nullable=True),
        sa.Column('calculated_by_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. Automation Logs & Idempotency
    op.add_column('automation_rules', sa.Column('execution_count', sa.Integer(), server_default='0', nullable=False))

    op.create_table(
        'automation_logs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('rule_id', sa.Uuid(), nullable=True),
        sa.Column('event_name', sa.String(length=100), nullable=False),
        sa.Column('idempotency_key', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('payload_json', sa.JSON(), nullable=True),
        sa.Column('actions_executed_json', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['rule_id'], ['automation_rules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'idempotency_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('idempotency_key', sa.String(length=255), nullable=False),
        sa.Column('scope', sa.String(length=100), nullable=False),
        sa.Column('resource_id', sa.Uuid(), nullable=True),
        sa.Column('response_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('idempotency_key')
    )

    # 6. External Proof Links
    op.create_table(
        'external_proof_links',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('token', sa.String(length=128), nullable=False),
        sa.Column('file_version_id', sa.Uuid(), nullable=False),
        sa.Column('client_id', sa.Uuid(), nullable=False),
        sa.Column('contact_name', sa.String(length=255), nullable=False),
        sa.Column('contact_phone', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('feedback_notes', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['file_version_id'], ['file_versions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )


def downgrade() -> None:
    op.drop_table('external_proof_links')
    op.drop_table('idempotency_records')
    op.drop_table('automation_logs')
    op.drop_table('eta_histories')
    op.drop_table('capacity_logs')
    op.drop_table('absence_records')
    op.drop_table('cost_calculation_records')
    op.drop_table('quotation_versions')
    op.drop_table('quotation_items')
    op.drop_table('quotations')
    op.drop_table('pricing_tiers')
    op.drop_table('pricing_rules')
