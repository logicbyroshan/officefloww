import React, { useState, useEffect } from "react";
import {
  Order,
  OrderItem,
  WorkflowInstance,
  Task,
  FileFolder,
  QuantitySummary,
  Client,
} from "@officefloww/api-types";
import { OrdersService, FilesService, QuantitiesService } from "../../api/services";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Tabs } from "../../design-system/components/Tabs";
import { Card } from "../../design-system/components/Card";
import { PriorityBadge, OrderStatusBadge, Badge } from "../../design-system/components/Badge";
import { QuantityDisplay } from "../../design-system/components/QuantityDisplay";
import { WorkflowTimeline, TimelineStepItem } from "../../design-system/components/Timeline";
import { Table, Column } from "../../design-system/components/Table";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { LoadingState, ErrorState, EmptyState } from "../../design-system/components/FeedbackStates";

export interface OrderDetailViewProps {
  orderId: string;
  clients: Client[];
  onBack: () => void;
  onSelectTask: (taskId: string) => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  orderId,
  clients,
  onBack,
  onSelectTask,
}) => {
  const [activeTab, setActiveTab] = useState<"items" | "workflow" | "files" | "quantities">("items");
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [quantitySummaries, setQuantitySummaries] = useState<Record<string, QuantitySummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, itms, wfs, tsks, fldrs] = await Promise.all([
        OrdersService.get(orderId),
        OrdersService.getItems(orderId).catch(() => []),
        OrdersService.getWorkflow(orderId).catch(() => []),
        OrdersService.getTasks(orderId).catch(() => []),
        FilesService.getOrderWorkspace(orderId).catch(() => []),
      ]);

      setOrder(o);
      setItems(itms);
      setWorkflows(wfs);
      setTasks(tsks);
      setFolders(fldrs);

      // Load quantity summaries for items
      const qMap: Record<string, QuantitySummary> = {};
      for (const item of itms) {
        try {
          const qSummary = await QuantitiesService.getSummary(item.id);
          qMap[item.id] = qSummary;
        } catch {
          // ignore item quantity error
        }
      }
      setQuantitySummaries(qMap);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orderId]);

  if (loading) return <LoadingState message="Loading order workspace & workflows..." />;
  if (error || !order) return <ErrorState message={error?.message || "Order not found"} onRetry={loadData} />;

  const client = clients.find((c) => c.id === order.client_id);

  // Convert tasks to Timeline steps
  const timelineSteps: TimelineStepItem[] = tasks.map((t) => ({
    id: t.id,
    name: t.title || t.task_code,
    status: t.status,
    assigneeName: t.assigned_user_id ? `Operator (${t.assigned_user_id.slice(0, 6)})` : undefined,
    blockerReason: t.blockers?.find((b) => !b.resolved_at)?.reason,
    completedAt: t.completed_at || undefined,
  }));

  const itemColumns: Column<OrderItem>[] = [
    {
      key: "product_id",
      header: "Product Item Ref",
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            Product Line ({item.product_id.slice(0, 10)}...)
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Item ID: {item.id.slice(0, 14)}...
          </div>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Ordered Qty",
      align: "right",
      width: "120px",
      render: (item) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
          {item.quantity.toLocaleString()}
        </span>
      ),
    },
    {
      key: "unit_price",
      header: "Unit Rate",
      align: "right",
      width: "120px",
      render: (item) => (
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          ₹{Number(item.unit_price || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: "total_price",
      header: "Line Total",
      align: "right",
      width: "140px",
      render: (item) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent-text)" }}>
          ₹{(Number(item.quantity) * Number(item.unit_price || 0)).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title={`Order ${order.order_number}`}
        subtitle={`Client: ${client?.organization_name || "Commercial Client"} • Value: ₹${Number(order.total_amount || 0).toLocaleString()}`}
        breadcrumbs={[
          { label: "Orders Directory", onClick: onBack },
          { label: order.order_number },
        ]}
        badge={
          <div style={{ display: "flex", gap: "6px" }}>
            <PriorityBadge priority={order.priority} />
            <OrderStatusBadge status={order.status} />
          </div>
        }
        secondaryActions={
          <Button variant="secondary" icon="refresh" onClick={loadData}>
            Refresh
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: "items", label: "Ordered Items", icon: "package", badge: items.length },
          { id: "workflow", label: "DAG Workflow & Tasks", icon: "tasks", badge: tasks.length },
          { id: "files", label: "Files Workspace", icon: "files", badge: folders.reduce((acc, f) => acc + (f.files?.length || 0), 0) },
          { id: "quantities", label: "Quantity Ledger & Scrap", icon: "stock" },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
        {/* Tab 1: Ordered Items */}
        {activeTab === "items" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card title="Production Job Specifications" subtitle="Detailed items, quantities, and pricing configuration">
              <Table
                columns={itemColumns}
                data={items}
                keyExtractor={(itm) => itm.id}
                emptyText="No items found in this order."
              />
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Card title="Delivery & SLA Target">
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Target Promised Date: </span>
                    <strong style={{ color: "var(--text-primary)" }}>
                      {order.promised_delivery_date ? new Date(order.promised_delivery_date).toLocaleDateString() : "Flexible"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Delivery Address: </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {order.delivery_address || client?.delivery_address || "Standard Factory Dispatch"}
                    </span>
                  </div>
                </div>
              </Card>

              <Card title="Client & Tax Identifier">
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Client Code: </span>
                    <strong style={{ fontFamily: "var(--font-mono)", color: "var(--accent-text)" }}>
                      {client?.client_code || "CLI-00"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Tax ID / GSTIN: </span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                      {client?.tax_identifier || "Unregistered B2C"}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Workflow DAG */}
        {activeTab === "workflow" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
            <Card
              title="Execution Stages & DAG Timeline"
              subtitle="Step-by-step progress through data entry, photography, printing, fitting, and packing"
            >
              {timelineSteps.length === 0 ? (
                <EmptyState title="No workflow steps generated" description="Confirm the order to trigger automatic DAG task instantiation." />
              ) : (
                <WorkflowTimeline steps={timelineSteps} onStepClick={(s) => onSelectTask(s.id)} />
              )}
            </Card>

            <Card title="Active Bottlenecks & Blockers" subtitle="Tasks requiring immediate resolution">
              {tasks.filter((t) => t.status === "BLOCKED").length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                  <Icon name="check-circle" size={24} color="var(--status-success)" />
                  <p style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                    No blocked steps on this order. Workflow is progressing smoothly.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {tasks
                    .filter((t) => t.status === "BLOCKED")
                    .map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: "10px",
                          backgroundColor: "var(--status-error-soft)",
                          border: "1px solid var(--status-error-border)",
                          borderRadius: "var(--radius-xs)",
                        }}
                      >
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--status-error)" }}>
                          {t.title || t.task_code}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Reason: {t.blockers?.find((b) => !b.resolved_at)?.reason || "Material shortage"}
                        </div>
                        <div style={{ marginTop: "8px" }}>
                          <Button size="sm" variant="danger" onClick={() => onSelectTask(t.id)}>
                            Resolve Blocker in Task Drawer
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Tab 3: Files Workspace */}
        {activeTab === "files" && (
          <Card
            title="Logical Order Workspace Files"
            subtitle={`Storage bucket: officefloww-files/${order.order_number}/`}
          >
            {folders.length === 0 ? (
              <EmptyState icon="files" title="Workspace folders empty" description="Upload student rosters, photos, or print artwork." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {folders.map((folder) => (
                  <div
                    key={folder.name || folder.path}
                    style={{
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-xs)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "var(--bg-muted)",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Icon name="files" size={13} color="var(--accent-text)" />
                      <span>{folder.name || folder.path}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "auto" }}>
                        {folder.files?.length || 0} file(s)
                      </span>
                    </div>

                    <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {!folder.files || folder.files.length === 0 ? (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                          No files uploaded in this folder.
                        </div>
                      ) : (
                        folder.files.map((f) => {
                          const latestVersion = f.versions?.[f.versions.length - 1];
                          return (
                            <div
                              key={f.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "6px 8px",
                                backgroundColor: "var(--bg-surface)",
                                borderRadius: "var(--radius-xs)",
                                border: "1px solid var(--border-subtle)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Icon name="files" size={12} color="var(--text-muted)" />
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>
                                  {f.filename}
                                </span>
                                <Badge variant="accent">v{f.current_version_number || 1}</Badge>
                                {latestVersion?.approval_state === "APPROVED" && (
                                  <Badge variant="success" dot>Approved</Badge>
                                )}
                              </div>
                              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                                {latestVersion ? `${(latestVersion.file_size / 1024).toFixed(1)} KB` : "0 KB"}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Tab 4: Quantity Ledger */}
        {activeTab === "quantities" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {items.map((item) => (
              <QuantityDisplay
                key={item.id}
                summary={quantitySummaries[item.id]}
                ordered={item.quantity}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
