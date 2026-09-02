# Changelog - OfficeFloww

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-09-02

### Added
- **Final Backend Completion, Audit, Hardening & Production Readiness (Phase 4)**:
  - **71-Point Functional Requirements Matrix & Audit**: Complete traceability mapping in `docs/44-final-backend-requirements-matrix.md` and `docs/45-final-gap-analysis.md`.
  - **Stock Lot & Material Traceability Endpoint**: Added `GET /api/v1/stock/traceability/lot/{lot_id}` for forward/reverse tracking from supplier lot to finished goods dispatch.
  - **Absence Handover Briefing Summary**: Added `GET /api/v1/capacity/absence/{absence_id}/summary` for workload reallocation reviews.
  - **Unaccounted Scrap Discrepancy Auditing**: Enhanced `reconcile_order_item_quantities` to calculate unaccounted material variance across completed batches.
  - **Concurrency & Failure Pytest Suites**: Added `test_material_traceability.py`, `test_concurrency_and_race_conditions.py`, and `test_failure_scenarios_and_resilience.py` expanding test coverage to 36 passing suites (100% pass rate in 17.43s).
  - **Comprehensive Production Documentation Suite**: Created runbooks `docs/46-backup-and-recovery.md` through `docs/55-backend-completion-report.md`.
  - **Exported Typed OpenAPI Contracts**: Synchronized `packages/api-types/openapi.json`.

## [3.0.0] - 2026-09-02

### Added
- **Automated Business Operating System & Intelligence Layer (Phase 3)**:
  - **Quotation & Tiered Costing Engine (`apps/api/app/quotations/`)**:
    - Configurable quantity-based pricing tiers ($1\text{--}100, 101\text{--}500, 501\text{--}1000, 1001\text{--}5000, 5000+$).
    - Deterministic costing breakdown using high-precision Decimal arithmetic (BOM material costs, setup wastage %, machine hourly rates, piece-rate labour, packaging, transport freight, overhead markup %, and target gross margin %).
    - Traffic-light feasibility analysis (`GREEN`, `YELLOW`, `RED`) checking unreserved stock, machine backlog, and labour capacity with actionable recommendations.
    - Quotation versioning and seamless conversion into confirmed production orders.
  - **Capacity Planning, Workload & Absence Handover (`apps/api/app/capacity/`)**:
    - Machine and operator capacity tracking with daily/weekly utilization percentages.
    - Employee absence detection with automated substitute candidate search (matching roles and lowest queue depth).
    - Manager-approved task handover execution.
  - **Dynamic Delivery ETA Engine (`apps/api/app/eta/`)**:
    - Critical-path delivery forecasting across DAG workflow steps, machine queues, procurement lead times, and contractor fitting buffers.
    - Dynamic recalculation on delays with immutable snapshot history.
  - **Transparent Priority Engine (`apps/api/app/capacity/`)**:
    - Objective priority calculation (`CRITICAL`, `HIGH`, `NORMAL`, `LOW`) accompanied by explicit human-readable explanations.
  - **Idempotent Automation Rules Engine (`apps/api/app/automation/`)**:
    - Event-Condition-Action (ECA) rules engine with strict idempotency key tracking preventing duplicate tasks, stock issues, or payouts.
    - Full execution audit logging in `AutomationLog`.
  - **Multi-Channel Notifications & Client Proof Portal (`apps/api/app/notifications/`)**:
    - `NotificationProvider` strategy abstraction supporting `InApp`, `Desktop`, `MobilePush`, `Email`, and `WhatsApp`.
    - WhatsApp HSM template messaging architecture.
    - Tokenized, secure external client proof approval portal with instant version locking upon approval.
  - **Data Import & Migration Bridges (`apps/api/app/integrations/`)**:
    - Google Sheets bulk CSV/API import for clients, stock items, and pricing.
    - Trello board migration mapper converting cards, lists, members, attachments, and comments into structured tasks and comments.
  - **Management AI Assistant & Tool Layer (`apps/api/app/ai/`)**:
    - Controlled read-only query tools (`get_orders_at_risk`, `get_low_stock`, `get_employee_workload`, `get_labour_performance`, `get_pending_payments`).
    - Natural language query answering and automated daily executive briefings with zero direct database mutations and zero AI-generated financial math.
  - **Executive Analytics & Responsibility Audit (`apps/api/app/analytics/`)**:
    - Multi-domain dashboards (revenue, orders, machine utilization, contractor quality rankings, scrap analysis, client balance aging).
    - Verifiable responsibility audit trail linking operational sign-offs to actor identity and correlation IDs.
  - **Enterprise Security & Disaster Recovery**:
    - Object-level file authorization restricting floor workers and external clients to task-permitted files only.
    - Automated backup and restore utilities (`scripts/backup_db.py`, `scripts/restore_db.py`).
    - Complete documentation suite (`docs/29-quotation-engine.md` to `docs/43-disaster-recovery.md`).
