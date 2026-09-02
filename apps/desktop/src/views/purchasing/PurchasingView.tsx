import React, { useState } from "react";
import { Supplier, PurchaseOrder, POStatus } from "@officefloww/api-types";
import { PurchasingService } from "../../api/services";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Tabs } from "../../design-system/components/Tabs";
import { Card, StatBox } from "../../design-system/components/Card";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select, Textarea } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";

interface MockSupplier {
  id: string;
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  materials_supplied: string;
  rating: string;
}

const SEED_SUPPLIERS: MockSupplier[] = [
  {
    id: "sup-01",
    code: "SUP-POLY-01",
    name: "Apex Polymers & PVC Sheets Ltd.",
    contact_person: "Vikas Aggarwal",
    phone: "+91 98110 55441",
    email: "orders@apexpolymers.in",
    materials_supplied: "PVC Core Sheets, Polycarbonate Overlays",
    rating: "PREMIUM (99% on-time)",
  },
  {
    id: "sup-02",
    code: "SUP-TEXTILE-02",
    name: "Surat Satin Ribbons & Webbing Mill",
    contact_person: "Ketan Patel",
    phone: "+91 98250 88772",
    email: "sales@suratribbon.com",
    materials_supplied: "Polyester Satin Ribbon, Cotton Lanyard Tape",
    rating: "EXCELLENT",
  },
  {
    id: "sup-03",
    code: "SUP-HARDWARE-03",
    name: "Global Metal Fittings & Dog-Hooks Co.",
    contact_person: "Sunil Jain",
    phone: "+91 98200 33221",
    email: "info@globalhardware.in",
    materials_supplied: "Dog Hooks, Alligator Clips, Breakaway Buckles",
    rating: "EXCELLENT",
  },
];

interface MockPO {
  id: string;
  po_number: string;
  supplier_name: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: POStatus;
  created_at: string;
}

const SEED_POS: MockPO[] = [
  {
    id: "po-01",
    po_number: "PO-2026-0001",
    supplier_name: "Apex Polymers & PVC Sheets Ltd.",
    item_description: "0.76mm Gloss White PVC Core Sheet (25,000 Sheets)",
    quantity: 25000,
    unit_price: 4.20,
    total_amount: 105000.0,
    status: POStatus.RECEIVED,
    created_at: "2026-08-25",
  },
  {
    id: "po-02",
    po_number: "PO-2026-0002",
    supplier_name: "Global Metal Fittings & Dog-Hooks Co.",
    item_description: "Plastic Quick-Release Safety Breakaway Buckle (5,000 Pcs)",
    quantity: 5000,
    unit_price: 1.50,
    total_amount: 7500.0,
    status: POStatus.ORDERED,
    created_at: "2026-09-01",
  },
];

