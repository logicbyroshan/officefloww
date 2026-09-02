import enum
from datetime import datetime, timezone
from typing import Optional, List
import uuid

import sqlalchemy as sa
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AssetCondition(str, enum.Enum):
    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    FAIR = "FAIR"
    DAMAGED = "DAMAGED"
    LOST = "LOST"


class AssetType(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "asset_types"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    assets: Mapped[List["Asset"]] = relationship("Asset", back_populates="asset_type")


class Asset(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "assets"

    asset_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    asset_type_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("asset_types.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    serial_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    condition: Mapped[AssetCondition] = mapped_column(
        Enum(AssetCondition), default=AssetCondition.GOOD, nullable=False
    )
    current_holder_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("stock_locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    asset_type: Mapped["AssetType"] = relationship("AssetType", back_populates="assets")
    assignments: Mapped[List["AssetAssignment"]] = relationship(
        "AssetAssignment", back_populates="asset", cascade="all, delete-orphan", lazy="selectin"
    )
    movements: Mapped[List["AssetMovement"]] = relationship(
        "AssetMovement", back_populates="asset", cascade="all, delete-orphan"
    )


class AssetAssignment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "asset_assignments"

    asset_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_to_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    assigned_to_labourer_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    condition_on_issue: Mapped[AssetCondition] = mapped_column(Enum(AssetCondition), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    returned_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    condition_on_return: Mapped[Optional[AssetCondition]] = mapped_column(Enum(AssetCondition), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="assignments")


class AssetMovement(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "asset_movements"

    asset_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_location_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    to_location_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(sa.Uuid(as_uuid=True), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="movements")
