import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from apps.api.app.workflows.models import StepType
from apps.api.app.users.models import UserRole


@pytest.mark.asyncio
async def test_multi_product_order_and_independent_workflows(
    client: AsyncClient, admin_headers: dict
):
    # 1. Setup client
    client_res = await client.post(
        "/api/v1/clients",
        headers=admin_headers,
        json={"client_code": "CLI-ORD-TEST", "organization_name": "Delhi Public School"},
    )
    client_id = client_res.json()["data"]["id"]

    # 2. Setup ID Card workflow template with parallel steps (Data + Photo)
    wf1_res = await client.post(
        "/api/v1/workflows/templates",
        headers=admin_headers,
        json={
            "code": "WF-TEST-ID",
            "name": "ID Card Test Workflow",
            "steps": [
                {"name": "Data Step", "step_type": "DATA", "sequence_order": 1, "depends_on_indices": []},
                {"name": "Photo Step", "step_type": "PHOTOGRAPHY", "sequence_order": 1, "depends_on_indices": []},
                {"name": "Design Step", "step_type": "DESIGN", "sequence_order": 2, "depends_on_indices": [0, 1]},
                {"name": "Print Step", "step_type": "PRINTING", "sequence_order": 3, "depends_on_indices": [2]},
            ],
        },
    )
    tmpl1_id = wf1_res.json()["data"]["id"]

    # 3. Setup Lanyard workflow template (Linear: Design -> Print)
    wf2_res = await client.post(
        "/api/v1/workflows/templates",
        headers=admin_headers,
        json={
            "code": "WF-TEST-LAN",
            "name": "Lanyard Test Workflow",
            "steps": [
                {"name": "Lanyard Design", "step_type": "DESIGN", "sequence_order": 1, "depends_on_indices": []},
                {"name": "Lanyard Print", "step_type": "PRINTING", "sequence_order": 2, "depends_on_indices": [0]},
            ],
        },
    )
    tmpl2_id = wf2_res.json()["data"]["id"]

    # 4. Create two products linked to these templates
    prod1_res = await client.post(
        "/api/v1/products",
        headers=admin_headers,
        json={
            "code": "PRD-ID-TEST",
            "name": "School ID Card",
            "unit": "PCS",
            "default_workflow_template_id": tmpl1_id,
        },
    )
    prod1_id = prod1_res.json()["data"]["id"]

    prod2_res = await client.post(
        "/api/v1/products",
        headers=admin_headers,
        json={
            "code": "PRD-LAN-TEST",
            "name": "School Lanyard",
            "unit": "PCS",
            "default_workflow_template_id": tmpl2_id,
        },
    )
    prod2_id = prod2_res.json()["data"]["id"]

    # 5. Place Multi-Product Order
    order_res = await client.post(
        "/api/v1/orders",
        headers=admin_headers,
        json={
            "order_number": "ORD-TEST-001",
            "client_id": client_id,
            "items": [
                {"product_id": prod1_id, "quantity": 1000, "unit_price": 50.0},
                {"product_id": prod2_id, "quantity": 1000, "unit_price": 30.0},
            ],
        },
    )
    assert order_res.status_code == 200
    order_data = order_res.json()["data"]
    order_id = order_data["id"]
    assert order_data["total_amount"] == 80000.0  # 1000*50 + 1000*30
    assert len(order_data["items"]) == 2

    wf_inst1 = order_data["items"][0]["workflow_instance_id"]
    wf_inst2 = order_data["items"][1]["workflow_instance_id"]
    assert wf_inst1 is not None
    assert wf_inst2 is not None
    assert wf_inst1 != wf_inst2  # Independent workflow instances!

    # 6. Verify Workflows and parallel steps
    wf_res = await client.get(f"/api/v1/orders/{order_id}/workflow", headers=admin_headers)
    assert wf_res.status_code == 200
    workflows = wf_res.json()["data"]
    assert len(workflows) == 2

    # Find ID card workflow instance
    id_wf = next(w for w in workflows if w["id"] == wf_inst1)
    steps = id_wf["step_instances"]
    assert len(steps) == 4

    data_step = next(s for s in steps if s["step_type"] == "DATA")
    photo_step = next(s for s in steps if s["step_type"] == "PHOTOGRAPHY")
    design_step = next(s for s in steps if s["step_type"] == "DESIGN")

    # Parallel initial steps with 0 dependencies must be READY
    assert data_step["status"] == "READY"
    assert photo_step["status"] == "READY"
    # Step depending on both must be PENDING
    assert design_step["status"] == "PENDING"

    # 7. Check generated tasks for this order
    tasks_res = await client.get(f"/api/v1/orders/{order_id}/tasks", headers=admin_headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()["data"]
    # We should have tasks for: ID Data, ID Photo, and Lanyard Design
    assert len(tasks) == 3
    task_titles = [t["title"] for t in tasks]
    assert "Data Step" in task_titles
    assert "Photo Step" in task_titles
    assert "Lanyard Design" in task_titles
