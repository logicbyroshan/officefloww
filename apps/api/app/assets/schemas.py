from datetime import datetime
from typing import Optional, List
import uuid
from pydantic import BaseModel, ConfigDict, Field

from apps.api.app.assets.models import AssetCondition


class AssetTypeBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    description: Optional[str] = None


class AssetTypeCreate(AssetTypeBase):
    pass


class AssetTypeRead(AssetTypeBase):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AssetBase(BaseModel):
    asset_code: str = Field(..., max_length=50)
    asset_type_id: uuid.UUID
    name: str = Field(..., max_length=100)
    serial_number: Optional[str] = None
    condition: AssetCondition = AssetCondition.GOOD
    location_id: Optional[uuid.UUID] = None
    is_active: bool = True


class AssetCreate(AssetBase):
    pass


class AssetAssignmentCreate(BaseModel):
    asset_id: uuid.UUID
    assigned_to_user_id: Optional[uuid.UUID] = None
    assigned_to_labourer_id: Optional[uuid.UUID] = None
    condition_on_issue: AssetCondition = AssetCondition.GOOD
    notes: Optional[str] = None


class AssetReturnRequest(BaseModel):
    condition_on_return: AssetCondition
    notes: Optional[str] = None


class AssetAssignmentRead(BaseModel):
    id: uuid.UUID
    asset_id: uuid.UUID
    assigned_to_user_id: Optional[uuid.UUID] = None
    assigned_to_labourer_id: Optional[uuid.UUID] = None
    condition_on_issue: AssetCondition
    issued_at: datetime
    returned_at: Optional[datetime] = None
    condition_on_return: Optional[AssetCondition] = None
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class AssetRead(AssetBase):
    id: uuid.UUID
    current_holder_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    assignments: List[AssetAssignmentRead] = []
    model_config = ConfigDict(from_attributes=True)
