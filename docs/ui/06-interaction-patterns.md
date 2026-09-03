# 06 — Interaction Patterns

## 1. Master-Detail Side Drawer Pattern

When inspecting complex records (Tasks, Stock Items, Staff Members, Invoices), PrintFlow avoids destructive full-page transitions:
- The spreadsheet table remains visible on the left.
- A 440px side drawer slides smoothly from the right edge (`animation: slideLeft 0.2s cubic-bezier(0.16, 1, 0.3, 1)`).
- The user can review deep item properties, input blocker reasons, or complete steps while maintaining table context.

---

## 2. Spreadsheet-Style Operational Register

The Stock and Task registers prioritize rapid scanning:
- Frozen sticky headers keep column labels visible during infinite scroll.
- Dense rows (36px–40px) allow 15–20 items to be visible simultaneously without pagination friction.
- Right-aligned monospace values ensure decimal places line up vertically for instantaneous optical comparison.

---

## 3. Collapsible Sidebar Behavior

- **Expanded Mode (240px)**: Displays full workspace titles, section labels, and badge counters.
- **Collapsed Mode (68px)**: Shows only icons centered horizontally with browser native `title` tooltips on hover.
- **State Persistence**: Saved in `localStorage` under `printflow_sidebar_collapsed`.
- **Keyboard Shortcut**: `Ctrl+\` toggles collapse/expand instantly.
