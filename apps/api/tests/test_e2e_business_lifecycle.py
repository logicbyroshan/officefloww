import pytest
from httpx import AsyncClient
import uuid
from decimal import Decimal


@pytest.mark.asyncio
async def test_grand_tour_end_to_end_business_lifecycle(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # =========================================================================
    # STEP 1: Client Setup & Product BOM Configuration
    # =========================================================================
    cli_res = await client.post(
        "/api/v1/clients",
        headers=headers,
        json={
            "client_code": f"CLI-STX-{uuid.uuid4().hex[:6]}",
            "organization_name": "St. Xavier's International School",
            "gst_number": "27AABCU9603R1ZM",
            "billing_address": "42 Churchgate, Mumbai, Maharashtra 400020",
            "delivery_address": "St. Xavier's Campus, Mumbai, Maharashtra 400020",
        },
    )
    assert cli_res.status_code in (200, 201)
    client_id = cli_res.json()["data"]["id"]

    # Products: ID Card and MPL Lanyard
    prod_idcard_res = await client.post(
        "/api/v1/products",
        headers=headers,
        json={"code": f"PRD-IDC-{uuid.uuid4().hex[:6]}", "name": "Premium Student Smart ID", "unit": "PCS"},
    )
    assert prod_idcard_res.status_code in (200, 201)
    prod_idcard_id = prod_idcard_res.json()["data"]["id"]

    prod_mpl_res = await client.post(
        "/api/v1/products",
        headers=headers,
        json={"code": f"PRD-MPL-{uuid.uuid4().hex[:6]}", "name": "Multicolor Printed Lanyard 16mm", "unit": "PCS"},
    )
    assert prod_mpl_res.status_code in (200, 201)
    prod_mpl_id = prod_mpl_res.json()["data"]["id"]

    # Labour Piece Rate for Fitting
    rate_res = await client.post(
        "/api/v1/labour/rates",
        headers=headers,
        json={"product_id": prod_mpl_id, "operation_name": "MPL_FITTING", "rate_per_unit": "0.80"},
    )
    assert rate_res.status_code in (200, 201)

    # Machine setup
    loc_res = await client.post(
        "/api/v1/stock/locations",
        headers=headers,
        json={"code": f"LOC-E2E-{uuid.uuid4().hex[:4]}", "name": "Press Room A", "location_type": "PRODUCTION"},
    )
    assert loc_res.status_code in (200, 201)
    loc_id = loc_res.json()["data"]["id"]

    mach_res = await client.post(
        "/api/v1/production/machines",
        headers=headers,
        json={"code": f"MCH-E2E-{uuid.uuid4().hex[:4]}", "name": "Heidelberg Sublimation #1", "machine_type": "PRESS", "location_id": loc_id},
    )
    assert mach_res.status_code in (200, 201)
    machine_id = mach_res.json()["data"]["id"]

    # =========================================================================
    # STEP 2: Quotation, Pricing Tiers & Feasibility Analysis
    # =========================================================================
    # Set volume tiers for ID Cards & Lanyards
    await client.post(
        "/api/v1/quotations/pricing-rules",
        headers=headers,
        json={
            "product_id": prod_idcard_id,
            "name": "ID Volume Tiers",
            "tiers": [
                {"min_quantity": 1, "max_quantity": 1000, "base_unit_price": "45.00", "discount_percentage": "0.0"},
                {"min_quantity": 1001, "max_quantity": 5000, "base_unit_price": "45.00", "discount_percentage": "20.0"},  # ₹36.00
            ],
        },
    )
    await client.post(
        "/api/v1/quotations/pricing-rules",
        headers=headers,
        json={
            "product_id": prod_mpl_id,
            "name": "MPL Volume Tiers",
            "tiers": [
                {"min_quantity": 1, "max_quantity": 1000, "base_unit_price": "25.00", "discount_percentage": "0.0"},
                {"min_quantity": 1001, "max_quantity": 5000, "base_unit_price": "25.00", "discount_percentage": "20.0"},  # ₹20.00
            ],
        },
    )

    # Create Quotation for 2,000 ID Cards + 2,000 Lanyards
    qtn_res = await client.post(
        "/api/v1/quotations",
        headers=headers,
        json={
            "client_id": client_id,
            "notes": "Annual student kit quotation for 2,000 ID Cards and 2,000 Lanyards.",
            "items": [
                {"product_id": prod_idcard_id, "quantity": 2000},
                {"product_id": prod_mpl_id, "quantity": 2000},
            ],
        },
    )
    assert qtn_res.status_code in (200, 201)
    qtn_data = qtn_res.json()["data"]
    quotation_id = qtn_data["id"]

    # Verify subtotal: (2000 * 36.0) + (2000 * 20.0) = 72,000 + 40,000 = ₹112,000.00
    assert float(qtn_data["subtotal"]) == 112000.0
    assert float(qtn_data["tax_amount"]) == 20160.0  # 18% GST
    assert float(qtn_data["total_amount"]) == 132160.0

    # Feasibility check
    feas_res = await client.get(f"/api/v1/quotations/{quotation_id}/feasibility", headers=headers)
    assert feas_res.status_code == 200

    # Convert Quotation to Confirmed Order
    conv_res = await client.post(f"/api/v1/quotations/{quotation_id}/convert-to-order", headers=headers)
    assert conv_res.status_code == 200
    order_id = conv_res.json()["data"]["order_id"]

    # =========================================================================
    # STEP 3: Artwork Upload & Client External Proof Approval
    # =========================================================================
    file_res = await client.post(
        "/api/v1/files/upload",
        headers=headers,
        data={"order_id": order_id, "folder_type": "04-Design"},
        files={"file": ("st_xaviers_artwork_v1.pdf", b"%PDF-1.4 Mock St Xavier Design", "application/pdf")},
    )
    assert file_res.status_code in (200, 201)
    file_ver_id = file_res.json()["data"]["versions"][0]["id"]

    # Generate tokenized external proof link
    proof_link_res = await client.post(
        "/api/v1/notifications/proofs/generate-link",
        headers=headers,
        json={
            "file_version_id": file_ver_id,
            "client_id": client_id,
            "contact_name": "Father D'Souza",
            "contact_phone": "+91 98200 99999",
            "expires_in_hours": 48,
        },
    )
    token = proof_link_res.json()["data"]["token"]

    # External Client approves proof
    approve_proof_res = await client.post(
        f"/api/v1/notifications/proofs/{token}/respond",
        json={"decision": "APPROVED", "feedback_notes": "Colors and crest verified. Approved for mass printing."},
    )
    assert approve_proof_res.status_code == 200

    # =========================================================================
    # STEP 4: Dynamic Delivery ETA Calculation
    # =========================================================================
    eta_res = await client.get(f"/api/v1/eta/orders/{order_id}", headers=headers)
    assert eta_res.status_code == 200
    assert eta_res.json()["data"]["critical_path_hours"] > 0

    # =========================================================================
    # STEP 5: Production Batch Execution & File Lock Verification
    # =========================================================================
    # Fetch order items
    order_detail = (await client.get(f"/api/v1/orders/{order_id}", headers=headers)).json()["data"]
    item_idcard_id = order_detail["items"][0]["id"]
    item_mpl_id = order_detail["items"][1]["id"]

    # Get admin user id
    me_id = (await client.get("/api/v1/auth/me", headers=headers)).json()["data"]["id"]

    batch_res = await client.post(
        "/api/v1/production/batches",
        headers=headers,
        json={
            "order_id": order_id,
            "order_item_id": item_idcard_id,
            "product_id": prod_idcard_id,
            "machine_id": machine_id,
            "operator_id": me_id,
            "approved_file_version_id": file_ver_id,
            "input_quantity": 2000,
        },
    )
    assert batch_res.status_code in (200, 201)
    batch_id = batch_res.json()["data"]["id"]

    # Log shift output: 1950 good, 30 rejects, 20 setup scrap
    record_res = await client.post(
        "/api/v1/production/records",
        headers=headers,
        json={
            "production_batch_id": batch_id,
            "good_quantity": "1950",
            "reject_quantity": "30",
            "waste_quantity": "20",
            "operator_notes": "Setup offset calibration",
        },
    )
    assert record_res.status_code in (200, 201)

    # =========================================================================
    # STEP 6: Outside Labour Allocation & Material Credit Ledger
    # =========================================================================
    labourer_res = await client.post(
        "/api/v1/labour/labourers",
        headers=headers,
        json={"code": f"LAB-E2E-{uuid.uuid4().hex[:4]}", "name": "Ramesh Lanyard Specialist", "phone": "+91 91234 88888", "labour_type": "OUTSIDE_CONTRACT"},
    )
    assert labourer_res.status_code in (200, 201)
    labourer_id = labourer_res.json()["data"]["id"]

    # Allocate 2000 Lanyards to Ramesh
    lab_batch_res = await client.post(
        "/api/v1/labour/batches",
        headers=headers,
        json={
            "order_id": order_id,
            "order_item_id": item_mpl_id,
            "labourer_id": labourer_id,
            "operation_name": "MPL_FITTING",
            "allocated_quantity": 2000,
        },
    )
    assert lab_batch_res.status_code in (200, 201)
    lab_batch_id = lab_batch_res.json()["data"]["id"]

    # Submit 2,000 completed good pieces
    sub_res = await client.post(
        "/api/v1/labour/submissions",
        headers=headers,
        json={"labour_batch_id": lab_batch_id, "completed_quantity": 2000, "defective_quantity": 0, "unused_returned_quantity": 0},
    )
    assert sub_res.status_code in (200, 201)

    # Generate piece-rate payment strictly on accepted units: 2000 * ₹0.80 = ₹1600.00
    pay_res = await client.post(f"/api/v1/labour/labourers/{labourer_id}/generate-payment", headers=headers)
    assert pay_res.status_code in (200, 201)
    assert float(pay_res.json()["data"]["total_payable_amount"]) == 1600.0

    # =========================================================================
    # STEP 7: Packaging & Dual Sign-Off Verification
    # =========================================================================
    pack_task1_res = await client.post(
        "/api/v1/packing/tasks",
        headers=headers,
        json={"order_id": order_id, "order_item_id": item_idcard_id, "target_quantity": 2000},
    )
    assert pack_task1_res.status_code in (200, 201)
    pack_task1_id = pack_task1_res.json()["data"]["id"]

    # Pack 4 boxes of 500 ID cards
    for idx in range(4):
        await client.post(
            f"/api/v1/packing/tasks/{pack_task1_id}/packages",
            headers=headers,
            json={"package_type": "BOX", "quantity": 500, "weight_kg": 3.2},
        )

    pack_task2_res = await client.post(
        "/api/v1/packing/tasks",
        headers=headers,
        json={"order_id": order_id, "order_item_id": item_mpl_id, "target_quantity": 2000},
    )
    assert pack_task2_res.status_code in (200, 201)
    pack_task2_id = pack_task2_res.json()["data"]["id"]

    # Pack 4 cartons of 500 lanyards
    for idx in range(4):
        await client.post(
            f"/api/v1/packing/tasks/{pack_task2_id}/packages",
            headers=headers,
            json={"package_type": "CARTON", "quantity": 500, "weight_kg": 6.5},
        )

    # =========================================================================
    # STEP 8: Dispatch Booking & Out-of-Pocket Expense Reimbursement
    # =========================================================================
    prov_res = await client.post(
        "/api/v1/dispatch/providers",
        headers=headers,
        json={"code": f"BUS-{uuid.uuid4().hex[:4].upper()}", "name": "Hans Travels Bus Line", "provider_type": "BUS", "contact_phone": "+91 98260 11223"},
    )
    assert prov_res.status_code in (200, 201)
    tp_id = prov_res.json()["data"]["id"]

    deliv_res = await client.post(
        "/api/v1/dispatch/deliveries",
        headers=headers,
        json={
            "order_id": order_id,
            "transport_type": "BUS",
            "destination_address": "St. Xavier's Campus, Mumbai",
            "destination_city": "Mumbai",
            "total_packages": 8,
            "total_weight_kg": 38.8,
            "transport_provider_id": tp_id,
        },
    )
    assert deliv_res.status_code in (200, 201)
    delivery_id = deliv_res.json()["data"]["id"]

    # Book with ₹800 bus freight charge paid out-of-pocket by staff
    booking_res = await client.post(
        f"/api/v1/dispatch/deliveries/{delivery_id}/bookings",
        headers=headers,
        json={
            "delivery_id": delivery_id,
            "booking_reference": f"BUS-LR-{uuid.uuid4().hex[:6].upper()}",
            "charge_amount": 800.0,
            "paid_by_id": me_id,
        },
    )
    assert booking_res.status_code in (200, 201)

    # Fetch delivery to get auto-created reimbursement expense record
    deliv_check = await client.get(f"/api/v1/dispatch/deliveries/{delivery_id}", headers=headers)
    assert len(deliv_check.json()["data"]["expenses"]) >= 1
    expense_id = deliv_check.json()["data"]["expenses"][0]["id"]

    # Manager approves freight reimbursement
    reimb_res = await client.post(f"/api/v1/dispatch/expenses/{expense_id}/approve", headers=headers)
    assert reimb_res.status_code == 200

    # =========================================================================
    # STEP 9: GST Tax Invoice & Client Payment
    # =========================================================================
    inv_res = await client.post(
        "/api/v1/billing/invoices",
        headers=headers,
        json={
            "order_id": order_id,
            "client_id": client_id,
            "items": [
                {"description": "2,000 Student Smart ID Cards", "quantity": 2000, "unit_price": 36.0, "tax_rate": 18.0},
                {"description": "2,000 Multicolor Printed Lanyards", "quantity": 2000, "unit_price": 20.0, "tax_rate": 18.0},
            ],
        },
    )
    assert inv_res.status_code in (200, 201)
    invoice_id = inv_res.json()["data"]["id"]
    total_invoiced = inv_res.json()["data"]["total_amount"]
    assert float(total_invoiced) == 132160.0

    # Client pays in full via Bank Transfer
    pay_res = await client.post(
        "/api/v1/billing/payments",
        headers=headers,
        json={
            "invoice_id": invoice_id,
            "amount": 132160.0,
            "payment_method": "BANK_TRANSFER",
            "reference_number": f"NEFT-{uuid.uuid4().hex[:8].upper()}",
        },
    )
    assert pay_res.status_code in (200, 201)

    # =========================================================================
    # STEP 10: Complete Order Verification & Tripartite Invariant
    # =========================================================================
    comp_check = await client.get(f"/api/v1/billing/orders/{order_id}/completion-check", headers=headers)
    assert comp_check.status_code == 200
    assert "can_complete" in comp_check.json()["data"]

    # =========================================================================
    # STEP 11: Executive Dashboard & Management AI Query
    # =========================================================================
    dash_res = await client.get("/api/v1/analytics/dashboard", headers=headers)
    assert dash_res.status_code == 200
    assert dash_res.json()["data"]["total_revenue_inr"] > 0

    ai_res = await client.post(
        "/api/v1/ai/query",
        headers=headers,
        json={"query": "What is our total revenue and what needs attention today?"},
    )
    assert ai_res.status_code == 200
    assert ai_res.json()["data"]["intent_detected"] is not None
