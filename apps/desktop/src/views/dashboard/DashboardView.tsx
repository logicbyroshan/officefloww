import React, { useState, useMemo } from "react";
import { Order, Task, Approval, Client, OrderPriority, TaskStatus } from "@officefloww/api-types";
import { AppNavSection } from "../../auth/permissions";
import { useAuth } from "../../auth/AuthContext";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";
import { INITIAL_ORDERS, OrderRecord } from "../orders/OrdersWorkspaceView";
import { INITIAL_STOCK_ITEMS, StockItem } from "../stock/StockDashboardView";

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
  onNavigateSection,
}) => {
  const { hasPerm } = useAuth();
  const { success } = useToast();

  // ─── Live Orders State ────────────────────────────────────────────────────────
  const [liveOrders, setLiveOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);

  // ─── Live Stock Items State ───────────────────────────────────────────────────
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCK_ITEMS);

  // Quick Restock Modal State (Direct Dashboard Access)
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem>(INITIAL_STOCK_ITEMS[0]);
  const [addStockQty, setAddStockQty] = useState<string>("500");
  const [addStockSource, setAddStockSource] = useState<string>("Plant Storeroom / Direct Delivery");

  // Stock items below minimum limit (ending soon)
  const lowStockItems = useMemo(() => {
    return stockItems.filter((i) => i.availableStock <= i.minThreshold);
  }, [stockItems]);

  // Active tasks calculation
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== TaskStatus.DONE);
  }, [tasks]);

  const handleQuickAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(addStockQty, 10) || 0;
    if (qty <= 0) return;

    setStockItems((prev) =>
      prev.map((item) =>
        item.id === selectedStockItem.id
          ? { ...item, availableStock: item.availableStock + qty }
          : item
      )
    );

    success("Stock Replenished", `Added +${qty.toLocaleString()} ${selectedStockItem.unit} to ${selectedStockItem.name}`);
    setIsAddStockModalOpen(false);
    setAddStockQty("500");
  };

  const handleOpenRestockModal = (item: StockItem) => {
    setSelectedStockItem(item);
    setAddStockQty(item.unit === "rolls" ? "10" : item.unit.includes("packet") ? "10" : "1000");
    setIsAddStockModalOpen(true);
  };

  if (loading && orders.length === 0 && liveOrders.length === 0) {
    return <LoadingState message="Connecting to production floor telemetry..." />;
  }

  if (error && orders.length === 0 && liveOrders.length === 0) {
    return <ErrorState message={error.message} onRetry={onRefresh} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Header with live operational status */}
      <PageHeader
        title="Home"
        badge={
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              color: "var(--accent-text)",
              backgroundColor: "var(--accent-soft)",
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

      <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
              <Button
                variant="primary"
                size="sm"
                icon="plus"
                onClick={onNewOrder}
              >
                + New Order
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              icon="stock"
              onClick={() => setIsAddStockModalOpen(true)}
            >
              + Stock Entry
            </Button>

            {hasPerm("clients:create") && (
              <Button
                variant="secondary"
                size="sm"
                icon="clients"
                onClick={onNewClient}
              >
                + New Client
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              icon="quotations"
              onClick={onNewQuotation ? onNewQuotation : () => onNavigateSection?.("clients")}
            >
              + New Quotation
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon="tasks"
              onClick={onNewTask ? onNewTask : () => onNavigateSection?.("orders")}
            >
              + New Task
            </Button>
          </div>
        </div>

        {/* ─── 4 CORE STATS CARDS (Active Orders, Low Stock Alert, Total Clients, Total Tasks) ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          {/* 1. Active Orders */}
          <div
            onClick={() => onNavigateSection?.("orders")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderLeft: "3px solid var(--accent)",
              borderRadius: "6px",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-border)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            title="Click to view all active production orders"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)" }}>
                Active Orders
              </span>
              <Icon name="orders" size={15} color="var(--accent-text)" />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff", lineHeight: 1 }}>
                {liveOrders.length}
              </span>
              <span style={{ fontSize: "12px", color: "var(--accent-text)", fontWeight: 600 }}>
                in production
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Active manufacturing queue →
            </div>
          </div>

          {/* 2. Stock Below Minimum Limit (Ending Soon) */}
          <div
            onClick={() => onNavigateSection?.("stock")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderLeft: lowStockItems.length > 0 ? "3px solid #f87171" : "3px solid #10b981",
              borderRadius: "6px",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = lowStockItems.length > 0 ? "rgba(248, 113, 113, 0.4)" : "rgba(16, 185, 129, 0.4)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            title="Click to view and replenish stock items below minimum limit"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)" }}>
                Low Stock Alert
              </span>
              <Icon name="tool" size={15} color={lowStockItems.length > 0 ? "#f87171" : "#10b981"} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-mono)", color: lowStockItems.length > 0 ? "#f87171" : "#10b981", lineHeight: 1 }}>
                {lowStockItems.length}
              </span>
              <span style={{ fontSize: "12px", color: lowStockItems.length > 0 ? "#f87171" : "#10b981", fontWeight: 600 }}>
                below min limit
              </span>
            </div>
            <div style={{ fontSize: "11px", color: lowStockItems.length > 0 ? "#f87171" : "var(--text-secondary)", marginTop: "2px" }}>
              {lowStockItems.length > 0 ? "Ending soon · Critical replenishment →" : "All floor items above threshold →"}
            </div>
          </div>

          {/* 3. Total Clients */}
          <div
            onClick={() => onNavigateSection?.("clients")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderLeft: "3px solid #38bdf8",
              borderRadius: "6px",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.4)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            title="Click to view all registered clients"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)" }}>
                Total Clients
              </span>
              <Icon name="clients" size={15} color="#38bdf8" />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff", lineHeight: 1 }}>
                {clients.length || 8}
              </span>
              <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 600 }}>
                accounts
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Commercial & institutional clients →
            </div>
          </div>

          {/* 4. Total Tasks */}
          <div
            onClick={() => onNavigateSection?.("orders")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderLeft: "3px solid #a855f7",
              borderRadius: "6px",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.4)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            title="Click to view all tasks"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)" }}>
                Total Tasks
              </span>
              <Icon name="tasks" size={15} color="#a855f7" />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff", lineHeight: 1 }}>
                {tasks.length || 6}
              </span>
              <span style={{ fontSize: "12px", color: "#a855f7", fontWeight: 600 }}>
                floor operations
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
              {activeTasks.length || 4} active in production →
            </div>
          </div>
        </div>

        {/* ─── 2-COLUMN LIVE OPERATIONS SPLIT VIEW (Live Orders | Live Stock Info) ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", alignItems: "start" }}>

          {/* ─── SIDE 1: LIVE ORDERS WITH DIRECT DASHBOARD ACCESS ─────────────── */}
          <div
            style={{
              backgroundColor: "rgba(16, 21, 32, 0.85)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              borderRadius: "6px",
              boxShadow: "0 10px 36px rgba(0, 0, 0, 0.48)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Panel Header */}
            <div
              style={{
                padding: "16px 20px",
                background: "linear-gradient(180deg, #161c2c 0%, #0d121c 100%)",
                borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(255, 138, 115, 0.15)",
                    border: "1px solid var(--accent-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-text)",
                  }}
                >
                  <Icon name="orders" size={16} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#fff", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                      Live Orders
                    </h3>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: "rgba(255, 138, 115, 0.14)",
                        color: "var(--accent-text)",
                        border: "1px solid var(--accent-border)",
                        padding: "2px 7px",
                        borderRadius: "12px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {liveOrders.length} Active
                    </span>
                  </div>
                  <p style={{ fontSize: "11.5px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                    Real-time factory queue & direct client order access
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onNewOrder}
                  style={{ height: "32px" }}
                >
                  + New Order
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigateSection?.("orders")}
                  style={{ height: "32px" }}
                >
                  Go to Orders →
                </Button>
              </div>
            </div>

            {/* Live Orders List */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {liveOrders.slice(0, 5).map((order, idx) => {
                const itemOrdered = order.itemOrdered || order.itemsOrdered?.[0] || "Custom Product";
                return (
                  <div
                    key={order.internalId}
                    style={{
                      padding: "14px 18px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)")
                    }
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {order.client}
                        </span>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: "3px",
                            backgroundColor: "rgba(255, 138, 115, 0.15)",
                            color: "var(--accent-text)",
                            border: "1px solid rgba(255, 138, 115, 0.3)",
                            textTransform: "uppercase",
                          }}
                        >
                          {itemOrdered}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {order.product}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>Due: <strong style={{ color: "#f59e0b" }}>{order.deliveryDate || "15 Sep 2026"}</strong></span>
                        {order.assignedTo?.[0] && (
                          <span>Assigned: <strong style={{ color: "#38bdf8" }}>{order.assignedTo[0].name}</strong></span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "15px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                          {order.qty.toLocaleString()}
                        </div>
                        <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>units</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigateSection?.("orders")}
                        style={{
                          height: "32px",
                          padding: "0 12px",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          borderRadius: "4px",
                          color: "#fff",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--accent-soft)";
                          e.currentTarget.style.borderColor = "var(--accent-border)";
                          e.currentTarget.style.color = "var(--accent-text)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        title="Manage order in Orders workspace"
                      >
                        Manage →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Orders Footer */}
            <div
              style={{
                padding: "12px 18px",
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "11.5px",
                color: "var(--text-muted)",
              }}
            >
              <span>Showing 5 of {liveOrders.length} active orders</span>
              <button
                type="button"
                onClick={() => onNavigateSection?.("orders")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-text)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "11.5px",
                }}
              >
                View Full Orders Workspace →
              </button>
            </div>
          </div>

          {/* ─── SIDE 2: LIVE STOCK INFO WITH DIRECT DASHBOARD ACCESS ─────────── */}
          <div
            style={{
              backgroundColor: "rgba(16, 21, 32, 0.85)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              borderRadius: "6px",
              boxShadow: "0 10px 36px rgba(0, 0, 0, 0.48)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Panel Header */}
            <div
              style={{
                padding: "16px 20px",
                background: "linear-gradient(180deg, #161c2c 0%, #0d121c 100%)",
                borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "4px",
                    backgroundColor: lowStockItems.length > 0 ? "rgba(248, 113, 113, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    border: lowStockItems.length > 0 ? "1px solid rgba(248, 113, 113, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: lowStockItems.length > 0 ? "#f87171" : "#10b981",
                  }}
                >
                  <Icon name="tool" size={16} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#fff", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                      Live Stock Info
                    </h3>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: lowStockItems.length > 0 ? "rgba(248, 113, 113, 0.15)" : "rgba(16, 185, 129, 0.15)",
                        color: lowStockItems.length > 0 ? "#f87171" : "#10b981",
                        border: lowStockItems.length > 0 ? "1px solid rgba(248, 113, 113, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)",
                        padding: "2px 7px",
                        borderRadius: "12px",
                      }}
                    >
                      {lowStockItems.length > 0 ? `${lowStockItems.length} Low Alert` : "Healthy"}
                    </span>
                  </div>
                  <p style={{ fontSize: "11.5px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                    Floor availability, critical alerts & direct stock management
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddStockModalOpen(true)}
                  style={{ height: "32px" }}
                >
                  + Add Stock
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigateSection?.("stock")}
                  style={{ height: "32px" }}
                >
                  Manage Stock →
                </Button>
              </div>
            </div>

            {/* Pinned Low Stock Section (Ending Soon) */}
            {lowStockItems.length > 0 && (
              <div
                style={{
                  padding: "10px 18px",
                  backgroundColor: "rgba(248, 113, 113, 0.08)",
                  borderBottom: "1px solid rgba(248, 113, 113, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "#f87171", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>⚠️</span> Ending Soon — Below Safety Limit
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Immediate Restock Required</span>
              </div>
            )}

            {/* Stock Items List */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Prioritize low stock items at the top */}
              {[
                ...lowStockItems,
                ...stockItems.filter((i) => i.availableStock > i.minThreshold).slice(0, 5 - lowStockItems.length),
              ].map((item, idx) => {
                const isLow = item.availableStock <= item.minThreshold;

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: "14px 18px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      backgroundColor: isLow
                        ? "rgba(248, 113, 113, 0.03)"
                        : idx % 2 === 0
                        ? "transparent"
                        : "rgba(255, 255, 255, 0.015)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = isLow
                        ? "rgba(248, 113, 113, 0.03)"
                        : idx % 2 === 0
                        ? "transparent"
                        : "rgba(255, 255, 255, 0.015)")
                    }
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: item.iconColor,
                          flexShrink: 0,
                        }}
                      >
                        <Icon name={item.iconName} size={16} color={item.iconColor} />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff" }}>
                            {item.name}
                          </span>
                          {isLow && (
                            <span
                              style={{
                                fontSize: "9.5px",
                                fontWeight: 800,
                                padding: "1px 5px",
                                borderRadius: "2px",
                                backgroundColor: "rgba(248, 113, 113, 0.2)",
                                color: "#f87171",
                                border: "1px solid rgba(248, 113, 113, 0.35)",
                                letterSpacing: "0.5px",
                              }}
                            >
                              LOW
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          Min Alert Threshold: <strong style={{ color: "#94a3b8" }}>{item.minThreshold.toLocaleString()} {item.unit}</strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "15.5px",
                            fontWeight: 800,
                            fontFamily: "var(--font-mono)",
                            color: isLow ? "#f87171" : "#ffffff",
                          }}
                        >
                          {item.availableStock.toLocaleString()}
                        </div>
                        <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                          {item.unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenRestockModal(item)}
                        style={{
                          height: "32px",
                          padding: "0 12px",
                          backgroundColor: isLow ? "rgba(248, 113, 113, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          border: isLow ? "1px solid rgba(248, 113, 113, 0.35)" : "1px solid rgba(16, 185, 129, 0.3)",
                          borderRadius: "4px",
                          color: isLow ? "#f87171" : "#34d399",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isLow ? "rgba(248, 113, 113, 0.25)" : "rgba(16, 185, 129, 0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isLow ? "rgba(248, 113, 113, 0.15)" : "rgba(16, 185, 129, 0.15)";
                        }}
                        title="Restock item directly from Dashboard"
                      >
                        + Restock
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stock Footer */}
            <div
              style={{
                padding: "12px 18px",
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "11.5px",
                color: "var(--text-muted)",
              }}
            >
              <span>{stockItems.length} total inventory items monitored</span>
              <button
                type="button"
                onClick={() => onNavigateSection?.("stock")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-text)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "11.5px",
                }}
              >
                View Full Stock Table →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DIRECT RESTOCK MODAL (MANAGED DIRECTLY FROM DASHBOARD) ─────────── */}
      {isAddStockModalOpen && (
        <Modal
          isOpen={isAddStockModalOpen}
          onClose={() => setIsAddStockModalOpen(false)}
          title="Direct Stock Replenishment"
        >
          <form onSubmit={handleQuickAddStock} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Select
              label="Stock Item"
              value={selectedStockItem.id}
              onChange={(val) => {
                const found = stockItems.find((i) => i.id === val);
                if (found) setSelectedStockItem(found);
              }}
              options={stockItems.map((i) => ({
                value: i.id,
                label: `${i.name} (Current: ${i.availableStock} ${i.unit})`,
              }))}
            />

            <Input
              label={`Quantity to Add (${selectedStockItem.unit})`}
              type="number"
              value={addStockQty}
              onChange={(e) => setAddStockQty(e.target.value)}
              placeholder="e.g. 500"
              required
            />

            <Input
              label="Receipt Source / Delivery Note"
              value={addStockSource}
              onChange={(e) => setAddStockSource(e.target.value)}
              placeholder="e.g. Warehouse Batch Restock"
            />

            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "4px",
                fontSize: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>New Floor Available:</span>
              <strong style={{ color: "#34d399", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                {(selectedStockItem.availableStock + (parseInt(addStockQty, 10) || 0)).toLocaleString()} {selectedStockItem.unit}
              </strong>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsAddStockModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Confirm & Add Stock
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
