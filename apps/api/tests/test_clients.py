import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_client(client: AsyncClient, admin_headers: dict):
    # 1. Create client
    create_res = await client.post(
        "/api/v1/clients",
        headers=admin_headers,
        json={
            "client_code": "CLI-TEST-01",
            "organization_name": "Test Global Academy",
            "billing_address": "123 Education Lane",
            "delivery_address": "123 Education Lane, Block B",
            "tax_identifier": "27AABCT1234F1Z1",
            "contacts": [
                {
                    "name": "Jane Doe",
                    "phone": "+91 99999 11111",
                    "email": "jane@testacademy.edu",
                    "designation": "Director",
                    "is_primary": True,
                }
            ],
        },
    )
    assert create_res.status_code == 200
    data = create_res.json()["data"]
    client_id = data["id"]
    assert data["client_code"] == "CLI-TEST-01"
    assert len(data["contacts"]) == 1
    assert data["contacts"][0]["name"] == "Jane Doe"

    # 2. Get client by id
    get_res = await client.get(f"/api/v1/clients/{client_id}", headers=admin_headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["organization_name"] == "Test Global Academy"

    # 3. Add second contact
    contact_res = await client.post(
        f"/api/v1/clients/{client_id}/contacts",
        headers=admin_headers,
        json={
            "name": "John Smith",
            "phone": "+91 99999 22222",
            "email": "john@testacademy.edu",
            "designation": "Manager",
            "is_primary": False,
        },
    )
    assert contact_res.status_code == 200
    assert contact_res.json()["data"]["name"] == "John Smith"


@pytest.mark.asyncio
async def test_duplicate_client_code_conflict(client: AsyncClient, admin_headers: dict):
    payload = {
        "client_code": "CLI-DUP-01",
        "organization_name": "First Corp",
    }
    res1 = await client.post("/api/v1/clients", headers=admin_headers, json=payload)
    assert res1.status_code == 200

    res2 = await client.post("/api/v1/clients", headers=admin_headers, json=payload)
    assert res2.status_code == 409
    assert res2.json()["error"]["code"] == "CONFLICT"
