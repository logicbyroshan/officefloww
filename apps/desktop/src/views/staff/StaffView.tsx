import React, { useState } from "react";
import { UserRole } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";

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
    email: "manager@adharshbhopal.in",
    role: "MANAGER",
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
    email: "designer@adharshbhopal.in",
    role: "DESIGNER",
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
    email: "machineop@adharshbhopal.in",
    role: "MACHINE_OPERATOR",
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
    email: "packingop@adharshbhopal.in",
    role: "PACKING_OPERATOR",
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
    email: "ramesh.labour@contractor.in",
    role: "CONTRACTOR",
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
    email: "suresh.badge@contractor.in",
    role: "CONTRACTOR",
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

export const StaffView: React.FC = () => {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<"all" | "employees" | "labour" | "assignments" | "performance">("all");
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const filteredStaff = INITIAL_STAFF.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
    if (!matchSearch) return false;

    if (activeTab === "employees") return s.type === "EMPLOYEE";
    if (activeTab === "labour") return s.type === "LABOUR";
    return true;
  });

  const columns: Column<StaffMember>[] = [
    {
      key: "name",
      header: "Staff Member",
      render: (s) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              backgroundColor: s.type === "EMPLOYEE" ? "rgba(255, 138, 115, 0.15)" : "rgba(56, 189, 248, 0.15)",
              color: s.type === "EMPLOYEE" ? "var(--accent-text)" : "#38bdf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            {s.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.phone || s.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type & Role",
      render: (s) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "10.5px",
              padding: "2px 6px",
              borderRadius: "3px",
              backgroundColor: s.type === "EMPLOYEE" ? "rgba(255, 255, 255, 0.05)" : "rgba(56, 189, 248, 0.12)",
              color: s.type === "EMPLOYEE" ? "var(--text-secondary)" : "#38bdf8",
              fontWeight: 600,
            }}
          >
            {s.type}
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.role}</span>
        </div>
      ),
    },
    {
      key: "activeTasks",
      header: "Workload",
      align: "right",
      render: (s) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: 600, color: "#fff" }}>
          {s.activeTasks} tasks active
        </span>
      ),
    },
    {
      key: "availability",
      header: "Availability",
      render: (s) => {
        let color = "#10b981";
        if (s.availability === "Busy") color = "var(--accent)";
        if (s.availability === "Off Shift") color = "var(--text-muted)";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color }} />
            <span style={{ fontSize: "12px", color }}>{s.availability}</span>
          </div>
        );
      },
    },
    {
      key: "acceptanceRate",
      header: "Quality & Defect Rate",
      align: "right",
      render: (s) => (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#10b981", fontWeight: 600 }}>
            {s.acceptanceRate}% pass
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{s.defectRate}% defect</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "80px",
      render: (s) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedStaff(s);
          }}
          style={{
            padding: "4px 8px",
            borderRadius: "3px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "var(--text-secondary)",
            fontSize: "11.5px",
            cursor: "pointer",
          }}
        >
          Profile →
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Staff & Workforce"
        badge={
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--accent-text)",
              backgroundColor: "rgba(255, 138, 115, 0.12)",
              border: "1px solid var(--accent-border)",
              borderRadius: "4px",
              padding: "2px 8px",
            }}
          >
            {INITIAL_STAFF.length} Total Workforce
          </span>
        }
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Navigation Tabs Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "10px",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[
              { id: "all" as const, label: "All Staff" },
              { id: "employees" as const, label: "Employees" },
              { id: "labour" as const, label: "Labour & Contractors" },
              { id: "assignments" as const, label: "Assignments & Workload" },
              { id: "performance" as const, label: "Objective Performance" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor:
                    activeTab === tab.id ? "rgba(255, 138, 115, 0.14)" : "transparent",
                  color: activeTab === tab.id ? "var(--accent-text)" : "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  cursor: "pointer",
                }}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "4px 10px",
            }}
          >
            <Icon name="search" size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search staff, tools, skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "12px",
                outline: "none",
                width: "160px",
              }}
            />
          </div>
        </div>

        {/* Assignments View */}
        {activeTab === "assignments" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "rgba(19, 23, 34, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "4px",
              }}
            >
              <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "var(--accent-text)", fontWeight: 700 }}>
                Smart Dispatch Recommendation
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                Task: <strong>ORD-2026-0001 (Lanyard Assembly 500 pcs)</strong>
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--accent-border)",
                    borderRadius: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>Priya Nair</span>
                    <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>Recommended</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Available now • 2 active tasks • 99.8% quality record • Sublimation specialist
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "4px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>Ramesh Labour Unit</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Alternative</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Contractor • 300 hooks held • Rate ₹1.50/unit • Capacity ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Main Staff Table */
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.75)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <Table
              columns={columns}
              data={filteredStaff}
              onRowClick={(s) => setSelectedStaff(s)}
              emptyText="No staff members match the active filters."
            />
          </div>
        )}
      </div>

      {/* Staff Detail Drawer */}
      {selectedStaff && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "440px",
            backgroundColor: "rgba(14, 18, 26, 0.96)",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid var(--accent-border)",
            boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.6)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            animation: "slideLeft 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>
                {selectedStaff.name}
              </h3>
              <span style={{ fontSize: "11.5px", color: "var(--accent-text)", fontFamily: "var(--font-mono)" }}>
                {selectedStaff.role} • {selectedStaff.type}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedStaff(null)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
            {/* Quick Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ padding: "10px", backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>CURRENT WORKLOAD</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                  {selectedStaff.activeTasks} active tasks
                </div>
              </div>
              <div style={{ padding: "10px", backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>QUALITY PASS RATE</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#10b981", marginTop: "2px" }}>
                  {selectedStaff.acceptanceRate}%
                </div>
              </div>
            </div>

            {/* If contractor, show ledger info */}
            {selectedStaff.type === "LABOUR" && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "rgba(255, 138, 115, 0.08)",
                  border: "1px solid var(--accent-border)",
                  borderRadius: "4px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-text)" }}>
                  Contractor Material & Ledger
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
                  <span>Raw Materials Held:</span>
                  <strong>{selectedStaff.materialHeld || 0} units</strong>
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
                  <span>Outstanding Amount Due:</span>
                  <strong style={{ color: "#34d399" }}>₹{(selectedStaff.amountDue || 0).toLocaleString()}</strong>
                </div>
              </div>
            )}

            {/* Issued Equipment */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                Assigned Tools & Assets
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {selectedStaff.assignedTools.map((tool, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 10px",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "4px",
                      fontSize: "12px",
                      color: "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Icon name="tool" size={13} color="var(--accent-text)" />
                    <span>{tool}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
