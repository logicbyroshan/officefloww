import uuid
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.core.exceptions import (
    BusinessRuleViolationError,
    EntityNotFoundError,
)
from apps.api.app.products.models import Product, BillOfMaterials
from apps.api.app.stock.models import StockItem, StockLocation
from apps.api.app.stock.service import StockService
from apps.api.app.labour.models import LabourRate
from apps.api.app.production.models import Machine
from apps.api.app.orders.schemas import OrderCreate, OrderItemCreate
from apps.api.app.orders.service import OrderService
from apps.api.app.quotations.models import (
    PricingRule,
    PricingTier,
    Quotation,
    QuotationItem,
    QuotationStatus,
    QuotationVersion,
    CostCalculationRecord,
    FeasibilityStatus,
)
from apps.api.app.quotations.schemas import (
    PricingRuleCreate,
    QuotationCreate,
    CostCalculationRequest,
    CostCalculationBreakdown,
    QuotationFeasibilityReport,
)


class QuotationService:
    @staticmethod
    async def create_pricing_rule(db: AsyncSession, data: PricingRuleCreate) -> PricingRule:
        rule = PricingRule(
            product_id=data.product_id,
            name=data.name,
            description=data.description,
            is_active=True,
        )
        db.add(rule)
        await db.flush()

        for t in data.tiers:
            tier = PricingTier(
                pricing_rule_id=rule.id,
                min_quantity=t.min_quantity,
                max_quantity=t.max_quantity,
                base_unit_price=t.base_unit_price,
                discount_percentage=t.discount_percentage,
            )
            db.add(tier)

        await db.commit()
        await db.refresh(rule)
        return rule

    @staticmethod
    async def get_tier_unit_price(db: AsyncSession, product_id: uuid.UUID, quantity: int) -> Optional[Decimal]:
        query = (
            select(PricingRule)
            .options(selectinload(PricingRule.tiers))
            .where(PricingRule.product_id == product_id, PricingRule.is_active == True)
        )
        rule = await db.scalar(query)
        if not rule or not rule.tiers:
            return None

        # Find matching tier
        for tier in rule.tiers:
            if tier.min_quantity <= quantity:
                if tier.max_quantity is None or quantity <= tier.max_quantity:
                    # Apply discount
                    discount_factor = (Decimal("100.0") - tier.discount_percentage) / Decimal("100.0")
                    unit_price = tier.base_unit_price * discount_factor
                    return unit_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return None

    @staticmethod
    async def calculate_cost_and_margin(
        db: AsyncSession, request: CostCalculationRequest, quotation_id: Optional[uuid.UUID] = None
    ) -> CostCalculationBreakdown:
        product = await db.scalar(select(Product).where(Product.id == request.product_id))
        if not product:
            raise EntityNotFoundError("Product", str(request.product_id))

        # 1. Material & Wastage Cost from BOM
        bom = await db.scalar(
            select(BillOfMaterials)
            .options(selectinload(BillOfMaterials.items))
            .where(BillOfMaterials.product_id == product.id, BillOfMaterials.is_active == True)
        )

        material_cost = Decimal("0.0")
        wastage_cost = Decimal("0.0")
        details_list = []

        if bom and bom.items:
            for item in bom.items:
                # Find matching StockItem to get cost_price
                stk_item = await db.scalar(select(StockItem).where(StockItem.name.ilike(f"%{item.component_name}%")))
                unit_cost = stk_item.cost_price if stk_item else Decimal("2.0")

                item_qty = item.quantity * Decimal(str(request.quantity))
                item_material_cost = item_qty * unit_cost
                item_wastage_cost = item_material_cost * (item.wastage_percentage / Decimal("100.0"))

                material_cost += item_material_cost
                wastage_cost += item_wastage_cost
                details_list.append({
                    "component": item.component_name,
                    "unit_cost": float(unit_cost),
                    "material_cost": float(item_material_cost),
                    "wastage_cost": float(item_wastage_cost),
                })
        else:
            # Baseline material estimation
            material_cost = Decimal("15.0") * Decimal(str(request.quantity))
            wastage_cost = material_cost * Decimal("0.03")

        # 2. Labour Cost from piece rates
        labour_rate = await db.scalar(
            select(LabourRate).where(LabourRate.product_id == product.id, LabourRate.is_active == True)
        )
        rate_per_piece = labour_rate.rate_per_unit if labour_rate else Decimal("0.80")
        labour_cost = rate_per_piece * Decimal(str(request.quantity))

        # 3. Machine Cost (Assume ₹300/hr press rate, 500 units/hr throughput)
        machine_cost = (Decimal(str(request.quantity)) / Decimal("500.0")) * Decimal("300.0")

        # 4. Packing Cost (₹0.50 per unit)
        packing_cost = Decimal("0.50") * Decimal(str(request.quantity))

        # 5. Delivery Estimate
        delivery_cost = request.estimated_delivery_cost

        # Direct Production Subtotal
        direct_cost = material_cost + wastage_cost + labour_cost + machine_cost + packing_cost + delivery_cost

        # 6. Overhead Markup
        overhead_cost = direct_cost * (request.overhead_percentage / Decimal("100.0"))
        base_cost = direct_cost + overhead_cost

        # 7. Desired Margin
        margin_factor = Decimal("1.0") - (request.desired_margin_percentage / Decimal("100.0"))
        if margin_factor <= Decimal("0.0"):
            margin_factor = Decimal("0.75")
        
        selling_total = base_cost / margin_factor
        margin_amount = selling_total - base_cost
        suggested_unit_price = (selling_total / Decimal(str(request.quantity))).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        record = CostCalculationRecord(
            quotation_id=quotation_id,
            product_id=product.id,
            quantity=request.quantity,
            material_cost=material_cost.quantize(Decimal("0.01")),
            wastage_cost=wastage_cost.quantize(Decimal("0.01")),
            labour_cost=labour_cost.quantize(Decimal("0.01")),
            machine_cost=machine_cost.quantize(Decimal("0.01")),
            packing_cost=packing_cost.quantize(Decimal("0.01")),
            delivery_cost_estimate=delivery_cost.quantize(Decimal("0.01")),
            overhead_cost=overhead_cost.quantize(Decimal("0.01")),
            margin_amount=margin_amount.quantize(Decimal("0.01")),
            total_cost=selling_total.quantize(Decimal("0.01")),
            suggested_unit_price=suggested_unit_price,
            breakdown_json={"details": details_list},
        )
        db.add(record)
        await db.commit()

        return CostCalculationBreakdown(
            product_id=product.id,
            quantity=request.quantity,
            material_cost=material_cost.quantize(Decimal("0.01")),
            wastage_cost=wastage_cost.quantize(Decimal("0.01")),
            labour_cost=labour_cost.quantize(Decimal("0.01")),
            machine_cost=machine_cost.quantize(Decimal("0.01")),
            packing_cost=packing_cost.quantize(Decimal("0.01")),
            delivery_cost_estimate=delivery_cost.quantize(Decimal("0.01")),
            overhead_cost=overhead_cost.quantize(Decimal("0.01")),
            margin_amount=margin_amount.quantize(Decimal("0.01")),
            total_cost=selling_total.quantize(Decimal("0.01")),
            suggested_unit_price=suggested_unit_price,
            breakdown_details={"components": details_list},
        )

    @staticmethod
    async def create_quotation(
        db: AsyncSession, data: QuotationCreate, user_id: Optional[uuid.UUID] = None
    ) -> Quotation:
        q_code = f"QTN-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

        quotation = Quotation(
            quotation_number=q_code,
            client_id=data.client_id,
            status=QuotationStatus.DRAFT,
            current_version_number=1,
            valid_until=data.valid_until,
            notes=data.notes,
        )
        db.add(quotation)
        await db.flush()

        subtotal = Decimal("0.0")

        for item_data in data.items:
            unit_price = item_data.unit_price
            if unit_price is None or unit_price <= 0:
                # Auto-evaluate tier pricing
                tier_price = await QuotationService.get_tier_unit_price(
                    db, item_data.product_id, item_data.quantity
                )
                if tier_price:
                    unit_price = tier_price
                else:
                    # Fallback to cost calculation suggested price
                    cost_calc = await QuotationService.calculate_cost_and_margin(
                        db,
                        CostCalculationRequest(product_id=item_data.product_id, quantity=item_data.quantity),
                        quotation_id=quotation.id,
                    )
                    unit_price = cost_calc.suggested_unit_price

            item_subtotal = (unit_price * Decimal(str(item_data.quantity))).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            subtotal += item_subtotal

            q_item = QuotationItem(
                quotation_id=quotation.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=unit_price,
                subtotal=item_subtotal,
                specifications_json=item_data.specifications_json or {},
            )
            db.add(q_item)

        tax_amount = (subtotal * Decimal("0.18")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_amount = subtotal + tax_amount

        quotation.subtotal = subtotal
        quotation.tax_amount = tax_amount
        quotation.total_amount = total_amount

        # Create Version 1 snapshot
        version = QuotationVersion(
            quotation_id=quotation.id,
            version_number=1,
            snapshot_json={
                "subtotal": float(subtotal),
                "tax_amount": float(tax_amount),
                "total_amount": float(total_amount),
                "items_count": len(data.items),
            },
            created_by_id=user_id,
        )
        db.add(version)

        await db.commit()
        await db.refresh(quotation)
        return quotation

    @staticmethod
    async def evaluate_feasibility(
        db: AsyncSession, quotation_id: uuid.UUID
    ) -> QuotationFeasibilityReport:
        quotation = await db.scalar(
            select(Quotation).options(selectinload(Quotation.items)).where(Quotation.id == quotation_id)
        )
        if not quotation:
            raise EntityNotFoundError("Quotation", str(quotation_id))

        reasons = []
        recommendations = []
        missing_items = []
        stock_feasible = True
        total_prod_hours = 0.0

        for item in quotation.items:
            # Check BOM requirement
            bom = await db.scalar(
                select(BillOfMaterials)
                .options(selectinload(BillOfMaterials.items))
                .where(BillOfMaterials.product_id == item.product_id, BillOfMaterials.is_active == True)
            )
            if bom:
                for b_item in bom.items:
                    stk = await db.scalar(select(StockItem).where(StockItem.name.ilike(f"%{b_item.component_name}%")))
                    if stk:
                        balance = await StockService.calculate_stock_balance(db, stk.id)
                        req_qty = b_item.quantity * Decimal(str(item.quantity)) * (
                            Decimal("1.0") + b_item.wastage_percentage / Decimal("100.0")
                        )
                        if balance.available_stock < req_qty:
                            shortfall = req_qty - balance.available_stock
                            stock_feasible = False
                            missing_items.append({
                                "stock_item": stk.name,
                                "required": float(req_qty),
                                "available": float(balance.available_stock),
                                "shortfall": float(shortfall),
                            })
                            reasons.append(f"Shortage of {stk.name}: Deficit of {shortfall:,.0f} units.")
                            recommendations.append(f"Issue Purchase Order for {shortfall:,.0f} {stk.unit} of {stk.name}.")

            # Check production duration (500 units/hr)
            total_prod_hours += item.quantity / 500.0

        status = FeasibilityStatus.GREEN
        if not stock_feasible:
            status = FeasibilityStatus.RED
        elif total_prod_hours > 20.0:
            status = FeasibilityStatus.YELLOW
            reasons.append(f"Heavy production queue: Estimated {total_prod_hours:.1f} machine hours required.")

        return QuotationFeasibilityReport(
            quotation_id=quotation.id,
            status=status,
            stock_feasible=stock_feasible,
            machine_capacity_feasible=total_prod_hours <= 40.0,
            labour_capacity_feasible=True,
            estimated_production_hours=total_prod_hours,
            reasons=reasons,
            recommendations=recommendations,
            missing_stock_items=missing_items,
        )

    @staticmethod
    async def convert_to_order(
        db: AsyncSession, quotation_id: uuid.UUID, user_id: uuid.UUID
    ) -> uuid.UUID:
        quotation = await db.scalar(
            select(Quotation).options(selectinload(Quotation.items)).where(Quotation.id == quotation_id)
        )
        if not quotation:
            raise EntityNotFoundError("Quotation", str(quotation_id))
        if quotation.status == QuotationStatus.CONVERTED_TO_ORDER:
            raise BusinessRuleViolationError("Quotation has already been converted to an order.")

        order_data = OrderCreate(
            client_id=quotation.client_id,
            notes=f"Converted from Quotation {quotation.quotation_number}. {quotation.notes or ''}",
            items=[
                OrderItemCreate(
                    product_id=it.product_id,
                    quantity=it.quantity,
                    unit_price=float(it.unit_price),
                    specifications_json=it.specifications_json,
                )
                for it in quotation.items
            ],
        )

        order = await OrderService.create_order(db, order_data, user_id)
        quotation.status = QuotationStatus.CONVERTED_TO_ORDER
        quotation.converted_order_id = order.id
        await db.commit()
        return order.id
