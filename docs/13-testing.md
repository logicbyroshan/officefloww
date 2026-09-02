# 13. Testing Strategy & Execution - OfficeFloww

## Overview
OfficeFloww employs a comprehensive automated test suite powered by **Pytest** and **pytest-asyncio**, testing all core domain modules, business invariants, and transactional workflows.

---

## Test Architecture
- **In-Memory Isolation**: Tests run against an isolated in-memory SQLite database (`sqlite+aiosqlite:///:memory:`). Each test function runs inside an isolated database lifespan, creating fresh tables and dropping them upon teardown.
- **ASGITransport**: Uses HTTPX's `ASGITransport` to directly test the FastAPI application without opening local network sockets.
- **Fast Execution**: Entire test suite executes in < 7 seconds without requiring external PostgreSQL, Redis, or MinIO services.

---

## Running Tests
```bash
# Run all tests with verbose output
python -m pytest -v apps/api/tests

# Run a specific domain test file
python -m pytest -v apps/api/tests/test_orders_workflows.py

# Run with test coverage report
python -m pytest --cov=apps.api.app apps/api/tests
```

---

## Test Suite Coverage Breakdown

| Test File | Target Domain & Scenarios Tested |
|---|---|
| `test_auth.py` | Login, password verification, refresh token rotation, logout revocation, `/auth/me` |
| `test_authorization.py` | Role-based permission enforcement, operator access denials (403), admin access |
| `test_clients.py` | Client creation, duplicate code rejection, multi-contact management, primary contact toggle |
| `test_products_bom.py` | Configurable products, Bill of Materials (BOM) items, wastage percentages |
| `test_orders_workflows.py` | Multi-product order creation (ID Cards + MPL), independent workflow instances, parallel DAG step resolution |
| `test_tasks_dependencies.py`| Parallel task completion, downstream merge unlocking, blocker logging and resolution |
| `test_files_approvals.py` | Logical workspace folders (`ORD-xxxx/`), file versioning (v1, v2), approval sign-offs, version locking |
| `test_quantity_ledger.py` | Operational transactions (`ORDERED`, `PRODUCED`, `REJECTED`, `WASTED`), scrap rate percentage calculation |
| `test_audit_log.py` | Automated audit trail logging, diff generation on mutations, correlation ID capture |
