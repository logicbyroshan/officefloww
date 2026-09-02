import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.billing.schemas import (
    InvoiceCreate,
    InvoiceRead,
    PaymentCreate,
    PaymentRead,
    OrderCompletionCheckResponse,
)
from apps.api.app.billing.service import BillingService
from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.orders.schemas import OrderRead
from apps.api.app.users.models import User

router = APIRouter(prefix="/billing", tags=["Billing & Client Payments"])


@router.post("/invoices", response_model=SuccessResponse[InvoiceRead], status_code=status.HTTP_201_CREATED)
async def create_invoice(
    data: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    inv = await BillingService.create_invoice(db, data)
    return SuccessResponse(data=InvoiceRead.model_validate(inv))


@router.post("/payments", response_model=SuccessResponse[PaymentRead], status_code=status.HTTP_201_CREATED)
async def record_payment(
    data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    payment = await BillingService.record_payment(db, data, receiver_id=current_user.id)
    return SuccessResponse(data=PaymentRead.model_validate(payment))


@router.get("/orders/{order_id}/completion-check", response_model=SuccessResponse[OrderCompletionCheckResponse])
async def check_order_completion(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    check = await BillingService.check_order_completion_conditions(db, order_id)
    return SuccessResponse(data=check)


@router.post("/orders/{order_id}/complete", response_model=SuccessResponse[OrderRead])
async def complete_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:approve")),
):
    order = await BillingService.complete_order(db, order_id)
    return SuccessResponse(data=OrderRead.model_validate(order))
