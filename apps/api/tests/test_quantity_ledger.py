import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_quantity_ledger_and_scrap_rate(client: AsyncClient, admin_headers: dict):
    # Setup order
    c_res = await client.post(
        "/api/v1/clients",
        headers=admin_headers,
        json={"client_code": "CLI-QTY-01", "organization_name": "Ledger Client"},
    )
    client_id = c_res.json()["data"]["id"]

    p_res = await client.post(
        "/api/v1/products",
        headers=admin_headers,
        json={"code": "PRD-QTY-01", "name": "Quantity Product"},
    )
    prod_id = p_res.json()["data"]["id"]

    ord_res = await client.post(
        "/api/v1/orders",
        headers=admin_headers,
        json={
            "order_number": "ORD-QTY-001",
            "client_id": client_id,
            "items": [{"product_id": prod_id, "quantity": 1000}],
        },
    )
    order_data = ord_res.json()["data"]
    order_id = order_data["id"]
    order_item_id = order_data["items"][0]["id"]

    # Initial ORDERED transaction was created automatically: 1000
    init_sum = await client.get(
        f"/api/v1/quantities/orders/{order_item_id}/summary", headers=admin_headers
    )
    assert init_sum.status_code == 200
    assert init_sum.json()["data"]["ordered"] == 1000

    # 1. Record PRODUCED batch 1 (950 units)
    await client.post(
        "/api/v1/quantities/transactions",
        headers=admin_headers,
        json={
            "order_id": order_id,
            "order_item_id": order_item_id,
            "transaction_type": "PRODUCED",
            "quantity": 950,
            "batch_reference": "BATCH-01",
        },
    )

    # 2. Record REJECTED during printing (30 units due to alignment defect)
    await client.post(
        "/api/v1/quantities/transactions",
        headers=admin_headers,
        json={
            "order_id": order_id,
            "order_item_id": order_item_id,
            "transaction_type": "REJECTED",
            "quantity": 30,
            "batch_reference": "BATCH-01",
            "reason": "Misaligned thermal print ribbon",
        },
    )

    # 3. Record WASTED setup scrap (20 units)
    await client.post(
        "/api/v1/quantities/transactions",
        headers=admin_headers,
        json={
            "order_id": order_id,
            "order_item_id": order_item_id,
            "transaction_type": "WASTED",
            "quantity": 20,
            "batch_reference": "BATCH-01",
            "reason": "Machine calibration waste",
        },
    )

    # 4. Check summary calculations
    sum_res = await client.get(
        f"/api/v1/quantities/orders/{order_item_id}/summary", headers=admin_headers
    )
    assert sum_res.status_code == 200
    summary = sum_res.json()["data"]
    assert summary["ordered"] == 1000
    assert summary["produced"] == 950
    assert summary["rejected"] == 30
    assert summary["wasted"] == 20
    assert summary["net_good_units"] == 920  # 950 - 30 rejected

    # Scrap rate calculation: (rejected + wasted) / (produced + wasted) = (30 + 20) / (950 + 20) = 50 / 970 = ~5.15%
    assert summary["scrap_rate_percentage"] == 5.15
