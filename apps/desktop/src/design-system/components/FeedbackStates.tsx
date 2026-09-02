import React from "react";
import { Icon, IconName } from "./Icon";
import { Button } from "./Button";

export const LoadingSpinner: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = "var(--accent)",
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}`,
        borderRightColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
        display: "inline-block",
      }}
    />
  );
};

export const LoadingState: React.FC<{ message?: string; height?: number | string }> = ({
  message = "Loading operational data...",
  height = 200,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        height,
        color: "var(--text-secondary)",
      }}
    >
      <LoadingSpinner size={24} />
      <span style={{ fontSize: "12px" }}>{message}</span>
    </div>
  );
};

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  height?: number | string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "package",
  title,
  description,
  actionLabel,
  onAction,
  height = 220,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        height,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-sm)",
          backgroundColor: "var(--bg-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "12px",
          color: "var(--text-muted)",
        }}
      >
        <Icon name={icon} size={22} />
      </div>
      <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{title}</h4>
      {description && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            maxWidth: "340px",
            marginTop: "4px",
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div style={{ marginTop: "14px" }}>
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  height?: number | string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Failed to load data",
  message = "A network or server communication error occurred.",
  onRetry,
  height = 200,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        height,
        textAlign: "center",
        backgroundColor: "var(--status-error-soft)",
        border: "1px solid var(--status-error-border)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <div style={{ color: "var(--status-error)", marginBottom: "8px" }}>
        <Icon name="alert-circle" size={24} />
      </div>
      <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--status-error)" }}>{title}</h4>
      <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", maxWidth: "360px" }}>
        {message}
      </p>
      {onRetry && (
        <div style={{ marginTop: "12px" }}>
          <Button variant="outline" size="sm" icon="refresh" onClick={onRetry}>
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
};
