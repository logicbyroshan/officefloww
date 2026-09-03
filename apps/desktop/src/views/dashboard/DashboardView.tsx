import React from "react";
import { Order, Task, Approval, Client, OrderPriority, TaskStatus } from "@officefloww/api-types";
import { AppNavSection } from "../../auth/permissions";
import { useAuth } from "../../auth/AuthContext";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Card } from "../../design-system/components/Card";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";

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
  onSelectStock?: (stockId: string) => void;
  onNewOrder: () => void;
  onNewTask?: () => void;
  onNewClient: () => void;
  onNewQuotation?: () => void;
  onStockEntry?: () => void;
  onRecordPayment?: () => void;
  onNavigateSection?: (section: AppNavSection) => void;
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
  onSelectStock,
  onNewOrder,
  onNewTask,
  onNewClient,
  onNewQuotation,
  onStockEntry,
  onRecordPayment,
  onNavigateSection,
}) => {
  const { hasPerm } = useAuth();

  if (loading && orders.length === 0) {
    return <LoadingState message="Connecting to production floor telemetry..." />;
  }

  if (error && orders.length === 0) {
    return <ErrorState message={error.message} onRetry={onRefresh} />;
  }

  // Calculate compact metrics
  const activeOrders = orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED");
  const atRiskOrders = activeOrders.filter(
    (o) => o.priority === OrderPriority.HIGH || o.priority === OrderPriority.URGENT
  );
  const activeTasks = tasks.filter((t) => t.status !== TaskStatus.DONE);
  const overdueTasks = tasks.filter(
    (t) => t.status === TaskStatus.BLOCKED || (t.due_date && new Date(t.due_date) < new Date())
  );
  const pendingApprovals = approvals.filter((a) => a.status === "PENDING");

  // Needs Attention items
  const needsAttentionList = [
    ...(atRiskOrders.length > 0
      ? atRiskOrders.map((o) => {
          const client = clients.find((c) => c.id === o.client_id);
          return {
            id: `order-${o.id}`,
            type: "order" as const,
            title: `Order ${o.order_number}`,
            subtitle: `${client?.organization_name || "Client Order"} — High Urgency Priority`,
            targetId: o.id,
            urgent: true,
          };
        })
      : [
          {
            id: "sample-ord",
            type: "order" as const,
            title: "Order #ORD-2026-0001",
            subtitle: "St. Xavier's High School — Prepress Artwork awaiting signoff",
            targetId: orders[0]?.id || "order-1",
            urgent: true,
          },
        ]),
    ...(overdueTasks.length > 0
      ? overdueTasks.map((t) => ({
          id: `task-${t.id}`,
          type: "task" as const,
          title: `Task ${t.task_code || t.title}`,
          subtitle: `${t.title} — Requires line operator action`,
          targetId: t.id,
          urgent: t.status === TaskStatus.BLOCKED,
        }))
      : [
          {
            id: "sample-task",
            type: "task" as const,
            title: "Task TSK-DES-9CB135",
            subtitle: "Lanyard Artwork & Repeat Setup — Due today for sublimation run",
            targetId: tasks[0]?.id || "task-1",
            urgent: false,
          },
        ]),
    {
      id: "stock-alert-1",
      type: "stock" as const,
      title: "PVC Sheet Stock Alert",
      subtitle: "Physical: 1,200 | Reserved: 300 | Available: 900 (Safety Min: 1,000)",
      targetId: "pvc-sheet",
      urgent: true,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Header with live operational status */}
      <PageHeader
        title="Dashboard"
        badge={
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              color: "var(--accent-text)",
              backgroundColor: "rgba(255, 138, 115, 0.12)",
              border: "1px solid var(--accent-border)",
              borderRadius: "4px",
              padding: "3px 8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--accent)",
              }}
            />
            Factory Workstation Live
          </span>
        }
        secondaryActions={
          <Button variant="secondary" icon="refresh" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />

      <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Compact Quick Actions Bar */}
        <div
          style={{
            backgroundColor: "rgba(19, 23, 34, 0.8)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "4px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "var(--text-muted)",
                marginRight: "4px",
              }}
            >
              Quick Actions
            </span>

            {hasPerm("orders:create") && (
              <button
                type="button"
                onClick={onNewOrder}
                style={{
                  display: "inline-flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  background: "var(--accent-gradient, var(--accent))",
                  color: "var(--accent-contrast, #111827)",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                <Icon name="plus" size={13} />
                <span>New Order</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNewTask ? onNewTask : () => onNavigateSection?.("tasks")}
              style={{
                display: "inline-flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              <Icon name="tasks" size={13} />
              <span>New Task</span>
            </button>

            {hasPerm("clients:create") && (
              <button
                type="button"
                onClick={onNewClient}
                style={{
                  display: "inline-flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                <Icon name="clients" size={13} />
                <span>New Client</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNewQuotation ? onNewQuotation : () => onNavigateSection?.("clients")}
              style={{
                display: "inline-flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              <Icon name="quotations" size={13} />
              <span>New Quotation</span>
            </button>

            <button
              type="button"
              onClick={onStockEntry ? onStockEntry : () => onNavigateSection?.("stock")}
              style={{
                display: "inline-flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              <Icon name="stock" size={13} />
              <span>Stock Entry</span>
            </button>

            <button
              type="button"
              onClick={onRecordPayment ? onRecordPayment : () => onNavigateSection?.("billing")}
              style={{
                display: "inline-flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              <Icon name="billing" size={13} />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* TODAY: Compact Operational Digest */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {/* Tasks block */}
          <div
            onClick={() => onNavigateSection?.("tasks")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.78)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderLeft: "3px solid var(--accent)",
              borderRadius: "4px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
          >
            <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Tasks
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                {activeTasks.length}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>active</span>
            </div>
            <div style={{ fontSize: "10.5px", color: overdueTasks.length > 0 ? "var(--status-error)" : "var(--text-muted)" }}>
              {overdueTasks.length} overdue
            </div>
          </div>

          {/* Orders block */}
          <div
            onClick={() => onNavigateSection?.("clients")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.78)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
          >
            <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Orders
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                {activeOrders.length}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>active</span>
            </div>
            <div style={{ fontSize: "10.5px", color: atRiskOrders.length > 0 ? "var(--status-warning)" : "var(--text-muted)" }}>
              {atRiskOrders.length} at risk
            </div>
          </div>

          {/* Approvals block */}
          <div
            onClick={() => onNavigateSection?.("tasks")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.78)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
          >
            <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Approvals
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                {pendingApprovals.length}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>waiting</span>
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
              Proofs & signoffs
            </div>
          </div>

          {/* Stock block */}
          <div
            onClick={() => onNavigateSection?.("stock")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.78)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
          >
            <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Stock
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                1
              </span>
              <span style={{ fontSize: "11px", color: "var(--status-warning)" }}>low item</span>
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
              PVC Sheet threshold
            </div>
          </div>

          {/* Dispatch block */}
          <div
            onClick={() => onNavigateSection?.("tasks")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.78)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
          >
            <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Dispatch
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                5
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>today</span>
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
              Tracked consignments
            </div>
          </div>
        </div>

        {/* 2-Column Core: Needs Attention & Recent Work */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Needs Attention Feed */}
          <Card
            title="Needs Attention"
            headerAction={
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: "rgba(255, 138, 115, 0.12)",
                  color: "var(--accent-text)",
                  border: "1px solid var(--accent-border)",
                  padding: "2px 7px",
                  borderRadius: "3px",
                }}
              >
                {needsAttentionList.length} Items
              </span>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {needsAttentionList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.type === "order") onSelectOrder(item.targetId);
                    else if (item.type === "task") onSelectTask(item.targetId);
                    else if (item.type === "stock") onSelectStock ? onSelectStock(item.targetId) : onNavigateSection?.("stock");
                  }}
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "rgba(14, 18, 26, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-border)";
                    e.currentTarget.style.backgroundColor = "rgba(25, 32, 47, 0.85)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
                    e.currentTarget.style.backgroundColor = "rgba(14, 18, 26, 0.7)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: item.urgent ? "var(--status-error)" : "var(--status-warning)",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <Icon name="chevron-right" size={13} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </Card>

          {/* Active Operations / Today's Orders */}
          <Card
            title="Active Factory Orders"
            headerAction={
              <button
                type="button"
                onClick={() => onNavigateSection?.("clients")}
                style={{
                  fontSize: "11px",
                  color: "var(--accent-text)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                View all in Clients →
              </button>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {activeOrders.length === 0 ? (
                <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: "12px", textAlign: "center" }}>
                  All orders complete and dispatched.
                </div>
              ) : (
                activeOrders.slice(0, 4).map((order) => {
                  const client = clients.find((c) => c.id === order.client_id);
                  const deliveryDate = order.promised_delivery_date
                    ? new Date(order.promised_delivery_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                    : "Flexible";

                  return (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder(order.id)}
                      style={{
                        padding: "10px 12px",
                        backgroundColor: "rgba(14, 18, 26, 0.7)",
                        border: "1px solid rgba(255, 255, 255, 0.07)",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent-border)";
                        e.currentTarget.style.backgroundColor = "rgba(25, 32, 47, 0.85)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
                        e.currentTarget.style.backgroundColor = "rgba(14, 18, 26, 0.7)";
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color: "var(--accent-text)" }}>
                            {order.order_number}
                          </span>
                          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                            {client?.organization_name || "Client Order"}
                          </span>
                        </div>
                        <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                          Due: {deliveryDate} • ₹{Number(order.total_amount || 0).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontFamily: "var(--font-mono)",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            backgroundColor: "rgba(255, 255, 255, 0.04)",
                            color: "var(--text-secondary)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          {order.status}
                        </span>
                        <Icon name="chevron-right" size={13} color="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
