import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.orders.models import Order, OrderStatus
from apps.api.app.stock.models import StockItem
from apps.api.app.stock.service import StockService
from apps.api.app.tasks.models import Task, TaskStatus
from apps.api.app.labour.models import Labourer, LabourBatch
from apps.api.app.billing.models import Invoice, InvoiceStatus, Payment
from apps.api.app.capacity.service import CapacityService
from apps.api.app.quotations.service import QuotationService


class ManagementAITools:
    @staticmethod
    async def get_order_status(db: AsyncSession, order_id: uuid.UUID) -> Dict[str, Any]:
        order = await db.scalar(select(Order).options(selectinload(Order.items)).where(Order.id == order_id))
        if not order:
            return {"error": f"Order {order_id} not found."}
        return {
            "order_number": order.order_number,
            "status": order.status.value,
            "total_amount": float(order.total_amount),
            "items_count": len(order.items),
            "promised_delivery_date": order.promised_delivery_date.isoformat() if order.promised_delivery_date else None,
        }

    @staticmethod
    async def get_low_stock(db: AsyncSession) -> List[Dict[str, Any]]:
        items = (await db.scalars(select(StockItem).where(StockItem.is_active == True))).all()
        low_stock_list = []
        for it in items:
            bal = await StockService.calculate_stock_balance(db, it.id)
            if bal.available_stock <= it.min_stock_level:
                low_stock_list.append({
                    "item_code": it.code,
                    "item_name": it.name,
                    "available_stock": float(bal.available_stock),
                    "min_stock_level": it.min_stock_level,
                    "unit": it.unit,
                })
        return low_stock_list

    @staticmethod
    async def get_orders_at_risk(db: AsyncSession) -> List[Dict[str, Any]]:
        active_orders = (
            await db.scalars(
                select(Order)
                .options(selectinload(Order.items))
                .where(Order.status.in_([OrderStatus.CONFIRMED, OrderStatus.IN_PRODUCTION]))
            )
        ).all()

        at_risk = []
        for ord in active_orders:
            tasks = (
                await db.scalars(select(Task).where(Task.order_id == ord.id, Task.status == TaskStatus.BLOCKED))
            ).all()
            if tasks:
                at_risk.append({
                    "order_number": ord.order_number,
                    "status": ord.status.value,
                    "blocked_tasks_count": len(tasks),
                    "blocked_task_titles": [t.title for t in tasks],
                    "risk_reason": f"Order has {len(tasks)} blocked operational tasks requiring supervisor intervention.",
                })
        return at_risk

    @staticmethod
    async def get_employee_workload_summary(db: AsyncSession) -> List[Dict[str, Any]]:
        metrics = await CapacityService.get_employee_workload_metrics(db)
        return [m.model_dump() for m in metrics]

    @staticmethod
    async def get_labour_performance_summary(db: AsyncSession) -> List[Dict[str, Any]]:
        labourers = (await db.scalars(select(Labourer).where(Labourer.is_active == True))).all()
        summary = []
        for lab in labourers:
            batches = (
                await db.scalars(select(LabourBatch).where(LabourBatch.labourer_id == lab.id))
            ).all()
            total_completed = float(sum(b.completed_quantity for b in batches))
            total_defective = float(sum(b.defective_quantity for b in batches))
            quality_pct = 100.0
            if (total_completed + total_defective) > 0:
                quality_pct = round((total_completed / (total_completed + total_defective)) * 100.0, 1)

            summary.append({
                "labourer_code": lab.code,
                "name": lab.name,
                "completed_units": int(total_completed),
                "defective_units": int(total_defective),
                "quality_percentage": quality_pct,
                "labour_type": lab.labour_type.value,
            })
        return summary

    @staticmethod
    async def get_pending_payments_summary(db: AsyncSession) -> Dict[str, Any]:
        invoices = (
            await db.scalars(
                select(Invoice).where(
                    Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE])
                )
            )
        ).all()
        total_outstanding = sum(inv.total_amount - inv.paid_amount for inv in invoices)
        return {
            "pending_invoices_count": len(invoices),
            "total_outstanding_amount": float(total_outstanding),
        }
