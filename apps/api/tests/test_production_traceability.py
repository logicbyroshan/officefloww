import io
import pytest
from decimal import Decimal
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_production_file_lock_and_quantity_reconciliation(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create client & product
    client_res = await client.post(
        "/api/v1/clients",
        headers=headers,
        json={"client_code": f"CLI-{uuid.uuid4().hex[:6]}", "organization_name": "Apex Printing Co"},
    )
    client_id = client_res.json()["data"]["id"]

    prod_res = await client.post(
        "/api/v1/products",
        headers=headers,
        json={"code": f"PRD-{uuid.uuid4().hex[:6]}", "name": "Standard ID Card", "unit": "PCS"},
    )
    prod_id = prod_res.json()["data"]["id"]

    # 2. Place Order for 2000 units
    order_res = await client.post(
        "/api/v1/orders",
        headers=headers,
        json={
            "client_id": client_id,
            "items": [{"product_id": prod_id, "quantity": 2000, "unit_price": 45.0}],
        },
    )
    assert order_res.status_code in (200, 201)
    order_data = order_res.json()["data"]
    order_id = order_data["id"]
    order_item_id = order_data["items"][0]["id"]

    # 3. Create Machine
    m_res = await client.post(
        "/api/v1/production/machines",
        headers=headers,
        json={
            "code": f"MCH-{uuid.uuid4().hex[:6]}",
            "name": "Zebra Thermal Press #1",
            "machine_type": "THERMAL_PRESS",
        },
    )
    assert m_res.status_code == 201
    machine_id = m_res.json()["data"]["id"]

    # 4. Upload file (starts in DRAFT / unapproved)
    file_bytes = b"%PDF-1.4 unapproved sample"
    up_res = await client.post(
        "/api/v1/files/upload",
        headers=headers,
        data={"order_id": order_id, "logical_path": "04-Design/artwork.pdf"},
        files={"file": ("artwork.pdf", io.BytesIO(file_bytes), "application/pdf")},
    )
    assert up_res.status_code in (200, 201)
    file_version_id = up_res.json()["data"]["versions"][0]["id"]

    # Fetch admin user id
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    user_id = me_res.json()["data"]["id"]

    # 5. Production File Lock Test: Try creating batch with unapproved file version -> Should Fail (400)
    batch_fail = await client.post(
        "/api/v1/production/batches",
        headers=headers,
        json={
            "order_id": order_id,
            "order_item_id": order_item_id,
            "product_id": prod_id,
            "machine_id": machine_id,
            "operator_id": user_id,
            "approved_file_version_id": file_version_id,
            "input_quantity": 700.0,
        },
    )
    assert batch_fail.status_code == 400
    assert "Production file lock violated" in batch_fail.json()["error"]["message"]

    # 6. Formally Approve the file version
    appr_req = await client.post(
        "/api/v1/approvals",
        headers=headers,
        json={"order_id": order_id, "file_version_id": file_version_id, "comments": "Approved for press"},
    )
    approval_id = appr_req.json()["data"]["id"]
    await client.post(f"/api/v1/approvals/{approval_id}/approve", headers=headers)

    # 7. Now batch creation succeeds!
    b1_res = await client.post(
        "/api/v1/production/batches",
        headers=headers,
        json={
            "order_id": order_id,
            "order_item_id": order_item_id,
            "product_id": prod_id,
            "machine_id": machine_id,
            "operator_id": user_id,
            "approved_file_version_id": file_version_id,
            "input_quantity": 700.0,
        },
    )
    assert b1_res.status_code == 201
    batch1_id = b1_res.json()["data"]["id"]
    assert "PRINT-" in b1_res.json()["data"]["batch_number"]

    # 8. Add Batch 2 (700 units)
    b2_res = await client.post(
        "/api/v1/production/batches",
        headers=headers,
        json={
            "order_id": order_id,
            "order_item_id": order_item_id,
            "product_id": prod_id,
            "machine_id": machine_id,
            "operator_id": user_id,
            "approved_file_version_id": file_version_id,
            "input_quantity": 700.0,
        },
    )
    assert b2_res.status_code == 201

    # 9. Try allocating 700 more (Total would be 700 + 700 + 700 = 2100 > 2000) -> Over-allocation rejection!
    b3_fail = await client.post(
        "/api/v1/production/batches",
        headers=headers,
        json={
            "order_id": order_id,
            "order_item_id": order_item_id,
            "product_id": prod_id,
            "machine_id": machine_id,
            "operator_id": user_id,
            "approved_file_version_id": file_version_id,
            "input_quantity": 700.0,
        },
    )
    assert b3_fail.status_code == 400
    assert "Over-allocation rejected" in b3_fail.json()["error"]["message"]

    # 10. Allocate exactly remaining 600 units -> Valid (700 + 700 + 600 = 2000)
    b3_res = await client.post(
        "/api/v1/production/batches",
        headers=headers,
        json={
            "order_id": order_id,
            "order_item_id": order_item_id,
            "product_id": prod_id,
            "machine_id": machine_id,
            "operator_id": user_id,
            "approved_file_version_id": file_version_id,
            "input_quantity": 600.0,
        },
    )
    assert b3_res.status_code == 201

    # 11. Check Reconciliation Report
    recon_res = await client.get(
        f"/api/v1/production/order-items/{order_item_id}/reconciliation", headers=headers
    )
    assert recon_res.status_code == 200
    recon = recon_res.json()["data"]
    assert recon["is_valid"] is True
    assert recon["is_over_allocated"] is False
    assert Decimal(str(recon["total_allocated"])) == Decimal("2000.0")
    assert Decimal(str(recon["unallocated_quantity"])) == Decimal("0.0")