export const PurchasingView: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"pos" | "suppliers" | "price_trends">("pos");
  const [suppliers, setSuppliers] = useState<MockSupplier[]>(SEED_SUPPLIERS);
  const [pos, setPos] = useState<MockPO[]>(SEED_POS);

  // New PO Modal
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(SEED_SUPPLIERS[0].id);
  const [poItemDesc, setPoItemDesc] = useState("");
  const [poQty, setPoQty] = useState(1000);
  const [poUnitPrice, setPoUnitPrice] = useState(2.5);
  const [loading, setLoading] = useState(false);

  // New Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supMaterials, setSupMaterials] = useState("");

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sup = suppliers.find((s) => s.id === selectedSupplierId);
      const newPO: MockPO = {
        id: `po-0${pos.length + 1}`,
        po_number: `PO-2026-000${pos.length + 1}`,
        supplier_name: sup?.name || "Supplier",
        item_description: poItemDesc || "Material Replenishment",
        quantity: poQty,
        unit_price: poUnitPrice,
        total_amount: poQty * poUnitPrice,
        status: POStatus.ORDERED,
        created_at: new Date().toISOString().split("T")[0],
      };

      setPos((prev) => [newPO, ...prev]);
      success("Purchase Order Issued", `Generated ${newPO.po_number} (₹${newPO.total_amount.toLocaleString()})`);
      setIsPOModalOpen(false);
      setPoItemDesc("");
    } catch (err: any) {
      toastError("PO Creation Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    setLoading(true);
    try {
      const newSup: MockSupplier = {
        id: `sup-0${suppliers.length + 1}`,
        code: `SUP-${supName.slice(0, 4).toUpperCase()}-0${suppliers.length + 1}`,
        name: supName.trim(),
        contact_person: supContact.trim() || "Account Manager",
        phone: supPhone.trim() || "+91 98000 00000",
        email: supEmail.trim() || "vendor@supply.com",
        materials_supplied: supMaterials.trim() || "General Consumables",
        rating: "VERIFIED",
      };

      setSuppliers((prev) => [...prev, newSup]);
      success("Supplier Registered", `Onboarded ${newSup.name} into vendor directory.`);
      setIsSupplierModalOpen(false);
      setSupName("");
    } catch (err: any) {
      toastError("Supplier Creation Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const poColumns: Column<MockPO>[] = [
    {
      key: "po_number",
      header: "PO Number",
      width: "140px",
      render: (p) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          {p.po_number}
        </span>
      ),
    },
    {
      key: "supplier_name",
      header: "Vendor & Material Item",
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.supplier_name}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{p.item_description}</div>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Ordered Qty",
      align: "right",
      width: "120px",
      render: (p) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
          {p.quantity.toLocaleString()}
        </span>
      ),
    },
    {
      key: "total_amount",
      header: "Gross Total",
      align: "right",
      width: "130px",
      render: (p) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
          ₹{p.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "status",
      header: "PO State",
      width: "120px",
      render: (p) => (
        <Badge variant={p.status === POStatus.RECEIVED ? "success" : "warning"} dot>
          {p.status}
        </Badge>
      ),
    },
  ];

  const supplierColumns: Column<MockSupplier>[] = [
    {
      key: "code",
      header: "Vendor Code",
      width: "140px",
      render: (s) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          {s.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Supplier Company Name",
      render: (s) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Supplies: {s.materials_supplied}
          </div>
        </div>
      ),
    },
    {
      key: "contact_person",
      header: "Contact Info",
      render: (s) => (
        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {s.contact_person} • {s.phone}
        </div>
      ),
    },
    {
      key: "rating",
      header: "Vendor Rating",
      width: "160px",
      render: (s) => <Badge variant="success">{s.rating}</Badge>,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Purchasing, Suppliers & Material Reorders"
        subtitle="Purchase order procurement, vendor quality tracking, and raw material receipt logs."
        primaryAction={{
          label: "Issue Purchase Order",
          icon: "plus",
          onClick: () => setIsPOModalOpen(true),
        }}
        secondaryActions={
          <Button variant="secondary" icon="users" onClick={() => setIsSupplierModalOpen(true)}>
            Onboard Vendor
          </Button>
        }
      />

      <div style={{ padding: "16px 24px 0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
          <StatBox label="Active Approved Vendors" value={suppliers.length} subValue="Verified Suppliers" icon="users" />
          <StatBox label="Open Purchase Orders" value={pos.filter((p) => p.status === POStatus.ORDERED).length} subValue="In Transit" icon="purchasing" status="warning" />
          <StatBox label="Procurement YTD" value="₹112,500.00" subValue="Raw Materials & Inks" icon="credit-card" status="success" />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "pos", label: "Purchase Orders", icon: "purchasing", badge: pos.length },
          { id: "suppliers", label: "Suppliers Directory", icon: "users", badge: suppliers.length },
          { id: "price_trends", label: "Raw Material Price History", icon: "trending-up" },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {activeTab === "pos" && (
          <Table
            columns={poColumns}
            data={pos}
            keyExtractor={(p) => p.id}
            emptyText="No purchase orders created."
          />
        )}

        {activeTab === "suppliers" && (
          <Table
            columns={supplierColumns}
            data={suppliers}
            keyExtractor={(s) => s.id}
            emptyText="No suppliers registered."
          />
        )}

        {activeTab === "price_trends" && (
          <Card title="Raw Material Price Fluctuation Indices" subtitle="Track unit purchase cost movements over the last 90 days">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div style={{ padding: "12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>0.76mm PVC Core Sheet</div>
                <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)", marginTop: "4px" }}>₹4.20 / sheet</div>
                <div style={{ fontSize: "11px", color: "var(--status-success)", marginTop: "2px" }}>Stable (+0.0% vs last batch)</div>
              </div>

              <div style={{ padding: "12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>20mm Satin White Ribbon</div>
                <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)", marginTop: "4px" }}>₹1.80 / meter</div>
                <div style={{ fontSize: "11px", color: "var(--status-warning)", marginTop: "2px" }}>+5.8% increase (polyester yarn rate)</div>
              </div>

              <div style={{ padding: "12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>20mm Metal Dog Hook</div>
                <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)", marginTop: "4px" }}>₹2.10 / pc</div>
                <div style={{ fontSize: "11px", color: "var(--status-success)", marginTop: "2px" }}>-2.3% bulk discount tier</div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* New PO Modal */}
      <Modal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        title="Issue Purchase Order"
        subtitle="Send formal material replenishment order to verified vendor"
        width={520}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPOModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePO} loading={loading}>
              Issue PO (₹{(poQty * poUnitPrice).toLocaleString()})
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePO} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Select
            label="Target Vendor"
            options={suppliers.map((s) => ({ label: s.name, value: s.id }))}
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
          />

          <Input
            label="Item Description"
            placeholder="e.g. 0.76mm Gloss White PVC Core Sheets..."
            value={poItemDesc}
            onChange={(e) => setPoItemDesc(e.target.value)}
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input
              label="Quantity"
              type="number"
              value={poQty}
              onChange={(e) => setPoQty(Number(e.target.value))}
              min={1}
            />
            <Input
              label="Agreed Unit Price (₹)"
              type="number"
              value={poUnitPrice}
              onChange={(e) => setPoUnitPrice(Number(e.target.value))}
              step="0.01"
              min={0}
            />
          </div>
        </form>
      </Modal>

      {/* Onboard Vendor Modal */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Onboard Raw Material Vendor"
        subtitle="Add a new supplier to the commercial vendor catalog"
        width={500}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSupplierModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSupplier} loading={loading}>
              Save Vendor
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSupplier} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Input
            label="Vendor Company Name"
            placeholder="e.g. Surat Satin Mills Pvt. Ltd."
            value={supName}
            onChange={(e) => setSupName(e.target.value)}
            required
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input
              label="Contact Person"
              placeholder="Ketan Patel"
              value={supContact}
              onChange={(e) => setSupContact(e.target.value)}
            />
            <Input
              label="Phone"
              placeholder="+91 98250 88772"
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
            />
          </div>
          <Input
            label="Email"
            placeholder="sales@vendor.com"
            value={supEmail}
            onChange={(e) => setSupEmail(e.target.value)}
          />
          <Input
            label="Materials Supplied"
            placeholder="e.g. Satin Ribbons, Cotton Webbing, Dyes..."
            value={supMaterials}
            onChange={(e) => setSupMaterials(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};
