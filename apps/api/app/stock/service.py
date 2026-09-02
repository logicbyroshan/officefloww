from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
import uuid

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from apps.api.app.orders.models import OrderItem
from apps.api.app.products.models import BillOfMaterials, BOMItem
from apps.api.app.stock.models import (
    StockItem,
    StockLocation,
    StockLot,
    StockMovement,
    StockMovementType,
    StockReservation,
    ReservationStatus,
)
from apps.api.app.stock.schemas import (
    StockBalanceRead,
    StockItemCreate,
    StockLocationCreate,
    StockLotCreate,
    StockMovementCreate,
    BOMRequirementItem,
    OrderBOMCalculationResponse,
)


class StockService:
    @staticmethod
    async def create_location(db: AsyncSession, data: StockLocationCreate) -> StockLocation:
        existing = await db.execute(select(StockLocation).where(StockLocation.code == data.code))
        if existing.scalar_one_or_none():
            raise BusinessRuleViolationError(f"StockLocation with code '{data.code}' already exists.")
        loc = StockLocation(**data.model_dump())
        db.add(loc)
        await db.commit()
        await db.refresh(loc)
        return loc

    @staticmethod
    async def get_locations(db: AsyncSession) -> List[StockLocation]:
        res = await db.execute(select(StockLocation).order_by(StockLocation.code))
        return list(res.scalars().all())

    @staticmethod
    async def create_item(db: AsyncSession, data: StockItemCreate) -> StockItem:
        existing = await db.execute(select(StockItem).where(StockItem.code == data.code))
        if existing.scalar_one_or_none():
            raise BusinessRuleViolationError(f"StockItem with code '{data.code}' already exists.")
        item = StockItem(**data.model_dump())
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item

    @staticmethod
    async def create_lot(db: AsyncSession, data: StockLotCreate) -> StockLot:
        lot = StockLot(
            stock_item_id=data.stock_item_id,
            location_id=data.location_id,
            lot_number=data.lot_number,
            initial_quantity=data.quantity,
            current_quantity=data.quantity,
            cost_per_unit=data.cost_per_unit,
            supplier_id=data.supplier_id,
            expiry_date=data.expiry_date,
        )
        db.add(lot)
        await db.commit()
        await db.refresh(lot)
        return lot

    @staticmethod
    async def get_items(db: AsyncSession) -> List[StockItem]:
        res = await db.execute(select(StockItem).order_by(StockItem.name))
        return list(res.scalars().all())

    @staticmethod
    async def get_item(db: AsyncSession, item_id: uuid.UUID) -> StockItem:
        res = await db.execute(select(StockItem).where(StockItem.id == item_id))
        item = res.scalar_one_or_none()
        if not item:
            raise EntityNotFoundError("StockItem", item_id)
        return item

    @staticmethod
    async def get_stock_balance(db: AsyncSession, item_id: uuid.UUID) -> StockBalanceRead:
        item = await StockService.get_item(db, item_id)

        # 1. Physical Stock = sum of current_quantity across all active lots
        phys_query = select(func.coalesce(func.sum(StockLot.current_quantity), Decimal("0.0"))).where(
            StockLot.stock_item_id == item_id
        )
        phys_res = await db.execute(phys_query)
        physical_stock = Decimal(str(phys_res.scalar_one()))

        # 2. Reserved Stock = sum of unfulfilled reservations
        res_query = select(
            func.coalesce(
                func.sum(StockReservation.reserved_quantity - StockReservation.fulfilled_quantity),
                Decimal("0.0"),
            )
        ).where(
            StockReservation.stock_item_id == item_id,
            StockReservation.status.in_([ReservationStatus.PENDING, ReservationStatus.PARTIALLY_FULFILLED]),
        )
        res_res = await db.execute(res_query)
        reserved_stock = Decimal(str(res_res.scalar_one()))

        available_stock = max(Decimal("0.0"), physical_stock - reserved_stock)

        return StockBalanceRead(
            item_id=item.id,
            item_code=item.code,
            item_name=item.name,
            unit=item.unit,
            physical_stock=physical_stock,
            reserved_stock=reserved_stock,
            available_stock=available_stock,
        )

    @staticmethod
    async def record_movement(
        db: AsyncSession,
        data: StockMovementCreate,
        actor_id: Optional[uuid.UUID] = None,
    ) -> StockMovement:
        qty = Decimal(str(data.quantity))
        if qty <= Decimal("0.0"):
            raise BusinessRuleViolationError("Movement quantity must be strictly greater than zero.")

        item = await StockService.get_item(db, data.stock_item_id)

        lot: Optional[StockLot] = None
        if data.lot_id:
            lot_res = await db.execute(select(StockLot).where(StockLot.id == data.lot_id))
            lot = lot_res.scalar_one_or_none()
            if not lot:
                raise EntityNotFoundError("StockLot", data.lot_id)

        # Movement type logic
        if data.movement_type == StockMovementType.RECEIPT:
            # Add to lot if specified, or create a default receipt lot
            if lot:
                lot.current_quantity += qty
            elif data.to_location_id:
                lot = StockLot(
                    stock_item_id=item.id,
                    location_id=data.to_location_id,
                    lot_number=f"LOT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}",
                    initial_quantity=qty,
                    current_quantity=qty,
                    cost_per_unit=item.cost_price,
                )
                db.add(lot)
                await db.flush()

        elif data.movement_type in (
            StockMovementType.ISSUE,
            StockMovementType.CONSUMPTION,
            StockMovementType.WASTE,
        ):
            if lot:
                if lot.current_quantity < qty:
                    raise BusinessRuleViolationError(
                        f"Insufficient lot quantity. Available: {lot.current_quantity}, Requested: {qty}"
                    )
                lot.current_quantity -= qty
            else:
                # Deduct from lots FIFO
                balance = await StockService.get_stock_balance(db, item.id)
                if balance.physical_stock < qty:
                    raise BusinessRuleViolationError(
                        f"Insufficient physical stock for {item.name}. Physical: {balance.physical_stock}, Requested: {qty}"
                    )
                # Deduct across lots
                lots_res = await db.execute(
                    select(StockLot)
                    .where(StockLot.stock_item_id == item.id, StockLot.current_quantity > Decimal("0.0"))
                    .order_by(StockLot.created_at)
                )
                remaining = qty
                for l in lots_res.scalars().all():
                    deduct = min(l.current_quantity, remaining)
                    l.current_quantity -= deduct
                    remaining -= deduct
                    if remaining <= Decimal("0.0"):
                        break

        elif data.movement_type == StockMovementType.RETURN:
            if lot:
                lot.current_quantity += qty
            elif data.to_location_id:
                lot = StockLot(
                    stock_item_id=item.id,
                    location_id=data.to_location_id,
                    lot_number=f"RET-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}",
                    initial_quantity=qty,
                    current_quantity=qty,
                    cost_per_unit=item.cost_price,
                )
                db.add(lot)
                await db.flush()

        elif data.movement_type == StockMovementType.TRANSFER:
            if not data.from_location_id or not data.to_location_id:
                raise BusinessRuleViolationError("Transfer requires both from_location_id and to_location_id.")
            # Ensure physical stock exists in from_location
            from_lots_res = await db.execute(
                select(StockLot).where(
                    StockLot.stock_item_id == item.id,
                    StockLot.location_id == data.from_location_id,
                    StockLot.current_quantity > Decimal("0.0"),
                )
            )
            from_lots = list(from_lots_res.scalars().all())
            avail = sum(l.current_quantity for l in from_lots)
            if avail < qty:
                raise BusinessRuleViolationError(
                    f"Insufficient stock at source location to transfer: Available {avail}, required {qty}."
                )

            # Deduct from source and add to destination
            rem = qty
            for l in from_lots:
                take = min(rem, l.current_quantity)
                l.current_quantity -= take
                rem -= take
                if rem == Decimal("0.0"):
                    break

            # Find or create lot in destination location
            to_lot_res = await db.execute(
                select(StockLot).where(
                    StockLot.stock_item_id == item.id,
                    StockLot.location_id == data.to_location_id,
                )
            )
            to_lot = to_lot_res.scalars().first()
            if to_lot:
                to_lot.current_quantity += qty
                lot = to_lot
            else:
                lot = StockLot(
                    stock_item_id=item.id,
                    location_id=data.to_location_id,
                    lot_number=f"TRF-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}",
                    initial_quantity=qty,
                    current_quantity=qty,
                    cost_per_unit=lot.cost_per_unit if lot else item.cost_price,
                )
                db.add(lot)
                await db.flush()

        movement = StockMovement(
            stock_item_id=data.stock_item_id,
            lot_id=lot.id if lot else None,
            movement_type=data.movement_type,
            quantity=qty,
            from_location_id=data.from_location_id,
            to_location_id=data.to_location_id,
            order_id=data.order_id,
            order_item_id=data.order_item_id,
            actor_id=actor_id,
            reason=data.reason,
            metadata_json=data.metadata_json or {},
        )
        db.add(movement)
        await db.commit()
        await db.refresh(movement)
        return movement

    @staticmethod
    async def calculate_bom_and_reserve(
        db: AsyncSession,
        order_id: uuid.UUID,
        order_item_id: uuid.UUID,
        auto_reserve: bool = True,
    ) -> OrderBOMCalculationResponse:
        oi_res = await db.execute(select(OrderItem).where(OrderItem.id == order_item_id))
        order_item = oi_res.scalar_one_or_none()
        if not order_item:
            raise EntityNotFoundError("OrderItem", order_item_id)

        # Get active BOM for product
        bom_res = await db.execute(
            select(BillOfMaterials)
            .where(BillOfMaterials.product_id == order_item.product_id, BillOfMaterials.is_active == True)
            .order_by(BillOfMaterials.version.desc())
        )
        bom = bom_res.scalars().first()

        requirements: List[BOMRequirementItem] = []
        has_shortage = False

        if not bom or not bom.items:
            return OrderBOMCalculationResponse(
                order_id=order_id,
                order_item_id=order_item_id,
                requirements=[],
                has_shortage=False,
            )

        order_qty = Decimal(str(order_item.quantity))

        for item in bom.items:
            # Find matching StockItem by component name or create auto
            stock_res = await db.execute(select(StockItem).where(StockItem.name == item.component_name))
            stock_item = stock_res.scalar_one_or_none()

            if not stock_item:
                # Auto-create stock item to enable tracking
                stock_item = StockItem(
                    code=f"MAT-{item.component_name.upper().replace(' ', '-')[:20]}",
                    name=item.component_name,
                    unit=item.unit,
                    category="RAW_MATERIAL",
                )
                db.add(stock_item)
                await db.flush()

            gross_req = order_qty * Decimal(str(item.quantity_per_unit))
            wastage_qty = gross_req * (Decimal(str(item.wastage_percentage)) / Decimal("100.0"))
            total_req = gross_req + wastage_qty

            balance = await StockService.get_stock_balance(db, stock_item.id)

            if balance.available_stock >= total_req:
                reserve_qty = total_req
                shortage = Decimal("0.0")
            else:
                reserve_qty = balance.available_stock
                shortage = total_req - balance.available_stock
                has_shortage = True

            if auto_reserve and reserve_qty > Decimal("0.0"):
                res_record = StockReservation(
                    stock_item_id=stock_item.id,
                    order_id=order_id,
                    order_item_id=order_item_id,
                    reserved_quantity=reserve_qty,
                    status=ReservationStatus.PENDING,
                )
                db.add(res_record)

                # Record RESERVATION movement
                mov = StockMovement(
                    stock_item_id=stock_item.id,
                    movement_type=StockMovementType.RESERVATION,
                    quantity=reserve_qty,
                    order_id=order_id,
                    order_item_id=order_item_id,
                    reason=f"BOM Reservation for Order {order_id}",
                )
                db.add(mov)

            requirements.append(
                BOMRequirementItem(
                    stock_item_id=stock_item.id,
                    item_name=stock_item.name,
                    unit=stock_item.unit,
                    gross_requirement=gross_req,
                    wastage_quantity=wastage_qty,
                    total_requirement=total_req,
                    available_quantity=balance.available_stock,
                    reserved_quantity=reserve_qty,
                    shortage=shortage,
                )
            )

        await db.commit()

        return OrderBOMCalculationResponse(
            order_id=order_id,
            order_item_id=order_item_id,
            requirements=requirements,
            has_shortage=has_shortage,
        )

    @staticmethod
    async def get_lot_traceability(db: AsyncSession, lot_id: uuid.UUID) -> dict:
        lot = await db.scalar(
            select(StockLot)
            .options(selectinload(StockLot.item), selectinload(StockLot.location))
            .where(StockLot.id == lot_id)
        )
        if not lot:
            raise EntityNotFoundError("StockLot", str(lot_id))

        movements = (
            await db.scalars(
                select(StockMovement)
                .where(StockMovement.stock_item_id == lot.stock_item_id)
                .order_by(StockMovement.timestamp.desc())
            )
        ).all()

        movements_list = []
        for m in movements:
            movements_list.append({
                "id": str(m.id),
                "movement_type": m.movement_type.value,
                "quantity": float(m.quantity),
                "order_id": str(m.order_id) if m.order_id else None,
                "order_item_id": str(m.order_item_id) if m.order_item_id else None,
                "reason": m.reason,
                "timestamp": m.timestamp.isoformat() if m.timestamp else None,
            })

        return {
            "lot_id": str(lot.id),
            "lot_number": lot.lot_number,
            "stock_item_id": str(lot.stock_item_id),
            "stock_item_name": lot.item.name if lot.item else "Unknown",
            "stock_item_code": lot.item.code if lot.item else "Unknown",
            "location_name": lot.location.name if lot.location else "Unknown",
            "initial_quantity": float(lot.initial_quantity),
            "current_quantity": float(lot.current_quantity),
            "cost_per_unit": float(lot.cost_per_unit),
            "supplier_id": str(lot.supplier_id) if lot.supplier_id else None,
            "movements_history": movements_list,
        }

