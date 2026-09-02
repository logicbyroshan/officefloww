import pytest
from decimal import Decimal
import uuid
from httpx import AsyncClient

from apps.api.app.stock.models import StockLocationType, StockMovementType


@pytest.mark.asyncio
async def test_stock_balance_and_reservations(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create main store location
    loc_res = await client.post(
        "/api/v1/stock/locations",
        headers=headers,
        json={
            "code": f"LOC-{uuid.uuid4().hex[:6]}",
            "name": "Central Store Room",
            "location_type": StockLocationType.MAIN_STORE.value,
        },
    )
    assert loc_res.status_code == 201
    loc_id = loc_res.json()["data"]["id"]

    # 2. Create StockItem
    item_res = await client.post(
        "/api/v1/stock/items",
        headers=headers,
        json={
            "code": f"MAT-{uuid.uuid4().hex[:6]}",
            "name": "Dog Hook Metallic 12mm",
            "unit": "PCS",
            "min_stock_level": 500.0,
            "cost_price": 1.25,
        },
    )
    assert item_res.status_code == 201
    item_id = item_res.json()["data"]["id"]

    # 3. Initial balance should be zero
    bal_res1 = await client.get(f"/api/v1/stock/items/{item_id}/balance", headers=headers)
    assert bal_res1.status_code == 200
    bal1 = bal_res1.json()["data"]
    assert Decimal(str(bal1["physical_stock"])) == Decimal("0.0")
    assert Decimal(str(bal1["available_stock"])) == Decimal("0.0")

    # 4. Receive 5000 units into location (RECEIPT movement)
    receipt_res = await client.post(
        "/api/v1/stock/movements",
        headers=headers,
        json={
            "stock_item_id": item_id,
            "movement_type": StockMovementType.RECEIPT.value,
            "quantity": 5000.0,
            "to_location_id": loc_id,
            "reason": "Initial bulk lot purchase",
        },
    )
    assert receipt_res.status_code == 201

    # 5. Check balance: physical=5000, reserved=0, available=5000
    bal_res2 = await client.get(f"/api/v1/stock/items/{item_id}/balance", headers=headers)
    bal2 = bal_res2.json()["data"]
    assert Decimal(str(bal2["physical_stock"])) == Decimal("5000.0")
    assert Decimal(str(bal2["reserved_stock"])) == Decimal("0.0")
    assert Decimal(str(bal2["available_stock"])) == Decimal("5000.0")

    # 6. Reserve 3000 units (RESERVATION movement)
    order_id = str(uuid.uuid4())
    order_item_id = str(uuid.uuid4())
    res_res = await client.post(
        "/api/v1/stock/movements",
        headers=headers,
        json={
            "stock_item_id": item_id,
            "movement_type": StockMovementType.RESERVATION.value,
            "quantity": 3000.0,
            "order_id": order_id,
            "order_item_id": order_item_id,
            "reason": "Order confirmation hold",
        },
    )
    assert res_res.status_code == 201

    # 7. Consume 1000 units (CONSUMPTION movement)
    cons_res = await client.post(
        "/api/v1/stock/movements",
        headers=headers,
        json={
            "stock_item_id": item_id,
            "movement_type": StockMovementType.CONSUMPTION.value,
            "quantity": 1000.0,
            "order_id": order_id,
            "reason": "Machine production batch 1",
        },
    )
    assert cons_res.status_code == 201

    # 8. Post-consumption physical stock should be 4000
    bal_res3 = await client.get(f"/api/v1/stock/items/{item_id}/balance", headers=headers)
    bal3 = bal_res3.json()["data"]
    assert Decimal(str(bal3["physical_stock"])) == Decimal("4000.0")


@pytest.mark.asyncio
async def test_insufficient_stock_rejection(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    item_res = await client.post(
        "/api/v1/stock/items",
        headers=headers,
        json={
            "code": f"MAT-{uuid.uuid4().hex[:6]}",
            "name": "Testing Insufficient Item",
            "unit": "METERS",
        },
    )
    item_id = item_res.json()["data"]["id"]

    # Attempt to consume without physical stock -> Must be rejected (HTTP 400)
    issue_res = await client.post(
        "/api/v1/stock/movements",
        headers=headers,
        json={
            "stock_item_id": item_id,
            "movement_type": StockMovementType.ISSUE.value,
            "quantity": 100.0,
        },
    )
    assert issue_res.status_code == 400
    assert "Insufficient physical stock" in issue_res.json()["error"]["message"]
