import enum
import uuid
from datetime import datetime, date, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin
from apps.api.app.users.models import UserRole


class AbsenceStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    HANDOVER_EXECUTED = "HANDOVER_EXECUTED"
    REJECTED = "REJECTED"


class AbsenceRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "absence_records"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[AbsenceStatus] = mapped_column(
        SAEnum(AbsenceStatus, native_enum=False, length=50), default=AbsenceStatus.PENDING, nullable=False
    )
    handover_recommendations_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    approved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), nullable=True)


class CapacityLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "capacity_logs"

    log_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)  # MACHINE, EMPLOYEE, LABOUR
    resource_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    total_capacity_hours: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=Decimal("8.0"), nullable=False)
    allocated_hours: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=Decimal("0.0"), nullable=False)
    available_hours: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=Decimal("8.0"), nullable=False)
    utilization_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.0"), nullable=False)
