# 07 — State Management & Caching

PrintFlow minimizes state complexity by distinguishing between **Client UI State**, **Operational Server State**, and **Persistent Preferences**:

---

## 1. State Categories

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Persistent Workstation Preferences (localStorage)       │
│    • Accent theme selection ('coral')                       │
│    • Sidebar collapsed state ('true'/'false')               │
│    • Backend API base URL override                          │
├─────────────────────────────────────────────────────────────┤
│ 2. Session Authentication State (AuthContext)               │
│    • Current User & Active Role                             │
│    • JWT Access Token & Refresh Token                       │
│    • RBAC permissions array                                 │
├─────────────────────────────────────────────────────────────┤
│ 3. Transient Operational Cache (useAsync / Component State) │
│    • In-memory lists of Orders, Tasks, Clients, Approvals   │
│    • Active search queries & filter chips                   │
│    • Open modal / drawer flags & selected item IDs          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Optimistic Updates & Invalidation

When an operator advances a task or logs a stock receipt:
1. The client displays an immediate toast notification.
2. The asynchronous API call is executed in the background.
3. Upon API resolution, parent state invalidates and refetches the canonical record from the FastAPI backend.
