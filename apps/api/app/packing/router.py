from typing import List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.packing.schemas import (
    PackageCreate,
    PackageRead,
    PackingRecordCreate,
    PackingRecordRead,
    PackingTaskCreate,
    PackingTaskRead,
)
from apps.api.app.packing.service import PackingService
from apps.api.app.users.models import User

router = APIRouter(prefix="/packing", tags=["Packing & Quality Validation"])


@router.post("/tasks", response_model=SuccessResponse[PackingTaskRead], status_code=status.HTTP_201_CREATED)
async def create_packing_task(
    data: PackingTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:write")),
):
    task = await PackingService.create_packing_task(db, data)
    return SuccessResponse(data=PackingTaskRead.model_validate(task))


@router.get("/tasks/{id}", response_model=SuccessResponse[PackingTaskRead])
async def get_packing_task(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    task = await PackingService.get_packing_task(db, id)
    return SuccessResponse(data=PackingTaskRead.model_validate(task))


@router.get("/orders/{order_id}", response_model=SuccessResponse[List[PackingTaskRead]])
async def get_order_packing_tasks(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    tasks = await PackingService.get_order_packing_tasks(db, order_id)
    return SuccessResponse(data=[PackingTaskRead.model_validate(t) for t in tasks])


@router.post("/tasks/{id}/packages", response_model=SuccessResponse[PackageRead], status_code=status.HTTP_201_CREATED)
async def add_package(
    id: uuid.UUID,
    data: PackageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:complete")),
):
    pkg = await PackingService.add_package(db, id, data, packer_id=current_user.id)
    return SuccessResponse(data=PackageRead.model_validate(pkg))


@router.post("/records", response_model=SuccessResponse[PackingRecordRead], status_code=status.HTTP_201_CREATED)
async def verify_packing(
    data: PackingRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:complete")),
):
    rec = await PackingService.verify_packing(db, data, packer_id=current_user.id)
    return SuccessResponse(data=PackingRecordRead.model_validate(rec))
