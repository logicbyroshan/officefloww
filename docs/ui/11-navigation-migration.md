# 11 — Navigation Migration Matrix

This document provides the definitive migration cross-reference from the legacy 18-module sidebar to the unified **7 Primary Business Workspaces**.

---

## 1. Complete Migration Mapping Table

| Former Top-Level Module | New Primary Workspace | Navigation Path / Access Method | User Rationale & Benefit |
| :--- | :--- | :--- | :--- |
| **Dashboard** | **Dashboard** | Sidebar → `Dashboard` | Transformed from a module dump into an actionable shortcut center with live operational digest. |
| **Quotations & Costing** | **Clients** | Sidebar → `Clients` → `Quotations` Tab | Commercial proposals belong directly inside the customer relationship context. |
| **Production Orders** | **Clients** & **Tasks** | Sidebar → `Clients` → `Orders` Tab, or Sidebar → `Tasks` | Orders are commercial commitments (Clients) realized as scheduled operational tasks (Tasks). |
| **Task Queue** | **Tasks** | Sidebar → `Tasks` → `All Tasks` / `My Tasks` | Upgraded to a modern work manager with spreadsheet tables and Kanban lanes. |
| **Proof Approval** | **Clients** & **Tasks** | Sidebar → `Clients` → `Approvals` Tab, or Sidebar → `Tasks` → `Approvals` Tab | Customer artwork approvals relate both to the client account and the manufacturing schedule. |
| **Clients Directory** | **Clients** | Sidebar → `Clients` → `Clients Directory` Tab | Core directory of institutions, primary contacts, and ledger credit limits. |
| **Products & BOM** | **Settings** | Sidebar → `Settings` → `Products & BOM` Category | Product definitions and bill-of-material recipes are master data configurations. |
| **Machines & Batches** | **Settings** | Sidebar → `Settings` → `Machines & Batches` Category | Equipment telemetry and maintenance calibration are system asset settings. |
| **Stock & Inventory** | **Stock** | Sidebar → `Stock` → `Inventory Register` Tab | Redesigned into a spreadsheet register with frozen headers and instant stock scanning. |
| **Purchasing & POs** | **Stock** | Sidebar → `Stock` → `Purchase Orders` Tab | Material procurement and supplier POs belong directly inside material inventory management. |
| **Labour & Contractors** | **Staff** | Sidebar → `Staff` → `Labour & Contractors` Tab | Contractor piece-rates and hardware tracking are consolidated under people and workforce. |
| **Packing Operations** | **Tasks** | Sidebar → `Tasks` (Work Type: `PACKING`) | Packing and carton labeling are final-stage production work items. |
| **Dispatch & Logistics** | **Tasks** | Sidebar → `Tasks` (Work Type: `DISPATCH`) | Courier handoff and consignment tracking are operational dispatch tasks. |
| **Billing & Invoices** | **Billing** | Sidebar → `Billing` → `Tax Invoices` Tab | Direct financial workspace for tax invoicing, collections, and GST reporting. |
| **Analytics & Reports** | **Billing** & **Dashboard** | Sidebar → `Billing` → `Reports` Tab | High-level operations overview on Dashboard; financial reports inside Billing. |
| **Audit & Activity Trail** | **Settings** | Sidebar → `Settings` → `System & Audit Trail` Category | Cryptographic system audit logs belong in system configuration and compliance. |
| **Automation Rules** | **Settings** | Sidebar → `Settings` → `Automation Rules` Category | Trigger-action manufacturing automation rules are configured in Settings. |
| **Workstation Settings** | **Settings** | Sidebar → `Settings` → `General & Branding` Category | Visual theme, backend host URLs, and hardware peripheral settings. |

---

## 2. Summary of User-Facing Improvements

1. **Reduced Cognitive Load**: Instead of scanning 18 choices, the user sees only 7 clearly defined business areas.
2. **Context Preservation**: You no longer jump across 4 separate pages to manage a single client order; quotations, orders, and approvals live together in `Clients`.
3. **Spreadsheet Velocity**: The `Stock` register allows scanning dozens of rows in seconds, just like an industrial spreadsheet.
4. **Actionable Start**: The `Dashboard` highlights what needs immediate attention rather than duplicating raw tables.
