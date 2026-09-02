import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_task_advancement_and_blockers(client: AsyncClient, admin_headers: dict):
    # Setup client, workflow, product, and order
    c_res = await client.post(
        "/api/v1/clients",
        headers=admin_headers,
        json={"client_code": "CLI-TSK-ADV", "organization_name": "Task Test School"},
    )
    client_id = c_res.json()["data"]["id"]

    wf_res = await client.post(
        "/api/v1/workflows/templates",
        headers=admin_headers,
        json={
            "code": "WF-DAG-CONVERGE",
            "name": "Parallel Converge Workflow",
            "steps": [
                {"name": "Parallel 1", "step_type": "DATA", "sequence_order": 1, "depends_on_indices": []},
                {"name": "Parallel 2", "step_type": "PHOTOGRAPHY", "sequence_order": 1, "depends_on_indices": []},
                {"name": "Merged Step", "step_type": "DESIGN", "sequence_order": 2, "depends_on_indices": [0, 1]},
            ],
        },
    )
    tmpl_id = wf_res.json()["data"]["id"]

    p_res = await client.post(
        "/api/v1/products",
        headers=admin_headers,
        json={"code": "PRD-TSK-01", "name": "Task Product", "default_workflow_template_id": tmpl_id},
    )
    prod_id = p_res.json()["data"]["id"]

    ord_res = await client.post(
        "/api/v1/orders",
        headers=admin_headers,
        json={
            "order_number": "ORD-DAG-001",
            "client_id": client_id,
            "items": [{"product_id": prod_id, "quantity": 500, "unit_price": 20.0}],
        },
    )
    order_id = ord_res.json()["data"]["id"]

    # Retrieve initial tasks
    tasks_res = await client.get(f"/api/v1/orders/{order_id}/tasks", headers=admin_headers)
    tasks = tasks_res.json()["data"]
    assert len(tasks) == 2  # Parallel 1 and Parallel 2

    task1 = next(t for t in tasks if t["title"] == "Parallel 1")
    task2 = next(t for t in tasks if t["title"] == "Parallel 2")

    # Complete only task 1
    c1_res = await client.post(f"/api/v1/tasks/{task1['id']}/complete", headers=admin_headers)
    assert c1_res.status_code == 200

    # Merged step should NOT be ready yet because task 2 is still pending
    t_check1 = await client.get(f"/api/v1/orders/{order_id}/tasks", headers=admin_headers)
    assert len(t_check1.json()["data"]) == 2

    # Test adding blocker to task 2
    block_res = await client.post(
        f"/api/v1/tasks/{task2['id']}/blockers",
        headers=admin_headers,
        json={"reason": "Camera lens broken, awaiting replacement."},
    )
    assert block_res.status_code == 200
    blocker_id = block_res.json()["data"]["id"]

    # Verify task 2 is now BLOCKED
    t2_get = await client.get(f"/api/v1/tasks/{task2['id']}", headers=admin_headers)
    assert t2_get.json()["data"]["status"] == "BLOCKED"

    # Attempting to complete a blocked task should fail
    fail_comp = await client.post(f"/api/v1/tasks/{task2['id']}/complete", headers=admin_headers)
    assert fail_comp.status_code == 400

    # Resolve blocker
    res_block = await client.post(
        f"/api/v1/tasks/blockers/{blocker_id}/resolve", headers=admin_headers
    )
    assert res_block.status_code == 200

    # Now complete task 2
    c2_res = await client.post(f"/api/v1/tasks/{task2['id']}/complete", headers=admin_headers)
    assert c2_res.status_code == 200

    # Now BOTH upstream steps are complete, so "Merged Step" should unlock!
    t_check2 = await client.get(f"/api/v1/orders/{order_id}/tasks", headers=admin_headers)
    all_tasks = t_check2.json()["data"]
    assert len(all_tasks) == 3
    merged_task = next(t for t in all_tasks if t["title"] == "Merged Step")
    assert merged_task["status"] == "READY"
