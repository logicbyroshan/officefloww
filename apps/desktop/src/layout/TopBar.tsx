import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { SEED_ACCOUNTS } from "../api/auth.service";
import { AppNavSection } from "../auth/permissions";
import { Icon } from "../design-system/components/Icon";
import { UserAvatar } from "../design-system/components/UserAvatar";
import { StatusDot, RoleBadge } from "../design-system/components/Badge";

export interface TopBarProps {
  onOpenSearch: () => void;
  connected: boolean;
  onToggleVoice: () => void;
  isVoiceActive: boolean;
  onNavigate?: (section: AppNavSection) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSearch,
  connected,
  onToggleVoice,
  isVoiceActive,
  onNavigate,
}) => {
  const { user, logout, switchUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: "notif-1",
      title: "Order #ORD-2026-0001 requires attention",
      desc: "High priority • Sublimation press setup",
      target: "tasks" as AppNavSection,
      urgent: true,
    },
    {
      id: "notif-2",
      title: "Proof approval requested",
      desc: "St. Xavier's High School lanyard repeat setup",
      target: "tasks" as AppNavSection,
      urgent: false,
    },
    {
      id: "notif-3",
      title: "Low stock alert",
      desc: "PVC Sheet stock below safety threshold",
      target: "stock" as AppNavSection,
      urgent: true,
    },
  ];

  return (
    <header
      style={{
        height: "var(--topbar-height)",
        backgroundColor: "rgba(14, 18, 26, 0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        gap: "20px",
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Left Context / Global Search Shortcut - Expanded Full Width */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, maxWidth: "680px" }}>
        <button
          type="button"
          onClick={onOpenSearch}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "11px",
            backgroundColor: "rgba(19, 23, 34, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "4px",
            padding: "8px 16px",
            color: "var(--text-muted)",
            fontSize: "13px",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            transition: "all 0.18s ease",
            boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.25)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-border)";
            e.currentTarget.style.boxShadow = "0 0 12px var(--accent-soft)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0, 0, 0, 0.25)";
          }}
        >
          <Icon name="search" size={15} color="var(--accent-text)" />
          <span style={{ flex: 1, color: "var(--text-secondary)" }}>
            Search clients, orders, tasks, staff, stock, invoices...
          </span>
          <kbd
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "3px",
              padding: "2px 7px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
            }}
          >
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Voice Mode Button */}
        <button
          type="button"
          onClick={onToggleVoice}
          title="Voice Assistant Mode"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "6px 12px",
            borderRadius: "4px",
            border: isVoiceActive
              ? "1px solid var(--accent)"
              : "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: isVoiceActive
              ? "rgba(255, 138, 115, 0.18)"
              : "rgba(255, 255, 255, 0.03)",
            color: isVoiceActive ? "var(--accent-text)" : "var(--text-secondary)",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: isVoiceActive ? "0 0 12px var(--accent-soft)" : "none",
          }}
          onMouseEnter={(e) => {
            if (!isVoiceActive) e.currentTarget.style.borderColor = "var(--accent-border)";
          }}
          onMouseLeave={(e) => {
            if (!isVoiceActive) e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
          }}
        >
          <Icon name="mic" size={14} color={isVoiceActive ? "var(--accent-text)" : "var(--text-muted)"} />
          <span>{isVoiceActive ? "Listening..." : "Voice"}</span>
        </button>

        {/* Notifications Popover */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            style={{
              position: "relative",
              width: "34px",
              height: "34px",
              borderRadius: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
          >
            <Icon name="bell" size={15} />
            <span
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: "var(--status-error)",
              }}
            />
          </button>

          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "6px",
                width: "320px",
                backgroundColor: "rgba(14, 18, 26, 0.96)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "6px",
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6)",
                padding: "10px",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: "6px 8px 10px 8px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Operational Alerts
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    color: "var(--status-error)",
                    padding: "2px 6px",
                    borderRadius: "3px",
                  }}
                >
                  3 Action Items
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (onNavigate) onNavigate(n.target);
                      setShowNotifications(false);
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.04)",
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                      e.currentTarget.style.borderColor = "var(--accent-border)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.04)";
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {n.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Connection Status Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "12px",
            fontWeight: 500,
            color: connected
              ? "#34d399"
              : localStorage.getItem("officefloww_offline_mode") === "true"
              ? "#f59e0b"
              : "var(--status-error)",
            padding: "5px 10px",
            backgroundColor: connected
              ? "rgba(16, 185, 129, 0.1)"
              : localStorage.getItem("officefloww_offline_mode") === "true"
              ? "rgba(245, 158, 11, 0.1)"
              : "var(--status-error-soft)",
            borderRadius: "4px",
            border: "1px solid " + (connected ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.08)"),
          }}
        >
          <StatusDot status={connected ? "online" : "offline"} size={7} />
          <span>
            {connected
              ? "FastAPI Connected"
              : localStorage.getItem("officefloww_offline_mode") === "true"
              ? "Local Mode"
              : "Disconnected"}
          </span>
        </div>

        {/* User Account / Role Switcher Popover */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              background: "rgba(19, 23, 34, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              color: "var(--text-primary)",
              transition: "border-color 0.12s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
          >
            <UserAvatar name={user?.full_name || "User"} role={user?.role} size={24} />
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 600, lineHeight: 1.2 }}>
                {user?.full_name || "Guest"}
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {user?.role}
              </span>
            </div>
            <Icon name="chevron-down" size={12} color="var(--text-muted)" />
          </button>

          {showUserMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "6px",
                width: "280px",
                backgroundColor: "rgba(14, 18, 26, 0.96)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "6px",
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6)",
                padding: "10px",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: "8px 10px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  marginBottom: "8px",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {user?.full_name}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{user?.email}</div>
                <div style={{ marginTop: "6px" }}>
                  <RoleBadge role={user?.role || "USER"} />
                </div>
              </div>

              {/* Quick Switch Role for Testing */}
              <div
                style={{
                  padding: "4px 8px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                Switch Role Account:
              </div>

              <div
                style={{
                  maxHeight: "180px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                {SEED_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      switchUser(acc.email);
                      setShowUserMenu(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 8px",
                      borderRadius: "3px",
                      border: "none",
                      backgroundColor:
                        user?.email === acc.email
                          ? "rgba(255, 138, 115, 0.12)"
                          : "transparent",
                      color:
                        user?.email === acc.email
                          ? "var(--accent-text)"
                          : "var(--text-secondary)",
                      fontSize: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (user?.email !== acc.email) {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (user?.email !== acc.email) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{acc.name}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {acc.role}
                      </div>
                    </div>
                    {user?.email === acc.email && <Icon name="check" size={13} />}
                  </button>
                ))}
              </div>

              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  marginTop: "8px",
                  paddingTop: "6px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "7px 8px",
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: "var(--status-error)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--status-error-soft)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Icon name="log-out" size={13} />
                  <span>Lock & Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
