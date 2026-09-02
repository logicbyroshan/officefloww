# Architecture Decision Records (ADR) - OfficeFloww

## ADR-001: Modular Monolith vs. Microservices
- **Status**: Accepted
- **Context**: OfficeFloww coordinates closely coupled business domains (Orders, Workflows, Tasks, Approvals, Files, Inventory). High operational overhead of microservices (network latency, distributed transactions, service discovery) would drastically slow down development and increase failure modes for a printing factory environment.
- **Decision**: Adopt a Modular Monolith architecture within FastAPI. Enforce strict bounded context domains (`auth`, `users`, `clients`, `products`, `orders`, `workflows`, `tasks`, `files`, `approvals`, `quantities`, `audit`, `notifications`, `automation`, `settings`) where modules interact via explicit service interfaces rather than cross-domain direct DB mutations.
- **Consequences**: Easy to deploy, zero distributed transaction overhead, straightforward testing, with explicit boundaries enabling future microservice extraction if needed.

---

## ADR-002: Asynchronous Database Access with Multi-Dialect Support
- **Status**: Accepted
- **Context**: High-performance API serving real-time desktop and mobile clients with WebSocket updates requires non-blocking I/O. Furthermore, automated test suites must execute rapidly without requiring local PostgreSQL/Redis services running.
- **Decision**: Use SQLAlchemy 2.0 with `asyncpg` for PostgreSQL in production/staging and `aiosqlite` for in-memory/isolated test execution. Use `sa.Uuid` and generic JSON columns so models remain 100% portable while leveraging native PostgreSQL UUIDs and JSONB when deployed.
- **Consequences**: Fast test execution, native async FastAPI integration, zero external daemon dependency during testing.

---

## ADR-003: Workflow Template vs. Workflow Instance Separation
- **Status**: Accepted
- **Context**: A printing business has standard product workflows (e.g. ID Cards require Data collection + Photography in parallel before Design, while MPL lanyards require Design directly). Modifying templates should never alter in-flight production runs.
- **Decision**: Separate static definitions (`WorkflowTemplate`, `WorkflowStepTemplate`, `WorkflowStepDependency`) from execution instances (`WorkflowInstance`, `WorkflowStepInstance`). When an `OrderItem` is confirmed, its workflow template is cloned into dedicated instance records.
- **Consequences**: Full historical immutability of active production workflows; independent step progression for multi-item orders (e.g. ID Cards and Lanyards advance at their own pace).

---

## ADR-004: DAG-Based Step Execution & Parallel Workflow Branches
- **Status**: Accepted
- **Context**: Production steps cannot always be strictly linear. For example, student data entry and photo shooting occur concurrently. Design depends on both being completed.
- **Decision**: Model step dependencies as a Directed Acyclic Graph (DAG) via `WorkflowStepDependency`. A step instance transitions to `READY` status only when all upstream dependencies have reached `COMPLETED`. Steps with zero dependencies become `READY` immediately upon workflow instantiation.
- **Consequences**: Native support for parallel workflows; prevents invalid shop-floor processing out of sequence.

---

## ADR-005: Task Generation from Workflow Steps
- **Status**: Accepted
- **Context**: Workflow steps represent operational phases. Tasks represent actionable work items assigned to individuals or roles on the shop floor with priorities, blockers, and SLA deadlines.
- **Decision**: Tasks are automatically generated when a `WorkflowStepInstance` reaches `READY` status. When a task is marked `COMPLETED`, the workflow engine evaluates downstream dependencies to unlock subsequent steps.
- **Consequences**: Operators work against clear task queues without needing to understand the global workflow state.

---

## ADR-006: File Versioning & Approval State Immutability
- **Status**: Accepted
- **Context**: Designers produce iterations (v1, v2, v3). Approvals by clients or managers must reference a specific, immutable file version. Once approved, that version must never be overwritten.
- **Decision**: Files are organized under logical order workspaces (`ORD-1001/01-Order`, `04-Design`, `05-Approved`, etc.). Each upload generates a new `FileVersion` record with storage key, SHA-256 checksum, and approval state. Approvals link to `file_version_id`. New design iterations require uploading a new version (`v4`) and re-requesting approval.
- **Consequences**: Total traceability, no accidental overwrites of approved artwork, audit compliance.

---

## ADR-007: Quantity Ledger with Transaction Types
- **Status**: Accepted
- **Context**: Tracking a single integer `quantity` fails to reflect operational realities such as rejects during printing, scrap during lanyard ultrasonic cutting, or customer partial returns.
- **Decision**: Implement a double-entry style `QuantityTransaction` ledger with types: `ORDERED`, `PRODUCED`, `REJECTED`, `WASTED`, `ASSIGNED`, `COMPLETED`, `DEFECTIVE`, `RETURNED`, `PACKED`, `DISPATCHED`. Current quantities are derived from ledger aggregations.
- **Consequences**: Full operational auditability, scrap rate calculations, and readiness for Phase 2 inventory integration.

