# PrintFlow UI Documentation Suite (Adharsh Bhopal OS)

Welcome to the comprehensive UX, UI architecture, and design specification documentation for the PrintFlow desktop enterprise operating system.

---

## Documentation Index (00 – 19)

| Document | Title | Description |
| :--- | :--- | :--- |
| **[00-index.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/00-index.md)** | Documentation Master Index | Complete sitemap, principles, and architectural index |
| **[01-ui-architecture.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/01-ui-architecture.md)** | UI & Desktop Architecture | Electron + React 18 + TypeScript runtime foundation |
| **[02-information-architecture.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/02-information-architecture.md)** | Information Architecture | The 7 primary business workspaces and layout hierarchy |
| **[03-design-tokens-and-theme.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/03-design-tokens-and-theme.md)** | Design Tokens & Theme | Single accent rule, sharp radii (2px-6px), color contrast |
| **[04-component-library.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/04-component-library.md)** | Component Library Specification | Atomic controls, tables, cards, badges, and drawers |
| **[05-view-specifications.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/05-view-specifications.md)** | View Specifications | Functional blueprint for all 7 primary application views |
| **[06-interaction-patterns.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/06-interaction-patterns.md)** | Interaction Patterns | Master-detail, spreadsheet scanning, drawered workflows |
| **[07-state-management.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/07-state-management.md)** | State Management & Cache | Auth context, optimistic updates, and persistent state |
| **[08-api-integration.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/08-api-integration.md)** | API & Telemetry Integration | FastAPI REST client, WebSocket bridge, AI assistant |
| **[09-desktop-packaging.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/09-desktop-packaging.md)** | Desktop Packaging & Build | Electron builder, secure IPC, preload scripts, bundling |
| **[10-accessibility-and-keyboard.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/10-accessibility-and-keyboard.md)** | Keyboard & Accessibility | `Ctrl+K`, `Ctrl+\`, `Ctrl+Shift+V`, ARIA landmarks |
| **[11-navigation-migration.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/11-navigation-migration.md)** | Navigation Migration Matrix | Old top-level module to 7 primary workspaces map |
| **[12-role-based-experience.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/12-role-based-experience.md)** | Role-Based UX System | 10 role workstation access policies and domain rules |
| **[13-order-lifecycle-ux.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/13-order-lifecycle-ux.md)** | 9-Stage Order Lifecycle | Commercial quote to courier dispatch visual flow |
| **[14-batch-operations-ux.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/14-batch-operations-ux.md)** | Batch Operations & High Density | High-volume scanning, frozen headers, monospace data |
| **[15-labour-contractor-ux.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/15-labour-contractor-ux.md)** | Contractor & Labour UX | Hardware issued, accepted vs rejected piece-rates |
| **[16-offline-and-sync-ux.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/16-offline-and-sync-ux.md)** | Offline & Network Synchronization | Connection banner, reconnect policies, local buffer |
| **[17-voice-and-ai-ux.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/17-voice-and-ai-ux.md)** | Voice Mode & Telemetry Assistant | Web Speech API, shop-floor voice command engine |
| **[18-print-and-hardware-ux.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/18-print-and-hardware-ux.md)** | Hardware & Peripheral UX | Thermal label printers, electronic scales, barcode guns |
| **[19-future-roadmap.md](file:///e:/E/AIDC%20Projects/OfficeFloww/docs/ui/19-future-roadmap.md)** | Production Roadmap | Edge sync, camera barcode scanning, offline SQL cache |

---

## Foundational Design Invariants

1. **Strictly 7 Primary Workspaces**: `Dashboard`, `Tasks`, `Staff`, `Stock`, `Clients`, `Billing`, `Settings`.
2. **Single Product Accent Color**: Radiant Adharsh Coral (`#ff8a73`), with dark obsidian frosted glassmorphic surfaces (`#090c13`).
3. **Sharp Industrial Geometry**: Strict 2px – 6px corner radii. No bubble-pills or oversized margins.
4. **Desktop-First Density**: Monospace data, right-aligned currency, compact rows, keyboard-first velocity.