- **Database & Testing**:
  - Alembic migration `0003_phase3_automation_intelligence`.
  - Pytest test suite expanded to 32 comprehensive tests (including Grand Tour end-to-end business lifecycle test) with 100% pass rate.
  - Monorepo TypeScript packages compiled and typechecked with 0 errors.

## [2.0.0] - 2026-09-02

### Added
- **Physical Operational Layer (Phase 2)**:
  - **Stock Engine (`apps/api/app/stock/`)**:
    - Physical vs Reserved vs Available stock separation ($A = P - R$).
    - Multi-location architecture (`MAIN_STORE`, `PRODUCTION`, `MACHINE`, `IN_HOUSE_WORKER`, `OUTSIDE_LABOUR`).
    - Immutable `StockMovement` ledger covering 9 movement types with negative stock protection.
    - BOM requirements calculation with wastage % markup and automatic reservation on order confirmation.
  - **Suppliers & Purchasing (`apps/api/app/purchasing/`)**:
    - Supplier onboarding with contact directories and tax identifiers.
    - Purchase Order (PO) approval workflow and Goods Receipt Notes (GRN).
    - Supplier Price History analytics computing absolute price increase, percentage increase, and recent weighted averages.
  - **Production Engine & Traceability (`apps/api/app/production/`)**:
    - Press machine inventory, speeds, setup times, and operator shift assignments.
    - Deterministic batch traceability (`PRINT-YYYYMMDD-XXXX`).
    - **Production File Lock**: Enforcing that only formally approved file versions can be used for batch creation.
  - **Quantity Reconciliation (`apps/api/app/production/`, `apps/api/app/quantities/`)**:
    - Mathematical allocation validation: $\sum Q_{\text{alloc}} \le Q_{\text{ordered}}$.
    - Strict HTTP 400 rejection of over-allocations.
  - **Labour Module & Material Credit Ledger (`apps/api/app/labour/`)**:
    - Worker directory with skill proficiency ratings and capacity constraints.
    - **Labour Material Credit Ledger**: Company-owned material held by outside contractors derived non-destructively through ledger transactions; smart deduction re-uses existing balances on new orders.
    - Inter-worker material transfers (`TRANSFERRED_OUT` / `TRANSFERRED_IN`).
    - Piece-rate compensation ledger strictly calculated from accepted good units ($Q_{\text{accepted}} \times \text{Rate}$), never from issued material.
  - **Tools & Asset Tracking (`apps/api/app/assets/`)**:
    - Tool tracking with condition state machine (`EXCELLENT` $\to$ `GOOD` $\to$ `FAIR` $\to$ `DAMAGED` $\to$ `LOST`).
    - Check-out / check-in protocols with double-assignment prevention.
  - **Packing & Quality Verification (`apps/api/app/packing/`)**:
    - Packing tasks with container categorization (`BOX`, `BUNDLE`, `CARTON`, `PALLET`, `ENVELOPE`).
    - Strict over-packing rejection and dual packer-verifier sign-off.
  - **Dispatch, Logistics & Delivery Expenses (`apps/api/app/dispatch/`)**:
    - Multi-mode carrier management (`BUS`, `DTDC`, `PORTER`, `COURIER`, `OTHER`).
    - LR / Docket booking and tracking references.
    - Out-of-pocket delivery expense auto-logging (e.g. ₹800 bus freight paid by worker) and manager approval ledger.
    - Delivery exception logging with objective facts and evidence capture.
  - **Billing & Order Completion Invariant (`apps/api/app/billing/`)**:
    - GST-compliant invoicing (subtotal, CGST, SGST, IGST) and multi-method payment recording.
    - **Order Completion Invariant**: Prevents orders from being marked `COMPLETED` by button clicks; cryptographically enforces that all workflows are finished, packing is verified, and net good quantities equal ordered units.
  - **Domain Events & Background Workers (`apps/api/app/events/`, `apps/api/app/core/celery_tasks.py`)**:
    - Asynchronous domain event dispatcher with 12 event types.
    - Celery tasks for stock alerts, notifications, and scheduled reports.
  - **In-House Worker Mobile API (`apps/api/app/worker/`)**:
    - Sanitized mobile endpoints exposing task instructions, shift timers, defect logging, and quantity submission without financial data exposure.
