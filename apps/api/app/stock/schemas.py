from datetime import datetime, date
from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from apps.api.app.stock.models import StockLocationType, StockMovementType, ReservationStatus


class StockLocationBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    location_type: StockLocationType = StockLocationType.MAIN_STORE
    description: Optional[str] = None
    is_active: bool = True


class StockLocationCreate(StockLocationBase):
    pass


class StockLocationRead(StockLocationBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class StockItemBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    category: str = "RAW_MATERIAL"
    unit: str = "PCS"
    min_stock_level: Decimal = Decimal("0.0")
    cost_price: Decimal = Decimal("0.0")
    is_active: bool = True


class StockItemCreate(StockItemBase):
    pass


class StockItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    min_stock_level: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    is_active: Optional[bool] = None


class StockItemRead(StockItemBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class StockLotCreate(BaseModel):
    stock_item_id: uuid.UUID
    location_id: uuid.UUID
    lot_number: str
    quantity: Decimal
    cost_per_unit: Decimal = Decimal("0.0")
    supplier_id: Optional[uuid.UUID] = None
    expiry_date: Optional[date] = None


class StockLotRead(BaseModel):
    id: uuid.UUID
    stock_item_id: uuid.UUID
    location_id: uuid.UUID
    lot_number: str
    initial_quantity: Decimal
    current_quantity: Decimal
    cost_per_unit: Decimal
    supplier_id: Optional[uuid.UUID] = None
    expiry_date: Optional[date] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class StockMovementCreate(BaseModel):
    stock_item_id: uuid.UUID
    lot_id: Optional[uuid.UUID] = None
    movement_type: StockMovementType
    quantity: Decimal
    from_location_id: Optional[uuid.UUID] = None
    to_location_id: Optional[uuid.UUID] = None
    order_id: Optional[uuid.UUID] = None
    order_item_id: Optional[uuid.UUID] = None
    reason: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None


class StockMovementRead(BaseModel):
    id: uuid.UUID
    stock_item_id: uuid.UUID
    lot_id: Optional[uuid.UUID] = None
    movement_type: StockMovementType
    quantity: Decimal
    from_location_id: Optional[uuid.UUID] = None
    to_location_id: Optional[uuid.UUID] = None
    order_id: Optional[uuid.UUID] = None
    order_item_id: Optional[uuid.UUID] = None
    actor_id: Optional[uuid.UUID] = None
    reason: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


class StockBalanceRead(BaseModel):
    item_id: uuid.UUID
    item_code: str
    item_name: str
    unit: str
    physical_stock: Decimal
    reserved_stock: Decimal
    available_stock: Decimal


class BOMRequirementItem(BaseModel):
    stock_item_id: uuid.UUID
    item_name: str
    unit: str
    gross_requirement: Decimal
    wastage_quantity: Decimal
    total_requirement: Decimal
    available_quantity: Decimal
    reserved_quantity: Decimal
    shortage: Decimal


class OrderBOMCalculationResponse(BaseModel):
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    requirements: List[BOMRequirementItem]
    has_shortage: bool