---

## ADR-008: Standardized API Response Envelopes
- **Status**: Accepted
- **Context**: The frontend is built separately. Inconsistent payload shapes create frontend bugs and require ad-hoc error handling.
- **Decision**: All API responses follow a strict envelope:
  - Success: `{"success": true, "data": ..., "meta": ...}`
  - Error: `{"success": false, "error": {"code": "...", "message": "...", "details": [...]}}`
- **Consequences**: Standardized frontend client unwrapping and error boundary display.

---

## ADR-009: Background Processing with Celery & Redis (Eager Fallback)
- **Status**: Accepted
- **Context**: Slow operations (large file hashing, batch notification dispatch, scheduled SLA warnings) must not block HTTP request loops.
- **Decision**: Use Celery backed by Redis. In test and single-process local development mode, `CELERY_TASK_ALWAYS_EAGER = True` enables inline execution without running Redis.
- **Consequences**: Clean separation of CPU/IO-intensive background tasks with zero-friction local test runs.

---

## ADR-010: Physical vs. Reserved vs. Available Stock Separation
- **Status**: Accepted
- **Context**: Printing factories hold thousands of blank cards and ribbon meters. Confusing reserved material with physical consumption leads to premature stock deductions and warehouse stockout panics.
- **Decision**: Formally decouple Physical Stock, Reserved Stock, and Available Stock ($A = P - R$). Reserving stock upon order confirmation places a hold without decrementing physical inventory. Material is decremented only upon physical machine issue or assembly line consumption.
- **Consequences**: Accurate multi-order raw material planning with zero premature write-offs.

---

## ADR-011: Production File Lock Guard
- **Status**: Accepted
- **Context**: Running printing machines on draft, obsolete, or rejected artwork files causes massive substrate scrap and commercial loss.
- **Decision**: `ProductionBatch` creation enforces a mandatory file lock check. A batch can only be initialized if `file_version.approval_state == FileApprovalStatus.APPROVED`. If artwork changes, the previous file version remains locked and immutable; the new version must obtain approval before being referenced.
- **Consequences**: Complete protection against running outdated designs on shop-floor presses.

---

## ADR-012: Labour Material Credit Ledger Mechanics
- **Status**: Accepted
- **Context**: Outside piece-rate workers are issued material in bulk bags (e.g. 1,000 hooks for a 700-lanyard job). Overriding worker balances manually creates phantom inventory losses.
- **Decision**: All material held by outside contractors is tracked non-destructively in `LabourStockLedger` as company-owned inventory. When a subsequent order is assigned to the same worker, the system credits their existing balance and issues only the net shortfall from central storage.
- **Consequences**: Eliminates hardware loss across outside contractors; provides 100% auditability.

---

## ADR-013: Strict Accepted-Piece Payment Invariant
- **Status**: Accepted
- **Context**: Outside contractors sometimes claim compensation for raw issued units rather than verified, good completed units.
- **Decision**: The payment generation engine strictly calculates payable amounts as $\text{Payable} = Q_{\text{accepted}} \times \text{Rate Per Unit}$. Issued quantities and defective pieces are mathematically excluded from payouts.
- **Consequences**: Protects the company against paying for scrap or defectives while guaranteeing fair, timely compensation to contractors.

---

## ADR-014: Tripartite Order Completion Invariant
- **Status**: Accepted
- **Context**: Premature order closure in legacy systems resulted in missing packages, unproduced balance items, and unfulfilled shipments.
- **Decision**: Orders cannot be marked `COMPLETED` by simple button clicks. Order completion requires cryptographic verification that (1) all workflow step instances are completed/skipped, (2) packing tasks are 100% verified, and (3) total packed good units equal ordered target quantities.
- **Consequences**: Zero accidental closures; 100% fulfillment guarantee before financial invoicing closure.

---

## ADR-015: Out-of-Pocket Delivery Expense Auto-Logging
- **Status**: Accepted
- **Context**: Delivery staff frequently pay cash for inter-city bus parcels or local tempos out-of-pocket. Manual reimbursement tracking causes delayed payments and lost receipts.
- **Decision**: When a delivery is booked with a freight charge, the system automatically creates a `DeliveryExpense` reimbursement entry in `PENDING` status for the paying employee with receipt attachment.
- **Consequences**: Immediate transparency into petty cash obligations and faster employee reimbursements.
