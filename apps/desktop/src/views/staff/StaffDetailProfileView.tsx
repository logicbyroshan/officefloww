import React, { useState } from "react";
import { StaffMember } from "./StaffView";
import { Icon } from "../../design-system/components/Icon";
import { Button } from "../../design-system/components/Button";
import { Modal } from "../../design-system/components/Modal";
import { Input } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";

export interface StaffDetailProfileViewProps {
  staff: StaffMember;
  onBack: () => void;
}

interface KanbanTask {
  id: string;
  title: string;
  client: string;
  quantity: string;
  priority: "HIGH" | "MEDIUM" | "URGENT";
  column: "todo" | "in_progress" | "qa" | "done";
  assignedStation: string;
  dueTime: string;
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

export const StaffDetailProfileView: React.FC<StaffDetailProfileViewProps> = ({
  staff,
  onBack,
}) => {
  const { success } = useToast();

  // Top header tab: Overview | Tasks (Kanban)
  const [activeProfileTab, setActiveProfileTab] = useState<"overview" | "tasks">("overview");

  // Modals
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editPhone, setEditPhone] = useState(staff.phone || "+91 98200 11002");
  const [editEmail, setEditEmail] = useState(staff.email);

  // Calcs
  const staffCode = `EMP-${staff.id.replace("staff-", "00").replace("lab-", "90")}`;
  const isAvailable = staff.availability === "Available";
  const isLabour = staff.type === "LABOUR";
  const isWorker = staff.type === "EMPLOYEE" && staff.role === "WORKER";
  const isDesktop = staff.type === "EMPLOYEE" && (staff.role === "ADMIN" || staff.role === "OPERATOR");

