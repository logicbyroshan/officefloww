import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.dependencies import require_permission, get_current_user
from apps.api.app.users.models import User
from apps.api.app.automation.schemas import (
    AutomationRuleCreate,
    AutomationRuleRead,
    AutomationLogRead,
    TriggerAutomationRequest,
)
from apps.api.app.automation.service import AutomationService

router = APIRouter(prefix="/automation", tags=["Automation Engine"])


@router.get("/rules", response_model=SuccessResponse[List[AutomationRuleRead]])
async def list_automation_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("settings:read")),
):
    rules = await AutomationService.list_rules(db)
    return SuccessResponse(data=[AutomationRuleRead.model_validate(r) for r in rules])


@router.post("/rules", response_model=SuccessResponse[AutomationRuleRead], status_code=status.HTTP_201_CREATED)
async def create_automation_rule(
    data: AutomationRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("settings:write")),
):
    rule = await AutomationService.create_rule(db, data)
    return SuccessResponse(data=AutomationRuleRead.model_validate(rule))


@router.get("/logs", response_model=SuccessResponse[List[AutomationLogRead]])
async def list_automation_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit:read")),
):
    logs = await AutomationService.list_logs(db)
    return SuccessResponse(data=[AutomationLogRead.model_validate(l) for l in logs])


@router.post("/trigger", response_model=SuccessResponse[dict])
async def trigger_automation_event(
    data: TriggerAutomationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:write")),
):
    result = await AutomationService.process_event(
        db, event_name=data.event_name, payload=data.payload, idempotency_key=data.idempotency_key
    )
    return SuccessResponse(data=result)
