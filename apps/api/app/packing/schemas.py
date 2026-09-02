from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from apps.api.app.packing.models import PackageType, PackingStatus


class PackageCreate(BaseModel):
    package_type: PackageType = PackageType.BOX
    quantity: Decimal
    weight_kg: Decimal = Decimal("0.0")
    dimensions: Optional[str] = None
    label_text: Optional[str] = None
    package_number: Optional[str] = None


class PackageRead(BaseModel):
    id: uuid.UUID
    package_number: str
    packing_task_id: uuid.UUID
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    package_type: PackageType
    quantity: Decimal
    weight_kg: Decimal
    dimensions: Optional[str] = None
    label_text: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PackingTaskCreate(BaseModel):
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    target_quantity: Decimal
    notes: Optional[str] = None


class PackingRecordCreate(BaseModel):
    packing_task_id: uuid.UUID
    verified_quantity: Decimal
    verifier_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class PackingRecordRead(BaseModel):
    id: uuid.UUID
    packing_task_id: uuid.UUID
    packer_id: uuid.UUID
    verifier_id: Optional[uuid.UUID] = None
    verified_quantity: Decimal
    timestamp: datetime
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class PackingTaskRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    task_id: Optional[uuid.UUID] = None
    target_quantity: Decimal
    packed_quantity: Decimal
    status: PackingStatus
    notes: Optional[str] = None
    packages: List[PackageRead] = []
    records: List[PackingRecordRead] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
