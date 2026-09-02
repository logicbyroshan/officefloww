import React from "react";
import { Icon, IconName } from "./Icon";

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
  sharp?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  noPadding = false,
  sharp = false,
  style,
  ...props
}) => {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: sharp ? 0 : "var(--radius-md)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
      {...props}
    >
      {(title || headerAction) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div>
            {typeof title === "string" ? (
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div style={{ padding: noPadding ? 0 : "16px", flex: 1 }}>{children}</div>
    </div>
  );
};

export interface StatBoxProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: IconName;
  trend?: { direction: "up" | "down" | "neutral"; label: string };
  status?: "normal" | "urgent" | "warning" | "success";
  onClick?: () => void;
}

export const StatBox: React.FC<StatBoxProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  status = "normal",
  onClick,
}) => {
  let borderLeft = "3px solid transparent";
  let valueColor = "var(--text-primary)";

  if (status === "urgent") {
    borderLeft = "3px solid var(--status-error)";
    valueColor = "var(--status-error)";
  } else if (status === "warning") {
    borderLeft = "3px solid var(--status-warning)";
    valueColor = "var(--status-warning)";
  } else if (status === "success") {
    borderLeft = "3px solid var(--status-success)";
  }

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderLeft,
        borderRadius: "var(--radius-sm)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = "var(--bg-card)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </span>
        {icon && <Icon name={icon} size={14} color="var(--text-muted)" />}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
        <span
          style={{
            fontSize: "20px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: valueColor,
            lineHeight: 1.1,
          }}
        >
          {value}
        </span>
        {subValue && (
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{subValue}</span>
        )}
      </div>

      {trend && (
        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
          {trend.label}
        </div>
      )}
    </div>
  );
};

export const Divider: React.FC<{
  vertical?: boolean;
  spacing?: number;
  style?: React.CSSProperties;
}> = ({ vertical = false, spacing = 12, style }) => {
  if (vertical) {
    return (
      <div
        style={{
          width: "1px",
          backgroundColor: "var(--border-subtle)",
          margin: `0 ${spacing}px`,
          alignSelf: "stretch",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      style={{
        height: "1px",
        backgroundColor: "var(--border-subtle)",
        margin: `${spacing}px 0`,
        width: "100%",
        ...style,
      }}
    />
  );
};
