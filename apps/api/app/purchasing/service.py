from datetime import datetime, timezone, date
from decimal import Decimal
from typing import List, Optional
import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from apps.api.app.purchasing.models import (
    Supplier,
    SupplierContact,
    SupplierProduct,
    SupplierPriceHistory,
    PurchaseOrder,
    PurchaseOrderItem,
    GoodsReceipt,
    GoodsReceiptItem,
    POStatus,
    GRNStatus,
)
from apps.api.app.purchasing.schemas import (
    SupplierCreate,
    SupplierProductCreate,
    PurchaseOrderCreate,
    GoodsReceiptCreate,
    PriceTrendsRead,
)
from apps.api.app.stock.models import StockLocation, StockLocationType, StockLot, StockMovement, StockMovementType


class PurchasingService:
    @staticmethod
    async def create_supplier(db: AsyncSession, data: SupplierCreate) -> Supplier:
        existing = await db.execute(select(Supplier).where(Supplier.code == data.code))
        if existing.scalar_one_or_none():
            raise BusinessRuleViolationError(f"Supplier with code '{data.code}' already exists.")

        supp_data = data.model_dump(exclude={"contacts"})
        supplier = Supplier(**supp_data)
        db.add(supplier)
        await db.flush()

        if data.contacts:
            for c in data.contacts:
                contact = SupplierContact(supplier_id=supplier.id, **c.model_dump())
                db.add(contact)

        await db.commit()
        await db.refresh(supplier)
        return supplier

    @staticmethod
    async def get_suppliers(db: AsyncSession) -> List[Supplier]:
        res = await db.execute(select(Supplier).order_by(Supplier.name))
        return list(res.scalars().all())

    @staticmethod
    async def get_supplier(db: AsyncSession, supplier_id: uuid.UUID) -> Supplier:
        res = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
        supp = res.scalar_one_or_none()
        if not supp:
            raise EntityNotFoundError("Supplier", supplier_id)
        return supp

    @staticmethod
    async def add_supplier_product(db: AsyncSession, data: SupplierProductCreate) -> SupplierProduct:
        sp = SupplierProduct(**data.model_dump())
        db.add(sp)
        await db.commit()
        await db.refresh(sp)
        return sp

    @staticmethod
    async def create_purchase_order(
        db: AsyncSession,
        data: PurchaseOrderCreate,
        creator_id: Optional[uuid.UUID] = None,
    ) -> PurchaseOrder:
        supplier = await PurchasingService.get_supplier(db, data.supplier_id)

        po_number = data.po_number or f"PO-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        total_amount = sum(item.quantity * item.unit_price for item in data.items)

        po = PurchaseOrder(
            po_number=po_number,
            supplier_id=supplier.id,
            status=POStatus.DRAFT,
            total_amount=total_amount,
            created_by_id=creator_id,
            notes=data.notes,
        )
        db.add(po)
        await db.flush()

        for itm in data.items:
            po_item = PurchaseOrderItem(
                purchase_order_id=po.id,
                stock_item_id=itm.stock_item_id,
                quantity=itm.quantity,
                unit_price=itm.unit_price,
            )
            db.add(po_item)

        await db.commit()
        await db.refresh(po)
        return po

    @staticmethod
    async def approve_purchase_order(
        db: AsyncSession,
        po_id: uuid.UUID,
        approver_id: uuid.UUID,
    ) -> PurchaseOrder:
        res = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
        po = res.scalar_one_or_none()
        if not po:
            raise EntityNotFoundError("PurchaseOrder", po_id)

        if po.status not in (POStatus.DRAFT, POStatus.RECOMMENDED):
            raise BusinessRuleViolationError(f"Cannot approve PO with status '{po.status}'.")

        po.status = POStatus.APPROVED
        po.approved_by_id = approver_id
        po.approved_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(po)
        return po

    @staticmethod
    async def receive_goods(
        db: AsyncSession,
        data: GoodsReceiptCreate,
        receiver_id: Optional[uuid.UUID] = None,
    ) -> GoodsReceipt:
        res = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == data.purchase_order_id))
        po = res.scalar_one_or_none()
        if not po:
            raise EntityNotFoundError("PurchaseOrder", data.purchase_order_id)

        if po.status not in (POStatus.APPROVED, POStatus.SENT, POStatus.PARTIALLY_RECEIVED):
            raise BusinessRuleViolationError("Cannot receive goods against unapproved or cancelled PO.")

        # Find or create MAIN_STORE location for receipts
        loc_res = await db.execute(
            select(StockLocation).where(StockLocation.location_type == StockLocationType.MAIN_STORE)
        )
        main_store = loc_res.scalars().first()
        if not main_store:
            main_store = StockLocation(
                code="LOC-MAIN-STORE",
                name="Main Central Store",
                location_type=StockLocationType.MAIN_STORE,
            )
            db.add(main_store)
            await db.flush()

        grn_number = data.grn_number or f"GRN-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        grn = GoodsReceipt(
            grn_number=grn_number,
            purchase_order_id=po.id,
            supplier_id=po.supplier_id,
            received_by_id=receiver_id,
            status=GRNStatus.VERIFIED,
            notes=data.notes,
        )
        db.add(grn)
        await db.flush()

        for itm in data.items:
            lot_num = itm.lot_number or f"LOT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
            grn_item = GoodsReceiptItem(
                goods_receipt_id=grn.id,
                purchase_order_item_id=itm.purchase_order_item_id,
                stock_item_id=itm.stock_item_id,
                received_quantity=itm.received_quantity,
                accepted_quantity=itm.accepted_quantity,
                rejected_quantity=itm.rejected_quantity,
                unit_cost=itm.unit_cost,
                lot_number=lot_num,
            )
            db.add(grn_item)

            # Update PO item received quantity
            poi_res = await db.execute(
                select(PurchaseOrderItem).where(PurchaseOrderItem.id == itm.purchase_order_item_id)
            )
            poi = poi_res.scalar_one_or_none()
            if poi:
                poi.received_quantity += itm.accepted_quantity

            # Add to StockLot & create RECEIPT movement
            if itm.accepted_quantity > Decimal("0.0"):
                new_lot = StockLot(
                    stock_item_id=itm.stock_item_id,
                    location_id=main_store.id,
                    lot_number=lot_num,
                    initial_quantity=itm.accepted_quantity,
                    current_quantity=itm.accepted_quantity,
                    cost_per_unit=itm.unit_cost,
                    supplier_id=po.supplier_id,
                )
                db.add(new_lot)
                await db.flush()

                mov = StockMovement(
                    stock_item_id=itm.stock_item_id,
                    lot_id=new_lot.id,
                    movement_type=StockMovementType.RECEIPT,
                    quantity=itm.accepted_quantity,
                    to_location_id=main_store.id,
                    actor_id=receiver_id,
                    reason=f"Goods Receipt {grn_number}",
                )
                db.add(mov)

                # Record Price History
                prev_price_res = await db.execute(
                    select(SupplierPriceHistory)
                    .where(SupplierPriceHistory.stock_item_id == itm.stock_item_id)
                    .order_by(SupplierPriceHistory.purchase_date.desc(), SupplierPriceHistory.created_at.desc())
                )
                prev_hist = prev_price_res.scalars().first()
                previous_price = prev_hist.unit_price if prev_hist else None

                abs_inc = None
                pct_inc = None
                if previous_price is not None and previous_price > Decimal("0.0"):
                    abs_inc = itm.unit_cost - previous_price
                    pct_inc = (abs_inc / previous_price) * Decimal("100.0")

                price_hist = SupplierPriceHistory(
                    supplier_id=po.supplier_id,
                    stock_item_id=itm.stock_item_id,
                    unit_price=itm.unit_cost,
                    quantity=itm.accepted_quantity,
                    landed_cost_per_unit=itm.unit_cost,
                    previous_price=previous_price,
                    absolute_increase=abs_inc,
                    percentage_increase=pct_inc,
                )
                db.add(price_hist)

        # Update PO status to RECEIVED or PARTIALLY_RECEIVED
        all_poi_res = await db.execute(select(PurchaseOrderItem).where(PurchaseOrderItem.purchase_order_id == po.id))
        all_items = all_poi_res.scalars().all()
        if all(i.received_quantity >= i.quantity for i in all_items):
            po.status = POStatus.RECEIVED
        else:
            po.status = POStatus.PARTIALLY_RECEIVED

        await db.commit()
        await db.refresh(grn)
        return grn

    @staticmethod
    async def get_price_trends(db: AsyncSession, stock_item_id: uuid.UUID) -> PriceTrendsRead:
        res = await db.execute(
            select(SupplierPriceHistory)
            .where(SupplierPriceHistory.stock_item_id == stock_item_id)
            .order_by(SupplierPriceHistory.purchase_date.desc(), SupplierPriceHistory.created_at.desc())
        )
        history = list(res.scalars().all())

        if not history:
            return PriceTrendsRead(
                stock_item_id=stock_item_id,
                current_price=Decimal("0.0"),
                previous_price=None,
                absolute_increase=None,
                percentage_increase=None,
                recent_average_price=Decimal("0.0"),
            )

        current = history[0]
        previous = history[1] if len(history) > 1 else None

        avg_res = await db.execute(
            select(func.avg(SupplierPriceHistory.unit_price)).where(
                SupplierPriceHistory.stock_item_id == stock_item_id
            )
        )
        recent_avg = Decimal(str(round(avg_res.scalar_one() or Decimal("0.0"), 4)))

        return PriceTrendsRead(
            stock_item_id=stock_item_id,
            current_price=current.unit_price,
            previous_price=previous.unit_price if previous else None,
            absolute_increase=current.absolute_increase,
            percentage_increase=current.percentage_increase,
            recent_average_price=recent_avg,
        )
