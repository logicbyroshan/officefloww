# 03 — Design Tokens & Visual Theme

## 1. Single Product Accent Rule

PrintFlow rejects visual clutter and excessive rainbow badge systems. The application adheres strictly to:
- **One Accent Color**: Adharsh Coral (`#ff8a73`, HSL 10° 100% 73%).
- **Calm Neutral Base**:
  - `var(--bg-canvas)`: `#090c13`
  - `var(--bg-card)`: `rgba(19, 23, 34, 0.78)` with `backdrop-filter: blur(14px)`
  - `var(--border-subtle)`: `rgba(255, 255, 255, 0.07)`
  - `var(--border-medium)`: `rgba(255, 255, 255, 0.12)`
  - `var(--text-primary)`: `#ffffff`
  - `var(--text-secondary)`: `#94a3b8`
  - `var(--text-muted)`: `#64748b`

---

## 2. Sharp Industrial Radii

To evoke manufacturing machinery and professional desktop software, radii are constrained:
- Base inputs & buttons: `var(--radius-sm)` (4px)
- Cards & modals: `var(--radius-md)` (6px)
- Micro badges & chips: `var(--radius-xs)` (2px–3px)
- **Zero Pill Shapes**: No `border-radius: 9999px` or ballooning containers.

---

## 3. Typography & Numerical Precision

- Body and structural elements: Modern geometric sans-serif (`Outfit`, `Inter`, `-apple-system`).
- Financial sums, SKU numbers, timestamps, and order codes: Fixed-width monospace (`JetBrains Mono`, `Fira Code`, `Consolas`).
- Currency values are consistently formatted with Indian rupee symbol (`₹`) and standard comma separators (e.g. `₹1,82,500.00`).
