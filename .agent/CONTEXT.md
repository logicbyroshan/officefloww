# System Context (CONTEXT.md)

## 1. Project Purpose & Scope

**OfficeFloww** (branded as **PrintFlow / Adharsh Bhopal OS** on desktop) is an industrial production management and office automation operating system for high-volume commercial printing facilities. It specializes in ID Cards, Multicolor Printed Lanyards (MPL), Badges, Acrylic Badges, Invitations, Marksheets, and custom print jobs. It replaces spreadsheets, WhatsApp messaging, and physical slips with a unified workflow, inventory, piece-rate labour, and billing engine.

---

## 2. Technology Stack

### Backend
- **Language & Framework**: Python 3.11+, FastAPI (modular monolith)
- **Database & ORM**: PostgreSQL 16+ via async SQLAlchemy 2.0 with `asyncpg`; SQLite via `aiosqlite` for local dev/testing
- **Migrations**: Alembic (`alembic/versions/`)
- **Task Queue & Broker**: Celery 5.3+ backed by Redis 7+ (`CELERY_TASK_ALWAYS_EAGER` supported for local test/dev)
- **Object Storage**: S3-compatible storage (MinIO in local/Docker, AWS S3 in production)
- **Testing**: Pytest with `pytest-asyncio` (36 test suites, 100% pass rate)

### Frontend & Clients
- **Desktop Application** (`apps/desktop`): Electron 29, React 18, TypeScript 5.4, bundled via `esbuild`. Custom dark obsidian theme with Radiant Coral accent (`#ff8a73`) and sharp industrial radii (2–6px).
- **Mobile Stubs**: React Native for press floor operators (`apps/worker-app`) and outside piece-rate contractors (`apps/labour-app`).
- **Shared Packages** (`packages/`):
  - `packages/api-types`: TypeScript interfaces synchronized with `openapi.json`.
  - `packages/api-client`: Typed fetch-based `OfficeFlowwClient` with authentication state management.
  - `packages/validation`: Shared validation utilities (GSTIN, Phone, Quantities).

---

## 3. Architecture & Domain Layout

The backend is structured as a Modular Monolith in `apps/api/app/` across 32 domain modules interacting via explicit service calls:

```
apps/api/app/
├── auth/           # JWT access & refresh tokens, password hashing, session tracking
├── users/          # User accounts, 10 production RBAC roles
├── clients/        # Client organizations, GSTIN validation, contacts
├── products/       # Product catalog, multi-component BOM with wastage markup
├── orders/         # Multi-product orders, order items, lifecycle states
├── workflows/      # DAG-based workflow templates & per-order execution instances
├── tasks/          # Auto-generated tasks from ready workflow steps, blockers
├── files/          # Logical workspaces (ORD-xxxx/), SHA-256 checksums
├── approvals/      # Artwork proof approval engine, immutable approved versions
├── stock/          # Physical vs Reserved vs Available stock, lot traceability
├── purchasing/     # Suppliers, purchase orders, goods receipt notes (GRN), price trends
├── production/     # Machines, deterministic batch codes, production file lock
├── labour/         # Contractor directory, material credit ledger, piece-rate payments
├── assets/         # Tools inventory, check-in/out state machine
├── packing/        # Container aggregation (BOX, BUNDLE, CARTON), dual sign-off
├── dispatch/       # Bus cargo, courier, tempo logistics, delivery expense ledger
├── billing/        # GST invoicing, payment recording, order completion invariant
├── quotations/     # Tiered quantity pricing, Decimal costing breakdown
├── capacity/       # Machine/worker capacity, absence handover planning
├── eta/            # Dynamic critical-path delivery forecasting
├── automation/     # Idempotent Event-Condition-Action (ECA) rule execution
├── notifications/  # Strategy abstraction (InApp, Desktop, MobilePush, WhatsApp)
├── ai/             # Read-only query tools (orders at risk, low stock, workload)
├── analytics/      # Financial, operational, and responsibility audit dashboards
├── integrations/   # Google Sheets CSV importer, Trello migration mapper
├── worker/         # Floor-sanitized operator endpoints (timers, defect logging)
└── core/           # Config, database session, security, celery tasks, events
```

