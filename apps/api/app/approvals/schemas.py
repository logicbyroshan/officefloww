import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from apps.api.app.approvals.models import ApprovalStatus


class ApprovalRequestCreate(BaseModel):
    order_id: uuid.UUID
    order_item_id: Optional[uuid.UUID] = None
    workflow_step_instance_id: Optional[uuid.UUID] = None
    file_version_id: Optional[uuid.UUID] = None
    comments: Optional[str] = None


class ApprovalDecisionRequest(BaseModel):
    comments: Optional[str] = None


class ApprovalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    order_item_id: Optional[uuid.UUID] = None
    workflow_step_instance_id: Optional[uuid.UUID] = None
    file_version_id: Optional[uuid.UUID] = None
    requested_by_id: uuid.UUID
    approved_by_id: Optional[uuid.UUID] = None
    status: ApprovalStatus
    requested_at: datetime
    responded_at: Optional[datetime] = None
    comments: Optional[str] = None
