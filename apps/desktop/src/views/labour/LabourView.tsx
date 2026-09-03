import React, { useState } from "react";
import { Icon } from "../../design-system/components/Icon";
import { Button } from "../../design-system/components/Button";
import { Modal } from "../../design-system/components/Modal";
import { Input } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";
import { LabourDetailProfileView } from "./LabourDetailProfileView";

export interface LabourBatchHandover {
  batchNumber: string;
  clientName: string;
  quantityGiven: number;
  quantityReturned: number;
  status: "IN_PROGRESS" | "COMPLETED";
}

export interface LabourContractor {
  id: string;
  name: string;
  phone: string;
  email: string;
  workstation: string;
  activeTask: string;
  status: "ACTIVE" | "STANDBY";
  pieceRate: number; // e.g. 1.50 per lanyard assembled
  lanyardsGiven: number;
  assembledReturned: number;
  pendingAssembly: number;
  amountDue: number;
  batches: LabourBatchHandover[];
}

const INITIAL_LABOUR: LabourContractor[] = [
  {
    id: "lab-1",
    name: "Ramesh Lanyard Stitching Unit",
    phone: "+91 98200 44551",
    email: "ramesh.labour@adharshbhopal.in",
    workstation: "Table 02 (Plant South)",
    activeTask: "Batch #LN-401: 1,500 Satin Lanyards Ring Stitching (Northwind)",
    status: "ACTIVE",
    pieceRate: 1.5,
    lanyardsGiven: 2500,
    assembledReturned: 2000,
    pendingAssembly: 500,
    amountDue: 3000.0,
    batches: [
      { batchNumber: "Batch #LN-401", clientName: "Northwind Coffee", quantityGiven: 1500, quantityReturned: 1500, status: "COMPLETED" },
      { batchNumber: "Batch #LN-402", clientName: "Govt Engineering College", quantityGiven: 500, quantityReturned: 500, status: "COMPLETED" },
      { batchNumber: "Batch #LN-403", clientName: "BHEL Township", quantityGiven: 500, quantityReturned: 0, status: "IN_PROGRESS" },
    ],
  },
  {
    id: "lab-2",
    name: "Suresh Badge Assembly Workshop",
    phone: "+91 98200 44552",
    email: "suresh.badge@adharshbhopal.in",
    workstation: "Pin Press Table 01",
    activeTask: "Batch #BD-204: 1,000 PVC Round Badges Pinning & Film Pressing",
    status: "ACTIVE",
    pieceRate: 1.2,
    lanyardsGiven: 1000,
    assembledReturned: 800,
    pendingAssembly: 200,
    amountDue: 960.0,
    batches: [
      { batchNumber: "Batch #BD-204", clientName: "St. Xavier's High School", quantityGiven: 1000, quantityReturned: 800, status: "IN_PROGRESS" },
    ],
  },
  {
    id: "lab-3",
    name: "Kailash Heat Sublimation Lab",
    phone: "+91 98200 44553",
    email: "kailash.sub@adharshbhopal.in",
    workstation: "Sublimation Line B",
    activeTask: "Batch #LN-408: 2,000 Multicolor Satin Lanyard Thermal Transfer",
    status: "ACTIVE",
    pieceRate: 1.8,
    lanyardsGiven: 2000,
    assembledReturned: 1600,
    pendingAssembly: 400,
    amountDue: 2880.0,
    batches: [
      { batchNumber: "Batch #LN-408", clientName: "AIIMS Bhopal", quantityGiven: 2000, quantityReturned: 1600, status: "IN_PROGRESS" },
    ],
  },
  {
    id: "lab-4",
    name: "Pooja Manual Pack & Clip Crew",
    phone: "+91 98200 44554",
    email: "pooja.packing@adharshbhopal.in",
    workstation: "Packing Table 04",
    activeTask: "Standby for Evening Lanyard Batch Staging",
    status: "STANDBY",
    pieceRate: 0.9,
    lanyardsGiven: 500,
    assembledReturned: 500,
    pendingAssembly: 0,
    amountDue: 450.0,
    batches: [
      { batchNumber: "Batch #PK-102", clientName: "Adharsh Central", quantityGiven: 500, quantityReturned: 500, status: "COMPLETED" },
    ],
  },
];

