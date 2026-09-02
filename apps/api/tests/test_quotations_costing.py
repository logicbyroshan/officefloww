import pytest
from httpx import AsyncClient
import uuid
from decimal import Decimal


@pytest.mark.asyncio
async def test_quotation_tiered_pricing_costing_and_conversion(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Setup client and product
    cli_res = await client.post(
        "/api/v1/clients",
        headers=headers,
        json={"client_code": f"CLI-QTN-{uuid.uuid4().hex[:6]}", "organization_name": "Apex Academy"},
    )
    assert cli_res.status_code in (200, 201)
    client_id = cli_res.json()["data"]["id"]

    prod_res = await client.post(
        "/api/v1/products",
        headers=headers,
        json={"code": f"PRD-ID-{uuid.uuid4().hex[:6]}", "name": "Standard Student ID Card", "unit": "PCS"},
    )
    assert prod_res.status_code in (200, 201)
    prod_id = prod_res.json()["data"]["id"]

    # 2. Create Pricing Rule with Quantity Tiers
    tier_res = await client.post(
        "/api/v1/quotations/pricing-rules",
        headers=headers,
        json={
            "product_id": prod_id,
            "name": "Student ID Tier Pricing",
            "tiers": [
                {"min_quantity": 1, "max_quantity": 500, "base_unit_price": "45.00", "discount_percentage": "0.0"},
                {"min_quantity": 501, "max_quantity": 2000, "base_unit_price": "45.00", "discount_percentage": "20.0"},
                {"min_quantity": 2001, "max_quantity": None, "base_unit_price": "45.00", "discount_percentage": "35.0"},
            ],
        },
    )
    assert tier_res.status_code in (200, 201)

    # 3. Calculate Deterministic Cost Breakdown
    cost_res = await client.post(
        "/api/v1/quotations/calculate-cost",
        headers=headers,
        json={
            "product_id": prod_id,
            "quantity": 1000,
            "desired_margin_percentage": "25.0",
            "overhead_percentage": "10.0",
            "estimated_delivery_cost": "600.0",
        },
    )
    assert cost_res.status_code == 200
    cost_data = cost_res.json()["data"]
    assert float(cost_data["suggested_unit_price"]) > 0
    assert float(cost_data["total_cost"]) > 0

    # 4. Create Quotation using Tiered Pricing (1000 units falls in 20% discount tier -> ₹36.00)
    qtn_res = await client.post(
        "/api/v1/quotations",
        headers=headers,
        json={
            "client_id": client_id,
            "notes": "Quotation for 1000 ID cards with volume tier discount.",
            "items": [{"product_id": prod_id, "quantity": 1000}],
        },
    )
    assert qtn_res.status_code in (200, 201)
    qtn_data = qtn_res.json()["data"]
    quotation_id = qtn_data["id"]
    assert float(qtn_data["subtotal"]) == 36000.0  # 1000 * 36.0
    assert float(qtn_data["tax_amount"]) == 6480.0  # 18% GST
    assert float(qtn_data["total_amount"]) == 42480.0

    # 5. Check Feasibility
    feas_res = await client.get(f"/api/v1/quotations/{quotation_id}/feasibility", headers=headers)
    assert feas_res.status_code == 200
    assert feas_res.json()["data"]["status"] in ("GREEN", "YELLOW", "RED")

    # 6. Convert Quotation to Confirmed Order
    conv_res = await client.post(f"/api/v1/quotations/{quotation_id}/convert-to-order", headers=headers)
    assert conv_res.status_code == 200
    order_id = conv_res.json()["data"]["order_id"]
    assert order_id is not None
