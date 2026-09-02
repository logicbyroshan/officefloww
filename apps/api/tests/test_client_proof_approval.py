import pytest
from httpx import AsyncClient
import uuid
from apps.api.app.files.models import FileApprovalStatus


@pytest.mark.asyncio
async def test_client_external_proof_link_and_approval(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Setup client and order
    cli_res = await client.post(
        "/api/v1/clients",
        headers=headers,
        json={"client_code": f"CLI-PRF-{uuid.uuid4().hex[:6]}", "organization_name": "Delhi Public School"},
    )
    assert cli_res.status_code in (200, 201)
    client_id = cli_res.json()["data"]["id"]

    prod_res = await client.post(
        "/api/v1/products",
        headers=headers,
        json={"code": f"PRD-PRF-{uuid.uuid4().hex[:6]}", "name": "Proof Test Product", "unit": "PCS"},
    )
    assert prod_res.status_code in (200, 201)
    prod_id = prod_res.json()["data"]["id"]

    ord_res = await client.post(
        "/api/v1/orders",
        headers=headers,
        json={"client_id": client_id, "items": [{"product_id": prod_id, "quantity": 500}]},
    )
    assert ord_res.status_code in (200, 201)
    order_id = ord_res.json()["data"]["id"]

    # 2. Upload Artwork File Version
    file_record_res = await client.post(
        "/api/v1/files/upload",
        headers=headers,
        data={"order_id": order_id, "folder_type": "04-Design"},
        files={"file": ("student_id_proof_v1.pdf", b"%PDF-1.4 Mock Proof Content", "application/pdf")},
    )
    assert file_record_res.status_code in (200, 201)
    file_ver_id = file_record_res.json()["data"]["versions"][0]["id"]

    # 3. Generate External Proof Token Link
    link_res = await client.post(
        "/api/v1/notifications/proofs/generate-link",
        headers=headers,
        json={
            "file_version_id": file_ver_id,
            "client_id": client_id,
            "contact_name": "Principal Sharma",
            "contact_phone": "+91 98111 22233",
            "expires_in_hours": 72,
        },
    )
    assert link_res.status_code in (200, 201)
    link_data = link_res.json()["data"]
    token = link_data["token"]
    assert token is not None

    # 4. External Client responds to Proof (Public tokenized endpoint - no auth header required)
    resp_res = await client.post(
        f"/api/v1/notifications/proofs/{token}/respond",
        json={"decision": "APPROVED", "feedback_notes": "Artwork looks great, approved for mass printing."},
    )
    assert resp_res.status_code == 200
    assert resp_res.json()["data"]["status"] == "APPROVED"
