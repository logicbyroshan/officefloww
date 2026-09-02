import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse, PaginatedResponse, PaginationMeta
from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.users.models import User
from apps.api.app.orders.models import Order, OrderItem, OrderStatus
from apps.api.app.orders.schemas import OrderCreate, OrderRead, OrderUpdate, OrderItemCreate, OrderItemRead
from apps.api.app.orders.service import OrderService
from apps.api.app.workflows.models import WorkflowInstance
from apps.api.app.workflows.schemas import WorkflowInstanceRead
from apps.api.app.tasks.models import Task
from apps.api.app.tasks.schemas import TaskRead

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=PaginatedResponse[OrderRead])
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    client_id: Optional[uuid.UUID] = None,
    status: Optional[OrderStatus] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    orders, total = await OrderService.list_orders(
        db=db, page=page, page_size=page_size, client_id=client_id, status=status, search=search
    )
    return PaginatedResponse(
        data=[OrderRead.model_validate(o) for o in orders],
        meta=PaginationMeta.create(page=page, page_size=page_size, total=total),
    )


@router.post("", response_model=SuccessResponse[OrderRead])
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    new_order = await OrderService.create_order(db, order_in, current_user.id)
    return SuccessResponse(data=OrderRead.model_validate(new_order))


@router.get("/{order_id}", response_model=SuccessResponse[OrderRead])
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    order = await OrderService.get_order(db, order_id)
    return SuccessResponse(data=OrderRead.model_validate(order))


@router.patch("/{order_id}", response_model=SuccessResponse[OrderRead])
async def update_order(
    order_id: uuid.UUID,
    order_in: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    order = await OrderService.update_order(db, order_id, order_in, current_user.id)
    return SuccessResponse(data=OrderRead.model_validate(order))


@router.get("/{order_id}/items", response_model=SuccessResponse[List[OrderItemRead]])
async def get_order_items(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    order = await OrderService.get_order(db, order_id)
    return SuccessResponse(data=[OrderItemRead.model_validate(i) for i in order.items])


@router.get("/{order_id}/workflow", response_model=SuccessResponse[List[WorkflowInstanceRead]])
async def get_order_workflows(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("workflows:read")),
):
    order = await OrderService.get_order(db, order_id)
    wf_list: List[WorkflowInstance] = []
    for item in order.items:
        if item.workflow_instance_id:
            wf = await db.scalar(
                select(WorkflowInstance)
                .options(selectinload(WorkflowInstance.step_instances))
                .where(WorkflowInstance.id == item.workflow_instance_id)
            )
            if wf:
                wf_list.append(wf)
    return SuccessResponse(data=[WorkflowInstanceRead.model_validate(w) for w in wf_list])


@router.get("/{order_id}/tasks", response_model=SuccessResponse[List[TaskRead]])
async def get_order_tasks(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:read")),
):
    query = (
        select(Task)
        .options(selectinload(Task.blockers), selectinload(Task.comments))
        .where(Task.order_id == order_id)
        .order_by(Task.created_at.asc())
    )
    result = await db.execute(query)
    tasks = result.scalars().all()
    return SuccessResponse(data=[TaskRead.model_validate(t) for t in tasks])
