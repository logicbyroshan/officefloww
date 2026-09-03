import React from "react";
import { useAuth } from "../auth/AuthContext";
import { AppNavSection } from "../auth/permissions";
import { Icon, IconName } from "../design-system/components/Icon";

export interface SidebarProps {
  activeSection: AppNavSection;
  onSelectSection: (section: AppNavSection) => void;
  pendingApprovalsCount?: number;
  urgentTasksCount?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItemDef {
  id: AppNavSection;
  label: string;
  icon: IconName;
  badge?: number;
  badgeVariant?: "urgent" | "normal";
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  pendingApprovalsCount = 0,
  urgentTasksCount = 0,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { canNav } = useAuth();

  const primaryNav: NavItemDef[] = [
    { id: "dashboard", label: "Home", icon: "dashboard" },
    { id: "clients", label: "Clients", icon: "clients" },
    { id: "stock", label: "Stock", icon: "stock" },
    { id: "billing", label: "Billing", icon: "billing" },
    { id: "staff", label: "Staff", icon: "staff" },
    {
      id: "tasks",
      label: "Tasks",
      icon: "tasks",
      badge: urgentTasksCount,
      badgeVariant: "urgent",
    },
  ];

  const visiblePrimary = primaryNav.filter((item) => canNav(item.id));
  const canAccessSettings = canNav("settings");

  return (
    <aside
      style={{
        width: isCollapsed ? "68px" : "240px",
        backgroundColor: "rgba(14, 18, 26, 0.88)",
        backdropFilter: "blur(18px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.07)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: isCollapsed ? "16px 8px 14px 8px" : "16px 12px 14px 12px",
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 10,
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), padding 0.2s ease",
      }}
    >
      <div>
        {/* Brand Header */}
        <div
          style={{
            padding: isCollapsed ? "2px 0 16px 0" : "2px 8px 16px 8px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
            <img
              src="./assets/logo.png"
              alt="PrintFlow"
              title="PrintFlow — Adharsh Bhopal OS"
              style={{
                width: 36,
                height: 36,
                borderRadius: "6px",
                objectFit: "contain",
                filter: "drop-shadow(0 2px 8px rgba(124, 58, 237, 0.45))",
                flexShrink: 0,
              }}
            />
            {!isCollapsed && (
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.2px",
                    whiteSpace: "nowrap",
                  }}
                >
                  PrintFlow
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--accent-text)",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  Adharsh Bhopal OS
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Navigation Section */}
        <div style={{ marginBottom: "20px" }}>
          {!isCollapsed && (
            <div
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "rgba(148, 163, 184, 0.65)",
                padding: "0 10px 10px 10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>Workspaces</span>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                }}
              />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {visiblePrimary.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isCollapsed ? "center" : "space-between",
                    padding: isCollapsed ? "10px 0" : "10px 14px",
                    borderRadius: "4px",
                    border: "1px solid " + (isActive ? "var(--accent-border)" : "transparent"),
                    borderLeft: !isCollapsed
                      ? isActive
                        ? "3px solid var(--accent)"
                        : "3px solid transparent"
                      : undefined,
                    backgroundColor: isActive
                      ? "rgba(255, 138, 115, 0.12)"
                      : "transparent",
                    color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
                    fontSize: "13.5px",
                    fontWeight: isActive ? 600 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    width: "100%",
                    boxShadow: isActive
                      ? "0 2px 10px rgba(255, 138, 115, 0.15)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.04)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: isCollapsed ? "0" : "11px",
                    }}
                  >
                    <Icon
                      name={item.icon}
                      size={17}
                      color={isActive ? "var(--accent-text)" : "var(--text-muted)"}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "3px",
                        backgroundColor:
                          item.badgeVariant === "urgent"
                            ? "var(--status-error)"
                            : "var(--accent)",
                        color:
                          item.badgeVariant === "urgent"
                            ? "#fff"
                            : "var(--accent-contrast, #111827)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer: Settings & Collapse Toggle */}
      <div
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.07)",
          paddingTop: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {canAccessSettings && (
          <button
            type="button"
            onClick={() => onSelectSection("settings")}
            title={isCollapsed ? "Settings" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              gap: isCollapsed ? "0" : "10px",
              padding: isCollapsed ? "10px 0" : "9px 12px",
              borderRadius: "4px",
              border:
                "1px solid " +
                (activeSection === "settings"
                  ? "var(--accent-border)"
                  : "transparent"),
              borderLeft: !isCollapsed
                ? activeSection === "settings"
                  ? "3px solid var(--accent)"
                  : "3px solid transparent"
                : undefined,
              backgroundColor:
                activeSection === "settings"
                  ? "rgba(255, 138, 115, 0.12)"
                  : "transparent",
              color:
                activeSection === "settings"
                  ? "var(--accent-text)"
                  : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: activeSection === "settings" ? 600 : 500,
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (activeSection !== "settings") {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.04)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== "settings") {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            <Icon name="settings" size={16} />
            {!isCollapsed && <span>Settings</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
