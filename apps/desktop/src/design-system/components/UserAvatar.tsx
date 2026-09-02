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
  if (connected) return null;

  return (
    <div
      style={{
        backgroundColor: "var(--status-error)",
        color: "#ffffff",
        padding: "6px 16px",
        fontSize: "12px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 900,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span>⚠️ Connection to backend lost. Changes cannot be saved.</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.4)",
            color: "#fff",
            padding: "2px 8px",
            fontSize: "11px",
            borderRadius: "var(--radius-xs)",
            cursor: "pointer",
          }}
        >
          Retry Connection
        </button>
      )}
    </div>
  );
};
