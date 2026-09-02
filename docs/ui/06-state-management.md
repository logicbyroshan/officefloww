# 06 - State Management & Async Hooks

## Architecture Principles
OfficeFloww adheres to lightweight, unidirectional React state patterns without bloated external stores. State is organized into three distinct tiers:

1. **Global Workstation State (`AuthContext`)**:
   - Authenticated user profile (`id`, `email`, `full_name`, `role`).
   - Session tokens (`access_token`, `refresh_token`).
   - Workstation login, logout, and role-switching methods.

2. **Server-Synchronized Async State (`useAsync`)**:
   - Encapsulates loading flags, error objects, and data caching for orders, tasks, clients, and approvals.
   - Provides an idempotent `execute()` trigger for refreshing lists after modal mutations.

3. **Local View & Form State (`useState` & `useMemo`)**:
   - Search queries, active tab selections, modal drawer open/close flags.
   - Dynamic item lists within `NewOrderModal` with subtotal calculations.

## Live Heartbeat Polling (`useConnection`)
The application executes a lightweight heartbeat check every 15 seconds to `/openapi.json` using HTTP `HEAD`.
- If the server drops offline, an amber `ConnectionBanner` immediately mounts across the viewport alerting the operator.
- Once connectivity is restored, the banner seamlessly dismisses and triggers a data refresh.

## Toast Notification Queue (`ToastProvider`)
User actions (e.g. "Order Created", "Task Completed", "Blocker Logged") dispatch transient feedback cards in the top-right corner with 4000ms auto-dismissal.
