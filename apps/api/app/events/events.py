from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional
import uuid


@dataclass
class DomainEvent:
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class OrderConfirmed(DomainEvent):
    order_id: uuid.UUID = field(default_factory=uuid.uuid4)
    client_id: uuid.UUID = field(default_factory=uuid.uuid4)
    total_amount: Decimal = Decimal("0.0")


@dataclass
class StockReserved(DomainEvent):
    stock_item_id: uuid.UUID = field(default_factory=uuid.uuid4)
    order_id: uuid.UUID = field(default_factory=uuid.uuid4)
    reserved_quantity: Decimal = Decimal("0.0")


@dataclass
class StockShortageDetected(DomainEvent):
    stock_item_id: uuid.UUID = field(default_factory=uuid.uuid4)
    order_id: uuid.UUID = field(default_factory=uuid.uuid4)
    shortage_quantity: Decimal = Decimal("0.0")


@dataclass
class ProductionStarted(DomainEvent):
    batch_id: uuid.UUID = field(default_factory=uuid.uuid4)
    order_id: uuid.UUID = field(default_factory=uuid.uuid4)
    machine_id: uuid.UUID = field(default_factory=uuid.uuid4)
    operator_id: uuid.UUID = field(default_factory=uuid.uuid4)


@dataclass
class ProductionCompleted(DomainEvent):
    batch_id: uuid.UUID = field(default_factory=uuid.uuid4)
    order_id: uuid.UUID = field(default_factory=uuid.uuid4)
    good_quantity: Decimal = Decimal("0.0")
    reject_quantity: Decimal = Decimal("0.0")


@dataclass
class FittingCreated(DomainEvent):
    order_id: uuid.UUID = field(default_factory=uuid.uuid4)
    quantity: Decimal = Decimal("0.0")


@dataclass
class LabourAssigned(DomainEvent):
    labour_batch_id: uuid.UUID = field(default_factory=uuid.uuid4)
    labourer_id: uuid.UUID = field(default_factory=uuid.uuid4)
    allocated_quantity: Decimal = Decimal("0.0")


@dataclass
class LabourSubmitted(DomainEvent):
    labour_batch_id: uuid.UUID = field(default_factory=uuid.uuid4)
    labourer_id: uuid.UUID = field(default_factory=uuid.uuid4)
    completed_quantity: Decimal = Decimal("0.0")
    defective_quantity: Decimal = Decimal("0.0")


@dataclass
class PackingCompleted(DomainEvent):
    packing_task_id: uuid.UUID = field(default_factory=uuid.uuid4)
    order_id: uuid.UUID = field(default_factory=uuid.uuid4)
    packed_quantity: Decimal = Decimal("0.0")


@dataclass
class DispatchBooked(DomainEvent):
    delivery_id: uuid.UUID = field(default_factory=uuid.uuid4)
    order_id: uuid.UUID = field(default_factory=uuid.uuid4)
    booking_reference: str = ""
    charge_amount: Decimal = Decimal("0.0")


@dataclass
class DispatchCompleted(DomainEvent):
    delivery_id: uuid.UUID = field(default_factory=uuid.uuid4)
    order_id: uuid.UUID = field(default_factory=uuid.uuid4)


@dataclass
class InvoiceGenerated(DomainEvent):
    invoice_id: uuid.UUID = field(default_factory=uuid.uuid4)
    order_id: uuid.UUID = field(default_factory=uuid.uuid4)
    total_amount: Decimal = Decimal("0.0")


@dataclass
class PaymentReceived(DomainEvent):
    payment_id: uuid.UUID = field(default_factory=uuid.uuid4)
    invoice_id: uuid.UUID = field(default_factory=uuid.uuid4)
    amount: Decimal = Decimal("0.0")
