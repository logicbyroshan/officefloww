import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class ProductCategoryBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryRead(ProductCategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class BOMItemBase(BaseModel):
    component_name: str
    quantity_per_unit: float
    unit: str
    wastage_percentage: float = 0.0
    is_mandatory: bool = True
    notes: Optional[str] = None


class BOMItemCreate(BOMItemBase):
    pass


class BOMItemRead(BOMItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bom_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class BillOfMaterialsBase(BaseModel):
    version: int = 1
    effective_date: date = date.today()
    is_active: bool = True
    notes: Optional[str] = None


class BillOfMaterialsCreate(BillOfMaterialsBase):
    items: List[BOMItemCreate] = []


class BillOfMaterialsRead(BillOfMaterialsBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    items: List[BOMItemRead] = []


class ProductBase(BaseModel):
    code: str
    name: str
    category_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    unit: str = "PCS"
    is_active: bool = True
    metadata_json: Optional[Dict[str, Any]] = None
    default_workflow_template_id: Optional[uuid.UUID] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    is_active: Optional[bool] = None
    metadata_json: Optional[Dict[str, Any]] = None
    default_workflow_template_id: Optional[uuid.UUID] = None


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    category: Optional[ProductCategoryRead] = None
    boms: List[BillOfMaterialsRead] = []
