import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict
from apps.api.app.quantities.models import QuantityTransactionType


class QuantityTransactionCreate(BaseModel):
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    transaction_type: QuantityTransactionType
    quantity: int
    batch_reference: Optional[str] = None
    reason: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None


class QuantityTransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    order_item_id: uuid.UUID
    transaction_type: QuantityTransactionType
    quantity: int
    batch_reference: Optional[str] = None
    actor_id: uuid.UUID
    timestamp: datetime
    reason: Optional[str] = None


class QuantitySummaryRead(BaseModel):
    order_item_id: str
    ordered: int
    produced: int
    completed: int
    rejected: int
    wasted: int
    defective: int
    packed: int
    dispatched: int
    net_good_units: int
    scrap_rate_percentage: float
    raw_breakdown: Dict[str, int]
