import React from "react";
import { OrderPriority, TaskStatus, OrderStatus, ApprovalStatus, UserRole } from "@officefloww/api-types";

export type BadgeVariant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "muted";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  style,
}) => {
  let bg = "var(--bg-muted)";
  let color = "var(--text-secondary)";
  let border = "1px solid var(--border-subtle)";
  let dotColor = "var(--text-muted)";

  switch (variant) {
    case "accent":
      bg = "var(--accent-soft)";
      color = "var(--accent-text)";
      border = "1px solid var(--accent-border)";
      dotColor = "var(--accent)";
      break;
    case "success":
      bg = "var(--status-success-soft)";
      color = "var(--status-success)";
      border = "1px solid var(--status-success-border)";
      dotColor = "var(--status-success)";
      break;
    case "warning":
      bg = "var(--status-warning-soft)";
      color = "var(--status-warning)";
      border = "1px solid var(--status-warning-border)";
      dotColor = "var(--status-warning)";
      break;
    case "error":
      bg = "var(--status-error-soft)";
      color = "var(--status-error)";
      border = "1px solid var(--status-error-border)";
      dotColor = "var(--status-error)";
      break;
    case "info":
      bg = "var(--status-info-soft)";
      color = "var(--status-info)";
      border = "1px solid var(--status-info-border)";
      dotColor = "var(--status-info)";
      break;
    case "muted":
      bg = "var(--bg-muted)";
      color = "var(--text-muted)";
      border = "1px solid var(--border-subtle)";
      dotColor = "var(--text-disabled)";
      break;
  }

  const padding = size === "sm" ? "1px 6px" : "3px 8px";
  const fontSize = size === "sm" ? "10px" : "11px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding,
        fontSize,
        fontWeight: 600,
        letterSpacing: "0.3px",
        textTransform: "uppercase",
        fontFamily: "var(--font-mono)",
        backgroundColor: bg,
        color,
        border,
        borderRadius: "var(--radius-xs)",
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            backgroundColor: dotColor,
          }}
        />
      )}
      {children}
    </span>
  );
};

export const StatusDot: React.FC<{
  status: "online" | "offline" | "busy" | "idle" | "success" | "warning" | "error";
  size?: number;
}> = ({ status, size = 7 }) => {
  let color = "var(--text-muted)";
  if (status === "online" || status === "success") color = "var(--status-success)";
  if (status === "warning" || status === "busy") color = "var(--status-warning)";
  if (status === "error" || status === "offline") color = "var(--status-error)";
  if (status === "idle") color = "var(--status-info)";

  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}`,
        flexShrink: 0,
      }}
    />
  );
};

export const PriorityBadge: React.FC<{ priority: OrderPriority | string }> = ({ priority }) => {
  const p = String(priority).toUpperCase();
  if (p === "CRITICAL") return <Badge variant="error" dot>Critical</Badge>;
  if (p === "HIGH") return <Badge variant="warning" dot>High</Badge>;
  if (p === "NORMAL") return <Badge variant="default">Normal</Badge>;
  return <Badge variant="muted">Low</Badge>;
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus | string }> = ({ status }) => {
  const s = String(status).toUpperCase();
  if (s === "COMPLETED") return <Badge variant="success" dot>Completed</Badge>;
  if (s === "DISPATCHED") return <Badge variant="info" dot>Dispatched</Badge>;
  if (s === "PACKED" || s === "READY_FOR_PACKING") return <Badge variant="accent" dot>Packed</Badge>;
  if (s === "IN_PRODUCTION") return <Badge variant="warning" dot>In Production</Badge>;
  if (s === "CONFIRMED") return <Badge variant="accent">Confirmed</Badge>;
  if (s === "CANCELLED") return <Badge variant="error">Cancelled</Badge>;
  return <Badge variant="muted">Draft</Badge>;
};

export const TaskStatusBadge: React.FC<{ status: TaskStatus | string }> = ({ status }) => {
  const s = String(status).toUpperCase();
  if (s === "COMPLETED") return <Badge variant="success" dot>Done</Badge>;
  if (s === "IN_PROGRESS") return <Badge variant="accent" dot>In Progress</Badge>;
  if (s === "BLOCKED") return <Badge variant="error" dot>Blocked</Badge>;
  if (s === "READY") return <Badge variant="warning">Ready</Badge>;
  if (s === "SKIPPED") return <Badge variant="muted">Skipped</Badge>;
  return <Badge variant="muted">Pending</Badge>;
};

export const RoleBadge: React.FC<{ role: UserRole | string }> = ({ role }) => {
  const r = String(role).toUpperCase();
  let variant: BadgeVariant = "default";
  if (r === "OWNER" || r === "ADMIN") variant = "accent";
  else if (r === "MANAGER" || r === "PRODUCTION_MANAGER") variant = "info";
  else if (r === "ACCOUNTS") variant = "success";
  else if (r === "DESIGNER" || r === "DATA_OPERATOR") variant = "warning";

  return <Badge variant={variant}>{r.replace("_", " ")}</Badge>;
};
