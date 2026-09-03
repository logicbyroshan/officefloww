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
  imageUrl?: string;
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

  // Drawer and Modals
  const [isNewItemDrawerOpen, setIsNewItemDrawerOpen] = useState(false);
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);

  // Active item targeted for Qty or Usage adjustment
  const [targetItem, setTargetItem] = useState<StockRecord>(SEED_STOCK_ITEMS[0]);

  // Form states: New Product Entry Drawer
  const [newImage, setNewImage] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<"RAW_MATERIAL" | "HARDWARE" | "CONSUMABLE">("RAW_MATERIAL");
  const [newUnit, setNewUnit] = useState("pieces");
  const [newQty, setNewQty] = useState("1000");
  const [newPrice, setNewPrice] = useState("10.00");
  const [newMinLevel, setNewMinLevel] = useState("200");
  const [newDestination, setNewDestination] = useState("Thermal Card Press Floor");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toastError("Invalid file", "Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError("File too large", "Image size must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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
      defaultDestination: newDestination || "General Production Floor",
      imageUrl: newImage || undefined,
      iconName: newCategory === "HARDWARE" ? "tool" : newCategory === "CONSUMABLE" ? "sliders" : "layers",
      iconColor: newCategory === "HARDWARE" ? "#c084fc" : newCategory === "CONSUMABLE" ? "#f59e0b" : "#38bdf8",
      iconBg: newCategory === "HARDWARE" ? "rgba(168, 85, 247, 0.12)" : newCategory === "CONSUMABLE" ? "rgba(245, 158, 11, 0.14)" : "rgba(56, 189, 248, 0.12)",
    };

    setStockItems((prev) => [newItem, ...prev]);
    success("New Product Created", `"${newItem.name}" added to catalog with ${initialQty} ${newUnit}.`);
    setIsNewItemDrawerOpen(false);
    setNewName("");
    setNewImage(null);
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

        {/* Right: Search Input + Sort + Category + New Product Button (All matched to 36px height) */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "36px",
              boxSizing: "border-box",
              backgroundColor: "rgba(0, 0, 0, 0.28)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "0 12px",
            }}
          >
            <Icon name="search" size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={activeTab === "inventory" ? "Search Product..." : "Search Material Usage..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "12.5px",
                outline: "none",
                width: "180px",
              }}
            />
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              height: "36px",
              boxSizing: "border-box",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              color: "var(--text-secondary)",
              fontSize: "12.5px",
              padding: "0 12px",
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
              height: "36px",
              boxSizing: "border-box",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              color: "var(--text-secondary)",
              fontSize: "12.5px",
              padding: "0 12px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="ALL" style={{ backgroundColor: "#0e121a" }}>Show All Product ({stockItems.length})</option>
            <option value="RAW_MATERIAL" style={{ backgroundColor: "#0e121a" }}>Raw Materials</option>
            <option value="HARDWARE" style={{ backgroundColor: "#0e121a" }}>Hardware Fittings</option>
            <option value="CONSUMABLE" style={{ backgroundColor: "#0e121a" }}>Consumables</option>
          </select>

          {/* + New Product Button (Opens Creation Drawer) */}
          <Button
            variant="primary"
            size="md"
            icon="plus"
            onClick={() => setIsNewItemDrawerOpen(true)}
          >
            New Product
          </Button>
        </div>
      </div>

      {/* 2. Middle Scrollable Content (Items start immediately) */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
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
                    backgroundColor: "rgba(18, 23, 35, 0.92)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "6px",
                    padding: "16px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "18px",
                    cursor: "pointer",
                    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(26, 33, 50, 0.98)";
                    e.currentTarget.style.borderColor = "var(--accent-border)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.45)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(18, 23, 35, 0.92)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.25)";
                  }}
                >
                  {/* Column 1: Larger Visual (58px) + Title (15px) + Category (12px) */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "320px", flexShrink: 0 }}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: "6px",
                          objectFit: "cover",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: "6px",
                          backgroundColor: item.iconBg,
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                          flexShrink: 0,
                        }}
                      >
                        <Icon name={item.iconName} size={24} color={item.iconColor} />
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", overflow: "hidden" }}>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#ffffff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          letterSpacing: "-0.15px",
                        }}
                      >
                        {item.name}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                        {categoryBadge}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: Usage Reporting */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "135px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      Total Used
                    </span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 800, color: "#ff8a73" }}>
                        {item.used_stock.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{item.unit}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{usageRate}% consumption</span>
                  </div>

                  {/* Column 3: Performance Arc Gauge */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", width: "85px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: gaugeColor }}>
                      {performanceLabel}
                    </span>
                    <StockGaugeArc percentage={performanceScore} color={gaugeColor} />
                  </div>

                  {/* Column 4: Available Stock */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "130px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      Floor Stock
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "13px" }}>📦</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "15.5px", fontWeight: 800, color: "#ffffff" }}>
                        {item.available_stock.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{item.unit}</span>
                    </div>
                    {item.reserved_stock > 0 && (
                      <span style={{ fontSize: "11px", color: "var(--status-warning)", fontWeight: 500 }}>
                        {item.reserved_stock.toLocaleString()} reserved
                      </span>
                    )}
                  </div>

                  {/* Column 5: Item Price */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "130px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      Item Price
                    </span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "15.5px", fontWeight: 800, color: "#34d399" }}>
                        ₹{item.item_price.toFixed(2)}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>/ {item.unit}</span>
                    </div>
                  </div>

                  {/* Column 6: Visibility Toggle Switch */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "85px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 500 }}>Visibility</span>
                    <div
                      onClick={(e) => handleToggleActive(item.id, e)}
                      style={{
                        width: 36,
                        height: 20,
                        borderRadius: "10px",
                        backgroundColor: item.active ? "var(--accent)" : "rgba(255, 255, 255, 0.15)",
                        position: "relative",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: item.active ? "#090c13" : "#cbd5e1",
                          position: "absolute",
                          top: 2,
                          left: item.active ? 18 : 2,
                          transition: "left 0.2s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Column 7: Action Buttons (High-End Tactile Buttons) */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    {/* 1. Add Addition Report button */}
                    <button
                      type="button"
                      title="Report Stock Addition"
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
                        gap: "6px",
                        height: "36px",
                        padding: "0 15px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(16, 185, 129, 0.14)",
                        backgroundImage: "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.26) 100%)",
                        border: "1px solid rgba(52, 211, 153, 0.4)",
                        color: "#34d399",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        letterSpacing: "0.2px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundImage = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                        e.currentTarget.style.color = "#090c13";
                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.4)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundImage = "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.26) 100%)";
                        e.currentTarget.style.color = "#34d399";
                        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.25)";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: 900 }}>+</span>
                      <span>Add Report</span>
                    </button>

                    {/* 2. Usage Report button */}
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
                        gap: "6px",
                        height: "36px",
                        padding: "0 15px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 138, 115, 0.14)",
                        backgroundImage: "linear-gradient(135deg, rgba(255, 138, 115, 0.16) 0%, rgba(244, 63, 94, 0.22) 100%)",
                        border: "1px solid rgba(255, 138, 115, 0.45)",
                        color: "var(--accent-text)",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        letterSpacing: "0.2px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundImage = "linear-gradient(135deg, #ff8a73 0%, #ff6b8b 100%)";
                        e.currentTarget.style.color = "#090c13";
                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(255, 107, 139, 0.4)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundImage = "linear-gradient(135deg, rgba(255, 138, 115, 0.16) 0%, rgba(244, 63, 94, 0.22) 100%)";
                        e.currentTarget.style.color = "var(--accent-text)";
                        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.25)";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: 900 }}>−</span>
                      <span>Usage Report</span>
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
                    backgroundColor: "rgba(18, 23, 35, 0.92)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "6px",
                    padding: "16px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "18px",
                    cursor: "pointer",
                    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(26, 33, 50, 0.98)";
                    e.currentTarget.style.borderColor = "var(--accent-border)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.45)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(18, 23, 35, 0.92)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.25)";
                  }}
                >
                  {/* Column 1: Material Visual (58px) & Title (15px) */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "320px", flexShrink: 0 }}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: "6px",
                          objectFit: "cover",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: "6px",
                          backgroundColor: item.iconBg,
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                          flexShrink: 0,
                        }}
                      >
                        <Icon name={item.iconName} size={24} color={item.iconColor} />
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", overflow: "hidden" }}>
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#ffffff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          letterSpacing: "-0.15px",
                        }}
                      >
                        {item.name}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                        {categoryBadge}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: Total Used & Consumed */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "135px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      Material Used
                    </span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "15.5px", fontWeight: 800, color: "#ff8a73" }}>
                        {item.used_stock.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{item.unit}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 600 }}>{usageRate}% of Total Run</span>
                  </div>

                  {/* Column 3: Consumption Rate Arc Gauge */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", width: "85px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: gaugeColor }}>
                      {usageStatus}
                    </span>
                    <StockGaugeArc percentage={usageRate} color={gaugeColor} />
                  </div>

                  {/* Column 4: Available Stock Remaining */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "135px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      Stock Remaining
                    </span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "15.5px", fontWeight: 800, color: "#ffffff" }}>
                        {item.available_stock.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{item.unit}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Floor: {item.defaultDestination}
                    </span>
                  </div>

                  {/* Column 5: Consumed Valuation */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "135px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      Usage Valuation
                    </span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "15.5px", fontWeight: 800, color: "#34d399" }}>
                        ₹{consumedValue.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      ₹{item.item_price.toFixed(2)} / {item.unit}
                    </span>
                  </div>

                  {/* Column 6: Action Buttons (High-End Tactile Buttons) */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    {/* 1. Add Addition Report button */}
                    <button
                      type="button"
                      title="Report Stock Addition"
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
                        gap: "6px",
                        height: "36px",
                        padding: "0 15px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(16, 185, 129, 0.14)",
                        backgroundImage: "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.26) 100%)",
                        border: "1px solid rgba(52, 211, 153, 0.4)",
                        color: "#34d399",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        letterSpacing: "0.2px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundImage = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                        e.currentTarget.style.color = "#090c13";
                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.4)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundImage = "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.26) 100%)";
                        e.currentTarget.style.color = "#34d399";
                        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.25)";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: 900 }}>+</span>
                      <span>Add Report</span>
                    </button>

                    {/* 2. Usage Report button */}
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
                        gap: "6px",
                        height: "36px",
                        padding: "0 15px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 138, 115, 0.14)",
                        backgroundImage: "linear-gradient(135deg, rgba(255, 138, 115, 0.16) 0%, rgba(244, 63, 94, 0.22) 100%)",
                        border: "1px solid rgba(255, 138, 115, 0.45)",
                        color: "var(--accent-text)",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        letterSpacing: "0.2px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundImage = "linear-gradient(135deg, #ff8a73 0%, #ff6b8b 100%)";
                        e.currentTarget.style.color = "#090c13";
                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(255, 107, 139, 0.4)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundImage = "linear-gradient(135deg, rgba(255, 138, 115, 0.16) 0%, rgba(244, 63, 94, 0.22) 100%)";
                        e.currentTarget.style.color = "var(--accent-text)";
                        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.25)";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: 900 }}>−</span>
                      <span>Usage Report</span>
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

      {/* 1. Full Slide-Over Drawer: Add New Product / Material with Image Upload */}
      {isNewItemDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsNewItemDrawerOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(6px)",
              zIndex: 999,
            }}
          />

          {/* Drawer Panel */}
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "520px",
              maxWidth: "96vw",
              backgroundColor: "rgba(14, 18, 26, 0.98)",
              backdropFilter: "blur(24px)",
              borderLeft: "1px solid var(--accent-border)",
              boxShadow: "-16px 0 48px rgba(0, 0, 0, 0.85)",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                backgroundColor: "rgba(255, 255, 255, 0.01)",
              }}
            >
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.2px" }}>
                  Add New Product / Material
                </h2>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px", display: "block" }}>
                  Upload product photo and register material into factory catalog
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewItemDrawerOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "4px",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <form
              onSubmit={handleCreateNewItem}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {/* 1. PRODUCT IMAGE UPLOAD SECTION (First as requested!) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Product / Material Image
                  </label>
                  <span style={{ fontSize: "11px", color: "var(--accent-text)", fontWeight: 500 }}>
                    Visual identification
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageSelect(e.target.files[0]);
                    }
                  }}
                />

                {newImage ? (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "170px",
                      borderRadius: "6px",
                      border: "1px solid var(--accent-border)",
                      overflow: "hidden",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={newImage}
                      alt="Uploaded Product"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        display: "flex",
                        gap: "8px",
                        backgroundColor: "rgba(14, 18, 26, 0.85)",
                        backdropFilter: "blur(8px)",
                        padding: "4px 6px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent-text)",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: "3px 6px",
                        }}
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewImage(null)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: "3px 6px",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "var(--accent)";
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImageSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "140px",
                      borderRadius: "6px",
                      border: "2px dashed rgba(255, 255, 255, 0.14)",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent-border)";
                      e.currentTarget.style.backgroundColor = "rgba(255, 138, 115, 0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(255, 138, 115, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-text)" }}>
                      <Icon name="upload" size={18} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#fff" }}>
                        Click to upload or drag & drop product photo
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                        PNG, JPG, WEBP formats up to 5MB
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. PRODUCT / MATERIAL NAME */}
              <Input
                label="Product / Material Name"
                placeholder="e.g. 0.76mm Frosted Clear PVC Sheet"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />

              {/* 3. CATEGORY & UNIT */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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

              {/* 4. QUANTITY, PRICE, MIN LEVEL */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
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

              {/* 5. DESTINATION WORKSTATION */}
              <Input
                label="Default Factory Line / Destination"
                placeholder="e.g. Thermal Card Press Floor, Line 1"
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
              />

              {/* DRAWER FOOTER BUTTONS */}
              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  paddingTop: "16px",
                  marginTop: "auto",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsNewItemDrawerOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                >
                  Create Product Entry
                </Button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* 2. Modal: Update Quantity / Stock Addition Report */}
      {isQtyModalOpen && (
        <Modal
          isOpen={isQtyModalOpen}
          onClose={() => setIsQtyModalOpen(false)}
          title={`Stock Report: ${targetItem.name}`}
        >
          <form onSubmit={handleUpdateQuantity} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Target Product Banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "12px 16px",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {targetItem.imageUrl ? (
                <img
                  src={targetItem.imageUrl}
                  alt={targetItem.name}
                  style={{ width: 46, height: 46, borderRadius: "5px", objectFit: "cover", border: "1px solid rgba(255, 255, 255, 0.15)" }}
                />
              ) : (
                <div style={{ width: 46, height: 46, borderRadius: "5px", backgroundColor: targetItem.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={targetItem.iconName} size={22} color={targetItem.iconColor} />
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{targetItem.name}</span>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Current Available:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13.5px", fontWeight: 700, color: "#38bdf8" }}>
                    {targetItem.available_stock.toLocaleString()} {targetItem.unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Mode selection chips */}
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { id: "ADD" as const, label: "➕ Add Stock", color: "#10b981", activeBg: "rgba(16, 185, 129, 0.18)" },
                { id: "DEDUCT" as const, label: "➖ Deduct Qty", color: "#ef4444", activeBg: "rgba(239, 68, 68, 0.18)" },
                { id: "SET" as const, label: "🟰 Set Exact Count", color: "#38bdf8", activeBg: "rgba(56, 189, 248, 0.18)" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setQtyMode(m.id)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: "5px",
                    border: qtyMode === m.id ? `1.5px solid ${m.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                    backgroundColor: qtyMode === m.id ? m.activeBg : "rgba(255, 255, 255, 0.02)",
                    color: qtyMode === m.id ? m.color : "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: qtyMode === m.id ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Quantity Input + Quick Add Chips */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Input
                label={`Quantity to ${qtyMode === "ADD" ? "Add" : qtyMode === "DEDUCT" ? "Deduct" : "Set Directly"}`}
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required
              />
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Quick Set:</span>
                {[100, 250, 500, 1000, 2500, 5000].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAdjustQty(q.toString())}
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "3px",
                      color: "var(--text-secondary)",
                      padding: "3px 8px",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    +{q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            {(() => {
              const delta = parseInt(adjustQty, 10) || 0;
              let nextAvailable = targetItem.available_stock;
              if (qtyMode === "ADD") nextAvailable += delta;
              else if (qtyMode === "DEDUCT") nextAvailable = Math.max(0, nextAvailable - delta);
              else if (qtyMode === "SET") nextAvailable = delta;

              return (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "5px",
                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {qtyMode === "ADD" ? "Adding" : qtyMode === "DEDUCT" ? "Deducting" : "Setting"}: <strong style={{ color: "#fff" }}>{delta.toLocaleString()} {targetItem.unit}</strong>
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Resulting Stock:</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 800, color: "#34d399" }}>
                      {nextAvailable.toLocaleString()} {targetItem.unit}
                    </span>
                  </div>
                </div>
              );
            })()}

            <Input
              label="Audit Note / Reason"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. GRN shipment receipt or physical floor audit"
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <Button variant="secondary" size="md" onClick={() => setIsQtyModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit">
                Record Addition Report
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
          title={`Log Material Usage: ${targetItem.name}`}
        >
          <form onSubmit={handleLogUsage} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Target Product Banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "12px 16px",
                backgroundColor: "rgba(255, 138, 115, 0.06)",
                borderRadius: "6px",
                border: "1px solid rgba(255, 138, 115, 0.18)",
              }}
            >
              {targetItem.imageUrl ? (
                <img
                  src={targetItem.imageUrl}
                  alt={targetItem.name}
                  style={{ width: 46, height: 46, borderRadius: "5px", objectFit: "cover", border: "1px solid rgba(255, 255, 255, 0.15)" }}
                />
              ) : (
                <div style={{ width: 46, height: 46, borderRadius: "5px", backgroundColor: targetItem.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={targetItem.iconName} size={22} color={targetItem.iconColor} />
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{targetItem.name}</span>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Floor Stock:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13.5px", fontWeight: 700, color: "#ff8a73" }}>
                    {targetItem.available_stock.toLocaleString()} {targetItem.unit}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>• ₹{targetItem.item_price.toFixed(2)}/{targetItem.unit}</span>
                </div>
              </div>
            </div>

            {/* Quantity Input + Quick Use Chips */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Input
                label="Quantity Consumed / Used in Production"
                type="number"
                value={useQty}
                onChange={(e) => setUseQty(e.target.value)}
                required
              />
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Quick Set:</span>
                {[50, 100, 250, 500, 1000].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setUseQty(q.toString())}
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "3px",
                      color: "var(--text-secondary)",
                      padding: "3px 8px",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    −{q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Financial Valuation & Balance Card */}
            {(() => {
              const qty = parseInt(useQty, 10) || 0;
              const val = qty * targetItem.item_price;
              const remaining = Math.max(0, targetItem.available_stock - qty);

              return (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "5px",
                    backgroundColor: "rgba(255, 138, 115, 0.08)",
                    border: "1px solid rgba(255, 138, 115, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Usage Financial Value</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 800, color: "#34d399" }}>
                      ₹{val.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Remaining Floor Stock</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                      {remaining.toLocaleString()} {targetItem.unit}
                    </span>
                  </div>
                </div>
              );
            })()}

            <Input
              label="Production Workstation / Line"
              value={useDestination}
              onChange={(e) => setUseDestination(e.target.value)}
              placeholder="e.g. Thermal Card Press Floor, Line 1"
              required
            />

            <Input
              label="Job Order / Reason"
              value={useReason}
              onChange={(e) => setUseReason(e.target.value)}
              placeholder="e.g. Production run for Order #ORD-2026-0001"
              required
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <Button variant="secondary" size="md" onClick={() => setIsUsageModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit">
                Submit Usage Report
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
