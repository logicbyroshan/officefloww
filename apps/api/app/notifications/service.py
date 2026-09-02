import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.exceptions import (
    BusinessRuleViolationError,
    EntityNotFoundError,
)
from apps.api.app.files.models import FileVersion, FileApprovalStatus
from apps.api.app.notifications.models import (
    Notification,
    NotificationChannel,
    NotificationDeliveryStatus,
    ExternalProofLink,
    ProofApprovalStatus,
)
from apps.api.app.notifications.schemas import (
    NotificationCreate,
    ProofLinkCreate,
    ProofLinkRead,
    ProofClientResponse,
)
from apps.api.app.notifications.providers import (
    InAppProvider,
    DesktopProvider,
    MobilePushProvider,
    EmailProvider,
    WhatsAppProvider,
)


class NotificationService:
    providers = {
        NotificationChannel.IN_APP: InAppProvider(),
        NotificationChannel.DESKTOP: DesktopProvider(),
        NotificationChannel.MOBILE_PUSH: MobilePushProvider(),
        NotificationChannel.EMAIL: EmailProvider(),
        NotificationChannel.WHATSAPP: WhatsAppProvider(),
    }

    @staticmethod
    async def dispatch_notification(db: AsyncSession, data: NotificationCreate) -> Notification:
        notif = Notification(
            recipient_id=data.recipient_id,
            channel=data.channel,
            title=data.title,
            body=data.body,
            status=NotificationDeliveryStatus.PENDING,
            metadata_json=data.metadata_json or {},
        )
        db.add(notif)
        await db.flush()

        provider = NotificationService.providers.get(data.channel, InAppProvider())
        recipient_target = str(data.recipient_id or "broadcast")
        success = await provider.send(
            recipient=recipient_target,
            title=data.title,
            body=data.body,
            metadata=data.metadata_json,
        )

        notif.status = NotificationDeliveryStatus.SENT if success else NotificationDeliveryStatus.FAILED
        await db.commit()
        await db.refresh(notif)
        return notif

    @staticmethod
    async def generate_external_proof_link(db: AsyncSession, data: ProofLinkCreate) -> ProofLinkRead:
        # Verify file version exists
        file_ver = await db.scalar(select(FileVersion).where(FileVersion.id == data.file_version_id))
        if not file_ver:
            raise EntityNotFoundError("FileVersion", str(data.file_version_id))

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=data.expires_in_hours)

        proof_link = ExternalProofLink(
            token=token,
            file_version_id=file_ver.id,
            client_id=data.client_id,
            contact_name=data.contact_name,
            contact_phone=data.contact_phone,
            status=ProofApprovalStatus.PENDING,
            expires_at=expires_at,
        )
        db.add(proof_link)
        await db.commit()

        proof_url = f"https://client.officefloww.com/proofs/{token}"
        return ProofLinkRead(
            token=token,
            proof_url=proof_url,
            file_version_id=file_ver.id,
            client_id=data.client_id,
            status=proof_link.status,
            expires_at=expires_at,
        )

    @staticmethod
    async def process_client_proof_response(
        db: AsyncSession, token: str, response: ProofClientResponse
    ) -> Dict[str, Any]:
        proof_link = await db.scalar(
            select(ExternalProofLink).where(ExternalProofLink.token == token)
        )
        if not proof_link:
            raise EntityNotFoundError("ExternalProofLink", token)

        expires_at = proof_link.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            proof_link.status = ProofApprovalStatus.EXPIRED
            await db.commit()
            raise BusinessRuleViolationError("Proof approval link has expired. Please request a new proof link.")

        proof_link.status = response.decision
        proof_link.feedback_notes = response.feedback_notes
        proof_link.responded_at = datetime.now(timezone.utc)

        # Update file version approval status
        file_ver = await db.scalar(select(FileVersion).where(FileVersion.id == proof_link.file_version_id))
        if file_ver:
            if response.decision == ProofApprovalStatus.APPROVED:
                file_ver.approval_state = FileApprovalStatus.APPROVED
            elif response.decision == ProofApprovalStatus.CHANGES_REQUESTED:
                file_ver.approval_state = FileApprovalStatus.CHANGES_REQUESTED

        await db.commit()
        return {
            "status": proof_link.status.value,
            "message": f"Proof response recorded as {proof_link.status.value}.",
            "file_version_id": str(proof_link.file_version_id),
            "responded_at": proof_link.responded_at.isoformat(),
        }
