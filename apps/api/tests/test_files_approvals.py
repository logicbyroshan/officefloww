import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_file_versioning_and_approval_workflow(client: AsyncClient, admin_headers: dict):
    # 1. Setup client and order
    c_res = await client.post(
        "/api/v1/clients",
        headers=admin_headers,
        json={"client_code": "CLI-FILE-01", "organization_name": "File Test Corp"},
    )
    client_id = c_res.json()["data"]["id"]

    p_res = await client.post(
        "/api/v1/products",
        headers=admin_headers,
        json={"code": "PRD-FILE-01", "name": "File Product"},
    )
    prod_id = p_res.json()["data"]["id"]

    ord_res = await client.post(
        "/api/v1/orders",
        headers=admin_headers,
        json={
            "order_number": "ORD-FILE-001",
            "client_id": client_id,
            "items": [{"product_id": prod_id, "quantity": 100}],
        },
    )
    order_id = ord_res.json()["data"]["id"]

    # 2. Check that logical folders were created for the workspace
    folders_res = await client.get(f"/api/v1/files/order/{order_id}/workspace", headers=admin_headers)
    assert folders_res.status_code == 200
    folders = folders_res.json()["data"]
    assert len(folders) >= 9
    folder_names = [f["name"] for f in folders]
    assert "04-Design" in folder_names

    design_folder = next(f for f in folders if f["name"] == "04-Design")

    # 3. Upload Design v1
    v1_content = b"%PDF-1.4 Mock artwork content version 1"
    files = {"file": ("student_id_front.pdf", v1_content, "application/pdf")}
    data = {
        "order_id": order_id,
        "folder_id": design_folder["id"],
        "notes": "Initial draft design concept",
    }
    up1_res = await client.post("/api/v1/files/upload", headers=admin_headers, files=files, data=data)
    assert up1_res.status_code == 200
    file_data1 = up1_res.json()["data"]
    file_id = file_data1["id"]
    assert file_data1["current_version_number"] == 1
    assert len(file_data1["versions"]) == 1
    v1_id = file_data1["versions"][0]["id"]
    assert file_data1["versions"][0]["approval_state"] == "DRAFT"

    # 4. Upload Design revision with SAME filename -> Creates v2 without overwriting v1
    v2_content = b"%PDF-1.4 Mock artwork content version 2 with updated colors"
    files2 = {"file": ("student_id_front.pdf", v2_content, "application/pdf")}
    data2 = {
        "order_id": order_id,
        "folder_id": design_folder["id"],
        "notes": "Adjusted brand blue according to pantone spec",
    }
    up2_res = await client.post("/api/v1/files/upload", headers=admin_headers, files=files2, data=data2)
    assert up2_res.status_code == 200
    file_data2 = up2_res.json()["data"]
    assert file_data2["id"] == file_id  # Same file identity!
    assert file_data2["current_version_number"] == 2
    assert len(file_data2["versions"]) == 2
    v2_id = file_data2["versions"][1]["id"]
    assert file_data2["versions"][0]["checksum"] != file_data2["versions"][1]["checksum"]

    # 5. Request approval for Version 2
    appr_req = await client.post(
        "/api/v1/approvals",
        headers=admin_headers,
        json={
            "order_id": order_id,
            "file_version_id": v2_id,
            "comments": "Please approve revised design v2",
        },
    )
    assert appr_req.status_code == 200
    approval_id = appr_req.json()["data"]["id"]
    assert appr_req.json()["data"]["status"] == "PENDING"

    # 6. Approve the file version
    decide_res = await client.post(
        f"/api/v1/approvals/{approval_id}/approve",
        headers=admin_headers,
        json={"comments": "Looks great, approved for mass production."},
    )
    assert decide_res.status_code == 200
    assert decide_res.json()["data"]["status"] == "APPROVED"

    # 7. Check file version state is now APPROVED
    file_final = await client.get(f"/api/v1/files/{file_id}", headers=admin_headers)
    assert file_final.json()["data"]["versions"][1]["approval_state"] == "APPROVED"
