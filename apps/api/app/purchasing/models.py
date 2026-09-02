import enum
from datetime import datetime, timezone, date
from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid

import sqlalchemy as sa
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin

JSON = JSONB().with_variant(sa.JSON(), "sqlite")


class POStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    RECOMMENDED = "RECOMMENDED"
    APPROVED = "APPROVED"
    SENT = "SENT"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"


class GRNStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class Supplier(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "suppliers"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    contact_person: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tax_identifier: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # GSTIN
    billing_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    contacts: Mapped[List["SupplierContact"]] = relationship(
        "SupplierContact", back_populates="supplier", cascade="all, delete-orphan", lazy="selectin"
    )
    products: Mapped[List["SupplierProduct"]] = relationship(
        "SupplierProduct", back_populates="supplier", cascade="all, delete-orphan"
    )
    purchase_orders: Mapped[List["PurchaseOrder"]] = relationship("PurchaseOrder", back_populates="supplier")


class SupplierContact(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "supplier_contacts"

    supplier_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="contacts")


class SupplierProduct(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "supplier_products"

    supplier_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stock_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    supplier_part_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    standard_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    lead_time_days: Mapped[int] = mapped_column(sa.Integer, default=3, nullable=False)

    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="products")


class SupplierPriceHistory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "supplier_price_history"

    supplier_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stock_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    transport_charge: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    landed_cost_per_unit: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    previous_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 4), nullable=True)
    absolute_increase: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 4), nullable=True)
    percentage_increase: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 4), nullable=True)
    purchase_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)


class PurchaseOrder(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "purchase_orders"

    po_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    supplier_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[POStatus] = mapped_column(Enum(POStatus), default=POStatus.DRAFT, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    approved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="purchase_orders")
    items: Mapped[List["PurchaseOrderItem"]] = relationship(
        "PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan", lazy="selectin"
    )
    goods_receipts: Mapped[List["GoodsReceipt"]] = relationship("GoodsReceipt", back_populates="purchase_order")


class PurchaseOrderItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "purchase_order_items"

    purchase_order_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("purchase_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stock_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    received_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)

    purchase_order: Mapped["PurchaseOrder"] = relationship("PurchaseOrder", back_populates="items")


class GoodsReceipt(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "goods_receipts"

    grn_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    purchase_order_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("purchase_orders.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    supplier_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    received_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    status: Mapped[GRNStatus] = mapped_column(Enum(GRNStatus), default=GRNStatus.RECEIVED, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    purchase_order: Mapped["PurchaseOrder"] = relationship("PurchaseOrder", back_populates="goods_receipts")
    items: Mapped[List["GoodsReceiptItem"]] = relationship(
        "GoodsReceiptItem", back_populates="goods_receipt", cascade="all, delete-orphan", lazy="selectin"
    )


class GoodsReceiptItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "goods_receipt_items"

    goods_receipt_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("goods_receipts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    purchase_order_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("purchase_order_items.id", ondelete="RESTRICT"),
        nullable=False,
    )
    stock_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_items.id", ondelete="RESTRICT"),
        nullable=False,
    )
    received_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    accepted_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    rejected_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    lot_number: Mapped[str] = mapped_column(String(100), nullable=False)

    goods_receipt: Mapped["GoodsReceipt"] = relationship("GoodsReceipt", back_populates="items")
