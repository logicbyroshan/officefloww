import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ETAHistory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "eta_histories"

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    estimated_delivery_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    critical_path_hours: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=Decimal("24.0"), nullable=False)
    trigger_reason: Mapped[str] = mapped_column(String(255), nullable=False)  # INITIAL, APPROVAL_DELAY, MACHINE_DOWN, LABOUR_SHORTAGE
    details_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    calculated_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), nullable=True)
