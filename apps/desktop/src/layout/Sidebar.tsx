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
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            color: "var(--text-muted)",
            padding: "0 14px 8px 14px",
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
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
                  padding: "8px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                  backgroundColor: isActive ? "var(--accent-soft)" : "transparent",
                  color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
                  fontSize: "13.5px",
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.12s ease",
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
                <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                  <Icon
                    name={item.icon}
                    size={16}
                    color={isActive ? "var(--accent-text)" : "var(--text-muted)"}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      padding: "2px 7px",
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
        borderRight: "1px solid var(--border-medium)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "16px 10px 14px 10px",
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
      }}
    >
      <div>
        {/* Brand Header */}
        <div style={{ padding: "0 12px 16px 12px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 30,
                height: 30,
                backgroundColor: "var(--accent)",
                borderRadius: "var(--radius-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: "14px",
                fontFamily: "var(--font-mono)",
                boxShadow: "0 2px 6px var(--accent-soft)",
              }}
            >
              OF
            </div>
            <div>
              <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
                OfficeFloww
              </div>
              <div style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 }}>
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
      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
        <button
          type="button"
          onClick={() => onSelectSection("settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 14px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            borderLeft: activeSection === "settings" ? "3px solid var(--accent)" : "3px solid transparent",
            backgroundColor: activeSection === "settings" ? "var(--accent-soft)" : "transparent",
            color: activeSection === "settings" ? "var(--accent-text)" : "var(--text-secondary)",
            fontSize: "13.5px",
            fontWeight: activeSection === "settings" ? 600 : 500,
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            transition: "all 0.12s ease",
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
              e.currentTarget.style.color = "var(--text-secondary)";
            }
          }}
        >
          <Icon name="settings" size={16} />
          <span>System Settings</span>
        </button>
      </div>
    </aside>
  );
};
