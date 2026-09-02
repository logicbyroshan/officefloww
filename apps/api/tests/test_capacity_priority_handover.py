import pytest
from httpx import AsyncClient
import uuid
from datetime import date, timedelta


@pytest.mark.asyncio
async def test_capacity_metrics_and_absence_handover(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Query Machine and Employee Capacity
    m_res = await client.get("/api/v1/capacity/machines", headers=headers)
    assert m_res.status_code == 200
    assert isinstance(m_res.json()["data"], list)

    e_res = await client.get("/api/v1/capacity/employees", headers=headers)
    assert e_res.status_code == 200
    assert isinstance(e_res.json()["data"], list)

    # 2. Get me user id
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    user_id = me_res.json()["data"]["id"]

    # 3. Create Absence Request & Generate Handover Plan
    start_d = date.today() + timedelta(days=1)
    end_d = start_d + timedelta(days=3)

    plan_res = await client.post(
        "/api/v1/capacity/absence/plan-handover",
        headers=headers,
        json={
            "user_id": user_id,
            "start_date": start_d.isoformat(),
            "end_date": end_d.isoformat(),
            "reason": "Attending annual industrial print expo",
        },
    )
    assert plan_res.status_code in (200, 201)
    plan_data = plan_res.json()["data"]
    absence_id = plan_data["absence_id"]

    # 4. Execute Handover
    exec_res = await client.post(f"/api/v1/capacity/absence/{absence_id}/execute-handover", headers=headers)
    assert exec_res.status_code == 200
    assert "reassigned_tasks_count" in exec_res.json()["data"]
