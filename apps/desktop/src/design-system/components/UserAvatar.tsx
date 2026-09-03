import React from "react";
import { UserRole } from "@officefloww/api-types";
import { StatusDot } from "./Badge";

export interface UserAvatarProps {
  name: string;
  role?: UserRole | string;
  size?: number;
  showStatus?: boolean;
  status?: "online" | "offline" | "busy" | "idle";
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  role,
  size = 28,
  showStatus = false,
  status = "online",
}) => {
  const getInitials = (n: string) => {
    if (!n) return "OF";
    const parts = n.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "var(--radius-xs)",
          backgroundColor: "var(--bg-muted)",
          border: "1px solid var(--border-medium)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size <= 28 ? "11px" : "13px",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: "var(--accent-text)",
          userSelect: "none",
        }}
      >
        {getInitials(name)}
      </div>
      {showStatus && (
        <div style={{ position: "absolute", bottom: -2, right: -2 }}>
          <StatusDot status={status} size={6} />
        </div>
      )}
    </div>
  );
};

export const ConnectionBanner: React.FC<{
  connected: boolean;
  onRetry?: () => void;
}> = ({ connected, onRetry }) => {
  const isOfflineMode = localStorage.getItem("officefloww_offline_mode") === "true";

  // If in deliberate offline mode, show a subtle amber notice — not an error
  if (!connected && isOfflineMode) {
    return (
      <div
        style={{
          backgroundColor: "rgba(245, 158, 11, 0.12)",
          borderBottom: "1px solid rgba(245, 158, 11, 0.25)",
          color: "#f59e0b",
          padding: "4px 16px",
          fontSize: "11.5px",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 900,
        }}
      >
        <span>⚡ Offline Mode — data is local. Connect backend at Settings → FastAPI Core Server to sync.</span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              color: "#f59e0b",
              padding: "2px 10px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Unexpected disconnection — show red error
  if (!connected) {
    return (
      <div
        style={{
          backgroundColor: "var(--status-error)",
          color: "#ffffff",
          padding: "5px 16px",
          fontSize: "12px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 900,
        }}
      >
        <span>⚠️ Connection to backend lost. Changes cannot be saved.</span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              padding: "2px 8px",
              fontSize: "11px",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return null;
};

