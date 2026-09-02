import enum
from datetime import datetime, timezone, date
from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid

import sqlalchemy as sa
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin

JSON = JSONB().with_variant(sa.JSON(), "sqlite")


class LabourType(str, enum.Enum):
    IN_HOUSE = "IN_HOUSE"
    OUTSIDE_CONTRACT = "OUTSIDE_CONTRACT"
    STUDENT_PART_TIME = "STUDENT_PART_TIME"


class LabourAvailabilityStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    UNAVAILABLE = "UNAVAILABLE"
    PARTIAL = "PARTIAL"


class LabourBatchStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    CANCELLED = "CANCELLED"


class DefectReason(str, enum.Enum):
    MATERIAL_DEFECT = "MATERIAL_DEFECT"
    WORKMANSHIP = "WORKMANSHIP"
    DAMAGE = "DAMAGE"
    UNKNOWN = "UNKNOWN"


class LabourStockTransactionType(str, enum.Enum):
    ISSUED = "ISSUED"
    CONSUMED = "CONSUMED"
    DEFECTIVE = "DEFECTIVE"
    RETURNED = "RETURNED"
    TRANSFERRED_IN = "TRANSFERRED_IN"
    TRANSFERRED_OUT = "TRANSFERRED_OUT"
    ADJUSTMENT = "ADJUSTMENT"


class LabourPaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class Labourer(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "labourers"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    labour_type: Mapped[LabourType] = mapped_column(
        Enum(LabourType), default=LabourType.OUTSIDE_CONTRACT, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    skills: Mapped[List["LabourSkill"]] = relationship(
        "LabourSkill", back_populates="labourer", cascade="all, delete-orphan", lazy="selectin"
    )
    availabilities: Mapped[List["LabourAvailability"]] = relationship(
        "LabourAvailability", back_populates="labourer", cascade="all, delete-orphan", lazy="selectin"
    )
    batches: Mapped[List["LabourBatch"]] = relationship("LabourBatch", back_populates="labourer")
    stock_ledger: Mapped[List["LabourStockLedger"]] = relationship("LabourStockLedger", back_populates="labourer")
    payments: Mapped[List["LabourPayment"]] = relationship("LabourPayment", back_populates="labourer")


class LabourSkill(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "labour_skills"

    labourer_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("labourers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_name: Mapped[str] = mapped_column(String(100), nullable=False)
    proficiency_level: Mapped[int] = mapped_column(Integer, default=3, nullable=False)  # 1 to 5

    labourer: Mapped["Labourer"] = relationship("Labourer", back_populates="skills")


class LabourAvailability(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "labour_availabilities"

    labourer_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("labourers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[LabourAvailabilityStatus] = mapped_column(
        Enum(LabourAvailabilityStatus), default=LabourAvailabilityStatus.AVAILABLE, nullable=False
    )
    max_quantity_preference: Mapped[int] = mapped_column(Integer, default=1000, nullable=False)
    available_from: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    available_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    labourer: Mapped["Labourer"] = relationship("Labourer", back_populates="availabilities")


class LabourRate(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "labour_rates"

    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    operation_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # e.g. "MPL_FITTING"
    rate_per_unit: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)  # e.g. 0.80
    effective_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class LabourBatch(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "labour_batches"

    batch_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    order_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    order_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("order_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    labourer_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("labourers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    operation_name: Mapped[str] = mapped_column(String(100), nullable=False)
    allocated_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    completed_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    defective_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    rate_per_unit: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    status: Mapped[LabourBatchStatus] = mapped_column(
        Enum(LabourBatchStatus), default=LabourBatchStatus.ASSIGNED, nullable=False
    )
    assigned_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    labourer: Mapped["Labourer"] = relationship("Labourer", back_populates="batches")
    submissions: Mapped[List["LabourSubmission"]] = relationship(
        "LabourSubmission", back_populates="batch", cascade="all, delete-orphan", lazy="selectin"
    )


class LabourSubmission(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "labour_submissions"

    labour_batch_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("labour_batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    completed_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    defective_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    unused_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    returned_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    defect_reason: Mapped[DefectReason] = mapped_column(
        Enum(DefectReason), default=DefectReason.UNKNOWN, nullable=False
    )
    evidence_file_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    batch: Mapped["LabourBatch"] = relationship("LabourBatch", back_populates="submissions")


class LabourStockLedger(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "labour_stock_ledgers"

    labourer_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("labourers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    stock_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    transaction_type: Mapped[LabourStockTransactionType] = mapped_column(
        Enum(LabourStockTransactionType), nullable=False, index=True
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    order_item_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    labourer: Mapped["Labourer"] = relationship("Labourer", back_populates="stock_ledger")


class LabourPayment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "labour_payments"

    payment_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    labourer_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("labourers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    total_accepted_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    total_payable_amount: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    status: Mapped[LabourPaymentStatus] = mapped_column(
        Enum(LabourPaymentStatus), default=LabourPaymentStatus.PENDING, nullable=False
    )
    approved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    payment_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Bank ref, UPI ID
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    labourer: Mapped["Labourer"] = relationship("Labourer", back_populates="payments")
    ledger_entries: Mapped[List["LabourPaymentLedger"]] = relationship(
        "LabourPaymentLedger", back_populates="payment", cascade="all, delete-orphan", lazy="selectin"
    )


class LabourPaymentLedger(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "labour_payment_ledgers"

    labour_payment_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("labour_payments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    labour_batch_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("labour_batches.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    accepted_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    rate_per_unit: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)

    payment: Mapped["LabourPayment"] = relationship("LabourPayment", back_populates="ledger_entries")


class LabourPerformance(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "labour_performances"

    labourer_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("labourers.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    total_assigned_units: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    total_completed_units: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    total_defective_units: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    on_time_batches: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    late_batches: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    productivity_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("100.00"), nullable=False)
    quality_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("100.00"), nullable=False)
    on_time_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("100.00"), nullable=False)
    reliability_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("100.00"), nullable=False)
