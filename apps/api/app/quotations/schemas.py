import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from apps.api.app.quotations.models import QuotationStatus, FeasibilityStatus


class PricingTierCreate(BaseModel):
    min_quantity: int = Field(..., ge=1)
    max_quantity: Optional[int] = None
    base_unit_price: Decimal = Field(..., gt=0)
    discount_percentage: Decimal = Field(default=Decimal("0.0"), ge=0, le=100)


class PricingTierRead(PricingTierCreate):
    id: uuid.UUID
    pricing_rule_id: uuid.UUID

    class Config:
        from_attributes = True


class PricingRuleCreate(BaseModel):
    product_id: uuid.UUID
    name: str
    description: Optional[str] = None
    tiers: List[PricingTierCreate] = []


class PricingRuleRead(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    name: str
    description: Optional[str] = None
    is_active: bool
    tiers: List[PricingTierRead] = []

    class Config:
        from_attributes = True


class QuotationItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    unit_price: Optional[Decimal] = None  # Auto-calculated from tiers if None
    specifications_json: Optional[Dict[str, Any]] = None


class QuotationItemRead(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    specifications_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class QuotationCreate(BaseModel):
    client_id: uuid.UUID
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[QuotationItemCreate]


class QuotationRead(BaseModel):
    id: uuid.UUID
    quotation_number: str
    client_id: uuid.UUID
    status: QuotationStatus
    current_version_number: int
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    converted_order_id: Optional[uuid.UUID] = None
    items: List[QuotationItemRead] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CostCalculationRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    desired_margin_percentage: Decimal = Field(default=Decimal("25.0"), ge=0, le=100)
    overhead_percentage: Decimal = Field(default=Decimal("10.0"), ge=0, le=100)
    estimated_delivery_cost: Decimal = Field(default=Decimal("500.0"), ge=0)


class CostCalculationBreakdown(BaseModel):
    product_id: uuid.UUID
    quantity: int
    material_cost: Decimal
    wastage_cost: Decimal
    labour_cost: Decimal
    machine_cost: Decimal
    packing_cost: Decimal
    delivery_cost_estimate: Decimal
    overhead_cost: Decimal
    margin_amount: Decimal
    total_cost: Decimal
    suggested_unit_price: Decimal
    breakdown_details: Dict[str, Any] = {}


class QuotationFeasibilityReport(BaseModel):
    quotation_id: Optional[uuid.UUID] = None
    status: FeasibilityStatus  # GREEN, YELLOW, RED
    stock_feasible: bool
    machine_capacity_feasible: bool
    labour_capacity_feasible: bool
    estimated_production_hours: float
    reasons: List[str]
    recommendations: List[str]
    missing_stock_items: List[Dict[str, Any]] = []
