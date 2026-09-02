from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.dependencies import require_permission, get_current_user
from apps.api.app.users.models import User
from apps.api.app.ai.schemas import AIQueryRequest, AIQueryResponse, DailyBriefingResponse
from apps.api.app.ai.assistant import ManagementAIAssistant

router = APIRouter(prefix="/ai", tags=["Management AI Assistant"])


@router.post("/query", response_model=SuccessResponse[AIQueryResponse])
async def query_management_ai(
    data: AIQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    response = await ManagementAIAssistant.process_query(db, data)
    return SuccessResponse(data=response)


@router.get("/daily-briefing", response_model=SuccessResponse[DailyBriefingResponse])
async def get_daily_executive_briefing(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    briefing = await ManagementAIAssistant.generate_daily_briefing(db)
    return SuccessResponse(data=briefing)
