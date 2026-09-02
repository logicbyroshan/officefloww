import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_operator_cannot_create_client(client: AsyncClient, operator_headers: dict):
    # Operator lacks 'clients:write' permission
    response = await client.post(
        "/api/v1/clients",
        headers=operator_headers,
        json={
            "client_code": "CLI-FORBIDDEN",
            "organization_name": "Unauthorized Client Corp",
        },
    )
    assert response.status_code == 403
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_operator_cannot_list_users(client: AsyncClient, operator_headers: dict):
    response = await client.get("/api/v1/users", headers=operator_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_list_users(client: AsyncClient, admin_headers: dict):
    response = await client.get("/api/v1/users", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
