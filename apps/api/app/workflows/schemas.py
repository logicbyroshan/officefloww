import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from apps.api.app.users.models import UserRole
from apps.api.app.workflows.models import StepType, StepStatus, WorkflowStatus


class WorkflowStepTemplateBase(BaseModel):
    name: str
    step_type: StepType
    sequence_order: int
    required_role: Optional[UserRole] = None
    is_optional: bool = False
    instructions: Optional[str] = None
    estimated_duration_minutes: int = 60
    sla_hours: Optional[int] = 24
    required_files_json: Optional[List[str]] = None
    required_inputs_json: Optional[Dict[str, Any]] = None
    completion_rules_json: Optional[Dict[str, Any]] = None
    metadata_json: Optional[Dict[str, Any]] = None


class WorkflowStepTemplateCreate(WorkflowStepTemplateBase):
    depends_on_indices: List[int] = []  # indices of steps in the template this step depends on


class WorkflowStepTemplateRead(WorkflowStepTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    template_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class WorkflowTemplateBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool = True


class WorkflowTemplateCreate(WorkflowTemplateBase):
    steps: List[WorkflowStepTemplateCreate] = []


class WorkflowTemplateRead(WorkflowTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    step_templates: List[WorkflowStepTemplateRead] = []


class WorkflowStepInstanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workflow_instance_id: uuid.UUID
    step_template_id: Optional[uuid.UUID] = None
    step_type: StepType
    name: str
    sequence_order: int
    status: StepStatus
    required_role: Optional[UserRole] = None
    assigned_user_id: Optional[uuid.UUID] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None


class WorkflowInstanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_item_id: uuid.UUID
    template_id: uuid.UUID
    status: WorkflowStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    step_instances: List[WorkflowStepInstanceRead] = []
