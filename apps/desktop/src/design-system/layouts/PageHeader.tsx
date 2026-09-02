import React from "react";
import { Button } from "../components/Button";
import { Icon, IconName } from "../components/Icon";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: {
    label: string;
    icon?: IconName;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryActions?: React.ReactNode;
  badge?: React.ReactNode;
  style?: React.CSSProperties;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  badge,
  style,
}) => {
  return (
    <div
      style={{
        padding: "18px 28px",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-medium)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        flexShrink: 0,
        ...style,
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted)", marginBottom: "2px" }}>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span style={{ color: "var(--border-strong)" }}>/</span>}
              {b.onClick ? (
                <span
                  onClick={b.onClick}
                  style={{ color: "var(--text-secondary)", cursor: "pointer", fontWeight: 500 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                >
                  {b.label}
                </span>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>
            {title}
          </h1>
          {badge}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {secondaryActions}
          {primaryAction && (
            <Button
              variant="primary"
              icon={primaryAction.icon}
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              loading={primaryAction.loading}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>

      {subtitle && (
        <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", maxWidth: "800px", marginTop: "2px", lineHeight: "1.45" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ title, subtitle, action, style }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "14px",
        ...style,
      }}
    >
      <div>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>{title}</h3>
        {subtitle && (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const SplitPane: React.FC<{
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string | number;
  minLeftWidth?: string | number;
}> = ({ left, right, leftWidth = "340px", minLeftWidth = "300px" }) => {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden" }}>
      <div
        style={{
          width: leftWidth,
          minWidth: minLeftWidth,
          borderRight: "1px solid var(--border-medium)",
          backgroundColor: "var(--bg-surface)",
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        {left}
      </div>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-app)" }}>
        {right}
      </div>
    </div>
  );
};
