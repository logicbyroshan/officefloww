# 48. Final API Reference & Contract Architecture

## 1. API Architecture Overview

- **Base URL**: `/api/v1`
- **Envelope Convention**: Every API returns a standard envelope:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "page": 1, "total": 100 } // optional pagination
  }
  ```
- **Error Convention**:
  ```json
  {
    "success": false,
    "error": {
      "code": "BUSINESS_RULE_VIOLATION",
      "message": "Over-allocation rejected...",
      "details": []
    }
  }
  ```

---

## 2. Complete Router Domain Catalog

| Domain Prefix | Functional Scope | Key Endpoints |
|---|---|---|
| `/auth` | Authentication & Token Management | `POST /login`, `POST /refresh`, `GET /me` |
| `/users` | User & Role Administration | `GET /`, `POST /`, `GET /{id}`, `PATCH /{id}` |
| `/clients` | Client Master & Contact Registry | `GET /`, `POST /`, `GET /{id}`, `POST /{id}/contacts` |
| `/products` | Products, Categories, Multi-version BOMs | `GET /`, `POST /`, `POST /{id}/boms`, `GET /boms/{id}` |
| `/orders` | Order Lifecycle & Workflow Instances | `GET /`, `POST /`, `POST /{id}/confirm`, `GET /{id}/workflow` |
| `/workflows` | Dynamic DAG Flow Engine | `GET /templates`, `POST /templates`, `POST /{id}/advance` |
| `/tasks` | Task Engine & Step Assignments | `GET /`, `GET /{id}`, `POST /{id}/claim`, `POST /{id}/complete` |
| `/files` | Files, Previews, Versioning & Approvals | `POST /upload`, `GET /{id}/versions`, `POST /versions/{id}/approve` |
| `/quantities` | Double-Entry Quantity Ledger | `GET /order-items/{id}/balance`, `POST /transactions` |
| `/stock` | Stock, Lots, Traceability & Warehouses | `GET /locations`, `GET /items`, `POST /lots`, `GET /traceability/lot/{id}` |
| `/purchasing` | Suppliers & Purchase Orders | `GET /suppliers`, `POST /suppliers`, `POST /orders`, `POST /orders/{id}/receive` |
| `/production` | Batches, Machines & Reconciliation | `POST /batches`, `POST /records`, `POST /batches/{id}/complete`, `GET /order-items/{id}/reconciliation` |
| `/labour` | Labourers, Work Orders & Material Credit | `GET /contractors`, `POST /work-orders`, `GET /contractors/{id}/material-balance` |
| `/assets` | Maintenance & Tool Calibration | `GET /`, `POST /`, `POST /{id}/maintenance-logs` |
| `/packing` | Packing Boxes, Barcodes & Inspection | `POST /tasks`, `POST /boxes`, `POST /tasks/{id}/complete` |
| `/dispatch` | Shipments, Tracking & Waybills | `POST /shipments`, `POST /shipments/{id}/dispatch`, `POST /shipments/{id}/deliver` |
| `/billing` | Invoicing, Payments & Order Completion | `POST /invoices`, `GET /invoices/{id}`, `POST /payments`, `GET /orders/{id}/completion-check` |
| `/quotations` | Estimation & Cost Breakdown Engine | `POST /calculate`, `POST /quotes`, `POST /quotes/{id}/accept` |
| `/capacity` | Resource Utilization & Absence Handover | `GET /utilization`, `POST /absence/plan-handover`, `GET /absence/{id}/summary` |
| `/eta` | Machine Learning / Rule ETA Engine | `POST /predict`, `GET /orders/{id}/eta` |
| `/automation` | Event Triggering & Idempotent Automation | `GET /rules`, `POST /rules`, `POST /trigger` |
| `/notifications` | Omnichannel Alerts & Client Proofs | `POST /send`, `POST /proofs/generate-link`, `POST /proofs/{token}/respond` |
| `/audit` | Immutable Audit Trail Explorer | `GET /logs`, `GET /entity/{name}/{id}` |
| `/worker` | Lightweight Mobile & Factory APIs | `GET /my-tasks`, `POST /tasks/{id}/quick-complete`, `GET /scan-barcode` |
| `/ai` | Natural Language Query & Action Assistant | `POST /chat`, `GET /tools` |

---

## 3. OpenAPI Schema Synchronization

The complete typed schema is available in:
- Backend: `http://localhost:8000/api/v1/openapi.json`
- Monorepo package: `packages/api-types/openapi.json`
- Monorepo TypeScript contracts: `packages/api-types/src/index.ts`
