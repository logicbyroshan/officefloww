from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from apps.api.app.dispatch.models import TransportType, DeliveryStatus, ReimbursementStatus


class TransportProviderBase(BaseModel):
    name: str = Field(..., max_length=100)
    code: str = Field(..., max_length=50)
    provider_type: TransportType = TransportType.BUS
    contact_phone: Optional[str] = None
    account_number: Optional[str] = None
    is_active: bool = True


class TransportProviderCreate(TransportProviderBase):
    pass


class TransportProviderRead(TransportProviderBase):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DeliveryCreate(BaseModel):
    order_id: uuid.UUID
    transport_type: TransportType = TransportType.BUS
    destination_address: str
    destination_city: str
    total_packages: int = 1
    total_weight_kg: Decimal = Decimal("0.0")
    delivery_partner_id: Optional[uuid.UUID] = None
    transport_provider_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class DeliveryBookingCreate(BaseModel):
    delivery_id: uuid.UUID
    booking_reference: str
    charge_amount: Decimal = Decimal("0.0")
    paid_by_id: Optional[uuid.UUID] = None
    receipt_file_id: Optional[uuid.UUID] = None


class DeliveryExpenseCreate(BaseModel):
    delivery_id: uuid.UUID
    order_id: uuid.UUID
    amount: Decimal
    expense_type: str = "BUS_CHARGE"
    receipt_file_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class DeliveryExpenseRead(BaseModel):
    id: uuid.UUID
    delivery_id: uuid.UUID
    order_id: uuid.UUID
    paid_by_id: uuid.UUID
    amount: Decimal
    expense_type: str
    receipt_file_id: Optional[uuid.UUID] = None
    reimbursement_status: ReimbursementStatus
    approved_by_id: Optional[uuid.UUID] = None
    reimbursed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DeliveryExceptionCreate(BaseModel):
    delivery_id: uuid.UUID
    expected_value: str
    actual_value: str
    reason: Optional[str] = None
    evidence_file_id: Optional[uuid.UUID] = None


class DeliveryExceptionRead(BaseModel):
    id: uuid.UUID
    delivery_id: uuid.UUID
    expected_value: str
    actual_value: str
    reason: Optional[str] = None
    recorded_by_id: uuid.UUID
    evidence_file_id: Optional[uuid.UUID] = None
    is_resolved: bool
    resolution_notes: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DeliveryRead(BaseModel):
    id: uuid.UUID
    delivery_number: str
    order_id: uuid.UUID
    transport_type: TransportType
    destination_address: str
    destination_city: str
    total_packages: int
    total_weight_kg: Decimal
    status: DeliveryStatus
    delivery_partner_id: Optional[uuid.UUID] = None
    transport_provider_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    expenses: List[DeliveryExpenseRead] = []
    exceptions: List[DeliveryExceptionRead] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
