import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.core.exceptions import EntityNotFoundError
from apps.api.app.orders.models import Order
from apps.api.app.workflows.models import WorkflowInstance, WorkflowStepInstance
from apps.api.app.eta.models import ETAHistory
from apps.api.app.eta.schemas import ETACalculationResponse


class ETAService:
    @staticmethod
    async def calculate_order_eta(
        db: AsyncSession, order_id: uuid.UUID, trigger_reason: str = "INITIAL", user_id: Optional[uuid.UUID] = None
    ) -> ETACalculationResponse:
        order = await db.scalar(
            select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        )
        if not order:
            raise EntityNotFoundError("Order", str(order_id))

        # Query all active workflow steps for this order's items
        total_quantity = sum(item.quantity for item in order.items)

        # Baseline critical path estimation:
        # Data/Photo (4h) + Design & Proof Approval (8h) + Machine Setup & Print (500/hr) + Assembly/Fitting (300/hr) + Packing (4h) + Dispatch buffer (12h)
        design_hours = 8.0
        printing_hours = total_quantity / 500.0
        fitting_hours = total_quantity / 400.0
        packing_hours = 4.0
        dispatch_buffer = 12.0

        critical_path_hours = design_hours + printing_hours + fitting_hours + packing_hours + dispatch_buffer

        now = datetime.now(timezone.utc)
        estimated_date = now + timedelta(hours=critical_path_hours)

        factors = [
            f"Design & client proofing buffer: {design_hours:.0f} hrs",
            f"Press machine printing ({total_quantity:,} units @ 500/hr): {printing_hours:.1f} hrs",
            f"Manual fitting / assembly: {fitting_hours:.1f} hrs",
            f"Packaging & QA verification: {packing_hours:.1f} hrs",
            f"Carrier booking & dispatch transit: {dispatch_buffer:.0f} hrs",
        ]

        # Record history snapshot
        history_entry = ETAHistory(
            order_id=order.id,
            estimated_delivery_date=estimated_date,
            critical_path_hours=Decimal(str(round(critical_path_hours, 2))),
            trigger_reason=trigger_reason,
            details_json={
                "total_quantity": total_quantity,
                "printing_hours": printing_hours,
                "fitting_hours": fitting_hours,
                "factors": factors,
            },
            calculated_by_id=user_id,
        )
        db.add(history_entry)
        await db.commit()

        return ETACalculationResponse(
            order_id=order.id,
            estimated_delivery_date=estimated_date,
            critical_path_hours=round(critical_path_hours, 1),
            confidence_level="HIGH" if critical_path_hours < 72.0 else "MEDIUM",
            factors=factors,
            breakdown={
                "design_proof_hours": design_hours,
                "printing_hours": round(printing_hours, 1),
                "fitting_hours": round(fitting_hours, 1),
                "packing_hours": packing_hours,
                "dispatch_transit_hours": dispatch_buffer,
            },
        )

    @staticmethod
    async def get_order_eta_history(db: AsyncSession, order_id: uuid.UUID) -> List[ETAHistory]:
        query = select(ETAHistory).where(ETAHistory.order_id == order_id).order_by(ETAHistory.created_at.desc())
        return list((await db.scalars(query)).all())
