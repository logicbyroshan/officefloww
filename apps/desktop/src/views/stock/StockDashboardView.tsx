import React, { useState, useMemo } from "react";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
import { Button, IconButton } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select, Textarea } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";

interface StockRecord {
  id: string;
  code: string;
  name: string;
  category: "RAW_MATERIAL" | "HARDWARE" | "CONSUMABLE";
  unit: string;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
  min_stock_level: number;
  cost_price: number;
  location: string;
  active: boolean;
  iconName: "layers" | "package" | "tool" | "file-text" | "sliders" | "cpu";
  iconColor: string;
  iconBg: string;
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
    active: true,
    iconName: "layers",
    iconColor: "#38bdf8",
    iconBg: "rgba(56, 189, 248, 0.12)",
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
    active: true,
    iconName: "package",
    iconColor: "#ff8a73",
    iconBg: "rgba(255, 138, 115, 0.14)",
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
    active: true,
    iconName: "tool",
    iconColor: "#c084fc",
    iconBg: "rgba(168, 85, 247, 0.12)",
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
    active: true,
    iconName: "file-text",
    iconColor: "#34d399",
    iconBg: "rgba(16, 185, 129, 0.12)",
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
    active: true,
    iconName: "sliders",
    iconColor: "#f59e0b",
    iconBg: "rgba(245, 158, 11, 0.14)",
  },
  {
    id: "stk-06",
    code: "HDW-CLIPS-ALGT",
    name: "Alligator Clip with Clear PVC Strap",
    category: "HARDWARE",
    unit: "pieces",
    physical_stock: 15000,
    reserved_stock: 1200,
    available_stock: 13800,
    min_stock_level: 5000,
    cost_price: 1.25,
    location: "Hardware Bin #08",
    active: true,
    iconName: "tool",
    iconColor: "#a78bfa",
    iconBg: "rgba(167, 139, 250, 0.12)",
  },
  {
    id: "stk-07",
    code: "RAW-ACRYLIC-3MM",
    name: "3mm Cast Transparent Acrylic Sheet (1220x915mm)",
    category: "RAW_MATERIAL",
    unit: "sheets",
    physical_stock: 120,
    reserved_stock: 10,
    available_stock: 110,
    min_stock_level: 25,
    cost_price: 680.0,
    location: "Acrylic Bay #2",
    active: true,
    iconName: "layers",
    iconColor: "#38bdf8",
    iconBg: "rgba(56, 189, 248, 0.12)",
  },
  {
    id: "stk-08",
    code: "RAW-RFID-CHIP",
    name: "13.56MHz Mifare 1K Contactless Inlay",
    category: "HARDWARE",
    unit: "pieces",
    physical_stock: 8000,
    reserved_stock: 800,
    available_stock: 7200,
    min_stock_level: 2000,
    cost_price: 8.50,
    location: "Electronics Vault - Shelf 3",
    active: true,
    iconName: "cpu",
    iconColor: "#ec4899",
    iconBg: "rgba(236, 72, 153, 0.12)",
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

/** SVG Semi-Circle Arc Gauge matching reference image */
const StockGaugeArc: React.FC<{ percentage: number; isLow: boolean }> = ({ percentage, isLow }) => {
  const radius = 20;
  const strokeWidth = 4.5;
  const circumference = Math.PI * radius;
  const clamped = Math.min(Math.max(percentage, 5), 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  const color = isLow ? "#ef4444" : clamped < 50 ? "#f59e0b" : "#10b981";

  return (
    <div style={{ position: "relative", width: 50, height: 28, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <svg width={50} height={28} viewBox="0 0 50 28">
        <path
          d="M 5 25 A 20 20 0 0 1 45 25"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d="M 5 25 A 20 20 0 0 1 45 25"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span style={{ position: "absolute", bottom: -2, fontSize: "9px", fontFamily: "var(--font-mono)", fontWeight: 700, color }}>
        {percentage}%
      </span>
    </div>
  );
};

export const StockDashboardView: React.FC = () => {
  const { success } = useToast();

  const [activeTab, setActiveTab] = useState<
    "inventory" | "transactions" | "low" | "purchasing" | "suppliers"
  >("inventory");

  const [search, setSearch] = useState("");
  const [stockItems, setStockItems] = useState<StockRecord[]>(SEED_STOCK_ITEMS);
  const [selectedItem, setSelectedItem] = useState<StockRecord | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [showStatsCard, setShowStatsCard] = useState(true);
  const [sortBy, setSortBy] = useState<"highest" | "lowest" | "name" | "price">("highest");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // New stock receipt form
  const [receiptItem, setReceiptItem] = useState(SEED_STOCK_ITEMS[0].id);
  const [receiptQty, setReceiptQty] = useState("1000");
  const [receiptNotes, setReceiptNotes] = useState("GRN Batch arrival inspection passed");

  // KPI calculations
  const totalPhysical = useMemo(() => stockItems.reduce((acc, i) => acc + i.physical_stock, 0), [stockItems]);
  const lowStockCount = useMemo(() => stockItems.filter((i) => i.available_stock <= i.min_stock_level).length, [stockItems]);
  const fastMovingItem = stockItems[0]; // PVC Core Sheet

  const filteredItems = useMemo(() => {
    let list = stockItems.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
      if (activeTab === "low") {
        return item.available_stock <= item.min_stock_level;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "highest") return b.available_stock - a.available_stock;
      if (sortBy === "lowest") return a.available_stock - b.available_stock;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price") return b.cost_price - a.cost_price;
      return 0;
    });

    return list;
  }, [stockItems, search, categoryFilter, activeTab, sortBy]);

  const handleToggleActive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStockItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
    );
  };

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
      key: "item_name",
      header: "Material Name",
      render: (m) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {m.item_name || m.item_code}
        </span>
      ),
    },
    {
      key: "type",
      header: "Action",
      width: "100px",
      render: (m) => (
        <span
          style={{
            fontSize: "10.5px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "3px",
            backgroundColor: m.type === "ISSUE" ? "rgba(255, 138, 115, 0.15)" : "rgba(56, 189, 248, 0.15)",
            color: m.type === "ISSUE" ? "var(--accent-text)" : "#38bdf8",
          }}
        >
          {m.type}
        </span>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
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
              { id: "inventory" as const, label: "All Product List" },
              { id: "transactions" as const, label: "Ledger Movements" },
              { id: "low" as const, label: "Low Stock Alerts", badge: lowStockCount },
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
                  gap: "6px",
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
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "1px 5px",
                      borderRadius: "10px",
                      backgroundColor: "var(--status-error)",
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Search Bar matching reference */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.28)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "4px",
                padding: "5px 12px",
              }}
            >
              <Icon name="search" size={13} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search Product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: "12px",
                  outline: "none",
                  width: "180px",
                }}
              />
            </div>

            {/* Sort By selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "4px",
                color: "var(--text-secondary)",
                fontSize: "12px",
                padding: "5px 10px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="highest" style={{ backgroundColor: "#0e121a" }}>Sort By: Highest Stock</option>
              <option value="lowest" style={{ backgroundColor: "#0e121a" }}>Sort By: Lowest Stock</option>
              <option value="name" style={{ backgroundColor: "#0e121a" }}>Sort By: Material Name</option>
              <option value="price" style={{ backgroundColor: "#0e121a" }}>Sort By: Unit Price</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "4px",
                color: "var(--text-secondary)",
                fontSize: "12px",
                padding: "5px 10px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="ALL" style={{ backgroundColor: "#0e121a" }}>Show All Product ({stockItems.length})</option>
              <option value="RAW_MATERIAL" style={{ backgroundColor: "#0e121a" }}>Raw Materials</option>
              <option value="HARDWARE" style={{ backgroundColor: "#0e121a" }}>Hardware Fittings</option>
              <option value="CONSUMABLE" style={{ backgroundColor: "#0e121a" }}>Consumables</option>
            </select>
          </div>
        </div>

        {/* Product Statistic Card (Matching reference top section) */}
        {activeTab === "inventory" && (
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.8)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "14px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                Product Statistic
              </span>
              <button
                type="button"
                onClick={() => setShowStatsCard(!showStatsCard)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 2,
                }}
              >
                <Icon name={showStatsCard ? "chevron-up" : "chevron-down"} size={16} />
              </button>
            </div>

            {showStatsCard && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "14px",
                  paddingTop: "6px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                {/* 1. Active Product */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Active Product</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>{stockItems.length}</span>
                    <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>Product</span>
                  </div>
                </div>

                {/* 2. Winning / Fast Moving Product */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "14px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Winning Product</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                    <span style={{ fontSize: "14px" }}>📦</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent-text)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                      {fastMovingItem.name.slice(0, 16)}...
                    </span>
                  </div>
                </div>

                {/* 3. Average Performance / Stock Health */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "14px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Average Performance</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <StockGaugeArc percentage={94} isLow={false} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#10b981" }}>Good!</span>
                  </div>
                </div>

                {/* 4. Product Sold / Physical Units */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "14px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Floor Stock Units</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#38bdf8" }}>{totalPhysical.toLocaleString()}</span>
                    <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>Items</span>
                  </div>
                </div>

                {/* 5. Product Low / Reorder Alerts */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "14px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Reorder Alerts</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: lowStockCount > 0 ? "var(--status-warning)" : "#10b981" }}>
                      {lowStockCount}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>Items</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
          /* Main Reference-Style Item Rows List */
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredItems.map((item) => {
              const isLow = item.available_stock <= item.min_stock_level;
              const healthPercent = Math.min(Math.round((item.available_stock / (item.min_stock_level * 2)) * 100), 100);
              const performanceLabel = healthPercent >= 80 ? "Excellent" : healthPercent >= 50 ? "Good" : "Low";
              const totalValue = item.available_stock * item.cost_price;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    backgroundColor: "rgba(19, 23, 34, 0.85)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid " + (isLow ? "rgba(239, 68, 68, 0.35)" : "rgba(255, 255, 255, 0.07)"),
                    borderRadius: "4px",
                    padding: "12px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(25, 32, 47, 0.95)";
                    e.currentTarget.style.borderColor = "var(--accent-border)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(19, 23, 34, 0.85)";
                    e.currentTarget.style.borderColor = isLow ? "rgba(239, 68, 68, 0.35)" : "rgba(255, 255, 255, 0.07)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {/* Left Column: Visual Thumbnail + Clean Title & Spec (No reviews as requested) */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "320px", flexShrink: 0 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "4px",
                        backgroundColor: item.iconBg,
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={item.iconName} size={20} color={item.iconColor} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", overflow: "hidden" }}>
                      <span
                        style={{
                          fontSize: "13.5px",
                          fontWeight: 700,
                          color: "#fff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.name}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {item.location} • {item.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: Allocation (Available / Reserved) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "130px", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Performance</span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: isLow ? "#ef4444" : healthPercent >= 80 ? "#10b981" : "#f59e0b",
                        }}
                      >
                        {performanceLabel}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                      <span>📈 {item.available_stock.toLocaleString()}</span>
                      <span>🔒 {item.reserved_stock.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Column 3: Semi-Circle Gauge Arc */}
                  <div style={{ display: "flex", alignItems: "center", width: "65px", flexShrink: 0 }}>
                    <StockGaugeArc percentage={healthPercent} isLow={isLow} />
                  </div>

                  {/* Column 4: Stock Quantity */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "120px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Stock</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px" }}>📦</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13.5px", fontWeight: 700, color: isLow ? "var(--status-error)" : "#fff" }}>
                        {item.available_stock.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{item.unit}</span>
                    </div>
                  </div>

                  {/* Column 5: Product Price & Total Valuation */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "130px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Product Price</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13.5px", fontWeight: 700, color: "#34d399" }}>
                        ₹{item.cost_price.toFixed(2)}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>/ {item.unit}</span>
                    </div>
                  </div>

                  {/* Column 6: Visibility / In-Stock Toggle Switch */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "90px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Visibility</span>
                    <div
                      onClick={(e) => handleToggleActive(item.id, e)}
                      style={{
                        width: 32,
                        height: 18,
                        borderRadius: "10px",
                        backgroundColor: item.active ? "var(--accent)" : "rgba(255, 255, 255, 0.15)",
                        position: "relative",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          backgroundColor: item.active ? "#090c13" : "#cbd5e1",
                          position: "absolute",
                          top: 2,
                          left: item.active ? 16 : 2,
                          transition: "left 0.2s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Column 7: Quick Actions (Pencil, Eye/Ledger, More) */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <button
                      type="button"
                      title="Edit Material Specs"
                      onClick={(e) => {
                        e.stopPropagation();
                        success("Edit Material", `Editing specifications for ${item.name}`);
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      <Icon name="sliders" size={13} />
                    </button>

                    <button
                      type="button"
                      title="View Ledger Movements"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                      style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 138, 115, 0.12)",
                        border: "1px solid var(--accent-border)",
                        color: "var(--accent-text)",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--accent)";
                        e.currentTarget.style.color = "#090c13";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 138, 115, 0.12)";
                        e.currentTarget.style.color = "var(--accent-text)";
                      }}
                    >
                      <span>Ledger</span>
                      <span style={{ fontSize: "11px" }}>→</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Bottom Pagination Bar matching reference */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 6px 6px 6px",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                marginTop: "6px",
              }}
            >
              <button
                type="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  cursor: "not-allowed",
                  fontWeight: 500,
                }}
                disabled
              >
                Previous
              </button>

              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                Page 1 of 1 • ({filteredItems.length} Products)
              </span>

              <button
                type="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  cursor: "not-allowed",
                  fontWeight: 500,
                }}
                disabled
              >
                Next
              </button>
            </div>
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
                {selectedItem.location} • {selectedItem.category.replace("_", " ")}
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
