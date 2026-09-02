import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AutomationStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class AutomationRule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "automation_rules"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    trigger_event: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    # Trigger events: OrderConfirmed, StockShortageDetected, DesignApproved, PrintingCompleted, LabourSubmitted, PackingCompleted, PaymentReceived

    conditions_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    actions_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    execution_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    logs: Mapped[List["AutomationLog"]] = relationship(
        "AutomationLog", back_populates="rule", cascade="all, delete-orphan", lazy="selectin"
    )


class AutomationLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "automation_logs"

    rule_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("automation_rules.id", ondelete="CASCADE"), nullable=True, index=True
    )
    event_name: Mapped[str] = mapped_column(String(100), nullable=False)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    status: Mapped[AutomationStatus] = mapped_column(
        SAEnum(AutomationStatus, native_enum=False, length=50), nullable=False
    )
    payload_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    actions_executed_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    rule: Mapped[Optional["AutomationRule"]] = relationship("AutomationRule", back_populates="logs")


class IdempotencyRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "idempotency_records"

    idempotency_key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    scope: Mapped[str] = mapped_column(String(100), nullable=False)  # TASK_CREATE, STOCK_ISSUE, PAYMENT, INVOICE
    resource_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), nullable=True)
    response_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
