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

// ─── Small stat tile ──────────────────────────────────────────────────────────
const StatTile: React.FC<{ label: string; value: string; sub?: string; color?: string }> = ({
  label, value, sub, color = "#fff",
}) => (
  <div
    style={{
      backgroundColor: "rgba(19, 23, 34, 0.85)",
      backdropFilter: "blur(14px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "3px",
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    }}
  >
    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {label}
    </span>
    <strong style={{ fontSize: "22px", fontWeight: 800, color, fontFamily: "var(--font-mono)", lineHeight: 1 }}>
      {value}
    </strong>
    {sub && <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>{sub}</span>}
  </div>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface MplOrder {
  id: string;
  school: string;
  mplSpec: string;
  holderType: string;
  hookType: string;
  qtyGiven: number;
  qtyReturned: number;
  deliveryDate: string;
  status: "IN_PROGRESS" | "COMPLETED" | "PENDING";
}

interface StockItem {
  item: string;
  unit: string;
  lastGiven: number;
  used: number;
  remaining: number;
  recommend: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const LabourDetailProfileView: React.FC<LabourDetailProfileViewProps> = ({
  contractor,
  onBack,
}) => {
  const { success } = useToast();

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showEditContractModal, setShowEditContractModal] = useState(false);
  const [editStation, setEditStation] = useState(contractor.workstation);

  const [newSchool, setNewSchool] = useState("");
  const [newMplSpec, setNewMplSpec] = useState("12mm Double Color (Red/White)");
  const [newHolder, setNewHolder] = useState("Clear PVC Pouch");
  const [newHook, setNewHook] = useState("Silver Swivel J-Hook");
  const [newQty, setNewQty] = useState("500");
  const [newDelivery, setNewDelivery] = useState("");

  const [mplOrders, setMplOrders] = useState<MplOrder[]>([
    { id: "mpl-1", school: "Northwind Coffee", mplSpec: "12mm Double Color (Red/White)", holderType: "Clear PVC ID Pouch", hookType: "Silver Swivel J-Hook", qtyGiven: 1500, qtyReturned: 1500, deliveryDate: "02 Sep 2026", status: "COMPLETED" },
    { id: "mpl-2", school: "St. Xavier's High School", mplSpec: "15mm Triple Color (Blue/White/Red)", holderType: "Frosted Rigid ID Holder", hookType: "Black Lobster Claw Hook", qtyGiven: 1000, qtyReturned: 800, deliveryDate: "05 Sep 2026", status: "IN_PROGRESS" },
    { id: "mpl-3", school: "BHEL Township Admin", mplSpec: "10mm Single Color (Navy Blue)", holderType: "Vinyl Sleeve (Landscape)", hookType: "Silver Snap Hook", qtyGiven: 500, qtyReturned: 0, deliveryDate: "07 Sep 2026", status: "PENDING" },
  ]);

  const stockItems: StockItem[] = [
    { item: "MPL Ribbon Spool (10m roll)", unit: "Rolls", lastGiven: 25, used: 22, remaining: 3, recommend: 18 },
    { item: "Clear PVC ID Pouches", unit: "Pcs", lastGiven: 1500, used: 1500, remaining: 0, recommend: 1000 },
    { item: "Frosted Rigid ID Holders", unit: "Pcs", lastGiven: 600, used: 300, remaining: 300, recommend: 700 },
    { item: "Silver Swivel J-Hooks", unit: "Pcs", lastGiven: 1500, used: 1500, remaining: 0, recommend: 1000 },
    { item: "Black Lobster Claw Hooks", unit: "Pcs", lastGiven: 800, used: 500, remaining: 300, recommend: 700 },
    { item: "Silver Snap Hooks", unit: "Pcs", lastGiven: 600, used: 50, remaining: 550, recommend: 0 },
  ];

  const activeOrders = mplOrders.filter((o) => o.status !== "COMPLETED");
  const completedOrders = mplOrders.filter((o) => o.status === "COMPLETED");

  const weeklyGiven = mplOrders.reduce((s, o) => s + o.qtyGiven, 0);
  const weeklyDone = mplOrders.reduce((s, o) => s + o.qtyReturned, 0);
  const weeklyPending = weeklyGiven - weeklyDone;
  const completionRate = Math.round((weeklyDone / (weeklyGiven || 1)) * 100);

  const statusColor: Record<string, string> = { IN_PROGRESS: "#f59e0b", COMPLETED: "#10b981", PENDING: "#60a5fa" };
  const statusLabel: Record<string, string> = { IN_PROGRESS: "In Progress", COMPLETED: "Completed", PENDING: "Pending" };

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const o: MplOrder = { id: `mpl-${Date.now()}`, school: newSchool, mplSpec: newMplSpec, holderType: newHolder, hookType: newHook, qtyGiven: parseInt(newQty) || 500, qtyReturned: 0, deliveryDate: newDelivery, status: "PENDING" };
    setMplOrders([o, ...mplOrders]);
    setShowIssueModal(false);
    setNewSchool("");
    success("MPL Batch Issued", `${newQty} units issued to ${contractor.name} for ${newSchool}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>

      {/* ─── HEADER BAR ──────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "12px 24px",
          backgroundColor: "rgba(14, 18, 26, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, position: "sticky", top: 0, zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            type="button" onClick={onBack}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
          >
            <span>‹</span><span>Back to Contract Labour</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>
              Active MPL Assembly Orders
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "2px", backgroundColor: "rgba(168,85,247,0.15)", color: "#c084fc" }}>
              {activeOrders.length} Active Batches
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button variant="secondary" size="sm" style={{ borderRadius: "2px" }} onClick={() => setShowEditContractModal(true)}>Edit Station</Button>
          <Button variant="primary" size="sm" icon="plus" style={{ borderRadius: "2px", backgroundColor: "var(--accent)", border: "none" }} onClick={() => setShowIssueModal(true)}>Issue New MPL Batch</Button>
        </div>
      </div>

      {/* =========================================================================
          ACTIVE MPL ORDERS WORKSPACE
          ========================================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr 290px",
          gap: "18px",
          padding: "20px 24px",
          alignItems: "start",
        }}
      >
        {/* ── COL 1: Dossier ── */}
        <div
          style={{
            backgroundColor: "rgba(19, 23, 34, 0.85)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "3px",
            padding: "20px 16px",
            display: "flex", flexDirection: "column", alignItems: "center",
            textAlign: "center", gap: "12px",
          }}
        >
          <div
            style={{
              width: "64px", height: "64px", borderRadius: "3px",
              background: "linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(168,85,247,0.05) 100%)",
              border: "1px solid rgba(168,85,247,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "22px", fontWeight: 800, color: "#c084fc", fontFamily: "var(--font-mono)",
            }}
          >
            {contractor.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#fff", margin: 0 }}>{contractor.name}</h2>
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Contract Labour • MPL Assembly</span>
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
              { label: "Assigned Workstation", val: contractor.workstation, color: "#c084fc" },
              { label: "Shift Floor", val: "South Assembly Bay", color: "" },
              { label: "Phone", val: contractor.phone, mono: true },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px" }}>
                <span style={{ color: "var(--text-muted)" }}>{r.label}:</span>
                <strong style={{ color: r.color || "#fff", fontFamily: (r as any).mono ? "var(--font-mono)" : undefined }}>{r.val}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* ── COL 2: Orders (Active big cards + Completed compact table) ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Active / In-Progress header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>
              Current Orders
              <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "2px", backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                {activeOrders.length} Active
              </span>
            </span>
            <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>In Progress / Pending</span>
          </div>

          {/* Each active order — BIG featured card */}
          {activeOrders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.9)",
                backdropFilter: "blur(14px)",
                border: `1px solid ${order.status === "IN_PROGRESS" ? "rgba(245,158,11,0.3)" : "rgba(96,165,250,0.3)"}`,
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              {/* Strip header */}
              <div
                style={{
                  backgroundColor: order.status === "IN_PROGRESS" ? "rgba(245,158,11,0.08)" : "rgba(96,165,250,0.08)",
                  borderBottom: `1px solid ${order.status === "IN_PROGRESS" ? "rgba(245,158,11,0.2)" : "rgba(96,165,250,0.2)"}`,
                  padding: "10px 18px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <strong style={{ fontSize: "14px", color: "#fff" }}>{order.school}</strong>
                  <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 8px", borderRadius: "2px", backgroundColor: `${statusColor[order.status]}22`, color: statusColor[order.status], border: `1px solid ${statusColor[order.status]}44` }}>
                    {statusLabel[order.status]}
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Deliver by {order.deliveryDate}</span>
              </div>

              {/* Specs + Progress body */}
              <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "14px", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>MPL Spec</span>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#c084fc" }}>{order.mplSpec}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Holder</span>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{order.holderType}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Hook</span>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{order.hookType}</span>
                </div>
                {/* Progress */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", minWidth: "118px" }}>
                  <div style={{ display: "flex", gap: "5px", alignItems: "baseline" }}>
                    <strong style={{ fontSize: "20px", color: order.qtyReturned === order.qtyGiven ? "#10b981" : "#f59e0b", fontFamily: "var(--font-mono)" }}>
                      {order.qtyReturned.toLocaleString()}
                    </strong>
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>/ {order.qtyGiven.toLocaleString()} done</span>
                  </div>
                  <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "1px" }}>
                    <div style={{ height: "100%", borderRadius: "1px", width: `${Math.round((order.qtyReturned / order.qtyGiven) * 100)}%`, backgroundColor: order.qtyReturned === order.qtyGiven ? "#10b981" : "#f59e0b", transition: "width 0.4s ease" }} />
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{Math.round((order.qtyReturned / order.qtyGiven) * 100)}% complete</span>
                </div>
              </div>
            </div>
          ))}

          {/* Divider */}
          {completedOrders.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Past Orders — Completed
              </span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.07)" }} />
            </div>
          )}

          {/* Completed orders — compact table */}
          {completedOrders.length > 0 && (
            <div style={{ backgroundColor: "rgba(19, 23, 34, 0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>
                    <th style={{ padding: "8px 14px", textAlign: "left" }}>School</th>
                    <th style={{ padding: "8px 14px", textAlign: "left" }}>MPL Spec</th>
                    <th style={{ padding: "8px 14px", textAlign: "left" }}>Holder · Hook</th>
                    <th style={{ padding: "8px 14px", textAlign: "center" }}>Qty</th>
                    <th style={{ padding: "8px 14px", textAlign: "left" }}>Delivered</th>
                    <th style={{ padding: "8px 14px", textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrders.map((order) => (
                    <tr key={order.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 14px", color: "var(--text-secondary)", fontWeight: 600 }}>{order.school}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 6px", borderRadius: "2px", backgroundColor: "rgba(168,85,247,0.1)", color: "#a78bfa" }}>
                          {order.mplSpec}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "11px", color: "var(--text-muted)" }}>{order.holderType} · {order.hookType}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 700 }}>{order.qtyGiven.toLocaleString()}</td>
                      <td style={{ padding: "10px 14px", fontSize: "11px", color: "var(--text-muted)" }}>{order.deliveryDate}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "2px", backgroundColor: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── COL 3: Weekly Stats + Stock Ledger ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* 2×2 Stat tiles (Operational Metrics only — NO MONEY) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <StatTile label="Given" value={weeklyGiven.toLocaleString()} sub="MPL units" color="#fff" />
            <StatTile label="Done" value={weeklyDone.toLocaleString()} sub="Assembled" color="#10b981" />
            <StatTile label="Pending" value={weeklyPending.toLocaleString()} sub="On table" color={weeklyPending > 0 ? "#f59e0b" : "#10b981"} />
            <StatTile label="Rate" value={`${completionRate}%`} sub="Completion" color="#a855f7" />
          </div>

          {/* Stock Ledger */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "3px",
              padding: "14px 16px",
              display: "flex", flexDirection: "column", gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#fff" }}>Stock Ledger</span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Last Issue → Now</span>
            </div>

            {stockItems.map((s, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-secondary)" }}>{s.item}</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", fontSize: "10px" }}>
                  {[
                    { label: "Given", val: s.lastGiven, color: "#fff" },
                    { label: "Used", val: s.used, color: "#10b981" },
                    { label: "Left", val: s.remaining, color: s.remaining > 0 ? "#fbbf24" : "#f87171" },
                  ].map((cell) => (
                    <div key={cell.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "2px", padding: "3px 4px" }}>
                      <strong style={{ color: cell.color, fontFamily: "var(--font-mono)" }}>{cell.val}</strong>
                      <span style={{ color: "var(--text-muted)" }}>{cell.label}</span>
                    </div>
                  ))}
                </div>
                {s.recommend > 0 && (
                  <span style={{ fontSize: "10px", color: "#60a5fa" }}>→ Issue <strong>{s.recommend}</strong> {s.unit} next</span>
                )}
                {idx < stockItems.length - 1 && <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.04)", marginTop: "2px" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ISSUE MPL BATCH MODAL ──────────────────────────────────────────── */}
      {showIssueModal && (
        <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Issue New MPL Batch">
          <form onSubmit={handleAddOrder} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Input label="School / Client Name" placeholder="e.g. St. Xavier's High School" value={newSchool} onChange={(e) => setNewSchool(e.target.value)} required />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>MPL Specification</label>
              <select value={newMplSpec} onChange={(e) => setNewMplSpec(e.target.value)} style={{ height: "38px", padding: "0 10px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px" }}>
                {["10mm Single Color", "12mm Double Color (Red/White)", "12mm Double Color (Blue/White)", "15mm Triple Color (Blue/White/Red)", "15mm Triple Color (Custom)", "20mm Full Color Print"].map((v) => <option key={v} value={v} style={{ backgroundColor: "#131722" }}>{v}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Holder / ID Sleeve</label>
              <select value={newHolder} onChange={(e) => setNewHolder(e.target.value)} style={{ height: "38px", padding: "0 10px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px" }}>
                {["Clear PVC Pouch", "Frosted Rigid ID Holder", "Vinyl Sleeve (Landscape)", "Vinyl Sleeve (Portrait)", "None (Lanyard Only)"].map((v) => <option key={v} value={v} style={{ backgroundColor: "#131722" }}>{v}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Hook / Clip Type</label>
              <select value={newHook} onChange={(e) => setNewHook(e.target.value)} style={{ height: "38px", padding: "0 10px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px" }}>
                {["Silver Swivel J-Hook", "Black Lobster Claw Hook", "Silver Snap Hook", "Safety Breakaway Clip", "Thumb Trigger Hook"].map((v) => <option key={v} value={v} style={{ backgroundColor: "#131722" }}>{v}</option>)}
              </select>
            </div>
            <Input label="Quantity (MPL units)" type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} required />
            <Input label="Delivery Date" type="date" value={newDelivery} onChange={(e) => setNewDelivery(e.target.value)} required />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <Button variant="secondary" size="md" style={{ borderRadius: "2px" }} onClick={() => setShowIssueModal(false)}>Cancel</Button>
              <Button variant="primary" size="md" type="submit" style={{ borderRadius: "2px" }}>Issue Batch</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── EDIT TERMS MODAL ────────────────────────────────────────────────── */}
      {showEditContractModal && (
        <Modal isOpen={showEditContractModal} onClose={() => setShowEditContractModal(false)} title={`Edit Station: ${contractor.name}`}>
          <form onSubmit={(e) => { e.preventDefault(); setShowEditContractModal(false); success("Station Updated", `Workstation assigned to ${editStation}`); }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
