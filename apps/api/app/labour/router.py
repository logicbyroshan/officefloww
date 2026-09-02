from typing import List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.labour.schemas import (
    LabourerCreate,
    LabourerRead,
    LabourRateCreate,
    LabourRateRead,
    LabourBatchCreate,
    LabourBatchRead,
    LabourSubmissionCreate,
    LabourSubmissionRead,
    LabourMaterialIssueRequest,
    LabourMaterialIssueResponse,
    LabourTransferRequest,
    LabourPaymentRead,
)
from apps.api.app.labour.service import LabourService
from apps.api.app.users.models import User

router = APIRouter(prefix="/labour", tags=["Labour & Material Credit Ledger"])


@router.post("/labourers", response_model=SuccessResponse[LabourerRead], status_code=status.HTTP_201_CREATED)
async def create_labourer(
    data: LabourerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users:manage")),
):
    labourer = await LabourService.create_labourer(db, data)
    return SuccessResponse(data=LabourerRead.model_validate(labourer))


@router.get("/labourers", response_model=SuccessResponse[List[LabourerRead]])
async def list_labourers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    labourers = await LabourService.get_labourers(db)
    return SuccessResponse(data=[LabourerRead.model_validate(l) for l in labourers])


@router.get("/labourers/{id}", response_model=SuccessResponse[LabourerRead])
async def get_labourer(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    labourer = await LabourService.get_labourer(db, id)
    return SuccessResponse(data=LabourerRead.model_validate(labourer))


@router.post("/rates", response_model=SuccessResponse[LabourRateRead], status_code=status.HTTP_201_CREATED)
async def create_labour_rate(
    data: LabourRateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    rate = await LabourService.create_rate(db, data)
    return SuccessResponse(data=LabourRateRead.model_validate(rate))


@router.post("/batches", response_model=SuccessResponse[LabourBatchRead], status_code=status.HTTP_201_CREATED)
async def allocate_labour_batch(
    data: LabourBatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:write")),
):
    batch = await LabourService.allocate_batch(db, data, assigner_id=current_user.id)
    return SuccessResponse(data=LabourBatchRead.model_validate(batch))


@router.post("/material-issues", response_model=SuccessResponse[LabourMaterialIssueResponse])
async def issue_material_with_credit(
    req: LabourMaterialIssueRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:write")),
):
    resp = await LabourService.issue_material_with_credit(db, req, actor_id=current_user.id)
    return SuccessResponse(data=resp)


@router.post("/submissions", response_model=SuccessResponse[LabourSubmissionRead], status_code=status.HTTP_201_CREATED)
async def submit_labour_work(
    data: LabourSubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:complete")),
):
    sub = await LabourService.submit_work(db, data)
    return SuccessResponse(data=LabourSubmissionRead.model_validate(sub))


@router.post("/transfers", response_model=SuccessResponse[dict])
async def transfer_material(
    req: LabourTransferRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:write")),
):
    await LabourService.transfer_material(db, req, actor_id=current_user.id)
    return SuccessResponse(data={"message": "Material transferred successfully"})


@router.post("/labourers/{id}/generate-payment", response_model=SuccessResponse[LabourPaymentRead])
async def generate_payment(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    payment = await LabourService.generate_payment(db, id, approver_id=current_user.id)
    return SuccessResponse(data=LabourPaymentRead.model_validate(payment))
