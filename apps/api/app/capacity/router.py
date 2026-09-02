import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.dependencies import require_permission, get_current_user
from apps.api.app.users.models import User
from apps.api.app.capacity.schemas import (
    AbsenceCreate,
    HandoverPlan,
    CapacityMetrics,
)
from apps.api.app.capacity.service import CapacityService

router = APIRouter(prefix="/capacity", tags=["Capacity & Workload Planning"])


@router.get("/machines", response_model=SuccessResponse[List[CapacityMetrics]])
async def get_machine_capacity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:read")),
):
    metrics = await CapacityService.get_machine_capacity_metrics(db)
    return SuccessResponse(data=metrics)


@router.get("/employees", response_model=SuccessResponse[List[CapacityMetrics]])
async def get_employee_workload(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:read")),
):
    metrics = await CapacityService.get_employee_workload_metrics(db)
    return SuccessResponse(data=metrics)


@router.post("/absence/plan-handover", response_model=SuccessResponse[HandoverPlan], status_code=status.HTTP_201_CREATED)
async def plan_absence_handover(
    data: AbsenceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:write")),
):
    plan = await CapacityService.create_absence_and_plan_handover(db, data, current_user.id)
    return SuccessResponse(data=plan)


@router.post("/absence/{id}/execute-handover", response_model=SuccessResponse[dict])
async def execute_absence_handover(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:write")),
):
    count = await CapacityService.execute_handover(db, id, current_user.id)
    return SuccessResponse(data={"reassigned_tasks_count": count, "message": f"Successfully reassigned {count} tasks."})
