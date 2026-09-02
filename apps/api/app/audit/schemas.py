import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    actor_id: Optional[uuid.UUID] = None
    actor_email: Optional[str] = None
    action: str
    entity: str
    entity_id: str
    old_values_json: Optional[Dict[str, Any]] = None
    new_values_json: Optional[Dict[str, Any]] = None
    correlation_id: Optional[str] = None
    reason: Optional[str] = None
    timestamp: datetime
