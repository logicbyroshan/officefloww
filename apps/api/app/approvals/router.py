import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.users.models import User
from apps.api.app.approvals.models import ApprovalStatus
from apps.api.app.approvals.schemas import (
    ApprovalRequestCreate,
    ApprovalDecisionRequest,
    ApprovalRead,
)
from apps.api.app.approvals.service import ApprovalService

router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.post("", response_model=SuccessResponse[ApprovalRead])
async def request_approval(
    data: ApprovalRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("approvals:write")),
):
    approval = await ApprovalService.request_approval(
        db=db,
        order_id=data.order_id,
        user_id=current_user.id,
        order_item_id=data.order_item_id,
        workflow_step_instance_id=data.workflow_step_instance_id,
        file_version_id=data.file_version_id,
        comments=data.comments,
    )
    return SuccessResponse(data=ApprovalRead.model_validate(approval))


@router.get("", response_model=SuccessResponse[List[ApprovalRead]])
async def list_approvals(
    order_id: Optional[uuid.UUID] = None,
    status: Optional[ApprovalStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("approvals:read")),
):
    approvals = await ApprovalService.list_approvals(db, order_id=order_id, status=status)
    return SuccessResponse(data=[ApprovalRead.model_validate(a) for a in approvals])


@router.post("/{approval_id}/approve", response_model=SuccessResponse[ApprovalRead])
async def approve(
    approval_id: uuid.UUID,
    data: Optional[ApprovalDecisionRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("approvals:decide")),
):
    approval = await ApprovalService.decide_approval(
        db=db,
        approval_id=approval_id,
        user_id=current_user.id,
        decision=ApprovalStatus.APPROVED,
        comments=data.comments if data else None,
    )
    return SuccessResponse(data=ApprovalRead.model_validate(approval))


@router.post("/{approval_id}/reject", response_model=SuccessResponse[ApprovalRead])
async def reject(
    approval_id: uuid.UUID,
    data: Optional[ApprovalDecisionRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("approvals:decide")),
):
    approval = await ApprovalService.decide_approval(
        db=db,
        approval_id=approval_id,
        user_id=current_user.id,
        decision=ApprovalStatus.REJECTED,
        comments=data.comments if data else None,
    )
    return SuccessResponse(data=ApprovalRead.model_validate(approval))
