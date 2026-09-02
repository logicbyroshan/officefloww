import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.users.models import User
from apps.api.app.quantities.schemas import (
    QuantityTransactionCreate,
    QuantityTransactionRead,
    QuantitySummaryRead,
)
from apps.api.app.quantities.service import QuantityLedgerService

router = APIRouter(prefix="/quantities", tags=["Quantity Ledger"])


@router.post("/transactions", response_model=SuccessResponse[QuantityTransactionRead])
async def record_transaction(
    data: QuantityTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:write")),
):
    tx = await QuantityLedgerService.record_transaction(
        db=db,
        order_id=data.order_id,
        order_item_id=data.order_item_id,
        transaction_type=data.transaction_type,
        quantity=data.quantity,
        actor_id=current_user.id,
        batch_reference=data.batch_reference,
        reason=data.reason,
        metadata_json=data.metadata_json,
    )
    return SuccessResponse(data=QuantityTransactionRead.model_validate(tx))


@router.get("/orders/{order_item_id}/summary", response_model=SuccessResponse[QuantitySummaryRead])
async def get_quantity_summary(
    order_item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:read")),
):
    summary = await QuantityLedgerService.get_summary(db, order_item_id)
    return SuccessResponse(data=QuantitySummaryRead(**summary))


@router.get("/transactions", response_model=SuccessResponse[List[QuantityTransactionRead]])
async def list_transactions(
    order_id: Optional[uuid.UUID] = None,
    order_item_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:read")),
):
    transactions = await QuantityLedgerService.list_transactions(
        db, order_id=order_id, order_item_id=order_item_id
    )
    return SuccessResponse(data=[QuantityTransactionRead.model_validate(t) for t in transactions])
