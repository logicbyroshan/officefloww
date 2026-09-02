# 15. Strategic Roadmap - OfficeFloww

## Phase 1: Foundational Production OS (Completed)
- [x] Modular monolith architecture with 14 isolated domain modules.
- [x] PostgreSQL database schema with Alembic migrations and UUID keys.
- [x] Secure authentication with bcrypt and rotating refresh tokens.
- [x] Server-side RBAC covering 10 operational printing roles.
- [x] Configurable product catalog with multi-component Bill of Materials (BOM).
- [x] DAG workflow engine with parallel execution branches and automatic task generation.
- [x] Task queue with blockers, priorities, and audit trails.
- [x] S3/MinIO logical file workspaces with non-destructive versioning (`v1` → `vn`).
- [x] Approval engine with version locking and workflow advancement.
- [x] Double-entry quantity ledger with real-time scrap rate computation.
- [x] Immutable audit logging with correlation IDs.
- [x] Typed TypeScript API contracts (`@officefloww/api-types`, `@officefloww/api-client`, `@officefloww/validation`).
- [x] Desktop (Electron + React) and Mobile (React Native) integration stubs.
- [x] 100% automated test suite passing across all domains.

---

## Phase 2: Factory Automation & Inventory (Recommended Next Steps)
- **Direct Stock & Inventory Engine**:
  - Raw material inventory deductions automatically driven by product Bill of Materials (BOM) upon order confirmation.
  - Low-stock reorder thresholds and purchase requisition workflows.
- **Barcode & QR Scanner Workflows**:
  - Scanning physical card carriers, job jackets, and roll-call sheets on the shop floor via mobile cameras or 2D Bluetooth barcode scanners.
  - Automatic task status advancement via single barcode scans.
- **Direct Machine & RIP Software Integrations**:
  - Hot folder integration for raster image processors (Caldera, Onyx, Wasatch).
  - Print counter telemetry from digital presses (Epson, HP, Konica Minolta, Zebra).
- **Client & Vendor Portal**:
  - Direct customer portal for CSV roster uploads, photo uploads, and web-based artwork approval proofing.
  - Vendor purchase order dispatch and raw material delivery tracking.

---

## Phase 3: Analytics, Payroll & Predictive Operations
- **Piece-Rate Labour Payroll Engine**:
  - Automatic bi-weekly and monthly wage calculations based on validated `QuantityTransaction` completions logged by labour workers.
  - Contractor payment settlement and expense tracking.
- **Real-Time Machine Capacity & Dynamic Scheduling**:
  - Automated gantt chart scheduling based on estimated step duration, SLA deadlines, and press availability.
- **Predictive Scrap & Cost Forecasting**:
  - Machine learning models predicting scrap rates based on ribbon lot numbers, ambient humidity, and card sheet thickness.
