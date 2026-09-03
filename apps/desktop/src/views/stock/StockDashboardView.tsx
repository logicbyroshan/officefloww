import React, { useState, useMemo } from "react";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select, Textarea } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";

interface StockRecord {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
  min_stock_level: number;
  cost_price: number;
  location: string;
}

interface MovementRecord {
  id: string;
  timestamp: string;
  item_code: string;
  item_name?: string;
  type: string;
  quantity: number;
  source: string;
  destination: string;
  user_name: string;
  reason: string;
}

interface SupplierRecord {
  id: string;
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  materials: string;
  rating: string;
}

interface PurchaseOrderRecord {
  id: string;
  po_number: string;
  supplier_name: string;
  order_date: string;
  items_summary: string;
  total_amount: number;
  status: "ORDERED" | "RECEIVED" | "INSPECTED";
}

const SEED_STOCK_ITEMS: StockRecord[] = [
  {
    id: "stk-01",
    code: "RAW-PVC-076",
    name: "0.76mm Gloss White PVC Core Sheet",
    category: "RAW_MATERIAL",
    unit: "sheets",
    physical_stock: 50000,
    reserved_stock: 2500,
    available_stock: 47500,
    min_stock_level: 10000,
    cost_price: 4.20,
    location: "Main Store - Rack A1",
  },
  {
    id: "stk-02",
    code: "RAW-SATIN-20MM-WHT",
    name: "20mm White Satin Polyester Ribbon Roll",
    category: "RAW_MATERIAL",
    unit: "meters",
    physical_stock: 12000,
    reserved_stock: 2500,
    available_stock: 9500,
    min_stock_level: 3000,
    cost_price: 1.80,
    location: "Main Store - Rack B2",
  },
  {
    id: "stk-03",
    code: "HDW-DOGHOOK-20MM",
    name: "20mm Nickel-Plated Metal Dog-Hook Fitting",
    category: "HARDWARE",
    unit: "pieces",
    physical_stock: 8500,
    reserved_stock: 2000,
    available_stock: 6500,
    min_stock_level: 8000,
    cost_price: 0.95,
    location: "Hardware Bin #04",
  },
  {
    id: "stk-04",
    code: "RAW-OVERLAY-008",
    name: "0.08mm Magnetic Stripe Overlay Film",
    category: "RAW_MATERIAL",
    unit: "rolls",
    physical_stock: 45,
    reserved_stock: 5,
    available_stock: 40,
    min_stock_level: 15,
    cost_price: 420.0,
    location: "Cleanroom Film Cabinet",
  },
  {
    id: "stk-05",
    code: "INK-SUBLIM-CYAN",
    name: "Industrial Sublimation Ink 1L (Cyan)",
    category: "CONSUMABLE",
    unit: "liters",
    physical_stock: 8,
    reserved_stock: 2,
    available_stock: 6,
    min_stock_level: 5,
    cost_price: 1850.0,
    location: "Ink Vault - Bay 1",
  },
];

const SEED_MOVEMENTS: MovementRecord[] = [
  {
    id: "mov-01",
    timestamp: "2026-09-03T11:42:00Z",
    item_code: "HDW-DOGHOOK-20MM",
    item_name: "Metal Dog-Hook 20mm (Nickel Plated)",
    type: "ISSUE",
    quantity: 500,
    source: "Main Store",
    destination: "Labour Workshop (Ramesh)",
    user_name: "Priya Nair",
    reason: "Lanyard assembly order #ORD-2026-0001",
  },
  {
    id: "mov-02",
    timestamp: "2026-09-03T10:15:00Z",
    item_code: "RAW-SATIN-20MM-WHT",
    item_name: "Satin Lanyard Ribbon 20mm (White)",
    type: "RESERVE",
    quantity: 2500,
    source: "Main Store",
    destination: "Press Floor Line 1",
    user_name: "Rohan Sharma",
    reason: "Scheduled sublimation press job",
  },
];

