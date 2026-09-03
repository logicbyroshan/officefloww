# Historical Changelog (CHANGELOG.md)

This log records meaningful milestones, architectural transitions, and notable features derived from repository commits and release documentation.

---

## [UI & Desktop Modernization] - 2026-09-02 to 2026-09-03

### Desktop Application
- **Electron Desktop Client**: Implemented desktop application in `apps/desktop` with Electron 29, React 18, and `esbuild` bundling.
- **7 Primary Workspaces**: Consolidated application views into 7 core workspaces (`Dashboard`, `Orders`, `Tasks`, `Staff`, `Labour`, `Stock`, `Clients`, `Billing`, `Settings`).
- **Dedicated Labour Workspace**: Extracted piece-rate contractor management from Staff into a dedicated workspace tracking active MPL orders, contractor profiles, and material credit balances.
- **Centralized Payroll**: Removed compensation, wage, and hourly rates from Staff and Labour screens; centralized all payroll records and disbursements inside the `Billing` workspace.
- **Streamlined Stock Inventory**: Replaced complex multi-warehouse inventory views with a 14-item fixed core material sheet featuring inline quantity/price editing and material usage reporting.
- **Inline Order Entry**: Upgraded Orders workspace with instant inline order entry row, client selector with auto-fetch, and multi-select "Things Ordered" tags (Lanyard, Card, Badge, Custom).
- **Offline Fallback Architecture**: Implemented resilient mock service fallbacks allowing the desktop interface to authenticate and operate without an active FastAPI backend.

---

## [4.0.0] - 2026-09-02: Backend Hardening & Production Verification (Phase 4)

### Added
- **Traceability Queries**: Added `GET /api/v1/stock/traceability/lot/{lot_id}` providing forward/reverse traceability from supplier lots to finished goods dispatch.
- **Absence Handover Briefing**: Added `GET /api/v1/capacity/absence/{absence_id}/summary` for manager review of reassigned workload during employee absences.
- **Scrap Discrepancy Auditing**: Enhanced quantity reconciliation to automatically calculate and flag unaccounted material variances across completed batches.
- **Concurrency & Resilience Suites**: Added race condition, failure recovery, and material traceability test suites, bringing the automated test suite to 36 passing suites (100% pass rate).
- **Production Runbooks**: Authored operational documentation spanning requirements matrix (`docs/44`) to final handover and completion reports (`docs/55`).

---

## [3.0.0] - 2026-09-02: Automation & Intelligence Layer (Phase 3)

### Added
- **Quotation & Costing Engine**: Tiered quantity pricing ($1\text{--}100, \dots, 5000+$), exact `Decimal` margin calculation, and three-tier feasibility analysis (`GREEN`, `YELLOW`, `RED`).
- **Capacity & Workload Planning**: Machine and operator queue tracking, absence detection, and role-matched workload handover recommendations.
- **Dynamic Delivery ETA Engine**: Critical-path delivery forecasting across workflow stages, machine backlogs, and procurement lead times.
- **Idempotent Automation Rules**: Event-Condition-Action (ECA) rule execution with mandatory idempotency key deduplication.
- **Multi-Channel Notifications**: Provider strategy supporting InApp, Desktop, MobilePush, and WhatsApp HSM messaging, plus tokenized web proof approvals.
- **Integrations & AI Query Tools**: Google Sheets bulk CSV import, Trello migration mapper, and read-only AI diagnostic query tools (`get_orders_at_risk`, `get_low_stock`, `get_employee_workload`).

---

## [2.0.0] - 2026-09-02: Physical Operational Layer (Phase 2)

### Added
- **Stock Engine**: Physical vs Reserved vs Available stock separation ($A = P - R$), multi-location architecture, and 9-movement immutable ledger.
- **Purchasing & Price History**: Purchase order approvals, goods receipt notes (GRN), and supplier price inflation analytics.
- **Production Batches & File Lock**: Deterministic batch numbering (`PRINT-YYYYMMDD-XXXX`) and enforcement of `APPROVED` file versions for batch initialization.
- **Labour & Material Credit**: Outside contractor directory, non-destructive `LabourStockLedger` carrying forward unconsumed hardware, and strict accepted-piece payouts.
- **Packing, Dispatch & Expenses**: Container aggregation with dual sign-off, multi-mode logistics, and out-of-pocket delivery expense auto-logging.
- **Billing Invariants**: GST invoicing and programmatic enforcement of the tripartite order completion invariant.

---

## [1.0.0] - 2026-09-02: System Foundation & Core Architecture (Phase 1)

### Added
- **Modular Monolith Foundation**: FastAPI backend, async SQLAlchemy 2.0 engine, standardized JSON response envelopes, and WebSocket event broadcaster.
- **Authentication & RBAC**: JWT access/refresh token rotation, bcrypt password hashing, and 10-role server-side permission guards.
- **Client & Product Catalogs**: Multi-contact client management, GSTIN validation, and multi-component Bill of Materials (BOM) with wastage percentages.
- **DAG Workflow & Task Engines**: Workflow template/instance separation, Directed Acyclic Graph dependency resolution, and automated task queue generation.
- **File Workspaces & Quantity Ledger**: S3/MinIO logical order storage (`ORD-xxxx/`) with SHA-256 hashing, and double-entry quantity transaction ledger.
- **TypeScript Monorepo Packages**: `@officefloww/api-types`, `@officefloww/api-client`, and `@officefloww/validation`.
- **Infrastructure**: Docker Compose configuration for PostgreSQL, Redis, MinIO, API, and Celery.
