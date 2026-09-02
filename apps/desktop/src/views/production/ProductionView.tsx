import React, { useState } from "react";
import { ProductionBatch, BatchStatus, Machine } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Tabs } from "../../design-system/components/Tabs";
import { Card, StatBox } from "../../design-system/components/Card";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select } from "../../design-system/components/Input";
import { BatchDetailDrawer } from "./BatchDetailDrawer";
import { useToast } from "../../design-system/components/Toast";
import { Icon } from "../../design-system/components/Icon";

interface MachineFloorItem {
  id: string;
  code: string;
  name: string;
  type: string;
  status: "ONLINE" | "RUNNING" | "MAINTENANCE" | "IDLE";
  current_job: string;
  speed_units_per_hour: number;
}

const SEED_MACHINES: MachineFloorItem[] = [
  {
    id: "mch-01",
    code: "PRESS-UV-01",
    name: "Konica Minolta AccurioPress C4080 (Digital Press)",
    type: "DIGITAL_PRESS",
    status: "RUNNING",
    current_job: "Order #ORD-2026-0001 (PVC Cards)",
    speed_units_per_hour: 4800,
  },
  {
    id: "mch-02",
    code: "SUBLIM-HEAT-01",
    name: "Rotary Drum Sublimation Heat Calendar Press",
    type: "HEAT_TRANSFER",
    status: "RUNNING",
    current_job: "Order #ORD-2026-0001 (Satin Lanyards)",
    speed_units_per_hour: 1200,
  },
  {
    id: "mch-03",
    code: "CUTTER-ULTRA-01",
    name: "Automatic Ultrasonic Ribbon Cutter & Sealer",
    type: "POST_PRESS",
    status: "IDLE",
    current_job: "Queue Ready (Awaiting Lanyard Press Output)",
    speed_units_per_hour: 3000,
  },
  {
    id: "mch-04",
    code: "FUSING-PRESS-02",
    name: "Hydraulic Multi-Daylight PVC Card Laminator",
    type: "LAMINATION",
    status: "ONLINE",
    current_job: "Standby (Pre-Heating 140°C)",
    speed_units_per_hour: 2000,
  },
];

const SEED_BATCHES: ProductionBatch[] = [
  {
    id: "bat-01",
    batch_number: "BATCH-2026-0001",
    order_id: "ord-01",
    order_item_id: "item-01",
    product_id: "prod-01",
    machine_id: "PRESS-UV-01",
    operator_id: "machineop@officefloww.com",
    approved_file_version_id: "ver-pvc-approved",
    status: BatchStatus.IN_PROGRESS,
    input_quantity: 2500,
    output_quantity: 1800,
    reject_quantity: 45,
    waste_quantity: 20,
    created_at: "2026-09-02T10:00:00Z",
  },
  {
    id: "bat-02",
    batch_number: "BATCH-2026-0002",
    order_id: "ord-01",
    order_item_id: "item-02",
    product_id: "prod-02",
    machine_id: "SUBLIM-HEAT-01",
    operator_id: "machineop@officefloww.com",
    approved_file_version_id: "ver-lan-approved",
    status: BatchStatus.IN_PROGRESS,
    input_quantity: 2500,
    output_quantity: 2200,
    reject_quantity: 30,
    waste_quantity: 15,
    created_at: "2026-09-02T11:00:00Z",
  },
];

