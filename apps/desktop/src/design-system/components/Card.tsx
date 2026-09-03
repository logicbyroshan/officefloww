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
        backgroundColor: "rgba(19, 23, 34, 0.78)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: sharp ? 0 : "6px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 28px rgba(0, 0, 0, 0.35)",
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
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div>
            {typeof title === "string" ? (
              <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.2px", margin: 0 }}>
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px", marginBottom: 0, lineHeight: "1.4" }}>
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
  let badgeBg = "rgba(255, 255, 255, 0.03)";

  if (status === "urgent") {
    borderLeft = "3px solid var(--status-error)";
    valueColor = "var(--status-error)";
    badgeBg = "var(--status-error-soft)";
  } else if (status === "warning") {
    borderLeft = "3px solid var(--status-warning)";
    valueColor = "var(--status-warning)";
    badgeBg = "var(--status-warning-soft)";
  } else if (status === "success") {
    borderLeft = "3px solid var(--status-success)";
    valueColor = "var(--status-success)";
    badgeBg = "var(--status-success-soft)";
  }

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "rgba(19, 23, 34, 0.78)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderLeft,
        borderRadius: "4px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
        transition: "border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = "rgba(25, 32, 47, 0.9)";
          e.currentTarget.style.borderColor = "var(--accent-border)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = "rgba(19, 23, 34, 0.78)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
        }
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
