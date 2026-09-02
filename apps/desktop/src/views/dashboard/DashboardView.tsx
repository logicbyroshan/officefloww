import React from "react";
import { Order, Task, Approval, Client, OrderPriority } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { StatBox, Card } from "../../design-system/components/Card";
import { PriorityBadge, OrderStatusBadge, TaskStatusBadge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { LoadingState, ErrorState, EmptyState } from "../../design-system/components/FeedbackStates";

export interface DashboardViewProps {
  orders: Order[];
  tasks: Task[];
  approvals: Approval[];
  clients: Client[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onSelectOrder: (orderId: string) => void;
  onSelectTask: (taskId: string) => void;
  onNewOrder: () => void;
  onNewClient: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  tasks,
  approvals,
  clients,
  loading,
  error,
  onRefresh,
  onSelectOrder,
  onSelectTask,
  onNewOrder,
  onNewClient,
}) => {
  if (loading && orders.length === 0) {
    return <LoadingState message="Loading factory operations dashboard..." />;
  }

  if (error && orders.length === 0) {
    return <ErrorState message={error.message} onRetry={onRefresh} />;
  }

  // Calculate operational aggregates
  const activeOrders = orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED");
  const pendingApprovals = approvals.filter((a) => a.status === "PENDING");
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "READY");
  const criticalOrders = activeOrders.filter((o) => o.priority === OrderPriority.HIGH || o.priority === OrderPriority.URGENT);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Factory Operations Dashboard"
        subtitle="Live production floor overview, urgency queues, and pending bottleneck approvals."
        primaryAction={{
          label: "New Order",
          icon: "plus",
          onClick: onNewOrder,
        }}
        secondaryActions={
          <Button variant="secondary" icon="refresh" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Top Operational Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
          <StatBox
            label="Active Orders"
            value={activeOrders.length}
            subValue="In Progress"
            icon="orders"
          />
          <StatBox
            label="Needs Attention"
            value={criticalOrders.length}
            subValue="High/Urgent Priority"
            icon="alert-circle"
            status={criticalOrders.length > 0 ? "urgent" : "normal"}
          />
          <StatBox
            label="Pending Approvals"
            value={pendingApprovals.length}
            subValue="Artwork Proofs"
            icon="approvals"
            status={pendingApprovals.length > 0 ? "warning" : "normal"}
          />
          <StatBox
            label="Blocked Tasks"
            value={blockedTasks.length}
            subValue="Awaiting Materials/Inputs"
            icon="tool"
            status={blockedTasks.length > 0 ? "urgent" : "normal"}
          />
          <StatBox
            label="Ready Floor Tasks"
            value={inProgressTasks.length}
            subValue="On Machine Press"
            icon="tasks"
          />
        </div>

        {/* Main Grid: Active Orders + Urgent Floor Tasks */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
          {/* Active Orders */}
          <Card
            title="Active Factory Orders"
            subtitle="Prioritized jobs currently advancing through the workflow DAG"
            headerAction={
              <Button variant="outline" size="sm" onClick={onNewOrder}>
                New Order
              </Button>
            }
          >
            {activeOrders.length === 0 ? (
              <EmptyState title="No active orders" description="All production orders have been completed and dispatched." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {activeOrders.slice(0, 6).map((order) => {
                  const client = clients.find((c) => c.id === order.client_id);

                  return (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder(order.id)}
                      style={{
                        padding: "10px 12px",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-xs)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.1s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "var(--accent-text)",
                            }}
                          >
                            {order.order_number}
                          </span>
                          <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500 }}>
                            {client?.organization_name || "Client Order"}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", gap: "8px" }}>
                          <span>Due: {order.promised_delivery_date ? new Date(order.promised_delivery_date).toLocaleDateString() : "Flexible"}</span>
                          <span>•</span>
                          <span>Value: ₹{Number(order.total_amount || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <PriorityBadge priority={order.priority} />
                        <OrderStatusBadge status={order.status} />
                        <Icon name="chevron-right" size={13} color="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Right: Urgent Tasks & Bottlenecks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card
              title="Urgent Tasks & Bottlenecks"
              subtitle="Steps requiring operator signoff or blocker resolution"
            >
              {tasks.length === 0 ? (
                <EmptyState title="No floor tasks" description="All assigned tasks are up to date." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task.id)}
                      style={{
                        padding: "8px 10px",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-xs)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {task.title || task.task_code}
                        </span>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {task.task_code} • Order: {task.order_id.slice(0, 8)}...
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <TaskStatusBadge status={task.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card title="Operational Quick Actions">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <Button variant="secondary" icon="orders" onClick={onNewOrder}>
                  Create Production Job
                </Button>
                <Button variant="secondary" icon="clients" onClick={onNewClient}>
                  Onboard New Client
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
