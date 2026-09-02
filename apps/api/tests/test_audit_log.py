import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_audit_log_capture(client: AsyncClient, admin_headers: dict):
    # Setup client
    c_res = await client.post(
        "/api/v1/clients",
        headers=admin_headers,
        json={"client_code": "CLI-AUDIT-01", "organization_name": "Audit Test Corp"},
    )
    client_id = c_res.json()["data"]["id"]

    p_res = await client.post(
        "/api/v1/products",
        headers=admin_headers,
        json={"code": "PRD-AUD-01", "name": "Audit Product"},
    )
    prod_id = p_res.json()["data"]["id"]

    # Place order -> generates ORDER_CREATED audit entry
    ord_res = await client.post(
        "/api/v1/orders",
        headers=admin_headers,
        json={
            "order_number": "ORD-AUD-001",
            "client_id": client_id,
            "items": [{"product_id": prod_id, "quantity": 100}],
        },
    )
    order_id = ord_res.json()["data"]["id"]

    # Update order status -> generates ORDER_STATUS_CHANGED audit entry
    await client.patch(
        f"/api/v1/orders/{order_id}",
        headers=admin_headers,
        json={"status": "IN_PRODUCTION"},
    )

    # Query audit logs for Order entity
    audit_res = await client.get(
        f"/api/v1/audit?entity=Order&entity_id={order_id}",
        headers=admin_headers,
    )
    assert audit_res.status_code == 200
    logs = audit_res.json()["data"]
    assert len(logs) >= 2

    actions = [l["action"] for l in logs]
    assert "ORDER_CREATED" in actions
    assert "ORDER_STATUS_CHANGED" in actions

    # Check status changed log diff
    status_log = next(l for l in logs if l["action"] == "ORDER_STATUS_CHANGED")
    assert status_log["old_values_json"]["status"] == "CONFIRMED"
    assert status_log["new_values_json"]["status"] == "IN_PRODUCTION"
