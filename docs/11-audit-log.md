# 11. Audit Logging - OfficeFloww

## Overview
Accountability is paramount when multiple operators, designers, managers, and accountants interact with orders.
OfficeFloww maintains an **Append-Only, Immutable Audit Log** recording all critical business events.

---

## Log Record Structure
Every mutation captures:
- `actor_id` & `actor_email`: Who performed the action.
- `action`: Normalized verb (`ORDER_CREATED`, `ORDER_STATUS_CHANGED`, `TASK_COMPLETED`, `APPROVAL_APPROVED`, `QUANTITY_REJECTED`, etc.).
- `entity` & `entity_id`: Target object (e.g. `Order`, `Task`, `Approval`, `QuantityTransaction`).
- `old_values_json`: Snapshot of previous values before the mutation.
- `new_values_json`: Snapshot of new values after the mutation.
- `correlation_id`: Trace ID from `X-Correlation-ID` header connecting logs across the call stack.
- `reason`: Operator or system rationale.
- `timestamp`: UTC timezone-aware event timestamp.

---

## Immutability Safeguards
- `AuditLog` rows cannot be modified or deleted via standard APIs.
- Normal users have zero write permissions (`audit:write` does not exist; only the internal service layer writes audit records).
- Accessible only to authorized roles (`OWNER`, `ADMIN`, `MANAGER`) via `GET /api/v1/audit`.
