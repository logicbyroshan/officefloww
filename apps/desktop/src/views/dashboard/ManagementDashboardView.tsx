import React from "react";
import { Order, Task, Approval, Client, StockBalance } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Card, StatBox } from "../../design-system/components/Card";
import { Badge, PriorityBadge, OrderStatusBadge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";

export interface ManagementDashboardViewProps {
  orders: Order[];
  tasks: Task[];
  approvals: Approval[];
  clients: Client[];
  onSelectOrder: (orderId: string) => void;
  onSelectTask: (taskId: string) => void;
  onSwitchToFloorView?: () => void;
}

export const ManagementDashboardView: React.FC<ManagementDashboardViewProps> = ({
  orders,
  tasks,
  approvals,
  clients,
  onSelectOrder,
  onSelectTask,
  onSwitchToFloorView,
}) => {
  // Compute exceptions
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED");
  const pendingApprovals = approvals.filter((a) => a.status === "PENDING");
  const urgentOrders = orders.filter((o) => o.priority === "URGENT" || o.priority === "HIGH");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Management Exceptions Dashboard"
        subtitle="Executive cockpit surfacing operational bottlenecks, material shortages, and SLA breach risks."
        secondaryActions={
          onSwitchToFloorView && (
            <Button variant="secondary" icon="dashboard" onClick={onSwitchToFloorView}>
              Switch to Floor View
            </Button>
          )
        }
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
        {/* Exception Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
          <StatBox
            label="Blocked Floor Tasks"
            value={blockedTasks.length}
            subValue="Awaiting Materials"
            icon="alert-circle"
            status={blockedTasks.length > 0 ? "urgent" : "normal"}
          />
          <StatBox
            label="Approval Bottlenecks"
            value={pendingApprovals.length}
            subValue="Holding Press Runs"
            icon="approvals"
            status={pendingApprovals.length > 0 ? "warning" : "normal"}
          />
          <StatBox
            label="High-Priority Jobs"
            value={urgentOrders.length}
            subValue="Rush SLAs"
            icon="orders"
            status={urgentOrders.length > 0 ? "warning" : "normal"}
          />
          <StatBox
            label="Critical Stock Alerts"
            value="1 Item"
            subValue="Breakaway Buckles"
            icon="stock"
            status="urgent"
          />
          <StatBox
            label="Outstanding Invoices"
            value="₹82.5K"
            subValue="Pending Collection"
            icon="billing"
            status="warning"
          />
        </div>

        {/* Exceptions Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Active Operational Blockers */}
          <Card
            title="Floor Execution Blockers & Bottlenecks"
            subtitle="Machine press and assembly steps halted pending intervention"
          >
            {blockedTasks.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--status-success)" }}>
                <Icon name="check-circle" size={24} />
                <p style={{ marginTop: "6px", fontSize: "12px" }}>No active blockers across floor equipment.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {blockedTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t.id)}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "var(--status-error-soft)",
                      border: "1px solid var(--status-error-border)",
                      borderRadius: "var(--radius-xs)",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--status-error)" }}>{t.title || t.task_code}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        Reason: {t.blockers?.find((b) => !b.resolved_at)?.reason || "Material shortage"}
                      </div>
                    </div>
                    <Button size="sm" variant="danger">
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Proof Approvals Holding Production */}
          <Card
            title="Artwork Proof Reviews Holding Production"
            subtitle="Batches cannot run on digital presses until file version is locked"
          >
            {pendingApprovals.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--status-success)" }}>
                <Icon name="check-circle" size={24} />
                <p style={{ marginTop: "6px", fontSize: "12px" }}>All submitted artwork versions are locked and approved.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {pendingApprovals.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-xs)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Order ID: {a.order_id.slice(0, 14)}...</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Submitted: {new Date(a.requested_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge variant="warning" dot>Awaiting Signoff</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Priority Orders & Cashflow Risk */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
          <Card title="High-Priority & Rush Order Schedules" subtitle="Orders requiring prioritized press allocation">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {urgentOrders.map((o) => {
                const client = clients.find((c) => c.id === o.client_id);
                return (
                  <div
                    key={o.id}
                    onClick={() => onSelectOrder(o.id)}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-xs)",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
                        {o.order_number}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-primary)", marginLeft: "8px" }}>
                        {client?.organization_name || "Client"}
                      </span>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Promised: {o.promised_delivery_date ? new Date(o.promised_delivery_date).toLocaleDateString() : "Immediate"} • ₹{Number(o.total_amount || 0).toLocaleString()}
                      </div>
                    </div>
                    <PriorityBadge priority={o.priority} />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Financial Collections & Receivables Aging" subtitle="Commercial payments past grace period">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ padding: "10px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>St. Xavier's High School</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Outstanding: <strong>₹82,500.00</strong> (Due Sep 15, 2026)</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
