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
        borderBottom: "1px solid var(--border-medium)",
        backgroundColor: "var(--bg-surface)",
        padding: "0 16px",
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
              gap: "8px",
              padding: "12px 18px",
              fontSize: "13.5px",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: isActive ? "3px solid var(--accent)" : "3px solid transparent",
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
                size={15}
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
                  padding: "2px 7px",
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
