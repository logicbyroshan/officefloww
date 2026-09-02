import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.core.exceptions import EntityNotFoundError, BusinessRuleViolationError
from apps.api.app.orders.models import Order, OrderItem, OrderStatus, OrderPriority, OrderItemStatus
from apps.api.app.orders.schemas import OrderCreate, OrderUpdate, OrderItemCreate
from apps.api.app.products.models import Product
from apps.api.app.workflows.models import WorkflowTemplate
from apps.api.app.workflows.service import WorkflowService
from apps.api.app.files.models import FileFolder
from apps.api.app.quantities.models import QuantityTransaction, QuantityTransactionType
from apps.api.app.audit.models import AuditLog


STANDARD_ORDER_FOLDERS = [
    "01-Order",
    "02-Data",
    "03-Photography",
    "04-Design",
    "05-Approved",
    "06-Printing",
    "07-Fitting",
    "08-Packing",
    "09-Dispatch",
    "10-Billing",
]


class OrderService:
    @staticmethod
    async def generate_order_number(db: AsyncSession) -> str:
        count = await db.scalar(select(func.count()).select_from(Order)) or 0
        year = datetime.now(timezone.utc).year
        return f"ORD-{year}-{count + 1:04d}"

    @staticmethod
    async def create_order(db: AsyncSession, data: OrderCreate, user_id: uuid.UUID) -> Order:
        if not data.items:
            raise BusinessRuleViolationError("An order must contain at least one order item.")

        order_number = data.order_number or await OrderService.generate_order_number(db)

        # Calculate total amount
        total_amount = sum(item.quantity * item.unit_price for item in data.items)

        order = Order(
            order_number=order_number,
            client_id=data.client_id,
            status=OrderStatus.CONFIRMED,
            priority=data.priority,
            promised_delivery_date=data.promised_delivery_date,
            billing_address=data.billing_address,
            delivery_address=data.delivery_address,
            total_amount=total_amount,
            notes=data.notes,
            created_by_id=user_id,
        )
        db.add(order)
        await db.flush()

        # Create Order Items and independent Workflow Instances
        for item_in in data.items:
            product = await db.scalar(select(Product).where(Product.id == item_in.product_id))
            if not product:
                raise EntityNotFoundError("Product", item_in.product_id)

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item_in.quantity,
                unit_price=item_in.unit_price,
                specifications_json=item_in.specifications_json or {},
                status=OrderItemStatus.IN_PRODUCTION,
            )
            db.add(order_item)
            await db.flush()

            # Find matching workflow template
            template = None
            if product.default_workflow_template_id:
                template = await db.scalar(
                    select(WorkflowTemplate).where(
                        WorkflowTemplate.id == product.default_workflow_template_id,
                        WorkflowTemplate.is_active == True,
                    )
                )
            if not template:
                # Fallback: search template matching product code or name, or any active template
                template = await db.scalar(
                    select(WorkflowTemplate).where(
                        (WorkflowTemplate.code.ilike(f"%{product.code}%"))
                        | (WorkflowTemplate.name.ilike(f"%{product.name}%")),
                        WorkflowTemplate.is_active == True,
                    )
                )
            if not template:
                template = await db.scalar(
                    select(WorkflowTemplate).where(WorkflowTemplate.is_active == True)
                )

            if template:
                wf_instance = await WorkflowService.instantiate_workflow(
                    db=db,
                    order_id=order.id,
                    order_item_id=order_item.id,
                    template_id=template.id,
                )
                order_item.workflow_instance_id = wf_instance.id

            # Initial quantity ledger transaction: ORDERED
            qty_tx = QuantityTransaction(
                order_id=order.id,
                order_item_id=order_item.id,
                transaction_type=QuantityTransactionType.ORDERED,
                quantity=item_in.quantity,
                actor_id=user_id,
                reason="Initial order placement",
            )
            db.add(qty_tx)

        # Create logical workspace folder structure for the order
        for folder_name in STANDARD_ORDER_FOLDERS:
            folder = FileFolder(
                order_id=order.id,
                name=folder_name,
                path=f"{order.order_number}/{folder_name}",
            )
            db.add(folder)

        # Audit Log
        audit = AuditLog(
            actor_id=user_id,
            action="ORDER_CREATED",
            entity="Order",
            entity_id=str(order.id),
            new_values_json={
                "order_number": order.order_number,
                "client_id": str(order.client_id),
                "total_amount": order.total_amount,
                "items_count": len(data.items),
            },
            reason="Order placed with items and workflows instantiated",
        )
        db.add(audit)

        await db.commit()
        return await OrderService.get_order(db, order.id)

    @staticmethod
    async def list_orders(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        client_id: Optional[uuid.UUID] = None,
        status: Optional[OrderStatus] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Order], int]:
        query = select(Order).options(selectinload(Order.items))
        if client_id:
            query = query.where(Order.client_id == client_id)
        if status:
            query = query.where(Order.status == status)
        if search:
            pattern = f"%{search}%"
            query = query.where(Order.order_number.ilike(pattern))

        total = await db.scalar(select(func.count()).select_from(query.subquery())) or 0
        query = query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        orders = result.scalars().all()
        return list(orders), total

    @staticmethod
    async def get_order(db: AsyncSession, order_id: uuid.UUID) -> Order:
        query = select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        result = await db.execute(query)
        order = result.scalar_one_or_none()
        if not order:
            raise EntityNotFoundError("Order", order_id)
        return order

    @staticmethod
    async def update_order(db: AsyncSession, order_id: uuid.UUID, data: OrderUpdate, user_id: uuid.UUID) -> Order:
        order = await OrderService.get_order(db, order_id)
        old_status = order.status

        if data.status is not None:
            order.status = data.status
        if data.priority is not None:
            order.priority = data.priority
        if data.promised_delivery_date is not None:
            order.promised_delivery_date = data.promised_delivery_date
        if data.billing_address is not None:
            order.billing_address = data.billing_address
        if data.delivery_address is not None:
            order.delivery_address = data.delivery_address
        if data.notes is not None:
            order.notes = data.notes

        if data.status is not None and data.status != old_status:
            audit = AuditLog(
                actor_id=user_id,
                action="ORDER_STATUS_CHANGED",
                entity="Order",
                entity_id=str(order.id),
                old_values_json={"status": old_status.value},
                new_values_json={"status": data.status.value},
                reason="Manual order status transition",
            )
            db.add(audit)

        await db.commit()
        await db.refresh(order)
        return order
