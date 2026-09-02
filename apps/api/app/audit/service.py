import uuid
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.audit.models import AuditLog


class AuditService:
    @staticmethod
    async def list_logs(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 50,
        entity: Optional[str] = None,
        entity_id: Optional[str] = None,
        actor_id: Optional[uuid.UUID] = None,
        correlation_id: Optional[str] = None,
    ) -> Tuple[List[AuditLog], int]:
        query = select(AuditLog)
        if entity:
            query = query.where(AuditLog.entity == entity)
        if entity_id:
            query = query.where(AuditLog.entity_id == entity_id)
        if actor_id:
            query = query.where(AuditLog.actor_id == actor_id)
        if correlation_id:
            query = query.where(AuditLog.correlation_id == correlation_id)

        total = await db.scalar(select(func.count()).select_from(query.subquery())) or 0
        query = query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        logs = result.scalars().all()
        return list(logs), total
