import asyncio
import uuid
from decimal import Decimal
import pytest
from httpx import AsyncClient

from apps.api.app.core.security import create_access_token
from apps.api.app.users.models import User, UserRole
from apps.api.app.clients.models import Client
from apps.api.app.products.models import Product, ProductCategory, BillOfMaterials, BOMItem
from apps.api.app.orders.models import Order, OrderItem, OrderStatus, OrderPriority, OrderItemStatus
from apps.api.app.stock.models import StockLocation, StockItem, StockLot
from apps.api.app.billing.models import Invoice, InvoiceStatus


@pytest.mark.asyncio
async def test_concurrent_stock_reservations(client: AsyncClient, db_session):
    admin = User(
        email=f"admin.conc.{uuid.uuid4().hex[:6]}@officefloww.com",
        hashed_password="hashed_pw",
        full_name="Concurrency Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)

    token = create_access_token(subject=str(admin.id), role=admin.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    # Setup Product, BOM & Order
    cat = ProductCategory(name="Lanyards", code=f"LANY-{uuid.uuid4().hex[:4].upper()}")
    db_session.add(cat)
    await db_session.flush()

    prod = Product(name="Concurrent MPL", code=f"MPL-{uuid.uuid4().hex[:4].upper()}", category_id=cat.id)
    db_session.add(prod)
    await db_session.flush()

    bom = BillOfMaterials(product_id=prod.id, version=1, is_active=True)
    db_session.add(bom)
    await db_session.flush()

    bom_item = BOMItem(bom_id=bom.id, component_name="Nylon Tape", quantity_per_unit=Decimal("1.0"), unit="METERS", wastage_percentage=Decimal("0.0"))
    db_session.add(bom_item)
    await db_session.flush()

    cust = Client(organization_name="Concurrent Corp", client_code=f"CLI-{uuid.uuid4().hex[:6].upper()}", is_active=True)
    db_session.add(cust)
    await db_session.flush()

    order = Order(order_number=f"ORD-{uuid.uuid4().hex[:6].upper()}", client_id=cust.id, status=OrderStatus.CONFIRMED, priority=OrderPriority.NORMAL, total_amount=Decimal("50000.0"))
    db_session.add(order)
    await db_session.flush()

    order_item = OrderItem(order_id=order.id, product_id=prod.id, quantity=1000, unit_price=Decimal("25.0"), status=OrderItemStatus.PENDING)
    db_session.add(order_item)
    await db_session.commit()

    # Execute repeated BOM reservation calculations
    for _ in range(3):
        resp = await client.post(
            f"/api/v1/stock/orders/{order.id}/items/{order_item.id}/calculate-bom",
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["order_id"] == str(order.id)
        assert len(data["requirements"]) == 1


@pytest.mark.asyncio
async def test_concurrent_payment_recording_integrity(client: AsyncClient, db_session):
    admin = User(
        email=f"admin.pay.{uuid.uuid4().hex[:6]}@officefloww.com",
        hashed_password="hashed_pw",
        full_name="Payment Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)

    token = create_access_token(subject=str(admin.id), role=admin.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    cust = Client(organization_name="Pay Client", client_code=f"CLI-P-{uuid.uuid4().hex[:6].upper()}", is_active=True)
    db_session.add(cust)
    await db_session.flush()

    order = Order(order_number=f"ORD-P-{uuid.uuid4().hex[:6].upper()}", client_id=cust.id, status=OrderStatus.CONFIRMED, priority=OrderPriority.NORMAL, total_amount=Decimal("11800.0"))
    db_session.add(order)
    await db_session.flush()

    inv = Invoice(
        invoice_number=f"INV-P-{uuid.uuid4().hex[:6].upper()}",
        order_id=order.id,
        client_id=cust.id,
        status=InvoiceStatus.ISSUED,
        subtotal=Decimal("10000.0"),
        tax_amount=Decimal("1800.0"),
        total_amount=Decimal("11800.0"),
        paid_amount=Decimal("0.0"),
    )
    db_session.add(inv)
    await db_session.commit()
    await db_session.refresh(inv)

    # 1. First partial payment
    p1 = await client.post(
        "/api/v1/billing/payments",
        headers=headers,
        json={
            "invoice_id": str(inv.id),
            "amount": 5900.0,
            "payment_method": "BANK_TRANSFER",
            "reference_number": f"NEFT-{uuid.uuid4().hex[:8].upper()}",
        },
    )
    assert p1.status_code == 201

    # 2. Second partial payment completing balance
    p2 = await client.post(
        "/api/v1/billing/payments",
        headers=headers,
        json={
            "invoice_id": str(inv.id),
            "amount": 5900.0,
            "payment_method": "BANK_TRANSFER",
            "reference_number": f"NEFT-{uuid.uuid4().hex[:8].upper()}",
        },
    )
    assert p2.status_code == 201

    # Verify total paid in database
    inv_check = await client.get(f"/api/v1/billing/invoices/{inv.id}", headers=headers)
    assert inv_check.status_code == 200
    inv_data = inv_check.json()["data"]
    assert Decimal(str(inv_data["paid_amount"])) == Decimal("11800.0")
    assert inv_data["status"] == "PAID"