export const ProductionView: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"queue" | "batches" | "machines" | "scrap">("queue");
  const [batches, setBatches] = useState<ProductionBatch[]>(SEED_BATCHES);
  const [machines] = useState<MachineFloorItem[]>(SEED_MACHINES);
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);

  // New Batch Modal
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(machines[0].code);
  const [inputQty, setInputQty] = useState(1000);
  const [loading, setLoading] = useState(false);

  const totalInput = batches.reduce((sum, b) => sum + b.input_quantity, 0);
  const totalOutput = batches.reduce((sum, b) => sum + b.output_quantity, 0);
  const totalScrap = batches.reduce((sum, b) => sum + b.reject_quantity + b.waste_quantity, 0);
  const overallScrapRate = totalOutput + totalScrap > 0 ? (totalScrap / (totalOutput + totalScrap)) * 100 : 0;

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newBatch: ProductionBatch = {
        id: `bat-0${batches.length + 1}`,
        batch_number: `BATCH-2026-000${batches.length + 1}`,
        order_id: "ord-01",
        order_item_id: "item-01",
        product_id: "prod-01",
        machine_id: selectedMachine,
        operator_id: "machineop@officefloww.com",
        approved_file_version_id: "ver-pvc-approved",
        status: BatchStatus.IN_PROGRESS,
        input_quantity: inputQty,
        output_quantity: 0,
        reject_quantity: 0,
        waste_quantity: 0,
        created_at: new Date().toISOString(),
      };

      setBatches((prev) => [newBatch, ...prev]);
      success("Batch Created", `Instantiated production run ${newBatch.batch_number} on ${selectedMachine}`);
      setIsNewBatchModalOpen(false);
    } catch (err: any) {
      toastError("Failed to Create Batch", err.message);
    } finally {
      setLoading(false);
    }
  };

  const batchColumns: Column<ProductionBatch>[] = [
    {
      key: "batch_number",
      header: "Batch Run #",
      width: "160px",
      render: (b) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          {b.batch_number}
        </span>
      ),
    },
    {
      key: "machine_id",
      header: "Assigned Machine",
      render: (b) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{b.machine_id}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Operator: {b.operator_id} • File: 🔒 Locked
          </div>
        </div>
      ),
    },
    {
      key: "input_quantity",
      header: "Input Qty",
      align: "right",
      width: "110px",
      render: (b) => (
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          {b.input_quantity.toLocaleString()}
        </span>
      ),
    },
    {
      key: "output_quantity",
      header: "Good Output",
      align: "right",
      width: "120px",
      render: (b) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--status-success)" }}>
          {b.output_quantity.toLocaleString()}
        </span>
      ),
    },
    {
      key: "reject_quantity",
      header: "Defect / Scrap",
      align: "right",
      width: "120px",
      render: (b) => (
        <span style={{ fontFamily: "var(--font-mono)", color: b.reject_quantity > 0 ? "var(--status-error)" : "var(--text-muted)" }}>
          +{b.reject_quantity + b.waste_quantity}
        </span>
      ),
    },
    {
      key: "status",
      header: "Run State",
      width: "130px",
      render: (b) => (
        <Badge variant={b.status === BatchStatus.COMPLETED ? "success" : "accent"} dot>
          {b.status}
        </Badge>
      ),
    },
  ];

  const machineColumns: Column<MachineFloorItem>[] = [
    {
      key: "code",
      header: "Machine ID",
      width: "150px",
      render: (m) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          {m.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Equipment Title & Work Type",
      render: (m) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{m.name}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Type: {m.type}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Floor Status",
      width: "130px",
      render: (m) => {
        let variant: "success" | "accent" | "warning" | "default" = "default";
        if (m.status === "RUNNING") variant = "success";
        if (m.status === "ONLINE") variant = "accent";
        if (m.status === "MAINTENANCE") variant = "warning";
        return <Badge variant={variant} dot>{m.status}</Badge>;
      },
    },
    {
      key: "current_job",
      header: "Active Running Job",
      render: (m) => <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{m.current_job}</span>,
    },
    {
      key: "speed",
      header: "Rated Speed",
      align: "right",
      width: "140px",
      render: (m) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
          {m.speed_units_per_hour.toLocaleString()} / hr
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Production Engine, Batches & Machine Floor"
        subtitle="Machine allocation, digital press queue, run output tracking, and scrap reconciliation."
        primaryAction={{
          label: "Allocate Production Batch",
          icon: "plus",
          onClick: () => setIsNewBatchModalOpen(true),
        }}
      />

      <div style={{ padding: "16px 24px 0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
          <StatBox label="Active Press Batches" value={batches.length} subValue="On Machine Floor" icon="production" />
          <StatBox label="Good Units Produced" value={totalOutput.toLocaleString()} subValue="Passed QC" icon="check-circle" status="success" />
          <StatBox label="Total Scrap Units" value={totalScrap.toLocaleString()} subValue="Defective / Trim Waste" icon="alert-circle" status={totalScrap > 50 ? "urgent" : "normal"} />
          <StatBox
            label="Overall Scrap Rate"
            value={`${overallScrapRate.toFixed(1)}%`}
            subValue="Target: <3.0%"
            icon="activity"
            status={overallScrapRate > 3 ? "warning" : "success"}
          />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "queue", label: "Production Queue & Batches", icon: "production", badge: batches.length },
          { id: "machines", label: "Machines Floor Grid", icon: "tool", badge: machines.length },
          { id: "scrap", label: "Scrap & Waste Breakdown", icon: "alert-triangle" },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {activeTab === "queue" && (
          <Table
            columns={batchColumns}
            data={batches}
            keyExtractor={(b) => b.id}
            onRowClick={(b) => setSelectedBatch(b)}
            emptyText="No production batches active."
          />
        )}

        {activeTab === "machines" && (
          <Table
            columns={machineColumns}
            data={machines}
            keyExtractor={(m) => m.id}
            emptyText="No machines registered."
          />
        )}

        {activeTab === "scrap" && (
          <Card title="Press & Printing Scrap Analysis" subtitle="Root-cause defect tracking across digital press and heat calendar runs">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ padding: "12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Press Alignment Defect (PVC Core)</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>45 sheets discarded due to registration drift during test pull.</div>
                <div style={{ fontSize: "11px", color: "var(--status-error)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>Scrap Cost: ₹189.00</div>
              </div>

              <div style={{ padding: "12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Sublimation Color Bleed (Satin Ribbon)</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>30 meters lost during heat transfer temperature calibration (195°C).</div>
                <div style={{ fontSize: "11px", color: "var(--status-warning)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>Scrap Cost: ₹54.00</div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <BatchDetailDrawer
        batch={selectedBatch}
        isOpen={Boolean(selectedBatch)}
        onClose={() => setSelectedBatch(null)}
        onUpdated={() => {}}
      />

      {/* New Batch Modal */}
      <Modal
        isOpen={isNewBatchModalOpen}
        onClose={() => setIsNewBatchModalOpen(false)}
        title="Allocate Production Batch"
        subtitle="Assign order line items to floor machines and verify approved artwork lock"
        width={500}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNewBatchModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateBatch} loading={loading}>
              Instantiate Batch Run
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateBatch} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Select
            label="Target Equipment"
            options={machines.map((m) => ({ label: `${m.code} — ${m.name}`, value: m.code }))}
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
          />

          <Input
            label="Input Raw Material Quantity"
            type="number"
            value={inputQty}
            onChange={(e) => setInputQty(Number(e.target.value))}
            min={1}
            required
          />

          <div style={{ padding: "10px", backgroundColor: "var(--accent-soft)", borderRadius: "var(--radius-xs)", fontSize: "11px", color: "var(--accent-text)" }}>
            🔒 Artwork Proof Lock Verified: Only approved artwork file versions can be assigned to active machines.
          </div>
        </form>
      </Modal>
    </div>
  );
};
