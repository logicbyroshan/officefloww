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
  category: "RAW_MATERIAL" | "HARDWARE" | "CONSUMABLE";
  unit: string;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
  used_stock: number; // Total units consumed in production
  min_stock_level: number;
  item_price: number; // Renamed to Item Price
  active: boolean;
  defaultDestination: string;
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
  destination: string;
  user_name: string;
  reason: string;
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
    used_stock: 14200,
    min_stock_level: 10000,
    item_price: 4.20,
    active: true,
    defaultDestination: "Thermal Card Press Floor",
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
    used_stock: 6800,
    min_stock_level: 3000,
    item_price: 1.80,
    active: true,
    defaultDestination: "Sublimation Press Line 1",
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
    used_stock: 7500,
    min_stock_level: 8000,
    item_price: 0.95,
    active: true,
    defaultDestination: "Lanyard Stitching Bench 2",
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
    used_stock: 18,
    min_stock_level: 15,
    item_price: 420.0,
    active: true,
    defaultDestination: "Lamination Cleanroom",
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
    used_stock: 5,
    min_stock_level: 5,
    item_price: 1850.0,
    active: true,
    defaultDestination: "Digital Print Station",
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
    used_stock: 4200,
    min_stock_level: 5000,
    item_price: 1.25,
    active: true,
    defaultDestination: "ID Badge Assembly Bench",
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
    used_stock: 35,
    min_stock_level: 25,
    item_price: 680.0,
    active: true,
    defaultDestination: "Laser Cutting Unit",
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
    used_stock: 2400,
    min_stock_level: 2000,
    item_price: 8.50,
    active: true,
    defaultDestination: "Smart Card Encoding Unit",
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
    item_name: "20mm Nickel-Plated Metal Dog-Hook Fitting",
    type: "USAGE",
    quantity: 500,
    destination: "Labour Workshop (Ramesh)",
    user_name: "Priya Nair",
    reason: "Lanyard assembly order #ORD-2026-0001",
  },
  {
    id: "mov-02",
    timestamp: "2026-09-03T10:15:00Z",
    item_code: "RAW-SATIN-20MM-WHT",
    item_name: "20mm White Satin Polyester Ribbon Roll",
    type: "USAGE",
    quantity: 2500,
    destination: "Press Floor Line 1",
    user_name: "Rohan Sharma",
    reason: "Scheduled sublimation press job",
  },
  {
    id: "mov-03",
    timestamp: "2026-09-02T14:30:00Z",
    item_code: "RAW-PVC-076",
    item_name: "0.76mm Gloss White PVC Core Sheet",
    type: "USAGE",
    quantity: 1200,
    destination: "Thermal Card Press",
    user_name: "Dinesh Kumar",
    reason: "Student ID card batch #ORD-2026-0002",
  },
];