### Desktop UI Layout
The desktop client organizes operations into primary workspaces:
1. `Dashboard` (`Home`): High-level operational summaries and quick actions.
2. `Orders`: Client orders table with inline entry and multi-select "Things Ordered".
3. `Tasks`: Kanban task boards and queue management.
4. `Staff`: Employee directory, shift tracking, and workstation telemetry.
5. `Labour`: Outside contractor directory, active MPL orders, and material credit ledger.
6. `Stock`: 14 fixed core materials with inline quantity/price updates and usage logging.
7. `Clients`: Client directory, contact cards, and activity logs.
8. `Billing`: GST invoicing, client receipts, and centralized staff/contractor payroll.
9. `Settings`: Accent theme customization and system configuration.

---

## 4. Key Business Invariants

1. **Available Stock Invariant**:
   $$\text{Available} = \text{Physical} - \text{Reserved}$$
   Order confirmation places a reservation hold without decrementing physical stock. Consumption is recorded only upon physical machine load or contractor issue.
2. **Production File Lock Guard**:
   `ProductionBatch` initialization strictly verifies that the referenced `FileVersion` is `APPROVED`.
3. **Labour Material Credit Ledger**:
   Surplus hardware issued to outside contractors (e.g. hooks) remains company-owned in `LabourStockLedger`. Subsequent jobs automatically deduct remaining credit balances before calculating net warehouse issues.
4. **Accepted-Piece Compensation**:
   Payable amounts are calculated strictly from verified good units ($Q_{\text{accepted}} \times \text{Rate}$). Raw issued materials and defectives are excluded.
5. **Tripartite Order Completion**:
   An order cannot transition to `COMPLETED` unless:
   - All workflow steps are `COMPLETED` or `SKIPPED`.
   - All packing tasks are verified.
   - Net packed good units match or exceed ordered quantities.
6. **Deterministic Computation**:
   Financials, taxes, scrap rates, and pricing use Python `decimal.Decimal`. AI components have read-only access to query tools and zero mutation capability.

---

## 5. Current Implementation Status

| Component | Status | Verification | Notes |
| :--- | :--- | :--- | :--- |
| **Backend API** | Complete & Hardened | 36/36 pytest suites passing (100%) | Covers all 4 phases, concurrency, and fault tolerance. |
| **Database Migrations** | Complete | Alembic `0001` through `0003` | Schema supports full production operational model. |
| **TypeScript Packages** | Complete | `tsc --noEmit` passes with 0 errors | `@officefloww/api-types`, `@officefloww/api-client`, `@officefloww/validation`. |
| **Desktop Application** | Functional UI | Bundles via `esbuild` | Features 21 views across 7 workspaces. Includes offline mock fallback. |
| **Mobile Apps** | Stub / Prototype | `tsc --noEmit` passes with 0 errors | Single-screen functional prototypes for press workers and contractors. |

### Known Issues & Quirks
- **Desktop Typecheck Mismatches**: Running strict `tsc --noEmit` on `apps/desktop` reports errors due to minor drift between mock fallback data/enums (`UserRole.OPERATOR`/`WORKER`, `TaskStatus.DONE`) and backend OpenAPI types. The app builds and runs via `esbuild`, which strips types.
- **Offline Fallback in Desktop**: Desktop services include mock seed fallbacks (`apps/desktop/src/api/services.ts`), allowing the UI to run even when the FastAPI server is offline.

---

## 6. Development & Operations

### Ports & Default URLs
- **FastAPI Backend**: `http://localhost:8000` (Docs: `/docs`, `/redoc`, OpenAPI: `/openapi.json`)
- **Desktop Dev Server**: `http://localhost:3000`
- **PostgreSQL**: `localhost:5432` (db: `officefloww`, user: `officefloww`)
- **Redis**: `localhost:6379`
- **MinIO**: API `localhost:9000`, Console `localhost:9001` (bucket: `officefloww-files`)

### Standard Accounts (Seed Data)
- Seed account credentials and role assignments are documented in `README.md` (Pre-Configured Seed Accounts).
- Key accounts: `owner@officefloww.com`, `admin@officefloww.com`, `manager@officefloww.com`, `prodmgr@officefloww.com`, `accounts@officefloww.com`.

