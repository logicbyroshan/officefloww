import React from "react";
import { Icon, IconName } from "./Icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  iconPosition?: "left" | "right";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled,
  style,
  ...props
}) => {
  const getStyles = (): React.CSSProperties => {
    let bg = "var(--accent-gradient, var(--accent))";
    let color = "var(--accent-contrast, #111827)";
    let border = "none";
    let hoverBg = "var(--accent-hover)";

    if (variant === "secondary") {
      bg = "var(--bg-muted)";
      color = "var(--text-primary)";
      border = "1px solid var(--border-medium)";
      hoverBg = "var(--bg-card-hover)";
    } else if (variant === "outline") {
      bg = "transparent";
      color = "var(--text-primary)";
      border = "1px solid var(--border-medium)";
      hoverBg = "var(--bg-muted)";
    } else if (variant === "danger") {
      bg = "var(--status-error)";
      color = "#fff";
      border = "1px solid var(--status-error)";
      hoverBg = "#dc2626";
    } else if (variant === "ghost") {
      bg = "transparent";
      color = "var(--text-secondary)";
      border = "1px solid transparent";
      hoverBg = "var(--bg-muted)";
    }

    let padding = "6px 12px";
    let fontSize = "12px";
    let height = "30px";
    if (size === "sm") {
      padding = "4px 8px";
      fontSize = "11px";
      height = "24px";
    } else if (size === "lg") {
      padding = "8px 16px";
      fontSize = "13px";
      height = "36px";
    }

    return {
      display: "inline-flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      padding,
      fontSize,
      fontWeight: 500,
      height,
      boxSizing: "border-box",
      lineHeight: 1,
      backgroundColor: bg,
      color,
      border,
      borderRadius: "var(--radius-sm)",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      opacity: disabled || loading ? 0.6 : 1,
      transition: "background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
      whiteSpace: "nowrap",
      userSelect: "none",
      ...style,
    };
  };

  return (
    <button
      disabled={disabled || loading}
      style={getStyles()}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: 12,
            height: 12,
            border: "2px solid currentColor",
            borderRightColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        />
      ) : (
        icon && iconPosition === "left" && (
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}>
            <Icon name={icon} size={size === "sm" ? 12 : 14} />
          </span>
        )
      )}
      {children && (
        <span style={{ display: "inline-flex", alignItems: "center", lineHeight: 1, whiteSpace: "nowrap" }}>
          {children}
        </span>
      )}
      {!loading && icon && iconPosition === "right" && (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}>
          <Icon name={icon} size={size === "sm" ? 12 : 14} />
        </span>
      )}
    </button>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  tooltip?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = "ghost",
  size = "md",
  tooltip,
  style,
  ...props
}) => {
  const getDimension = () => {
    if (size === "sm") return { width: 24, height: 24, iconSize: 12 };
    if (size === "lg") return { width: 36, height: 36, iconSize: 18 };
    return { width: 30, height: 30, iconSize: 14 };
  };

  const { width, height, iconSize } = getDimension();

  let bg = "transparent";
  let color = "var(--text-secondary)";
  let border = "1px solid transparent";

  if (variant === "primary") {
    bg = "var(--accent)";
    color = "var(--accent-contrast)";
    border = "1px solid var(--accent)";
  } else if (variant === "secondary") {
    bg = "var(--bg-muted)";
    color = "var(--text-primary)";
    border = "1px solid var(--border-medium)";
  } else if (variant === "outline") {
    border = "1px solid var(--border-subtle)";
  } else if (variant === "danger") {
    bg = "var(--status-error-soft)";
    color = "var(--status-error)";
    border = "1px solid var(--status-error-border)";
  }

  return (
    <button
      title={tooltip}
      style={{
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        lineHeight: 1,
        width,
        height,
        padding: 0,
        backgroundColor: bg,
        color,
        border,
        borderRadius: "var(--radius-sm)",
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.5 : 1,
        transition: "all 0.15s ease",
        ...style,
      }}
      {...props}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
};
