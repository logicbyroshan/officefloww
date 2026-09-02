# 02 - Single-Accent Design System & Tokens

## Core Philosophy
OfficeFloww is built as a mission-critical operations cockpit. It rejects visual clutter, oversized bubbly corners, and playful gradients in favor of **precision, dense data hierarchy, and high contrast legibility**.

## Color Tokens & Single-Accent Architecture
The UI establishes a dark neutral background palette with **one primary accent variable family** (`--accent`), complemented by semantic status colors strictly reserved for badges and error states.

### Neutral Foundation Tokens
```css
--bg-app: #0d1117;          /* Root application canvas */
--bg-surface: #161b22;      /* Sidebar, table headers, toolbar panels */
--bg-card: #1c2128;         /* Operational card containers */
--bg-card-hover: #22272e;   /* Interactive item hover state */
--bg-muted: #2d333b;        /* Badges, code snippets, inputs */

--border-subtle: #2d333b;   /* Subtle row and card borders */
--border-medium: #373e47;   /* Dividers and input borders */
--border-strong: #444c56;   /* Active boundaries and focused inputs */

--text-primary: #f0f6fc;    /* High-contrast headings and active labels */
--text-secondary: #c9d1d9;  /* Body copy, table cells */
--text-muted: #8b949e;      /* Timestamps, secondary metadata, unit labels */
```

### Configurable Accent Themes
Users can dynamically switch the workstation's accent palette in **Settings**:
1. **Sapphire Blue (Default)**: `#388bfd` — High-tech precision engineering.
2. **Factory Teal**: `#00b4d8` — Vibrant industrial workflow clarity.
3. **Production Emerald**: `#2ea043` — Clean manufacturing and balance efficiency.
4. **Precision Crimson**: `#e056fd` — Vivid queue alert focus.
5. **Monochrome Zinc**: `#9099a2` — Ultra-neutral studio workstation mode.

```typescript
export interface AccentTheme {
  id: string;
  name: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentBorder: string;
  accentText: string;
}
```

### Strict Semantic Status Color Rules
Semantic colors are **never** used for generic background styling. They are strictly reserved for status dots, alerts, and priority badges:
- **Success (`#3fb950`)**: Completed steps, approved artwork, 100% quantity reconciled.
- **Warning (`#d29922`)**: Pending proofs, high scrap rate, material low warning.
- **Error (`#f85149`)**: Blocked steps, defective batches, rejected proofs, overdue SLA.
- **Info (`#58a6ff`)**: System notifications and general info.

## Shape Language & Radii
To maintain a sharp enterprise feel, all corner radii are strictly bounded between 2px and 6px:
```css
--radius-xs: 2px;  /* Badges, tags, small inputs */
--radius-sm: 4px;  /* Buttons, modal cards, stat boxes */
--radius-md: 6px;  /* Top-level application cards and dialogs */
```
*Pill cards and 20px+ radii are forbidden in core operations.*

## Typography Hierarchy
- **Body & Controls**: `Inter`, `-apple-system`, `system-ui` (Clean, balanced sans-serif).
- **Numbers, Codes, Values**: `JetBrains Mono`, `Consolas`, `monospace` (Tabular monospace for alignment of order codes, quantities, and GST numbers).
