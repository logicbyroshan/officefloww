import pytest
from decimal import Decimal
import uuid
from httpx import AsyncClient

from apps.api.app.stock.models import StockLocationType, StockMovementType


@pytest.mark.asyncio
async def test_labour_allocations_credit_and_piece_rate_payments(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Setup client, product, and stock item
    client_res = await client.post(
        "/api/v1/clients",
        headers=headers,
        json={"client_code": f"CLI-{uuid.uuid4().hex[:6]}", "organization_name": "Event Organizers Ltd"},
    )
    client_id = client_res.json()["data"]["id"]

    prod_res = await client.post(
        "/api/v1/products",
        headers=headers,
        json={"code": f"PRD-{uuid.uuid4().hex[:6]}", "name": "MPL Lanyard", "unit": "PCS"},
    )
    prod_id = prod_res.json()["data"]["id"]

    # Raw material: Metal Dog Hook
    hook_res = await client.post(
        "/api/v1/stock/items",
        headers=headers,
        json={"code": f"MAT-{uuid.uuid4().hex[:6]}", "name": "Dog Hook 16mm", "unit": "PCS"},
    )
    hook_item_id = hook_res.json()["data"]["id"]

    # Receive 10,000 hooks into store
    await client.post(
        "/api/v1/stock/movements",
        headers=headers,
        json={
            "stock_item_id": hook_item_id,
            "movement_type": StockMovementType.RECEIPT.value,
            "quantity": 10000.0,
        },
    )

    # 2. Onboard Labourers: Ramesh & Suresh
    ramesh_res = await client.post(
        "/api/v1/labour/labourers",
        headers=headers,
        json={
            "code": f"LAB-{uuid.uuid4().hex[:6]}",
            "name": "Ramesh Kumar",
            "phone": "+91 9123456780",
            "labour_type": "OUTSIDE_CONTRACT",
        },
    )
    assert ramesh_res.status_code == 201
    ramesh_id = ramesh_res.json()["data"]["id"]

    suresh_res = await client.post(
        "/api/v1/labour/labourers",
        headers=headers,
        json={
            "code": f"LAB-{uuid.uuid4().hex[:6]}",
            "name": "Suresh Patel",
            "phone": "+91 9123456781",
            "labour_type": "OUTSIDE_CONTRACT",
        },
    )
    assert suresh_res.status_code == 201
    suresh_id = suresh_res.json()["data"]["id"]

    # 3. Configure piece rate: MPL_FITTING @ ₹0.80 per piece
    rate_res = await client.post(
        "/api/v1/labour/rates",
        headers=headers,
        json={
            "product_id": prod_id,
            "operation_name": "MPL_FITTING",
            "rate_per_unit": 0.80,
        },
    )
    assert rate_res.status_code == 201

    # 4. Place Order 1: 2000 MPL
    order1_res = await client.post(
        "/api/v1/orders",
        headers=headers,
        json={"client_id": client_id, "items": [{"product_id": prod_id, "quantity": 2000}]},
    )
    order1_id = order1_res.json()["data"]["id"]
    order1_item_id = order1_res.json()["data"]["items"][0]["id"]

    # 5. Allocate Batch to Ramesh: 700 units
    batch_res = await client.post(
        "/api/v1/labour/batches",
        headers=headers,
        json={
            "order_id": order1_id,
            "order_item_id": order1_item_id,
            "labourer_id": ramesh_id,
            "operation_name": "MPL_FITTING",
            "allocated_quantity": 700.0,
            "rate_per_unit": 0.80,
        },
    )
    assert batch_res.status_code == 201
    batch_id = batch_res.json()["data"]["id"]

    # 6. LABOUR MATERIAL CREDIT TEST:
    # Required: 700 hooks.
    # We issue 1000 hooks to Ramesh.
    issue_res1 = await client.post(
        "/api/v1/labour/material-issues",
        headers=headers,
        json={
            "labourer_id": ramesh_id,
            "stock_item_id": hook_item_id,
            "order_id": order1_id,
            "order_item_id": order1_item_id,
            "required_quantity": 1000.0,
            "notes": "Issued round batch of 1000 hooks",
        },
    )
    assert issue_res1.status_code == 200
    assert Decimal(str(issue_res1.json()["data"]["updated_labour_balance"])) == Decimal("1000.0")

    # 7. Ramesh completes his job of 700 units (700 good, 0 defective)
    sub_res = await client.post(
        "/api/v1/labour/submissions",
        headers=headers,
        json={
            "labour_batch_id": batch_id,
            "completed_quantity": 700.0,
            "defective_quantity": 0.0,
            "notes": "Finished 700 units fitting",
        },
    )
    assert sub_res.status_code == 201

    # Remaining company material held by Ramesh should be 300! (1000 - 700 = 300)
    # 8. Order 2 arrives: Ramesh is assigned another 1300 units.
    # The system uses his 300 credit balance, so newly issued is only 1000!
    order2_res = await client.post(
        "/api/v1/orders",
        headers=headers,
        json={"client_id": client_id, "items": [{"product_id": prod_id, "quantity": 1300}]},
    )
    order2_id = order2_res.json()["data"]["id"]
    order2_item_id = order2_res.json()["data"]["items"][0]["id"]

    issue_res2 = await client.post(
        "/api/v1/labour/material-issues",
        headers=headers,
        json={
            "labourer_id": ramesh_id,
            "stock_item_id": hook_item_id,
            "order_id": order2_id,
            "order_item_id": order2_item_id,
            "required_quantity": 1300.0,
        },
    )
    assert issue_res2.status_code == 200
    issue2_data = issue_res2.json()["data"]
    assert Decimal(str(issue2_data["existing_balance_used"])) == Decimal("300.0")
    assert Decimal(str(issue2_data["newly_issued_quantity"])) == Decimal("1000.0")
    assert Decimal(str(issue2_data["updated_labour_balance"])) == Decimal("1300.0")

    # 9. PIECE RATE PAYMENT TEST:
    # Ramesh completed 700 units @ ₹0.80/piece.
    # Payable amount must be strictly ₹560.00 (700 * 0.80), never based on 1000 issued!
    pay_res = await client.post(f"/api/v1/labour/labourers/{ramesh_id}/generate-payment", headers=headers)
    assert pay_res.status_code == 200
    pay_data = pay_res.json()["data"]
    assert Decimal(str(pay_data["total_accepted_quantity"])) == Decimal("700.0")
    assert Decimal(str(pay_data["total_payable_amount"])) == Decimal("560.0")
    assert "PAY-LB-" in pay_data["payment_number"]
