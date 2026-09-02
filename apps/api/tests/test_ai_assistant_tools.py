import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_management_ai_queries_and_daily_briefing(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Query AI Assistant about orders at risk
    risk_res = await client.post(
        "/api/v1/ai/query",
        headers=headers,
        json={"query": "What orders are at risk of missing deadlines today?"},
    )
    assert risk_res.status_code == 200
    risk_data = risk_res.json()["data"]
    assert risk_data["intent_detected"] == "ORDERS_AT_RISK"
    assert "data_evidence" in risk_data

    # 2. Query AI Assistant about low stock
    stock_res = await client.post(
        "/api/v1/ai/query",
        headers=headers,
        json={"query": "Which raw materials will run out soon?"},
    )
    assert stock_res.status_code == 200
    assert stock_res.json()["data"]["intent_detected"] == "LOW_STOCK"

    # 3. Query AI Assistant about employee workloads
    work_res = await client.post(
        "/api/v1/ai/query",
        headers=headers,
        json={"query": "Who has too much workload on the printing floor?"},
    )
    assert work_res.status_code == 200
    assert work_res.json()["data"]["intent_detected"] == "EMPLOYEE_WORKLOAD"

    # 4. Fetch Daily Executive Briefing
    brief_res = await client.get("/api/v1/ai/daily-briefing", headers=headers)
    assert brief_res.status_code == 200
    brief_data = brief_res.json()["data"]
    assert "summary" in brief_data
    assert "orders_at_risk" in brief_data
    assert "low_stock_alerts" in brief_data
