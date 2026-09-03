import React, { useState } from "react";
import { StaffMember } from "./StaffView";
import { Icon } from "../../design-system/components/Icon";
import { Button } from "../../design-system/components/Button";
import { useToast } from "../../design-system/components/Toast";

export interface StaffDetailProfileViewProps {
  staff: StaffMember;
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
}> = ({ percentage, size = 64, strokeWidth = 6, color = "#10b981", label, sublabel }) => {
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
      <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-secondary)" }}>
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
          <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>
            {sublabel.split(" ")[0]}
          </span>
          <div style={{ fontSize: "8.5px", color: "var(--text-muted)", marginTop: "2px" }}>
            {sublabel.split(" ")[1] || ""}
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
  const [activeHoursView, setActiveHoursView] = useState<"today" | "weekly">("today");

  // Calcs
  const staffCode = `EMP-${staff.id.replace("staff-", "00").replace("lab-", "90")}`;
  const isAvailable = staff.availability === "Available";
  const isDesktopStaff = staff.role === "ADMIN" || staff.role === "OPERATOR";

  // Days of current month for attendance widget
  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

  // Weekly hours logged
  const weekDays = [
    { day: "M", hours: 8.0, label: "8:00" },
    { day: "T", hours: 7.5, label: "7:30" },
    { day: "W", hours: 4.0, label: "4:00" },
    { day: "T", hours: 8.5, label: "8:30" },
    { day: "F", hours: 7.0, label: "7:00" },
    { day: "S", hours: 3.5, label: "3:30" },
    { day: "S", hours: 0.0, label: "0:00" },
  ];

  // Today's Work Sessions Timeline Breakdown
  const shiftSessions = [
    {
      id: "s1",
      startTime: "09:15 AM",
      endTime: "11:30 AM",
      duration: "2h 15m",
      type: "active" as const,
      title: isDesktopStaff
        ? "RFID Smartcard Production Encoding & Despatch Staging"
        : "Heat Press Calibration & Satin Lanyard Ribbon Feeding",
      detail: isDesktopStaff
        ? "Desktop Terminal Active • Keystrokes & ERP queue processing"
        : "Workstation Machine Active • 450 units pressed",
    },
    {
      id: "s2",
      startTime: "11:30 AM",
      endTime: "12:05 PM",
      duration: "35m",
      type: "idle" as const,
      title: isDesktopStaff
        ? "Workstation Standby (Screen Inactive / No Task In Focus)"
        : "Floor Idle: Awaiting Next Raw Material Batch from Storeroom",
      detail: isDesktopStaff
        ? "Idle device telemetry: 35 mins no keyboard/mouse input detected"
        : "Production gap: Buffer between order handoffs",
    },
    {
      id: "s3",
      startTime: "12:05 PM",
      endTime: "02:00 PM",
      duration: "1h 55m",
      type: "active" as const,
      title: isDesktopStaff
        ? "Client Artwork Proofing & Variable Data Merge Setup"
        : "Multicolor Sublimation Satin Lanyard Assembly Batch #2",
      detail: isDesktopStaff
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
      title: isDesktopStaff
        ? "QA Colorimeter Scan & Electronic Invoicing Approvals"
        : "Lanyard Ring Crimping, Safety Breakaway Insertion & Packing",
      detail: isDesktopStaff
        ? "Desktop Terminal Active • RFID scanner test terminal synced"
        : "Workstation Machine Active • 800 units assembled",
    },
    {
      id: "s6",
      startTime: "05:15 PM",
      endTime: "05:50 PM",
      duration: "35m",
      type: "idle" as const,
      title: isDesktopStaff
        ? "No Task Assigned / Workstation Idle Standby"
        : "Floor Gap: Machine Cooldown & Awaiting Dispatch QA Signoff",
      detail: isDesktopStaff
        ? "Idle device telemetry: Terminal locked / User away from desk"
        : "Production gap: Free floor buffer",
    },
    {
      id: "s7",
      startTime: "05:50 PM",
      endTime: "06:45 PM",
      duration: "55m",
      type: "active" as const,
      title: isDesktopStaff
        ? "End-of-Shift Ledger Reconciliation & Staging Audit"
        : "Final Box Strapping & Floor Station Cleanup",
      detail: isDesktopStaff
        ? "Desktop Terminal Active • Daily report exported"
        : "Workstation Machine Active • 150 units final verified",
    },
  ];

  // Payroll figures
  const baseSalary = staff.role === "ADMIN" ? 45000 : staff.role === "OPERATOR" ? 28000 : 18000;
  const productionAllowance = 3500;
  const overtimeIncentive = 2800;
  const attendanceBonus = 1200;
  const pfDeduction = 1800;
  const esicDeduction = 420;
  const netMonthly = baseSalary + productionAllowance + overtimeIncentive + attendanceBonus - pfDeduction - esicDeduction;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Top Header & Breadcrumb (Fixed, Sharp Corners) */}
      <div
        style={{
          padding: "14px 28px",
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
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "2px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
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

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Staff & Workforce / Directory / {staff.name}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>
              Employee Details
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            variant="secondary"
            size="sm"
            style={{ borderRadius: "2px" }}
            onClick={() => success("Profile Update", `Editing credentials for ${staff.name}`)}
          >
            Edit Profile
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="printer"
            style={{ borderRadius: "2px" }}
            onClick={() => success("Access Card Issued", `Printing RFID tag badge for ${staff.name}`)}
          >
            Print Badge
          </Button>
        </div>
      </div>

      {/* Main 3-Column Profile Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr 300px",
          gap: "20px",
          padding: "24px 28px",
          alignItems: "start",
        }}
      >
        {/* =========================================================================
            COLUMN 1: Left Staff Monogram & Personal Dossier
            ========================================================================= */}
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
                {staff.role} • {staff.type === "EMPLOYEE" ? "Factory Staff" : "Contractor"}
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
                <span style={{ color: "var(--text-muted)" }}>Employment Type</span>
                <strong style={{ color: "#fff" }}>Full-Time Direct</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Work Model</span>
                <strong style={{ color: "#fff" }}>On-Premises Plant</strong>
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

          {/* Personal Info Card (Sharp Corners) */}
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
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Gender / Identity</span>
                  <span style={{ fontSize: "12px", color: "#fff", fontWeight: 500 }}>Active Personnel</span>
                </div>
              </div>

              {/* Date of Birth */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "2px", backgroundColor: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="calendar" size={14} color="#38bdf8" />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Date of Birth</span>
                  <span style={{ fontSize: "12px", color: "#fff", fontWeight: 500 }}>28 March 1993</span>
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

              {/* Plant Location */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "2px", backgroundColor: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="map-pin" size={14} color="#c084fc" />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Factory Station</span>
                  <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", fontWeight: 500 }}>
                    Adharsh Floor, Govindpura Industrial Area, Bhopal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 2: Center Metrics & Full-Width Expanded Hours Logged & Telemetry
            ========================================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Top 4 Circular Ring Cards (Sharp 3px corners) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <CircularProgressRing
              percentage={85}
              color="#10b981"
              label="Tasks Done"
              sublabel={`${staff.completedToday + 10}/20 Tasks`}
            />
            <CircularProgressRing
              percentage={92}
              color="#38bdf8"
              label="Attendance"
              sublabel="24/26 Days"
            />
            <CircularProgressRing
              percentage={staff.acceptanceRate}
              color="#10b981"
              label="Quality Pass"
              sublabel={`${staff.acceptanceRate}% Rate`}
            />
            <CircularProgressRing
              percentage={Math.max(staff.defectRate * 10, 5)}
              color={staff.defectRate > 1 ? "#ef4444" : "#ff8a73"}
              label="Defect Rate"
              sublabel={`${staff.defectRate}% Low`}
            />
          </div>

          {/* =====================================================================
              EXPANDED FULL-WIDTH HOURS LOGGED & WORKSTATION ACTIVITY TELEMETRY CARD
              (Replaced Performance Overview and Documents as requested!)
              ===================================================================== */}
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

              {/* View Mode Toggle */}
              <div style={{ display: "flex", gap: "4px", backgroundColor: "rgba(0,0,0,0.35)", padding: "3px", borderRadius: "2px" }}>
                <button
                  type="button"
                  onClick={() => setActiveHoursView("today")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "2px",
                    border: "none",
                    backgroundColor: activeHoursView === "today" ? "rgba(255, 138, 115, 0.2)" : "transparent",
                    color: activeHoursView === "today" ? "var(--accent-text)" : "var(--text-muted)",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span style={{ width: "5px", height: "5px", borderRadius: "1px", backgroundColor: activeHoursView === "today" ? "var(--accent)" : "transparent" }} />
                  <span>Today's Shift (Live)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHoursView("weekly")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "2px",
                    border: "none",
                    backgroundColor: activeHoursView === "weekly" ? "rgba(255, 138, 115, 0.2)" : "transparent",
                    color: activeHoursView === "weekly" ? "var(--accent-text)" : "var(--text-muted)",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Weekly History (38h 30m)
                </button>
              </div>
            </div>

            {/* Shift KPI Metrics Strip (Sharp 2px-3px boxes) */}
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
              {/* Total Shift */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Total Shift Duration
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <strong style={{ fontSize: "20px", color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 800 }}>8h 45m</strong>
                </div>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>
                  In: 09:15 AM • Out: 06:45 PM
                </span>
              </div>

              {/* Productive Working */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "10px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Active Working Time
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <strong style={{ fontSize: "20px", color: "#10b981", fontFamily: "var(--font-mono)", fontWeight: 800 }}>6h 50m</strong>
                </div>
                <span style={{ fontSize: "10.5px", color: "#10b981", fontWeight: 600 }}>
                  78.1% of shift on tasks
                </span>
              </div>

              {/* Inactivity / Idle Task Gap */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "10px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  {isDesktopStaff ? "Desktop Idle / AFK" : "Task Transition Gap"}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <strong style={{ fontSize: "20px", color: "#f59e0b", fontFamily: "var(--font-mono)", fontWeight: 800 }}>1h 55m</strong>
                </div>
                <span style={{ fontSize: "10.5px", color: "#f59e0b", fontWeight: 600 }}>
                  {isDesktopStaff ? "Screen idle buffer" : "Waiting between tasks"}
                </span>
              </div>

              {/* Completed Volume */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "10px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Batch Velocity
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <strong style={{ fontSize: "20px", color: "#60a5fa", fontFamily: "var(--font-mono)", fontWeight: 800 }}>
                    {staff.type === "LABOUR" ? `${staff.completedToday}u` : `${staff.completedToday} batches`}
                  </strong>
                </div>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>
                  Zero defects reported
                </span>
              </div>
            </div>

            {/* Hardware & Task Telemetry Notice Box */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "3px",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: isDesktopStaff ? "#60a5fa" : "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {isDesktopStaff
                    ? "🖥️ Workstation Device Telemetry (Adharsh Plant Terminal PC-01)"
                    : "⚙️ Floor Task Cycle & Machine Telemetry (Station Press Line)"}
                </span>
                <span style={{ fontSize: "10.5px", color: "#10b981", fontWeight: 700 }}>
                  ● Hardware Live
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                {isDesktopStaff
                  ? "Monitors active keyboard, mouse, and ERP application input. When no active desktop interaction is detected for >5 minutes, time is automatically classified into 'Idle / Standby' until task execution resumes."
                  : "Monitors production task lifecycle. Logs duration spent actively pressing/stitching batches versus floor idle time while awaiting new order allocations or raw stock deliveries from warehouse."}
              </p>
            </div>

            {activeHoursView === "today" ? (
              <>
                {/* Visual Continuous Day Timeline Bar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "2px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
                    <span style={{ fontWeight: 600 }}>Shift Timeline (09:00 AM — 07:00 PM)</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "#10b981" }} />
                        <span style={{ color: "var(--text-secondary)" }}>Active Task Work</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "#f59e0b" }} />
                        <span style={{ color: "var(--text-secondary)" }}>Idle / Task Gap</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />
                        <span style={{ color: "var(--text-secondary)" }}>Plant Break</span>
                      </span>
                    </div>
                  </div>

                  {/* Segmented Timeline Bar */}
                  <div
                    style={{
                      height: "24px",
                      width: "100%",
                      borderRadius: "3px",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      overflow: "hidden",
                    }}
                  >
                    {/* Shift segment 1: 09:15 - 11:30 (2h 15m) -> 25.7% */}
                    <div
                      title="09:15 - 11:30 | Active Task: Campus RFID Smartcard (2h 15m)"
                      style={{ width: "26%", backgroundColor: "#10b981", cursor: "pointer", transition: "opacity 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    />
                    {/* Shift segment 2: 11:30 - 12:05 (35m) -> 6.7% */}
                    <div
                      title="11:30 - 12:05 | Idle / Standby: No Task Assigned (35m)"
                      style={{ width: "7%", backgroundColor: "#f59e0b", cursor: "pointer", transition: "opacity 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    />
                    {/* Shift segment 3: 12:05 - 14:00 (1h 55m) -> 21.9% */}
                    <div
                      title="12:05 - 14:00 | Active Task: Satin Lanyard Sublimation (1h 55m)"
                      style={{ width: "22%", backgroundColor: "#10b981", cursor: "pointer", transition: "opacity 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    />
                    {/* Shift segment 4: 14:00 - 14:45 (45m) -> 8.5% */}
                    <div
                      title="14:00 - 14:45 | Plant Lunch & Break (45m)"
                      style={{ width: "8.5%", backgroundColor: "rgba(255, 255, 255, 0.2)", cursor: "pointer", transition: "opacity 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    />
                    {/* Shift segment 5: 14:45 - 17:15 (2h 30m) -> 28.5% */}
                    <div
                      title="14:45 - 17:15 | Active Task: QA Colorimeter Inspection (2h 30m)"
                      style={{ width: "28.5%", backgroundColor: "#10b981", cursor: "pointer", transition: "opacity 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    />
                    {/* Shift segment 6: 17:15 - 17:50 (35m) -> 6.7% */}
                    <div
                      title="17:15 - 17:50 | Floor Standby (35m)"
                      style={{ width: "7%", backgroundColor: "#f59e0b", cursor: "pointer", transition: "opacity 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    />
                    {/* Shift segment 7: 17:50 - 18:45 (55m) -> 10.5% */}
                    <div
                      title="17:50 - 18:45 | Active Task: Final Delivery Staging (55m)"
                      style={{ width: "10.5%", backgroundColor: "#10b981", cursor: "pointer", transition: "opacity 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    />
                  </div>

                  {/* Time labels below bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    <span>09:00 AM</span>
                    <span>11:00 AM</span>
                    <span>01:00 PM</span>
                    <span>03:00 PM</span>
                    <span>05:00 PM</span>
                    <span>07:00 PM</span>
                  </div>
                </div>

                {/* Structured Shift Activity Breakdown Table/List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Work Sessions & Idle Logs Today
                  </span>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {shiftSessions.map((session) => {
                      const isActive = session.type === "active";
                      const isIdle = session.type === "idle";

                      return (
                        <div
                          key={session.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: "2px",
                            backgroundColor: isActive
                              ? "rgba(16, 185, 129, 0.04)"
                              : isIdle
                              ? "rgba(245, 158, 11, 0.04)"
                              : "rgba(255, 255, 255, 0.02)",
                            border:
                              "1px solid " +
                              (isActive
                                ? "rgba(16, 185, 129, 0.15)"
                                : isIdle
                                ? "rgba(245, 158, 11, 0.18)"
                                : "rgba(255, 255, 255, 0.06)"),
                            fontSize: "12px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "1px",
                                backgroundColor: isActive ? "#10b981" : isIdle ? "#f59e0b" : "rgba(255,255,255,0.4)",
                              }}
                            />
                            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "11px", minWidth: "140px" }}>
                              {session.startTime} – {session.endTime}
                            </span>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <strong style={{ color: "#fff", fontWeight: 600 }}>{session.title}</strong>
                              <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{session.detail}</span>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: isActive ? "#10b981" : isIdle ? "#f59e0b" : "var(--text-muted)" }}>
                              {session.duration}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "2px",
                                backgroundColor: isActive
                                  ? "rgba(16, 185, 129, 0.12)"
                                  : isIdle
                                  ? "rgba(245, 158, 11, 0.15)"
                                  : "rgba(255, 255, 255, 0.06)",
                                color: isActive ? "#10b981" : isIdle ? "#f59e0b" : "var(--text-secondary)",
                              }}
                            >
                              {isActive ? "ACTIVE TASK" : isIdle ? "IDLE BUFFER" : "BREAK"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* Weekly Bar Histogram View */
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "6px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>38</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>hours</span>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>30</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>minutes logged this week</span>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "130px", paddingTop: "14px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "8px" }}>
                  {weekDays.map((w, idx) => {
                    const barHeight = (w.hours / 8.5) * 95;
                    const isTopDay = w.hours >= 8;

                    return (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1 }}>
                        <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {w.label}
                        </span>
                        <div
                          style={{
                            width: "36px",
                            height: Math.max(barHeight, 6),
                            backgroundColor: isTopDay ? "var(--accent)" : "rgba(255, 138, 115, 0.25)",
                            borderRadius: "2px 2px 0 0",
                            transition: "height 0.3s ease",
                          }}
                        />
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700 }}>
                          {w.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Internal Notes & Supervisory Feedback (Sharp Corners) */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "3px",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                Internal Notes & Supervisory Feedback
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "14px", cursor: "pointer" }}>•••</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "2px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8" }}>
                    Production Output Feedback
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>10 Aug 2026</span>
                </div>
                <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
                  Demonstrated exceptional output on high-speed sublimation press setup. Consistently meets zero-defect benchmarks on academic batches.
                </p>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "2px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981" }}>
                    Quality Lead Recognition
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>02 Sep 2026</span>
                </div>
                <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
                  Recognized by the Production Head for maintaining a 99.8% pass rate across 5,000 unit PVC badge thermal printing runs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 3: Right Shift Calendar & Payroll Compensation Summary
            ========================================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Monthly Attendance Calendar Card (Sharp Corners) */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "3px",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                September 2026
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  type="button"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "2px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                  }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "2px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                  }}
                >
                  ›
                </button>
              </div>
            </div>

            {/* Calendar Day Labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 600 }}>
              <span>S</span>
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
            </div>

            {/* Calendar Grid Numbers (Sharp Corners) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
              {/* Blank initial days */}
              <span />
              {calendarDays.map((d) => {
                const isToday = d === 3;
                const isPastPresent = d <= 3;
                const isLeave = d === 12;

                return (
                  <div
                    key={d}
                    style={{
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "2px",
                      fontSize: "11px",
                      fontWeight: isToday ? 800 : 500,
                      backgroundColor: isToday
                        ? "var(--accent)"
                        : isPastPresent
                        ? "rgba(16, 185, 129, 0.2)"
                        : isLeave
                        ? "rgba(245, 158, 11, 0.2)"
                        : "transparent",
                      color: isToday ? "#090c13" : isPastPresent ? "#10b981" : isLeave ? "#f59e0b" : "var(--text-secondary)",
                      border: isToday ? "1px solid var(--accent)" : "1px solid transparent",
                    }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>

            {/* Attendance Legend */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                paddingTop: "10px",
                fontSize: "10.5px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "#10b981" }} />
                <span style={{ color: "var(--text-secondary)" }}>Present: <strong>22</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "var(--accent)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Active Shift: <strong>Today</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "#f59e0b" }} />
                <span style={{ color: "var(--text-secondary)" }}>On Leave: <strong>1</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Absent: <strong>0</strong></span>
              </div>
            </div>
          </div>

          {/* Payroll Summary Card (Sharp Corners) */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "3px",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                Payroll Summary
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "14px", cursor: "pointer" }}>•••</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Base Monthly Salary</span>
                <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>₹{baseSalary.toLocaleString()}</strong>
              </div>

              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginTop: "4px" }}>
                Allowances
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Production Incentive</span>
                <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>+₹{productionAllowance.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Overtime Hours</span>
                <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>+₹{overtimeIncentive.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Attendance Bonus</span>
                <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>+₹{attendanceBonus.toLocaleString()}</span>
              </div>

              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginTop: "4px" }}>
                Deductions
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Provident Fund (PF)</span>
                <span style={{ color: "#f87171", fontFamily: "var(--font-mono)" }}>-₹{pfDeduction.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>ESIC Coverage</span>
                <span style={{ color: "#f87171", fontFamily: "var(--font-mono)" }}>-₹{esicDeduction.toLocaleString()}</span>
              </div>
            </div>

            {/* Total Net Pay */}
            <div
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                paddingTop: "10px",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>
                Total Monthly Payout
              </span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#34d399", fontFamily: "var(--font-mono)" }}>
                ₹{netMonthly.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
