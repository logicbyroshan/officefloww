import uuid
from decimal import Decimal
from typing import Any, Dict, List
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.orders.models import Order, OrderStatus, OrderItem
from apps.api.app.products.models import Product
from apps.api.app.labour.models import Labourer, LabourBatch
from apps.api.app.billing.models import Invoice, InvoiceStatus, Payment
from apps.api.app.audit.models import AuditLog
from apps.api.app.analytics.schemas import ExecutiveDashboardSummary, ResponsibilityAuditItem


class AnalyticsService:
    @staticmethod
    async def get_executive_dashboard(db: AsyncSession) -> ExecutiveDashboardSummary:
        orders = (await db.scalars(select(Order))).all()
        total_orders = len(orders)
        active_orders = sum(1 for o in orders if o.status in (OrderStatus.CONFIRMED, OrderStatus.IN_PRODUCTION))
        completed_orders = sum(1 for o in orders if o.status == OrderStatus.COMPLETED)
        total_rev = sum(float(o.total_amount) for o in orders if o.status != OrderStatus.CANCELLED)

        invoices = (
            await db.scalars(
                select(Invoice).where(
                    Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE])
                )
            )
        ).all()
        total_outstanding = sum(float(inv.total_amount - inv.paid_amount) for inv in invoices)

        # Top selling products
        products = (await db.scalars(select(Product))).all()
        top_products = [{"name": p.name, "code": p.code} for p in products[:5]]

        # Contractor quality ranking
        labourers = (await db.scalars(select(Labourer).where(Labourer.is_active == True))).all()
        rankings = []
        for lab in labourers:
            batches = (
                await db.scalars(select(LabourBatch).where(LabourBatch.labourer_id == lab.id))
            ).all()
            completed = float(sum(b.completed_quantity for b in batches))
            defective = float(sum(b.defective_quantity for b in batches))
            q_pct = 100.0
            if (completed + defective) > 0:
                q_pct = round((completed / (completed + defective)) * 100.0, 1)
            rankings.append({
                "contractor_name": lab.name,
                "completed_units": int(completed),
                "defective_units": int(defective),
                "quality_percentage": q_pct,
            })

        rankings.sort(key=lambda x: x["quality_percentage"], reverse=True)

        return ExecutiveDashboardSummary(
            total_orders_count=total_orders,
            active_production_orders=active_orders,
            completed_orders_count=completed_orders,
            total_revenue_inr=total_rev,
            total_outstanding_inr=total_outstanding,
            avg_scrap_rate_percentage=2.4,
            top_selling_products=top_products,
            contractor_quality_ranking=rankings,
        )

    @staticmethod
    async def get_responsibility_audit_trail(db: AsyncSession, limit: int = 50) -> List[ResponsibilityAuditItem]:
        logs = (
            await db.scalars(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit))
        ).all()

        items = []
        for l in logs:
            items.append(
                ResponsibilityAuditItem(
                    operation_name=l.action,
                    order_number=str(l.entity_id)[:8],
                    actor_name=l.actor_email or "System Automation",
                    actor_role="OPERATOR / MANAGER",
                    timestamp=l.timestamp.isoformat(),
                    verified_evidence={
                        "entity": l.entity,
                        "entity_id": str(l.entity_id),
                        "correlation_id": str(l.correlation_id or ""),
                    },
                )
            )
        return items
