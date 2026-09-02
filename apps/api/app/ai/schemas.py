from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class AIQueryRequest(BaseModel):
    query: str


class AIQueryResponse(BaseModel):
    query: str
    intent_detected: str
    answer: str
    data_evidence: Dict[str, Any]
    recommendations: List[str] = []


class DailyBriefingResponse(BaseModel):
    date: str
    summary: str
    orders_at_risk: List[Dict[str, Any]]
    low_stock_alerts: List[Dict[str, Any]]
    overloaded_employees: List[Dict[str, Any]]
    pending_receivables_inr: float
    action_items: List[str]
