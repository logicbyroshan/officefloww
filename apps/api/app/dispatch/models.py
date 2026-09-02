import enum
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List
import uuid

import sqlalchemy as sa
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class TransportType(str, enum.Enum):
    BUS = "BUS"
    DTDC = "DTDC"
    PORTER = "PORTER"
    COURIER = "COURIER"
    OTHER = "OTHER"


class DeliveryStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    BOOKED = "BOOKED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    RETURNED = "RETURNED"
    FAILED = "FAILED"


class ReimbursementStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REIMBURSED = "REIMBURSED"
    REJECTED = "REJECTED"


class TransportProvider(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "transport_providers"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    provider_type: Mapped[TransportType] = mapped_column(Enum(TransportType), default=TransportType.COURIER)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    account_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class DeliveryPartner(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "delivery_partners"

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    partner_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    vehicle_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # BIKE, VAN, AUTO
    vehicle_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Delivery(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "deliveries"

    delivery_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    order_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    delivery_partner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("delivery_partners.id", ondelete="SET NULL"),
        nullable=True,
    )
    transport_provider_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("transport_providers.id", ondelete="SET NULL"),
        nullable=True,
    )
    transport_type: Mapped[TransportType] = mapped_column(Enum(TransportType), default=TransportType.BUS)
    destination_address: Mapped[str] = mapped_column(Text, nullable=False)
    destination_city: Mapped[str] = mapped_column(String(100), nullable=False)
    total_packages: Mapped[int] = mapped_column(sa.Integer, default=1, nullable=False)
    total_weight_kg: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=Decimal("0.0"), nullable=False)
    status: Mapped[DeliveryStatus] = mapped_column(Enum(DeliveryStatus), default=DeliveryStatus.DRAFT, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    bookings: Mapped[List["DeliveryBooking"]] = relationship("DeliveryBooking", back_populates="delivery", lazy="selectin")
    expenses: Mapped[List["DeliveryExpense"]] = relationship("DeliveryExpense", back_populates="delivery", lazy="selectin")
    exceptions: Mapped[List["DeliveryException"]] = relationship("DeliveryException", back_populates="delivery", lazy="selectin")


class DeliveryBooking(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "delivery_bookings"

    delivery_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("deliveries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    booking_reference: Mapped[str] = mapped_column(String(100), nullable=False)  # LR / Docket number
    booking_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    charge_amount: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0.0"), nullable=False)
    paid_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    booked_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    receipt_file_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)

    delivery: Mapped["Delivery"] = relationship("Delivery", back_populates="bookings")


class DeliveryExpense(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "delivery_expenses"

    delivery_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("deliveries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    paid_by_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    expense_type: Mapped[str] = mapped_column(String(100), default="BUS_CHARGE")
    receipt_file_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    reimbursement_status: Mapped[ReimbursementStatus] = mapped_column(
        Enum(ReimbursementStatus), default=ReimbursementStatus.PENDING, nullable=False
    )
    approved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    reimbursed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    delivery: Mapped["Delivery"] = relationship("Delivery", back_populates="expenses")


class DeliveryException(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "delivery_exceptions"

    delivery_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("deliveries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    expected_value: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g. "Destination: Indore"
    actual_value: Mapped[str] = mapped_column(String(255), nullable=False)    # e.g. "Booked: Bhopal"
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_by_id: Mapped[uuid.UUID] = mapped_column(sa.Uuid(as_uuid=True), nullable=False)
    evidence_file_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    delivery: Mapped["Delivery"] = relationship("Delivery", back_populates="exceptions")
