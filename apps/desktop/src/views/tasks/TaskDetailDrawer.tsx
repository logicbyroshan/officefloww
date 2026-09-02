import React, { useState } from "react";
import { Task, TaskStatus } from "@officefloww/api-types";
import { TasksService } from "../../api/services";
import { Drawer } from "../../design-system/components/Modal";
import { Button } from "../../design-system/components/Button";
import { Input, Textarea } from "../../design-system/components/Input";
import { TaskStatusBadge } from "../../design-system/components/Badge";
import { useToast } from "../../design-system/components/Toast";
import { useAuth } from "../../auth/AuthContext";

export interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  onGoToOrder?: (orderId: string) => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onGoToOrder,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [completeNotes, setCompleteNotes] = useState("");
  const [blockerReason, setBlockerReason] = useState("");
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  const handleComplete = async () => {
    setLoading(true);
    try {
      await TasksService.complete(task.id, completeNotes || "Completed from desktop workstation");
      success("Task Completed", `Step "${task.title || task.task_code}" successfully completed.`);
      onTaskUpdated();
      onClose();
    } catch (err: any) {
      toastError("Failed to Complete Task", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlocker = async () => {
    if (!blockerReason.trim()) {
      toastError("Validation Error", "Please provide a reason for the blocker.");
      return;
    }
    setLoading(true);
    try {
      await TasksService.addBlocker(task.id, blockerReason);
      success("Blocker Logged", "The task status has been updated to BLOCKED.");
      setBlockerReason("");
      onTaskUpdated();
    } catch (err: any) {
      toastError("Failed to Add Blocker", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveBlocker = async (blockerId: string) => {
    setLoading(true);
    try {
      await TasksService.resolveBlocker(blockerId);
      success("Blocker Resolved", "The blocker has been cleared and the task is active.");
      onTaskUpdated();
    } catch (err: any) {
      toastError("Failed to Resolve Blocker", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setLoading(true);
    try {
      await TasksService.addComment(task.id, commentText);
      success("Comment Added", "Your operational note was posted.");
      setCommentText("");
      onTaskUpdated();
    } catch (err: any) {
      toastError("Failed to Add Comment", err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeBlockers = task.blockers?.filter((b) => !b.resolved_at) || [];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={task.title || task.task_code}
      subtitle={`Task Code: ${task.task_code}`}
      width={480}
      footer={
        <div style={{ display: "flex", gap: "8px", width: "100%", justifyContent: "space-between" }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Close
          </Button>

          {task.status !== TaskStatus.COMPLETED && (
            <Button
              variant="primary"
              icon="check"
              onClick={handleComplete}
              loading={loading}
              disabled={activeBlockers.length > 0}
            >
              Mark Complete
            </Button>
          )}
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Status & Assignment Box */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xs)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Current Status
            </span>
            <TaskStatusBadge status={task.status} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--text-muted)" }}>Assigned Worker:</span>
            <strong style={{ color: "var(--text-primary)" }}>
              {task.assigned_user_id ? `Worker (${task.assigned_user_id.slice(0, 8)})` : "Unassigned / Press Pool"}
            </strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--text-muted)" }}>Order Reference:</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-text)" }}>
              {task.order_id.slice(0, 16)}...
            </span>
          </div>

          {task.description && (
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
              {task.description}
            </div>
          )}
        </div>

        {/* Active Blockers */}
        {activeBlockers.length > 0 && (
          <div
            style={{
              backgroundColor: "var(--status-error-soft)",
              border: "1px solid var(--status-error-border)",
              borderRadius: "var(--radius-xs)",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--status-error)" }}>
              Active Task Blockers ({activeBlockers.length})
            </div>
            {activeBlockers.map((b) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "var(--text-primary)" }}>• {b.reason}</span>
                <Button size="sm" variant="outline" onClick={() => handleResolveBlocker(b.id)} loading={loading}>
                  Resolve
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Report New Blocker */}
        {task.status !== TaskStatus.COMPLETED && (
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-xs)",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Flag Operational Blocker
            </span>
            <Input
              placeholder="e.g. Card stock ribbon tear, awaiting revised client proof..."
              value={blockerReason}
              onChange={(e) => setBlockerReason(e.target.value)}
            />
            <Button size="sm" variant="danger" onClick={handleAddBlocker} loading={loading}>
              Flag Blocker
            </Button>
          </div>
        )}

        {/* Completion Notes */}
        {task.status !== TaskStatus.COMPLETED && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Textarea
              label="Completion Notes / QC Log"
              placeholder="Enter machine run count, defect rate, or operator sign-off..."
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              rows={2}
            />
          </div>
        )}

        {/* Comments Stream */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
            Operator Activity & Comments ({task.comments?.length || 0})
          </span>

          <div style={{ display: "flex", gap: "6px" }}>
            <Input
              placeholder="Add note to task history..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button size="sm" variant="secondary" onClick={handleAddComment} loading={loading}>
              Post
            </Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
            {task.comments?.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: "6px 10px",
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "var(--radius-xs)",
                  fontSize: "11px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>User ({c.user_id.slice(0, 6)}):</div>
                <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>{c.message}</div>
                <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {new Date(c.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
