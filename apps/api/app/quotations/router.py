import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.dependencies import require_permission, get_current_user
from apps.api.app.users.models import User
from apps.api.app.quotations.schemas import (
    PricingRuleCreate,
    PricingRuleRead,
    QuotationCreate,
    QuotationRead,
    CostCalculationRequest,
    CostCalculationBreakdown,
    QuotationFeasibilityReport,
)
from apps.api.app.quotations.service import QuotationService

router = APIRouter(prefix="/quotations", tags=["Quotations & Costing"])


@router.post("/pricing-rules", response_model=SuccessResponse[PricingRuleRead], status_code=status.HTTP_201_CREATED)
async def create_pricing_rule(
    data: PricingRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("products:write")),
):
    rule = await QuotationService.create_pricing_rule(db, data)
    return SuccessResponse(data=PricingRuleRead.model_validate(rule))


@router.post("/calculate-cost", response_model=SuccessResponse[CostCalculationBreakdown])
async def calculate_cost(
    data: CostCalculationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    breakdown = await QuotationService.calculate_cost_and_margin(db, data)
    return SuccessResponse(data=breakdown)


@router.post("", response_model=SuccessResponse[QuotationRead], status_code=status.HTTP_201_CREATED)
async def create_quotation(
    data: QuotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    quote = await QuotationService.create_quotation(db, data, current_user.id)
    return SuccessResponse(data=QuotationRead.model_validate(quote))


@router.get("/{id}/feasibility", response_model=SuccessResponse[QuotationFeasibilityReport])
async def check_feasibility(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    report = await QuotationService.evaluate_feasibility(db, id)
    return SuccessResponse(data=report)


@router.post("/{id}/convert-to-order", response_model=SuccessResponse[dict])
async def convert_quotation_to_order(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    order_id = await QuotationService.convert_to_order(db, id, current_user.id)
    return SuccessResponse(data={"order_id": str(order_id), "message": "Quotation converted to Order successfully."})
