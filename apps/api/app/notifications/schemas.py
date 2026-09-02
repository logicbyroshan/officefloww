import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel

from apps.api.app.notifications.models import NotificationChannel, NotificationDeliveryStatus, ProofApprovalStatus


class NotificationCreate(BaseModel):
    recipient_id: Optional[uuid.UUID] = None
    channel: NotificationChannel = NotificationChannel.IN_APP
    title: str
    body: str
    metadata_json: Optional[Dict[str, Any]] = None


class NotificationRead(BaseModel):
    id: uuid.UUID
    recipient_id: Optional[uuid.UUID] = None
    channel: NotificationChannel
    title: str
    body: str
    status: NotificationDeliveryStatus
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProofLinkCreate(BaseModel):
    file_version_id: uuid.UUID
    client_id: uuid.UUID
    contact_name: str
    contact_phone: Optional[str] = None
    expires_in_hours: int = 72


class ProofLinkRead(BaseModel):
    token: str
    proof_url: str
    file_version_id: uuid.UUID
    client_id: uuid.UUID
    status: ProofApprovalStatus
    expires_at: datetime


class ProofClientResponse(BaseModel):
    decision: ProofApprovalStatus  # APPROVED, CHANGES_REQUESTED
    feedback_notes: Optional[str] = None
