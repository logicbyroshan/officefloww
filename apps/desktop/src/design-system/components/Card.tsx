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
        border: "1px solid var(--border-medium)",
        borderRadius: sharp ? 0 : "var(--radius-md)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow-sm)",
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
            padding: "14px 18px",
            borderBottom: "1px solid var(--border-medium)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div>
            {typeof title === "string" ? (
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "3px", lineHeight: "1.4" }}>
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div style={{ padding: noPadding ? 0 : "18px", flex: 1 }}>{children}</div>
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
    valueColor = "var(--status-success)";
  }

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-medium)",
        borderLeft,
        borderRadius: "var(--radius-sm)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        cursor: onClick ? "pointer" : "default",
        boxShadow: "var(--shadow-sm)",
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
            fontSize: "11.5px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </span>
        {icon && <Icon name={icon} size={16} color="var(--text-muted)" />}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
        <span
          style={{
            fontSize: "24px",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            color: valueColor,
            lineHeight: 1.1,
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </span>
        {subValue && (
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>{subValue}</span>
        )}
      </div>

      {trend && (
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
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
