import React, { useState, useMemo } from "react";
import { Task, TaskStatus } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Tabs } from "../../design-system/components/Tabs";
import { Table, Column } from "../../design-system/components/Table";
import { SearchInput } from "../../design-system/components/Input";
import { TaskStatusBadge, PriorityBadge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";
import { useAuth } from "../../auth/AuthContext";

export interface TasksViewProps {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onGoToOrder?: (orderId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  loading,
  error,
  onRefresh,
  onGoToOrder,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "my" | "blocked" | "completed">("all");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        search === "" ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.task_code.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === "my") {
        return t.assigned_user_id === user?.id;
      }
      if (activeTab === "blocked") {
        return t.status === TaskStatus.BLOCKED;
      }
      if (activeTab === "completed") {
        return t.status === TaskStatus.COMPLETED;
      }
      return true;
    });
  }, [tasks, activeTab, search, user]);

  const columns: Column<Task>[] = [
    {
      key: "title",
      header: "Task / Production Step",
      render: (t) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {t.title || t.task_code}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Code: {t.task_code}
          </div>
        </div>
      ),
    },
    {
      key: "order_id",
      header: "Order Reference",
      width: "160px",
      render: (t) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-text)" }}>
          {t.order_id.slice(0, 14)}...
        </span>
      ),
    },
    {
      key: "assigned_user_id",
      header: "Assignee",
      width: "160px",
      render: (t) => (
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {t.assigned_user_id ? `Worker (${t.assigned_user_id.slice(0, 8)})` : "Unassigned"}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      width: "100px",
      render: (t) => <PriorityBadge priority={t.priority} />,
    },
    {
      key: "status",
      header: "Status",
      width: "130px",
      render: (t) => <TaskStatusBadge status={t.status} />,
    },
  ];

  if (loading && tasks.length === 0) {
    return <LoadingState message="Loading factory task queue..." />;
  }

  if (error && tasks.length === 0) {
    return <ErrorState message={error.message} onRetry={onRefresh} />;
  }

  const blockedCount = tasks.filter((t) => t.status === TaskStatus.BLOCKED).length;
  const myCount = tasks.filter((t) => t.assigned_user_id === user?.id).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Factory Task Execution Queue"
        subtitle="Floor step tracking, blocker escalation, and machine operator completions."
        secondaryActions={
          <Button variant="secondary" icon="refresh" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: "all", label: "All Tasks", icon: "tasks", badge: tasks.length },
          { id: "my", label: "My Tasks", icon: "users", badge: myCount },
          { id: "blocked", label: "Blocked Bottlenecks", icon: "alert-circle", badge: blockedCount },
          { id: "completed", label: "Completed History", icon: "check-circle" },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        <div style={{ width: "320px" }}>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder="Search by step name or task code..."
          />
        </div>

        <Table
          columns={columns}
          data={filteredTasks}
          keyExtractor={(t) => t.id}
          onRowClick={(t) => setSelectedTask(t)}
          emptyText="No tasks found matching the active tab or filter."
        />
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={onRefresh}
        onGoToOrder={onGoToOrder}
      />
    </div>
  );
};
