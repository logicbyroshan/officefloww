import React, { useState } from "react";
import { Icon } from "../../design-system/components/Icon";
import { Button } from "../../design-system/components/Button";
import { Modal } from "../../design-system/components/Modal";
import { Input } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";
import { LabourContractor } from "./LabourView";

export interface LabourDetailProfileViewProps {
  contractor: LabourContractor;
  onBack: () => void;
}

// ─── Weekly Big Stat Card ──────────────────────────────────────────────────────
const WeekStatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: string;
}> = ({ label, value, sub, color = "#fff" }) => (
  <div
    style={{
      flex: 1,
      backgroundColor: "rgba(19, 23, 34, 0.85)",
      backdropFilter: "blur(14px)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "3px",
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    }}
  >
    <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {label}
    </span>
    <strong style={{ fontSize: "26px", fontWeight: 800, color, fontFamily: "var(--font-mono)", lineHeight: 1 }}>
      {value}
    </strong>
    {sub && (
      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{sub}</span>
    )}
  </div>
);

// ─── MPL Order Row ─────────────────────────────────────────────────────────────
interface MplOrder {
  id: string;
  school: string;
  mplSpec: string;   // e.g. "12mm Double Color"
  holderType: string; // e.g. "Clear PVC Pouch"
  hookType: string;   // e.g. "Silver J-Hook"
  qtyGiven: number;
  qtyReturned: number;
  deliveryDate: string;
  status: "IN_PROGRESS" | "COMPLETED" | "PENDING";
}

// ─── Stock Ledger Row ──────────────────────────────────────────────────────────
interface StockItem {
  item: string;
  unit: string;
  lastGiven: number;
  used: number;
  remaining: number;
  recommend: number;
}

