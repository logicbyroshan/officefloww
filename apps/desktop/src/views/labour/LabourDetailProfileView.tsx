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

/** Circular Ring Gauge with sharp container */
const CircularProgressRing: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  sublabel: string;
}> = ({ percentage, size = 62, strokeWidth = 6, color = "#10b981", label, sublabel }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(percentage, 5), 100) / 100) * circumference;

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "rgba(19, 23, 34, 0.8)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "3px",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center" }}>
        {label}
      </span>

      <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="square"
            fill="none"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>

        <div style={{ position: "absolute", textAlign: "center", lineHeight: 1 }}>
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>
            {sublabel.split(" ")[0]}
          </span>
          <div style={{ fontSize: "8.5px", color: "var(--text-muted)", marginTop: "2px" }}>
            {sublabel.split(" ").slice(1).join(" ") || ""}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LabourDetailProfileView: React.FC<LabourDetailProfileViewProps> = ({
  contractor,
  onBack,
}) => {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "batches" | "settlement">("overview");

  // Modals
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<"cash" | "upi" | "neft">("cash");
  const [showEditContractModal, setShowEditContractModal] = useState(false);
  const [editRate, setEditRate] = useState(contractor.pieceRate.toString());
  const [editStation, setEditStation] = useState(contractor.workstation);

  // Settlement history
  const [payoutRecords, setPayoutRecords] = useState([
    { id: "p-1", batch: "Batch #LN-401 (Northwind)", units: 1500, amount: 2250, date: "02 Sep 2026", mode: "Cash Voucher", status: "DISBURSED" },
    { id: "p-2", batch: "Batch #LN-398 (Govt Engg)", units: 1000, amount: 1500, date: "28 Aug 2026", mode: "UPI Transfer", status: "DISBURSED" },
    { id: "p-3", batch: "Batch #LN-394 (BHEL Badges)", units: 800, amount: 1200, date: "24 Aug 2026", mode: "Cash Voucher", status: "DISBURSED" },
  ]);

  const handleDisbursePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPayModal(false);
    const newRecord = {
      id: `p-${Date.now()}`,
      batch: contractor.activeTask,
      units: contractor.assembledReturned,
      amount: contractor.amountDue,
      date: "Today (Instant)",
      mode: payMethod === "cash" ? "Cash Voucher" : payMethod === "upi" ? "UPI Transfer" : "Direct NEFT",
      status: "DISBURSED",
    };
    setPayoutRecords([newRecord, ...payoutRecords]);
    success("Labour Settlement Disbursed", `₹${contractor.amountDue.toLocaleString()} paid to ${contractor.name} via ${newRecord.mode}.`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Top Header Bar */}
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
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "2px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>‹</span>
            <span>Back to Contract Labour</span>
          </button>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {[
              { id: "overview" as const, label: "Material & Assembly Ledger", icon: "package" as const },
              { id: "batches" as const, label: "Assigned Batches (Kanban)", icon: "tasks" as const, count: contractor.batches.length },
              { id: "settlement" as const, label: "Piece-Rate Settlements", icon: "billing" as const },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "2px",
                    border: "none",
                    backgroundColor: isActive ? "rgba(255, 138, 115, 0.15)" : "transparent",
                    color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
                    fontSize: "12.5px",
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  <Icon name={tab.icon} size={13} color={isActive ? "var(--accent-text)" : "currentColor"} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: "2px",
                        backgroundColor: isActive ? "rgba(255, 138, 115, 0.25)" : "rgba(255, 255, 255, 0.08)",
                        color: isActive ? "var(--accent-text)" : "var(--text-muted)",
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            variant="secondary"
            size="sm"
            style={{ borderRadius: "2px" }}
            onClick={() => setShowEditContractModal(true)}
          >
            Edit Contract Terms
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon="credit-card"
            style={{
              borderRadius: "2px",
              backgroundColor: "#2563eb",
              backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
            }}
            onClick={() => setShowPayModal(true)}
          >
            Settle ₹{contractor.amountDue.toLocaleString()}
          </Button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MATERIAL & ASSEMBLY LEDGER
          ========================================================================= */}
      {activeTab === "overview" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr 300px",
            gap: "20px",
            padding: "24px 28px",
            alignItems: "start",
          }}
        >
          {/* Column 1: Dossier */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
                padding: "22px 18px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "74px",
                  height: "74px",
                  borderRadius: "3px",
                  background: "linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.05) 100%)",
                  border: "1px solid rgba(168, 85, 247, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#c084fc",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {contractor.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#fff", margin: 0 }}>
                  {contractor.name}
                </h2>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Contract Labour • Piece-Rate
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-mono)", padding: "3px 8px", borderRadius: "2px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "var(--text-secondary)" }}>
                  {contractor.id.toUpperCase()}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "2px", backgroundColor: contractor.status === "ACTIVE" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)", color: contractor.status === "ACTIVE" ? "#10b981" : "#f59e0b" }}>
                  {contractor.status === "ACTIVE" ? "● On Assembly Run" : "● Standby"}
                </span>
              </div>

              <div style={{ width: "100%", borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Hiring Basis:</span>
                  <strong style={{ color: "#fff" }}>Task / Order Based</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Agreed Piece Rate:</span>
                  <strong style={{ color: "#34d399", fontFamily: "var(--font-mono)" }}>₹{contractor.pieceRate.toFixed(2)} / unit</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Assigned Table:</span>
                  <strong style={{ color: "var(--text-secondary)" }}>{contractor.workstation}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Direct Contact:</span>
                  <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>{contractor.phone}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: 4 Custom Stat Cards & Lanyard Material Ledger */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* 4 Labour Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              <CircularProgressRing
                percentage={100}
                color="#f59e0b"
                label="Lanyards Given"
                sublabel={`${contractor.lanyardsGiven.toLocaleString()} Issued`}
              />
              <CircularProgressRing
                percentage={Math.round((contractor.assembledReturned / contractor.lanyardsGiven) * 100)}
                color="#10b981"
                label="Assembled & Done"
                sublabel={`${contractor.assembledReturned.toLocaleString()} Returned`}
              />
              <CircularProgressRing
                percentage={Math.round((contractor.pendingAssembly / contractor.lanyardsGiven) * 100)}
                color="#38bdf8"
                label="Pending on Table"
                sublabel={`${contractor.pendingAssembly.toLocaleString()} In Queue`}
              />
              <CircularProgressRing
                percentage={92}
                color="#a855f7"
                label="Balance Payable"
                sublabel={`₹${contractor.amountDue.toLocaleString()} Due`}
              />
            </div>

            {/* Material Ledger Card */}
            <div
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon name="package" size={16} color="var(--accent-text)" />
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "#fff", letterSpacing: "-0.2px" }}>
                      Lanyard Assembly Material Ledger & Floor Batch Tracking
                    </span>
                  </div>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    Raw components issued to labour contractor vs finished lanyards returned
                  </span>
                </div>
                <span style={{ fontSize: "11.5px", fontWeight: 700, padding: "3px 8px", borderRadius: "2px", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#34d399" }}>
                  ● Material Balance Verified
                </span>
              </div>

              {/* Material stats strip */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "10px",
                  backgroundColor: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "3px",
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Satin Ribbon Spools Given
                  </span>
                  <strong style={{ fontSize: "18px", color: "#fff", fontFamily: "var(--font-mono)" }}>
                    {contractor.lanyardsGiven.toLocaleString()}m
                  </strong>
                  <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>Cut to 90cm standard</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "10px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Hardware Clasps Issued
                  </span>
                  <strong style={{ fontSize: "18px", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
                    {contractor.lanyardsGiven.toLocaleString()} pcs
                  </strong>
                  <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>Silver nickel dog hooks</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "10px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Assembled & QA Inspected
                  </span>
                  <strong style={{ fontSize: "18px", color: "#10b981", fontFamily: "var(--font-mono)" }}>
                    {contractor.assembledReturned.toLocaleString()} done
                  </strong>
                  <span style={{ fontSize: "10.5px", color: "#10b981" }}>{contractor.pendingAssembly} pending</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "10px" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Piece-Rate Accrual
                  </span>
                  <strong style={{ fontSize: "18px", color: "#a855f7", fontFamily: "var(--font-mono)" }}>
                    ₹{contractor.amountDue.toLocaleString()}
                  </strong>
                  <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>@ ₹{contractor.pieceRate.toFixed(2)}/unit</span>
                </div>
              </div>

              {/* Handover Batches List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Active Lanyard Assembly Batches Handed Over
                </span>

                {contractor.batches.map((b, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "2px",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>{b.batchNumber}</span>
                      <span style={{ color: "var(--text-secondary)" }}>{b.clientName}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>• Issued: <strong>{b.quantityGiven} units</strong></span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: b.status === "COMPLETED" ? "#10b981" : "#f59e0b" }}>
                        {b.quantityReturned} Done
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "2px",
                          backgroundColor: b.status === "COMPLETED" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.15)",
                          color: b.status === "COMPLETED" ? "#10b981" : "#f59e0b",
                        }}
                      >
                        {b.status === "COMPLETED" ? "COMPLETED & VERIFIED" : "IN ASSEMBLY QUEUE"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Quick Settlement Card */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                Current Piece-Rate Accrual
              </span>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Units Done & Returned:</span>
                  <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>{contractor.assembledReturned} Units</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Agreed Piece Rate:</span>
                  <strong style={{ color: "#38bdf8", fontFamily: "var(--font-mono)" }}>₹{contractor.pieceRate.toFixed(2)}/pc</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#34d399" }}>
                  <span>Gross Payable:</span>
                  <strong style={{ fontFamily: "var(--font-mono)" }}>₹{contractor.amountDue.toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "8px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#fff" }}>Pending Payout:</span>
                <strong style={{ fontSize: "16px", color: "#34d399", fontFamily: "var(--font-mono)" }}>
                  ₹{contractor.amountDue.toLocaleString()}
                </strong>
              </div>

              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                style={{
                  marginTop: "4px",
                  height: "32px",
                  borderRadius: "2px",
                  backgroundColor: "#2563eb",
                  border: "none",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Disburse Cash / UPI Payout →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: KANBAN BATCHES TAB
          ========================================================================= */}
      {activeTab === "batches" && (
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "18px", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#fff", margin: 0 }}>
              Assigned Lanyard Batches (Kanban)
            </h2>
            <Button
              variant="secondary"
              size="sm"
              icon="plus"
              style={{ borderRadius: "2px" }}
              onClick={() => success("Batch Allocated", `Issued 500 new lanyards to ${contractor.name}`)}
            >
              Issue New Batch
            </Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {/* Column 1: Allocated */}
            <div style={{ backgroundColor: "rgba(18, 23, 35, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "3px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "400px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "6px" }}>
                <strong style={{ fontSize: "12.5px", color: "#60a5fa" }}>Allocated to Table (1)</strong>
              </div>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "2px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--accent-text)", fontWeight: 700 }}>Govt Engineering College</span>
                <strong style={{ fontSize: "13px", color: "#fff" }}>500 Satin Lanyards Ring Crimping</strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Target: 500 pcs • Due: Today</span>
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div style={{ backgroundColor: "rgba(18, 23, 35, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "3px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "400px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "6px" }}>
                <strong style={{ fontSize: "12.5px", color: "#f59e0b" }}>In Assembly Run (1)</strong>
              </div>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "2px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--accent-text)", fontWeight: 700 }}>Northwind Coffee</span>
                <strong style={{ fontSize: "13px", color: "#fff" }}>1,500 Satin Lanyards Assembly</strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>1,500 Completed • Staged for QA</span>
              </div>
            </div>

            {/* Column 3: Completed & Verified */}
            <div style={{ backgroundColor: "rgba(18, 23, 35, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "3px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "400px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "6px" }}>
                <strong style={{ fontSize: "12.5px", color: "#10b981" }}>Completed & Staged (2)</strong>
              </div>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "2px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--accent-text)", fontWeight: 700 }}>BHEL Township</span>
                <strong style={{ fontSize: "13px", color: "#fff" }}>500 Lanyards Boxing & Quality Signoff</strong>
                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>✓ Verified Zero Waste</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SETTLEMENTS TAB
          ========================================================================= */}
      {activeTab === "settlement" && (
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#fff", margin: 0 }}>
                Piece-Rate Settlement Ledger
              </h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Task-based cash vouchers and instant UPI payouts
              </span>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon="credit-card"
              style={{ borderRadius: "2px", backgroundColor: "#2563eb" }}
              onClick={() => setShowPayModal(true)}
            >
              Disburse Settlement (₹{contractor.amountDue.toLocaleString()})
            </Button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left", backgroundColor: "rgba(18, 23, 35, 0.75)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "3px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 20px" }}>Batch Order</th>
                <th style={{ padding: "14px 20px" }}>Units Done</th>
                <th style={{ padding: "14px 20px" }}>Payout Amount</th>
                <th style={{ padding: "14px 20px" }}>Date</th>
                <th style={{ padding: "14px 20px" }}>Payment Mode</th>
                <th style={{ padding: "14px 20px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payoutRecords.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 700, color: "#fff" }}>{p.batch}</td>
                  <td style={{ padding: "14px 20px", fontFamily: "var(--font-mono)" }}>{p.units} pcs</td>
                  <td style={{ padding: "14px 20px", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#34d399" }}>₹{p.amount.toLocaleString()}</td>
                  <td style={{ padding: "14px 20px", color: "var(--text-secondary)" }}>{p.date}</td>
                  <td style={{ padding: "14px 20px", color: "var(--text-secondary)" }}>{p.mode}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "2px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Settlement Modal */}
      {showPayModal && (
        <Modal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          title={`Settle Piece-Rate: ${contractor.name}`}
        >
          <form onSubmit={handleDisbursePayment} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "2px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Total Piece-Rate Accrual:</span>
              <strong style={{ fontSize: "20px", color: "#34d399", fontFamily: "var(--font-mono)" }}>
                ₹{contractor.amountDue.toLocaleString("en-IN")}
              </strong>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Disbursement Method</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {[
                  { id: "cash" as const, label: "Plant Cash Voucher" },
                  { id: "upi" as const, label: "Instant UPI Payout" },
                  { id: "neft" as const, label: "Direct Bank Transfer" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayMethod(m.id)}
                    style={{
                      padding: "8px",
                      borderRadius: "2px",
                      border: "1px solid " + (payMethod === m.id ? "var(--accent-border)" : "rgba(255,255,255,0.1)"),
                      backgroundColor: payMethod === m.id ? "rgba(255, 138, 115, 0.15)" : "transparent",
                      color: payMethod === m.id ? "var(--accent-text)" : "var(--text-secondary)",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <Button variant="secondary" size="md" style={{ borderRadius: "2px" }} onClick={() => setShowPayModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" style={{ borderRadius: "2px" }}>
                Confirm & Disburse ₹{contractor.amountDue.toLocaleString()}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Contract Terms Modal */}
      {showEditContractModal && (
        <Modal
          isOpen={showEditContractModal}
          onClose={() => setShowEditContractModal(false)}
          title={`Edit Contract Terms: ${contractor.name}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowEditContractModal(false);
              success("Contract Updated", `Updated piece-rate to ₹${editRate}/unit for ${contractor.name}`);
            }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <Input
              label="Piece Rate (₹ per unit assembled)"
              value={editRate}
              onChange={(e) => setEditRate(e.target.value)}
              required
            />
            <Input
              label="Assigned Table / Workstation"
              value={editStation}
              onChange={(e) => setEditStation(e.target.value)}
              required
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <Button variant="secondary" size="md" style={{ borderRadius: "2px" }} onClick={() => setShowEditContractModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" style={{ borderRadius: "2px" }}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
