import React from "react";

export type IconName =
  | "dashboard"
  | "orders"
  | "tasks"
  | "clients"
  | "products"
  | "files"
  | "approvals"
  | "stock"
  | "labour"
  | "production"
  | "packing"
  | "dispatch"
  | "billing"
  | "quotations"
  | "purchasing"
  | "reports"
  | "audit"
  | "automation"
  | "settings"
  | "search"
  | "plus"
  | "check"
  | "check-circle"
  | "alert-circle"
  | "alert-triangle"
  | "clock"
  | "users"
  | "package"
  | "tool"
  | "truck"
  | "credit-card"
  | "chevron-right"
  | "chevron-down"
  | "chevron-left"
  | "x"
  | "lock"
  | "upload"
  | "eye"
  | "refresh"
  | "activity"
  | "filter"
  | "external-link"
  | "more-vertical"
  | "log-out"
  | "tag"
  | "layers"
  | "printer"
  | "shield"
  | "edit"
  | "trash"
  | "download"
  | "info"
  | "trending-up"
  | "file-text"
  | "cpu"
  | "clipboard";

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 16,
  color = "currentColor",
  className,
  style,
}) => {
  const getPath = () => {
    switch (name) {
      case "dashboard":
        return <path d="M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zM3 14h7v7H3z" />;
      case "orders":
        return <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3.8 6h16.4M16 10a4 4 0 0 1-8 0" />;
      case "tasks":
        return <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />;
      case "clients":
        return <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />;
      case "products":
        return <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />;
      case "files":
      case "file-text":
        return <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM13 2v7h7" />;
      case "approvals":
        return <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zm-2-10l2 2 4-4" />;
      case "stock":
        return <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />;
      case "purchasing":
        return <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />;
      case "labour":
        return <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />;
      case "production":
      case "printer":
        return <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />;
      case "packing":
      case "package":
        return <path d="M16.5 9.4L7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />;
      case "dispatch":
      case "truck":
        return <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 18a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm13 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />;
      case "billing":
      case "credit-card":
        return <path d="M1 4h22v16H1zM1 10h22M6 16h4" />;
      case "quotations":
        return <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />;
      case "reports":
      case "trending-up":
        return <path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />;
      case "audit":
      case "clipboard":
        return <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />;
      case "automation":
      case "cpu":
        return <path d="M4 4h16v16H4zM9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />;
      case "settings":
        return <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4 1.5l1.4-2.4-1.4-2.4 1.4-2.4-2.4-1.4L18 5.5l-2.4-1.4L13.2 5.5H10.8L8.4 4.1 6 5.5 4.6 7.9 6 10.3l-1.4 2.4 1.4 2.4-1.4 2.4 2.4 1.4L8.4 18.5l2.4 1.4h2.4l2.4-1.4 2.4 1.4 1.4-2.4z" />;
      case "search":
        return <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2l-4.35-4.35" />;
      case "plus":
        return <path d="M12 5v14M5 12h14" />;
      case "check":
        return <path d="M20 6L9 17l-5-5" />;
      case "check-circle":
        return <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />;
      case "alert-circle":
        return <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-14v4m0 4h.01" />;
      case "alert-triangle":
        return <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />;
      case "clock":
        return <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-14v6l4 2" />;
      case "users":
        return <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />;
      case "tool":
        return <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />;
      case "chevron-right":
        return <path d="M9 18l6-6-6-6" />;
      case "chevron-down":
        return <path d="M6 9l6 6 6-6" />;
      case "chevron-left":
        return <path d="M15 18l-6-6 6-6" />;
      case "x":
        return <path d="M18 6L6 18M6 6l12 12" />;
      case "lock":
        return <path d="M7 11V7a5 5 0 0 1 10 0v4M4 11h16v10H4z" />;
      case "upload":
        return <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />;
      case "eye":
        return <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />;
      case "refresh":
        return <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />;
      case "activity":
        return <path d="M22 12h-4l-3 9L9 3l-3 9H2" />;
      case "filter":
        return <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />;
      case "external-link":
        return <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />;
      case "more-vertical":
        return <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0-7a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />;
      case "log-out":
        return <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />;
      case "tag":
        return <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" />;
      case "layers":
        return <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />;
      case "shield":
        return <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
      case "edit":
        return <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />;
      case "trash":
        return <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />;
      case "download":
        return <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />;
      case "info":
        return <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-11v6m0-10h.01" />;
      default:
        return <circle cx="12" cy="12" r="10" />;
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
    >
      {getPath()}
    </svg>
  );
};