export const LabourDetailProfileView: React.FC<LabourDetailProfileViewProps> = ({
  contractor,
  onBack,
}) => {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<"orders" | "payroll">("orders");

  // Modals
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<"cash" | "upi" | "neft">("cash");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showEditContractModal, setShowEditContractModal] = useState(false);
  const [editRate, setEditRate] = useState(contractor.pieceRate.toString());
  const [editStation, setEditStation] = useState(contractor.workstation);

  // New batch issue form state
  const [newSchool, setNewSchool] = useState("");
  const [newMplSpec, setNewMplSpec] = useState("12mm Double Color");
  const [newHolder, setNewHolder] = useState("Clear PVC Pouch");
  const [newHook, setNewHook] = useState("Silver J-Hook");
  const [newQty, setNewQty] = useState("500");
  const [newDelivery, setNewDelivery] = useState("");

  // MPL Orders
  const [mplOrders, setMplOrders] = useState<MplOrder[]>([
    {
      id: "mpl-1",
      school: "Northwind Coffee",
      mplSpec: "12mm Double Color (Red/White)",
      holderType: "Clear PVC ID Pouch",
      hookType: "Silver Swivel J-Hook",
      qtyGiven: 1500,
      qtyReturned: 1500,
      deliveryDate: "02 Sep 2026",
      status: "COMPLETED",
    },
    {
      id: "mpl-2",
      school: "St. Xavier's High School",
      mplSpec: "15mm Triple Color (Blue/White/Red)",
      holderType: "Frosted Rigid ID Holder",
      hookType: "Black Lobster Claw Hook",
      qtyGiven: 1000,
      qtyReturned: 800,
      deliveryDate: "05 Sep 2026",
      status: "IN_PROGRESS",
    },
    {
      id: "mpl-3",
      school: "BHEL Township Admin",
      mplSpec: "10mm Single Color (Navy Blue)",
      holderType: "Vinyl Sleeve (Landscape)",
      hookType: "Silver Snap Hook",
      qtyGiven: 500,
      qtyReturned: 0,
      deliveryDate: "07 Sep 2026",
      status: "PENDING",
    },
  ]);

  // Stock Ledger
  const [stockItems] = useState<StockItem[]>([
    { item: "MPL Ribbon Spool (10m roll)", unit: "Rolls", lastGiven: 25, used: 22, remaining: 3, recommend: 18 },
    { item: "Clear PVC ID Pouches", unit: "Pcs", lastGiven: 1500, used: 1500, remaining: 0, recommend: 1000 },
    { item: "Frosted Rigid ID Holders", unit: "Pcs", lastGiven: 600, used: 300, remaining: 300, recommend: 700 },
    { item: "Silver Swivel J-Hooks", unit: "Pcs", lastGiven: 1500, used: 1500, remaining: 0, recommend: 1000 },
    { item: "Black Lobster Claw Hooks", unit: "Pcs", lastGiven: 800, used: 500, remaining: 300, recommend: 700 },
    { item: "Silver Snap Hooks", unit: "Pcs", lastGiven: 600, used: 50, remaining: 550, recommend: 0 },
  ]);

  // Payroll Records
  const [payoutRecords, setPayoutRecords] = useState([
    { id: "p-1", school: "Northwind Coffee", mpl: "12mm Double Color", qty: 1500, amount: 2250, date: "02 Sep 2026", mode: "Cash Voucher", status: "PAID" },
    { id: "p-2", school: "Govt Engg College", mpl: "15mm Triple Color", qty: 1000, amount: 1500, date: "28 Aug 2026", mode: "UPI Transfer", status: "PAID" },
    { id: "p-3", school: "AIIMS Bhopal", mpl: "10mm Single Color", qty: 800, amount: 1200, date: "24 Aug 2026", mode: "Cash Voucher", status: "PAID" },
  ]);

  // Totals for week
  const weeklyGiven = mplOrders.reduce((s, o) => s + o.qtyGiven, 0);
  const weeklyDone = mplOrders.reduce((s, o) => s + o.qtyReturned, 0);
  const weeklyPending = weeklyGiven - weeklyDone;
  const weeklyEarned = weeklyDone * contractor.pieceRate;

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrder: MplOrder = {
      id: `mpl-${Date.now()}`,
      school: newSchool,
      mplSpec: newMplSpec,
      holderType: newHolder,
      hookType: newHook,
      qtyGiven: parseInt(newQty) || 500,
      qtyReturned: 0,
      deliveryDate: newDelivery,
      status: "PENDING",
    };
    setMplOrders([newOrder, ...mplOrders]);
    setShowIssueModal(false);
    setNewSchool("");
    success("MPL Order Issued", `Issued ${newQty} MPL lanyards to ${contractor.name} for ${newSchool}`);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPayModal(false);
    const newRecord = {
      id: `p-${Date.now()}`,
      school: mplOrders.find(o => o.status === "IN_PROGRESS")?.school || "Batch",
      mpl: mplOrders.find(o => o.status === "IN_PROGRESS")?.mplSpec || "-",
      qty: weeklyDone,
      amount: weeklyEarned,
      date: "Today",
      mode: payMethod === "cash" ? "Cash Voucher" : payMethod === "upi" ? "UPI Transfer" : "Direct NEFT",
      status: "PAID",
    };
    setPayoutRecords([newRecord, ...payoutRecords]);
    success("Payroll Disbursed", `₹${weeklyEarned.toLocaleString()} paid to ${contractor.name}`);
  };

  const statusColor: Record<string, string> = {
    IN_PROGRESS: "#f59e0b",
    COMPLETED: "#10b981",
    PENDING: "#60a5fa",
  };
  const statusLabel: Record<string, string> = {
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    PENDING: "Pending",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>

      {/* ─── TOP HEADER ────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "12px 28px",
          backgroundColor: "rgba(14, 18, 26, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", borderRadius: "2px",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}
          >
            <span>‹</span><span>Back to Contract Labour</span>
          </button>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px" }}>
            {[
              { id: "orders" as const, label: "Active MPL Orders" },
              { id: "payroll" as const, label: "Payroll" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "7px 16px", borderRadius: "2px", border: "none",
                    backgroundColor: isActive ? "rgba(255, 138, 115, 0.15)" : "transparent",
                    color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
                    fontSize: "12.5px", fontWeight: isActive ? 700 : 500, cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button variant="secondary" size="sm" style={{ borderRadius: "2px" }} onClick={() => setShowEditContractModal(true)}>
            Edit Terms
          </Button>
          <Button
            variant="primary" size="sm" icon="plus"
            style={{ borderRadius: "2px", backgroundColor: "var(--accent)", border: "none" }}
            onClick={() => setShowIssueModal(true)}
          >
            Issue New MPL Batch
          </Button>
          <Button
            variant="primary" size="sm" icon="credit-card"
            style={{ borderRadius: "2px", backgroundColor: "#2563eb", border: "none" }}
            onClick={() => setShowPayModal(true)}
          >
            Pay ₹{weeklyEarned.toLocaleString()}
          </Button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: ACTIVE MPL ORDERS
          ========================================================================= */}
      {activeTab === "orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0", height: "100%" }}>

          {/* Left dossier + main content side by side */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "260px 1fr",
              gap: "20px",
              padding: "24px 28px",
              alignItems: "start",
            }}
          >
            {/* ── Column 1: Dossier ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Identity Card */}
              <div
                style={{
                  backgroundColor: "rgba(19, 23, 34, 0.85)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "3px",
                  padding: "20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "64px", height: "64px", borderRadius: "3px",
                    background: "linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.05) 100%)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "22px", fontWeight: 800, color: "#c084fc", fontFamily: "var(--font-mono)",
                  }}
                >
                  {contractor.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#fff", margin: 0 }}>
                    {contractor.name}
                  </h2>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    Contract Labour • MPL Assembly
                  </span>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "3px 7px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {contractor.id.toUpperCase()}
                  </span>
                  <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "3px 7px", borderRadius: "2px", backgroundColor: contractor.status === "ACTIVE" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: contractor.status === "ACTIVE" ? "#10b981" : "#f59e0b" }}>
                    {contractor.status === "ACTIVE" ? "● On Run" : "● Standby"}
                  </span>
                </div>

                <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px", textAlign: "left" }}>
                  {[
                    { label: "Piece Rate", val: `₹${contractor.pieceRate.toFixed(2)} / MPL`, color: "#34d399" },
                    { label: "Table", val: contractor.workstation },
                    { label: "Phone", val: contractor.phone },
                  ].map((r) => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px" }}>
                      <span style={{ color: "var(--text-muted)" }}>{r.label}:</span>
                      <strong style={{ color: (r as any).color || "#fff", fontFamily: r.label === "Phone" ? "var(--font-mono)" : undefined }}>{r.val}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock Ledger Mini Card */}
              <div
                style={{
                  backgroundColor: "rgba(19, 23, 34, 0.85)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "3px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#fff" }}>Stock Ledger</span>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Last Issue → Now</span>
                </div>

                {stockItems.map((s, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-secondary)" }}>{s.item}</span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", fontSize: "10px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "2px", padding: "3px 4px" }}>
                        <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>{s.lastGiven}</strong>
                        <span style={{ color: "var(--text-muted)" }}>Given</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "2px", padding: "3px 4px" }}>
                        <strong style={{ color: "#10b981", fontFamily: "var(--font-mono)" }}>{s.used}</strong>
                        <span style={{ color: "var(--text-muted)" }}>Used</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "2px", padding: "3px 4px" }}>
                        <strong style={{ color: s.remaining > 0 ? "#fbbf24" : "#f87171", fontFamily: "var(--font-mono)" }}>{s.remaining}</strong>
                        <span style={{ color: "var(--text-muted)" }}>Left</span>
                      </div>
                    </div>
                    {s.recommend > 0 && (
                      <span style={{ fontSize: "10px", color: "#60a5fa" }}>
                        → Issue <strong>{s.recommend}</strong> {s.unit} next
                      </span>
                    )}
                    {idx < stockItems.length - 1 && (
                      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.04)", marginTop: "2px" }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Column 2: Weekly Stats + Active MPL Table ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

              {/* Active MPL Orders Table — ABOVE stats */}
              <div
                style={{
                  backgroundColor: "rgba(19, 23, 34, 0.85)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "3px",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>
                      Active MPL Assembly Orders
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Multicolor Printed Lanyards — current queue given to this contractor
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "2px",
                      backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#c084fc",
                    }}
                  >
                    {mplOrders.length} Orders
                  </span>
                </div>

                {/* Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "rgba(0,0,0,0.25)",
                        color: "var(--text-muted)",
                        fontSize: "10.5px",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      <th style={{ padding: "10px 16px", textAlign: "left" }}>School / Client</th>
                      <th style={{ padding: "10px 16px", textAlign: "left" }}>MPL Spec</th>
                      <th style={{ padding: "10px 16px", textAlign: "left" }}>Holder</th>
                      <th style={{ padding: "10px 16px", textAlign: "left" }}>Hook</th>
                      <th style={{ padding: "10px 16px", textAlign: "center" }}>Qty Given</th>
                      <th style={{ padding: "10px 16px", textAlign: "center" }}>Returned</th>
                      <th style={{ padding: "10px 16px", textAlign: "left" }}>Delivery</th>
                      <th style={{ padding: "10px 16px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mplOrders.map((order, idx) => (
                      <tr
                        key={order.id}
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                          backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                        }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <strong style={{ color: "#fff" }}>{order.school}</strong>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "2px",
                              backgroundColor: "rgba(168, 85, 247, 0.12)",
                              color: "#c084fc",
                            }}
                          >
                            {order.mplSpec}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "11.5px" }}>
                          {order.holderType}
                        </td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "11.5px" }}>
                          {order.hookType}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                          {order.qtyGiven.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, color: order.qtyReturned === order.qtyGiven ? "#10b981" : "#f59e0b" }}>
                          {order.qtyReturned.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "11.5px" }}>
                          {order.deliveryDate}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "2px",
                              backgroundColor: `${statusColor[order.status]}22`,
                              color: statusColor[order.status],
                              border: `1px solid ${statusColor[order.status]}44`,
                            }}
                          >
                            {statusLabel[order.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Weekly Stat Cards — BELOW the table */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                <WeekStatCard label="This Week — Given" value={weeklyGiven.toLocaleString()} sub="MPL units handed" color="#fff" />
                <WeekStatCard label="This Week — Done" value={weeklyDone.toLocaleString()} sub="Assembled & returned" color="#10b981" />
                <WeekStatCard label="Pending Assembly" value={weeklyPending.toLocaleString()} sub="Still on table" color={weeklyPending > 0 ? "#f59e0b" : "#10b981"} />
                <WeekStatCard label="Payable This Week" value={`₹${weeklyEarned.toLocaleString()}`} sub={`@ ₹${contractor.pieceRate}/MPL`} color="#a855f7" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PAYROLL
          ========================================================================= */}
      {activeTab === "payroll" && (
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "22px", width: "100%", boxSizing: "border-box" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#fff", margin: 0 }}>Payroll — MPL Piece-Rate</h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Pay is calculated based on lanyards given and assembled. Rate: ₹{contractor.pieceRate.toFixed(2)} per MPL.
              </span>
            </div>
            <Button
              variant="primary" size="sm" icon="credit-card"
              style={{ borderRadius: "2px", backgroundColor: "#2563eb", border: "none" }}
              onClick={() => setShowPayModal(true)}
            >
              Pay Now (₹{weeklyEarned.toLocaleString()})
            </Button>
          </div>

          {/* Pay Calculation Card */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "14px",
            }}
          >
            {/* Calculation breakdown */}
            <div
              style={{
                gridColumn: "1 / 3",
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Current Pay Calculation</span>

              {/* Per-order breakdown */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", color: "var(--text-muted)", fontSize: "10.5px", textTransform: "uppercase" }}>
                    <th style={{ padding: "8px 0", textAlign: "left" }}>School / Order</th>
                    <th style={{ padding: "8px 0", textAlign: "center" }}>Given</th>
                    <th style={{ padding: "8px 0", textAlign: "center" }}>Assembled</th>
                    <th style={{ padding: "8px 0", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {mplOrders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 0", color: "#fff", fontWeight: 600 }}>{o.school}</td>
                      <td style={{ padding: "10px 0", textAlign: "center", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{o.qtyGiven}</td>
                      <td style={{ padding: "10px 0", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, color: o.qtyReturned === o.qtyGiven ? "#10b981" : "#f59e0b" }}>{o.qtyReturned}</td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#a855f7" }}>
                        ₹{(o.qtyReturned * contractor.pieceRate).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)" }}>
                    <td colSpan={3} style={{ padding: "12px 0", fontWeight: 800, color: "#fff" }}>Total Payable</td>
                    <td style={{ padding: "12px 0", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "17px", color: "#34d399" }}>
                      ₹{weeklyEarned.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pay Now Card */}
            <div
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Pending Payout</span>
                <strong style={{ fontSize: "28px", color: "#34d399", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                  ₹{weeklyEarned.toLocaleString()}
                </strong>
                <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                  {weeklyDone} MPL × ₹{contractor.pieceRate}/pc
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                style={{
                  height: "38px",
                  borderRadius: "2px",
                  backgroundColor: "#2563eb",
                  backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  border: "none",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Pay Now →
              </button>
            </div>
          </div>

          {/* Payroll History Table */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Payment History</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "var(--text-muted)", fontSize: "10.5px", textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 20px" }}>School / Batch</th>
                  <th style={{ padding: "10px 20px" }}>MPL Type</th>
                  <th style={{ padding: "10px 20px", textAlign: "center" }}>Qty Paid</th>
                  <th style={{ padding: "10px 20px" }}>Amount</th>
                  <th style={{ padding: "10px 20px" }}>Date</th>
                  <th style={{ padding: "10px 20px" }}>Mode</th>
                  <th style={{ padding: "10px 20px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payoutRecords.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px 20px", fontWeight: 700, color: "#fff" }}>{p.school}</td>
                    <td style={{ padding: "12px 20px", color: "var(--text-secondary)", fontSize: "11.5px" }}>{p.mpl}</td>
                    <td style={{ padding: "12px 20px", textAlign: "center", fontFamily: "var(--font-mono)" }}>{p.qty} pcs</td>
                    <td style={{ padding: "12px 20px", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#34d399" }}>₹{p.amount.toLocaleString()}</td>
                    <td style={{ padding: "12px 20px", color: "var(--text-secondary)" }}>{p.date}</td>
                    <td style={{ padding: "12px 20px", color: "var(--text-secondary)" }}>{p.mode}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "2px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── PAY MODAL ──────────────────────────────────────────────────────────── */}
      {showPayModal && (
        <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title={`Pay Labour: ${contractor.name}`}>
          <form onSubmit={handlePay} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "2px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Total Payable ({weeklyDone} MPL × ₹{contractor.pieceRate}):</span>
              <strong style={{ fontSize: "22px", color: "#34d399", fontFamily: "var(--font-mono)" }}>₹{weeklyEarned.toLocaleString("en-IN")}</strong>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Disbursement Method</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {[
                  { id: "cash" as const, label: "Plant Cash Voucher" },
                  { id: "upi" as const, label: "Instant UPI" },
                  { id: "neft" as const, label: "Bank Transfer" },
                ].map((m) => (
                  <button
                    key={m.id} type="button" onClick={() => setPayMethod(m.id)}
                    style={{
                      padding: "8px", borderRadius: "2px",
                      border: "1px solid " + (payMethod === m.id ? "var(--accent-border)" : "rgba(255,255,255,0.1)"),
                      backgroundColor: payMethod === m.id ? "rgba(255, 138, 115, 0.15)" : "transparent",
                      color: payMethod === m.id ? "var(--accent-text)" : "var(--text-secondary)",
                      fontSize: "11.5px", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button variant="secondary" size="md" style={{ borderRadius: "2px" }} onClick={() => setShowPayModal(false)}>Cancel</Button>
              <Button variant="primary" size="md" type="submit" style={{ borderRadius: "2px" }}>
                Confirm & Pay ₹{weeklyEarned.toLocaleString()}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── ISSUE NEW MPL BATCH MODAL ─────────────────────────────────────────── */}
      {showIssueModal && (
        <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Issue New MPL Batch to Contractor">
          <form onSubmit={handleAddOrder} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Input label="School / Client Name" placeholder="e.g. St. Xavier's High School" value={newSchool} onChange={(e) => setNewSchool(e.target.value)} required />

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>MPL Specification</label>
              <select
                value={newMplSpec}
                onChange={(e) => setNewMplSpec(e.target.value)}
                style={{ height: "38px", padding: "0 10px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px" }}
              >
                <option style={{ backgroundColor: "#131722" }} value="10mm Single Color">10mm Single Color</option>
                <option style={{ backgroundColor: "#131722" }} value="12mm Double Color (Red/White)">12mm Double Color (Red/White)</option>
                <option style={{ backgroundColor: "#131722" }} value="12mm Double Color (Blue/White)">12mm Double Color (Blue/White)</option>
                <option style={{ backgroundColor: "#131722" }} value="15mm Triple Color (Blue/White/Red)">15mm Triple Color (Blue/White/Red)</option>
                <option style={{ backgroundColor: "#131722" }} value="15mm Triple Color (Custom)">15mm Triple Color (Custom)</option>
                <option style={{ backgroundColor: "#131722" }} value="20mm Full Color Print">20mm Full Color Print</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Holder / ID Card Sleeve Type</label>
              <select
                value={newHolder}
                onChange={(e) => setNewHolder(e.target.value)}
                style={{ height: "38px", padding: "0 10px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px" }}
              >
                <option style={{ backgroundColor: "#131722" }} value="Clear PVC Pouch">Clear PVC Pouch</option>
                <option style={{ backgroundColor: "#131722" }} value="Frosted Rigid ID Holder">Frosted Rigid ID Holder</option>
                <option style={{ backgroundColor: "#131722" }} value="Vinyl Sleeve (Landscape)">Vinyl Sleeve (Landscape)</option>
                <option style={{ backgroundColor: "#131722" }} value="Vinyl Sleeve (Portrait)">Vinyl Sleeve (Portrait)</option>
                <option style={{ backgroundColor: "#131722" }} value="None (Lanyard Only)">None (Lanyard Only)</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Hook / Clip Type</label>
              <select
                value={newHook}
                onChange={(e) => setNewHook(e.target.value)}
                style={{ height: "38px", padding: "0 10px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px" }}
              >
                <option style={{ backgroundColor: "#131722" }} value="Silver Swivel J-Hook">Silver Swivel J-Hook</option>
                <option style={{ backgroundColor: "#131722" }} value="Black Lobster Claw Hook">Black Lobster Claw Hook</option>
                <option style={{ backgroundColor: "#131722" }} value="Silver Snap Hook">Silver Snap Hook</option>
                <option style={{ backgroundColor: "#131722" }} value="Safety Breakaway Clip">Safety Breakaway Clip</option>
                <option style={{ backgroundColor: "#131722" }} value="Thumb Trigger Hook">Thumb Trigger Hook</option>
              </select>
            </div>

            <Input label="Quantity to Issue (MPL units)" type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} required />
            <Input label="Delivery Date" type="date" value={newDelivery} onChange={(e) => setNewDelivery(e.target.value)} required />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <Button variant="secondary" size="md" style={{ borderRadius: "2px" }} onClick={() => setShowIssueModal(false)}>Cancel</Button>
              <Button variant="primary" size="md" type="submit" style={{ borderRadius: "2px" }}>Issue Batch & Stock</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── EDIT CONTRACT TERMS MODAL ─────────────────────────────────────────── */}
      {showEditContractModal && (
        <Modal isOpen={showEditContractModal} onClose={() => setShowEditContractModal(false)} title={`Edit Terms: ${contractor.name}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowEditContractModal(false);
              success("Contract Updated", `Updated piece-rate to ₹${editRate}/MPL for ${contractor.name}`);
            }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <Input label="Piece Rate (₹ per MPL assembled)" value={editRate} onChange={(e) => setEditRate(e.target.value)} required />
            <Input label="Assigned Table / Workstation" value={editStation} onChange={(e) => setEditStation(e.target.value)} required />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <Button variant="secondary" size="md" style={{ borderRadius: "2px" }} onClick={() => setShowEditContractModal(false)}>Cancel</Button>
              <Button variant="primary" size="md" type="submit" style={{ borderRadius: "2px" }}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
