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
    let background = "linear-gradient(135deg, #ff9980 0%, #ff6b8b 100%)";
    let color = "#0f172a";
    let border = "1px solid rgba(255, 255, 255, 0.25)";
    let fontWeight = 650;
    let boxShadow = "0 2px 8px rgba(255, 107, 139, 0.25)";

    if (variant === "secondary") {
      background = "rgba(255, 255, 255, 0.05)";
      color = "var(--text-primary, #f8fafc)";
      border = "1px solid rgba(255, 255, 255, 0.12)";
      fontWeight = 500;
      boxShadow = "none";
    } else if (variant === "outline") {
      background = "transparent";
      color = "var(--text-primary, #f8fafc)";
      border = "1px solid var(--border-medium, #2a3346)";
      fontWeight = 500;
      boxShadow = "none";
    } else if (variant === "danger") {
      background = "var(--status-error, #ef4444)";
      color = "#ffffff";
      border = "1px solid rgba(255, 255, 255, 0.2)";
      fontWeight = 600;
      boxShadow = "0 2px 6px rgba(239, 68, 68, 0.25)";
    } else if (variant === "ghost") {
      background = "transparent";
      color = "var(--text-secondary, #cbd5e1)";
      border = "1px solid transparent";
      fontWeight = 500;
      boxShadow = "none";
    }

    let padding = "6px 14px";
    let fontSize = "12px";
    let height = "30px";
    if (size === "sm") {
      padding = "5px 10px";
      fontSize = "11.5px";
      height = "26px";
    } else if (size === "lg") {
      padding = "9px 18px";
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
      fontWeight,
      height,
      boxSizing: "border-box",
      lineHeight: 1,
      background,
      color,
      border,
      boxShadow,
      borderRadius: "var(--radius-sm, 4px)",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      opacity: disabled || loading ? 0.6 : 1,
      transition: "all 0.15s ease",
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
        background: bg,
        color,
        border,
        borderRadius: "var(--radius-sm, 4px)",
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
