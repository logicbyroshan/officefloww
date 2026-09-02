import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, Enum as SAEnum, Float, Integer, String, Text, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class QuantityTransactionType(str, Enum):
    ORDERED = "ORDERED"
    PRODUCED = "PRODUCED"
    REJECTED = "REJECTED"
    WASTED = "WASTED"
    ASSIGNED = "ASSIGNED"
    COMPLETED = "COMPLETED"
    DEFECTIVE = "DEFECTIVE"
    RETURNED = "RETURNED"
    PACKED = "PACKED"
    DISPATCHED = "DISPATCHED"


class QuantityTransaction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "quantity_transactions"

    order_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    order_item_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    transaction_type: Mapped[QuantityTransactionType] = mapped_column(
        SAEnum(QuantityTransactionType, native_enum=False, length=50),
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    batch_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    actor_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
