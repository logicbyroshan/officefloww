import pytest
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_asset_checkout_and_return_lifecycle(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create AssetType
    type_res = await client.post(
        "/api/v1/assets/types",
        headers=headers,
        json={"code": f"TYP-{uuid.uuid4().hex[:6]}", "name": "Heavy Duty Ultrasonic Cutter"},
    )
    assert type_res.status_code == 201
    asset_type_id = type_res.json()["data"]["id"]

    # 2. Register physical Asset
    asset_res = await client.post(
        "/api/v1/assets",
        headers=headers,
        json={
            "asset_code": f"AST-{uuid.uuid4().hex[:6]}",
            "asset_type_id": asset_type_id,
            "name": "Ultrasonic Cutter Unit #3",
            "condition": "EXCELLENT",
        },
    )
    assert asset_res.status_code == 201
    asset_id = asset_res.json()["data"]["id"]

    # Fetch admin user id
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    user_id = me_res.json()["data"]["id"]

    # 3. Check out asset to operator
    assign_res = await client.post(
        "/api/v1/assets/assignments",
        headers=headers,
        json={
            "asset_id": asset_id,
            "assigned_to_user_id": user_id,
            "condition_on_issue": "EXCELLENT",
            "notes": "Issued for Morning shift lanyard cutting",
        },
    )
    assert assign_res.status_code == 201
    assert assign_res.json()["data"]["condition_on_issue"] == "EXCELLENT"

    # 4. Attempt double checkout -> Must fail (400)
    dup_res = await client.post(
        "/api/v1/assets/assignments",
        headers=headers,
        json={
            "asset_id": asset_id,
            "assigned_to_user_id": user_id,
            "condition_on_issue": "EXCELLENT",
        },
    )
    assert dup_res.status_code == 400
    assert "currently checked out" in dup_res.json()["error"]["message"]

    # 5. Return asset with condition GOOD
    return_res = await client.post(
        f"/api/v1/assets/{asset_id}/return",
        headers=headers,
        json={"condition_on_return": "GOOD", "notes": "Minor blade wear, inspected and cleaned"},
    )
    assert return_res.status_code == 200
    assert return_res.json()["data"]["condition_on_return"] == "GOOD"

    # 6. Verify asset is now free and has condition GOOD
    get_res = await client.get(f"/api/v1/assets/{asset_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["current_holder_id"] is None
    assert get_res.json()["data"]["condition"] == "GOOD"
