import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from apps.api.app.users.models import UserRole
from apps.api.app.tasks.models import TaskPriority, TaskStatus


class TaskCommentBase(BaseModel):
    message: str


class TaskCommentCreate(TaskCommentBase):
    pass


class TaskCommentRead(TaskCommentBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime


class TaskBlockerCreate(BaseModel):
    reason: str


class TaskBlockerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    reason: str
    blocked_by_user_id: Optional[uuid.UUID] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by_user_id: Optional[uuid.UUID] = None


class TaskBase(BaseModel):
    task_code: str
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    workflow_instance_id: uuid.UUID
    workflow_step_instance_id: uuid.UUID
    assigned_user_id: Optional[uuid.UUID] = None
    assigned_role: Optional[UserRole] = None
    priority: TaskPriority = TaskPriority.NORMAL
    priority_score: float = 1.0
    status: TaskStatus = TaskStatus.READY
    due_date: Optional[datetime] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    assigned_user_id: Optional[uuid.UUID] = None
    assigned_role: Optional[UserRole] = None
    priority: Optional[TaskPriority] = None
    priority_score: Optional[float] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None


class TaskCompleteRequest(BaseModel):
    notes: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None


class TaskRead(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by_id: Optional[uuid.UUID] = None
    completed_by_id: Optional[uuid.UUID] = None
    blockers: List[TaskBlockerRead] = []
    comments: List[TaskCommentRead] = []
