import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import PaginatedResponse, PaginationMeta
from apps.api.app.auth.dependencies import require_permission
from apps.api.app.users.models import User
from apps.api.app.audit.schemas import AuditLogRead
from apps.api.app.audit.service import AuditService

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("", response_model=PaginatedResponse[AuditLogRead])
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    entity: Optional[str] = None,
    entity_id: Optional[str] = None,
    actor_id: Optional[uuid.UUID] = None,
    correlation_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit:read")),
):
    logs, total = await AuditService.list_logs(
        db=db,
        page=page,
        page_size=page_size,
        entity=entity,
        entity_id=entity_id,
        actor_id=actor_id,
        correlation_id=correlation_id,
    )
    return PaginatedResponse(
        data=[AuditLogRead.model_validate(log) for log in logs],
        meta=PaginationMeta.create(page=page, page_size=page_size, total=total),
    )
