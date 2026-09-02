from typing import List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.production.schemas import (
    MachineCreate,
    MachineRead,
    ProductionBatchCreate,
    ProductionBatchRead,
    ProductionRecordCreate,
    ProductionRecordRead,
    QuantityReconciliationReport,
)
from apps.api.app.production.service import ProductionService
from apps.api.app.users.models import User

router = APIRouter(prefix="/production", tags=["Production & Batch Traceability"])


@router.post("/machines", response_model=SuccessResponse[MachineRead], status_code=status.HTTP_201_CREATED)
async def create_machine(
    data: MachineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    m = await ProductionService.create_machine(db, data)
    return SuccessResponse(data=MachineRead.model_validate(m))


@router.get("/machines", response_model=SuccessResponse[List[MachineRead]])
async def list_machines(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    machines = await ProductionService.get_machines(db)
    return SuccessResponse(data=[MachineRead.model_validate(m) for m in machines])


@router.post("/batches", response_model=SuccessResponse[ProductionBatchRead], status_code=status.HTTP_201_CREATED)
async def create_batch(
    data: ProductionBatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:write")),
):
    batch = await ProductionService.create_batch(db, data)
    return SuccessResponse(data=ProductionBatchRead.model_validate(batch))


@router.post("/records", response_model=SuccessResponse[ProductionRecordRead], status_code=status.HTTP_201_CREATED)
async def log_production_record(
    data: ProductionRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:complete")),
):
    rec = await ProductionService.log_production_record(db, data, operator_id=current_user.id)
    return SuccessResponse(data=ProductionRecordRead.model_validate(rec))


@router.post("/batches/{id}/complete", response_model=SuccessResponse[ProductionBatchRead])
async def complete_batch(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:complete")),
):
    batch = await ProductionService.complete_batch(db, id)
    return SuccessResponse(data=ProductionBatchRead.model_validate(batch))


@router.get(
    "/order-items/{order_item_id}/reconciliation",
    response_model=SuccessResponse[QuantityReconciliationReport],
)
async def get_reconciliation_report(
    order_item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    report = await ProductionService.reconcile_order_item_quantities(db, order_item_id)
    return SuccessResponse(data=report)