  // Days of current month for attendance widget
  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);


  // Kanban Tasks for this staff member
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([
    {
      id: "task-1",
      title: isLabour
        ? "Assemble & Crimp 500 Satin Lanyards (Govt Engg College)"
        : isWorker
        ? "Thermal Ribbon Offset Printing for 1,200 ID Cards"
        : "RFID Smartcard Despatch Batch QA & Crypto Key Encoding",
      client: "Govt Engineering College",
      quantity: isLabour ? "500 Lanyards" : isWorker ? "1,200 Units" : "5,000 Cards",
      priority: "URGENT",
      column: "todo",
      assignedStation: isLabour ? "Stitching Table 02" : isWorker ? "Thermal Press Line" : "Admin PC-01",
      dueTime: "Today, 04:30 PM",
    },
    {
      id: "task-2",
      title: isLabour
        ? "Stitch Satin Lanyards & Dog Hook Buckles (Northwind Coffee)"
        : isWorker
        ? "Heat Transfer Sublimation Press Run 2 (Multicolor Ribbons)"
        : "Process Artwork Proofing & Variable Barcode Numbering Merge",
      client: "Northwind Coffee",
      quantity: isLabour ? "1,500 Lanyards" : isWorker ? "800 Units" : "1,500 Lanyards",
      priority: "HIGH",
      column: "in_progress",
      assignedStation: isLabour ? "Crimping Station" : isWorker ? "Sublimation Press #1" : "Illustrator Studio",
      dueTime: "Today, 06:00 PM",
    },
    {
      id: "task-3",
      title: isLabour
        ? "Safety Breakaway Clip Pull-Force Inspection & Bundling"
        : isWorker
        ? "Barcode Scanner Verifier Test & Batch Density Calibration"
        : "Verify Tax Invoices & Dispatched Packing Slips for BHEL",
      client: "BHEL Township",
      quantity: isLabour ? "500 Lanyards" : isWorker ? "300 Samples" : "4 Invoices",
      priority: "MEDIUM",
      column: "qa",
      assignedStation: "QA Station B",
      dueTime: "Today, 05:00 PM",
    },
    {
      id: "task-4",
      title: isLabour
        ? "2,000 Assembled Satin Lanyards Boxing & Final Delivery Signoff"
        : isWorker
        ? "Morning Heat Press Cleaning & Ribbon Tension Alignment"
        : "Morning Shift Floor Machine Check & ERP Terminal Sync",
      client: "Adharsh Central Hub",
      quantity: isLabour ? "2,000 Units" : isWorker ? "Machine Setup" : "Daily Audit",
      priority: "MEDIUM",
      column: "done",
      assignedStation: "Central Dispatch",
      dueTime: "Completed 01:15 PM",
    },
  ]);

  const moveKanbanTask = (taskId: string, targetCol: KanbanTask["column"]) => {
    setKanbanTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: targetCol } : t))
    );
    success("Task Updated", "Moved task in Kanban workflow.");
  };

  // Work Sessions for Employee & Worker
  const shiftSessions = [
    {
      id: "s1",
      startTime: "09:15 AM",
      endTime: "11:30 AM",
      duration: "2h 15m",
      type: "active" as const,
      title: isDesktop
        ? "RFID Smartcard Production Encoding & Despatch Staging"
        : "Heat Press Calibration & Satin Lanyard Ribbon Feeding",
      detail: isDesktop
        ? "Desktop Terminal Active • Keystrokes & ERP queue processing"
        : "Workstation Machine Active • 450 units pressed",
    },
    {
      id: "s2",
      startTime: "11:30 AM",
      endTime: "12:05 PM",
      duration: "35m",
      type: "idle" as const,
      title: isDesktop
        ? "Workstation Standby (Screen Inactive / No Task In Focus)"
        : "Floor Idle: Awaiting Next Raw Material Batch from Storeroom",
      detail: isDesktop
        ? "Idle device telemetry: 35 mins no keyboard/mouse input detected"
        : "Production gap: Buffer between order handoffs",
    },
    {
      id: "s3",
      startTime: "12:05 PM",
      endTime: "02:00 PM",
      duration: "1h 55m",
      type: "active" as const,
      title: isDesktop
        ? "Client Artwork Proofing & Variable Data Merge Setup"
        : "Multicolor Sublimation Satin Lanyard Assembly Batch #2",
      detail: isDesktop
        ? "Desktop Terminal Active • CorelDraw / Illustrator export queue"
        : "Workstation Machine Active • 620 units pressed & crimped",
    },
    {
      id: "s4",
      startTime: "02:00 PM",
      endTime: "02:45 PM",
      duration: "45m",
      type: "break" as const,
      title: "Scheduled Plant Lunch & Floor Recalibration",
      detail: "Factory break interval • System logged terminal pause",
    },
    {
      id: "s5",
      startTime: "02:45 PM",
      endTime: "05:15 PM",
      duration: "2h 30m",
      type: "active" as const,
      title: isDesktop
        ? "QA Colorimeter Scan & Electronic Invoicing Approvals"
        : "Lanyard Ring Crimping, Safety Breakaway Insertion & Packing",
      detail: isDesktop
        ? "Desktop Terminal Active • RFID scanner test terminal synced"
        : "Workstation Machine Active • 800 units assembled",
    },
    {
      id: "s6",
      startTime: "05:15 PM",
      endTime: "05:50 PM",
      duration: "35m",
      type: "idle" as const,
      title: isDesktop
        ? "No Task Assigned / Workstation Idle Standby"
        : "Floor Gap: Machine Cooldown & Awaiting Dispatch QA Signoff",
      detail: isDesktop
        ? "Idle device telemetry: Terminal locked / User away from desk"
        : "Production gap: Free floor buffer",
    },
    {
      id: "s7",
      startTime: "05:50 PM",
      endTime: "06:45 PM",
      duration: "55m",
      type: "active" as const,
      title: isDesktop
        ? "End-of-Shift Ledger Reconciliation & Staging Audit"
        : "Final Box Strapping & Floor Station Cleanup",
      detail: isDesktop
        ? "Desktop Terminal Active • Daily report exported"
        : "Workstation Machine Active • 150 units final verified",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Top Header & Breadcrumb (Fixed, Sharp Corners, Title Removed, Tabs Added) */}
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
        {/* Left: Back button + Profile Tabs */}
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
            <span>Back to Workforce</span>
          </button>

          {/* Top Tabs (Overview, Tasks Kanban) */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {[
              { id: "overview" as const, label: "Overview", icon: "user" as const },
              { id: "tasks" as const, label: "Assigned Tasks (Kanban)", icon: "tasks" as const, count: kanbanTasks.length },
            ].map((tab) => {
              const isActive = activeProfileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveProfileTab(tab.id)}
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
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.color = "#fff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }
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

        {/* Right: Actions (Edit Profile) */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            variant="secondary"
            size="sm"
            style={{ borderRadius: "2px" }}
            onClick={() => setShowEditProfileModal(true)}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW TAB (Includes Custom 4 Stat Cards, Shift Telemetry / Lanyard Ledger)
          ========================================================================= */}
      {activeProfileTab === "overview" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr 370px",
            gap: "20px",
            padding: "24px 28px",
            alignItems: "start",
          }}
        >
          {/* COLUMN 1: Left Staff Monogram & Personal Dossier */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Identity Card (Sharp Corners) */}
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
              {/* Sharp Monogram Avatar */}
              <div
                style={{
                  width: "74px",
                  height: "74px",
                  borderRadius: "3px",
                  background: "linear-gradient(135deg, rgba(255, 138, 115, 0.25) 0%, rgba(255, 138, 115, 0.05) 100%)",
                  border: "1px solid var(--accent-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--accent-text)",
                  fontFamily: "var(--font-mono)",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
                }}
              >
                {staff.name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#fff", margin: 0 }}>
                  {staff.name}
                </h2>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {staff.role} • {isLabour ? "Lanyard Piece-Rate Contractor" : isWorker ? "Plant Machine Worker" : "Factory Staff"}
                </span>
              </div>

              {/* Badges (Sharp Corners) */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    padding: "3px 8px",
                    borderRadius: "2px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {staffCode}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "2px",
                    backgroundColor: isAvailable ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: isAvailable ? "#10b981" : "#f59e0b",
                    border: "1px solid " + (isAvailable ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"),
                  }}
                >
                  {staff.availability}
                </span>
              </div>

              {/* Employment Attributes */}
              <div
                style={{
                  width: "100%",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  paddingTop: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Work Category</span>
                  <strong style={{ color: "#fff" }}>{isLabour ? "Contract Labour" : isWorker ? "Floor Production" : "Desktop Admin"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Employment Type</span>
                  <strong style={{ color: "#fff" }}>{isLabour ? "Contract Worker" : isWorker ? "Floor Production" : "Permanent Staff"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Join Date</span>
                  <strong style={{ color: "var(--text-secondary)" }}>14 Feb 2024</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>RFID Tag Access</span>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--accent-text)" }}>TAG-88219</strong>
                </div>
              </div>
            </div>

            {/* Personal Info Card (Sharp Corners, Icons Only) */}
            <div
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                  Personal Info
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "14px", cursor: "pointer" }}>•••</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Gender */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "2px", backgroundColor: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="user" size={14} color="var(--accent-text)" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Personnel Identity</span>
                    <span style={{ fontSize: "12px", color: "#fff", fontWeight: 500 }}>Active Personnel</span>
                  </div>
                </div>

                {/* Email Address */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "2px", backgroundColor: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="mail" size={14} color="#34d399" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Email Address</span>
                    <span style={{ fontSize: "11.5px", color: "var(--accent-text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {staff.email}
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "2px", backgroundColor: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="phone" size={14} color="#f59e0b" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Direct Phone</span>
                    <span style={{ fontSize: "12px", color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                      {staff.phone || "+91 98200 11002"}
                    </span>
                  </div>
                </div>

                {/* Station Location */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "2px", backgroundColor: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="map-pin" size={14} color="#c084fc" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Factory Station</span>
                    <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", fontWeight: 500 }}>
                      {isLabour ? "Lanyard Stitching & Crimping Table 02" : "Adharsh Central Floor, Govindpura"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Center Metrics & Full-Width Expanded Telemetry or Lanyard Ledger */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            
            {/* TOP 4 STAT CARDS: DIVERGENT BY ROLE (Desktop vs Worker vs Labour) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {isLabour ? (
                /* Labour Stat Cards: Focus on Lanyards Given, Assembled, Pending & Payable */
                <>
                  <CircularProgressRing
                    percentage={100}
                    color="#f59e0b"
                    label="Lanyards Given"
                    sublabel="2,500 Issued"
                  />
                  <CircularProgressRing
                    percentage={80}
                    color="#10b981"
                    label="Assembled & Done"
                    sublabel="2,000 Returned"
                  />
                  <CircularProgressRing
                    percentage={20}
                    color="#38bdf8"
                    label="Pending Assembly"
                    sublabel="500 In Queue"
                  />
                  <CircularProgressRing
                    percentage={90}
                    color="#a855f7"
                    label="Piece-Rate Due"
                    sublabel="₹3,000 Payable"
                  />
                </>
              ) : isWorker ? (
                /* Floor Worker Stat Cards: Printing, Lanyards Pressing, Machine Throughput, Defect Rate */
                <>
                  <CircularProgressRing
                    percentage={80}
                    color="#10b981"
                    label="Batches Processed"
                    sublabel="8/10 Batches"
                  />
                  <CircularProgressRing
                    percentage={85}
                    color="#38bdf8"
                    label="Lanyards / Cards Run"
                    sublabel="1,250 Units"
                  />
                  <CircularProgressRing
                    percentage={99.2}
                    color="#10b981"
                    label="Press Efficiency"
                    sublabel="99.2% Throughput"
                  />
                  <CircularProgressRing
                    percentage={Math.max(staff.defectRate * 10, 4)}
                    color={staff.defectRate > 1 ? "#ef4444" : "#ff8a73"}
                    label="Defect Rate"
                    sublabel={`${staff.defectRate}% Low`}
                  />
                </>
              ) : (
                /* Desktop Employee Stat Cards: Tasks Processed, Attendance, Desktop Uptime, Speed */
                <>
                  <CircularProgressRing
                    percentage={85}
                    color="#10b981"
                    label="Tasks Processed"
                    sublabel={`${staff.completedToday + 12}/20 Tasks`}
                  />
                  <CircularProgressRing
                    percentage={92}
                    color="#38bdf8"
                    label="Monthly Attendance"
                    sublabel="24/26 Days"
                  />
                  <CircularProgressRing
                    percentage={98.2}
                    color="#10b981"
                    label="Desktop Focus"
                    sublabel="98.2% Active"
                  />
                  <CircularProgressRing
                    percentage={94}
                    color="#60a5fa"
                    label="Turnaround Speed"
                    sublabel="4.2m Avg"
                  />
                </>
              )}
            </div>

            {/* MAIN EXPANDED FULL-WIDTH SECTION */}
            {isLabour ? (
              /* LABOUR EXCLUSIVE: LANYARD ASSEMBLY MATERIAL REGISTER & BATCH LOG */
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
                      Raw components issued to labour vs assembled finished lanyards returned
                    </span>
                  </div>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, padding: "3px 8px", borderRadius: "2px", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#34d399" }}>
                    ● 100% Material Reconciled
                  </span>
                </div>

                {/* Material Ledger Strip */}
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
                    <strong style={{ fontSize: "18px", color: "#fff", fontFamily: "var(--font-mono)" }}>2,500m</strong>
                    <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>Cut to 90cm standard lengths</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "10px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      Hardware Clasps Issued
                    </span>
                    <strong style={{ fontSize: "18px", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>2,500 pcs</strong>
                    <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>Silver nickel dog hooks</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "10px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      Assembled & Inspected
                    </span>
                    <strong style={{ fontSize: "18px", color: "#10b981", fontFamily: "var(--font-mono)" }}>2,000 done</strong>
                    <span style={{ fontSize: "10.5px", color: "#10b981" }}>500 pending at station</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "10px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      Piece-Rate Accrual
                    </span>
                    <strong style={{ fontSize: "18px", color: "#a855f7", fontFamily: "var(--font-mono)" }}>₹3,000.00</strong>
                    <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>Calculated @ ₹1.50/unit</span>
                  </div>
                </div>

                {/* Batch Distribution List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Active Lanyard Assembly Batches Handed Over
                  </span>

                  {[
                    { batch: "Batch #LN-401", client: "Northwind Coffee", issued: "1,500 Lanyards", completed: "1,500 Done", pending: "0", status: "COMPLETED & VERIFIED", color: "#10b981" },
                    { batch: "Batch #LN-402", client: "Govt Engineering College", issued: "500 Lanyards", completed: "500 Done", pending: "0", status: "COMPLETED & VERIFIED", color: "#10b981" },
                    { batch: "Batch #LN-403", client: "BHEL Township", issued: "500 Lanyards", completed: "0 Done", pending: "500 Pending", status: "IN ASSEMBLY QUEUE", color: "#f59e0b" },
                  ].map((b, idx) => (
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
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>{b.batch}</span>
                        <span style={{ color: "var(--text-secondary)" }}>{b.client}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>• Issued: <strong>{b.issued}</strong></span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: b.color }}>{b.completed}</span>
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.06)", color: b.color }}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* EMPLOYEE & WORKER: FULL-WIDTH SHIFT TELEMETRY */
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
                {/* Header & Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon name="clock" size={16} color="var(--accent-text)" />
                      <span style={{ fontSize: "15px", fontWeight: 800, color: "#fff", letterSpacing: "-0.2px" }}>
                        Shift Hours & Floor Activity Telemetry
                      </span>
                    </div>
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      Biometric Punch & Workstation Idle Activity Tracking
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "2px",
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "#34d399",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "1px", backgroundColor: "#10b981" }} />
                    <span>Live Shift Today</span>
                  </span>
                </div>

                {/* Shift KPI Metrics Strip */}
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
                      Total Shift Duration
                    </span>
                    <strong style={{ fontSize: "20px", color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 800 }}>8h 45m</strong>
                    <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>In: 09:15 AM • Out: 06:45 PM</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "10px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      Active Working Time
                    </span>
                    <strong style={{ fontSize: "20px", color: "#10b981", fontFamily: "var(--font-mono)", fontWeight: 800 }}>6h 50m</strong>
                    <span style={{ fontSize: "10.5px", color: "#10b981", fontWeight: 600 }}>78.1% of shift on tasks</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "10px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      {isDesktop ? "Desktop Idle / AFK" : "Task Transition Gap"}
                    </span>
                    <strong style={{ fontSize: "20px", color: "#f59e0b", fontFamily: "var(--font-mono)", fontWeight: 800 }}>1h 55m</strong>
                    <span style={{ fontSize: "10.5px", color: "#f59e0b", fontWeight: 600 }}>{isDesktop ? "Screen idle buffer" : "Waiting between orders"}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "10px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      Velocity
                    </span>
                    <strong style={{ fontSize: "20px", color: "#60a5fa", fontFamily: "var(--font-mono)", fontWeight: 800 }}>
                      {staff.completedToday} batches
                    </strong>
                    <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>Zero defects recorded</span>
                  </div>
                </div>

                {/* Segmented Timeline */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div
                    style={{
                      height: "22px",
                      width: "100%",
                      borderRadius: "2px",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ width: "26%", backgroundColor: "#10b981" }} title="09:15 - 11:30 | Active Task" />
                    <div style={{ width: "7%", backgroundColor: "#f59e0b" }} title="11:30 - 12:05 | Idle / Standby" />
                    <div style={{ width: "22%", backgroundColor: "#10b981" }} title="12:05 - 14:00 | Active Task" />
                    <div style={{ width: "8.5%", backgroundColor: "rgba(255, 255, 255, 0.2)" }} title="14:00 - 14:45 | Break" />
                    <div style={{ width: "28.5%", backgroundColor: "#10b981" }} title="14:45 - 17:15 | Active Task" />
                    <div style={{ width: "7%", backgroundColor: "#f59e0b" }} title="17:15 - 17:50 | Idle / Standby" />
                    <div style={{ width: "10.5%", backgroundColor: "#10b981" }} title="17:50 - 18:45 | Active Task" />
                  </div>
                </div>

                {/* Session breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {shiftSessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: "2px",
                        backgroundColor: session.type === "active" ? "rgba(16, 185, 129, 0.04)" : session.type === "idle" ? "rgba(245, 158, 11, 0.04)" : "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        fontSize: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "11px", minWidth: "140px" }}>
                          {session.startTime} – {session.endTime}
                        </span>
                        <strong style={{ color: "#fff", fontWeight: 600 }}>{session.title}</strong>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: session.type === "active" ? "#10b981" : "#f59e0b" }}>
                        {session.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 3: Right Shift Calendar & Quick Payroll View */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Monthly Attendance Calendar Card (Bigger in Height, Detailed Green/Half-Day Tracking) */}
            <div
              style={{
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
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>
                    September 2026 Shift Attendance
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Biometric Fingerprint & Workstation Punch
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: "2px",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#34d399",
                  }}
                >
                  95.4% Rate
                </span>
              </div>

              {/* Attendance Quick Stats Strip */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "6px",
                  backgroundColor: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "2px",
                  padding: "8px 10px",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <strong style={{ fontSize: "13px", color: "#34d399", fontFamily: "var(--font-mono)" }}>21</strong>
                  <span style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>Full Days</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", borderLeft: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <strong style={{ fontSize: "13px", color: "#fbbf24", fontFamily: "var(--font-mono)" }}>2</strong>
                  <span style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>Half Days</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", borderLeft: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <strong style={{ fontSize: "13px", color: "#f87171", fontFamily: "var(--font-mono)" }}>1</strong>
                  <span style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>Leave</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", borderLeft: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <strong style={{ fontSize: "13px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>4</strong>
                  <span style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>Off</span>
                </div>
              </div>

              {/* Weekday labels */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 700 }}>
                <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
              </div>

              {/* Day Cells Grid (Bigger Height: 54px with Green Boxes & Half-Days) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
                {/* 2 initial blank cells for Sep 1 starting on Tuesday */}
                <div style={{ height: "54px" }} />
                <div style={{ height: "54px" }} />

                {calendarDays.map((d) => {
                  const isToday = d === 3;
                  const isSunday = d === 6 || d === 13 || d === 20 || d === 27;
                  const isHalfDay = d === 9 || d === 18;
                  const isLeave = d === 12;

                  return (
                    <div
                      key={d}
                      style={{
                        height: "54px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "4px 5px",
                        borderRadius: "2px",
                        backgroundColor: isToday
                          ? "rgba(255, 138, 115, 0.12)"
                          : "rgba(255, 255, 255, 0.02)",
                        border: isToday
                          ? "1px solid var(--accent)"
                          : "1px solid rgba(255, 255, 255, 0.06)",
                        boxSizing: "border-box",
                        transition: "transform 0.1s ease",
                      }}
                    >
                      {/* Top Day Number */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: isToday ? 800 : 600,
                            color: isToday ? "var(--accent-text)" : isSunday ? "var(--text-muted)" : "#fff",
                          }}
                        >
                          {d}
                        </span>
                        {isToday && (
                          <span style={{ width: 5, height: 5, borderRadius: "1px", backgroundColor: "var(--accent)" }} />
                        )}
                      </div>

                      {/* Status Box Inside Cell */}
                      {isToday ? (
                        <div
                          style={{
                            backgroundColor: "var(--accent)",
                            color: "#0a0d14",
                            borderRadius: "2px",
                            padding: "2px 0",
                            textAlign: "center",
                            fontSize: "9px",
                            fontWeight: 800,
                            letterSpacing: "0.2px",
                          }}
                        >
                          LIVE 8h
                        </div>
                      ) : isHalfDay ? (
                        <div
                          style={{
                            backgroundColor: "rgba(245, 158, 11, 0.2)",
                            border: "1px solid rgba(245, 158, 11, 0.45)",
                            color: "#fbbf24",
                            borderRadius: "2px",
                            padding: "2px 0",
                            textAlign: "center",
                            fontSize: "9px",
                            fontWeight: 700,
                          }}
                        >
                          ½ 4h
                        </div>
                      ) : isLeave ? (
                        <div
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                            border: "1px solid rgba(239, 68, 68, 0.45)",
                            color: "#f87171",
                            borderRadius: "2px",
                            padding: "2px 0",
                            textAlign: "center",
                            fontSize: "8.5px",
                            fontWeight: 700,
                          }}
                        >
                          LEAVE
                        </div>
                      ) : isSunday ? (
                        <div
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            color: "var(--text-muted)",
                            borderRadius: "2px",
                            padding: "2px 0",
                            textAlign: "center",
                            fontSize: "8.5px",
                            fontWeight: 600,
                          }}
                        >
                          OFF
                        </div>
                      ) : (
                        <div
                          style={{
                            backgroundColor: "rgba(16, 185, 129, 0.16)",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
                            color: "#34d399",
                            borderRadius: "2px",
                            padding: "2px 0",
                            textAlign: "center",
                            fontSize: "9px",
                            fontWeight: 700,
                          }}
                        >
                          ✓ 8.5h
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  paddingTop: "10px",
                  fontSize: "10.5px",
                  color: "var(--text-secondary)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "#10b981" }} />
                  <span>Full Day</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "#f59e0b" }} />
                  <span>Half Day</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "rgba(255,255,255,0.3)" }} />
                  <span>Off</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ASSIGNED TASKS (KANBAN VIEW)
          ========================================================================= */}
      {activeProfileTab === "tasks" && (
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "18px", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#fff", margin: 0 }}>
                Tasks & Production Orders Kanban
              </h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Workflow dispatch board for {staff.name} ({staff.role})
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon="plus"
              style={{ borderRadius: "2px" }}
              onClick={() => success("Task Allocation", `Assigning new task to ${staff.name}`)}
            >
              Assign New Task
            </Button>
          </div>

          {/* Kanban Board 4 Columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {[
              { id: "todo" as const, title: "To Do / Queue", count: kanbanTasks.filter((t) => t.column === "todo").length, color: "#60a5fa" },
              { id: "in_progress" as const, title: "In Progress / On Floor", count: kanbanTasks.filter((t) => t.column === "in_progress").length, color: "#f59e0b" },
              { id: "qa" as const, title: "QA & Inspection", count: kanbanTasks.filter((t) => t.column === "qa").length, color: "#a855f7" },
              { id: "done" as const, title: "Completed Today", count: kanbanTasks.filter((t) => t.column === "done").length, color: "#10b981" },
            ].map((col) => {
              const colTasks = kanbanTasks.filter((t) => t.column === col.id);

              return (
                <div
                  key={col.id}
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.7)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "3px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    minHeight: "450px",
                  }}
                >
                  {/* Column Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: col.color }} />
                      <strong style={{ fontSize: "12.5px", color: "#fff" }}>{col.title}</strong>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 6px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>
                      {col.count}
                    </span>
                  </div>

                  {/* Task Cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.07)",
                          borderRadius: "2px",
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          transition: "transform 0.15s ease, border-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.borderColor = "var(--accent-border)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                          <span style={{ fontSize: "10.5px", color: "var(--accent-text)", fontWeight: 700 }}>
                            {task.client}
                          </span>
                          <span
                            style={{
                              fontSize: "9.5px",
                              fontWeight: 700,
                              padding: "1px 5px",
                              borderRadius: "2px",
                              backgroundColor: task.priority === "URGENT" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                              color: task.priority === "URGENT" ? "#ef4444" : "#f59e0b",
                            }}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <strong style={{ fontSize: "12.5px", color: "#fff", lineHeight: 1.3 }}>
                          {task.title}
                        </strong>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", borderTop: "1px solid rgba(255, 255, 255, 0.04)", paddingTop: "6px" }}>
                          <span>Target: <strong style={{ color: "var(--text-secondary)" }}>{task.quantity}</strong></span>
                          <span>{task.dueTime}</span>
                        </div>

                        {/* Kanban Move Controls */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", paddingTop: "4px" }}>
                          {col.id === "todo" && (
                            <button
                              type="button"
                              onClick={() => moveKanbanTask(task.id, "in_progress")}
                              style={{ padding: "3px 8px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "10.5px", cursor: "pointer" }}
                            >
                              Start Task →
                            </button>
                          )}
                          {col.id === "in_progress" && (
                            <button
                              type="button"
                              onClick={() => moveKanbanTask(task.id, "qa")}
                              style={{ padding: "3px 8px", borderRadius: "2px", border: "1px solid rgba(168, 85, 247, 0.3)", background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", fontSize: "10.5px", cursor: "pointer" }}
                            >
                              Send to QA →
                            </button>
                          )}
                          {col.id === "qa" && (
                            <button
                              type="button"
                              onClick={() => moveKanbanTask(task.id, "done")}
                              style={{ padding: "3px 8px", borderRadius: "2px", border: "1px solid rgba(16, 185, 129, 0.3)", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", fontSize: "10.5px", cursor: "pointer" }}
                            >
                              Approve Done ✓
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROFILE */}
      {showEditProfileModal && (
        <Modal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          title={`Edit Personnel Record: ${staff.name}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowEditProfileModal(false);
              success("Profile Updated", `Updated details for ${staff.name}`);
            }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <Input
              label="Direct Phone Number"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <Button variant="secondary" size="md" style={{ borderRadius: "2px" }} onClick={() => setShowEditProfileModal(false)}>
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
