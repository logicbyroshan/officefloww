import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.dependencies import require_permission, get_current_user
from apps.api.app.users.models import User
from apps.api.app.notifications.schemas import (
    NotificationCreate,
    NotificationRead,
    ProofLinkCreate,
    ProofLinkRead,
    ProofClientResponse,
)
from apps.api.app.notifications.service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications & Client Proof Portal"])


@router.post("/send", response_model=SuccessResponse[NotificationRead], status_code=status.HTTP_201_CREATED)
async def send_notification(
    data: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("notifications:write")),
):
    notif = await NotificationService.dispatch_notification(db, data)
    return SuccessResponse(data=NotificationRead.model_validate(notif))


@router.post("/proofs/generate-link", response_model=SuccessResponse[ProofLinkRead], status_code=status.HTTP_201_CREATED)
async def generate_proof_link(
    data: ProofLinkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("approvals:write")),
):
    link = await NotificationService.generate_external_proof_link(db, data)
    return SuccessResponse(data=link)


@router.post("/proofs/{token}/respond", response_model=SuccessResponse[dict])
async def client_respond_to_proof(
    token: str,
    response: ProofClientResponse,
    db: AsyncSession = Depends(get_db),
):
    # Public tokenized endpoint for external client proof response
    result = await NotificationService.process_client_proof_response(db, token, response)
    return SuccessResponse(data=result)
