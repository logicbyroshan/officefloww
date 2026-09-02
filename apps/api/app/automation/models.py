import uuid
from typing import Any, Dict, Optional
from sqlalchemy import Boolean, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AutomationRule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "automation_rules"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    trigger_event: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    # Trigger events: ORDER_CREATED, STEP_COMPLETED, APPROVAL_GRANTED, TASK_OVERDUE, QUANTITY_DEFECT_HIGH

    conditions_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    actions_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
