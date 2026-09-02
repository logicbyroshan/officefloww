import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.dependencies import require_permission
from apps.api.app.users.models import User
from apps.api.app.workflows.models import WorkflowInstance
from apps.api.app.workflows.schemas import (
    WorkflowTemplateCreate,
    WorkflowTemplateRead,
    WorkflowInstanceRead,
)
from apps.api.app.workflows.service import WorkflowService

router = APIRouter(prefix="/workflows", tags=["Workflows"])


@router.get("/templates", response_model=SuccessResponse[List[WorkflowTemplateRead]])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("workflows:read")),
):
    templates = await WorkflowService.list_templates(db)
    return SuccessResponse(data=[WorkflowTemplateRead.model_validate(t) for t in templates])


@router.post("/templates", response_model=SuccessResponse[WorkflowTemplateRead])
async def create_template(
    data: WorkflowTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("workflows:write")),
):
    template = await WorkflowService.create_template(db, data)
    return SuccessResponse(data=WorkflowTemplateRead.model_validate(template))


@router.get("/templates/{template_id}", response_model=SuccessResponse[WorkflowTemplateRead])
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("workflows:read")),
):
    template = await WorkflowService.get_template(db, template_id)
    return SuccessResponse(data=WorkflowTemplateRead.model_validate(template))


@router.get("/instances/{instance_id}", response_model=SuccessResponse[WorkflowInstanceRead])
async def get_instance(
    instance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("workflows:read")),
):
    query = (
        select(WorkflowInstance)
        .options(selectinload(WorkflowInstance.step_instances))
        .where(WorkflowInstance.id == instance_id)
    )
    result = await db.execute(query)
    instance = result.scalar_one_or_none()
    if not instance:
        from apps.api.app.core.exceptions import EntityNotFoundError
        raise EntityNotFoundError("WorkflowInstance", instance_id)
    return SuccessResponse(data=WorkflowInstanceRead.model_validate(instance))