- **Database & Testing**:
  - Alembic migration `0002_phase2_operational_layer` adding 42 new operational tables.
  - Pytest suite expanded to 24 comprehensive domain tests with 100% pass rate.
  - Updated seed script with realistic Phase 2 operational seed data.
- **TypeScript Contracts**:
  - Re-exported OpenAPI schema and built `@officefloww/api-types`, `@officefloww/api-client`, and `@officefloww/validation`.

## [1.0.0] - 2026-09-02

### Added
- **Core Architecture**:
  - FastAPI modular monolith foundation with strict domain separation.
  - SQLAlchemy 2.0 async engine with PostgreSQL and SQLite multi-dialect compatibility.
  - Standardized JSON envelope for all API responses (`success`, `data`, `meta`, `error`).
  - Correlation ID tracking and structured logging on all incoming requests.
  - Real-time WebSocket connection manager and event broadcaster (`/ws`).
- **Authentication & RBAC**:
  - Secure bcrypt password hashing and verification.
  - JWT access tokens and refresh token rotation with device tracking.
  - Token revocation / logout endpoint.
  - Role-based access control (RBAC) with 10 production roles: `OWNER`, `ADMIN`, `MANAGER`, `SALES`, `DESIGNER`, `DATA_OPERATOR`, `PRODUCTION_MANAGER`, `MACHINE_OPERATOR`, `PACKING_OPERATOR`, `ACCOUNTS`.
  - Server-side permission guards.
- **Clients Domain**:
  - Client organization management (GST, tax info, billing/delivery addresses).
  - Multiple contacts per client with primary contact designation.
- **Products & Bill of Materials (BOM)**:
  - Configurable product catalog (ID Cards, MPL, Acrylic Badges, Invitations, Marksheets).
  - Product categories and unit configuration.
  - Bill of Materials (BOM) engine with component quantities, wastage percentages, and versioning.
- **Workflow & Task DAG Engines**:
  - Configurable workflow templates with 12 step types (`DATA`, `PHOTOGRAPHY`, `DESIGN`, `APPROVAL`, `PRINTING`, `PRODUCTION`, `FITTING`, `PACKING`, `DISPATCH`, `BILLING`, `PAYMENT`, `CUSTOM`).
  - Directed Acyclic Graph (DAG) step dependency resolution supporting parallel workflows (e.g. concurrent Data and Photography steps).
  - Automatic task generation from ready workflow steps.
  - Priority scoring, blockers tracking, and task comments.
- **File Management & Approvals**:
  - S3/MinIO compatible object storage integration.
  - Logical order workspaces (`ORD-xxxx/01-Order`, `02-Data`, `04-Design`, `05-Approved`, etc.).
  - File versioning (`v1` → `vn`) with SHA-256 integrity checksums.
  - Approval engine with `PENDING`, `APPROVED`, `REJECTED`, and `CHANGES_REQUESTED` statuses.
  - Approved file version immutability.
- **Quantity Ledger**:
  - Double-entry operational transaction ledger (`ORDERED`, `PRODUCED`, `REJECTED`, `WASTED`, `ASSIGNED`, `COMPLETED`, `DEFECTIVE`, `RETURNED`, `PACKED`, `DISPATCHED`).
  - Real-time balance calculations and scrap rate metrics.
- **Audit Logging**:
  - Immutable audit logs capturing actor, action, entity, old/new value diffs, and correlation IDs.
- **Frontend Stubs & Packages**:
  - `packages/api-types`: TypeScript interfaces matching backend models.
  - `packages/api-client`: Fully functional TypeScript client wrapper.
  - `packages/validation`: Shared validation rules.
  - `apps/desktop`: Minimal Electron + React + TypeScript stub.
  - `apps/worker-app`: React Native worker stub.
  - `apps/labour-app`: React Native labour stub.
- **Development & Infrastructure**:
  - Docker Compose configuration for PostgreSQL, Redis, MinIO, API, and Celery worker.
  - Comprehensive seed script with 5 clients, 5 products, realistic BOMs, and multi-product order.
  - Full Pytest test suite.
  - Complete documentation suite (01 through 15).
