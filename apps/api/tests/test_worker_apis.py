import pytest
from httpx import AsyncClient
import uuid
from apps.api.app.tasks.models import TaskPriority, TaskStatus
from apps.api.app.users.models import UserRole


@pytest.mark.asyncio
async def test_worker_mobile_workflow(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Setup client, workflow, and product
    client_res = await client.post(
        "/api/v1/clients",
        headers=headers,
        json={"client_code": f"CLI-{uuid.uuid4().hex[:6]}", "organization_name": "Worker Test Factory"},
    )
    client_id = client_res.json()["data"]["id"]

    wf_res = await client.post(
        "/api/v1/workflows/templates",
        headers=headers,
        json={
            "code": f"WF-{uuid.uuid4().hex[:6]}",
            "name": "Worker Assembly Flow",
            "steps": [
                {
                    "name": "Ultrasonic Lanyard Assembly & Cutting",
                    "step_type": "PRODUCTION",
                    "sequence_order": 1,
                    "required_role": "ADMIN",
                    "instructions": "Ensure 90cm cut length and metallic clamp crimping.",
                    "depends_on_indices": [],
                }
            ],
        },
    )
    tmpl_id = wf_res.json()["data"]["id"]

    prod_res = await client.post(
        "/api/v1/products",
        headers=headers,
        json={
            "code": f"PRD-{uuid.uuid4().hex[:6]}",
            "name": "Testing Worker Lanyard",
            "unit": "PCS",
            "default_workflow_template_id": tmpl_id,
        },
    )
    prod_id = prod_res.json()["data"]["id"]

    order_res = await client.post(
        "/api/v1/orders",
        headers=headers,
        json={"client_id": client_id, "items": [{"product_id": prod_id, "quantity": 1000}]},
    )
    order_id = order_res.json()["data"]["id"]
    order_item_id = order_res.json()["data"]["items"][0]["id"]

    # 2. Get auto-generated tasks
    tasks_res = await client.get(f"/api/v1/orders/{order_id}/tasks", headers=headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()["data"]
    assert len(tasks) >= 1
    task_id = tasks[0]["id"]

    # 4. Fetch tasks via Worker Mobile API (`/worker/tasks`)
    worker_tasks = await client.get("/api/v1/worker/tasks", headers=headers)
    assert worker_tasks.status_code == 200
    task_list = worker_tasks.json()["data"]
    assert any(t["id"] == task_id for t in task_list)

    # 5. Get detail via `/worker/tasks/{id}`
    detail_res = await client.get(f"/api/v1/worker/tasks/{task_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["data"]["title"] == "Ultrasonic Lanyard Assembly & Cutting"

    # 6. Start Task via `/worker/tasks/{id}/start`
    start_res = await client.post(f"/api/v1/worker/tasks/{task_id}/start", headers=headers)
    assert start_res.status_code == 200

    # 7. Submit Quantities via `/worker/tasks/{id}/quantities`
    qty_res = await client.post(
        f"/api/v1/worker/tasks/{task_id}/quantities",
        headers=headers,
        json={
            "good_quantity": 980,
            "reject_quantity": 20,
            "defect_reason": "Ultrasonic blade misalignment on setup test",
        },
    )
    assert qty_res.status_code == 200

    # 8. Complete Task via `/worker/tasks/{id}/complete`
    comp_res = await client.post(f"/api/v1/worker/tasks/{task_id}/complete?notes=BatchFinished", headers=headers)
    assert comp_res.status_code == 200
