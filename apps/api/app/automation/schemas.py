import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

from apps.api.app.automation.models import AutomationStatus


class AutomationRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_event: str
    conditions_json: Optional[Dict[str, Any]] = None
    actions_json: Optional[Dict[str, Any]] = None
    is_active: bool = True


class AutomationRuleRead(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    trigger_event: str
    conditions_json: Optional[Dict[str, Any]] = None
    actions_json: Optional[Dict[str, Any]] = None
    is_active: bool
    execution_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AutomationLogRead(BaseModel):
    id: uuid.UUID
    rule_id: Optional[uuid.UUID] = None
    event_name: str
    idempotency_key: Optional[str] = None
    status: AutomationStatus
    payload_json: Optional[Dict[str, Any]] = None
    actions_executed_json: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TriggerAutomationRequest(BaseModel):
    event_name: str
    payload: Dict[str, Any]
    idempotency_key: Optional[str] = None
