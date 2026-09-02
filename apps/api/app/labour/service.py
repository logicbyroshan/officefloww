from datetime import datetime, timezone, date
from decimal import Decimal
from typing import List, Optional
import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from apps.api.app.labour.models import (
    Labourer,
    LabourRate,
    LabourBatch,
    LabourBatchStatus,
    LabourSubmission,
    LabourStockLedger,
    LabourStockTransactionType,
    LabourPayment,
    LabourPaymentLedger,
    LabourPaymentStatus,
    LabourPerformance,
)
from apps.api.app.labour.schemas import (
    LabourerCreate,
    LabourRateCreate,
    LabourBatchCreate,
    LabourSubmissionCreate,
    LabourMaterialIssueRequest,
    LabourMaterialIssueResponse,
    LabourMaterialBalanceRead,
    LabourTransferRequest,
)
from apps.api.app.orders.models import OrderItem
from apps.api.app.stock.models import StockItem, StockLocation, StockLocationType, StockMovement, StockMovementType


class LabourService:
    @staticmethod
    async def create_labourer(db: AsyncSession, data: LabourerCreate) -> Labourer:
        existing = await db.execute(select(Labourer).where(Labourer.code == data.code))
        if existing.scalar_one_or_none():
            raise BusinessRuleViolationError(f"Labourer with code '{data.code}' already exists.")
        lab = Labourer(**data.model_dump())
        db.add(lab)
        await db.flush()

        # Initialize performance record
        perf = LabourPerformance(labourer_id=lab.id)
        db.add(perf)

        await db.commit()
        await db.refresh(lab)
        return lab

    @staticmethod
    async def get_labourers(db: AsyncSession) -> List[Labourer]:
        res = await db.execute(select(Labourer).order_by(Labourer.name))
        return list(res.scalars().all())

    @staticmethod
    async def get_labourer(db: AsyncSession, labourer_id: uuid.UUID) -> Labourer:
        res = await db.execute(select(Labourer).where(Labourer.id == labourer_id))
        lab = res.scalar_one_or_none()
        if not lab:
            raise EntityNotFoundError("Labourer", labourer_id)
        return lab

    @staticmethod
    async def create_rate(db: AsyncSession, data: LabourRateCreate) -> LabourRate:
        eff_date = data.effective_date or date.today()
        rate = LabourRate(
            product_id=data.product_id,
            operation_name=data.operation_name,
            rate_per_unit=data.rate_per_unit,
            effective_date=eff_date,
            is_active=True,
        )
        db.add(rate)
        await db.commit()
        await db.refresh(rate)
        return rate

    @staticmethod
    async def allocate_batch(
        db: AsyncSession,
        data: LabourBatchCreate,
        assigner_id: Optional[uuid.UUID] = None,
    ) -> LabourBatch:
        oi_res = await db.execute(select(OrderItem).where(OrderItem.id == data.order_item_id))
        order_item = oi_res.scalar_one_or_none()
        if not order_item:
            raise EntityNotFoundError("OrderItem", data.order_item_id)

        target_qty = Decimal(str(order_item.quantity))

        # Check existing allocation sum
        existing_alloc_res = await db.execute(
            select(func.coalesce(func.sum(LabourBatch.allocated_quantity), Decimal("0.0"))).where(
                LabourBatch.order_item_id == data.order_item_id,
                LabourBatch.status != LabourBatchStatus.CANCELLED,
            )
        )
        current_alloc = Decimal(str(existing_alloc_res.scalar_one()))
        new_total_alloc = current_alloc + data.allocated_quantity

        if new_total_alloc > target_qty:
            raise BusinessRuleViolationError(
                f"Labour over-allocation rejected: Order item requires {target_qty}. "
                f"Currently allocated: {current_alloc}, attempted additional: {data.allocated_quantity}. "
                f"Total {new_total_alloc} exceeds target."
            )

        # Rate resolution
        rate_val = data.rate_per_unit
        if rate_val is None:
            rate_res = await db.execute(
                select(LabourRate)
                .where(
                    LabourRate.operation_name == data.operation_name,
                    LabourRate.is_active == True,
                )
                .order_by(LabourRate.effective_date.desc())
            )
            r = rate_res.scalars().first()
            rate_val = r.rate_per_unit if r else Decimal("1.00")

        batch_code = data.batch_code or f"LB-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"

        batch = LabourBatch(
            batch_code=batch_code,
            order_id=data.order_id,
            order_item_id=data.order_item_id,
            labourer_id=data.labourer_id,
            operation_name=data.operation_name,
            allocated_quantity=data.allocated_quantity,
            rate_per_unit=rate_val,
            status=LabourBatchStatus.ASSIGNED,
            assigned_by_id=assigner_id,
            due_date=data.due_date,
        )
        db.add(batch)
        await db.commit()
        await db.refresh(batch)
        return batch

    @staticmethod
    async def get_labour_material_balance(
        db: AsyncSession,
        labourer_id: uuid.UUID,
        stock_item_id: uuid.UUID,
    ) -> Decimal:
        plus_res = await db.execute(
            select(func.coalesce(func.sum(LabourStockLedger.quantity), Decimal("0.0"))).where(
                LabourStockLedger.labourer_id == labourer_id,
                LabourStockLedger.stock_item_id == stock_item_id,
                LabourStockLedger.transaction_type.in_(
                    [
                        LabourStockTransactionType.ISSUED,
                        LabourStockTransactionType.TRANSFERRED_IN,
                    ]
                ),
            )
        )
        plus_qty = Decimal(str(plus_res.scalar_one()))

        minus_res = await db.execute(
            select(func.coalesce(func.sum(LabourStockLedger.quantity), Decimal("0.0"))).where(
                LabourStockLedger.labourer_id == labourer_id,
                LabourStockLedger.stock_item_id == stock_item_id,
                LabourStockLedger.transaction_type.in_(
                    [
                        LabourStockTransactionType.CONSUMED,
                        LabourStockTransactionType.DEFECTIVE,
                        LabourStockTransactionType.RETURNED,
                        LabourStockTransactionType.TRANSFERRED_OUT,
                    ]
                ),
            )
        )
        minus_qty = Decimal(str(minus_res.scalar_one()))

        return max(Decimal("0.0"), plus_qty - minus_qty)

    @staticmethod
    async def issue_material_with_credit(
        db: AsyncSession,
        req: LabourMaterialIssueRequest,
        actor_id: Optional[uuid.UUID] = None,
    ) -> LabourMaterialIssueResponse:
        existing_balance = await LabourService.get_labour_material_balance(db, req.labourer_id, req.stock_item_id)

        req_qty = Decimal(str(req.required_quantity))

        if existing_balance >= req_qty:
            balance_used = req_qty
            new_issue_qty = Decimal("0.0")
        else:
            balance_used = existing_balance
            new_issue_qty = req_qty - existing_balance

        if new_issue_qty > Decimal("0.0"):
            # Record in global stock movement from MAIN_STORE to OUTSIDE_LABOUR
            mov = StockMovement(
                stock_item_id=req.stock_item_id,
                movement_type=StockMovementType.ISSUE,
                quantity=new_issue_qty,
                order_id=req.order_id,
                order_item_id=req.order_item_id,
                actor_id=actor_id,
                reason=f"Material issue to labourer {req.labourer_id}",
            )
            db.add(mov)

            # Record in LabourStockLedger
            ledger_entry = LabourStockLedger(
                labourer_id=req.labourer_id,
                stock_item_id=req.stock_item_id,
                transaction_type=LabourStockTransactionType.ISSUED,
                quantity=new_issue_qty,
                order_id=req.order_id,
                order_item_id=req.order_item_id,
                actor_id=actor_id,
                notes=req.notes,
            )
            db.add(ledger_entry)

        await db.commit()

        updated_balance = await LabourService.get_labour_material_balance(db, req.labourer_id, req.stock_item_id)

        return LabourMaterialIssueResponse(
            labourer_id=req.labourer_id,
            stock_item_id=req.stock_item_id,
            required_quantity=req_qty,
            existing_balance_used=balance_used,
            newly_issued_quantity=new_issue_qty,
            updated_labour_balance=updated_balance,
        )

    @staticmethod
    async def submit_work(
        db: AsyncSession,
        data: LabourSubmissionCreate,
    ) -> LabourSubmission:
        res = await db.execute(select(LabourBatch).where(LabourBatch.id == data.labour_batch_id))
        batch = res.scalar_one_or_none()
        if not batch:
            raise EntityNotFoundError("LabourBatch", data.labour_batch_id)

        submission = LabourSubmission(**data.model_dump())
        db.add(submission)

        batch.completed_quantity += data.completed_quantity
        batch.defective_quantity += data.defective_quantity

        if batch.completed_quantity + batch.defective_quantity >= batch.allocated_quantity:
            batch.status = LabourBatchStatus.SUBMITTED
            batch.completed_at = datetime.now(timezone.utc)
        else:
            batch.status = LabourBatchStatus.IN_PROGRESS

        # Deduct consumed from labour stock ledger if item is known
        # Find BOM component stock items associated with this product
        order_item_res = await db.execute(select(OrderItem).where(OrderItem.id == batch.order_item_id))
        order_item = order_item_res.scalar_one_or_none()

        if order_item:
            # Check for any active StockItem with this labourer
            labour_ledger_items = await db.execute(
                select(LabourStockLedger.stock_item_id)
                .where(LabourStockLedger.labourer_id == batch.labourer_id)
                .distinct()
            )
            for item_id in labour_ledger_items.scalars().all():
                if data.completed_quantity > Decimal("0.0"):
                    db.add(
                        LabourStockLedger(
                            labourer_id=batch.labourer_id,
                            stock_item_id=item_id,
                            transaction_type=LabourStockTransactionType.CONSUMED,
                            quantity=data.completed_quantity,
                            order_id=batch.order_id,
                            order_item_id=batch.order_item_id,
                            notes=f"Batch {batch.batch_code} completion",
                        )
                    )
                if data.defective_quantity > Decimal("0.0"):
                    db.add(
                        LabourStockLedger(
                            labourer_id=batch.labourer_id,
                            stock_item_id=item_id,
                            transaction_type=LabourStockTransactionType.DEFECTIVE,
                            quantity=data.defective_quantity,
                            order_id=batch.order_id,
                            order_item_id=batch.order_item_id,
                            notes=f"Defect: {data.defect_reason}",
                        )
                    )
                if data.returned_quantity > Decimal("0.0"):
                    db.add(
                        LabourStockLedger(
                            labourer_id=batch.labourer_id,
                            stock_item_id=item_id,
                            transaction_type=LabourStockTransactionType.RETURNED,
                            quantity=data.returned_quantity,
                            order_id=batch.order_id,
                            order_item_id=batch.order_item_id,
                            notes="Returned unused stock to central store",
                        )
                    )

        await db.commit()
        await db.refresh(submission)
        return submission

    @staticmethod
    async def transfer_material(
        db: AsyncSession,
        req: LabourTransferRequest,
        actor_id: Optional[uuid.UUID] = None,
    ) -> None:
        source_balance = await LabourService.get_labour_material_balance(db, req.from_labourer_id, req.stock_item_id)
        qty = Decimal(str(req.quantity))

        if source_balance < qty:
            raise BusinessRuleViolationError(
                f"Insufficient material balance for transfer. Available: {source_balance}, Requested: {qty}"
            )

        # 1. Deduct from source labourer
        out_entry = LabourStockLedger(
            labourer_id=req.from_labourer_id,
            stock_item_id=req.stock_item_id,
            transaction_type=LabourStockTransactionType.TRANSFERRED_OUT,
            quantity=qty,
            actor_id=actor_id,
            notes=f"Transferred to labourer {req.to_labourer_id}. {req.notes or ''}",
        )
        db.add(out_entry)

        # 2. Credit to destination labourer
        in_entry = LabourStockLedger(
            labourer_id=req.to_labourer_id,
            stock_item_id=req.stock_item_id,
            transaction_type=LabourStockTransactionType.TRANSFERRED_IN,
            quantity=qty,
            actor_id=actor_id,
            notes=f"Transferred from labourer {req.from_labourer_id}. {req.notes or ''}",
        )
        db.add(in_entry)

        await db.commit()

    @staticmethod
    async def generate_payment(
        db: AsyncSession,
        labourer_id: uuid.UUID,
        approver_id: Optional[uuid.UUID] = None,
    ) -> LabourPayment:
        # Find all SUBMITTED batches for labourer not yet attached to a payment ledger
        sub_batches_res = await db.execute(
            select(LabourBatch).where(
                LabourBatch.labourer_id == labourer_id,
                LabourBatch.status.in_([LabourBatchStatus.SUBMITTED, LabourBatchStatus.APPROVED]),
            )
        )
        batches = list(sub_batches_res.scalars().all())

        # Filter out batches already in payment ledger
        paid_batch_ids_res = await db.execute(select(LabourPaymentLedger.labour_batch_id))
        paid_ids = set(paid_batch_ids_res.scalars().all())

        eligible_batches = [b for b in batches if b.id not in paid_ids and b.completed_quantity > Decimal("0.0")]

        if not eligible_batches:
            raise BusinessRuleViolationError("No completed unpaid batches found for this labourer.")

        total_qty = Decimal("0.0")
        total_amount = Decimal("0.0")
        ledger_items: List[LabourPaymentLedger] = []

        for b in eligible_batches:
            # Payment strictly based on completed accepted units!
            accepted_qty = b.completed_quantity
            amt = accepted_qty * b.rate_per_unit
            total_qty += accepted_qty
            total_amount += amt

            ledger_items.append(
                LabourPaymentLedger(
                    labour_batch_id=b.id,
                    accepted_quantity=accepted_qty,
                    rate_per_unit=b.rate_per_unit,
                    amount=amt,
                )
            )

        pay_num = f"PAY-LB-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        payment = LabourPayment(
            payment_number=pay_num,
            labourer_id=labourer_id,
            total_accepted_quantity=total_qty,
            total_payable_amount=total_amount,
            status=LabourPaymentStatus.APPROVED if approver_id else LabourPaymentStatus.PENDING,
            approved_by_id=approver_id,
        )
        db.add(payment)
        await db.flush()

        for item in ledger_items:
            item.labour_payment_id = payment.id
            db.add(item)

        await db.commit()
        await db.refresh(payment)
        return payment
