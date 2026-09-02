import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from apps.api.app.users.models import User


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_user: User):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": admin_user.email, "password": "TestPass@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["user"]["email"] == admin_user.email


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, admin_user: User):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": admin_user.email, "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "AUTHENTICATION_FAILED"


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient, admin_user: User):
    # First login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": admin_user.email, "password": "TestPass@123"},
    )
    rt = login_res.json()["data"]["refresh_token"]

    # Refresh
    refresh_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": rt},
    )
    assert refresh_res.status_code == 200
    new_rt = refresh_res.json()["data"]["refresh_token"]
    assert new_rt != rt

    # Trying to reuse old refresh token should fail (rotation)
    reuse_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": rt},
    )
    assert reuse_res.status_code == 401


@pytest.mark.asyncio
async def test_logout_revocation(client: AsyncClient, admin_user: User):
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": admin_user.email, "password": "TestPass@123"},
    )
    rt = login_res.json()["data"]["refresh_token"]

    # Logout
    logout_res = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": rt},
    )
    assert logout_res.status_code == 200

    # Refreshing revoked token should fail
    refresh_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": rt},
    )
    assert refresh_res.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, admin_headers: dict, admin_user: User):
    response = await client.get("/api/v1/auth/me", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["data"]["email"] == admin_user.email
