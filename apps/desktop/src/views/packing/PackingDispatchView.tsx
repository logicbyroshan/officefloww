import React, { useState } from "react";
import { PackageType, TransportType, Delivery } from "@officefloww/api-types";
import { PackingService, DispatchService } from "../../api/services";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Tabs } from "../../design-system/components/Tabs";
import { Card, StatBox } from "../../design-system/components/Card";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";

interface MockPackItem {
  id: string;
  order_number: string;
  client_name: string;
  item_name: string;
  ordered_quantity: number;
  packed_quantity: number;
  package_count: number;
  stage: "READY_TO_PACK" | "PACKING" | "PACKED" | "READY_TO_DISPATCH" | "BOOKED" | "DISPATCHED" | "DELIVERED";
  courier_partner?: string;
  tracking_number?: string;
  expense_amount?: number;
}

const SEED_PACKING_ITEMS: MockPackItem[] = [
  {
    id: "pck-01",
    order_number: "ORD-2026-0001",
    client_name: "St. Xavier's High School",
    item_name: "Custom Student ID Cards (Fused PVC)",
    ordered_quantity: 2500,
    packed_quantity: 2500,
    package_count: 5,
    stage: "READY_TO_DISPATCH",
    courier_partner: "DTDC Express",
    tracking_number: "DTDC-8849102",
    expense_amount: 850.0,
  },
  {
    id: "pck-02",
    order_number: "ORD-2026-0001",
    client_name: "St. Xavier's High School",
    item_name: "Printed Satin Lanyards (20mm)",
    ordered_quantity: 2500,
    packed_quantity: 2500,
    package_count: 3,
    stage: "PACKED",
  },
  {
    id: "pck-03",
    order_number: "ORD-2026-0002",
    client_name: "Delhi Public School",
    item_name: "Annual Day Badges",
    ordered_quantity: 1000,
    packed_quantity: 400,
    package_count: 1,
    stage: "PACKING",
  },
];

