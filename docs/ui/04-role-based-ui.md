# 04 - Role-Based Access Control (RBAC) & Dynamic UI

## Overview
OfficeFloww enforces enterprise RBAC at both the client layout layer and server-side API endpoints. The user interface automatically shapes its sidebar navigation, action triggers, and administrative modals based on the authenticated `UserRole`.

## 10-Role Capability Matrix

| Role | Permitted Nav Sections | Primary Operational Responsibilities |
| :--- | :--- | :--- |
| **OWNER** | All 10 Sections | Full company authority, financial summaries, override overrides |
| **ADMIN** | All 10 Sections | User management, settings, system configuration |
| **MANAGER** | Dashboard, Orders, Tasks, Approvals, Clients, Products, Stock, Labour, Billing | Workflow supervision, proof approvals, contractor payouts |
| **SALES** | Dashboard, Orders, Clients, Products, Approvals | Quotations, client onboarding, new order instantiations |
| **DESIGNER** | Tasks, Approvals, Orders, Files | Artwork preparation, student data layout, proof uploads |
| **DATA_OPERATOR** | Tasks, Orders, Files | Roster ingestion, CSV mapping, barcode generation |
| **PRODUCTION_MANAGER** | Dashboard, Orders, Tasks, Approvals, Products, Stock, Labour | Press scheduling, machine allocations, scrap analysis |
| **MACHINE_OPERATOR** | Tasks, Stock | Digital press runs, sublimation heat transfers, defect counts |
| **PACKING_OPERATOR** | Tasks | Dual-verification barcode scanning, box packaging |
| **ACCOUNTS** | Dashboard, Billing, Orders, Clients, Labour | GST invoice generation, client payment receipts, contractor payouts |

## UI Permission Gates
The application implements declarative permission wrappers:
```tsx
// Role-based visibility
<RoleGate allowedRoles={["OWNER", "ADMIN", "MANAGER"]}>
  <Button variant="danger">Cancel Entire Order</Button>
</RoleGate>

// Capability-based visibility
<PermissionGate permission="canApproveProofs">
  <Button variant="primary" onClick={handleApprove}>Approve Proof</Button>
</PermissionGate>
```

## Quick Workstation Seed Account Switcher
For seamless demonstration and role validation, the Login screen provides 1-click authentication into all 10 seed personas with pre-filled credentials.
