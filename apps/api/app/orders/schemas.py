import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from apps.api.app.orders.models import OrderStatus, OrderPriority, OrderItemStatus


class OrderItemBase(BaseModel):
    product_id: uuid.UUID
    quantity: int
    unit_price: float = 0.0
    specifications_json: Optional[Dict[str, Any]] = None


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemRead(OrderItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    status: OrderItemStatus
    workflow_instance_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime


class OrderBase(BaseModel):
    client_id: uuid.UUID
    priority: OrderPriority = OrderPriority.NORMAL
    promised_delivery_date: Optional[datetime] = None
    billing_address: Optional[str] = None
    delivery_address: Optional[str] = None
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    order_number: Optional[str] = None
    items: List[OrderItemCreate] = []


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    priority: Optional[OrderPriority] = None
    promised_delivery_date: Optional[datetime] = None
    billing_address: Optional[str] = None
    delivery_address: Optional[str] = None
    notes: Optional[str] = None


class OrderRead(OrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_number: str
    status: OrderStatus
    total_amount: float
    created_by_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemRead] = []
