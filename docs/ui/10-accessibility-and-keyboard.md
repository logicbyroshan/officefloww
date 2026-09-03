# 10 — Keyboard Shortcuts & Accessibility

Shop floor operators and factory managers require keyboard-first efficiency without reaching for the mouse:

---

## 1. Global Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Ctrl + K` (or `Cmd + K`) | Open Global Search across all 6 business modules | Global |
| `Ctrl + \` | Toggle Sidebar between Collapsed (68px) and Expanded (240px) | Global |
| `Ctrl + Shift + V` | Open Voice & Natural Language Assistant bar | Global |
| `Esc` | Close active Modal, Drawer, or Search overlay | Global |
| `Enter` | Submit focused form, advance primary action | Modals & Drawers |
| `Tab` / `Shift + Tab` | Sequentially cycle through focusable interactive controls | Forms & Tables |

---

## 2. Accessibility Best Practices

- **Contrast Compliance**: Text contrast meets WCAG 2.1 AA standards against the deep obsidian canvas (`#090c13`).
- **Semantic Structure**: Proper `<header>`, `<aside>`, `<main>`, `<h1>`, and `<button>` semantic elements throughout the DOM.
- **Focus Indicators**: Subtle radiant coral glow (`0 0 0 2px var(--accent-border)`) on focused interactive inputs.
- **Tooltips on Collapsed Mode**: Native HTML `title` attributes ensure all icons are immediately identifiable even when collapsed.
