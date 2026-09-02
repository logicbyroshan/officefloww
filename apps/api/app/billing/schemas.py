from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from apps.api.app.billing.models import InvoiceStatus, PaymentMethod, ClientLedgerType


class InvoiceItemCreate(BaseModel):
    order_item_id: Optional[uuid.UUID] = None
    description: str = Field(..., max_length=255)
    quantity: Decimal
    unit_price: Decimal
    tax_rate: Decimal = Decimal("18.00")


class InvoiceItemRead(BaseModel):
    id: uuid.UUID
    order_item_id: Optional[uuid.UUID] = None
    description: str
    quantity: Decimal
    unit_price: Decimal
    tax_rate: Decimal
    amount: Decimal
    model_config = ConfigDict(from_attributes=True)


class InvoiceCreate(BaseModel):
    order_id: uuid.UUID
    client_id: uuid.UUID
    due_date: Optional[date] = None
    notes: Optional[str] = None
    items: List[InvoiceItemCreate]


class PaymentCreate(BaseModel):
    invoice_id: uuid.UUID
    amount: Decimal
    payment_method: PaymentMethod = PaymentMethod.BANK_TRANSFER
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentRead(BaseModel):
    id: uuid.UUID
    payment_number: str
    invoice_id: uuid.UUID
    client_id: uuid.UUID
    amount: Decimal
    payment_date: date
    payment_method: PaymentMethod
    reference_number: Optional[str] = None
    received_by_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class InvoiceRead(BaseModel):
    id: uuid.UUID
    invoice_number: str
    order_id: uuid.UUID
    client_id: uuid.UUID
    status: InvoiceStatus
    issue_date: date
    due_date: Optional[date] = None
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    notes: Optional[str] = None
    items: List[InvoiceItemRead] = []
    payments: List[PaymentRead] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ClientLedgerRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    transaction_type: ClientLedgerType
    amount: Decimal
    balance_after: Decimal
    reference_id: Optional[uuid.UUID] = None
    timestamp: datetime
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class OrderCompletionCheckResponse(BaseModel):
    order_id: uuid.UUID
    can_complete: bool
    reasons: List[str]
    workflows_completed: bool
    quantities_reconciled: bool
    packing_completed: bool
