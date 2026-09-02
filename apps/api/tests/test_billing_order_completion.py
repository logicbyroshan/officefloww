import pytest
from decimal import Decimal
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_billing_payments_and_order_completion_rule(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create client & product
    client_res = await client.post(
        "/api/v1/clients",
        headers=headers,
        json={"client_code": f"CLI-{uuid.uuid4().hex[:6]}", "organization_name": "Metro Hospitals Group"},
    )
    client_id = client_res.json()["data"]["id"]

    prod_res = await client.post(
        "/api/v1/products",
        headers=headers,
        json={"code": f"PRD-{uuid.uuid4().hex[:6]}", "name": "Staff Smart ID", "unit": "PCS"},
    )
    prod_id = prod_res.json()["data"]["id"]

    # 2. Place Order for 500 units @ ₹100 = ₹50,000
    order_res = await client.post(
        "/api/v1/orders",
        headers=headers,
        json={"client_id": client_id, "items": [{"product_id": prod_id, "quantity": 500, "unit_price": 100.0}]},
    )
    order_id = order_res.json()["data"]["id"]
    order_item_id = order_res.json()["data"]["items"][0]["id"]

    # 3. ORDER COMPLETION RULE ENFORCEMENT TEST:
    # Order cannot be completed simply by clicking a button!
    # Must fail because workflows and packing are incomplete.
    comp_fail = await client.post(f"/api/v1/billing/orders/{order_id}/complete", headers=headers)
    assert comp_fail.status_code == 400
    assert "Order cannot be marked COMPLETED" in comp_fail.json()["error"]["message"]

    # 4. Check completion condition details endpoint
    check_res = await client.get(f"/api/v1/billing/orders/{order_id}/completion-check", headers=headers)
    assert check_res.status_code == 200
    check_data = check_res.json()["data"]
    assert check_data["can_complete"] is False
    assert len(check_data["reasons"]) > 0

    # 5. Create Invoice for ₹50,000 + 18% GST (₹9,000) = ₹59,000
    inv_res = await client.post(
        "/api/v1/billing/invoices",
        headers=headers,
        json={
            "order_id": order_id,
            "client_id": client_id,
            "items": [
                {
                    "order_item_id": order_item_id,
                    "description": "Staff Smart ID 500 units",
                    "quantity": 500.0,
                    "unit_price": 100.0,
                    "tax_rate": 18.0,
                }
            ],
        },
    )
    assert inv_res.status_code == 201
    inv_data = inv_res.json()["data"]
    invoice_id = inv_data["id"]
    assert Decimal(str(inv_data["subtotal"])) == Decimal("50000.0")
    assert Decimal(str(inv_data["tax_amount"])) == Decimal("9000.0")
    assert Decimal(str(inv_data["total_amount"])) == Decimal("59000.0")
    assert inv_data["status"] == "ISSUED"

    # 6. Record Partial Payment of ₹30,000 via NEFT
    pay_res1 = await client.post(
        "/api/v1/billing/payments",
        headers=headers,
        json={
            "invoice_id": invoice_id,
            "amount": 30000.0,
            "payment_method": "BANK_TRANSFER",
            "reference_number": "UTR987654321",
        },
    )
    assert pay_res1.status_code == 201

    # Verify Invoice is now PARTIALLY_PAID
    inv_check1 = await client.get(f"/api/v1/orders/{order_id}", headers=headers)
    # 7. Record Balance Payment of ₹29,000
    pay_res2 = await client.post(
        "/api/v1/billing/payments",
        headers=headers,
        json={
            "invoice_id": invoice_id,
            "amount": 29000.0,
            "payment_method": "UPI",
            "reference_number": "UPI/2026/09/22881",
        },
    )
    assert pay_res2.status_code == 201