const SEED_SUPPLIERS: SupplierRecord[] = [
  {
    id: "sup-01",
    code: "SUP-POLY-01",
    name: "Apex Polymers & PVC Sheets Ltd.",
    contact_person: "Vikas Aggarwal",
    phone: "+91 98110 55441",
    materials: "PVC Core Sheets, Polycarbonate Overlays",
    rating: "PREMIUM (99% on-time)",
  },
  {
    id: "sup-02",
    code: "SUP-TEXTILE-02",
    name: "Surat Satin Ribbons & Webbing Mill",
    contact_person: "Ketan Patel",
    phone: "+91 98250 88772",
    materials: "Polyester Satin Ribbon, Cotton Lanyard Tape",
    rating: "EXCELLENT",
  },
  {
    id: "sup-03",
    code: "SUP-HARDWARE-03",
    name: "Global Metal Fittings & Dog-Hooks Co.",
    contact_person: "Sunil Jain",
    phone: "+91 98200 33221",
    materials: "Dog Hooks, Alligator Clips, Breakaway Buckles",
    rating: "EXCELLENT",
  },
];

const SEED_PURCHASE_ORDERS: PurchaseOrderRecord[] = [
  {
    id: "po-01",
    po_number: "PO-2026-0012",
    supplier_name: "Global Metal Fittings & Dog-Hooks Co.",
    order_date: "02 Sep 2026",
    items_summary: "5,000 pcs 20mm Dog Hooks",
    total_amount: 4750.0,
    status: "ORDERED",
  },
  {
    id: "po-02",
    po_number: "PO-2026-0011",
    supplier_name: "Apex Polymers & PVC Sheets Ltd.",
    order_date: "28 Aug 2026",
    items_summary: "20,000 sheets 0.76mm Gloss PVC Core",
    total_amount: 84000.0,
    status: "RECEIVED",
  },
];

