import React, { useState, useMemo } from "react";
import { Task, TaskStatus, OrderPriority } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
import { TaskStatusBadge, PriorityBadge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";
import { useAuth } from "../../auth/AuthContext";
import { TasksService } from "../../api/services";
import { useToast } from "../../design-system/components/Toast";

export interface TasksViewProps {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onGoToOrder?: (orderId: string) => void;
}

type TaskViewTab =
  | "my"
  | "all"
  | "board"
  | "overdue"
  | "blocked"
  | "approvals";

type WorkTypeFilter =
  | "ALL"
  | "PRODUCTION"
  | "FITTING"
  | "DATA"
  | "DESIGN"
  | "PACKING"
  | "DISPATCH";

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  loading,
  error,
  onRefresh,
  onGoToOrder,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<TaskViewTab>("all");
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkTypeFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("Priya Nair");
  const [newOrderCode, setNewOrderCode] = useState("ORD-2026-0001");
  const [newQty, setNewQty] = useState("500");
  const [newPriority, setNewPriority] = useState<OrderPriority>(OrderPriority.NORMAL);
  const [newInstructions, setNewInstructions] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toastError("Validation Error", "Please provide a task title.");
      return;
    }
    setCreating(true);
    try {
      // In dev, add task or call backend
      success("Task Created", `Assigned "${newTitle}" to ${newAssignee}.`);
      setIsNewTaskOpen(false);
      setNewTitle("");
      setNewInstructions("");
      onRefresh();
    } catch (err: any) {
      toastError("Creation Failed", err.message);
    } finally {
      setCreating(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.title?.toLowerCase().includes(q) ||
        t.task_code?.toLowerCase().includes(q) ||
        t.order_id?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Work type filter
      if (workTypeFilter !== "ALL") {
        const titleLower = (t.title || "").toLowerCase();
        if (workTypeFilter === "PRODUCTION" && !titleLower.includes("press") && !titleLower.includes("print") && !titleLower.includes("sublimation")) {
          return false;
        }
        if (workTypeFilter === "FITTING" && !titleLower.includes("fitting") && !titleLower.includes("assembly")) {
          return false;
        }
        if (workTypeFilter === "DATA" && !titleLower.includes("data") && !titleLower.includes("roster")) {
          return false;
        }
        if (workTypeFilter === "DESIGN" && !titleLower.includes("design") && !titleLower.includes("artwork") && !titleLower.includes("repeat")) {
          return false;
        }
        if (workTypeFilter === "PACKING" && !titleLower.includes("packing") && !titleLower.includes("box")) {
          return false;
        }
        if (workTypeFilter === "DISPATCH" && !titleLower.includes("dispatch") && !titleLower.includes("courier")) {
          return false;
        }
      }

      // Tab filter
      if (activeTab === "my") {
        return t.assigned_user_id === user?.id || !t.assigned_user_id;
      }
      if (activeTab === "overdue") {
        return t.due_date && new Date(t.due_date) < new Date();
      }
      if (activeTab === "blocked") {
        return t.status === TaskStatus.BLOCKED;
      }
      if (activeTab === "approvals") {
        return (t.title || "").toLowerCase().includes("proof") || (t.title || "").toLowerCase().includes("approval");
      }
      return true;
    });
  }, [tasks, activeTab, workTypeFilter, search, user]);

  const columns: Column<Task>[] = [
    {
      key: "title",
      header: "Task / Work Item",
      render: (t) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px" }}>
            {t.title || t.task_code}
          </span>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Ticket {t.task_code}
          </span>
        </div>
      ),
    },
    {
      key: "order_id",
      header: "Order / Job",
      render: (t) => (
        <span
          style={{
            fontSize: "12px",
            color: "var(--accent-text)",
            fontWeight: 600,
          }}
        >
          {t.order_id ? "Client Production" : "Internal Floor Job"}
        </span>
      ),
    },
    {
      key: "assigned_user_id",
      header: "Assigned To",
      render: (t) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--text-secondary)",
            }}
          >
            {t.assigned_user_id ? "OP" : "FL"}
          </div>
          <span style={{ fontSize: "12.5px", color: "var(--text-primary)" }}>
            {t.assigned_user_id ? "Floor Operator" : "Unassigned"}
          </span>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (t) => <PriorityBadge priority={t.priority || OrderPriority.NORMAL} />,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <TaskStatusBadge status={t.status} />,
    },
    {
      key: "actions",
      header: "",
      width: "95px",
      align: "right",
      render: (t) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTask(t);
          }}
          style={{
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "5px 12px",
            borderRadius: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "var(--text-secondary)",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
            lineHeight: 1,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 138, 115, 0.15)";
            e.currentTarget.style.borderColor = "var(--accent-border)";
            e.currentTarget.style.color = "var(--accent-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <span>Details</span>
          <span style={{ fontSize: "11px" }}>→</span>
        </button>
      ),
    },
  ];

  if (loading && tasks.length === 0) {
    return <LoadingState message="Loading work manager and task queue..." />;
  }

  if (error && tasks.length === 0) {
    return <ErrorState message={error.message} onRetry={onRefresh} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <PageHeader
        title="Tasks Manager"
        badge={
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--accent-text)",
              backgroundColor: "rgba(255, 138, 115, 0.12)",
              border: "1px solid var(--accent-border)",
              borderRadius: "4px",
              padding: "2px 8px",
            }}
          >
            {filteredTasks.length} Active Work Items
          </span>
        }
        primaryAction={{
          label: "Create Task",
          icon: "plus",
          onClick: () => setIsNewTaskOpen(true),
        }}
        secondaryActions={
          <Button variant="secondary" icon="refresh" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Navigation Tabs Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "10px",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[
              { id: "all" as const, label: "All Tasks", icon: "tasks" },
              { id: "my" as const, label: "My Tasks", icon: "clipboard" },
              { id: "board" as const, label: "Board", icon: "columns" },
              { id: "overdue" as const, label: "Overdue", icon: "clock" },
              { id: "blocked" as const, label: "Blocked", icon: "alert-circle" },
              { id: "approvals" as const, label: "Approvals", icon: "check-circle" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor:
                    activeTab === tab.id
                      ? "rgba(255, 138, 115, 0.14)"
                      : "transparent",
                  color:
                    activeTab === tab.id
                      ? "var(--accent-text)"
                      : "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search bar inside Tasks */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: "36px",
                boxSizing: "border-box",
                backgroundColor: "rgba(0, 0, 0, 0.25)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "4px",
                padding: "0 12px",
              }}
            >
              <Icon name="search" size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Filter tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: "12.5px",
                  outline: "none",
                  width: "160px",
                }}
              />
            </div>
          </div>
        </div>

        {/* Work Type Filter Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginRight: "4px" }}>
            Work Type:
          </span>
          {[
            { id: "ALL", label: "All Types" },
            { id: "PRODUCTION", label: "Production Press" },
            { id: "FITTING", label: "Assembly & Fitting" },
            { id: "DATA", label: "Data Roster" },
            { id: "DESIGN", label: "Artwork Proofing" },
            { id: "PACKING", label: "Packing Verification" },
            { id: "DISPATCH", label: "Dispatch Logistics" },
          ].map((wt) => (
            <button
              key={wt.id}
              type="button"
              onClick={() => setWorkTypeFilter(wt.id as WorkTypeFilter)}
              style={{
                padding: "3px 9px",
                borderRadius: "3px",
                fontSize: "11.5px",
                fontWeight: 500,
                cursor: "pointer",
                border:
                  workTypeFilter === wt.id
                    ? "1px solid var(--accent-border)"
                    : "1px solid rgba(255, 255, 255, 0.06)",
                backgroundColor:
                  workTypeFilter === wt.id
                    ? "rgba(255, 138, 115, 0.12)"
                    : "rgba(255, 255, 255, 0.02)",
                color:
                  workTypeFilter === wt.id
                    ? "var(--accent-text)"
                    : "var(--text-muted)",
              }}
            >
              {wt.label}
            </button>
          ))}
        </div>

        {/* Board View vs Table View */}
        {activeTab === "board" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "12px",
              marginTop: "4px",
              minHeight: "480px",
            }}
          >
            {[
              { status: TaskStatus.READY, label: "READY", color: "#38bdf8" },
              { status: TaskStatus.IN_PROGRESS, label: "IN PROGRESS", color: "var(--accent)" },
              { status: TaskStatus.WAITING, label: "WAITING", color: "#f59e0b" },
              { status: TaskStatus.BLOCKED, label: "BLOCKED", color: "var(--status-error)" },
              { status: TaskStatus.COMPLETED, label: "DONE", color: "#10b981" },
            ].map((lane) => {
              const laneTasks = filteredTasks.filter((t) => t.status === lane.status);

              return (
                <div
                  key={lane.status}
                  style={{
                    backgroundColor: "rgba(14, 18, 26, 0.75)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "4px",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: 700, color: lane.color, letterSpacing: "0.5px" }}>
                      {lane.label}
                    </span>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-muted)",
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        padding: "1px 6px",
                        borderRadius: "2px",
                      }}
                    >
                      {laneTasks.length}
                    </span>
                  </div>

                  <div
                    style={{
                      padding: "10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      flex: 1,
                      overflowY: "auto",
                    }}
                  >
                    {laneTasks.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "11.5px" }}>
                        No tasks
                      </div>
                    ) : (
                      laneTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          style={{
                            padding: "10px",
                            backgroundColor: "rgba(19, 23, 34, 0.9)",
                            border: "1px solid rgba(255, 255, 255, 0.07)",
                            borderRadius: "4px",
                            cursor: "pointer",
                            transition: "all 0.12s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--accent-border)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--accent-text)" }}>
                              {task.task_code}
                            </span>
                            <PriorityBadge priority={task.priority || OrderPriority.NORMAL} />
                          </div>
                          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                            {task.title || task.task_code}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View (Spreadsheet style) */
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.75)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <Table
              columns={columns}
              data={filteredTasks}
              onRowClick={(task) => setSelectedTask(task)}
              emptyText="No tasks match the active filters."
            />
          </div>
        )}
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={onRefresh}
        onGoToOrder={onGoToOrder}
      />

      {/* Quick Task Creation Modal */}
      {isNewTaskOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: "480px",
              backgroundColor: "rgba(14, 18, 26, 0.96)",
              border: "1px solid var(--accent-border)",
              borderRadius: "6px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "0 16px 48px rgba(0, 0, 0, 0.6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>
                Create Production Task
              </h3>
              <button
                type="button"
                onClick={() => setIsNewTaskOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  What needs to be done?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete 500 MPL fittings"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Assigned Person
                  </label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      backgroundColor: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      padding: "8px 12px",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Order Code
                  </label>
                  <input
                    type="text"
                    value={newOrderCode}
                    onChange={(e) => setNewOrderCode(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      backgroundColor: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      padding: "8px 12px",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      backgroundColor: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      padding: "8px 12px",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as OrderPriority)}
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      backgroundColor: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      padding: "8px 12px",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  >
                    <option value={OrderPriority.LOW}>Low</option>
                    <option value={OrderPriority.NORMAL}>Normal</option>
                    <option value={OrderPriority.HIGH}>High</option>
                    <option value={OrderPriority.URGENT}>Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Check clips before fitting. Keep defective pieces separately."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    color: "#fff",
                    fontSize: "13px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <Button variant="secondary" size="sm" onClick={() => setIsNewTaskOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={creating}>
                  Create Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
