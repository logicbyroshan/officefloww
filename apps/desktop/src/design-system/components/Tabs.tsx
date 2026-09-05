import React from "react";
import { Icon, IconName } from "./Icon";

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "line" | "pill";
  size?: "sm" | "md";
  style?: React.CSSProperties;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = "line",
  size = "md",
  style,
}) => {
  if (variant === "pill") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "2px",
          backgroundColor: "rgba(10, 14, 23, 0.8)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          padding: "2px",
          ...style,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const pad = size === "sm" ? "5px 10px" : "7px 14px";
          const fontSize = size === "sm" ? "11.5px" : "12.5px";

          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: pad,
                borderRadius: "var(--radius-xs)",
                border: "none",
                backgroundColor: isActive ? "var(--accent-soft)" : "transparent",
                color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
                fontSize,
                fontWeight: isActive ? 700 : 500,
                cursor: tab.disabled ? "not-allowed" : "pointer",
                opacity: tab.disabled ? 0.4 : 1,
                transition: "all 0.12s ease",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                if (!isActive && !tab.disabled) {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !tab.disabled) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              {tab.icon && (
                <Icon
                  name={tab.icon}
                  size={size === "sm" ? 12 : 14}
                  color={isActive ? "var(--accent-text)" : "var(--text-muted)"}
                />
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    padding: "1px 6px",
                    borderRadius: "var(--radius-xs)",
                    backgroundColor: isActive ? "var(--accent)" : "var(--bg-muted)",
                    color: isActive ? "var(--accent-contrast)" : "var(--text-muted)",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default "line" variant
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        borderBottom: "1px solid var(--border-subtle)",
        backgroundColor: "transparent",
        padding: "0 4px",
        overflowX: "auto",
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const pad = size === "sm" ? "9px 14px" : "11px 18px";
        const fontSize = size === "sm" ? "12.5px" : "13px";

        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: pad,
              fontSize,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: tab.disabled ? "not-allowed" : "pointer",
              opacity: tab.disabled ? 0.4 : 1,
              transition: "all 0.12s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!isActive && !tab.disabled) e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              if (!isActive && !tab.disabled) e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {tab.icon && (
              <Icon
                name={tab.icon}
                size={size === "sm" ? 13 : 15}
                color={isActive ? "var(--accent-text)" : "var(--text-muted)"}
              />
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-xs)",
                  backgroundColor: isActive ? "var(--accent-soft)" : "var(--bg-muted)",
                  color: isActive ? "var(--accent-text)" : "var(--text-muted)",
                  border: "1px solid " + (isActive ? "var(--accent-border)" : "transparent"),
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
