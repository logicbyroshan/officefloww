import React, { useState } from "react";
import { Labourer, LabourType } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Tabs } from "../../design-system/components/Tabs";
import { Card, StatBox } from "../../design-system/components/Card";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select } from "../../design-system/components/Input";
import { LabourDetailDrawer, LabourDetailRecord } from "./LabourDetailDrawer";
import { useToast } from "../../design-system/components/Toast";

const SEED_LABOUR_DETAILS: LabourDetailRecord[] = [
  {
    id: "lab-01",
    name: "Ramesh Lanyard Stitching Unit",
    phone: "+91 98200 44551",
    labour_type: LabourType.OUTSIDE_CONTRACT,
    current_work: "Fitting 20mm Dog Hooks onto Printed Lanyards",
    assigned_quantity: 2500,
    accepted_quantity: 2000,
    rejected_quantity: 25,
    material_held: 300,
    material_issued: 2800,
    material_consumed: 2025,
    material_returned: 475,
    rate_per_unit: 1.50,
    amount_due: 3000.0,
  },
  {
    id: "lab-02",
    name: "Suresh Badge Assembly Workshop",
    phone: "+91 98200 44552",
    labour_type: LabourType.OUTSIDE_CONTRACT,
    current_work: "Mounting Pin Backs on Custom PVC Badges",
    assigned_quantity: 1000,
    accepted_quantity: 800,
    rejected_quantity: 10,
    material_held: 50,
    material_issued: 850,
    material_consumed: 810,
    material_returned: 0,
    rate_per_unit: 1.20,
    amount_due: 960.0,
  },
  {
    id: "lab-03",
    name: "Meena Assembly Team",
    phone: "+91 98200 44553",
    labour_type: LabourType.IN_HOUSE_WORKER,
    current_work: "In-House Card Punching & Slit Fitting",
    assigned_quantity: 5000,
    accepted_quantity: 5000,
    rejected_quantity: 0,
    material_held: 0,
    material_issued: 0,
    material_consumed: 0,
    material_returned: 0,
    rate_per_unit: 0.0,
    amount_due: 0.0,
  },
];

export const LabourView: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"contractors" | "wallet" | "payouts" | "tools">("contractors");
  const [labourers, setLabourers] = useState<LabourDetailRecord[]>(SEED_LABOUR_DETAILS);
  const [selectedLabourer, setSelectedLabourer] = useState<LabourDetailRecord | null>(null);

  // New Contractor Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [contractorName, setContractorName] = useState("");
  const [contractorPhone, setContractorPhone] = useState("");
  const [contractorType, setContractorType] = useState<LabourType>(LabourType.OUTSIDE_CONTRACT);
  const [loading, setLoading] = useState(false);

  const totalPayable = labourers.reduce((sum, l) => sum + l.amount_due, 0);
  const totalMaterialHeld = labourers.reduce((sum, l) => sum + l.material_held, 0);

  const handleCreateContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorName.trim()) return;
    setLoading(true);
    try {
      const newRec: LabourDetailRecord = {
        id: `lab-0${labourers.length + 1}`,
        name: contractorName.trim(),
        phone: contractorPhone.trim() || "+91 98000 00000",
        labour_type: contractorType,
        current_work: "Available for Floor Assembly",
        assigned_quantity: 0,
        accepted_quantity: 0,
        rejected_quantity: 0,
        material_held: 0,
        material_issued: 0,
        material_consumed: 0,
        material_returned: 0,
        rate_per_unit: 1.50,
        amount_due: 0.0,
      };

      setLabourers((prev) => [...prev, newRec]);
      success("Contractor Onboarded", `Registered ${newRec.name} into labour registry.`);
      setIsNewModalOpen(false);
      setContractorName("");
      setContractorPhone("");
    } catch (err: any) {
      toastError("Failed to Create Contractor", err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<LabourDetailRecord>[] = [
    {
      key: "name",
      header: "Contractor / Worker Team",
      render: (l) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{l.name}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{l.phone}</div>
        </div>
      ),
    },
    {
      key: "labour_type",
      header: "Worker Type",
      width: "160px",
      render: (l) => (
        <Badge variant={l.labour_type === LabourType.OUTSIDE_CONTRACT ? "accent" : "default"}>
          {l.labour_type.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "current_work",
      header: "Active Operation",
      render: (l) => <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{l.current_work}</span>,
    },
    {
      key: "material_held",
      header: "Material Wallet (Held)",
      width: "160px",
      render: (l) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-text)", fontWeight: 700 }}>
          {l.material_held} pcs held
        </span>
      ),
    },
    {
      key: "amount_due",
      header: "Amount Due (Accepted)",
      align: "right",
      width: "160px",
      render: (l) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
          ₹{l.amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Labour Management, Piece Rates & Material Wallet"
        subtitle="Piece-rate assembly directory, company-owned hardware tracking, and strictly verified accepted payouts."
        primaryAction={{
          label: "Onboard Contractor",
          icon: "plus",
          onClick: () => setIsNewModalOpen(true),
        }}
      />

      <div style={{ padding: "16px 24px 0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
          <StatBox label="Active Contractors" value={labourers.length} subValue="Workshops & In-House" icon="users" />
          <StatBox label="Company Hardware Held" value={`${totalMaterialHeld} Pieces`} subValue="Material Wallet Credit" icon="tool" />
          <StatBox label="Pending Piece-Rate Payouts" value={`₹${totalPayable.toFixed(2)}`} subValue="Strict Accepted Output" icon="credit-card" status={totalPayable > 0 ? "warning" : "normal"} />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "contractors", label: "Contractors Directory", icon: "users", badge: labourers.length },
          { id: "wallet", label: "Material Credit Wallet", icon: "stock" },
          { id: "payouts", label: "Accepted Piece Payouts", icon: "credit-card" },
          { id: "tools", label: "Tools & Equipment", icon: "tool" },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        <Table
          columns={columns}
          data={labourers}
          keyExtractor={(l) => l.id}
          onRowClick={(l) => setSelectedLabourer(l)}
          emptyText="No contractors configured."
        />
      </div>

      <LabourDetailDrawer
        labourer={selectedLabourer}
        isOpen={Boolean(selectedLabourer)}
        onClose={() => setSelectedLabourer(null)}
        onUpdated={() => {}}
      />

      {/* Onboard Contractor Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Onboard Outside Contractor"
        subtitle="Register outside workshop team for piece-rate lanyard stitching & badge assembly"
        width={480}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNewModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateContractor} loading={loading}>
              Register Contractor
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateContractor} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Input
            label="Contractor Name / Unit Title"
            placeholder="e.g. Ramesh Lanyard Stitching Unit"
            value={contractorName}
            onChange={(e) => setContractorName(e.target.value)}
            required
          />

          <Input
            label="Contact Phone"
            placeholder="+91 98200 44551"
            value={contractorPhone}
            onChange={(e) => setContractorPhone(e.target.value)}
          />

          <Select
            label="Worker Classification"
            options={[
              { label: "Outside Contractor (Piece-Rate)", value: LabourType.OUTSIDE_CONTRACT },
              { label: "In-House Worker (Floor Staff)", value: LabourType.IN_HOUSE_WORKER },
            ]}
            value={contractorType}
            onChange={(e) => setContractorType(e.target.value as any)}
          />
        </form>
      </Modal>
    </div>
  );
};
