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
        padding: "16px 24px",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        flexShrink: 0,
        ...style,
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span style={{ color: "var(--border-strong)" }}>/</span>}
              {b.onClick ? (
                <span
                  onClick={b.onClick}
                  style={{ color: "var(--text-secondary)", cursor: "pointer" }}
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
            {title}
          </h1>
          {badge}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "720px", marginTop: "2px" }}>
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
        marginBottom: "12px",
        ...style,
      }}
    >
      <div>
        <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{title}</h3>
        {subtitle && (
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>{subtitle}</p>
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
}> = ({ left, right, leftWidth = "320px", minLeftWidth = "280px" }) => {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden" }}>
      <div
        style={{
          width: leftWidth,
          minWidth: minLeftWidth,
          borderRight: "1px solid var(--border-subtle)",
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
