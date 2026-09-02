# Changelog - OfficeFloww

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