export const StockDashboardView: React.FC = () => {
  const { success } = useToast();

  const [activeTab, setActiveTab] = useState<
    "inventory" | "transactions" | "reservations" | "low" | "purchasing" | "suppliers"
  >("inventory");

  const [search, setSearch] = useState("");
  const [stockItems, setStockItems] = useState<StockRecord[]>(SEED_STOCK_ITEMS);
  const [selectedItem, setSelectedItem] = useState<StockRecord | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // New stock receipt form
  const [receiptItem, setReceiptItem] = useState(SEED_STOCK_ITEMS[0].id);
  const [receiptQty, setReceiptQty] = useState("1000");
  const [receiptNotes, setReceiptNotes] = useState("GRN Batch arrival inspection passed");

  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (activeTab === "low") {
        return item.available_stock <= item.min_stock_level;
      }
      return true;
    });
  }, [stockItems, search, activeTab]);

  const handleRecordReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(receiptQty, 10) || 0;
    setStockItems((prev) =>
      prev.map((i) =>
        i.id === receiptItem
          ? {
              ...i,
              physical_stock: i.physical_stock + qty,
              available_stock: i.available_stock + qty,
            }
          : i
      )
    );
    success("Stock Receipt Recorded", `Added ${qty.toLocaleString()} units to inventory ledger.`);
    setIsReceiptModalOpen(false);
  };

  const inventoryColumns: Column<StockRecord>[] = [
    {
      key: "name",
      header: "Material / Component Description",
      render: (s) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px" }}>{s.name}</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {s.location} • {s.category}
          </span>
        </div>
      ),
    },
    {
      key: "physical_stock",
      header: "Physical",
      align: "right",
      width: "110px",
      render: (s) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: 600, color: "#fff" }}>
          {s.physical_stock.toLocaleString()}
        </span>
      ),
    },
    {
      key: "reserved_stock",
      header: "Reserved",
      align: "right",
      width: "110px",
      render: (s) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "var(--status-warning)" }}>
          {s.reserved_stock.toLocaleString()}
        </span>
      ),
    },
    {
      key: "available_stock",
      header: "Available",
      align: "right",
      width: "120px",
      render: (s) => {
        const isLow = s.available_stock <= s.min_stock_level;
        return (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 700,
              color: isLow ? "var(--status-error)" : "#10b981",
            }}
          >
            {s.available_stock.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: "min_stock_level",
      header: "Minimum",
      align: "right",
      width: "100px",
      render: (s) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>
          {s.min_stock_level.toLocaleString()}
        </span>
      ),
    },
    {
      key: "unit",
      header: "Unit",
      width: "80px",
      render: (s) => <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>{s.unit}</span>,
    },
    {
      key: "actions",
      header: "",
      width: "95px",
      align: "right",
      render: (s) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedItem(s);
          }}
          style={{
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "5px 12px",
            borderRadius: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "var(--text-secondary)",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
            lineHeight: 1,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 138, 115, 0.15)";
            e.currentTarget.style.borderColor = "var(--accent-border)";
            e.currentTarget.style.color = "var(--accent-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <span>Ledger</span>
          <span style={{ fontSize: "11px" }}>→</span>
        </button>
      ),
    },
  ];

  const transactionColumns: Column<MovementRecord>[] = [
    {
      key: "timestamp",
      header: "Date / Time",
      width: "130px",
      render: (m) => (
        <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
          {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "item_code",
      header: "Material / Component",
      width: "200px",
      render: (m) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "12.5px" }}>
          {m.item_name || m.item_code}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: "90px",
      render: (m) => (
        <span
          style={{
            fontSize: "10.5px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "3px",
            backgroundColor: m.type === "ISSUE" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
            color: m.type === "ISSUE" ? "var(--status-error)" : "#10b981",
          }}
        >
          {m.type}
        </span>
      ),
    },
    {
      key: "quantity",
      header: "Qty",
      align: "right",
      width: "100px",
      render: (m) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: 700, color: "#fff" }}>
          {m.quantity.toLocaleString()}
        </span>
      ),
    },
    {
      key: "destination",
      header: "From → To / Order",
      render: (m) => (
        <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>
          {m.source} → {m.destination}
        </span>
      ),
    },
    {
      key: "user_name",
      header: "Operator",
      width: "120px",
      render: (m) => <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{m.user_name}</span>,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <PageHeader
        title="Stock & Material Register"
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
            {stockItems.length} Materials Tracked
          </span>
        }
        primaryAction={{
          label: "Stock Entry",
          icon: "plus",
          onClick: () => setIsReceiptModalOpen(true),
        }}
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
              { id: "inventory" as const, label: "Inventory Register" },
              { id: "transactions" as const, label: "Ledger Movements" },
              { id: "low" as const, label: "Low Stock Alerts" },
              { id: "purchasing" as const, label: "Purchase Orders" },
              { id: "suppliers" as const, label: "Suppliers Directory" },
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
              placeholder="Search materials, category, location..."
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

        {/* Tab View Contents */}
        {activeTab === "transactions" ? (
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
              columns={transactionColumns}
              data={SEED_MOVEMENTS}
              emptyText="No material movements recorded today."
            />
          </div>
        ) : activeTab === "purchasing" ? (
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.75)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Purchase Orders & Requisitions</span>
              <Button variant="primary" size="sm" onClick={() => success("New PO", "Purchase Order drafting initiated.")}>
                + New Purchase Order
              </Button>
            </div>
            <Table
              columns={[
                { key: "po_number", header: "PO Number", render: (p) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>{p.po_number}</span> },
                { key: "supplier_name", header: "Supplier Vendor", render: (p) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.supplier_name}</span> },
                { key: "order_date", header: "Date", render: (p) => <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{p.order_date}</span> },
                { key: "items_summary", header: "Ordered Items", render: (p) => <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{p.items_summary}</span> },
                { key: "total_amount", header: "PO Total", align: "right", render: (p) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#34d399" }}>₹{p.total_amount.toLocaleString()}</span> },
                { key: "status", header: "Status", render: (p) => <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px", backgroundColor: p.status === "RECEIVED" ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 138, 115, 0.15)", color: p.status === "RECEIVED" ? "#10b981" : "var(--accent-text)" }}>{p.status}</span> },
              ]}
              data={SEED_PURCHASE_ORDERS}
              emptyText="No active purchase orders."
            />
          </div>
        ) : activeTab === "suppliers" ? (
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
              columns={[
                { key: "code", header: "Supplier Code", render: (s) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>{s.code}</span> },
                { key: "name", header: "Vendor Name", render: (s) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</span> },
                { key: "contact_person", header: "Contact", render: (s) => <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{s.contact_person} ({s.phone})</span> },
                { key: "materials", header: "Materials Supplied", render: (s) => <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.materials}</span> },
                { key: "rating", header: "Vendor Reliability", render: (s) => <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>{s.rating}</span> },
              ]}
              data={SEED_SUPPLIERS}
              emptyText="No suppliers registered."
            />
          </div>
        ) : (
          /* Main Spreadsheet-Style Table */
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
              columns={inventoryColumns}
              data={filteredItems}
              onRowClick={(s) => setSelectedItem(s)}
              emptyText="No stock records match the query."
            />
          </div>
        )}
      </div>

      {/* Stock Item Detail Drawer */}
      {selectedItem && (
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
                {selectedItem.name}
              </h3>
              <span style={{ fontSize: "11.5px", color: "var(--accent-text)" }}>
                {selectedItem.location} • {selectedItem.category}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
            {/* Live Inventory Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <div style={{ padding: "10px", backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.06)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>PHYSICAL</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                  {selectedItem.physical_stock.toLocaleString()}
                </div>
              </div>
              <div style={{ padding: "10px", backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.06)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--status-warning)" }}>RESERVED</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--status-warning)", marginTop: "2px" }}>
                  {selectedItem.reserved_stock.toLocaleString()}
                </div>
              </div>
              <div style={{ padding: "10px", backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.06)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#10b981" }}>AVAILABLE</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#10b981", marginTop: "2px" }}>
                  {selectedItem.available_stock.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Location & Specs */}
            <div
              style={{
                padding: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                borderRadius: "4px",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Location:</span>
                <strong style={{ color: "#fff" }}>{selectedItem.location}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Safety Threshold:</span>
                <strong style={{ color: "#fff" }}>{selectedItem.min_stock_level.toLocaleString()} {selectedItem.unit}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Standard Cost:</span>
                <strong style={{ color: "#34d399" }}>₹{selectedItem.cost_price.toFixed(2)} / {selectedItem.unit}</strong>
              </div>
            </div>

            {/* Quick Material Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  success("Material Issued", `Issued 100 units of ${selectedItem.name} to floor.`);
                }}
              >
                Issue to Floor
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon="plus"
                onClick={() => {
                  success("Requisition", `Created purchase requisition for ${selectedItem.name}.`);
                }}
              >
                Reorder Material
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stock Receipt Modal */}
      {isReceiptModalOpen && (
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title="Record Material Goods Receipt (GRN)"
        >
          <form onSubmit={handleRecordReceipt} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Select
              label="Select Material / Raw Stock"
              value={receiptItem}
              onChange={(e) => setReceiptItem(e.target.value)}
              options={stockItems.map((s) => ({ value: s.id, label: `${s.name} (${s.location})` }))}
            />

            <Input
              label="Quantity Received"
              type="number"
              value={receiptQty}
              onChange={(e) => setReceiptQty(e.target.value)}
              required
            />

            <Textarea
              label="Inspection Notes / Lot Reference"
              value={receiptNotes}
              onChange={(e) => setReceiptNotes(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsReceiptModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Confirm Stock Receipt
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
