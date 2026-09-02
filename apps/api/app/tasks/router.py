import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse, PaginatedResponse, PaginationMeta
from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.users.models import User, UserRole
from apps.api.app.tasks.models import Task, TaskStatus
from apps.api.app.tasks.schemas import (
    TaskRead,
    TaskUpdate,
    TaskCompleteRequest,
    TaskBlockerCreate,
    TaskBlockerRead,
    TaskCommentCreate,
    TaskCommentRead,
)
from apps.api.app.tasks.service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=PaginatedResponse[TaskRead])
async def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    order_id: Optional[uuid.UUID] = None,
    status: Optional[TaskStatus] = None,
    assigned_user_id: Optional[uuid.UUID] = None,
    assigned_role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:read")),
):
    tasks, total = await TaskService.list_tasks(
        db=db,
        page=page,
        page_size=page_size,
        order_id=order_id,
        status=status,
        assigned_user_id=assigned_user_id,
        assigned_role=assigned_role,
        search=search,
    )
    return PaginatedResponse(
        data=[TaskRead.model_validate(t) for t in tasks],
        meta=PaginationMeta.create(page=page, page_size=page_size, total=total),
    )


@router.get("/{task_id}", response_model=SuccessResponse[TaskRead])
async def get_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:read")),
):
    task = await TaskService.get_task(db, task_id)
    return SuccessResponse(data=TaskRead.model_validate(task))


@router.patch("/{task_id}", response_model=SuccessResponse[TaskRead])
async def update_task(
    task_id: uuid.UUID,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:write")),
):
    task = await TaskService.update_task(db, task_id, task_in)
    return SuccessResponse(data=TaskRead.model_validate(task))


@router.post("/{task_id}/complete", response_model=SuccessResponse[TaskRead])
async def complete_task(
    task_id: uuid.UUID,
    data: Optional[TaskCompleteRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:complete")),
):
    task = await TaskService.complete_task(db, task_id, current_user.id, data)
    return SuccessResponse(data=TaskRead.model_validate(task))


@router.post("/{task_id}/blockers", response_model=SuccessResponse[TaskBlockerRead])
async def add_blocker(
    task_id: uuid.UUID,
    data: TaskBlockerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:write")),
):
    blocker = await TaskService.add_blocker(db, task_id, data.reason, current_user.id)
    return SuccessResponse(data=TaskBlockerRead.model_validate(blocker))


@router.post("/blockers/{blocker_id}/resolve", response_model=SuccessResponse[TaskBlockerRead])
async def resolve_blocker(
    blocker_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:write")),
):
    blocker = await TaskService.resolve_blocker(db, blocker_id, current_user.id)
    return SuccessResponse(data=TaskBlockerRead.model_validate(blocker))


@router.post("/{task_id}/comments", response_model=SuccessResponse[TaskCommentRead])
async def add_comment(
    task_id: uuid.UUID,
    data: TaskCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = await TaskService.add_comment(db, task_id, current_user.id, data.message)
    return SuccessResponse(data=TaskCommentRead.model_validate(comment))
