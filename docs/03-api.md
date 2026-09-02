# 03. API Architecture & Standards - OfficeFloww

## Overview
All endpoints conform to standardized JSON envelope formats, strict HTTP response status codes, and correlation ID tracking.

---

## Response Envelopes

### 1. Successful Response
```json
{
  "success": true,
  "data": {
    "id": "99437513-a037-48c3-9094-6a2a89af71eb",
    "order_number": "ORD-2026-0001",
    "total_amount": 182500.0,
    "status": "CONFIRMED"
  },
  "meta": {}
}
```

### 2. Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 142,
    "total_pages": 8
  }
}
```

### 3. Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed.",
    "details": [
      {
        "field": "body -> quantity",
        "message": "Input should be greater than 0",
        "type": "greater_than"
      }
    ]
  }
}
```

---

## Standard Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `AUTHENTICATION_FAILED` | 401 | Missing/invalid/expired token or incorrect password |
| `PERMISSION_DENIED` | 403 | User role lacks required authorization permission |
| `ENTITY_NOT_FOUND` | 404 | Target entity with requested identifier does not exist |
| `CONFLICT` | 409 | Unique constraint conflict (e.g. duplicate client code) |
| `BUSINESS_RULE_VIOLATION`| 400 | Invariant breach (e.g. completing blocked task) |
| `VALIDATION_ERROR` | 422 | Pydantic payload schema validation failure |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected system error (tagged with correlation ID) |

---

## Correlation & Tracing
Every request passes through `CorrelationIdMiddleware`:
- Checks for incoming header `X-Correlation-ID`. If absent, generates a new UUIDv4.
- Injects `X-Correlation-ID` into response headers and structured application logs.
- Attaches execution latency in `X-Process-Time-MS`.

---

## Core Endpoint Reference

### Authentication
- `POST /api/v1/auth/login`: Issue access & refresh token pair.
- `POST /api/v1/auth/refresh`: Rotate refresh token and issue new access token.
- `POST /api/v1/auth/logout`: Revoke active refresh token.
- `GET /api/v1/auth/me`: Fetch authenticated user profile.

### Clients
- `GET /api/v1/clients`: Paginated list of clients with search and filter.
- `POST /api/v1/clients`: Register new client organization and contacts.
- `GET /api/v1/clients/{id}`: Detailed client profile.
- `PATCH /api/v1/clients/{id}`: Update client metadata.
- `POST /api/v1/clients/{id}/contacts`: Add client contact.

### Products & BOM
- `GET /api/v1/products`: List configurable products.
- `POST /api/v1/products`: Define new product.
- `GET /api/v1/products/{id}`: Get product with nested BOM items.
- `PATCH /api/v1/products/{id}`: Update product specifications.
- `POST /api/v1/products/{id}/boms`: Create new Bill of Materials version.

### Orders
- `GET /api/v1/orders`: Paginated order list.
- `POST /api/v1/orders`: Place multi-product order, trigger workflow instantiation.
- `GET /api/v1/orders/{id}`: Order detail.
- `PATCH /api/v1/orders/{id}`: Update order state.
- `GET /api/v1/orders/{id}/items`: Retrieve line items.
- `GET /api/v1/orders/{id}/workflow`: Retrieve active workflow instances.
- `GET /api/v1/orders/{id}/tasks`: Retrieve order task queue.

### Tasks
- `GET /api/v1/tasks`: Filter tasks by status, role, assignee, or order.
- `GET /api/v1/tasks/{id}`: Task detail with blockers and comments.
- `PATCH /api/v1/tasks/{id}`: Reassign or update task.
- `POST /api/v1/tasks/{id}/complete`: Complete task, triggering DAG workflow advancement.
- `POST /api/v1/tasks/{id}/blockers`: Log blocker impediment.
- `POST /api/v1/tasks/blockers/{id}/resolve`: Resolve blocker.
- `POST /api/v1/tasks/{id}/comments`: Post collaboration note.

### Files & Approvals
- `POST /api/v1/files/upload`: Multipart upload creating versioned file.
- `GET /api/v1/files/{id}`: File metadata.
- `GET /api/v1/files/{id}/versions`: Version history.
- `GET /api/v1/files/order/{order_id}/workspace`: Hierarchical folder structure.
- `POST /api/v1/approvals`: Submit file version or step for approval.
- `GET /api/v1/approvals`: List active approval requests.
- `POST /api/v1/approvals/{id}/approve`: Finalize approval, unlock workflow step.
- `POST /api/v1/approvals/{id}/reject`: Reject approval.

### Quantity Ledger
- `POST /api/v1/quantities/transactions`: Record shop-floor batch quantity.
- `GET /api/v1/quantities/orders/{order_item_id}/summary`: Real-time scrap rate and balance.
- `GET /api/v1/quantities/transactions`: Transaction log.

### Audit & Realtime
- `GET /api/v1/audit`: Append-only audit trail query.
- `WS /ws`: Realtime WebSocket event broadcast.
