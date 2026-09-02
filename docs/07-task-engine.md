# 07. Task Engine - OfficeFloww

## Overview
While the **Workflow Engine** governs the global lifecycle of an order item, the **Task Engine** translates active workflow steps into actionable, assignable work queues for operators on the factory floor.

---

## Task Entity & Business Context
Every task preserves full contextual ancestry:
- `task_code`: Unique identifier (e.g. `TSK-DAT-A1B2C3`).
- `order_id` & `order_item_id`: Business order link.
- `workflow_instance_id` & `workflow_step_instance_id`: Workflow step link.
- `assigned_user_id` & `assigned_role`: Who can perform the work.
- `priority` & `priority_score`: Scheduling urgency (`LOW`, `NORMAL`, `HIGH`, `URGENT`).
- `status`: `PENDING`, `READY`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `CANCELLED`.
- `due_date`, `started_at`, `completed_at`.

---

## Task Blockers
In a real factory, unexpected obstacles interrupt work (e.g. broken machine part, missing client approval, corrupted photo file).

1. **Adding a Blocker**:
   - Operator posts to `POST /api/v1/tasks/{task_id}/blockers` with the reason.
   - The engine automatically updates `task.status = BLOCKED`.
   - Any attempt to complete a blocked task is rejected by the server with HTTP 400 (`BUSINESS_RULE_VIOLATION`).
2. **Resolving a Blocker**:
   - Manager or authorized user calls `POST /api/v1/tasks/blockers/{blocker_id}/resolve`.
   - When all active blockers on the task are resolved, `task.status` automatically reverts to `READY`.

---

## Completion & Automatic Workflow Trigger
When an operator completes a task via `POST /api/v1/tasks/{task_id}/complete`:
1. The task is marked `COMPLETED` and timestamped.
2. The linked `WorkflowStepInstance` is transitioned to `COMPLETED`.
3. The workflow engine is invoked to evaluate downstream dependencies.
4. Downstream steps that have all prerequisites satisfied transition to `READY`, and the task engine automatically generates tasks for those newly unlocked steps.
5. An immutable entry is appended to `audit_logs`.
