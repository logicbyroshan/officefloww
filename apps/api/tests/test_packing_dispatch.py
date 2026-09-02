import pytest
from decimal import Decimal
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_packing_dispatch_and_expense_reimbursement(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Setup client, product, and order for 1000 items
    client_res = await client.post(
        "/api/v1/clients",
        headers=headers,
        json={"client_code": f"CLI-{uuid.uuid4().hex[:6]}", "organization_name": "Conference Host Corp"},
    )
    client_id = client_res.json()["data"]["id"]

    prod_res = await client.post(
        "/api/v1/products",
        headers=headers,
        json={"code": f"PRD-{uuid.uuid4().hex[:6]}", "name": "Event Badges", "unit": "PCS"},
    )
    prod_id = prod_res.json()["data"]["id"]

    order_res = await client.post(
        "/api/v1/orders",
        headers=headers,
        json={"client_id": client_id, "items": [{"product_id": prod_id, "quantity": 1000}]},
    )
    order_id = order_res.json()["data"]["id"]
    order_item_id = order_res.json()["data"]["items"][0]["id"]

    # 2. Create Packing Task for 1000 units
    pack_res = await client.post(
        "/api/v1/packing/tasks",
        headers=headers,
        json={"order_id": order_id, "order_item_id": order_item_id, "target_quantity": 1000.0},
    )
    assert pack_res.status_code == 201
    pack_task_id = pack_res.json()["data"]["id"]

    # 3. Add Box 1 of 500 units
    box1_res = await client.post(
        f"/api/v1/packing/tasks/{pack_task_id}/packages",
        headers=headers,
        json={"package_type": "BOX", "quantity": 500.0, "weight_kg": 4.5},
    )
    assert box1_res.status_code == 201

    # 4. Attempt to add 600 units (500 + 600 = 1100 > 1000) -> Over-allocation rejection!
    box_fail = await client.post(
        f"/api/v1/packing/tasks/{pack_task_id}/packages",
        headers=headers,
        json={"package_type": "BOX", "quantity": 600.0, "weight_kg": 5.0},
    )
    assert box_fail.status_code == 400
    assert "Packing over-allocation rejected" in box_fail.json()["error"]["message"]

    # 5. Add Box 2 with remaining 500 units
    box2_res = await client.post(
        f"/api/v1/packing/tasks/{pack_task_id}/packages",
        headers=headers,
        json={"package_type": "BOX", "quantity": 500.0, "weight_kg": 4.5},
    )
    assert box2_res.status_code == 201

    # 6. Verify packing completeness
    task_res = await client.get(f"/api/v1/packing/tasks/{pack_task_id}", headers=headers)
    assert task_res.json()["data"]["status"] == "COMPLETED"
    assert Decimal(str(task_res.json()["data"]["packed_quantity"])) == Decimal("1000.0")

    # 7. Create Transport Provider (e.g. Hans Travels Bus Service)
    tp_res = await client.post(
        "/api/v1/dispatch/providers",
        headers=headers,
        json={"name": "Hans Travels Night Bus", "code": f"BUS-{uuid.uuid4().hex[:6]}", "provider_type": "BUS"},
    )
    assert tp_res.status_code == 201
    provider_id = tp_res.json()["data"]["id"]

    # 8. Create Delivery record
    deliv_res = await client.post(
        "/api/v1/dispatch/deliveries",
        headers=headers,
        json={
            "order_id": order_id,
            "transport_type": "BUS",
            "destination_address": "Brilliant Convention Centre, Vijay Nagar",
            "destination_city": "Indore",
            "total_packages": 2,
            "total_weight_kg": 9.0,
            "transport_provider_id": provider_id,
        },
    )
    assert deliv_res.status_code == 201
    delivery_id = deliv_res.json()["data"]["id"]

    # 9. Delivery partner books the bus and pays ₹800 out-of-pocket
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    user_id = me_res.json()["data"]["id"]

    book_res = await client.post(
        f"/api/v1/dispatch/deliveries/{delivery_id}/bookings",
        headers=headers,
        json={
            "delivery_id": delivery_id,
            "booking_reference": "BUS-LR-987654",
            "charge_amount": 800.0,
            "paid_by_id": user_id,
        },
    )
    assert book_res.status_code == 201

    # 10. Check that an expense reimbursement record was automatically created for ₹800
    deliv_check = await client.get(f"/api/v1/dispatch/deliveries/{delivery_id}", headers=headers)
    deliv_data = deliv_check.json()["data"]
    assert len(deliv_data["expenses"]) == 1
    expense = deliv_data["expenses"][0]
    assert Decimal(str(expense["amount"])) == Decimal("800.0")
    assert expense["reimbursement_status"] == "PENDING"

    # 11. Manager approves the expense reimbursement
    expense_id = expense["id"]
    appr_exp = await client.post(f"/api/v1/dispatch/expenses/{expense_id}/approve", headers=headers)
    assert appr_exp.status_code == 200
    assert appr_exp.json()["data"]["reimbursement_status"] == "APPROVED"

    # 12. Delivery Exception Test: Expected Indore, Actual booked was accidentally Bhopal
    exc_res = await client.post(
        f"/api/v1/dispatch/deliveries/{delivery_id}/exceptions",
        headers=headers,
        json={
            "delivery_id": delivery_id,
            "expected_value": "Destination: Indore (Vijay Nagar)",
            "actual_value": "Booked: Bhopal Bus Depot by mistake",
            "reason": "Conductor misrouted luggage at boarding gate",
        },
    )
    assert exc_res.status_code == 201
    assert exc_res.json()["data"]["expected_value"] == "Destination: Indore (Vijay Nagar)"
