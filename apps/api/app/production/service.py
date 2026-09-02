from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from apps.api.app.files.models import FileVersion, FileApprovalStatus
from apps.api.app.orders.models import OrderItem
from apps.api.app.production.models import (
    Machine,
    MachineCapability,
    MachineStatus,
    ProductionBatch,
    ProductionBatchStatus,
    ProductionRecord,
)
from apps.api.app.production.schemas import (
    MachineCreate,
    ProductionBatchCreate,
    ProductionRecordCreate,
    QuantityReconciliationReport,
    BatchAllocationItem,
)
from apps.api.app.quantities.models import QuantityTransaction, QuantityTransactionType


class ProductionService:
    @staticmethod
    async def create_machine(db: AsyncSession, data: MachineCreate) -> Machine:
        existing = await db.execute(select(Machine).where(Machine.code == data.code))
        if existing.scalar_one_or_none():
            raise BusinessRuleViolationError(f"Machine with code '{data.code}' already exists.")
        m = Machine(**data.model_dump())
        db.add(m)
        await db.commit()
        await db.refresh(m)
        return m

    @staticmethod
    async def get_machines(db: AsyncSession) -> List[Machine]:
        res = await db.execute(select(Machine).order_by(Machine.code))
        return list(res.scalars().all())

    @staticmethod
    async def create_batch(
        db: AsyncSession,
        data: ProductionBatchCreate,
    ) -> ProductionBatch:
        # 1. Verify OrderItem
        oi_res = await db.execute(select(OrderItem).where(OrderItem.id == data.order_item_id))
        order_item = oi_res.scalar_one_or_none()
        if not order_item:
            raise EntityNotFoundError("OrderItem", data.order_item_id)

        # 2. Production File Lock: Validate approved file version
        fv_res = await db.execute(select(FileVersion).where(FileVersion.id == data.approved_file_version_id))
        file_version = fv_res.scalar_one_or_none()
        if not file_version:
            raise EntityNotFoundError("FileVersion", data.approved_file_version_id)

        if file_version.approval_state != FileApprovalStatus.APPROVED:
            raise BusinessRuleViolationError(
                f"Production file lock violated: File version '{file_version.id}' is in state "
                f"'{file_version.approval_state}', but only APPROVED files can be sent to production."
            )

        # 3. Strict Quantity Reconciliation Check
        target_qty = Decimal(str(order_item.quantity))
        existing_alloc_res = await db.execute(
            select(func.coalesce(func.sum(ProductionBatch.input_quantity), Decimal("0.0"))).where(
                ProductionBatch.order_item_id == data.order_item_id,
                ProductionBatch.status != ProductionBatchStatus.CANCELLED,
            )
        )
        current_alloc = Decimal(str(existing_alloc_res.scalar_one()))
        new_total_alloc = current_alloc + data.input_quantity

        if new_total_alloc > target_qty:
            raise BusinessRuleViolationError(
                f"Over-allocation rejected: Order item requires {target_qty} units. "
                f"Currently allocated: {current_alloc}, attempted additional: {data.input_quantity}. "
                f"Total {new_total_alloc} exceeds target."
            )

        batch_number = data.batch_number or f"PRINT-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"

        batch = ProductionBatch(
            batch_number=batch_number,
            order_id=data.order_id,
            order_item_id=data.order_item_id,
            product_id=data.product_id,
            machine_id=data.machine_id,
            operator_id=data.operator_id,
            approved_file_version_id=data.approved_file_version_id,
            material_lot_id=data.material_lot_id,
            status=ProductionBatchStatus.IN_PROGRESS,
            input_quantity=data.input_quantity,
            started_at=datetime.now(timezone.utc),
            notes=data.notes,
        )
        db.add(batch)

        # Update machine status
        m_res = await db.execute(select(Machine).where(Machine.id == data.machine_id))
        machine = m_res.scalar_one_or_none()
        if machine:
            machine.status = MachineStatus.RUNNING

        await db.commit()
        await db.refresh(batch)
        return batch

    @staticmethod
    async def log_production_record(
        db: AsyncSession,
        data: ProductionRecordCreate,
        operator_id: uuid.UUID,
    ) -> ProductionRecord:
        res = await db.execute(select(ProductionBatch).where(ProductionBatch.id == data.production_batch_id))
        batch = res.scalar_one_or_none()
        if not batch:
            raise EntityNotFoundError("ProductionBatch", data.production_batch_id)

        if batch.status not in (ProductionBatchStatus.IN_PROGRESS, ProductionBatchStatus.PLANNED):
            raise BusinessRuleViolationError(f"Cannot log production against batch with status '{batch.status}'.")

        record = ProductionRecord(
            production_batch_id=batch.id,
            operator_id=operator_id,
            good_quantity=data.good_quantity,
            reject_quantity=data.reject_quantity,
            waste_quantity=data.waste_quantity,
            operator_notes=data.operator_notes,
        )
        db.add(record)

        # Update batch totals
        batch.output_quantity += data.good_quantity
        batch.reject_quantity += data.reject_quantity
        batch.waste_quantity += data.waste_quantity

        # Record in global quantity ledger for full end-to-end integration
        if data.good_quantity > Decimal("0.0"):
            q_prod = QuantityTransaction(
                order_id=batch.order_id,
                order_item_id=batch.order_item_id,
                transaction_type=QuantityTransactionType.PRODUCED,
                quantity=int(data.good_quantity),
                batch_reference=batch.batch_number,
                actor_id=operator_id,
                reason="Machine production run",
            )
            db.add(q_prod)

        if data.reject_quantity > Decimal("0.0"):
            q_rej = QuantityTransaction(
                order_id=batch.order_id,
                order_item_id=batch.order_item_id,
                transaction_type=QuantityTransactionType.REJECTED,
                quantity=int(data.reject_quantity),
                batch_reference=batch.batch_number,
                actor_id=operator_id,
                reason="Machine production reject",
            )
            db.add(q_rej)

        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def complete_batch(db: AsyncSession, batch_id: uuid.UUID) -> ProductionBatch:
        res = await db.execute(select(ProductionBatch).where(ProductionBatch.id == batch_id))
        batch = res.scalar_one_or_none()
        if not batch:
            raise EntityNotFoundError("ProductionBatch", batch_id)

        batch.status = ProductionBatchStatus.COMPLETED
        batch.completed_at = datetime.now(timezone.utc)

        # Release machine to IDLE if no other running batches
        running_res = await db.execute(
            select(ProductionBatch).where(
                ProductionBatch.machine_id == batch.machine_id,
                ProductionBatch.status == ProductionBatchStatus.IN_PROGRESS,
                ProductionBatch.id != batch.id,
            )
        )
        if not running_res.scalars().first():
            m_res = await db.execute(select(Machine).where(Machine.id == batch.machine_id))
            machine = m_res.scalar_one_or_none()
            if machine:
                machine.status = MachineStatus.IDLE

        await db.commit()
        await db.refresh(batch)
        return batch

    @staticmethod
    async def reconcile_order_item_quantities(
        db: AsyncSession,
        order_item_id: uuid.UUID,
    ) -> QuantityReconciliationReport:
        oi_res = await db.execute(select(OrderItem).where(OrderItem.id == order_item_id))
        order_item = oi_res.scalar_one_or_none()
        if not order_item:
            raise EntityNotFoundError("OrderItem", order_item_id)

        target_qty = Decimal(str(order_item.quantity))

        batches_res = await db.execute(
            select(ProductionBatch).where(
                ProductionBatch.order_item_id == order_item_id,
                ProductionBatch.status != ProductionBatchStatus.CANCELLED,
            )
        )
        batches = list(batches_res.scalars().all())
        total_allocated = sum((b.input_quantity for b in batches), Decimal("0.0"))
        completed_batches = [b for b in batches if b.status == ProductionBatchStatus.COMPLETED]
        total_completed_allocated = sum((b.input_quantity for b in completed_batches), Decimal("0.0"))
        total_completed_accounted = sum((b.output_quantity + b.reject_quantity + b.waste_quantity for b in completed_batches), Decimal("0.0"))
        unaccounted = max(Decimal("0.0"), total_completed_allocated - total_completed_accounted) if completed_batches else Decimal("0.0")
        unallocated = max(Decimal("0.0"), target_qty - total_allocated)
        is_over = total_allocated > target_qty
        is_valid = total_allocated == target_qty

        batch_items = [
            BatchAllocationItem(
                batch_id=b.id,
                batch_number=b.batch_number,
                allocated_quantity=b.input_quantity,
                status=b.status,
            )
            for b in batches
        ]

        return QuantityReconciliationReport(
            order_id=order_item.order_id,
            order_item_id=order_item_id,
            target_quantity=target_qty,
            total_allocated=total_allocated,
            unallocated_quantity=unallocated,
            is_valid=is_valid,
            is_over_allocated=is_over,
            unaccounted_discrepancy=unaccounted,
            batches=batch_items,
        )

