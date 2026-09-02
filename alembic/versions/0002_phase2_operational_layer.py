"""Phase 2 physical operational layer schema

Revision ID: 0002_phase2_operational_layer
Revises: 0001_initial_schema
Create Date: 2026-09-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_phase2_operational_layer"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ----------------------------------------------------
    # 1. Stock Engine
    # ----------------------------------------------------
    op.create_table(
        "stock_locations",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("location_type", sa.String(50), nullable=False, default="MAIN_STORE"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "stock_items",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(100), nullable=False, default="RAW_MATERIAL"),
        sa.Column("unit", sa.String(50), nullable=False, default="PCS"),
        sa.Column("min_stock_level", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("cost_price", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "stock_lots",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("stock_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("location_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_locations.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("lot_number", sa.String(100), nullable=False),
        sa.Column("initial_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("current_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("cost_per_unit", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("supplier_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "stock_movements",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("stock_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_items.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("lot_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_lots.id", ondelete="SET NULL"), nullable=True),
        sa.Column("movement_type", sa.String(50), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("from_location_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_locations.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("to_location_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_locations.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("order_id", sa.Uuid(as_uuid=True), sa.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True),
        sa.Column("order_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("order_items.id", ondelete="SET NULL"), nullable=True),
        sa.Column("actor_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("reason", sa.String(255), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "stock_reservations",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("stock_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", sa.Uuid(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reserved_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("fulfilled_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("status", sa.String(50), nullable=False, default="PENDING"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # ----------------------------------------------------
    # 2. Purchasing & Suppliers
    # ----------------------------------------------------
    op.create_table(
        "suppliers",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("contact_person", sa.String(100), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(100), nullable=True),
        sa.Column("tax_identifier", sa.String(50), nullable=True),
        sa.Column("billing_address", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "supplier_contacts",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("supplier_id", sa.Uuid(as_uuid=True), sa.ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(100), nullable=True),
        sa.Column("designation", sa.String(100), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False, default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "supplier_products",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("supplier_id", sa.Uuid(as_uuid=True), sa.ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stock_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_items.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("supplier_part_number", sa.String(100), nullable=True),
        sa.Column("standard_price", sa.Numeric(12, 4), nullable=False),
        sa.Column("lead_time_days", sa.Integer(), nullable=False, default=3),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "supplier_price_history",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("supplier_id", sa.Uuid(as_uuid=True), sa.ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stock_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_items.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 4), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("tax_amount", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("transport_charge", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("landed_cost_per_unit", sa.Numeric(12, 4), nullable=False),
        sa.Column("previous_price", sa.Numeric(12, 4), nullable=True),
        sa.Column("absolute_increase", sa.Numeric(12, 4), nullable=True),
        sa.Column("percentage_increase", sa.Numeric(12, 4), nullable=True),
        sa.Column("purchase_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "purchase_orders",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("po_number", sa.String(100), nullable=False, unique=True),
        sa.Column("supplier_id", sa.Uuid(as_uuid=True), sa.ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, default="DRAFT"),
        sa.Column("total_amount", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("created_by_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("approved_by_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "purchase_order_items",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("purchase_order_id", sa.Uuid(as_uuid=True), sa.ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stock_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_items.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 4), nullable=False),
        sa.Column("received_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "goods_receipts",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("grn_number", sa.String(100), nullable=False, unique=True),
        sa.Column("purchase_order_id", sa.Uuid(as_uuid=True), sa.ForeignKey("purchase_orders.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("supplier_id", sa.Uuid(as_uuid=True), sa.ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("received_by_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, default="RECEIVED"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "goods_receipt_items",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("goods_receipt_id", sa.Uuid(as_uuid=True), sa.ForeignKey("goods_receipts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("purchase_order_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("purchase_order_items.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("stock_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_items.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("received_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("accepted_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("rejected_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("unit_cost", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("lot_number", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # ----------------------------------------------------
    # 3. Production Engine & Batch Traceability
    # ----------------------------------------------------
    op.create_table(
        "machines",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("machine_type", sa.String(100), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, default="IDLE"),
        sa.Column("location_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_locations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "machine_capabilities",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("machine_id", sa.Uuid(as_uuid=True), sa.ForeignKey("machines.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_category", sa.String(100), nullable=False),
        sa.Column("speed_per_hour", sa.Integer(), nullable=False, default=500),
        sa.Column("setup_time_minutes", sa.Integer(), nullable=False, default=15),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "machine_operator_assignments",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("machine_id", sa.Uuid(as_uuid=True), sa.ForeignKey("machines.id", ondelete="CASCADE"), nullable=False),
        sa.Column("operator_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("shift", sa.String(50), nullable=False, default="GENERAL"),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "production_batches",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("batch_number", sa.String(100), nullable=False, unique=True),
        sa.Column("order_id", sa.Uuid(as_uuid=True), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("order_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("order_items.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("product_id", sa.Uuid(as_uuid=True), sa.ForeignKey("products.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("machine_id", sa.Uuid(as_uuid=True), sa.ForeignKey("machines.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("operator_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("approved_file_version_id", sa.Uuid(as_uuid=True), sa.ForeignKey("file_versions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("material_lot_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_lots.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, default="PLANNED"),
        sa.Column("input_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("output_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("reject_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("waste_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "production_records",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("production_batch_id", sa.Uuid(as_uuid=True), sa.ForeignKey("production_batches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("operator_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("good_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("reject_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("waste_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("operator_notes", sa.String(255), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
    )

    # ----------------------------------------------------
    # 4. Labour Module & Material Credit
    # ----------------------------------------------------
    op.create_table(
        "labourers",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(50), nullable=False),
        sa.Column("email", sa.String(100), nullable=True),
        sa.Column("labour_type", sa.String(50), nullable=False, default="OUTSIDE_CONTRACT"),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "labour_skills",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("labourer_id", sa.Uuid(as_uuid=True), sa.ForeignKey("labourers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("skill_name", sa.String(100), nullable=False),
        sa.Column("proficiency_level", sa.Integer(), nullable=False, default=3),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "labour_availabilities",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("labourer_id", sa.Uuid(as_uuid=True), sa.ForeignKey("labourers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, default="AVAILABLE"),
        sa.Column("max_quantity_preference", sa.Integer(), nullable=False, default=1000),
        sa.Column("available_from", sa.Date(), nullable=True),
        sa.Column("available_until", sa.Date(), nullable=True),
        sa.Column("notes", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "labour_rates",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("product_id", sa.Uuid(as_uuid=True), sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("operation_name", sa.String(100), nullable=False),
        sa.Column("rate_per_unit", sa.Numeric(12, 4), nullable=False),
        sa.Column("effective_date", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "labour_batches",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("batch_code", sa.String(100), nullable=False, unique=True),
        sa.Column("order_id", sa.Uuid(as_uuid=True), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("order_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("order_items.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("labourer_id", sa.Uuid(as_uuid=True), sa.ForeignKey("labourers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("operation_name", sa.String(100), nullable=False),
        sa.Column("allocated_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("completed_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("defective_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("rate_per_unit", sa.Numeric(12, 4), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, default="ASSIGNED"),
        sa.Column("assigned_by_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "labour_submissions",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("labour_batch_id", sa.Uuid(as_uuid=True), sa.ForeignKey("labour_batches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("completed_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("defective_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("unused_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("returned_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("defect_reason", sa.String(50), nullable=False, default="UNKNOWN"),
        sa.Column("evidence_file_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "labour_stock_ledgers",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("labourer_id", sa.Uuid(as_uuid=True), sa.ForeignKey("labourers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("stock_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_items.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("transaction_type", sa.String(50), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("order_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("order_item_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("actor_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("notes", sa.String(255), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "labour_payments",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("payment_number", sa.String(100), nullable=False, unique=True),
        sa.Column("labourer_id", sa.Uuid(as_uuid=True), sa.ForeignKey("labourers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("total_accepted_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("total_payable_amount", sa.Numeric(12, 4), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, default="PENDING"),
        sa.Column("approved_by_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("payment_reference", sa.String(100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "labour_payment_ledgers",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("labour_payment_id", sa.Uuid(as_uuid=True), sa.ForeignKey("labour_payments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("labour_batch_id", sa.Uuid(as_uuid=True), sa.ForeignKey("labour_batches.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("accepted_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("rate_per_unit", sa.Numeric(12, 4), nullable=False),
        sa.Column("amount", sa.Numeric(12, 4), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "labour_performances",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("labourer_id", sa.Uuid(as_uuid=True), sa.ForeignKey("labourers.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("total_assigned_units", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("total_completed_units", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("total_defective_units", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("on_time_batches", sa.Integer(), nullable=False, default=0),
        sa.Column("late_batches", sa.Integer(), nullable=False, default=0),
        sa.Column("productivity_score", sa.Numeric(5, 2), nullable=False, default=100.00),
        sa.Column("quality_score", sa.Numeric(5, 2), nullable=False, default=100.00),
        sa.Column("on_time_percentage", sa.Numeric(5, 2), nullable=False, default=100.00),
        sa.Column("reliability_score", sa.Numeric(5, 2), nullable=False, default=100.00),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # ----------------------------------------------------
    # 5. Assets & Tools
    # ----------------------------------------------------
    op.create_table(
        "asset_types",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "assets",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("asset_code", sa.String(50), nullable=False, unique=True),
        sa.Column("asset_type_id", sa.Uuid(as_uuid=True), sa.ForeignKey("asset_types.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("serial_number", sa.String(100), nullable=True),
        sa.Column("condition", sa.String(50), nullable=False, default="GOOD"),
        sa.Column("current_holder_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("location_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stock_locations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "asset_assignments",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("asset_id", sa.Uuid(as_uuid=True), sa.ForeignKey("assets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assigned_to_user_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("assigned_to_labourer_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("condition_on_issue", sa.String(50), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("condition_on_return", sa.String(50), nullable=True),
        sa.Column("notes", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "asset_movements",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("asset_id", sa.Uuid(as_uuid=True), sa.ForeignKey("assets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("from_location_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("to_location_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("actor_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.String(255), nullable=True),
    )

    # ----------------------------------------------------
    # 6. Packing
    # ----------------------------------------------------
    op.create_table(
        "packing_tasks",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("order_id", sa.Uuid(as_uuid=True), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("order_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("order_items.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("task_id", sa.Uuid(as_uuid=True), sa.ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True),
        sa.Column("target_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("packed_quantity", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("status", sa.String(50), nullable=False, default="PENDING"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "packages",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("package_number", sa.String(100), nullable=False, unique=True),
        sa.Column("packing_task_id", sa.Uuid(as_uuid=True), sa.ForeignKey("packing_tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", sa.Uuid(as_uuid=True), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("order_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("order_items.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("package_type", sa.String(50), nullable=False, default="BOX"),
        sa.Column("quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("weight_kg", sa.Numeric(8, 2), nullable=False, default=0.0),
        sa.Column("dimensions", sa.String(100), nullable=True),
        sa.Column("label_text", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "packing_records",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("packing_task_id", sa.Uuid(as_uuid=True), sa.ForeignKey("packing_tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("packer_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("verifier_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("verified_quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.String(255), nullable=True),
    )

    # ----------------------------------------------------
    # 7. Dispatch & Delivery
    # ----------------------------------------------------
    op.create_table(
        "transport_providers",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("provider_type", sa.String(50), nullable=False, default="COURIER"),
        sa.Column("contact_phone", sa.String(50), nullable=True),
        sa.Column("account_number", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "delivery_partners",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("partner_name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(50), nullable=False),
        sa.Column("vehicle_type", sa.String(50), nullable=True),
        sa.Column("vehicle_number", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "deliveries",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("delivery_number", sa.String(100), nullable=False, unique=True),
        sa.Column("order_id", sa.Uuid(as_uuid=True), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("delivery_partner_id", sa.Uuid(as_uuid=True), sa.ForeignKey("delivery_partners.id", ondelete="SET NULL"), nullable=True),
        sa.Column("transport_provider_id", sa.Uuid(as_uuid=True), sa.ForeignKey("transport_providers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("transport_type", sa.String(50), nullable=False, default="BUS"),
        sa.Column("destination_address", sa.Text(), nullable=False),
        sa.Column("destination_city", sa.String(100), nullable=False),
        sa.Column("total_packages", sa.Integer(), nullable=False, default=1),
        sa.Column("total_weight_kg", sa.Numeric(8, 2), nullable=False, default=0.0),
        sa.Column("status", sa.String(50), nullable=False, default="DRAFT"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "delivery_bookings",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("delivery_id", sa.Uuid(as_uuid=True), sa.ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("booking_reference", sa.String(100), nullable=False),
        sa.Column("booking_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("charge_amount", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("paid_by_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("booked_by_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("receipt_file_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "delivery_expenses",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("delivery_id", sa.Uuid(as_uuid=True), sa.ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", sa.Uuid(as_uuid=True), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("paid_by_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 4), nullable=False),
        sa.Column("expense_type", sa.String(100), nullable=False, default="BUS_CHARGE"),
        sa.Column("receipt_file_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("reimbursement_status", sa.String(50), nullable=False, default="PENDING"),
        sa.Column("approved_by_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("reimbursed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "delivery_exceptions",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("delivery_id", sa.Uuid(as_uuid=True), sa.ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expected_value", sa.String(255), nullable=False),
        sa.Column("actual_value", sa.String(255), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("recorded_by_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("evidence_file_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("is_resolved", sa.Boolean(), nullable=False, default=False),
        sa.Column("resolution_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # ----------------------------------------------------
    # 8. Billing & Payments
    # ----------------------------------------------------
    op.create_table(
        "invoices",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("invoice_number", sa.String(100), nullable=False, unique=True),
        sa.Column("order_id", sa.Uuid(as_uuid=True), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("client_id", sa.Uuid(as_uuid=True), sa.ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, default="DRAFT"),
        sa.Column("issue_date", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("subtotal", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("tax_amount", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("total_amount", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("paid_amount", sa.Numeric(12, 4), nullable=False, default=0.0),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "invoice_items",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("invoice_id", sa.Uuid(as_uuid=True), sa.ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_item_id", sa.Uuid(as_uuid=True), sa.ForeignKey("order_items.id", ondelete="SET NULL"), nullable=True),
        sa.Column("description", sa.String(255), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 4), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 4), nullable=False),
        sa.Column("tax_rate", sa.Numeric(5, 2), nullable=False, default=18.00),
        sa.Column("amount", sa.Numeric(12, 4), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "payments",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("payment_number", sa.String(100), nullable=False, unique=True),
        sa.Column("invoice_id", sa.Uuid(as_uuid=True), sa.ForeignKey("invoices.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("client_id", sa.Uuid(as_uuid=True), sa.ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 4), nullable=False),
        sa.Column("payment_date", sa.Date(), nullable=False),
        sa.Column("payment_method", sa.String(50), nullable=False, default="BANK_TRANSFER"),
        sa.Column("reference_number", sa.String(100), nullable=True),
        sa.Column("received_by_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("notes", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "client_ledgers",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("client_id", sa.Uuid(as_uuid=True), sa.ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("transaction_type", sa.String(50), nullable=False),
        sa.Column("amount", sa.Numeric(12, 4), nullable=False),
        sa.Column("balance_after", sa.Numeric(12, 4), nullable=False),
        sa.Column("reference_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    # Reverse drops
    op.drop_table("client_ledgers")
    op.drop_table("payments")
    op.drop_table("invoice_items")
    op.drop_table("invoices")
    op.drop_table("delivery_exceptions")
    op.drop_table("delivery_expenses")
    op.drop_table("delivery_bookings")
    op.drop_table("deliveries")
    op.drop_table("delivery_partners")
    op.drop_table("transport_providers")
    op.drop_table("packing_records")
    op.drop_table("packages")
    op.drop_table("packing_tasks")
    op.drop_table("asset_movements")
    op.drop_table("asset_assignments")
    op.drop_table("assets")
    op.drop_table("asset_types")
    op.drop_table("labour_performances")
    op.drop_table("labour_payment_ledgers")
    op.drop_table("labour_payments")
    op.drop_table("labour_stock_ledgers")
    op.drop_table("labour_submissions")
    op.drop_table("labour_batches")
    op.drop_table("labour_rates")
    op.drop_table("labour_availabilities")
    op.drop_table("labour_skills")
    op.drop_table("labourers")
    op.drop_table("production_records")
    op.drop_table("production_batches")
    op.drop_table("machine_operator_assignments")
    op.drop_table("machine_capabilities")
    op.drop_table("machines")
    op.drop_table("goods_receipt_items")
    op.drop_table("goods_receipts")
    op.drop_table("purchase_order_items")
    op.drop_table("purchase_orders")
    op.drop_table("supplier_price_history")
    op.drop_table("supplier_products")
    op.drop_table("supplier_contacts")
    op.drop_table("suppliers")
    op.drop_table("stock_reservations")
    op.drop_table("stock_movements")
    op.drop_table("stock_lots")
    op.drop_table("stock_items")
    op.drop_table("stock_locations")
