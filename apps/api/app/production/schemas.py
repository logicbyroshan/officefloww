from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from apps.api.app.production.models import MachineStatus, ProductionBatchStatus


class MachineBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    machine_type: str = "DIGITAL_PRESS"
    status: MachineStatus = MachineStatus.IDLE
    location_id: Optional[uuid.UUID] = None
    is_active: bool = True


class MachineCreate(MachineBase):
    pass


class MachineRead(MachineBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProductionBatchCreate(BaseModel):
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    product_id: uuid.UUID
    machine_id: uuid.UUID
    operator_id: uuid.UUID
    approved_file_version_id: uuid.UUID
    material_lot_id: Optional[uuid.UUID] = None
    input_quantity: Decimal
    batch_number: Optional[str] = None
    notes: Optional[str] = None


class ProductionBatchRead(BaseModel):
    id: uuid.UUID
    batch_number: str
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    product_id: uuid.UUID
    machine_id: uuid.UUID
    operator_id: uuid.UUID
    approved_file_version_id: uuid.UUID
    material_lot_id: Optional[uuid.UUID] = None
    status: ProductionBatchStatus
    input_quantity: Decimal
    output_quantity: Decimal
    reject_quantity: Decimal
    waste_quantity: Decimal
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProductionRecordCreate(BaseModel):
    production_batch_id: uuid.UUID
    good_quantity: Decimal
    reject_quantity: Decimal = Decimal("0.0")
    waste_quantity: Decimal = Decimal("0.0")
    operator_notes: Optional[str] = None


class ProductionRecordRead(BaseModel):
    id: uuid.UUID
    production_batch_id: uuid.UUID
    operator_id: uuid.UUID
    good_quantity: Decimal
    reject_quantity: Decimal
    waste_quantity: Decimal
    operator_notes: Optional[str] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


class BatchAllocationItem(BaseModel):
    batch_id: uuid.UUID
    batch_number: str
    allocated_quantity: Decimal
    status: ProductionBatchStatus


class QuantityReconciliationReport(BaseModel):
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    target_quantity: Decimal
    total_allocated: Decimal
    unallocated_quantity: Decimal
    is_valid: bool
    is_over_allocated: bool
    batches: List[BatchAllocationItem]
