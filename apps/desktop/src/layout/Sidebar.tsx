import React from "react";
import { useAuth } from "../auth/AuthContext";
import { AppNavSection } from "../auth/permissions";
import { Icon, IconName } from "../design-system/components/Icon";

export interface SidebarProps {
  activeSection: AppNavSection;
  onSelectSection: (section: AppNavSection) => void;
  pendingApprovalsCount?: number;
  urgentTasksCount?: number;
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
}) => {
  const { canNav } = useAuth();

  const coreNav: NavItemDef[] = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "quotations", label: "Quotations & Costing", icon: "quotations" },
    { id: "orders", label: "Production Orders", icon: "orders" },
    { id: "tasks", label: "Task Queue", icon: "tasks", badge: urgentTasksCount, badgeVariant: "urgent" },
    { id: "approvals", label: "Proof Approvals", icon: "approvals", badge: pendingApprovalsCount, badgeVariant: "normal" },
    { id: "clients", label: "Clients Directory", icon: "clients" },
    { id: "products", label: "Products & BOM", icon: "products" },
  ];

  const factoryNav: NavItemDef[] = [
    { id: "production", label: "Machines & Batches", icon: "production" },
    { id: "stock", label: "Stock & Inventory", icon: "stock" },
    { id: "purchasing", label: "Purchasing & POs", icon: "purchasing" },
    { id: "labour", label: "Labour & Contractors", icon: "labour" },
    { id: "packing", label: "Packing Operations", icon: "packing" },
    { id: "dispatch", label: "Dispatch & Logistics", icon: "dispatch" },
  ];

  const financeNav: NavItemDef[] = [
    { id: "billing", label: "Billing & Invoices", icon: "billing" },
    { id: "reports", label: "Analytics & Reports", icon: "reports" },
    { id: "audit", label: "Audit & Activity Trail", icon: "audit" },
    { id: "automation", label: "Automation Rules", icon: "automation" },
  ];

  const renderNavGroup = (title: string, items: NavItemDef[]) => {
    const visibleItems = items.filter((item) => canNav(item.id));
    if (visibleItems.length === 0) return null;

    return (
      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            color: "var(--text-muted)",
            padding: "0 12px 6px 12px",
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {visibleItems.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  backgroundColor: isActive ? "var(--accent-soft)" : "transparent",
                  color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.1s ease, color 0.1s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
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
                <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                  <Icon
                    name={item.icon}
                    size={14}
                    color={isActive ? "var(--accent-text)" : "var(--text-muted)"}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "var(--radius-xs)",
                      backgroundColor:
                        item.badgeVariant === "urgent" ? "var(--status-error)" : "var(--accent)",
                      color: "#fff",
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
    );
  };

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "14px 8px 10px 8px",
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
      }}
    >
      <div>
        {/* Brand Header */}
        <div style={{ padding: "0 12px 14px 12px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: 24,
                height: 24,
                backgroundColor: "var(--accent)",
                borderRadius: "var(--radius-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "13px",
                fontFamily: "var(--font-mono)",
              }}
            >
              OF
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
                OfficeFloww
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Production OS
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        {renderNavGroup("Core Operations", coreNav)}
        {renderNavGroup("Factory & Logistics", factoryNav)}
        {renderNavGroup("Finance & Intelligence", financeNav)}
      </div>

      {/* Footer / Settings Link */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
        <button
          type="button"
          onClick={() => onSelectSection("settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            backgroundColor: activeSection === "settings" ? "var(--accent-soft)" : "transparent",
            color: activeSection === "settings" ? "var(--accent-text)" : "var(--text-muted)",
            fontSize: "12px",
            fontWeight: activeSection === "settings" ? 600 : 500,
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            if (activeSection !== "settings") {
              e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }
          }}
          onMouseLeave={(e) => {
            if (activeSection !== "settings") {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }
          }}
        >
          <Icon name="settings" size={14} />
          <span>System Settings</span>
        </button>
      </div>
    </aside>
  );
};