export const LabourView: React.FC = () => {
  const { success } = useToast();
  const [labourList, setLabourList] = useState<LabourContractor[]>(INITIAL_LABOUR);
  const [selectedContractor, setSelectedContractor] = useState<LabourContractor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "STANDBY">("ALL");

  // Onboard Modal
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newStation, setNewStation] = useState("");
  const [newRate, setNewRate] = useState("1.50");
  const [newTask, setNewTask] = useState("");

  // Material Issue Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueTargetContractor, setIssueTargetContractor] = useState<LabourContractor | null>(null);
  const [issueQuantity, setIssueQuantity] = useState("500");
  const [issueClient, setIssueClient] = useState("Northwind Coffee");

  // One-click copy
  const handleCopy = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    success("Copied to Clipboard", `${label} "${text}" copied.`);
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newContractor: LabourContractor = {
      id: `lab-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim() || "+91 98200 00000",
      email: `${newName.toLowerCase().replace(/\s+/g, ".")}@adharshbhopal.in`,
      workstation: newStation.trim() || "Table 03 (Plant Floor)",
      activeTask: newTask.trim() || "Allocated initial assembly queue",
      status: "ACTIVE",
      pieceRate: parseFloat(newRate) || 1.5,
      lanyardsGiven: 500,
      assembledReturned: 0,
      pendingAssembly: 500,
      amountDue: 0,
      batches: [
        {
          batchNumber: `Batch #LN-${Math.floor(400 + Math.random() * 100)}`,
          clientName: "Northwind Coffee",
          quantityGiven: 500,
          quantityReturned: 0,
          status: "IN_PROGRESS",
        },
      ],
    };

    setLabourList([newContractor, ...labourList]);
    setShowOnboardModal(false);
    setNewName("");
    setNewPhone("");
    setNewStation("");
    setNewTask("");
    success("Labour Onboarded", `${newContractor.name} added to piece-rate roster.`);
  };

  const handleIssueMaterialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTargetContractor) return;

    const qty = parseInt(issueQuantity) || 500;
    setLabourList((prev) =>
      prev.map((c) =>
        c.id === issueTargetContractor.id
          ? {
              ...c,
              lanyardsGiven: c.lanyardsGiven + qty,
              pendingAssembly: c.pendingAssembly + qty,
              status: "ACTIVE",
              batches: [
                ...c.batches,
                {
                  batchNumber: `Batch #LN-${Math.floor(500 + Math.random() * 100)}`,
                  clientName: issueClient,
                  quantityGiven: qty,
                  quantityReturned: 0,
                  status: "IN_PROGRESS",
                },
              ],
            }
          : c
      )
    );

    setShowIssueModal(false);
    success("Materials Issued", `Issued ${qty} raw lanyards to ${issueTargetContractor.name}.`);
  };

  // If contractor selected, render detail profile view
  if (selectedContractor) {
    const currentData = labourList.find((c) => c.id === selectedContractor.id) || selectedContractor;
    return (
      <LabourDetailProfileView
        contractor={currentData}
        onBack={() => setSelectedContractor(null)}
      />
    );
  }

  // Filtered Contractors
  const filtered = labourList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.activeTask.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.workstation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" && c.status === "ACTIVE") ||
      (filterStatus === "STANDBY" && c.status === "STANDBY");
    return matchesSearch && matchesFilter;
  });

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
        backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(168, 85, 247, 0.04), transparent)",
        color: "#e2e8f0",
      }}
    >
      {/* STICKY TOP HEADER BAR */}
      <div
        style={{
          padding: "14px 28px",
          backgroundColor: "rgba(14, 18, 28, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          position: "sticky",
          top: 0,
          zIndex: 30,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Left: Counter badge & filter pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "2px",
              backgroundColor: "rgba(168, 85, 247, 0.15)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              color: "#c084fc",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <span>■</span>
            <span>{labourList.length} Task-Based Labour Contractors</span>
          </span>

          <div style={{ display: "flex", gap: "4px", backgroundColor: "rgba(0,0,0,0.3)", padding: "3px", borderRadius: "2px" }}>
            {[
              { id: "ALL" as const, label: `All (${labourList.length})` },
              { id: "ACTIVE" as const, label: `On Floor (${labourList.filter((c) => c.status === "ACTIVE").length})` },
              { id: "STANDBY" as const, label: `Standby (${labourList.filter((c) => c.status === "STANDBY").length})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "2px",
                  border: "none",
                  backgroundColor: filterStatus === f.id ? "rgba(168, 85, 247, 0.2)" : "transparent",
                  color: filterStatus === f.id ? "#c084fc" : "var(--text-muted)",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Search + Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "2px",
              padding: "0 12px",
              height: "38px",
              width: "300px",
            }}
          >
            <Icon name="search" size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search labour by workshop, task, station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "12.5px",
                width: "100%",
              }}
            />
          </div>

          <Button
            variant="secondary"
            size="md"
            icon="package"
            style={{ borderRadius: "2px" }}
            onClick={() => {
              setIssueTargetContractor(labourList[0]);
              setShowIssueModal(true);
            }}
          >
            Issue Materials
          </Button>

          <Button
            variant="primary"
            size="md"
            icon="plus"
            style={{
              borderRadius: "2px",
              backgroundColor: "var(--accent)",
              backgroundImage: "linear-gradient(135deg, #ff8a73 0%, #ea580c 100%)",
              border: "none",
            }}
            onClick={() => setShowOnboardModal(true)}
          >
            + Onboard Labour
          </Button>
        </div>
      </div>

      {/* CARDS GRID AREA */}
      <div style={{ padding: "26px 32px", display: "flex", flexDirection: "column", gap: "24px", width: "100%", boxSizing: "border-box" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))",
            gap: "20px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {filtered.map((c) => {
            const isFinished = c.pendingAssembly === 0;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedContractor(c)}
                style={{
                  backgroundColor: "rgba(18, 23, 35, 0.75)",
                  backdropFilter: "blur(18px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "3px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.4)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "3px",
                        background: "linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.05) 100%)",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "#c084fc",
                        fontFamily: "var(--font-mono)",
                        flexShrink: 0,
                      }}
                    >
                      {c.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <h3 style={{ margin: 0, fontSize: "16.5px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.2px" }}>
                        {c.name}
                      </h3>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Task-Based Contract • ₹{c.pieceRate.toFixed(2)}/unit
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
                      backgroundColor: c.status === "ACTIVE" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                      border: "1px solid " + (c.status === "ACTIVE" ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"),
                      color: c.status === "ACTIVE" ? "#34d399" : "#f59e0b",
                      fontSize: "11px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ width: "5px", height: "5px", borderRadius: "1px", backgroundColor: c.status === "ACTIVE" ? "#10b981" : "#f59e0b" }} />
                    {c.status === "ACTIVE" ? "On Floor Assembly" : "Standby"}
                  </span>
                </div>

                {/* Active Task Allocation Box */}
                <div
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.22)",
                    borderRadius: "2px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase" }}>
                    Current Batch Hired For:
                  </span>
                  <strong style={{ fontSize: "12.5px", color: "#fff", lineHeight: 1.3 }}>
                    {c.activeTask}
                  </strong>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    <Icon name="map-pin" size={12} color="#c084fc" />
                    <span>Station: {c.workstation}</span>
                  </div>
                </div>

                {/* Material & Assembly Metrics Strip */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "2px",
                    padding: "10px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Given</span>
                    <strong style={{ fontSize: "15px", color: "#fff", fontFamily: "var(--font-mono)" }}>
                      {c.lanyardsGiven}u
                    </strong>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "8px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Done</span>
                    <strong style={{ fontSize: "15px", color: "#10b981", fontFamily: "var(--font-mono)" }}>
                      {c.assembledReturned}u
                    </strong>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "8px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Pending</span>
                    <strong style={{ fontSize: "15px", color: isFinished ? "#10b981" : "#f59e0b", fontFamily: "var(--font-mono)" }}>
                      {c.pendingAssembly}u
                    </strong>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "8px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Payable</span>
                    <strong style={{ fontSize: "15px", color: "#a855f7", fontFamily: "var(--font-mono)" }}>
                      ₹{c.amountDue.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Footer with One-Click Phone Copy & Action Button */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "6px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <div
                    onClick={(e) => handleCopy(c.phone, "Labour Phone", e)}
                    title="Click to copy phone number"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: "4px 6px",
                      borderRadius: "2px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <Icon name="phone" size={13} color="#f59e0b" />
                    <span style={{ fontFamily: "var(--font-mono)" }}>{c.phone}</span>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>• Copy</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContractor(c);
                    }}
                    style={{
                      height: "32px",
                      padding: "0 14px",
                      borderRadius: "2px",
                      backgroundColor: "rgba(168, 85, 247, 0.12)",
                      border: "1px solid rgba(168, 85, 247, 0.3)",
                      color: "#c084fc",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#7e22ce";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.12)";
                      e.currentTarget.style.color = "#c084fc";
                    }}
                  >
                    <span>View Profile & Ledger</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: ONBOARD LABOUR CONTRACTOR */}
      {showOnboardModal && (
        <Modal
          isOpen={showOnboardModal}
          onClose={() => setShowOnboardModal(false)}
          title="Onboard Task-Based Labour Contractor"
        >
          <form onSubmit={handleOnboardSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Input
              label="Contractor / Workshop Name"
              placeholder="e.g. Ramesh Lanyard Stitching Unit"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <Input
              label="Contact Phone Number"
              placeholder="+91 98200 44551"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              required
            />
            <Input
              label="Assigned Table / Workstation"
              placeholder="e.g. Table 03 (Plant Floor South)"
              value={newStation}
              onChange={(e) => setNewStation(e.target.value)}
            />
            <Input
              label="Agreed Piece Rate (₹ per lanyard/unit assembled)"
              type="number"
              step="0.1"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              required
            />
            <Input
              label="Initial Task Allocation"
              placeholder="e.g. Batch #LN-405: 1,000 Satin Lanyards Sublimation"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <Button variant="secondary" size="md" style={{ borderRadius: "2px" }} onClick={() => setShowOnboardModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" style={{ borderRadius: "2px" }}>
                Confirm Onboarding
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: ISSUE RAW MATERIALS TO CONTRACTOR */}
      {showIssueModal && (
        <Modal
          isOpen={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          title="Issue Raw Materials & Lanyards to Contractor"
        >
          <form onSubmit={handleIssueMaterialsSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Target Contractor</label>
              <select
                value={issueTargetContractor?.id || ""}
                onChange={(e) => {
                  const c = labourList.find((item) => item.id === e.target.value);
                  if (c) setIssueTargetContractor(c);
                }}
                style={{
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "2px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  fontSize: "13px",
                }}
              >
                {labourList.map((c) => (
                  <option key={c.id} value={c.id} style={{ backgroundColor: "#131722" }}>
                    {c.name} ({c.workstation})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Order Client Name"
              value={issueClient}
              onChange={(e) => setIssueClient(e.target.value)}
              required
            />

            <Input
              label="Quantity to Hand Over (Units/Lanyards)"
              type="number"
              value={issueQuantity}
              onChange={(e) => setIssueQuantity(e.target.value)}
              required
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <Button variant="secondary" size="md" style={{ borderRadius: "2px" }} onClick={() => setShowIssueModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" style={{ borderRadius: "2px" }}>
                Issue Stock & Record Batch
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
