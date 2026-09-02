import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.exceptions import BusinessRuleViolationError
from apps.api.app.quantities.models import QuantityTransaction, QuantityTransactionType
from apps.api.app.audit.models import AuditLog


class QuantityLedgerService:
    @staticmethod
    async def record_transaction(
        db: AsyncSession,
        order_id: uuid.UUID,
        order_item_id: uuid.UUID,
        transaction_type: QuantityTransactionType,
        quantity: int,
        actor_id: uuid.UUID,
        batch_reference: Optional[str] = None,
        reason: Optional[str] = None,
        metadata_json: Optional[Dict[str, Any]] = None,
    ) -> QuantityTransaction:
        if quantity <= 0:
            raise BusinessRuleViolationError("Quantity must be a positive integer.")

        tx = QuantityTransaction(
            order_id=order_id,
            order_item_id=order_item_id,
            transaction_type=transaction_type,
            quantity=quantity,
            batch_reference=batch_reference,
            actor_id=actor_id,
            reason=reason,
            metadata_json=metadata_json or {},
        )
        db.add(tx)

        # Audit record
        audit = AuditLog(
            actor_id=actor_id,
            action=f"QUANTITY_{transaction_type.value}",
            entity="QuantityTransaction",
            entity_id=str(tx.id),
            new_values_json={
                "order_id": str(order_id),
                "order_item_id": str(order_item_id),
                "type": transaction_type.value,
                "quantity": quantity,
                "batch": batch_reference,
            },
            reason=reason or f"Recorded {quantity} {transaction_type.value}",
        )
        db.add(audit)

        await db.commit()
        await db.refresh(tx)
        return tx

    @staticmethod
    async def get_summary(db: AsyncSession, order_item_id: uuid.UUID) -> Dict[str, Any]:
        query = (
            select(
                QuantityTransaction.transaction_type,
                func.sum(QuantityTransaction.quantity).label("total"),
            )
            .where(QuantityTransaction.order_item_id == order_item_id)
            .group_by(QuantityTransaction.transaction_type)
        )
        result = await db.execute(query)
        sums: Dict[str, int] = {t.value: 0 for t in QuantityTransactionType}
        for row in result:
            sums[row.transaction_type.value] = int(row.total)

        ordered = sums.get(QuantityTransactionType.ORDERED.value, 0)
        produced = sums.get(QuantityTransactionType.PRODUCED.value, 0)
        rejected = sums.get(QuantityTransactionType.REJECTED.value, 0)
        wasted = sums.get(QuantityTransactionType.WASTED.value, 0)
        defective = sums.get(QuantityTransactionType.DEFECTIVE.value, 0)
        completed = sums.get(QuantityTransactionType.COMPLETED.value, 0)
        packed = sums.get(QuantityTransactionType.PACKED.value, 0)
        dispatched = sums.get(QuantityTransactionType.DISPATCHED.value, 0)

        total_loss = rejected + wasted + defective
        total_processed = produced + wasted
        scrap_rate = (total_loss / total_processed * 100.0) if total_processed > 0 else 0.0

        return {
            "order_item_id": str(order_item_id),
            "ordered": ordered,
            "produced": produced,
            "completed": completed,
            "rejected": rejected,
            "wasted": wasted,
            "defective": defective,
            "packed": packed,
            "dispatched": dispatched,
            "net_good_units": produced - (rejected + defective),
            "scrap_rate_percentage": round(scrap_rate, 2),
            "raw_breakdown": sums,
        }

    @staticmethod
    async def list_transactions(
        db: AsyncSession,
        order_id: Optional[uuid.UUID] = None,
        order_item_id: Optional[uuid.UUID] = None,
    ) -> List[QuantityTransaction]:
        query = select(QuantityTransaction)
        if order_id:
            query = query.where(QuantityTransaction.order_id == order_id)
        if order_item_id:
            query = query.where(QuantityTransaction.order_item_id == order_item_id)
        query = query.order_by(QuantityTransaction.timestamp.desc())
        result = await db.execute(query)
        return list(result.scalars().all())
