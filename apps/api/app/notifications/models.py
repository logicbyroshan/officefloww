import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from apps.api.app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class NotificationChannel(str, enum.Enum):
    IN_APP = "IN_APP"
    DESKTOP = "DESKTOP"
    MOBILE_PUSH = "MOBILE_PUSH"
    EMAIL = "EMAIL"
    WHATSAPP = "WHATSAPP"


class NotificationDeliveryStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    READ = "READ"


class ProofApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"
    EXPIRED = "EXPIRED"


class Notification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "notifications"

    recipient_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    channel: Mapped[NotificationChannel] = mapped_column(
        SAEnum(NotificationChannel, native_enum=False, length=50), default=NotificationChannel.IN_APP, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[NotificationDeliveryStatus] = mapped_column(
        SAEnum(NotificationDeliveryStatus, native_enum=False, length=50),
        default=NotificationDeliveryStatus.PENDING,
        nullable=False,
    )
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)


class ExternalProofLink(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "external_proof_links"

    token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    file_version_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("file_versions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[ProofApprovalStatus] = mapped_column(
        SAEnum(ProofApprovalStatus, native_enum=False, length=50),
        default=ProofApprovalStatus.PENDING,
        nullable=False,
    )
    feedback_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
