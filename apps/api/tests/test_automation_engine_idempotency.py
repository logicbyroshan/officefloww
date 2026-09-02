import pytest
from httpx import AsyncClient
import uuid


@pytest.mark.asyncio
async def test_automation_rules_and_idempotency_suppression(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create a custom Automation Rule
    rule_res = await client.post(
        "/api/v1/automation/rules",
        headers=headers,
        json={
            "name": "High Defect Rate Supervisor Alert",
            "trigger_event": "QuantityDefectLogged",
            "conditions_json": {"defect_rate_high": True},
            "actions_json": {"action": "SEND_HIGH_PRIORITY_NOTIFICATION", "target_role": "MANAGER"},
            "is_active": True,
        },
    )
    assert rule_res.status_code in (200, 201)

    # 2. Trigger Automation Event with unique Idempotency Key
    idempotency_key = f"IDEM-KEY-{uuid.uuid4().hex}"
    trigger_payload = {
        "event_name": "QuantityDefectLogged",
        "payload": {"defect_rate_high": True, "batch_code": "PRINT-20260902-TEST"},
        "idempotency_key": idempotency_key,
    }

    first_res = await client.post("/api/v1/automation/trigger", headers=headers, json=trigger_payload)
    assert first_res.status_code == 200
    first_data = first_res.json()["data"]
    assert first_data["rules_executed"] >= 1

    # 3. Trigger identical event with SAME Idempotency Key -> Must be suppressed!
    second_res = await client.post("/api/v1/automation/trigger", headers=headers, json=trigger_payload)
    assert second_res.status_code == 200
    second_data = second_res.json()["data"]
    assert second_data.get("status") == "IDEMPOTENT_SUPPRESSED"
