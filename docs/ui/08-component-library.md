# 08 - Component Library Catalog

## Overview
All UI components in OfficeFloww are custom built using pure Vanilla CSS tokens and TypeScript. There are no heavy 3rd-party component libraries or arbitrary Tailwind utility strings.

## Catalog of Components

### 1. Typography & Icons
- `Icon`: 24+ SVG icons for industrial production (orders, tasks, files, approvals, stock, labour, billing, alert-circle, check, etc.).
- `UserAvatar`: Compact circular initials tag with role indicators.

### 2. Actions & Controls
- `Button`: Primary, secondary, outline, ghost, danger variants with loading spinner and disabled states.
- `IconButton`: Compact square button for row action triggers and modal dismissals.
- `Input`: Enterprise form input with label, placeholder, error message, and prefix icons.
- `SearchInput`: Fast search input with magnifying icon and clear button.
- `Select`: Custom dropdown select aligned with dark neutral tokens.
- `Textarea`: Multi-line text field for QC notes and blocker reasons.

### 3. Feedback & Data Display
- `Badge`: Accent, default, success, warning, error, muted variants with optional status dot.
- `PriorityBadge`: Specialized badge reflecting Normal, High, Urgent/Critical, and Low job queues.
- `OrderStatusBadge`: Distinct semantic tags for Draft, Confirmed, In Production, Ready for Dispatch, Dispatched, Completed.
- `TaskStatusBadge`: Ready, In Progress, Blocked, Completed, Cancelled indicators.
- `Card`: Container with structured header, subtitle, and action buttons.
- `StatBox`: Key metric card with left status accent border, big numbers, and trend annotations.
- `Table & Column`: High-density tabular layout with custom column renderers and row click handlers.
- `Tabs`: Filter tab bar with badge count indicators.

### 4. Overlays & Interactive Dialogs
- `Modal`: Centered popup with header, backdrop blur, scrollable body, and action footer.
- `Drawer`: Slide-over panel (480px) for in-depth task resolution and blocker logs.
- `ConfirmDialog`: Two-button confirmation for critical actions.
- `ToastProvider & useToast`: Floating notification manager with auto-dismissal.

### 5. Domain Specializations
- `QuantityDisplay`: Authoritative double-entry ledger breakdown (Ordered, Good, Defective, Waste, Packed, Scrap Rate %).
- `ProgressBar`: Smooth percentage indicator.
- `WorkflowTimeline`: Interactive DAG stage progression with step type icons, assignee labels, and blocker warnings.
- `ConnectionBanner`: Full-width amber alert displayed when the backend is unreachable.
