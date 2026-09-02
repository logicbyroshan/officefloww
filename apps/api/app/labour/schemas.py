from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from apps.api.app.labour.models import (
    LabourType,
    LabourAvailabilityStatus,
    LabourBatchStatus,
    DefectReason,
    LabourPaymentStatus,
)


class LabourerBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    phone: str = Field(..., max_length=50)
    email: Optional[str] = None
    labour_type: LabourType = LabourType.OUTSIDE_CONTRACT
    notes: Optional[str] = None
    is_active: bool = True


class LabourerCreate(LabourerBase):
    pass


class LabourerRead(LabourerBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LabourRateCreate(BaseModel):
    product_id: Optional[uuid.UUID] = None
    operation_name: str = Field(..., max_length=100)
    rate_per_unit: Decimal
    effective_date: Optional[date] = None


class LabourRateRead(BaseModel):
    id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    operation_name: str
    rate_per_unit: Decimal
    effective_date: date
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LabourBatchCreate(BaseModel):
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    labourer_id: uuid.UUID
    operation_name: str
    allocated_quantity: Decimal
    rate_per_unit: Optional[Decimal] = None
    due_date: Optional[date] = None
    batch_code: Optional[str] = None


class LabourSubmissionCreate(BaseModel):
    labour_batch_id: uuid.UUID
    completed_quantity: Decimal
    defective_quantity: Decimal = Decimal("0.0")
    unused_quantity: Decimal = Decimal("0.0")
    returned_quantity: Decimal = Decimal("0.0")
    defect_reason: DefectReason = DefectReason.UNKNOWN
    evidence_file_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class LabourSubmissionRead(BaseModel):
    id: uuid.UUID
    labour_batch_id: uuid.UUID
    completed_quantity: Decimal
    defective_quantity: Decimal
    unused_quantity: Decimal
    returned_quantity: Decimal
    defect_reason: DefectReason
    evidence_file_id: Optional[uuid.UUID] = None
    submitted_at: datetime
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class LabourBatchRead(BaseModel):
    id: uuid.UUID
    batch_code: str
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    labourer_id: uuid.UUID
    operation_name: str
    allocated_quantity: Decimal
    completed_quantity: Decimal
    defective_quantity: Decimal
    rate_per_unit: Decimal
    status: LabourBatchStatus
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    submissions: List[LabourSubmissionRead] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LabourMaterialBalanceRead(BaseModel):
    labourer_id: uuid.UUID
    stock_item_id: uuid.UUID
    item_name: str
    unit: str
    current_balance: Decimal


class LabourMaterialIssueRequest(BaseModel):
    labourer_id: uuid.UUID
    stock_item_id: uuid.UUID
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    required_quantity: Decimal
    notes: Optional[str] = None


class LabourMaterialIssueResponse(BaseModel):
    labourer_id: uuid.UUID
    stock_item_id: uuid.UUID
    required_quantity: Decimal
    existing_balance_used: Decimal
    newly_issued_quantity: Decimal
    updated_labour_balance: Decimal


class LabourTransferRequest(BaseModel):
    from_labourer_id: uuid.UUID
    to_labourer_id: uuid.UUID
    stock_item_id: uuid.UUID
    quantity: Decimal
    notes: Optional[str] = None


class LabourPaymentLedgerRead(BaseModel):
    id: uuid.UUID
    labour_batch_id: uuid.UUID
    accepted_quantity: Decimal
    rate_per_unit: Decimal
    amount: Decimal
    model_config = ConfigDict(from_attributes=True)


class LabourPaymentRead(BaseModel):
    id: uuid.UUID
    payment_number: str
    labourer_id: uuid.UUID
    total_accepted_quantity: Decimal
    total_payable_amount: Decimal
    status: LabourPaymentStatus
    payment_reference: Optional[str] = None
    paid_at: Optional[datetime] = None
    ledger_entries: List[LabourPaymentLedgerRead] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LabourPerformanceRead(BaseModel):
    labourer_id: uuid.UUID
    total_assigned_units: Decimal
    total_completed_units: Decimal
    total_defective_units: Decimal
    on_time_batches: int
    late_batches: int
    productivity_score: Decimal
    quality_score: Decimal
    on_time_percentage: Decimal
    reliability_score: Decimal
    model_config = ConfigDict(from_attributes=True)
