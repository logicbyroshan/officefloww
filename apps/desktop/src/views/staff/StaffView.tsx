import React, { useState } from "react";
import { Icon } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";
import { StaffDetailProfileView } from "./StaffDetailProfileView";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  type: "EMPLOYEE" | "LABOUR";
  activeTasks: number;
  completedToday: number;
  availability: "Available" | "Busy" | "Off Shift";
  acceptanceRate: number;
  defectRate: number;
  onTimeRate: number;
  assignedTools: string[];
  phone?: string;
  materialHeld?: number;
  amountDue?: number;
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: "staff-1",
    name: "Rohan Sharma",
    email: "admin@adharshbhopal.in",
    role: "ADMIN",
    type: "EMPLOYEE",
    activeTasks: 1,
    completedToday: 4,
    availability: "Available",
    acceptanceRate: 99.5,
    defectRate: 0.5,
    onTimeRate: 98,
    assignedTools: ["Master Keypad", "Barcode Terminal 01"],
    phone: "+91 98200 11002",
  },
  {
    id: "staff-2",
    name: "Priya Nair",
    email: "priya@adharshbhopal.in",
    role: "OPERATOR",
    type: "EMPLOYEE",
    activeTasks: 2,
    completedToday: 6,
    availability: "Busy",
    acceptanceRate: 99.8,
    defectRate: 0.2,
    onTimeRate: 100,
    assignedTools: ["QA Colorimeter"],
    phone: "+91 98200 11003",
  },
  {
    id: "staff-3",
    name: "Sneha Roy",
    email: "sneha@adharshbhopal.in",
    role: "OPERATOR",
    type: "EMPLOYEE",
    activeTasks: 3,
    completedToday: 5,
    availability: "Busy",
    acceptanceRate: 99.0,
    defectRate: 1.0,
    onTimeRate: 96,
    assignedTools: ["iMac Studio 02", "Calibrated Color Monitor"],
    phone: "+91 98200 11005",
  },
  {
    id: "staff-4",
    name: "Dinesh Kumar",
    email: "dinesh@adharshbhopal.in",
    role: "WORKER",
    type: "EMPLOYEE",
    activeTasks: 2,
    completedToday: 8,
    availability: "Busy",
    acceptanceRate: 98.6,
    defectRate: 1.4,
    onTimeRate: 95,
    assignedTools: ["Sublimation Press #1", "Heat Transfer Unit"],
    phone: "+91 98200 11008",
  },
  {
    id: "staff-5",
    name: "Sunil Yadav",
    email: "sunil@adharshbhopal.in",
    role: "WORKER",
    type: "EMPLOYEE",
    activeTasks: 1,
    completedToday: 12,
    availability: "Available",
    acceptanceRate: 100,
    defectRate: 0.0,
    onTimeRate: 99,
    assignedTools: ["Electronic Precision Scale #1", "Label Printer"],
    phone: "+91 98200 11009",
  },
  {
    id: "lab-1",
    name: "Ramesh Lanyard Stitching Unit",
    email: "ramesh.labour@adharshbhopal.in",
    role: "LABOUR",
    type: "LABOUR",
    activeTasks: 2,
    completedToday: 2000,
    availability: "Busy",
    acceptanceRate: 98.7,
    defectRate: 1.3,
    onTimeRate: 94,
    assignedTools: ["Stitching Machines 1-4", "Crimping Clamps"],
    phone: "+91 98200 44551",
    materialHeld: 300,
    amountDue: 3000.0,
  },
  {
    id: "lab-2",
    name: "Suresh Badge Assembly Workshop",
    email: "suresh.badge@adharshbhopal.in",
    role: "LABOUR",
    type: "LABOUR",
    activeTasks: 1,
    completedToday: 800,
    availability: "Available",
    acceptanceRate: 98.8,
    defectRate: 1.2,
    onTimeRate: 92,
    assignedTools: ["Pin Back Presses 1-2"],
    phone: "+91 98200 44552",
    materialHeld: 50,
    amountDue: 960.0,
  },
];

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getAvatarGradient = (role: string) => {
  if (role === "ADMIN") return "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)";
  if (role === "OPERATOR") return "linear-gradient(135deg, #10b981 0%, #047857 100%)";
  if (role === "WORKER") return "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)";
  return "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)";
};

