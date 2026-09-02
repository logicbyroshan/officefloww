import enum
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List
import uuid

import sqlalchemy as sa
from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PackingStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    VERIFIED = "VERIFIED"


class PackageType(str, enum.Enum):
    BOX = "BOX"
    BUNDLE = "BUNDLE"
    CARTON = "CARTON"
    PALLET = "PALLET"
    ENVELOPE = "ENVELOPE"


class PackingTask(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "packing_tasks"

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
    task_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
    )
    target_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    packed_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    status: Mapped[PackingStatus] = mapped_column(
        Enum(PackingStatus), default=PackingStatus.PENDING, nullable=False
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    packages: Mapped[List["Package"]] = relationship(
        "Package", back_populates="packing_task", cascade="all, delete-orphan", lazy="selectin"
    )
    records: Mapped[List["PackingRecord"]] = relationship(
        "PackingRecord", back_populates="packing_task", cascade="all, delete-orphan", lazy="selectin"
    )


class Package(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "packages"

    package_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    packing_task_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("packing_tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
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
    package_type: Mapped[PackageType] = mapped_column(
        Enum(PackageType), default=PackageType.BOX, nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=Decimal("0.0"), nullable=False)
    dimensions: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g. "30x20x15 cm"
    label_text: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    packing_task: Mapped["PackingTask"] = relationship("PackingTask", back_populates="packages")


class PackingRecord(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "packing_records"

    packing_task_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("packing_tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    packer_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    verifier_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
    )
    verified_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    packing_task: Mapped["PackingTask"] = relationship("PackingTask", back_populates="records")
