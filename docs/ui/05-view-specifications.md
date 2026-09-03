# 05 — View Specifications

Detailed functional blueprint for the 7 primary application views in `apps/desktop/src/views/`:

---

## 1. Dashboard View (`DashboardView.tsx`)
- **Header**: Live workstation telemetry indicator, refresh trigger.
- **Quick Actions Bar**: Permission-aware rapid creation buttons (`+ New Order`, `+ New Task`, `+ New Client`, `+ Quotation`, `Stock Entry`, `Record Payment`).
- **Today's Work Summary Blocks**: Compact metric indicators for Tasks, Orders, Approvals, Stock, and Dispatch.
- **Needs Attention Feed**: Clickable warning queue showing at-risk orders, overdue tasks, and low stock thresholds.
- **Active Operations Table**: Real-time list of in-flight orders with delivery date milestones.

---

## 2. Tasks Workspace (`TasksView.tsx`)
- **Navigation Tabs**: `My Tasks`, `All Tasks`, `Board` (Kanban lanes), `Overdue`, `Blocked`, `Approvals`.
- **Work Type Filter Chips**: `Production Press`, `Assembly & Fitting`, `Data Roster`, `Artwork Proofing`, `Packing`, `Dispatch`.
- **Master-Detail Drawer**: Full task metadata, status advance triggers, blocker logs, and comment feed.
- **Task Creation Modal**: Quick allocation modal with assignee, quantity, and instructions.

---

## 3. Staff Workspace (`StaffView.tsx`)
- **Sub-Tabs**: `All Staff`, `Employees`, `Labour & Contractors`, `Assignments & Workload`, `Objective Performance`.
- **Contractor Ledger**: Raw materials held, accepted vs. rejected counts, rate per unit, outstanding payouts.
- **Smart Dispatch Recommendation**: Suggests operators based on availability, current queue, and defect pass rate.

---

## 4. Stock Workspace (`StockDashboardView.tsx`)
- **Sub-Tabs**: `Inventory Register`, `Ledger Movements`, `Low Stock Alerts`, `Purchase Orders`, `Suppliers Directory`.
- **Spreadsheet Table**: High-density columns (`Physical`, `Reserved`, `Available`, `Minimum`, `Unit`, `Cost`).
- **Goods Receipt (GRN) Modal**: Instant intake logging with batch notes and quantity addition.

---

## 5. Clients Workspace (`ClientsView.tsx`)
- **Sub-Tabs**: `Client Directory`, `All Orders`, `Quotations & Costing`, `Proof Approvals`.
- **Client 360° Drawer**: Organization contacts, billing address, credit limits, and order history.
- **Integrated Order Detail**: 9-stage lifecycle timeline, BOM breakdown, and proof approval signoffs.

---

## 6. Billing Workspace (`BillingView.tsx`)
- **Sub-Tabs**: `Tax Invoices`, `Payments Received`, `Client Ledger`, `Expenses & Disbursements`, `Reports`.
- **KPI Balance Tiles**: Total Receivables, Month-to-Date Collections, Invoices Awaiting Payment.
- **Record Payment Modal**: Split payment allocation, payment method (NEFT, UPI, Cheque), and UTR logging.

---

## 7. Settings Workspace (`SettingsView.tsx`)
- **2-Column Layout**: Left navigation, right active configuration panel.
- **Configuration Sections**: `General & Branding`, `Products & BOM`, `Workflow Templates`, `Machines & Batches`, `Automation Rules`, `Voice & AI Assistant`, `System & Audit Trail`.
