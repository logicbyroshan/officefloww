import React, { useState } from "react";
import { StaffMember } from "./StaffView";
import { Icon } from "../../design-system/components/Icon";
import { Button } from "../../design-system/components/Button";
import { useToast } from "../../design-system/components/Toast";

export interface StaffDetailProfileViewProps {
  staff: StaffMember;
  onBack: () => void;
}

/** Circular Ring Gauge for top metric cards */
const CircularProgressRing: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  sublabel: string;
}> = ({ percentage, size = 68, strokeWidth = 6, color = "#10b981", label, sublabel }) => {
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
        borderRadius: "6px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
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
            strokeLinecap="round"
            fill="none"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>

        <div style={{ position: "absolute", textAlign: "center", lineHeight: 1 }}>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>
            {sublabel.split(" ")[0]}
          </span>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>
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
  const [selectedPeriod, setSelectedPeriod] = useState<"year" | "month">("year");

  // Calcs
  const staffCode = `EMP-${staff.id.replace("staff-", "00").replace("lab-", "90")}`;
  const isAvailable = staff.availability === "Available";

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

  // Verified documents
  const documents = [
    { name: "Safety & Press Certification.pdf", size: "1.24 MB" },
    { name: "Workforce Agreement Contract.pdf", size: "895 KB" },
    { name: "Government KYC & Aadhaar.pdf", size: "1.27 MB" },
    { name: "ESIC & PF Enrollment Card.pdf", size: "540 KB" },
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
      {/* Top Header & Breadcrumb */}
      <div
        style={{
          padding: "16px 28px",
          backgroundColor: "rgba(14, 18, 26, 0.9)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
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
              borderRadius: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 138, 115, 0.15)";
              e.currentTarget.style.color = "var(--accent-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <span>←</span>
            <span>Back to Workforce</span>
          </button>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
              <span>Staff & Workforce</span>
              <span>/</span>
              <span>Directory</span>
              <span>/</span>
              <span style={{ color: "var(--text-secondary)" }}>{staff.name}</span>
            </div>
            <h1 style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.3px" }}>
              Employee Details
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => success("Profile Updated", "Staff record marked verified.")}
          >
            Edit Profile
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="plus"
            onClick={() => success("ID Badge Generated", `RFID Badge barcode printed for ${staff.name}.`)}
          >
            Print Badge
          </Button>
        </div>
      </div>

      {/* Main 3-Column Profile Dashboard Content */}
      <div
        style={{
          padding: "20px 28px",
          display: "grid",
          gridTemplateColumns: "280px minmax(500px, 1fr) 310px",
          gap: "18px",
          alignItems: "start",
        }}
      >
        {/* =========================================================================
            COLUMN 1: Left Identity & Personal Contact Info
            ========================================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Main Identity Card */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "6px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "12px",
            }}
          >
            {/* Big Avatar */}
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(255, 138, 115, 0.25) 0%, rgba(56, 189, 248, 0.25) 100%)",
                border: "2px solid var(--accent-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 800,
                color: "var(--accent-text)",
                fontFamily: "var(--font-mono)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
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

            {/* Badges */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  padding: "3px 8px",
                  borderRadius: "4px",
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
                  padding: "3px 10px",
                  borderRadius: "12px",
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

          {/* Personal Info Card */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "6px",
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
                <div style={{ width: 28, height: 28, borderRadius: "4px", backgroundColor: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-text)" }}>
                  👤
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Gender / Identity</span>
                  <span style={{ fontSize: "12px", color: "#fff", fontWeight: 500 }}>Active Personnel</span>
                </div>
              </div>

              {/* Date of Birth */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "4px", backgroundColor: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8" }}>
                  📅
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Date of Birth</span>
                  <span style={{ fontSize: "12px", color: "#fff", fontWeight: 500 }}>28 March 1993</span>
                </div>
              </div>

              {/* Email Address */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "4px", backgroundColor: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399" }}>
                  ✉️
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
                <div style={{ width: 28, height: 28, borderRadius: "4px", backgroundColor: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
                  📞
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
                <div style={{ width: 28, height: 28, borderRadius: "4px", backgroundColor: "rgba(255, 255, 255, 0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c084fc" }}>
                  📍
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
            COLUMN 2: Center Metrics, Performance Chart, Weekly Hours & Documents
            ========================================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Top 4 Circular Ring Cards */}
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

          {/* Performance Overview Card */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "6px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                  Performance Overview
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>
                    {staff.acceptanceRate}%
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#10b981" }}>
                    ↗ +2.05% Increased vs previous cycle
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "4px", backgroundColor: "rgba(0,0,0,0.3)", padding: "2px", borderRadius: "4px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("year")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor: selectedPeriod === "year" ? "rgba(255, 138, 115, 0.18)" : "transparent",
                    color: selectedPeriod === "year" ? "var(--accent-text)" : "var(--text-muted)",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Last Year
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("month")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor: selectedPeriod === "month" ? "rgba(255, 138, 115, 0.18)" : "transparent",
                    color: selectedPeriod === "month" ? "var(--accent-text)" : "var(--text-muted)",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  This Quarter
                </button>
              </div>
            </div>

            {/* SVG Performance Chart Curve */}
            <div style={{ position: "relative", width: "100%", height: "110px", marginTop: "6px" }}>
              <svg width="100%" height="90" viewBox="0 0 500 90" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />

                {/* Area fill */}
                <polygon
                  points="0,60 40,55 80,42 120,40 160,48 200,45 240,52 280,38 320,35 360,40 400,30 440,32 500,24 500,90 0,90"
                  fill="url(#perfGradient)"
                />

                {/* Line stroke */}
                <polyline
                  points="0,60 40,55 80,42 120,40 160,48 200,45 240,52 280,38 320,35 360,40 400,30 440,32 500,24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Active highlight marker */}
                <circle cx="400" cy="30" r="4" fill="#fff" stroke="#10b981" strokeWidth="2" />
              </svg>

              {/* Month labels */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>
            </div>
          </div>

          {/* Two Side-By-Side Cards: Hours Logged & Documents */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Card A: Hours Logged */}
            <div
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Hours Logged</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "2px" }}>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>38</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>h</span>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>30</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>m</span>
                  </div>
                </div>
                <span style={{ fontSize: "11px", color: "var(--accent-text)", fontWeight: 600 }}>This Week ▾</span>
              </div>

              {/* Weekly bar chart */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "90px", paddingTop: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "6px" }}>
                {weekDays.map((w, idx) => {
                  const barHeight = (w.hours / 8.5) * 65;
                  const isTopDay = w.hours >= 8;

                  return (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {w.label}
                      </span>
                      <div
                        style={{
                          width: 18,
                          height: Math.max(barHeight, 4),
                          backgroundColor: isTopDay ? "var(--accent)" : "rgba(255, 138, 115, 0.25)",
                          borderRadius: "3px 3px 0 0",
                          transition: "height 0.3s ease",
                        }}
                      />
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600 }}>
                        {w.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card B: Verified Documents */}
            <div
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Documents</span>
                <span style={{ color: "var(--text-muted)", fontSize: "14px", cursor: "pointer" }}>•••</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.07)";
                      e.currentTarget.style.borderColor = "var(--accent-border)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
                    }}
                    onClick={() => success("Document Opened", `Opening ${doc.name}`)}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "3px",
                        backgroundColor: "rgba(255, 138, 115, 0.15)",
                        color: "var(--accent-text)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9.5px",
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        flexShrink: 0,
                      }}
                    >
                      PDF
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 600,
                          color: "#fff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {doc.name}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        PDF • {doc.size}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Internal Notes & Recognition */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "6px",
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
                  borderRadius: "4px",
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
                  borderRadius: "4px",
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
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Monthly Attendance Calendar Card */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "6px",
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
                    borderRadius: "4px",
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
                    borderRadius: "4px",
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

            {/* Calendar Grid Numbers */}
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
                      borderRadius: "4px",
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
                <span style={{ width: 8, height: 8, borderRadius: "2px", backgroundColor: "#10b981" }} />
                <span style={{ color: "var(--text-secondary)" }}>Present: <strong>22</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "2px", backgroundColor: "var(--accent)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Active Shift: <strong>Today</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "2px", backgroundColor: "#f59e0b" }} />
                <span style={{ color: "var(--text-secondary)" }}>On Leave: <strong>1</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.2)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Absent: <strong>0</strong></span>
              </div>
            </div>
          </div>

          {/* Payroll Summary Card */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "6px",
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