export const PackingDispatchView: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [activeStage, setActiveStage] = useState<MockPackItem["stage"] | "ALL">("ALL");
  const [items, setItems] = useState<MockPackItem[]>(SEED_PACKING_ITEMS);

  // Pack Box Modal
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MockPackItem | null>(null);
  const [boxWeight, setBoxWeight] = useState(4.5);
  const [boxType, setBoxType] = useState<PackageType>(PackageType.CARTON);

  // Dispatch Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [carrier, setCarrier] = useState<TransportType>(TransportType.DTDC);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [deliveryCost, setDeliveryCost] = useState(350);
  const [loading, setLoading] = useState(false);

  const filteredItems = items.filter((i) => activeStage === "ALL" || i.stage === activeStage);

  const handlePackBox = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      setItems((prev) =>
        prev.map((itm) =>
          itm.id === selectedItem.id
            ? { ...itm, stage: "PACKED", package_count: itm.package_count + 1 }
            : itm
        )
      );
      success("Package Sealed", `Carton sealed (${boxWeight} kg). Item transitioned to PACKED.`);
      setIsPackModalOpen(false);
    } catch (err: any) {
      toastError("Failed to Pack", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      setItems((prev) =>
        prev.map((itm) =>
          itm.id === selectedItem.id
            ? {
                ...itm,
                stage: "DISPATCHED",
                courier_partner: carrier,
                tracking_number: trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
                expense_amount: deliveryCost,
              }
            : itm
        )
      );
      success("Dispatched via Logistics", `Consignment dispatched on ${carrier}. Recorded ₹${deliveryCost} courier expense.`);
      setIsDispatchModalOpen(false);
    } catch (err: any) {
      toastError("Dispatch Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = (item: MockPackItem) => {
    setItems((prev) =>
      prev.map((itm) => (itm.id === item.id ? { ...itm, stage: "DELIVERED" } : itm))
    );
    success("Delivery Confirmed", `Order ${item.order_number} marked DELIVERED to client recipient.`);
  };

  const columns: Column<MockPackItem>[] = [
    {
      key: "order_number",
      header: "Order & Client",
      render: (i) => (
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
            {i.order_number}
          </span>
          <div style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: 500 }}>
            {i.client_name}
          </div>
        </div>
      ),
    },
    {
      key: "item_name",
      header: "Job Line Item",
      render: (i) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{i.item_name}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Packed: {i.packed_quantity.toLocaleString()} / {i.ordered_quantity.toLocaleString()} pcs ({i.package_count} cartons)
          </div>
        </div>
      ),
    },
    {
      key: "stage",
      header: "Operational Stage",
      width: "160px",
      render: (i) => {
        let variant: "default" | "accent" | "success" | "warning" | "error" = "default";
        if (i.stage === "PACKED") variant = "accent";
        if (i.stage === "DISPATCHED") variant = "warning";
        if (i.stage === "DELIVERED") variant = "success";
        return <Badge variant={variant} dot>{i.stage.replace(/_/g, " ")}</Badge>;
      },
    },
    {
      key: "logistics",
      header: "Courier & Tracking",
      render: (i) => (
        <div style={{ fontSize: "11px" }}>
          {i.courier_partner ? (
            <span style={{ color: "var(--text-secondary)" }}>
              {i.courier_partner} ({i.tracking_number}) • ₹{i.expense_amount}
            </span>
          ) : (
            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Awaiting Carrier Booking</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      width: "180px",
      render: (i) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
          {i.stage === "READY_TO_PACK" || i.stage === "PACKING" ? (
            <Button
              size="sm"
              variant="outline"
              icon="package"
              onClick={() => {
                setSelectedItem(i);
                setIsPackModalOpen(true);
              }}
            >
              Pack Carton
            </Button>
          ) : i.stage === "PACKED" || i.stage === "READY_TO_DISPATCH" ? (
            <Button
              size="sm"
              variant="primary"
              icon="truck"
              onClick={() => {
                setSelectedItem(i);
                setIsDispatchModalOpen(true);
              }}
            >
              Book Courier
            </Button>
          ) : i.stage === "DISPATCHED" ? (
            <Button
              size="sm"
              variant="primary"
              icon="check-circle"
              onClick={() => handleMarkDelivered(i)}
            >
              Mark Delivered
            </Button>
          ) : (
            <Badge variant="success">Delivered</Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Packing Operations & Dispatch Logistics"
        subtitle="Linear fulfillment progression: Ready to Pack → Packing → Packed → Dispatch Booked → In Transit → Delivered."
      />

      <div style={{ padding: "16px 24px 0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
          <StatBox label="In Packing Floor" value={items.filter((i) => i.stage === "PACKING" || i.stage === "READY_TO_PACK").length} subValue="Carton Packing" icon="package" />
          <StatBox label="Packed & Sealed" value={items.filter((i) => i.stage === "PACKED" || i.stage === "READY_TO_DISPATCH").length} subValue="Ready to Ship" icon="check-circle" status="success" />
          <StatBox label="In Transit on Carrier" value={items.filter((i) => i.stage === "DISPATCHED").length} subValue="DTDC / Porter" icon="truck" status="warning" />
          <StatBox label="Delivered Successfully" value={items.filter((i) => i.stage === "DELIVERED").length} subValue="Client Signoff" icon="shield" status="success" />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "ALL", label: "All Consignments", icon: "orders", badge: items.length },
          { id: "READY_TO_PACK", label: "1. Ready to Pack", icon: "package" },
          { id: "PACKED", label: "2. Packed & Sealed", icon: "lock" },
          { id: "DISPATCHED", label: "3. Dispatched / In Transit", icon: "truck" },
          { id: "DELIVERED", label: "4. Delivered", icon: "check-circle" },
        ]}
        activeTab={activeStage}
        onChange={(tab) => setActiveStage(tab as any)}
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        <Table
          columns={columns}
          data={filteredItems}
          keyExtractor={(i) => i.id}
          emptyText="No items in this logistics stage."
        />
      </div>

      {/* Pack Carton Modal */}
      <Modal
        isOpen={isPackModalOpen}
        onClose={() => setIsPackModalOpen(false)}
        title="Seal Carton & Log Weight"
        subtitle={`Packing consignment for ${selectedItem?.order_number} (${selectedItem?.client_name})`}
        width={480}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPackModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" icon="check" onClick={handlePackBox} loading={loading}>
              Seal Box
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Select
            label="Package Container Type"
            options={[
              { label: "Corrugated Carton Box", value: PackageType.CARTON },
              { label: "Shrink-Wrapped Bundle", value: PackageType.BUNDLE },
              { label: "Heavy Duty Wooden Pallet", value: PackageType.PALLET },
              { label: "Document Courier Envelope", value: PackageType.ENVELOPE },
            ]}
            value={boxType}
            onChange={(e) => setBoxType(e.target.value as any)}
          />

          <Input
            label="Gross Package Weight (kg)"
            type="number"
            value={boxWeight}
            onChange={(e) => setBoxWeight(Number(e.target.value))}
            step="0.1"
            min={0.1}
          />

          <div style={{ padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)", fontSize: "11px", color: "var(--text-muted)" }}>
            ✓ Dual verification barcode scan required before sealing carton.
          </div>
        </div>
      </Modal>

      {/* Book Dispatch Modal */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Book Carrier Dispatch"
        subtitle={`Assign logistics partner and generate tracking docket for ${selectedItem?.order_number}`}
        width={480}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDispatchModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" icon="truck" onClick={handleDispatch} loading={loading}>
              Confirm Dispatch
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Select
            label="Transport Mode / Carrier Partner"
            options={[
              { label: "DTDC Express Courier", value: TransportType.DTDC },
              { label: "Local City Porter / Van", value: TransportType.PORTER },
              { label: "State Bus Parcel Cargo", value: TransportType.BUS },
              { label: "Third-Party Air Courier", value: TransportType.COURIER },
            ]}
            value={carrier}
            onChange={(e) => setCarrier(e.target.value as any)}
          />

          <Input
            label="Courier AWB / Tracking Docket #"
            placeholder="e.g. DTDC-992014"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />

          <Input
            label="Delivery / Freight Expense (₹)"
            type="number"
            value={deliveryCost}
            onChange={(e) => setDeliveryCost(Number(e.target.value))}
            min={0}
          />
        </div>
      </Modal>
    </div>
  );
};
