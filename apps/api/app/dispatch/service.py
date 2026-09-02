from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from apps.api.app.dispatch.models import (
    Delivery,
    DeliveryBooking,
    DeliveryException,
    DeliveryExpense,
    DeliveryStatus,
    ReimbursementStatus,
    TransportProvider,
)
from apps.api.app.dispatch.schemas import (
    DeliveryBookingCreate,
    DeliveryCreate,
    DeliveryExceptionCreate,
    DeliveryExpenseCreate,
    TransportProviderCreate,
)


class DispatchService:
    @staticmethod
    async def create_provider(db: AsyncSession, data: TransportProviderCreate) -> TransportProvider:
        existing = await db.execute(select(TransportProvider).where(TransportProvider.code == data.code))
        if existing.scalar_one_or_none():
            raise BusinessRuleViolationError(f"TransportProvider with code '{data.code}' already exists.")
        tp = TransportProvider(**data.model_dump())
        db.add(tp)
        await db.commit()
        await db.refresh(tp)
        return tp

    @staticmethod
    async def get_providers(db: AsyncSession) -> List[TransportProvider]:
        res = await db.execute(select(TransportProvider).order_by(TransportProvider.name))
        return list(res.scalars().all())

    @staticmethod
    async def create_delivery(db: AsyncSession, data: DeliveryCreate) -> Delivery:
        deliv_num = f"DEL-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        delivery = Delivery(
            delivery_number=deliv_num,
            order_id=data.order_id,
            transport_type=data.transport_type,
            destination_address=data.destination_address,
            destination_city=data.destination_city,
            total_packages=data.total_packages,
            total_weight_kg=data.total_weight_kg,
            delivery_partner_id=data.delivery_partner_id,
            transport_provider_id=data.transport_provider_id,
            status=DeliveryStatus.DRAFT,
            notes=data.notes,
        )
        db.add(delivery)
        await db.commit()
        await db.refresh(delivery)
        return delivery

    @staticmethod
    async def get_delivery(db: AsyncSession, delivery_id: uuid.UUID) -> Delivery:
        res = await db.execute(select(Delivery).where(Delivery.id == delivery_id))
        deliv = res.scalar_one_or_none()
        if not deliv:
            raise EntityNotFoundError("Delivery", delivery_id)
        return deliv

    @staticmethod
    async def book_delivery(
        db: AsyncSession,
        data: DeliveryBookingCreate,
        booked_by_id: uuid.UUID,
    ) -> DeliveryBooking:
        delivery = await DispatchService.get_delivery(db, data.delivery_id)

        booking = DeliveryBooking(
            delivery_id=delivery.id,
            booking_reference=data.booking_reference,
            charge_amount=data.charge_amount,
            paid_by_id=data.paid_by_id or booked_by_id,
            booked_by_id=booked_by_id,
            receipt_file_id=data.receipt_file_id,
        )
        db.add(booking)

        delivery.status = DeliveryStatus.BOOKED

        # If paid out-of-pocket, automatically create an expense reimbursement record
        if data.charge_amount > Decimal("0.0"):
            expense = DeliveryExpense(
                delivery_id=delivery.id,
                order_id=delivery.order_id,
                paid_by_id=data.paid_by_id or booked_by_id,
                amount=data.charge_amount,
                expense_type=f"{delivery.transport_type.value}_CHARGE",
                receipt_file_id=data.receipt_file_id,
                reimbursement_status=ReimbursementStatus.PENDING,
                notes=f"Auto-logged from booking {data.booking_reference}",
            )
            db.add(expense)

        await db.commit()
        await db.refresh(booking)
        return booking

    @staticmethod
    async def record_expense(
        db: AsyncSession,
        data: DeliveryExpenseCreate,
        paid_by_id: uuid.UUID,
    ) -> DeliveryExpense:
        delivery = await DispatchService.get_delivery(db, data.delivery_id)

        exp = DeliveryExpense(
            delivery_id=delivery.id,
            order_id=data.order_id,
            paid_by_id=paid_by_id,
            amount=data.amount,
            expense_type=data.expense_type,
            receipt_file_id=data.receipt_file_id,
            reimbursement_status=ReimbursementStatus.PENDING,
            notes=data.notes,
        )
        db.add(exp)
        await db.commit()
        await db.refresh(exp)
        return exp

    @staticmethod
    async def approve_reimbursement(
        db: AsyncSession,
        expense_id: uuid.UUID,
        approver_id: uuid.UUID,
    ) -> DeliveryExpense:
        res = await db.execute(select(DeliveryExpense).where(DeliveryExpense.id == expense_id))
        exp = res.scalar_one_or_none()
        if not exp:
            raise EntityNotFoundError("DeliveryExpense", expense_id)

        exp.reimbursement_status = ReimbursementStatus.APPROVED
        exp.approved_by_id = approver_id
        await db.commit()
        await db.refresh(exp)
        return exp

    @staticmethod
    async def log_exception(
        db: AsyncSession,
        data: DeliveryExceptionCreate,
        recorded_by_id: uuid.UUID,
    ) -> DeliveryException:
        delivery = await DispatchService.get_delivery(db, data.delivery_id)

        exc = DeliveryException(
            delivery_id=delivery.id,
            expected_value=data.expected_value,
            actual_value=data.actual_value,
            reason=data.reason,
            recorded_by_id=recorded_by_id,
            evidence_file_id=data.evidence_file_id,
        )
        db.add(exc)
        await db.commit()
        await db.refresh(exc)
        return exc
