from typing import List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.dispatch.schemas import (
    DeliveryBookingCreate,
    DeliveryCreate,
    DeliveryExceptionCreate,
    DeliveryExceptionRead,
    DeliveryExpenseCreate,
    DeliveryExpenseRead,
    DeliveryRead,
    TransportProviderCreate,
    TransportProviderRead,
)
from apps.api.app.dispatch.service import DispatchService
from apps.api.app.users.models import User

router = APIRouter(prefix="/dispatch", tags=["Dispatch & Delivery Logistics"])


@router.post("/providers", response_model=SuccessResponse[TransportProviderRead], status_code=status.HTTP_201_CREATED)
async def create_provider(
    data: TransportProviderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    tp = await DispatchService.create_provider(db, data)
    return SuccessResponse(data=TransportProviderRead.model_validate(tp))


@router.get("/providers", response_model=SuccessResponse[List[TransportProviderRead]])
async def list_providers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    providers = await DispatchService.get_providers(db)
    return SuccessResponse(data=[TransportProviderRead.model_validate(p) for p in providers])


@router.post("/deliveries", response_model=SuccessResponse[DeliveryRead], status_code=status.HTTP_201_CREATED)
async def create_delivery(
    data: DeliveryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    delivery = await DispatchService.create_delivery(db, data)
    return SuccessResponse(data=DeliveryRead.model_validate(delivery))


@router.get("/deliveries/{id}", response_model=SuccessResponse[DeliveryRead])
async def get_delivery(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    delivery = await DispatchService.get_delivery(db, id)
    return SuccessResponse(data=DeliveryRead.model_validate(delivery))


@router.post("/deliveries/{id}/bookings", response_model=SuccessResponse[dict], status_code=status.HTTP_201_CREATED)
async def book_delivery(
    id: uuid.UUID,
    data: DeliveryBookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:complete")),
):
    data.delivery_id = id
    booking = await DispatchService.book_delivery(db, data, booked_by_id=current_user.id)
    return SuccessResponse(data={"booking_reference": booking.booking_reference, "id": str(booking.id)})


@router.post("/expenses", response_model=SuccessResponse[DeliveryExpenseRead], status_code=status.HTTP_201_CREATED)
async def record_expense(
    data: DeliveryExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:complete")),
):
    exp = await DispatchService.record_expense(db, data, paid_by_id=current_user.id)
    return SuccessResponse(data=DeliveryExpenseRead.model_validate(exp))


@router.post("/expenses/{id}/approve", response_model=SuccessResponse[DeliveryExpenseRead])
async def approve_reimbursement(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:approve")),
):
    exp = await DispatchService.approve_reimbursement(db, id, approver_id=current_user.id)
    return SuccessResponse(data=DeliveryExpenseRead.model_validate(exp))


@router.post("/deliveries/{id}/exceptions", response_model=SuccessResponse[DeliveryExceptionRead], status_code=status.HTTP_201_CREATED)
async def log_delivery_exception(
    id: uuid.UUID,
    data: DeliveryExceptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:complete")),
):
    data.delivery_id = id
    exc = await DispatchService.log_exception(db, data, recorded_by_id=current_user.id)
    return SuccessResponse(data=DeliveryExceptionRead.model_validate(exc))