/** SVG Semi-Circle Arc Gauge */
const StockGaugeArc: React.FC<{ percentage: number; color?: string }> = ({ percentage, color = "#10b981" }) => {
  const radius = 20;
  const strokeWidth = 4.5;
  const circumference = Math.PI * radius;
  const clamped = Math.min(Math.max(percentage, 5), 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

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
  const { success, error: toastError } = useToast();

  // Clean 2-tab navigation: Stocks Inventory & Material Usage
  const [activeTab, setActiveTab] = useState<"inventory" | "usage">("inventory");

  const [search, setSearch] = useState("");
  const [stockItems, setStockItems] = useState<StockRecord[]>(SEED_STOCK_ITEMS);
  const [movements, setMovements] = useState<MovementRecord[]>(SEED_MOVEMENTS);
  const [selectedItem, setSelectedItem] = useState<StockRecord | null>(null);
  const [showStatsCard, setShowStatsCard] = useState(true);
  const [sortBy, setSortBy] = useState<"highest" | "lowest" | "name" | "price" | "used">("highest");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showRecentLog, setShowRecentLog] = useState(false);

  // Modals
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);

  // Active item targeted for Qty or Usage adjustment
  const [targetItem, setTargetItem] = useState<StockRecord>(SEED_STOCK_ITEMS[0]);

  // Form states: New Product Entry
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<"RAW_MATERIAL" | "HARDWARE" | "CONSUMABLE">("RAW_MATERIAL");
  const [newUnit, setNewUnit] = useState("pieces");
  const [newQty, setNewQty] = useState("1000");
  const [newPrice, setNewPrice] = useState("10.00");
  const [newMinLevel, setNewMinLevel] = useState("200");

  // Form states: Update Quantity Modal
  const [qtyMode, setQtyMode] = useState<"ADD" | "SET" | "DEDUCT">("ADD");
  const [adjustQty, setAdjustQty] = useState("500");
  const [adjustReason, setAdjustReason] = useState("Stock receipt / inventory audit");

  // Form states: Log Usage Modal
  const [useQty, setUseQty] = useState("100");
  const [useReason, setUseReason] = useState("Production Order run");
  const [useDestination, setUseDestination] = useState("Press Floor Line 1");

  // Computed KPIs
  const totalPhysical = useMemo(() => stockItems.reduce((acc, i) => acc + i.physical_stock, 0), [stockItems]);
  const totalAvailable = useMemo(() => stockItems.reduce((acc, i) => acc + i.available_stock, 0), [stockItems]);
  const totalUsed = useMemo(() => stockItems.reduce((acc, i) => acc + i.used_stock, 0), [stockItems]);
  const totalValuation = useMemo(() => stockItems.reduce((acc, i) => acc + (i.available_stock * i.item_price), 0), [stockItems]);
  const mostUsedItem = useMemo(() => [...stockItems].sort((a, b) => b.used_stock - a.used_stock)[0] || stockItems[0], [stockItems]);

  const filteredItems = useMemo(() => {
    let list = stockItems.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "highest") return b.available_stock - a.available_stock;
      if (sortBy === "lowest") return a.available_stock - b.available_stock;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price") return b.item_price - a.item_price;
      if (sortBy === "used") return b.used_stock - a.used_stock;
      return 0;
    });

    return list;
  }, [stockItems, search, categoryFilter, sortBy]);

  // Action: Toggle item visibility
  const handleToggleActive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStockItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
    );
  };

  // Action: Create New Product Entry
  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toastError("Validation Error", "Please provide a valid material name.");
      return;
    }

    const initialQty = Math.max(0, parseInt(newQty, 10) || 0);
    const price = Math.max(0, parseFloat(newPrice) || 0);
    const minLevel = Math.max(0, parseInt(newMinLevel, 10) || 0);

    const newItem: StockRecord = {
      id: `stk-${Date.now().toString().slice(-4)}`,
      code: `MAT-${newName.trim().toUpperCase().slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`,
      name: newName.trim(),
      category: newCategory,
      unit: newUnit,
      physical_stock: initialQty,
      reserved_stock: 0,
      available_stock: initialQty,
      used_stock: 0,
      min_stock_level: minLevel,
      item_price: price,
      active: true,
      defaultDestination: "General Production Floor",
      iconName: newCategory === "HARDWARE" ? "tool" : newCategory === "CONSUMABLE" ? "sliders" : "layers",
      iconColor: newCategory === "HARDWARE" ? "#c084fc" : newCategory === "CONSUMABLE" ? "#f59e0b" : "#38bdf8",
      iconBg: newCategory === "HARDWARE" ? "rgba(168, 85, 247, 0.12)" : newCategory === "CONSUMABLE" ? "rgba(245, 158, 11, 0.14)" : "rgba(56, 189, 248, 0.12)",
    };

    setStockItems((prev) => [newItem, ...prev]);
    success("New Product Created", `"${newItem.name}" added to catalog with ${initialQty} ${newUnit}.`);
    setIsNewItemModalOpen(false);
    setNewName("");
  };

  // Action: Update Quantity of an existing product anytime
  const handleUpdateQuantity = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyVal = Math.max(0, parseInt(adjustQty, 10) || 0);

    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== targetItem.id) return item;

        let newAvailable = item.available_stock;
        let newPhysical = item.physical_stock;

        if (qtyMode === "ADD") {
          newAvailable += qtyVal;
          newPhysical += qtyVal;
        } else if (qtyMode === "DEDUCT") {
          newAvailable = Math.max(0, newAvailable - qtyVal);
          newPhysical = Math.max(0, newPhysical - qtyVal);
        } else if (qtyMode === "SET") {
          newAvailable = qtyVal;
          newPhysical = qtyVal + item.reserved_stock;
        }

        return {
          ...item,
          available_stock: newAvailable,
          physical_stock: newPhysical,
        };
      })
    );

    // Record in movements
    const newMovement: MovementRecord = {
      id: `mov-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      item_code: targetItem.code,
      item_name: targetItem.name,
      type: qtyMode === "ADD" ? "RECEIPT" : qtyMode === "DEDUCT" ? "WRITE_OFF" : "AUDIT_SET",
      quantity: qtyVal,
      destination: "Floor Inventory",
      user_name: "Admin / Floor Supervisor",
      reason: adjustReason,
    };
    setMovements((prev) => [newMovement, ...prev]);

    success("Stock Quantity Updated", `Updated ${targetItem.name} (${qtyMode}: ${qtyVal} ${targetItem.unit}).`);
    setIsQtyModalOpen(false);
  };

  // Action: Report Material Usage
  const handleLogUsage = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyVal = Math.max(0, parseInt(useQty, 10) || 0);

    if (qtyVal > targetItem.available_stock) {
      toastError("Insufficient Stock", `Only ${targetItem.available_stock} ${targetItem.unit} available.`);
      return;
    }

    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== targetItem.id) return item;
        return {
          ...item,
          available_stock: Math.max(0, item.available_stock - qtyVal),
          physical_stock: Math.max(0, item.physical_stock - qtyVal),
          used_stock: item.used_stock + qtyVal,
        };
      })
    );

    const newMovement: MovementRecord = {
      id: `mov-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      item_code: targetItem.code,
      item_name: targetItem.name,
      type: "USAGE",
      quantity: qtyVal,
      destination: useDestination,
      user_name: "Line Operator",
      reason: useReason,
    };
    setMovements((prev) => [newMovement, ...prev]);

    success("Material Usage Reported", `Logged ${qtyVal} ${targetItem.unit} of ${targetItem.name} consumed.`);
    setIsUsageModalOpen(false);
  };

  // Movement columns for recent log table
  const transactionColumns: Column<MovementRecord>[] = [
    {
      key: "timestamp",
      header: "Date / Time",
      width: "140px",
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
      key: "quantity",
      header: "Quantity Consumed",
      align: "right",
      width: "140px",
      render: (m) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: 700, color: "#ff8a73" }}>
          {m.quantity.toLocaleString()} units
        </span>
      ),
    },
    {
      key: "destination",
      header: "Workstation / Target",
      render: (m) => (
        <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>
          {m.destination}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Order / Job Reason",
      render: (m) => <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{m.reason}</span>,
    },
    {
      key: "user_name",
      header: "Operator",
      width: "120px",
      render: (m) => <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{m.user_name}</span>,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* 1. Single Unified Top Header (Fixed, not scrollable) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          backgroundColor: "rgba(14, 18, 26, 0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          flexShrink: 0,
          gap: "12px",
          zIndex: 10,
        }}
      >
        {/* Left: Navigation Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {[
            { id: "inventory" as const, label: "Stocks Inventory", icon: "layers" as const },
            { id: "usage" as const, label: "Material Usage", icon: "sliders" as const },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 14px",
                borderRadius: "4px",
                border: "none",
                backgroundColor:
                  activeTab === tab.id ? "rgba(255, 138, 115, 0.16)" : "transparent",
                color: activeTab === tab.id ? "var(--accent-text)" : "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon name={tab.icon} size={14} color={activeTab === tab.id ? "var(--accent-text)" : "var(--text-muted)"} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Search Input + Sort + Category + New Product Button (NO Log Usage at top!) */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Search Input */}
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
              placeholder={activeTab === "inventory" ? "Search Product..." : "Search Material Usage..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "12px",
                outline: "none",
                width: "170px",
              }}
            />
          </div>

          {/* Sort Selector */}
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
            <option value="used" style={{ backgroundColor: "#0e121a" }}>Sort By: Most Used</option>
            <option value="price" style={{ backgroundColor: "#0e121a" }}>Sort By: Item Price</option>
            <option value="name" style={{ backgroundColor: "#0e121a" }}>Sort By: Name</option>
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

          {/* + New Product */}
          <Button
            variant="primary"
            size="sm"
            icon="plus"
            onClick={() => setIsNewItemModalOpen(true)}
          >
            New Product
          </Button>
        </div>
      </div>

      {/* 2. Middle Scrollable Content (Statistic Card + Items) */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Product Statistic Card (Low stock alert removed as requested) */}
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

              {/* 2. Winning Product (Highest Usage) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Top Consumed Item</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                  <span style={{ fontSize: "14px" }}>📦</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent-text)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                    {mostUsedItem.name.slice(0, 16)}...
                  </span>
                </div>
              </div>

              {/* 3. Average Performance */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Average Performance</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <StockGaugeArc percentage={88} color="#10b981" />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#10b981" }}>Good!</span>
                </div>
              </div>

              {/* 4. Floor Stock Units */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Floor Stock Units</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: "#38bdf8" }}>{totalAvailable.toLocaleString()}</span>
                  <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>Items</span>
                </div>
              </div>

              {/* 5. Total Material Used / Consumed */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", paddingLeft: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Total Units Used</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: "#ff8a73" }}>{totalUsed.toLocaleString()}</span>
                  <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>Units</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TAB 1: Stocks Inventory View (Card Rows) */}
        {activeTab === "inventory" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredItems.map((item) => {
              const totalThroughput = item.available_stock + item.used_stock;
              const usageRate = totalThroughput > 0 ? Math.round((item.used_stock / totalThroughput) * 100) : 0;

              // Performance calculated from usage vs stock
              let performanceScore = 75;
              let performanceLabel = "Steady";
              let gaugeColor = "#10b981";

              if (usageRate >= 45) {
                performanceScore = 95;
                performanceLabel = "High Demand";
                gaugeColor = "#10b981";
              } else if (usageRate >= 20) {
                performanceScore = 78;
                performanceLabel = "Active Use";
                gaugeColor = "#38bdf8";
              } else {
                performanceScore = 52;
                performanceLabel = "Moderate";
                gaugeColor = "#f59e0b";
              }

              const categoryBadge =
                item.category === "RAW_MATERIAL"
                  ? "Raw Material"
                  : item.category === "HARDWARE"
                  ? "Hardware Fitting"
                  : "Consumable";

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    backgroundColor: "rgba(19, 23, 34, 0.85)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "4px",
                    padding: "12px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "14px",
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
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {/* Column 1: Visual + Title + Category (Store location removed) */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "290px", flexShrink: 0 }}>
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

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
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
                        {categoryBadge}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: Usage Reporting */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "130px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total Used</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "#ff8a73" }}>
                        {item.used_stock.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{item.unit}</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{usageRate}% consumption</span>
                  </div>

                  {/* Column 3: Performance Arc Gauge */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", width: "80px", flexShrink: 0 }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: gaugeColor }}>
                      {performanceLabel}
                    </span>
                    <StockGaugeArc percentage={performanceScore} color={gaugeColor} />
                  </div>

                  {/* Column 4: Available Stock */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "120px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Stock</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px" }}>📦</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13.5px", fontWeight: 700, color: "#fff" }}>
                        {item.available_stock.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{item.unit}</span>
                    </div>
                    {item.reserved_stock > 0 && (
                      <span style={{ fontSize: "10px", color: "var(--status-warning)" }}>
                        {item.reserved_stock.toLocaleString()} reserved
                      </span>
                    )}
                  </div>

                  {/* Column 5: Item Price (Named Item Price) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "120px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Item Price</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13.5px", fontWeight: 700, color: "#34d399" }}>
                        ₹{item.item_price.toFixed(2)}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>/ {item.unit}</span>
                    </div>
                  </div>

                  {/* Column 6: Visibility Toggle Switch */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "80px", flexShrink: 0 }}>
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

                  {/* Column 7: Quick Actions */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    {/* Update Quantity button */}
                    <button
                      type="button"
                      title="Update Quantity Anytime"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetItem(item);
                        setQtyMode("ADD");
                        setAdjustQty("500");
                        setIsQtyModalOpen(true);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "var(--text-secondary)",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.15)";
                        e.currentTarget.style.borderColor = "#38bdf8";
                        e.currentTarget.style.color = "#38bdf8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      <span>± Qty</span>
                    </button>

                    {/* Report Usage button */}
                    <button
                      type="button"
                      title="Report Material Usage"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetItem(item);
                        setUseQty("100");
                        setIsUsageModalOpen(true);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        color: "#f87171",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.18)";
                        e.currentTarget.style.borderColor = "#ef4444";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
                        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                        e.currentTarget.style.color = "#f87171";
                      }}
                    >
                      <span>− Use</span>
                    </button>

                    {/* View Ledger */}
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
                        padding: "4px 9px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 138, 115, 0.12)",
                        border: "1px solid var(--accent-border)",
                        color: "var(--accent-text)",
                        fontSize: "11px",
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
                      <span style={{ fontSize: "10.5px" }}>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Material Usage View (Made similar to All Product list in card rows!) */}
        {activeTab === "usage" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Header controls for Usage tab */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                  Material Usage & Factory Consumption Register
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  ({filteredItems.length} Materials Active)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowRecentLog(!showRecentLog)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 12px",
                    borderRadius: "4px",
                    backgroundColor: showRecentLog ? "rgba(255, 138, 115, 0.15)" : "rgba(255, 255, 255, 0.04)",
                    border: "1px solid " + (showRecentLog ? "var(--accent-border)" : "rgba(255, 255, 255, 0.08)"),
                    color: showRecentLog ? "var(--accent-text)" : "var(--text-secondary)",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Icon name="file-text" size={12} />
                  <span>{showRecentLog ? "Hide History Table" : "Show Recent Logs (" + movements.length + ")"}</span>
                </button>
              </div>
            </div>

            {/* Optional Recent Logs Table */}
            {showRecentLog && (
              <div
                style={{
                  backgroundColor: "rgba(19, 23, 34, 0.75)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  marginBottom: "8px",
                }}
              >
                <Table
                  columns={transactionColumns}
                  data={movements}
                  emptyText="No material movements recorded today."
                />
              </div>
            )}

            {/* Usage Card Rows (Identical sleek structure as Stocks Inventory) */}
            {filteredItems.map((item) => {
              const totalThroughput = item.available_stock + item.used_stock;
              const usageRate = totalThroughput > 0 ? Math.round((item.used_stock / totalThroughput) * 100) : 0;
              const consumedValue = item.used_stock * item.item_price;

              let usageStatus = "High Usage";
              let gaugeColor = "#10b981";
              if (usageRate < 20) {
                usageStatus = "Low Usage";
                gaugeColor = "#f59e0b";
              } else if (usageRate < 45) {
                usageStatus = "Moderate";
                gaugeColor = "#38bdf8";
              }

              const categoryBadge =
                item.category === "RAW_MATERIAL"
                  ? "Raw Material"
                  : item.category === "HARDWARE"
                  ? "Hardware Fitting"
                  : "Consumable";

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    backgroundColor: "rgba(19, 23, 34, 0.85)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "4px",
                    padding: "12px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "14px",
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
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {/* Column 1: Material Visual & Title */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "290px", flexShrink: 0 }}>
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

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
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
                        {categoryBadge} • Code: {item.code}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: Total Used & Consumed */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "130px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Material Used</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 800, color: "#ff8a73" }}>
                        {item.used_stock.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{item.unit}</span>
                    </div>
                    <span style={{ fontSize: "10.5px", color: "#38bdf8", fontWeight: 600 }}>{usageRate}% of Total Run</span>
                  </div>

                  {/* Column 3: Consumption Rate Arc Gauge */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", width: "80px", flexShrink: 0 }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: gaugeColor }}>
                      {usageStatus}
                    </span>
                    <StockGaugeArc percentage={usageRate} color={gaugeColor} />
                  </div>

                  {/* Column 4: Available Stock Remaining */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "130px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Stock Remaining</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                        {item.available_stock.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{item.unit}</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      Floor Unit: {item.defaultDestination}
                    </span>
                  </div>

                  {/* Column 5: Consumed Valuation */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "130px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Usage Valuation</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13.5px", fontWeight: 700, color: "#34d399" }}>
                        ₹{consumedValue.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      ₹{item.item_price.toFixed(2)} / {item.unit}
                    </span>
                  </div>

                  {/* Column 6: Action Buttons */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <button
                      type="button"
                      title="Log Usage"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetItem(item);
                        setUseQty("100");
                        setIsUsageModalOpen(true);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(239, 68, 68, 0.12)",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        color: "#ff8a73",
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
                        e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.12)";
                        e.currentTarget.style.color = "#ff8a73";
                      }}
                    >
                      <span>− Log Usage</span>
                    </button>

                    <button
                      type="button"
                      title="View Details"
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
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "var(--text-secondary)",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      <span>Ledger</span>
                      <span style={{ fontSize: "10.5px" }}>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 3. Fixed Bottom Footer / Pagination Bar (Fixed, not scrollable) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 24px",
          backgroundColor: "rgba(14, 18, 26, 0.95)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <button
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 14px",
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
          Page 1 of 1 • ({filteredItems.length} Products Tracked)
        </span>

        <button
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 14px",
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

      {/* 1. Modal: New Product / Material Entry Form */}
      {isNewItemModalOpen && (
        <Modal
          isOpen={isNewItemModalOpen}
          onClose={() => setIsNewItemModalOpen(false)}
          title="New Product Entry"
        >
          <form onSubmit={handleCreateNewItem} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Input
              label="Product / Material Name"
              placeholder="e.g. 0.5mm Frosted PVC Sheet"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Select
                label="Category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                options={[
                  { value: "RAW_MATERIAL", label: "Raw Material" },
                  { value: "HARDWARE", label: "Hardware Fitting" },
                  { value: "CONSUMABLE", label: "Consumable" },
                ]}
              />

              <Select
                label="Unit of Measurement"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                options={[
                  { value: "sheets", label: "sheets" },
                  { value: "meters", label: "meters" },
                  { value: "pieces", label: "pieces" },
                  { value: "rolls", label: "rolls" },
                  { value: "liters", label: "liters" },
                  { value: "kg", label: "kg" },
                  { value: "boxes", label: "boxes" },
                ]}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <Input
                label="Initial Quantity"
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                required
              />

              <Input
                label="Item Price (₹)"
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
              />

              <Input
                label="Min Safety Level"
                type="number"
                value={newMinLevel}
                onChange={(e) => setNewMinLevel(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsNewItemModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Create Product Entry
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. Modal: Update Quantity Anytime */}
      {isQtyModalOpen && (
        <Modal
          isOpen={isQtyModalOpen}
          onClose={() => setIsQtyModalOpen(false)}
          title={`Update Stock Quantity: ${targetItem.name}`}
        >
          <form onSubmit={handleUpdateQuantity} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "10px 12px", backgroundColor: "rgba(255, 255, 255, 0.03)", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Current Available:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                {targetItem.available_stock.toLocaleString()} {targetItem.unit}
              </span>
            </div>

            {/* Mode selection chips */}
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { id: "ADD" as const, label: "➕ Add Stock", color: "#10b981" },
                { id: "DEDUCT" as const, label: "➖ Deduct Qty", color: "#ef4444" },
                { id: "SET" as const, label: "🟰 Set Exact Count", color: "#38bdf8" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setQtyMode(m.id)}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "4px",
                    border: qtyMode === m.id ? `1px solid ${m.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                    backgroundColor: qtyMode === m.id ? "rgba(255, 255, 255, 0.08)" : "transparent",
                    color: qtyMode === m.id ? m.color : "var(--text-secondary)",
                    fontSize: "11.5px",
                    fontWeight: qtyMode === m.id ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <Input
              label={`Quantity to ${qtyMode === "ADD" ? "Add" : qtyMode === "DEDUCT" ? "Deduct" : "Set Directly"}`}
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              required
            />

            <Input
              label="Audit Note / Reason"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. GRN shipment receipt or physical floor audit"
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsQtyModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Apply Quantity Update
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Modal: Report Material Usage */}
      {isUsageModalOpen && (
        <Modal
          isOpen={isUsageModalOpen}
          onClose={() => setIsUsageModalOpen(false)}
          title={`Report Material Usage: ${targetItem.name}`}
        >
          <form onSubmit={handleLogUsage} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "10px 12px", backgroundColor: "rgba(255, 255, 255, 0.03)", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Available for Production:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: "#10b981" }}>
                {targetItem.available_stock.toLocaleString()} {targetItem.unit}
              </span>
            </div>

            <Input
              label="Quantity Consumed / Used"
              type="number"
              value={useQty}
              onChange={(e) => setUseQty(e.target.value)}
              required
            />

            <Input
              label="Production Workstation / Line"
              value={useDestination}
              onChange={(e) => setUseDestination(e.target.value)}
              placeholder="e.g. Press Floor Line 1, Assembly Bench 3"
              required
            />

            <Input
              label="Job Order / Reason"
              value={useReason}
              onChange={(e) => setUseReason(e.target.value)}
              placeholder="e.g. Order #ORD-2026-0001 (500 lanyards run)"
              required
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsUsageModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Record Material Usage
              </Button>
            </div>
          </form>
        </Modal>
      )}

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
                {selectedItem.category.replace("_", " ")} • Code: {selectedItem.code}
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

            {/* Usage & Financial Specs */}
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
                <span style={{ color: "var(--text-muted)" }}>Total Consumed in Production:</span>
                <strong style={{ color: "#ff8a73" }}>{selectedItem.used_stock.toLocaleString()} {selectedItem.unit}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Item Price:</span>
                <strong style={{ color: "#34d399" }}>₹{selectedItem.item_price.toFixed(2)} / {selectedItem.unit}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Total Available Valuation:</span>
                <strong style={{ color: "#34d399" }}>₹{(selectedItem.available_stock * selectedItem.item_price).toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Minimum Safety Level:</span>
                <strong style={{ color: "#fff" }}>{selectedItem.min_stock_level.toLocaleString()} {selectedItem.unit}</strong>
              </div>
            </div>

            {/* Quick Actions inside Drawer */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTargetItem(selectedItem);
                  setIsUsageModalOpen(true);
                }}
              >
                − Log Usage
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setTargetItem(selectedItem);
                  setQtyMode("ADD");
                  setIsQtyModalOpen(true);
                }}
              >
                ± Update Qty
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
