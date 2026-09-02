import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { SEED_ACCOUNTS } from "../api/auth.service";
import { Icon } from "../design-system/components/Icon";
import { UserAvatar } from "../design-system/components/UserAvatar";
import { StatusDot, RoleBadge } from "../design-system/components/Badge";

export interface TopBarProps {
  onOpenSearch: () => void;
  connected: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSearch, connected }) => {
  const { user, logout, switchUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header
      style={{
        height: "var(--topbar-height)",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-medium)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Left Context / Global Search Shortcut */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <button
          type="button"
          onClick={onOpenSearch}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 14px",
            color: "var(--text-muted)",
            fontSize: "13px",
            cursor: "pointer",
            width: "300px",
            textAlign: "left",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-medium)")}
        >
          <Icon name="search" size={15} color="var(--text-muted)" />
          <span style={{ flex: 1, color: "var(--text-secondary)" }}>Search orders, clients, tasks...</span>
          <kbd
            style={{
              backgroundColor: "var(--bg-muted)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-xs)",
              padding: "2px 6px",
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
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Connection Status Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "12px",
            fontWeight: 500,
            color: connected ? "var(--text-secondary)" : "var(--status-error)",
            padding: "5px 10px",
            backgroundColor: connected ? "var(--bg-muted)" : "var(--status-error-soft)",
            borderRadius: "var(--radius-xs)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <StatusDot status={connected ? "online" : "offline"} size={7} />
          <span>{connected ? "FastAPI Core Connected" : "Core Server Disconnected"}</span>
        </div>

        {/* User Account / Role Switcher Popover */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-medium)",
              padding: "5px 12px",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: "var(--text-primary)",
              transition: "border-color 0.12s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-medium)")}
          >
            <UserAvatar name={user?.full_name || "User"} role={user?.role} size={26} />
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.2 }}>
                {user?.full_name || "Guest"}
              </span>
              <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {user?.role}
              </span>
            </div>
            <Icon name="chevron-down" size={13} color="var(--text-muted)" />
          </button>

          {showUserMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "6px",
                width: "300px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                padding: "10px",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--border-subtle)",
                  marginBottom: "8px",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {user?.full_name}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{user?.email}</div>
                <div style={{ marginTop: "6px" }}>
                  <RoleBadge role={user?.role || "USER"} />
                </div>
              </div>

              {/* Quick Switch Role for Testing */}
              <div style={{ padding: "4px 10px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                Switch Operational Role:
              </div>

              <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
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
                      padding: "7px 10px",
                      backgroundColor: user?.email === acc.email ? "var(--accent-soft)" : "transparent",
                      border: "none",
                      borderRadius: "var(--radius-xs)",
                      color: user?.email === acc.email ? "var(--accent-text)" : "var(--text-secondary)",
                      fontSize: "12px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{acc.name}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {acc.role}
                      </div>
                    </div>
                    {user?.email === acc.email && <Icon name="check" size={13} />}
                  </button>
                ))}
              </div>

              <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "8px", paddingTop: "8px" }}>
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
                    padding: "8px 10px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "var(--radius-xs)",
                    color: "var(--status-error)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Icon name="log-out" size={14} color="var(--status-error)" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
