import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.dependencies import require_permission, get_current_user
from apps.api.app.users.models import User
from apps.api.app.eta.schemas import ETACalculationResponse, ETAHistoryRead
from apps.api.app.eta.service import ETAService

router = APIRouter(prefix="/eta", tags=["Delivery ETA Engine"])


@router.get("/orders/{order_id}", response_model=SuccessResponse[ETACalculationResponse])
async def calculate_order_eta(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    eta = await ETAService.calculate_order_eta(db, order_id, trigger_reason="USER_QUERY", user_id=current_user.id)
    return SuccessResponse(data=eta)


@router.get("/orders/{order_id}/history", response_model=SuccessResponse[List[ETAHistoryRead]])
async def get_order_eta_history(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    history = await ETAService.get_order_eta_history(db, order_id)
    return SuccessResponse(data=[ETAHistoryRead.model_validate(h) for h in history])
