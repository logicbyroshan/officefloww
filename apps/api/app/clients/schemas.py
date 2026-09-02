import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class ClientContactBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    designation: Optional[str] = None
    is_primary: bool = False
    is_active: bool = True


class ClientContactCreate(ClientContactBase):
    pass


class ClientContactRead(ClientContactBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    client_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ClientBase(BaseModel):
    client_code: str
    organization_name: str
    is_active: bool = True
    notes: Optional[str] = None
    billing_address: Optional[str] = None
    delivery_address: Optional[str] = None
    tax_identifier: Optional[str] = None


class ClientCreate(ClientBase):
    contacts: Optional[List[ClientContactCreate]] = None


class ClientUpdate(BaseModel):
    organization_name: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    billing_address: Optional[str] = None
    delivery_address: Optional[str] = None
    tax_identifier: Optional[str] = None


class ClientRead(ClientBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    contacts: List[ClientContactRead] = []
