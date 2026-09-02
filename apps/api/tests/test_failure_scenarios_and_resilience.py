import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import pytest
from httpx import AsyncClient

from apps.api.app.core.security import create_access_token
from apps.api.app.users.models import User, UserRole
from apps.api.app.clients.models import Client
from apps.api.app.products.models import Product, ProductCategory, BillOfMaterials, BOMItem
from apps.api.app.orders.models import Order, OrderItem, OrderStatus, OrderPriority, OrderItemStatus
from apps.api.app.tasks.models import Task, TaskStatus, TaskPriority
from apps.api.app.files.models import File, FileVersion, FileApprovalStatus
from apps.api.app.production.models import Machine, MachineStatus, ProductionBatch, ProductionBatchStatus, ProductionRecord
from apps.api.app.stock.models import StockLocation, StockItem, StockLot


@pytest.mark.asyncio
async def test_failure_scenarios_and_system_resilience(client: AsyncClient, db_session):
    admin = User(
        email=f"admin.fail.{uuid.uuid4().hex[:6]}@officefloww.com",
        hashed_password="hashed_pw",
        full_name="Resilience Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    designer_1 = User(
        email=f"designer.1.{uuid.uuid4().hex[:6]}@officefloww.com",
        hashed_password="hashed_pw",
        full_name="Primary Designer",
        role=UserRole.DESIGNER,
        is_active=True,
    )
    designer_2 = User(
        email=f"designer.2.{uuid.uuid4().hex[:6]}@officefloww.com",
        hashed_password="hashed_pw",
        full_name="Backup Designer",
        role=UserRole.DESIGNER,
        is_active=True,
    )
    db_session.add_all([admin, designer_1, designer_2])
    await db_session.commit()
    await db_session.refresh(admin)
    await db_session.refresh(designer_1)
    await db_session.refresh(designer_2)

    token = create_access_token(subject=str(admin.id), role=admin.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    # =========================================================================
    # 1. Failure Scenario: Designer Absence & Substitute Handover
    # =========================================================================
    test_client = Client(organization_name="Absence Test Client", client_code=f"CLI-A-{uuid.uuid4().hex[:6].upper()}", is_active=True)
    db_session.add(test_client)
    await db_session.flush()

    dummy_order = Order(
        order_number=f"ORD-A-{uuid.uuid4().hex[:6].upper()}",
        client_id=test_client.id,
        status=OrderStatus.CONFIRMED,
        priority=OrderPriority.NORMAL,
        total_amount=Decimal("10000.0"),
    )
    db_session.add(dummy_order)
    await db_session.flush()

    dummy_item_id = uuid.uuid4()
    dummy_wf_id = uuid.uuid4()
    dummy_step_id = uuid.uuid4()

    task_1 = Task(
        title="Design ID Card Layout",
        task_code=f"TSK-{uuid.uuid4().hex[:6].upper()}",
        status=TaskStatus.IN_PROGRESS,
        priority=TaskPriority.HIGH,
        order_id=dummy_order.id,
        order_item_id=dummy_item_id,
        workflow_instance_id=dummy_wf_id,
        workflow_step_instance_id=dummy_step_id,
        assigned_user_id=designer_1.id,
        instructions="Complete front design for DPS School",
    )
    task_2 = Task(
        title="Vectorize School Logo",
        task_code=f"TSK-{uuid.uuid4().hex[:6].upper()}",
        status=TaskStatus.READY,
        priority=TaskPriority.NORMAL,
        order_id=dummy_order.id,
        order_item_id=dummy_item_id,
        workflow_instance_id=dummy_wf_id,
        workflow_step_instance_id=dummy_step_id,
        assigned_user_id=designer_1.id,
        instructions="Trace raster emblem",
    )
    db_session.add_all([task_1, task_2])
    await db_session.commit()

    # Plan absence for designer 1
    start_dt = datetime.now(timezone.utc).date()
    end_dt = start_dt + timedelta(days=3)
    absence_res = await client.post(
        "/api/v1/capacity/absence/plan-handover",
        headers=headers,
        json={
            "user_id": str(designer_1.id),
            "start_date": start_dt.strftime("%Y-%m-%d"),
            "end_date": end_dt.strftime("%Y-%m-%d"),
            "reason": "Sudden medical illness",
        },
    )
    assert absence_res.status_code == 201
    absence_id = absence_res.json()["data"]["absence_id"]

    # Query Handover Summary Endpoint
    summary_res = await client.get(f"/api/v1/capacity/absence/{absence_id}/summary", headers=headers)
    assert summary_res.status_code == 200
    summary_data = summary_res.json()["data"]
    assert summary_data["absent_user_name"] == "Primary Designer"
    assert summary_data["tasks_count"] == 2

    # Execute Handover
    exec_res = await client.post(f"/api/v1/capacity/absence/{absence_id}/execute-handover", headers=headers)
    assert exec_res.status_code == 200
    assert exec_res.json()["data"]["reassigned_tasks_count"] == 2

    # Verify tasks reassigned to backup designer
    t1_check = await client.get(f"/api/v1/tasks/{task_1.id}", headers=headers)
    assert t1_check.status_code == 200
    assert t1_check.json()["data"]["assigned_user_id"] == str(designer_2.id)

    # =========================================================================
    # 2. Failure Scenario: Stock Shortage Calculation
    # =========================================================================
    cat = ProductCategory(name="Shortage Category", code=f"CAT-S-{uuid.uuid4().hex[:4].upper()}")
    db_session.add(cat)
    await db_session.flush()

    prod = Product(name="Shortage Product", code=f"PRD-S-{uuid.uuid4().hex[:4].upper()}", category_id=cat.id)
    db_session.add(prod)
    await db_session.flush()

    bom = BillOfMaterials(product_id=prod.id, version=1, is_active=True)
    db_session.add(bom)
    await db_session.flush()

    bom_item = BOMItem(bom_id=bom.id, component_name="Rare Acrylic Sheet", quantity_per_unit=Decimal("1.0"), unit="SHEETS", wastage_percentage=Decimal("0.0"))
    db_session.add(bom_item)
    await db_session.flush()

    cust = Client(organization_name="Shortage Client", client_code=f"CLI-S-{uuid.uuid4().hex[:6].upper()}", is_active=True)
    db_session.add(cust)
    await db_session.flush()

    order = Order(order_number=f"ORD-S-{uuid.uuid4().hex[:6].upper()}", client_id=cust.id, status=OrderStatus.CONFIRMED, priority=OrderPriority.NORMAL, total_amount=Decimal("50000.0"))
    db_session.add(order)
    await db_session.flush()

    order_item = OrderItem(order_id=order.id, product_id=prod.id, quantity=500, unit_price=Decimal("100.0"), status=OrderItemStatus.PENDING)
    db_session.add(order_item)
    await db_session.commit()

    # Calculate BOM with 0 available stock in warehouse
    bom_calc_res = await client.post(
        f"/api/v1/stock/orders/{order.id}/items/{order_item.id}/calculate-bom",
        headers=headers,
    )
    assert bom_calc_res.status_code == 200
    calc_data = bom_calc_res.json()["data"]
    assert calc_data["has_shortage"] is True
    assert Decimal(str(calc_data["requirements"][0]["shortage"])) == Decimal("500.0")

    # =========================================================================
    # 3. Failure Scenario: Production Over-Allocation Rejection (700 + 700 + 700 > 2000)
    # =========================================================================
    target_item = OrderItem(order_id=order.id, product_id=prod.id, quantity=2000, unit_price=Decimal("100.0"), status=OrderItemStatus.PENDING)
    db_session.add(target_item)
    await db_session.flush()

    file_rec = File(filename="ApprovedArtwork.pdf", logical_path="/orders/proof.pdf", is_active=True)
    db_session.add(file_rec)
    await db_session.flush()

    file_ver = FileVersion(
        file_id=file_rec.id,
        version_number=1,
        approval_state=FileApprovalStatus.APPROVED,
        storage_key="/storage/proof.pdf",
        checksum="abc123sha",
        mime_type="application/pdf",
        file_size=1024,
    )
    db_session.add(file_ver)
    await db_session.flush()

    press = Machine(name="Press Heidelberg 01", code=f"MCH-{uuid.uuid4().hex[:4].upper()}", machine_type="OFFSET_PRINTER", status=MachineStatus.IDLE, is_active=True)
    db_session.add(press)
    await db_session.commit()

    # Create Batch 1 (700 units)
    b1_res = await client.post(
        "/api/v1/production/batches",
        headers=headers,
        json={
            "order_id": str(order.id),
            "order_item_id": str(target_item.id),
            "product_id": str(prod.id),
            "machine_id": str(press.id),
            "operator_id": str(admin.id),
            "approved_file_version_id": str(file_ver.id),
            "input_quantity": 700.0,
        },
    )
    assert b1_res.status_code == 201

    # Create Batch 2 (700 units)
    b2_res = await client.post(
        "/api/v1/production/batches",
        headers=headers,
        json={
            "order_id": str(order.id),
            "order_item_id": str(target_item.id),
            "product_id": str(prod.id),
            "machine_id": str(press.id),
            "operator_id": str(admin.id),
            "approved_file_version_id": str(file_ver.id),
            "input_quantity": 700.0,
        },
    )
    assert b2_res.status_code == 201

    # Attempt Batch 3 (700 units) -> 700 + 700 + 700 = 2100 > 2000 => MUST FAIL WITH HTTP 400!
    b3_res = await client.post(
        "/api/v1/production/batches",
        headers=headers,
        json={
            "order_id": str(order.id),
            "order_item_id": str(target_item.id),
            "product_id": str(prod.id),
            "machine_id": str(press.id),
            "operator_id": str(admin.id),
            "approved_file_version_id": str(file_ver.id),
            "input_quantity": 700.0,
        },
    )
    assert b3_res.status_code in (400, 422)
    err_msg = b3_res.json().get("error", {}).get("message") or b3_res.json().get("detail", "")
    assert "Over-allocation rejected" in err_msg

    # =========================================================================
    # 4. Failure Scenario: Duplicate Event Processing Idempotency
    # =========================================================================
    idem_key = f"IDEM-CONFIRM-{uuid.uuid4().hex}"
    evt1_res = await client.post(
        "/api/v1/automation/trigger",
        headers=headers,
        json={
            "event_name": "OrderConfirmed",
            "idempotency_key": idem_key,
            "payload": {"order_id": str(order.id), "total_amount": 50000.0},
        },
    )
    assert evt1_res.status_code == 200
    assert evt1_res.json()["data"]["event_name"] == "OrderConfirmed"

    # Second dispatch with identical idempotency key -> MUST BE SUPPRESSED!
    evt2_res = await client.post(
        "/api/v1/automation/trigger",
        headers=headers,
        json={
            "event_name": "OrderConfirmed",
            "idempotency_key": idem_key,
            "payload": {"order_id": str(order.id), "total_amount": 50000.0},
        },
    )
    assert evt2_res.status_code == 200
    assert evt2_res.json()["data"]["status"] == "IDEMPOTENT_SUPPRESSED"

    # =========================================================================
    # 5. Failure Scenario: Production Material Discrepancy Detection
    # =========================================================================
    batch_1_id = b1_res.json()["data"]["id"]
    # Log 600 good, 50 reject, 30 waste (Total = 680 accounted out of 700 input => 20 unaccounted discrepancy!)
    log_res = await client.post(
        "/api/v1/production/records",
        headers=headers,
        json={
            "production_batch_id": batch_1_id,
            "good_quantity": 600.0,
            "reject_quantity": 50.0,
            "waste_quantity": 30.0,
        },
    )
    assert log_res.status_code == 201

    # Complete batch
    comp_res = await client.post(f"/api/v1/production/batches/{batch_1_id}/complete", headers=headers)
    assert comp_res.status_code == 200

    # Check reconciliation report
    reconcile_res = await client.get(f"/api/v1/production/order-items/{target_item.id}/reconciliation", headers=headers)
    assert reconcile_res.status_code == 200
    reconcile_data = reconcile_res.json()["data"]
    assert Decimal(str(reconcile_data["unaccounted_discrepancy"])) == Decimal("20.0")

    # =========================================================================
    # 6. Failure Scenario: Notification Transport Resilience
    # =========================================================================
    notif_res = await client.post(
        "/api/v1/notifications/send",
        headers=headers,
        json={
            "channel": "WHATSAPP",
            "title": "Test Alert",
            "body": "Your order is ready",
        },
    )
    assert notif_res.status_code == 201
    assert notif_res.json()["data"]["status"] == "SENT"
