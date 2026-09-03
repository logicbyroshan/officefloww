import React, { useState, useMemo } from "react";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";

// ─── Mock Data Types ──────────────────────────────────────────────────────────
type OrderStatus = "PENDING" | "CONFIRMED" | "IN_PRODUCTION" | "QUALITY_CHECK" | "READY" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
type OrderPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

interface Order {
  id: string;
  client: string;
  phone: string;
  product: string;
  category: string;
  qty: number;
  amount: number;
  priority: OrderPriority;
  status: OrderStatus;
  orderDate: string;
  deliveryDate: string;
  assignedTo: string;
  notes?: string;
}

// ─── Mock Orders ──────────────────────────────────────────────────────────────
const MOCK_ORDERS: Order[] = [
  { id: "ORD-2026-001", client: "St. Xavier's High School", phone: "+91 98200 11223", product: "Multicolor Lanyards (15mm)", category: "Lanyards", qty: 2000, amount: 48000, priority: "URGENT", status: "IN_PRODUCTION", orderDate: "28 Aug 2026", deliveryDate: "05 Sep 2026", assignedTo: "Adharsh Team", notes: "Triple color blue/white/red" },
  { id: "ORD-2026-002", client: "BHEL Township Admin", phone: "+91 76200 44322", product: "Single Color Lanyards (10mm)", category: "Lanyards", qty: 500, amount: 9500, priority: "NORMAL", status: "QUALITY_CHECK", orderDate: "30 Aug 2026", deliveryDate: "07 Sep 2026", assignedTo: "Suresh Batch", notes: "Navy blue, with ID pouch" },
  { id: "ORD-2026-003", client: "Northwind Coffee", phone: "+91 90000 33211", product: "Custom Printed Lanyards", category: "Lanyards", qty: 1500, amount: 33750, priority: "HIGH", status: "COMPLETED", orderDate: "22 Aug 2026", deliveryDate: "02 Sep 2026", assignedTo: "Suresh Batch", notes: "Red/white double color" },
  { id: "ORD-2026-004", client: "AIIMS Bhopal", phone: "+91 75500 22110", product: "Medical Staff ID Cards", category: "ID Cards", qty: 350, amount: 15750, priority: "URGENT", status: "READY", orderDate: "29 Aug 2026", deliveryDate: "04 Sep 2026", assignedTo: "Print Floor A", notes: "PVC laminated, photo embed" },
  { id: "ORD-2026-005", client: "Govt Engineering College", phone: "+91 84400 55661", product: "Lanyards + PVC Badges", category: "Combo", qty: 800, amount: 22400, priority: "HIGH", status: "DISPATCHED", orderDate: "25 Aug 2026", deliveryDate: "03 Sep 2026", assignedTo: "Dispatch Team" },
  { id: "ORD-2026-006", client: "Reliance Retail - Bhopal", phone: "+91 77200 66541", product: "Staff Access Cards", category: "ID Cards", qty: 200, amount: 18000, priority: "NORMAL", status: "CONFIRMED", orderDate: "01 Sep 2026", deliveryDate: "10 Sep 2026", assignedTo: "Print Floor B" },
  { id: "ORD-2026-007", client: "NIT Bhopal", phone: "+91 89100 12345", product: "Faculty + Student Lanyards", category: "Lanyards", qty: 1200, amount: 26400, priority: "HIGH", status: "IN_PRODUCTION", orderDate: "31 Aug 2026", deliveryDate: "08 Sep 2026", assignedTo: "Adharsh Team", notes: "20mm full color print" },
  { id: "ORD-2026-008", client: "Maulana Azad Hospital", phone: "+91 91000 77812", product: "Staff ID Lanyards", category: "Lanyards", qty: 600, amount: 13800, priority: "NORMAL", status: "PENDING", orderDate: "03 Sep 2026", deliveryDate: "12 Sep 2026", assignedTo: "Unassigned" },
  { id: "ORD-2026-009", client: "Smart City Council", phone: "+91 94300 55219", product: "Event Delegate Badges", category: "Badges", qty: 450, amount: 31500, priority: "URGENT", status: "PENDING", orderDate: "02 Sep 2026", deliveryDate: "06 Sep 2026", assignedTo: "Unassigned", notes: "Rush order - conference event" },
  { id: "ORD-2026-010", client: "Indraprastha School", phone: "+91 80000 44312", product: "Lanyards + ID Holders", category: "Combo", qty: 1000, amount: 21000, priority: "NORMAL", status: "CANCELLED", orderDate: "20 Aug 2026", deliveryDate: "01 Sep 2026", assignedTo: "-", notes: "Cancelled by client" },
  { id: "ORD-2026-011", client: "MP Secretariat", phone: "+91 75600 11990", product: "Embossed Security ID Cards", category: "ID Cards", qty: 150, amount: 27000, priority: "HIGH", status: "CONFIRMED", orderDate: "01 Sep 2026", deliveryDate: "09 Sep 2026", assignedTo: "Print Floor A" },
  { id: "ORD-2026-012", client: "Bansal Group Schools", phone: "+91 98100 55441", product: "Lanyards (12mm Blue/White)", category: "Lanyards", qty: 3000, amount: 63000, priority: "HIGH", status: "IN_PRODUCTION", orderDate: "27 Aug 2026", deliveryDate: "06 Sep 2026", assignedTo: "Both Teams" },
];

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING:       { label: "Pending",       color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)" },
  CONFIRMED:     { label: "Confirmed",     color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)" },
  IN_PRODUCTION: { label: "In Production", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  QUALITY_CHECK: { label: "QC Check",      color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" },
  READY:         { label: "Ready",         color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)" },
  DISPATCHED:    { label: "Dispatched",    color: "#38bdf8", bg: "rgba(56,189,248,0.12)",  border: "rgba(56,189,248,0.3)" },
  COMPLETED:     { label: "Completed",     color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)" },
  CANCELLED:     { label: "Cancelled",     color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
};

const PRIORITY_META: Record<OrderPriority, { label: string; color: string }> = {
  LOW:    { label: "Low",    color: "#64748b" },
  NORMAL: { label: "Normal", color: "#94a3b8" },
  HIGH:   { label: "High",   color: "#f59e0b" },
  URGENT: { label: "URGENT", color: "#f87171" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export const OrdersWorkspaceView: React.FC<{ onSelectOrder?: (id: string) => void }> = ({ onSelectOrder }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | OrderPriority>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortField, setSortField] = useState<"orderDate" | "deliveryDate" | "amount" | "qty">("deliveryDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const categories = ["ALL", ...Array.from(new Set(MOCK_ORDERS.map(o => o.category)))];

  const filtered = useMemo(() => {
    let list = MOCK_ORDERS.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !q || o.client.toLowerCase().includes(q) || o.product.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      const matchPriority = priorityFilter === "ALL" || o.priority === priorityFilter;
      const matchCategory = categoryFilter === "ALL" || o.category === categoryFilter;
      return matchSearch && matchStatus && matchPriority && matchCategory;
    });

    list = [...list].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = typeof aVal === "number" ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [search, statusFilter, priorityFilter, categoryFilter, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  // Summary stats
  const total = MOCK_ORDERS.length;
  const active = MOCK_ORDERS.filter(o => !["COMPLETED", "CANCELLED"].includes(o.status)).length;
  const urgent = MOCK_ORDERS.filter(o => o.priority === "URGENT" && !["COMPLETED", "CANCELLED"].includes(o.status)).length;
  const totalValue = MOCK_ORDERS.reduce((s, o) => s + o.amount, 0);
  const pendingDelivery = MOCK_ORDERS.filter(o => ["READY", "DISPATCHED"].includes(o.status)).length;

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <span style={{ marginLeft: "4px", fontSize: "9px", color: sortField === field ? "var(--accent-text)" : "var(--text-muted)", opacity: sortField === field ? 1 : 0.5 }}>
      {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
    </span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>

      {/* ─── STICKY HEADER ─────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "16px 28px 14px 28px",
          backgroundColor: "rgba(14, 18, 26, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          position: "sticky", top: 0, zIndex: 30, flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.3px" }}>Orders</h1>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>All client production orders across every category</span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Button variant="secondary" size="sm" icon="refresh" style={{ borderRadius: "2px" }}>Refresh</Button>
            <Button variant="primary" size="sm" icon="plus" style={{ borderRadius: "2px", backgroundColor: "var(--accent)", border: "none" }}>New Order</Button>
          </div>
        </div>

        {/* Summary stat strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "14px" }}>
          {[
            { label: "Total Orders", value: total, color: "#fff" },
            { label: "Active", value: active, color: "#f59e0b" },
            { label: "Urgent", value: urgent, color: "#f87171" },
            { label: "Ready / Dispatched", value: pendingDelivery, color: "#34d399" },
            { label: "Total Value", value: `₹${totalValue.toLocaleString()}`, color: "#a855f7" },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "3px", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{s.label}</span>
              <strong style={{ fontSize: "18px", color: s.color, fontFamily: "var(--font-mono)", fontWeight: 800, lineHeight: 1.2 }}>{s.value}</strong>
            </div>
          ))}
        </div>

        {/* Filters row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: "10px", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Icon name="search" size={13} color="var(--text-muted)" />
            </span>
            <input
              type="text"
              placeholder="Search by client, product, or order…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", height: "34px", paddingLeft: "32px", paddingRight: "12px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "12.5px", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{ height: "34px", padding: "0 10px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: statusFilter === "ALL" ? "var(--text-muted)" : "#fff", fontSize: "12px", cursor: "pointer" }}
          >
            <option value="ALL" style={{ backgroundColor: "#0f1420" }}>All Statuses</option>
            {(Object.keys(STATUS_META) as OrderStatus[]).map(s => (
              <option key={s} value={s} style={{ backgroundColor: "#0f1420" }}>{STATUS_META[s].label}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            style={{ height: "34px", padding: "0 10px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: priorityFilter === "ALL" ? "var(--text-muted)" : "#fff", fontSize: "12px", cursor: "pointer" }}
          >
            <option value="ALL" style={{ backgroundColor: "#0f1420" }}>All Priorities</option>
            {(["URGENT", "HIGH", "NORMAL", "LOW"] as OrderPriority[]).map(p => (
              <option key={p} value={p} style={{ backgroundColor: "#0f1420" }}>{PRIORITY_META[p].label}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ height: "34px", padding: "0 10px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: categoryFilter === "ALL" ? "var(--text-muted)" : "#fff", fontSize: "12px", cursor: "pointer" }}
          >
            {categories.map(c => (
              <option key={c} value={c} style={{ backgroundColor: "#0f1420" }}>{c === "ALL" ? "All Categories" : c}</option>
            ))}
          </select>

          {/* Result count */}
          <span style={{ fontSize: "11.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {filtered.length} of {total} orders
          </span>
        </div>
      </div>

      {/* ─── ORDERS TABLE ──────────────────────────────────────────────────── */}
      <div style={{ padding: "0 28px 28px 28px", flex: 1 }}>
        <div
          style={{
            backgroundColor: "rgba(19, 23, 34, 0.8)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "3px",
            overflow: "hidden",
            marginTop: "18px",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-muted)",
                  fontSize: "10.5px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                <th style={{ padding: "11px 18px", textAlign: "left", width: "108px" }}>Order</th>
                <th style={{ padding: "11px 16px", textAlign: "left" }}>Client</th>
                <th style={{ padding: "11px 16px", textAlign: "left" }}>Product</th>
                <th style={{ padding: "11px 12px", textAlign: "center", width: "90px" }}>Category</th>
                <th
                  style={{ padding: "11px 12px", textAlign: "center", width: "76px", cursor: "pointer", userSelect: "none" }}
                  onClick={() => toggleSort("qty")}
                >
                  Qty <SortIcon field="qty" />
                </th>
                <th
                  style={{ padding: "11px 14px", textAlign: "right", width: "106px", cursor: "pointer", userSelect: "none" }}
                  onClick={() => toggleSort("amount")}
                >
                  Amount <SortIcon field="amount" />
                </th>
                <th style={{ padding: "11px 12px", textAlign: "center", width: "68px" }}>Priority</th>
                <th style={{ padding: "11px 12px", textAlign: "center", width: "118px" }}>Status</th>
                <th
                  style={{ padding: "11px 14px", textAlign: "left", width: "106px", cursor: "pointer", userSelect: "none" }}
                  onClick={() => toggleSort("orderDate")}
                >
                  Order Date <SortIcon field="orderDate" />
                </th>
                <th
                  style={{ padding: "11px 14px", textAlign: "left", width: "106px", cursor: "pointer", userSelect: "none" }}
                  onClick={() => toggleSort("deliveryDate")}
                >
                  Delivery <SortIcon field="deliveryDate" />
                </th>
                <th style={{ padding: "11px 14px", textAlign: "left" }}>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                    No orders match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((order, idx) => {
                  const st = STATUS_META[order.status];
                  const pr = PRIORITY_META[order.priority];
                  const isUrgent = order.priority === "URGENT" && !["COMPLETED", "CANCELLED"].includes(order.status);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder?.(order.id)}
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                        cursor: "pointer",
                        transition: "background 0.12s",
                        borderLeft: isUrgent ? "3px solid #f87171" : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)")}
                    >
                      {/* Order ID */}
                      <td style={{ padding: "13px 18px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "11.5px", color: "var(--accent-text)" }}>
                          {order.id}
                        </span>
                      </td>

                      {/* Client */}
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          <strong style={{ color: "#fff", fontSize: "12.5px" }}>{order.client}</strong>
                          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{order.phone}</span>
                        </div>
                      </td>

                      {/* Product */}
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{order.product}</span>
                          {order.notes && (
                            <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontStyle: "italic" }}>{order.notes}</span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "13px 12px", textAlign: "center" }}>
                        <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 8px", borderRadius: "2px", backgroundColor: "rgba(168,85,247,0.12)", color: "#c084fc" }}>
                          {order.category}
                        </span>
                      </td>

                      {/* Qty */}
                      <td style={{ padding: "13px 12px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                        {order.qty.toLocaleString()}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: "13px 14px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#34d399", fontSize: "13px" }}>
                        ₹{order.amount.toLocaleString()}
                      </td>

                      {/* Priority */}
                      <td style={{ padding: "13px 12px", textAlign: "center" }}>
                        <span style={{ fontSize: "10.5px", fontWeight: 800, color: pr.color }}>
                          {order.priority === "URGENT" ? "⚡ " : ""}{pr.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "13px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "10.5px", fontWeight: 700, padding: "3px 9px", borderRadius: "2px",
                            backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {st.label}
                        </span>
                      </td>

                      {/* Order Date */}
                      <td style={{ padding: "13px 14px", fontSize: "11.5px", color: "var(--text-secondary)" }}>
                        {order.orderDate}
                      </td>

                      {/* Delivery Date */}
                      <td style={{ padding: "13px 14px", fontSize: "11.5px", color: order.status === "PENDING" || order.status === "IN_PRODUCTION" ? "#f59e0b" : "var(--text-secondary)", fontWeight: order.status === "PENDING" ? 700 : 400 }}>
                        {order.deliveryDate}
                      </td>

                      {/* Assigned To */}
                      <td style={{ padding: "13px 14px", fontSize: "11.5px", color: order.assignedTo === "Unassigned" ? "#f87171" : "var(--text-secondary)" }}>
                        {order.assignedTo}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Table Footer */}
          {filtered.length > 0 && (
            <div
              style={{
                padding: "10px 18px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                backgroundColor: "rgba(0,0,0,0.2)",
              }}
            >
              <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                Showing {filtered.length} orders · Total Value: <strong style={{ color: "#34d399", fontFamily: "var(--font-mono)" }}>₹{filtered.reduce((s, o) => s + o.amount, 0).toLocaleString()}</strong>
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Click any row to open order detail
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
