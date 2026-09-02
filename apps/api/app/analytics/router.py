from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.dependencies import require_permission, get_current_user
from apps.api.app.users.models import User
from apps.api.app.analytics.schemas import ExecutiveDashboardSummary, ResponsibilityAuditItem
from apps.api.app.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Management Analytics & Reporting"])


@router.get("/dashboard", response_model=SuccessResponse[ExecutiveDashboardSummary])
async def get_executive_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit:read")),
):
    summary = await AnalyticsService.get_executive_dashboard(db)
    return SuccessResponse(data=summary)


@router.get("/responsibility-trail", response_model=SuccessResponse[List[ResponsibilityAuditItem]])
async def get_responsibility_audit_trail(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit:read")),
):
    trail = await AnalyticsService.get_responsibility_audit_trail(db)
    return SuccessResponse(data=trail)
