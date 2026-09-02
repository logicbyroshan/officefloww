from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from apps.api.app.purchasing.models import POStatus, GRNStatus


class SupplierContactBase(BaseModel):
    name: str = Field(..., max_length=100)
    phone: Optional[str] = None
    email: Optional[str] = None
    designation: Optional[str] = None
    is_primary: bool = False


class SupplierContactCreate(SupplierContactBase):
    pass


class SupplierContactRead(SupplierContactBase):
    id: uuid.UUID
    supplier_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SupplierBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tax_identifier: Optional[str] = None
    billing_address: Optional[str] = None
    is_active: bool = True


class SupplierCreate(SupplierBase):
    contacts: Optional[List[SupplierContactCreate]] = None


class SupplierRead(SupplierBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    contacts: List[SupplierContactRead] = []
    model_config = ConfigDict(from_attributes=True)


class SupplierProductCreate(BaseModel):
    supplier_id: uuid.UUID
    stock_item_id: uuid.UUID
    supplier_part_number: Optional[str] = None
    standard_price: Decimal
    lead_time_days: int = 3


class SupplierProductRead(BaseModel):
    id: uuid.UUID
    supplier_id: uuid.UUID
    stock_item_id: uuid.UUID
    supplier_part_number: Optional[str] = None
    standard_price: Decimal
    lead_time_days: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SupplierPriceHistoryRead(BaseModel):
    id: uuid.UUID
    supplier_id: uuid.UUID
    stock_item_id: uuid.UUID
    unit_price: Decimal
    quantity: Decimal
    tax_amount: Decimal
    transport_charge: Decimal
    landed_cost_per_unit: Decimal
    previous_price: Optional[Decimal] = None
    absolute_increase: Optional[Decimal] = None
    percentage_increase: Optional[Decimal] = None
    purchase_date: date
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PriceTrendsRead(BaseModel):
    stock_item_id: uuid.UUID
    current_price: Decimal
    previous_price: Optional[Decimal] = None
    absolute_increase: Optional[Decimal] = None
    percentage_increase: Optional[Decimal] = None
    recent_average_price: Decimal


class PurchaseOrderItemCreate(BaseModel):
    stock_item_id: uuid.UUID
    quantity: Decimal
    unit_price: Decimal


class PurchaseOrderItemRead(BaseModel):
    id: uuid.UUID
    stock_item_id: uuid.UUID
    quantity: Decimal
    unit_price: Decimal
    received_quantity: Decimal
    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderCreate(BaseModel):
    supplier_id: uuid.UUID
    po_number: Optional[str] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate]


class PurchaseOrderRead(BaseModel):
    id: uuid.UUID
    po_number: str
    supplier_id: uuid.UUID
    status: POStatus
    total_amount: Decimal
    created_by_id: Optional[uuid.UUID] = None
    approved_by_id: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItemRead] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class GoodsReceiptItemCreate(BaseModel):
    purchase_order_item_id: uuid.UUID
    stock_item_id: uuid.UUID
    received_quantity: Decimal
    accepted_quantity: Decimal
    rejected_quantity: Decimal = Decimal("0.0")
    unit_cost: Decimal
    lot_number: Optional[str] = None


class GoodsReceiptItemRead(BaseModel):
    id: uuid.UUID
    purchase_order_item_id: uuid.UUID
    stock_item_id: uuid.UUID
    received_quantity: Decimal
    accepted_quantity: Decimal
    rejected_quantity: Decimal
    unit_cost: Decimal
    lot_number: str
    model_config = ConfigDict(from_attributes=True)


class GoodsReceiptCreate(BaseModel):
    purchase_order_id: uuid.UUID
    grn_number: Optional[str] = None
    notes: Optional[str] = None
    items: List[GoodsReceiptItemCreate]


class GoodsReceiptRead(BaseModel):
    id: uuid.UUID
    grn_number: str
    purchase_order_id: uuid.UUID
    supplier_id: uuid.UUID
    received_by_id: Optional[uuid.UUID] = None
    status: GRNStatus
    notes: Optional[str] = None
    items: List[GoodsReceiptItemRead] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
