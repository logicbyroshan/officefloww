from datetime import datetime, timezone, date
from decimal import Decimal
from typing import List, Optional
import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.billing.models import (
    Invoice,
    InvoiceItem,
    InvoiceStatus,
    Payment,
    PaymentMethod,
    ClientLedger,
    ClientLedgerType,
)
from apps.api.app.billing.schemas import (
    InvoiceCreate,
    PaymentCreate,
    OrderCompletionCheckResponse,
)
from apps.api.app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from apps.api.app.orders.models import Order, OrderStatus, OrderItem
from apps.api.app.packing.models import PackingStatus, PackingTask
from apps.api.app.quantities.models import QuantityTransaction, QuantityTransactionType
from apps.api.app.workflows.models import StepStatus, WorkflowInstance, WorkflowStepInstance


class BillingService:
    @staticmethod
    async def get_invoice(db: AsyncSession, invoice_id: uuid.UUID) -> Invoice:
        res = await db.execute(
            select(Invoice)
            .options(selectinload(Invoice.items))
            .where(Invoice.id == invoice_id)
        )
        inv = res.scalar_one_or_none()
        if not inv:
            raise EntityNotFoundError("Invoice", str(invoice_id))
        return inv

    @staticmethod
    async def create_invoice(db: AsyncSession, data: InvoiceCreate) -> Invoice:
        inv_number = f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"

        subtotal = Decimal("0.0")
        tax_total = Decimal("0.0")

        items_to_add: List[InvoiceItem] = []
        for itm in data.items:
            base_amt = itm.quantity * itm.unit_price
            tax_amt = base_amt * (itm.tax_rate / Decimal("100.00"))
            line_total = base_amt + tax_amt

            subtotal += base_amt
            tax_total += tax_amt

            items_to_add.append(
                InvoiceItem(
                    order_item_id=itm.order_item_id,
                    description=itm.description,
                    quantity=itm.quantity,
                    unit_price=itm.unit_price,
                    tax_rate=itm.tax_rate,
                    amount=line_total,
                )
            )

        invoice = Invoice(
            invoice_number=inv_number,
            order_id=data.order_id,
            client_id=data.client_id,
            status=InvoiceStatus.ISSUED,
            issue_date=date.today(),
            due_date=data.due_date,
            subtotal=subtotal,
            tax_amount=tax_total,
            total_amount=subtotal + tax_total,
            paid_amount=Decimal("0.0"),
            notes=data.notes,
        )
        db.add(invoice)
        await db.flush()

        for item in items_to_add:
            item.invoice_id = invoice.id
            db.add(item)

        # Update ClientLedger
        ledger_entry = ClientLedger(
            client_id=invoice.client_id,
            transaction_type=ClientLedgerType.INVOICE,
            amount=invoice.total_amount,
            balance_after=invoice.total_amount,
            reference_id=invoice.id,
            notes=f"Invoice {inv_number} issued",
        )
        db.add(ledger_entry)

        await db.commit()
        await db.refresh(invoice)
        return invoice

    @staticmethod
    async def record_payment(
        db: AsyncSession,
        data: PaymentCreate,
        receiver_id: Optional[uuid.UUID] = None,
    ) -> Payment:
        res = await db.execute(select(Invoice).where(Invoice.id == data.invoice_id))
        inv = res.scalar_one_or_none()
        if not inv:
            raise EntityNotFoundError("Invoice", data.invoice_id)

        pay_num = f"PAY-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"

        payment = Payment(
            payment_number=pay_num,
            invoice_id=inv.id,
            client_id=inv.client_id,
            amount=data.amount,
            payment_method=data.payment_method,
            reference_number=data.reference_number,
            received_by_id=receiver_id,
            notes=data.notes,
        )
        db.add(payment)

        inv.paid_amount += data.amount
        if inv.paid_amount >= inv.total_amount:
            inv.status = InvoiceStatus.PAID
        else:
            inv.status = InvoiceStatus.PARTIALLY_PAID

        # Update ClientLedger
        ledger_entry = ClientLedger(
            client_id=inv.client_id,
            transaction_type=ClientLedgerType.PAYMENT,
            amount=data.amount,
            balance_after=max(Decimal("0.0"), inv.total_amount - inv.paid_amount),
            reference_id=payment.id,
            notes=f"Payment {pay_num} received",
        )
        db.add(ledger_entry)

        await db.commit()
        await db.refresh(payment)
        return payment

    @staticmethod
    async def check_order_completion_conditions(
        db: AsyncSession,
        order_id: uuid.UUID,
    ) -> OrderCompletionCheckResponse:
        res = await db.execute(select(Order).where(Order.id == order_id))
        order = res.scalar_one_or_none()
        if not order:
            raise EntityNotFoundError("Order", order_id)

        reasons: List[str] = []

        # 1. Workflows Completed Check
        wf_res = await db.execute(
            select(WorkflowStepInstance)
            .join(WorkflowInstance, WorkflowStepInstance.workflow_instance_id == WorkflowInstance.id)
            .join(OrderItem, WorkflowInstance.order_item_id == OrderItem.id)
            .where(
                OrderItem.order_id == order_id,
                WorkflowStepInstance.status.notin_([StepStatus.COMPLETED, StepStatus.SKIPPED]),
            )
        )
        uncompleted_steps = wf_res.scalars().all()
        workflows_completed = len(uncompleted_steps) == 0
        if not workflows_completed:
            reasons.append(f"{len(uncompleted_steps)} workflow steps are still pending completion.")

        # 2. Packing Completed Check
        pack_res = await db.execute(select(PackingTask).where(PackingTask.order_id == order_id))
        packing_tasks = list(pack_res.scalars().all())
        if not packing_tasks:
            packing_completed = False
            reasons.append("No packing tasks have been created or executed for this order.")
        else:
            packing_completed = all(p.status in (PackingStatus.COMPLETED, PackingStatus.VERIFIED) for p in packing_tasks)
            if not packing_completed:
                reasons.append("Packing tasks are still in progress and not verified.")

        # 3. Quantities Reconciled Check
        quantities_reconciled = True
        for item in order.items:
            # Check good packed units vs order quantity
            packed_res = await db.execute(
                select(func.coalesce(func.sum(QuantityTransaction.quantity), 0)).where(
                    QuantityTransaction.order_item_id == item.id,
                    QuantityTransaction.transaction_type == QuantityTransactionType.PACKED,
                )
            )
            packed_qty = packed_res.scalar_one()
            if packed_qty < item.quantity:
                quantities_reconciled = False
                reasons.append(
                    f"Order item {item.id} shortfall: Ordered {item.quantity}, but only {packed_qty} units packed."
                )

        can_complete = workflows_completed and packing_completed and quantities_reconciled

        return OrderCompletionCheckResponse(
            order_id=order_id,
            can_complete=can_complete,
            reasons=reasons,
            workflows_completed=workflows_completed,
            quantities_reconciled=quantities_reconciled,
            packing_completed=packing_completed,
        )

    @staticmethod
    async def complete_order(db: AsyncSession, order_id: uuid.UUID) -> Order:
        check = await BillingService.check_order_completion_conditions(db, order_id)
        if not check.can_complete:
            raise BusinessRuleViolationError(
                f"Order cannot be marked COMPLETED. Invariants breached: {'; '.join(check.reasons)}"
            )

        res = await db.execute(select(Order).where(Order.id == order_id))
        order = res.scalar_one()
        order.status = OrderStatus.COMPLETED
        await db.commit()
        await db.refresh(order)
        return order
