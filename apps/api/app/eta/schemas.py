import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ETACalculationResponse(BaseModel):
    order_id: uuid.UUID
    estimated_delivery_date: datetime
    critical_path_hours: float
    confidence_level: str  # HIGH, MEDIUM, LOW
    factors: List[str]
    breakdown: Dict[str, float]


class ETAHistoryRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    estimated_delivery_date: datetime
    critical_path_hours: Decimal
    trigger_reason: str
    details_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