export const StaffView: React.FC = () => {
  const { success } = useToast();
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // One-click copy handler with event isolation
  const handleCopy = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    success("Copied to Clipboard", `${label} "${text}" copied.`);
  };

  const filteredStaff = INITIAL_STAFF.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      s.assignedTools.some((t) => t.toLowerCase().includes(q))
    );
  });

  if (selectedStaff) {
    return (
      <StaffDetailProfileView
        staff={selectedStaff}
        onBack={() => setSelectedStaff(null)}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
        backgroundColor: "#070a10",
        backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 138, 115, 0.04), transparent)",
        color: "#e2e8f0",
      }}
    >
      {/* TOP HEADER: SEARCH & ADD PERSONNEL ON TOP (NO REDUNDANT TITLE OR TABS) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 28px",
          backgroundColor: "rgba(14, 18, 28, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          gap: "16px",
          flexWrap: "wrap",
          position: "sticky",
          top: 0,
          zIndex: 30,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Left: Workforce counter badge (sharp corners) */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "3px",
              backgroundColor: "rgba(255, 138, 115, 0.12)",
              border: "1px solid var(--accent-border)",
              color: "var(--accent-text)",
              fontSize: "12.5px",
              fontWeight: 700,
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "1px", backgroundColor: "var(--accent)" }} />
            <span>{INITIAL_STAFF.length} Total Workforce</span>
          </div>

          <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
            Showing {filteredStaff.length} active personnel & contractors
          </span>
        </div>

        {/* Right: Search Bar & Add Personnel Action (sharp corners) */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, justifyContent: "flex-end", maxWidth: "600px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "38px",
              boxSizing: "border-box",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "3px",
              padding: "0 14px",
              flex: 1,
              maxWidth: "380px",
            }}
          >
            <Icon name="search" size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search staff by name, role, email, tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => success("Personnel Provisioning", "Staff record creation opened.")}
            style={{
              height: "38px",
              padding: "0 16px",
              borderRadius: "3px",
              backgroundColor: "var(--accent)",
              backgroundImage: "linear-gradient(135deg, #ff8a73 0%, #ea580c 100%)",
              border: "none",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 10px rgba(234, 88, 12, 0.35)",
              flexShrink: 0,
            }}
          >
            <Icon name="plus" size={14} color="#fff" />
            <span>Add Personnel</span>
          </button>
        </div>
      </div>

      {/* BODY AREA: CARDS GRID (NO TABLES, NO TABS, SHARPER SIDES) */}
      <div style={{ padding: "26px 32px", display: "flex", flexDirection: "column", gap: "24px", width: "100%", boxSizing: "border-box" }}>
        
        {/* CARDS GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))",
            gap: "22px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {filteredStaff.map((staff) => {
            const isAvailable = staff.availability === "Available";
            const roleSubtitle = `${staff.role} • ${staff.type === "LABOUR" ? "Piece-Rate Contractor" : "Floor Specialist"}`;

            return (
              <div
                key={staff.id}
                onClick={() => setSelectedStaff(staff)}
                style={{
                  backgroundColor: "rgba(18, 23, 35, 0.78)",
                  backdropFilter: "blur(18px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "3px",
                  padding: "24px 26px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = "rgba(255, 138, 115, 0.4)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Top Row: Monogram Avatar (sharp 3px) + Name + Availability */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "3px",
                        background: getAvatarGradient(staff.role),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#fff",
                        flexShrink: 0,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
                      }}
                    >
                      {getInitials(staff.name)}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <h3 style={{ margin: 0, fontSize: "17.5px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.3px" }}>
                        {staff.name}
                      </h3>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {roleSubtitle}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "3px 8px",
                      borderRadius: "2px",
                      backgroundColor: isAvailable ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                      border: "1px solid " + (isAvailable ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"),
                      color: isAvailable ? "#34d399" : "#f59e0b",
                      fontSize: "11px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ width: "5px", height: "5px", borderRadius: "1px", backgroundColor: isAvailable ? "#10b981" : "#f59e0b" }} />
                    {staff.availability}
                  </span>
                </div>

                {/* Middle Contact Section with One-Click Copy (sharp 3px) */}
                <div
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.22)",
                    borderRadius: "3px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {/* Phone with copy */}
                  <div
                    onClick={(e) => handleCopy(staff.phone || "+91 98200 11002", "Phone Number", e)}
                    title="Click to copy phone number"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "4px 6px",
                      borderRadius: "2px",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                      <Icon name="phone" size={13} color="#f59e0b" />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: 600 }}>
                        {staff.phone || "+91 98200 11002"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", fontSize: "11px" }}>
                      <Icon name="copy" size={11} color="var(--text-muted)" />
                      <span>Copy</span>
                    </div>
                  </div>

                  {/* Email with copy */}
                  <div
                    onClick={(e) => handleCopy(staff.email, "Email Address", e)}
                    title="Click to copy email address"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "4px 6px",
                      borderRadius: "2px",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                      <Icon name="mail" size={13} color="#34d399" />
                      <span style={{ fontSize: "12px" }}>{staff.email}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", fontSize: "11px" }}>
                      <Icon name="copy" size={11} color="var(--text-muted)" />
                      <span>Copy</span>
                    </div>
                  </div>

                  {/* Workstation Tools */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", color: "var(--text-muted)", fontSize: "11.5px" }}>
                    <Icon name="tool" size={13} color="var(--accent-text)" />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {staff.assignedTools.join(" • ") || "General Workstation Station"}
                    </span>
                  </div>
                </div>

                {/* Production Metrics Strip */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "2px",
                    padding: "10px 12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Tasks</span>
                    <strong style={{ fontSize: "14px", color: "#fff", fontFamily: "var(--font-mono)" }}>{staff.activeTasks}</strong>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", borderRight: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Today Done</span>
                    <strong style={{ fontSize: "14px", color: "#34d399", fontFamily: "var(--font-mono)" }}>
                      {staff.type === "LABOUR" ? `${staff.completedToday.toLocaleString()}u` : `${staff.completedToday} batches`}
                    </strong>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quality Pass</span>
                    <strong style={{ fontSize: "14px", color: "#60a5fa", fontFamily: "var(--font-mono)" }}>{staff.acceptanceRate}%</strong>
                  </div>
                </div>

                {/* Bottom Footer: Shift Status + View Profile Action */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Today Shift:</span>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-mono)" }}>8h 30m logged</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStaff(staff);
                    }}
                    style={{
                      height: "32px",
                      padding: "0 14px",
                      borderRadius: "2px",
                      backgroundColor: "rgba(59, 130, 246, 0.12)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      color: "#60a5fa",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2563eb";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.12)";
                      e.currentTarget.style.color = "#60a5fa";
                    }}
                  >
                    <span>View Profile</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
