import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from apps.api.app.files.models import FileApprovalStatus


class FileVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_id: uuid.UUID
    version_number: int
    storage_key: str
    checksum: str
    mime_type: str
    file_size: int
    uploaded_by_id: Optional[uuid.UUID] = None
    approval_state: FileApprovalStatus
    notes: Optional[str] = None
    created_at: datetime


class FileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    folder_id: Optional[uuid.UUID] = None
    order_id: Optional[uuid.UUID] = None
    order_item_id: Optional[uuid.UUID] = None
    workflow_step_id: Optional[uuid.UUID] = None
    task_id: Optional[uuid.UUID] = None
    filename: str
    logical_path: str
    current_version_number: int
    is_active: bool
    created_at: datetime
    versions: List[FileVersionRead] = []


class FileFolderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    name: str
    path: str
    files: List[FileRead] = []
