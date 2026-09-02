import uuid
from decimal import Decimal
import pytest
from httpx import AsyncClient

from apps.api.app.core.security import create_access_token
from apps.api.app.users.models import User, UserRole


@pytest.mark.asyncio
async def test_stock_lot_and_material_traceability(client: AsyncClient, db_session):
    admin = User(
        email=f"admin.trace.{uuid.uuid4().hex[:6]}@officefloww.com",
        hashed_password="hashed_pw",
        full_name="Trace Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)

    token = create_access_token(subject=str(admin.id), role=admin.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Location
    loc_code = f"LOC-{uuid.uuid4().hex[:6].upper()}"
    loc_res = await client.post(
        "/api/v1/stock/locations",
        headers=headers,
        json={"code": loc_code, "name": "Traceability Store", "location_type": "MAIN_STORE"},
    )
    assert loc_res.status_code == 201
    loc_id = loc_res.json()["data"]["id"]

    # 2. Create Stock Item
    item_code = f"RAW-SATIN-{uuid.uuid4().hex[:6].upper()}"
    item_res = await client.post(
        "/api/v1/stock/items",
        headers=headers,
        json={"code": item_code, "name": "Premium Satin Ribbon 20mm", "unit": "METERS", "cost_price": 4.50},
    )
    assert item_res.status_code == 201
    item_id = item_res.json()["data"]["id"]

    # 3. Create Stock Lot
    lot_number = f"LOT-SATIN-{uuid.uuid4().hex[:6].upper()}"
    lot_res = await client.post(
        "/api/v1/stock/lots",
        headers=headers,
        json={
            "stock_item_id": item_id,
            "location_id": loc_id,
            "lot_number": lot_number,
            "quantity": 5000.0,
            "cost_per_unit": 4.50,
        },
    )
    assert lot_res.status_code == 201
    lot_id = lot_res.json()["data"]["id"]

    # 4. Record stock movement (issue)
    mov_res = await client.post(
        "/api/v1/stock/movements",
        headers=headers,
        json={
            "stock_item_id": item_id,
            "movement_type": "ISSUE",
            "quantity": 1000.0,
            "from_location_id": loc_id,
            "reason": "Test Production Run",
        },
    )
    assert mov_res.status_code == 201

    # 5. Query Lot Traceability Endpoint
    trace_res = await client.get(f"/api/v1/stock/traceability/lot/{lot_id}", headers=headers)
    assert trace_res.status_code == 200
    trace_data = trace_res.json()["data"]

    assert trace_data["lot_id"] == lot_id
    assert trace_data["lot_number"] == lot_number
    assert trace_data["stock_item_code"] == item_code
    assert trace_data["stock_item_name"] == "Premium Satin Ribbon 20mm"
    assert len(trace_data["movements_history"]) >= 1
    assert trace_data["movements_history"][0]["movement_type"] == "ISSUE"
    assert trace_data["movements_history"][0]["quantity"] == 1000.0
