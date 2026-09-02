import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class QuotationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT_TO_CLIENT = "SENT_TO_CLIENT"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    CONVERTED_TO_ORDER = "CONVERTED_TO_ORDER"


class FeasibilityStatus(str, enum.Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    RED = "RED"


class PricingRule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "pricing_rules"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    tiers: Mapped[List["PricingTier"]] = relationship(
        "PricingTier", back_populates="rule", cascade="all, delete-orphan", lazy="selectin"
    )


class PricingTier(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "pricing_tiers"

    pricing_rule_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("pricing_rules.id", ondelete="CASCADE"), nullable=False, index=True
    )
    min_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    max_quantity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # None = 5000+
    base_unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    discount_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.0"), nullable=False)

    rule: Mapped["PricingRule"] = relationship("PricingRule", back_populates="tiers")


class Quotation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "quotations"

    quotation_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    client_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    status: Mapped[QuotationStatus] = mapped_column(
        SAEnum(QuotationStatus, native_enum=False, length=50), default=QuotationStatus.DRAFT, nullable=False
    )
    current_version_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    subtotal: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.0"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.0"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.0"), nullable=False)
    converted_order_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), nullable=True)

    items: Mapped[List["QuotationItem"]] = relationship(
        "QuotationItem", back_populates="quotation", cascade="all, delete-orphan", lazy="selectin"
    )
    versions: Mapped[List["QuotationVersion"]] = relationship(
        "QuotationVersion", back_populates="quotation", cascade="all, delete-orphan", lazy="selectin"
    )


class QuotationItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "quotation_items"

    quotation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    specifications_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)

    quotation: Mapped["Quotation"] = relationship("Quotation", back_populates="items")


class QuotationVersion(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "quotation_versions"

    quotation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), nullable=True)

    quotation: Mapped["Quotation"] = relationship("Quotation", back_populates="versions")


class CostCalculationRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "cost_calculation_records"

    quotation_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=True, index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    material_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.0"), nullable=False)
    wastage_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.0"), nullable=False)
    labour_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.0"), nullable=False)
    machine_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.0"), nullable=False)
    packing_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.0"), nullable=False)
    delivery_cost_estimate: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.0"), nullable=False)
    overhead_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.0"), nullable=False)
    margin_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.0"), nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.0"), nullable=False)
    suggested_unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    breakdown_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
