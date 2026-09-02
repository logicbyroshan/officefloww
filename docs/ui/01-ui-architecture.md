# 01 - Desktop UI Architecture

## Overview
OfficeFloww Desktop UI is an industrial-grade Electron + React/TypeScript operating system tailored specifically for high-volume commercial printing, lanyard production, and institutional card manufacturing.

## High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                 Electron Main Process (Node.js)             │
│   • BrowserWindow (1280x860, min 1024x700)                 │
│   • Security Sandbox: contextIsolation: true, nodeInt: false│
│   • Preload Bridge: contextBridge.exposeInMainWorld        │
└──────────────────────────────┬──────────────────────────────┘
                               │ IPC / ContextBridge
┌──────────────────────────────▼──────────────────────────────┐
│                Electron Renderer Process (DOM)               │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ App Root (<AuthProvider> -> <ToastProvider>)         │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │ AppShell Layout                                     │   │
│   │  ├─ TopBar (Global Search Ctrl+K, Live Ping, Role)  │   │
│   │  ├─ Sidebar (Role-Gated Navigation + Urgent Badges) │   │
│   │  └─ Main Content Viewport                           │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │ Single-Accent Design System Tokens & Components     │   │
│   │  • Base CSS Tokens (dark neutral, 2px-6px radii)    │   │
│   │  • 5 Configurable Accent Themes                     │   │
│   │  • Tables, Modals, Drawers, Quantity Breakdown     │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │ API Client Wrapper (@officefloww/api-client)        │   │
│   │  • Automatic Bearer JWT Injection                   │   │
│   │  • Heartbeat Polling & 401 Session Interceptor      │   │
│   └──────────────────────────┬──────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTP / JSON REST
┌──────────────────────────────▼──────────────────────────────┐
│           FastAPI Monolith Backend (127.0.0.1:8000)         │
│   • JWT Auth & RBAC Permissions Matrix                      │
│   • SQLite / PostgreSQL WAL Database                        │
│   • DAG Workflow Execution & Double-Entry Ledger Engine     │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure
```
apps/desktop/
├── main.js                      # Electron main entry point
├── preload.js                   # Secure contextBridge isolation
├── index.html                   # Shell container + Inter/JetBrains fonts
├── package.json                 # Desktop dependencies and build scripts
└── src/
    ├── api/                     # Singleton API client & typed domain services
    │   ├── client.ts
    │   ├── auth.service.ts
    │   └── services.ts
    ├── auth/                    # RBAC matrix, auth context & permission gates
    │   ├── permissions.ts
    │   ├── AuthContext.tsx
    │   └── RoleGate.tsx
    ├── design-system/           # Tokens, layouts & atomic component library
    │   ├── tokens/
    │   │   ├── index.css
    │   │   └── theme.ts
    │   ├── components/          # Icon, Button, Table, Modal, Drawer, Toast, etc.
    │   └── layouts/             # PageHeader, SplitPane, SectionHeader
    ├── hooks/                   # useAsync, useConnection
    ├── layout/                  # AppShell, TopBar, Sidebar
    ├── views/                   # Operational screens (Orders, Tasks, Clients, etc.)
    ├── App.tsx                  # App root orchestration & modal manager
    └── index.tsx                # React DOM 18 bootstrap
```

## Production Integrity Enforcements
1. **Zero Mock Business Logic**: The UI consumes the live FastAPI backend for order creation, DAG step execution, blocker logging, and quantity auditing.
2. **Double-Entry Accounting Invariance**: Quantities strictly mirror `Ordered = Produced + InProgress - Waste - Defective`.
3. **Session Resiliency**: JWT tokens and active workstation role are securely cached in local storage with automatic token attachment.
