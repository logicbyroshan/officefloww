from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ExecutiveDashboardSummary(BaseModel):
    total_orders_count: int
    active_production_orders: int
    completed_orders_count: int
    total_revenue_inr: float
    total_outstanding_inr: float
    avg_scrap_rate_percentage: float
    top_selling_products: List[Dict[str, Any]]
    contractor_quality_ranking: List[Dict[str, Any]]


class ResponsibilityAuditItem(BaseModel):
    operation_name: str
    order_number: Optional[str] = None
    actor_name: str
    actor_role: str
    timestamp: str
    verified_evidence: Dict[str, Any]
