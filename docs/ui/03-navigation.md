# 03 - Navigation & Information Architecture

## Overview
OfficeFloww provides an agile, low-latency navigation hierarchy designed for keyboard-driven power users and production supervisors.

## Information Hierarchy & Core Sections
1. **Dashboard (`/dashboard`)**: Production overview, urgent queue counts, bottleneck task escalation, quick order actions.
2. **Orders (`/orders`)**: Comprehensive order management, priority status tags, creation modal, and deep DAG/quantity inspection.
3. **Tasks (`/tasks`)**: Floor execution queue (All, My Tasks, Blocked Bottlenecks, Completed History) with drawer inspection.
4. **Approvals (`/approvals`)**: Artwork proof review gate enforcing the Production File Lock before press batching.
5. **Clients (`/clients`)**: Directory of commercial & institutional accounts, GSTIN tax identifiers, and contact persons.
6. **Products (`/products`)**: Catalog, category filters, and multi-component Bill of Materials (BOM) configurations.
7. **Stock (`/stock`)**: Warehouse stock balances with strict Physical vs Reserved separation.
8. **Labour (`/labour`)**: Outside contractor directory & Labour Material Credit Ledger.
9. **Billing (`/billing`)**: GST tax invoices and cryptographic enforcement of the Tripartite Order Completion Invariant.
10. **Settings (`/settings`)**: Theme switcher, API endpoint configuration, and backend health diagnostics.

## Global Keyboard Shortcuts
- `Ctrl + K` or `Cmd + K`: Opens the Universal Global Search modal across Orders, Clients, Tasks, and Products.
- `Escape`: Closes active modals, drawers, and search overlays.

## Urgency Badge Counters
The sidebar navigation displays live numeric counters:
- **Pending Proofs Counter**: In approvals section (amber badge).
- **Urgent / Blocked Tasks Counter**: In tasks section (red badge for blockers, blue badge for assigned work).

## Deep Linking & State Restoration
Selecting an order from Global Search or the Dashboard directly loads `OrderDetailView` with the active breadcrumb hierarchy (`Orders Directory > ORD-2026-0001`). Clicking back restores the previous filter and search state without reloading data.
