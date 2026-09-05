import React, { useState } from "react";
import { Icon, IconName } from "./Icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "ghost";
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
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getBaseStyles = (): React.CSSProperties => {
    let background = "var(--accent-gradient, var(--accent))";
    let color = "var(--accent-contrast, #111827)";
    let border = "1px solid var(--accent-border, rgba(255, 255, 255, 0.25))";
    let fontWeight = 650;
    let boxShadow = "0 2px 8px var(--accent-soft, rgba(255, 107, 139, 0.25))";

    if (variant === "secondary") {
      background = isHovered ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.05)";
      color = "var(--text-primary, #f8fafc)";
      border = "1px solid " + (isHovered ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.12)");
      fontWeight = 500;
      boxShadow = "none";
    } else if (variant === "outline") {
      background = isHovered ? "rgba(255, 255, 255, 0.04)" : "transparent";
      color = isHovered ? "var(--text-primary, #f8fafc)" : "var(--text-secondary, #cbd5e1)";
      border = "1px solid " + (isHovered ? "var(--accent-border)" : "var(--border-medium, #2a3346)");
      fontWeight = 500;
      boxShadow = "none";
    } else if (variant === "danger") {
      background = isHovered ? "#dc2626" : "var(--status-error, #ef4444)";
      color = "#ffffff";
      border = "1px solid rgba(255, 255, 255, 0.2)";
      fontWeight = 600;
      boxShadow = "0 2px 6px rgba(239, 68, 68, 0.25)";
    } else if (variant === "success") {
      background = isHovered ? "#059669" : "var(--status-success, #10b981)";
      color = "#ffffff";
      border = "1px solid rgba(255, 255, 255, 0.2)";
      fontWeight = 600;
      boxShadow = "0 2px 6px rgba(16, 185, 129, 0.25)";
    } else if (variant === "ghost") {
      background = isHovered ? "rgba(255, 255, 255, 0.05)" : "transparent";
      color = isHovered ? "var(--text-primary, #f8fafc)" : "var(--text-secondary, #cbd5e1)";
      border = "1px solid transparent";
      fontWeight = 500;
      boxShadow = "none";
    } else if (variant === "primary" && isHovered && !disabled && !loading) {
      boxShadow = "0 4px 14px var(--accent-soft, rgba(255, 107, 139, 0.35))";
      background = "var(--accent-hover, var(--accent))";
    }

    let padding = "0 16px";
    let fontSize = "12.5px";
    let height = "var(--btn-height-md, 36px)";

    if (size === "sm") {
      padding = "0 12px";
      fontSize = "12px";
      height = "var(--btn-height-sm, 32px)";
    } else if (size === "lg") {
      padding = "0 20px";
      fontSize = "13.5px";
      height = "var(--btn-height-lg, 42px)";
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
      style={getBaseStyles()}
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (onMouseEnter) onMouseEnter(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (onMouseLeave) onMouseLeave(e);
      }}
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
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getDimension = () => {
    if (size === "sm") return { width: 28, height: 28, iconSize: 13 };
    if (size === "lg") return { width: 40, height: 40, iconSize: 17 };
    return { width: 34, height: 34, iconSize: 15 };
  };

  const { width, height, iconSize } = getDimension();

  let bg = isHovered ? "rgba(255, 255, 255, 0.05)" : "transparent";
  let color = isHovered ? "var(--text-primary)" : "var(--text-secondary)";
  let border = "1px solid transparent";

  if (variant === "primary") {
    bg = isHovered ? "var(--accent-hover)" : "var(--accent)";
    color = "var(--accent-contrast)";
    border = "1px solid var(--accent)";
  } else if (variant === "secondary") {
    bg = isHovered ? "rgba(255, 255, 255, 0.08)" : "var(--bg-muted)";
    color = "var(--text-primary)";
    border = "1px solid " + (isHovered ? "var(--border-strong)" : "var(--border-medium)");
  } else if (variant === "outline") {
    border = "1px solid " + (isHovered ? "var(--accent-border)" : "var(--border-subtle)");
  } else if (variant === "danger") {
    bg = isHovered ? "rgba(239, 68, 68, 0.22)" : "var(--status-error-soft)";
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
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (onMouseEnter) onMouseEnter(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (onMouseLeave) onMouseLeave(e);
      }}
      {...props}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
};
