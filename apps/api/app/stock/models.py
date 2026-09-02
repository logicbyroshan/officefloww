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


class StockLocationType(str, enum.Enum):
    MAIN_STORE = "MAIN_STORE"
    PRODUCTION = "PRODUCTION"
    MACHINE = "MACHINE"
    IN_HOUSE_WORKER = "IN_HOUSE_WORKER"
    OUTSIDE_LABOUR = "OUTSIDE_LABOUR"


class StockMovementType(str, enum.Enum):
    RECEIPT = "RECEIPT"
    RESERVATION = "RESERVATION"
    RELEASE_RESERVATION = "RELEASE_RESERVATION"
    ISSUE = "ISSUE"
    CONSUMPTION = "CONSUMPTION"
    RETURN = "RETURN"
    WASTE = "WASTE"
    ADJUSTMENT = "ADJUSTMENT"
    TRANSFER = "TRANSFER"


class ReservationStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARTIALLY_FULFILLED = "PARTIALLY_FULFILLED"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"


class StockLocation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "stock_locations"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    location_type: Mapped[StockLocationType] = mapped_column(
        Enum(StockLocationType),
        default=StockLocationType.MAIN_STORE,
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    lots: Mapped[List["StockLot"]] = relationship("StockLot", back_populates="location")


class StockItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "stock_items"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), default="RAW_MATERIAL", nullable=False)
    unit: Mapped[str] = mapped_column(String(50), default="PCS", nullable=False)  # PCS, METERS, KG, ROLLS
    min_stock_level: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    lots: Mapped[List["StockLot"]] = relationship("StockLot", back_populates="item", cascade="all, delete-orphan")
    movements: Mapped[List["StockMovement"]] = relationship("StockMovement", back_populates="item")
    reservations: Mapped[List["StockReservation"]] = relationship("StockReservation", back_populates="item")


class StockLot(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "stock_lots"

    stock_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_locations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    lot_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    initial_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    current_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    cost_per_unit: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    supplier_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    item: Mapped["StockItem"] = relationship("StockItem", back_populates="lots")
    location: Mapped["StockLocation"] = relationship("StockLocation", back_populates="lots")


class StockMovement(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "stock_movements"

    stock_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    lot_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_lots.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    movement_type: Mapped[StockMovementType] = mapped_column(
        Enum(StockMovementType),
        nullable=False,
        index=True,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    from_location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_locations.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    to_location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_locations.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    order_item_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("order_items.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    item: Mapped["StockItem"] = relationship("StockItem", back_populates="movements")


class StockReservation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "stock_reservations"

    stock_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_item_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("order_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reserved_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    fulfilled_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    status: Mapped[ReservationStatus] = mapped_column(
        Enum(ReservationStatus),
        default=ReservationStatus.PENDING,
        nullable=False,
    )

    item: Mapped["StockItem"] = relationship("StockItem", back_populates="reservations")
