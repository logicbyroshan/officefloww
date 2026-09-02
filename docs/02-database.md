# 02. Database Architecture - OfficeFloww

## Overview
OfficeFloww utilizes **PostgreSQL 16+** in production and containerized environments, accessed asynchronously via **SQLAlchemy 2.0**.
All database schema evolution is strictly governed by **Alembic** migrations. Production and staging schemas are never manually modified.

---

## Core Conventions
1. **Primary Keys**: All primary keys are UUIDv4 values (`sa.Uuid(as_uuid=True)`), preventing sequential ID scraping and supporting offline mobile entity generation.
2. **Timestamps**: Every table inherits `created_at` and `updated_at` (timezone-aware UTC).
3. **Foreign Keys & Cascades**:
   - Dependent child rows (e.g. `ClientContact`, `BOMItem`, `WorkflowStepInstanceDependency`, `TaskBlocker`) use `ON DELETE CASCADE`.
   - Structural business entities (e.g. `Client`, `Product`, `WorkflowTemplate`) use `ON DELETE RESTRICT` to prevent accidental loss of operational history.
4. **Indexes**:
   - Unique constraints on business codes (`client_code`, `order_number`, `task_code`, `product_code`, `email`).
   - B-Tree indexes on foreign keys and search fields.

---

## Entity Relational Schema Summary

| Table Name | Primary Purpose | Key Foreign Keys | Key Indexes |
|---|---|---|---|
| `users` | System credentials & roles | None | `email` (unique) |
| `refresh_tokens` | Device sessions & rotation | `user_id` | `token_hash` (unique) |
| `clients` | Client organizations & GST | None | `client_code` (unique) |
| `client_contacts` | Multiple contacts per client | `client_id` (CASCADE) | `client_id` |
| `product_categories` | Organizational categories | None | `code` (unique) |
| `products` | Configurable products | `category_id`, `default_workflow_template_id` | `code` (unique) |
| `bill_of_materials` | Effective BOM versions | `product_id` (CASCADE) | `product_id` |
| `bom_items` | Individual components & scrap % | `bom_id` (CASCADE) | `bom_id` |
| `workflow_templates` | Static workflow definitions | None | `code` (unique) |
| `workflow_step_templates` | Individual steps & roles | `template_id` (CASCADE) | `template_id` |
| `workflow_step_dependencies`| Step DAG relationships | `step_id`, `depends_on_step_id` | `step_id` |
| `orders` | Central business order | `client_id` (RESTRICT) | `order_number` (unique) |
| `order_items` | Line items per order | `order_id` (CASCADE), `product_id` | `order_id` |
| `workflow_instances` | Cloned workflow execution | `template_id`, `order_item_id` | `order_item_id` (unique) |
| `workflow_step_instances` | Cloned steps with states | `workflow_instance_id` (CASCADE) | `workflow_instance_id` |
| `workflow_step_instance_dependencies` | Cloned DAG links | `step_instance_id`, `depends_on_step_instance_id` | `step_instance_id` |
| `tasks` | Actionable work items | `order_id`, `workflow_step_instance_id` | `task_code` (unique) |
| `task_dependencies` | Task-level DAG blockers | `task_id`, `depends_on_task_id` | `task_id` |
| `task_blockers` | Unresolved production impediments | `task_id` (CASCADE) | `task_id` |
| `task_comments` | Contextual task remarks | `task_id` (CASCADE) | `task_id` |
| `file_folders` | Logical workspace folders | `order_id` | `order_id` |
| `files` | Logical file entries | `folder_id`, `order_id` | `order_id` |
| `file_versions` | Versioned files (v1..vn) | `file_id` (CASCADE) | `file_id` |
| `file_links` | Multi-entity linking | `file_id` (CASCADE) | `entity_id` |
| `approvals` | Formal approval records | `order_id`, `file_version_id` | `order_id` |
| `quantity_transactions` | Operational ledger | `order_id`, `order_item_id` | `order_item_id` |
| `audit_logs` | Immutable audit trail | None | `entity_id`, `correlation_id` |
| `notifications` | Notification foundation | `user_id` | `user_id` |
| `automation_rules` | Trigger-action definitions | None | `trigger_event` |
| `settings` | System-wide parameters | None | `key` (unique) |

---

## Migration Commands
```bash
# Apply migrations to latest revision
alembic upgrade head

# Rollback one revision
alembic downgrade -1

# Generate new migration after model changes
alembic revision --autogenerate -m "description_of_change"
```
