import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from apps.api.app.capacity.models import AbsenceStatus


class AbsenceCreate(BaseModel):
    user_id: uuid.UUID
    start_date: date
    end_date: date
    reason: Optional[str] = None


class HandoverTaskItem(BaseModel):
    task_id: uuid.UUID
    task_code: str
    title: str
    current_assignee_id: uuid.UUID
    recommended_assignee_id: uuid.UUID
    recommended_assignee_name: str
    priority: str
    due_date: Optional[datetime] = None
    reason: str


class HandoverPlan(BaseModel):
    absence_id: uuid.UUID
    absent_user_id: uuid.UUID
    absent_user_name: str
    active_tasks_count: int
    tasks_to_handover: List[HandoverTaskItem]


class CapacityMetrics(BaseModel):
    resource_type: str
    resource_id: uuid.UUID
    resource_name: str
    total_capacity_hours: float
    allocated_hours: float
    available_hours: float
    utilization_percentage: float
    status: str  # NORMAL, HIGH, OVERLOADED


class PriorityExplanation(BaseModel):
    task_id: uuid.UUID
    calculated_priority: str
    score: float
    explanation: str
