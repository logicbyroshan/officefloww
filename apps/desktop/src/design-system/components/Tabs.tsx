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
  style?: React.CSSProperties;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  style,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        borderBottom: "1px solid var(--border-subtle)",
        backgroundColor: "var(--bg-surface)",
        padding: "0 8px",
        overflowX: "auto",
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 14px",
              fontSize: "12px",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: tab.disabled ? "not-allowed" : "pointer",
              opacity: tab.disabled ? 0.4 : 1,
              transition: "all 0.15s ease",
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
                size={13}
                color={isActive ? "var(--accent-text)" : "var(--text-muted)"}
              />
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  padding: "1px 5px",
                  borderRadius: "var(--radius-xs)",
                  backgroundColor: isActive ? "var(--accent)" : "var(--bg-muted)",
                  color: isActive ? "#fff" : "var(--text-muted)",
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
