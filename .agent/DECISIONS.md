# Architecture & Design Decisions (DECISIONS.md)

This record documents significant architectural and design decisions supported by the repository's codebase, ADR records, and git history.

---

### 1. Modular Monolith Architecture
- **Date**: 2026-09-02 (ADR-001)
- **Decision**: Build the backend as a modular monolith in FastAPI rather than a distributed microservices network.
- **Reason**: Tightly coupled operational domains (Orders, Stock, Workflows, Files, Billing) within a commercial printing facility benefit from in-process ACID transactions and zero distributed networking overhead.
- **Impact**: Simplified local development, fast automated test runs, and explicit service boundaries that enable future extraction if necessary.

---

### 2. Asynchronous Database with Multi-Dialect Support
- **Date**: 2026-09-02 (ADR-002)
- **Decision**: Use SQLAlchemy 2.0 with `asyncpg` for PostgreSQL in production/Docker and `aiosqlite` for isolated test/dev environments.
- **Reason**: Non-blocking I/O is required for concurrent WebSocket and API traffic, while zero-daemon SQLite execution enables rapid, frictionless test execution.
- **Impact**: Fast local test suite (36 suites passing in ~17s) without mandatory external PostgreSQL services during automated testing.

---

### 3. Workflow Template vs. Execution Instance Separation
- **Date**: 2026-09-02 (ADR-003)
- **Decision**: Decouple static definitions (`WorkflowTemplate`, `WorkflowStepTemplate`) from runtime execution instances (`WorkflowInstance`, `WorkflowStepInstance`).
- **Reason**: Standard product workflows evolve over time. Modifying a template must never corrupt or alter active in-flight production runs.
- **Impact**: Full historical immutability of production runs; multi-item orders advance independent workflow instances.

---

### 4. Directed Acyclic Graph (DAG) for Workflow Steps
- **Date**: 2026-09-02 (ADR-004)
- **Decision**: Model workflow step dependencies as a DAG via `WorkflowStepDependency`.
- **Reason**: Production stages in printing are non-linear; for example, data collection and photography run concurrently, and design depends on both completing.
- **Impact**: Unlocks parallel production branches and prevents shop-floor operations from being executed out of order.

---

### 5. File Versioning & Immutability of Approved Artwork
- **Date**: 2026-09-02 (ADR-006, ADR-011)
- **Decision**: Store files under logical workspaces (`ORD-xxxx/`) with SHA-256 checksums, and strictly lock production machine batches to `APPROVED` file versions.
- **Reason**: Running printing presses on draft, rejected, or obsolete customer artwork causes catastrophic material scrap and commercial loss.
- **Impact**: Immutable audit trail; presses cannot run without formal approval. Revisions require generating a new version and fresh approval.

---

### 6. Decoupled Stock Model (Physical vs. Reserved vs. Available)
- **Date**: 2026-09-02 (ADR-010)
- **Decision**: Decouple stock calculations: $\text{Available} = \text{Physical} - \text{Reserved}$.
- **Reason**: Order intake requires locking materials to prevent double-selling, but deducting physical stock prematurely causes false warehouse stockout panics.
- **Impact**: Clean separation between operational holds and actual shop-floor material consumption.

---

### 7. Non-Destructive Labour Material Credit Ledger
- **Date**: 2026-09-02 (ADR-012)
- **Decision**: Track company-owned raw materials issued to outside piece-rate contractors in an append-only `LabourStockLedger`.
- **Reason**: Outside contractors receive bulk hardware (e.g. 1,000 metal hooks for a 700-lanyard job). Manually overriding balances created phantom inventory loss.
- **Impact**: Leftover hardware automatically credits towards subsequent jobs; net warehouse issues only supply shortfalls.

---

### 8. Accepted-Piece Payment Invariant
- **Date**: 2026-09-02 (ADR-013)
- **Decision**: Payouts to piece-rate contractors are calculated strictly as $\text{Payable} = Q_{\text{accepted}} \times \text{Rate Per Unit}$.
- **Reason**: Contractors occasionally sought compensation based on gross issued material rather than verified, good output.
- **Impact**: Eliminates payment for scrap or defective units while guaranteeing transparent remuneration.

---

### 9. Tripartite Order Completion Invariant
- **Date**: 2026-09-02 (ADR-014)
- **Decision**: Order status `COMPLETED` cannot be set manually via button clicks; it requires programmatic validation that all workflows are finished, packing is verified, and net packed good units equal ordered counts.
- **Reason**: Premature order closure in previous systems led to incomplete shipments and missed items.
- **Impact**: Guaranteed 100% fulfillment before invoicing and financial closure.

---

### 10. Deterministic Financials & Read-Only AI Safety Boundary
- **Date**: 2026-09-02 (ADR-016)
- **Decision**: Compute all financial calculations (quotations, costings, taxes, piece-rates) with Python `decimal.Decimal`. Limit the AI assistant layer strictly to read-only diagnostic query tools.
- **Reason**: Probabilistic AI models are prone to hallucination in multi-step accounting, BOM costing, and tax calculations.
- **Impact**: 100% mathematical correctness and financial compliance; zero risk of AI-induced ledger corruption.

---

### 11. Idempotent Event-Driven Automation Engine
- **Date**: 2026-09-02 (ADR-019)
- **Decision**: Implement an Event-Condition-Action (ECA) automation engine with mandatory idempotency key tracking.
- **Reason**: Retrying background jobs or Webhook events risked creating duplicate tasks, duplicate stock reservations, or duplicate payments.
- **Impact**: Safe, idempotent background automation and complete rule execution audit logging.

---

### 12. Desktop Client Architecture & Packaging
- **Date**: 2026-09-02 to 2026-09-03
- **Decision**: Build the desktop management app using Electron 29, React 18, and `esbuild`, packaging with `electron-builder` for Windows.
- **Reason**: Factory office staff require a native desktop workstation with high density, local device support, and fast bundle generation.
- **Impact**: Rapid build times (~200ms via esbuild), portable Windows installer packaging, and local desktop shortcuts.

---

### 13. Reorganization into 7 Primary Workspaces & Centralized Payroll
- **Date**: 2026-09-03
- **Decision**: Consolidate desktop views into 7 primary workspaces (`Dashboard`, `Orders`, `Tasks`, `Staff`, `Labour`, `Stock`, `Clients`, `Billing`, `Settings`) and move all employee and contractor payroll/monetary calculations exclusively into the `Billing` workspace.
- **Reason**: Shop-floor supervisors and staff screens should not expose sensitive compensation data, and operators need unified tables rather than fragmented screens.
- **Impact**: Clean role separation, secure compensation viewing restricted to billing/management, and streamlined inline order entry.
