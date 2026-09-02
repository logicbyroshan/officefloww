import React from "react";
import { Icon, IconName } from "./Icon";
import { StepStatus } from "@officefloww/api-types";

export interface TimelineStepItem {
  id: string;
  name: string;
  stepType?: string;
  status: StepStatus | string;
  assigneeName?: string;
  assigneeRole?: string;
  blockerReason?: string;
  completedAt?: string;
  estimatedMinutes?: number;
  isCurrent?: boolean;
}

export interface WorkflowTimelineProps {
  steps: TimelineStepItem[];
  onStepClick?: (step: TimelineStepItem) => void;
  style?: React.CSSProperties;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  steps,
  onStepClick,
  style,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%", ...style }}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const status = String(step.status).toUpperCase();

        let iconName: IconName = "clock";
        let iconColor = "var(--text-muted)";
        let iconBg = "var(--bg-muted)";
        let borderColor = "var(--border-subtle)";
        let titleColor = "var(--text-secondary)";

        if (status === "COMPLETED") {
          iconName = "check";
          iconColor = "var(--status-success)";
          iconBg = "var(--status-success-soft)";
          borderColor = "var(--status-success-border)";
          titleColor = "var(--text-primary)";
        } else if (status === "IN_PROGRESS") {
          iconName = "activity";
          iconColor = "var(--accent-text)";
          iconBg = "var(--accent-soft)";
          borderColor = "var(--accent-border)";
          titleColor = "var(--text-primary)";
        } else if (status === "BLOCKED") {
          iconName = "alert-circle";
          iconColor = "var(--status-error)";
          iconBg = "var(--status-error-soft)";
          borderColor = "var(--status-error-border)";
          titleColor = "var(--status-error)";
        } else if (status === "READY") {
          iconName = "clock";
          iconColor = "var(--status-warning)";
          iconBg = "var(--status-warning-soft)";
          borderColor = "var(--status-warning-border)";
          titleColor = "var(--text-primary)";
        } else if (status === "SKIPPED") {
          iconName = "x";
          iconColor = "var(--text-disabled)";
          iconBg = "var(--bg-muted)";
          titleColor = "var(--text-muted)";
        }

        return (
          <div
            key={step.id}
            onClick={() => onStepClick && onStepClick(step)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              position: "relative",
              padding: "6px 8px",
              borderRadius: "var(--radius-xs)",
              cursor: onStepClick ? "pointer" : "default",
              transition: "background-color 0.1s ease",
            }}
            onMouseEnter={(e) => {
              if (onStepClick) e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
            }}
            onMouseLeave={(e) => {
              if (onStepClick) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {/* Step Icon */}
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "var(--radius-xs)",
                backgroundColor: iconBg,
                border: `1px solid ${borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              <Icon name={iconName} size={11} color={iconColor} />
            </div>

            {/* Step Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: status === "IN_PROGRESS" ? 600 : 500,
                    color: titleColor,
                  }}
                >
                  {step.name}
                </span>

                <span
                  style={{
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    color: iconColor,
                    fontWeight: 600,
                  }}
                >
                  {status.replace("_", " ")}
                </span>
              </div>

              {step.blockerReason && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--status-error)",
                    backgroundColor: "var(--status-error-soft)",
                    border: "1px solid var(--status-error-border)",
                    borderRadius: "var(--radius-xs)",
                    padding: "2px 6px",
                    marginTop: "4px",
                  }}
                >
                  Blocked: {step.blockerReason}
                </div>
              )}

              {(step.assigneeName || step.completedAt) && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    display: "flex",
                    gap: "10px",
                    marginTop: "2px",
                  }}
                >
                  {step.assigneeName && <span>Assigned: {step.assigneeName}</span>}
                  {step.completedAt && (
                    <span>Done: {new Date(step.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
