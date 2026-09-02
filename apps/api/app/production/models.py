import enum
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid

import sqlalchemy as sa
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin

JSON = JSONB().with_variant(sa.JSON(), "sqlite")


class MachineStatus(str, enum.Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    MAINTENANCE = "MAINTENANCE"
    OFFLINE = "OFFLINE"


class ProductionBatchStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Machine(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "machines"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    machine_type: Mapped[str] = mapped_column(String(100), nullable=False)  # DIGITAL_PRESS, ULTRASONIC_CUTTER, etc.
    status: Mapped[MachineStatus] = mapped_column(Enum(MachineStatus), default=MachineStatus.IDLE, nullable=False)
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    capabilities: Mapped[List["MachineCapability"]] = relationship(
        "MachineCapability", back_populates="machine", cascade="all, delete-orphan"
    )
    operator_assignments: Mapped[List["MachineOperatorAssignment"]] = relationship(
        "MachineOperatorAssignment", back_populates="machine", cascade="all, delete-orphan"
    )
    batches: Mapped[List["ProductionBatch"]] = relationship("ProductionBatch", back_populates="machine")


class MachineCapability(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "machine_capabilities"

    machine_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("machines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_category: Mapped[str] = mapped_column(String(100), nullable=False)
    speed_per_hour: Mapped[int] = mapped_column(Integer, default=500, nullable=False)
    setup_time_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)

    machine: Mapped["Machine"] = relationship("Machine", back_populates="capabilities")


class MachineOperatorAssignment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "machine_operator_assignments"

    machine_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("machines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    operator_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    shift: Mapped[str] = mapped_column(String(50), default="GENERAL", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    machine: Mapped["Machine"] = relationship("Machine", back_populates="operator_assignments")


class ProductionBatch(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "production_batches"

    batch_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
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
    product_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    machine_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("machines.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    operator_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    approved_file_version_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("file_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    material_lot_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_lots.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[ProductionBatchStatus] = mapped_column(
        Enum(ProductionBatchStatus), default=ProductionBatchStatus.PLANNED, nullable=False
    )
    input_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    output_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    reject_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    waste_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    machine: Mapped["Machine"] = relationship("Machine", back_populates="batches")
    records: Mapped[List["ProductionRecord"]] = relationship(
        "ProductionRecord", back_populates="batch", cascade="all, delete-orphan"
    )


class ProductionRecord(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "production_records"

    production_batch_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("production_batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    operator_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    good_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    reject_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    waste_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    operator_notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    batch: Mapped["ProductionBatch"] = relationship("ProductionBatch", back_populates="records")
