from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.auth.dependencies import get_current_user, require_role
from apps.api.app.core.database import get_db
from apps.api.app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.quantities.models import QuantityTransaction, QuantityTransactionType
from apps.api.app.tasks.models import Task, TaskStatus
from apps.api.app.tasks.service import TaskService
from apps.api.app.users.models import User, UserRole

router = APIRouter(prefix="/worker", tags=["In-House Worker Mobile APIs"])


class WorkerTaskSummary(BaseModel):
    id: uuid.UUID
    task_code: str
    title: str
    instructions: Optional[str] = None
    status: TaskStatus
    priority: str
    order_id: uuid.UUID


class WorkerQuantitySubmit(BaseModel):
    good_quantity: int
    reject_quantity: int = 0
    waste_quantity: int = 0
    defect_reason: Optional[str] = None
    evidence_file_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


@router.get("/tasks", response_model=SuccessResponse[List[WorkerTaskSummary]])
async def get_worker_assigned_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only returns operational tasks assigned to this user or role, strictly without financial/billing fields
    query = select(Task).where(
        (Task.assigned_user_id == current_user.id) | (Task.assigned_role == current_user.role),
        Task.status.in_([TaskStatus.READY, TaskStatus.IN_PROGRESS]),
    )
    res = await db.execute(query)
    tasks = res.scalars().all()

    items = [
        WorkerTaskSummary(
            id=t.id,
            task_code=t.task_code,
            title=t.title,
            instructions=t.instructions,
            status=t.status,
            priority=t.priority.value,
            order_id=t.order_id,
        )
        for t in tasks
    ]
    return SuccessResponse(data=items)


@router.get("/tasks/{id}", response_model=SuccessResponse[WorkerTaskSummary])
async def get_worker_task_detail(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(select(Task).where(Task.id == id))
    task = res.scalar_one_or_none()
    if not task:
        raise EntityNotFoundError("Task", id)

    return SuccessResponse(
        data=WorkerTaskSummary(
            id=task.id,
            task_code=task.task_code,
            title=task.title,
            instructions=task.instructions,
            status=task.status,
            priority=task.priority.value,
            order_id=task.order_id,
        )
    )


@router.post("/tasks/{id}/start", response_model=SuccessResponse[dict])
async def start_worker_task(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(select(Task).where(Task.id == id))
    task = res.scalar_one_or_none()
    if not task:
        raise EntityNotFoundError("Task", id)

    task.status = TaskStatus.IN_PROGRESS
    task.assigned_user_id = current_user.id
    await db.commit()
    return SuccessResponse(data={"message": f"Task {task.task_code} started."})


@router.post("/tasks/{id}/quantities", response_model=SuccessResponse[dict])
async def submit_worker_quantities(
    id: uuid.UUID,
    data: WorkerQuantitySubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(select(Task).where(Task.id == id))
    task = res.scalar_one_or_none()
    if not task:
        raise EntityNotFoundError("Task", id)

    if data.good_quantity > 0:
        db.add(
            QuantityTransaction(
                order_id=task.order_id,
                order_item_id=task.order_item_id,
                transaction_type=QuantityTransactionType.PRODUCED,
                quantity=data.good_quantity,
                batch_reference=task.task_code,
                actor_id=current_user.id,
                reason="Worker shift output",
            )
        )

    if data.reject_quantity > 0:
        db.add(
            QuantityTransaction(
                order_id=task.order_id,
                order_item_id=task.order_item_id,
                transaction_type=QuantityTransactionType.REJECTED,
                quantity=data.reject_quantity,
                batch_reference=task.task_code,
                actor_id=current_user.id,
                reason=data.defect_reason or "Worker reported defect",
            )
        )

    await db.commit()
    return SuccessResponse(data={"message": "Quantities successfully recorded in operational ledger."})


from apps.api.app.tasks.schemas import TaskCompleteRequest


@router.post("/tasks/{id}/complete", response_model=SuccessResponse[dict])
async def complete_worker_task(
    id: uuid.UUID,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req_data = TaskCompleteRequest(notes=notes or "Completed via worker mobile app")
    completed_task = await TaskService.complete_task(
        db, task_id=id, user_id=current_user.id, data=req_data
    )
    return SuccessResponse(data={"message": f"Task {completed_task.task_code} completed successfully."})
