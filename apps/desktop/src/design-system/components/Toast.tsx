import React, { createContext, useContext, useState, useCallback } from "react";
import { Icon, IconName } from "./Icon";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title: string; message?: string; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 4000,
    }: {
      type?: ToastType;
      title: string;
      message?: string;
      duration?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => toast({ type: "success", title, message }),
    [toast]
  );
  const error = useCallback(
    (title: string, message?: string) => toast({ type: "error", title, message }),
    [toast]
  );
  const warning = useCallback(
    (title: string, message?: string) => toast({ type: "warning", title, message }),
    [toast]
  );
  const info = useCallback(
    (title: string, message?: string) => toast({ type: "info", title, message }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 2000,
          maxWidth: "380px",
        }}
      >
        {toasts.map((t) => {
          let iconName: IconName = "info";
          let borderColor = "var(--border-subtle)";
          let iconColor = "var(--text-primary)";

          if (t.type === "success") {
            iconName = "check-circle";
            borderColor = "var(--status-success-border)";
            iconColor = "var(--status-success)";
          } else if (t.type === "error") {
            iconName = "alert-circle";
            borderColor = "var(--status-error-border)";
            iconColor = "var(--status-error)";
          } else if (t.type === "warning") {
            iconName = "alert-triangle";
            borderColor = "var(--status-warning-border)";
            iconColor = "var(--status-warning)";
          }

          return (
            <div
              key={t.id}
              style={{
                backgroundColor: "var(--bg-card)",
                border: `1px solid ${borderColor}`,
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                boxShadow: "var(--shadow-lg)",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                minWidth: "280px",
              }}
            >
              <div style={{ marginTop: "2px", flexShrink: 0 }}>
                <Icon name={iconName} size={15} color={iconColor} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {t.title}
                </div>
                {t.message && (
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {t.message}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
