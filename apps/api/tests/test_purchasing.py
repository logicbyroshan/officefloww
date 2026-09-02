import pytest
from decimal import Decimal
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_purchasing_workflow_and_price_history(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create StockItem
    item_res = await client.post(
        "/api/v1/stock/items",
        headers=headers,
        json={
            "code": f"MAT-{uuid.uuid4().hex[:6]}",
            "name": "Satin Ribbon Roll 16mm",
            "unit": "ROLLS",
        },
    )
    stock_item_id = item_res.json()["data"]["id"]

    # 2. Onboard Supplier
    supp_res = await client.post(
        "/api/v1/purchasing/suppliers",
        headers=headers,
        json={
            "code": f"SUPP-{uuid.uuid4().hex[:6]}",
            "name": "National Ribbon Mills Ltd",
            "contact_person": "Vipin Singhal",
            "phone": "+91 9876543210",
            "tax_identifier": "23AAACN1234F1Z5",
        },
    )
    assert supp_res.status_code == 201
    supplier_id = supp_res.json()["data"]["id"]

    # 3. Create Purchase Order for 50 rolls @ ₹1700
    po_res1 = await client.post(
        "/api/v1/purchasing/orders",
        headers=headers,
        json={
            "supplier_id": supplier_id,
            "items": [{"stock_item_id": stock_item_id, "quantity": 50.0, "unit_price": 1700.0}],
        },
    )
    assert po_res1.status_code == 201
    po1_id = po_res1.json()["data"]["id"]
    po1_item_id = po_res1.json()["data"]["items"][0]["id"]

    # 4. Approve Purchase Order
    appr_res1 = await client.post(f"/api/v1/purchasing/orders/{po1_id}/approve", headers=headers)
    assert appr_res1.status_code == 200
    assert appr_res1.json()["data"]["status"] == "APPROVED"

    # 5. Goods Receipt Note (GRN) for PO1
    grn_res1 = await client.post(
        "/api/v1/purchasing/goods-receipts",
        headers=headers,
        json={
            "purchase_order_id": po1_id,
            "items": [
                {
                    "purchase_order_item_id": po1_item_id,
                    "stock_item_id": stock_item_id,
                    "received_quantity": 50.0,
                    "accepted_quantity": 50.0,
                    "unit_cost": 1700.0,
                }
            ],
        },
    )
    assert grn_res1.status_code == 201

    # 6. Physical stock should now be 50
    bal_res = await client.get(f"/api/v1/stock/items/{stock_item_id}/balance", headers=headers)
    assert Decimal(str(bal_res.json()["data"]["physical_stock"])) == Decimal("50.0")

    # 7. Next month: PO2 for 50 rolls @ ₹1950 (Price Increase)
    po_res2 = await client.post(
        "/api/v1/purchasing/orders",
        headers=headers,
        json={
            "supplier_id": supplier_id,
            "items": [{"stock_item_id": stock_item_id, "quantity": 50.0, "unit_price": 1950.0}],
        },
    )
    po2_id = po_res2.json()["data"]["id"]
    po2_item_id = po_res2.json()["data"]["items"][0]["id"]
    await client.post(f"/api/v1/purchasing/orders/{po2_id}/approve", headers=headers)

    await client.post(
        "/api/v1/purchasing/goods-receipts",
        headers=headers,
        json={
            "purchase_order_id": po2_id,
            "items": [
                {
                    "purchase_order_item_id": po2_item_id,
                    "stock_item_id": stock_item_id,
                    "received_quantity": 50.0,
                    "accepted_quantity": 50.0,
                    "unit_cost": 1950.0,
                }
            ],
        },
    )

    # 8. Check Price Trends
    trend_res = await client.get(f"/api/v1/purchasing/items/{stock_item_id}/price-trends", headers=headers)
    assert trend_res.status_code == 200
    trend = trend_res.json()["data"]
    assert Decimal(str(trend["current_price"])) == Decimal("1950.0")
    assert Decimal(str(trend["previous_price"])) == Decimal("1700.0")
    assert Decimal(str(trend["absolute_increase"])) == Decimal("250.0")
    # Percentage increase: (250 / 1700) * 100 = 14.7059%
    assert round(Decimal(str(trend["percentage_increase"])), 1) == Decimal("14.7")
    # Average of 1700 and 1950 = 1825
    assert Decimal(str(trend["recent_average_price"])) == Decimal("1825.0")
