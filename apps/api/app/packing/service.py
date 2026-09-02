from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from apps.api.app.packing.models import Package, PackingRecord, PackingStatus, PackingTask
from apps.api.app.packing.schemas import PackageCreate, PackingRecordCreate, PackingTaskCreate
from apps.api.app.quantities.models import QuantityTransaction, QuantityTransactionType


class PackingService:
    @staticmethod
    async def create_packing_task(db: AsyncSession, data: PackingTaskCreate) -> PackingTask:
        task = PackingTask(
            order_id=data.order_id,
            order_item_id=data.order_item_id,
            target_quantity=data.target_quantity,
            notes=data.notes,
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)
        return task

    @staticmethod
    async def get_packing_task(db: AsyncSession, task_id: uuid.UUID) -> PackingTask:
        res = await db.execute(select(PackingTask).where(PackingTask.id == task_id))
        task = res.scalar_one_or_none()
        if not task:
            raise EntityNotFoundError("PackingTask", task_id)
        return task

    @staticmethod
    async def get_order_packing_tasks(db: AsyncSession, order_id: uuid.UUID) -> List[PackingTask]:
        res = await db.execute(select(PackingTask).where(PackingTask.order_id == order_id))
        return list(res.scalars().all())

    @staticmethod
    async def add_package(
        db: AsyncSession,
        packing_task_id: uuid.UUID,
        data: PackageCreate,
        packer_id: uuid.UUID,
    ) -> Package:
        task = await PackingService.get_packing_task(db, packing_task_id)

        qty = Decimal(str(data.quantity))
        new_packed_total = task.packed_quantity + qty

        if new_packed_total > task.target_quantity:
            raise BusinessRuleViolationError(
                f"Packing over-allocation rejected: Target is {task.target_quantity}. "
                f"Currently packed: {task.packed_quantity}, attempted: {qty}. "
                f"Total {new_packed_total} exceeds target."
            )

        pkg_num = data.package_number or f"PKG-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"

        package = Package(
            package_number=pkg_num,
            packing_task_id=task.id,
            order_id=task.order_id,
            order_item_id=task.order_item_id,
            package_type=data.package_type,
            quantity=qty,
            weight_kg=data.weight_kg,
            dimensions=data.dimensions,
            label_text=data.label_text,
        )
        db.add(package)

        task.packed_quantity = new_packed_total
        if task.packed_quantity >= task.target_quantity:
            task.status = PackingStatus.COMPLETED
        else:
            task.status = PackingStatus.IN_PROGRESS

        # Record in global quantity ledger
        db.add(
            QuantityTransaction(
                order_id=task.order_id,
                order_item_id=task.order_item_id,
                transaction_type=QuantityTransactionType.PACKED,
                quantity=int(qty),
                batch_reference=pkg_num,
                actor_id=packer_id,
                reason="Package packed and verified",
            )
        )

        await db.commit()
        await db.refresh(package)
        return package

    @staticmethod
    async def verify_packing(
        db: AsyncSession,
        data: PackingRecordCreate,
        packer_id: uuid.UUID,
    ) -> PackingRecord:
        task = await PackingService.get_packing_task(db, data.packing_task_id)

        rec = PackingRecord(
            packing_task_id=task.id,
            packer_id=packer_id,
            verifier_id=data.verifier_id,
            verified_quantity=data.verified_quantity,
            notes=data.notes,
        )
        db.add(rec)

        if task.packed_quantity >= task.target_quantity:
            task.status = PackingStatus.VERIFIED

        await db.commit()
        await db.refresh(rec)
        return rec
