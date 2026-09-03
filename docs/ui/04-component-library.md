# 04 — Component Library Specification

The PrintFlow component library is located at `apps/desktop/src/design-system/components/`. Every component is built with zero external design runtime dependencies and renders natively in React.

---

## 1. Core Component Primitives

### `Button` (`Button.tsx`)
- **Variants**: `primary` (radiant coral gradient), `secondary` (frosted glass surface), `ghost` (clean text with hover background), `danger` (subtle red warning tint).
- **Sizes**: `sm` (28px height for table actions), `md` (36px standard), `lg` (44px auth actions).
- **Features**: Built-in loading spinner, icon slotting, accessible focus rings.

### `Card` & `StatBox` (`Card.tsx`)
- Frosted glass containers (`rgba(19, 23, 34, 0.78)`) with `backdrop-filter: blur(14px)` and fine hairline borders (`rgba(255, 255, 255, 0.08)`).
- StatBox provides compact metric blocks with title, numerical value, unit, and subtle directional indicators.

### `Table` (`Table.tsx`)
- High-density spreadsheet-style table with sticky frozen headers (`position: sticky; top: 0`).
- Strict right-alignment for numerical columns (`align: "right"`).
- Keyboard row navigation and click-to-open drawer triggers.

### `Drawer` (`Modal.tsx`)
- Non-modal master-detail slideout from the right edge (`width: 440px`).
- Preserves table context on the left while displaying deep item properties, logs, and action forms on the right.

### `Icon` (`Icon.tsx`)
- Pure inline SVG renderer supporting over 50 enterprise icons (`dashboard`, `tasks`, `staff`, `stock`, `clients`, `billing`, `settings`, `mic`, `bell`, `calendar`, `columns`, `sliders`).
