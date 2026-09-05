import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { Modal, Drawer } from "../../design-system/components/Modal";
import { Input, Select } from "../../design-system/components/Input";
import { Tabs } from "../../design-system/components/Tabs";
import { useToast } from "../../design-system/components/Toast";

// ─── Stock Item Interface (NO PRICING) ─────────────────────────────────────────
export type StockCategory = "HOOKS" | "HOLDERS" | "LANYARDS" | "OTHERS";

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  unit: string;
  availableStock: number;
  usedStock: number;
  reservedStock: number;
  minThreshold: number;
  workstation: string;
  iconName: "tool" | "layers" | "package" | "tag";
  iconColor: string;
}

// ─── The Fixed 14 Items ───────────────────────────────────────────────────────
export const INITIAL_STOCK_ITEMS: StockItem[] = [
  // 3 Hooks (Unit: pieces)
  {
    id: "stk-hook-1",
    name: "Dog Hook",
    category: "HOOKS",
    unit: "pieces",
    availableStock: 8500,
    usedStock: 7500,
    reservedStock: 1500,
    minThreshold: 2000,
    workstation: "Lanyard Stitching Bench 2",
    iconName: "tool",
    iconColor: "#c084fc",
  },
  {
    id: "stk-hook-2",
    name: "England Hook",
    category: "HOOKS",
    unit: "pieces",
    availableStock: 6200,
    usedStock: 4800,
    reservedStock: 1000,
    minThreshold: 1500,
    workstation: "Lanyard Stitching Bench 1",
    iconName: "tool",
    iconColor: "#a855f7",
  },
  {
    id: "stk-hook-3",
    name: "Plastic Hook",
    category: "HOOKS",
    unit: "pieces",
    availableStock: 11400,
    usedStock: 9200,
    reservedStock: 2000,
    minThreshold: 3000,
    workstation: "Assembly Table 03",
    iconName: "tool",
    iconColor: "#38bdf8",
  },

  // 5 Holders (Unit: pieces)
  {
    id: "stk-holder-1",
    name: "Plastic Holder-V",
    category: "HOLDERS",
    unit: "pieces",
    availableStock: 9500,
    usedStock: 6800,
    reservedStock: 2500,
    minThreshold: 2000,
    workstation: "Card Packaging Station A",
    iconName: "layers",
    iconColor: "#34d399",
  },
  {
    id: "stk-holder-2",
    name: "Plastic Holder-H",
    category: "HOLDERS",
    unit: "pieces",
    availableStock: 8200,
    usedStock: 5400,
    reservedStock: 1800,
    minThreshold: 2000,
    workstation: "Card Packaging Station B",
    iconName: "layers",
    iconColor: "#10b981",
  },
  {
    id: "stk-holder-3",
    name: "DST-V",
    category: "HOLDERS",
    unit: "pieces",
    availableStock: 4500,
    usedStock: 3200,
    reservedStock: 1200,
    minThreshold: 1000,
    workstation: "Specialty Mounting Line",
    iconName: "layers",
    iconColor: "#f59e0b",
  },
  {
    id: "stk-holder-4",
    name: "DST-H",
    category: "HOLDERS",
    unit: "pieces",
    availableStock: 3800,
    usedStock: 2900,
    reservedStock: 800,
    minThreshold: 1000,
    workstation: "Specialty Mounting Line",
    iconName: "layers",
    iconColor: "#fbbf24",
  },
  {
    id: "stk-holder-5",
    name: "Crystal Holder",
    category: "HOLDERS",
    unit: "pieces",
    availableStock: 5200,
    usedStock: 4100,
    reservedStock: 1500,
    minThreshold: 1200,
    workstation: "VIP Badge Assembly Line",
    iconName: "layers",
    iconColor: "#60a5fa",
  },

  // 3 Lanyard Types (Unit: rolls - tracked in roll units like 1 roll, 2 rolls)
  {
    id: "stk-lanyard-1",
    name: "12mm Lanyard Rolls",
    category: "LANYARDS",
    unit: "rolls",
    availableStock: 45,
    usedStock: 28,
    reservedStock: 8,
    minThreshold: 10,
    workstation: "Sublimation Press Line 1",
    iconName: "package",
    iconColor: "#ff8a73",
  },
  {
    id: "stk-lanyard-2",
    name: "16mm Lanyard Rolls",
    category: "LANYARDS",
    unit: "rolls",
    availableStock: 6, // Low Stock Alert (< 8 minThreshold)
    usedStock: 45,
    reservedStock: 6,
    minThreshold: 8,
    workstation: "Sublimation Press Line 2",
    iconName: "package",
    iconColor: "#ea580c",
  },
  {
    id: "stk-lanyard-3",
    name: "20mm Lanyard Rolls",
    category: "LANYARDS",
    unit: "rolls",
    availableStock: 58,
    usedStock: 42,
    reservedStock: 12,
    minThreshold: 15,
    workstation: "Sublimation Press Line 1",
    iconName: "package",
    iconColor: "#f97316",
  },

  // Others (Clips in packet of 1000, Rings in pieces, Pins in packets)
  {
    id: "stk-other-1",
    name: "Clips",
    category: "OTHERS",
    unit: "packets of 1000",
    availableStock: 18, // 18 packets = 18,000 clips
    usedStock: 12,
    reservedStock: 4,
    minThreshold: 5,
    workstation: "Lanyard Ring & Clip Table",
    iconName: "tag",
    iconColor: "#ec4899",
  },
  {
    id: "stk-other-2",
    name: "Rings",
    category: "OTHERS",
    unit: "pieces",
    availableStock: 14500,
    usedStock: 11200,
    reservedStock: 3000,
    minThreshold: 4000,
    workstation: "Metal Ring Press Bench",
    iconName: "tag",
    iconColor: "#d946ef",
  },
  {
    id: "stk-other-3",
    name: "Pins",
    category: "OTHERS",
    unit: "packets of 1000",
    availableStock: 4, // Low Stock Alert (< 6 minThreshold)
    usedStock: 37,
    reservedStock: 5,
    minThreshold: 6,
    workstation: "Badge Pinning Bench",
    iconName: "tag",
    iconColor: "#a855f7",
  },
];

// ─── Unit Options for Dropdown ────────────────────────────────────────────────
export const STOCK_UNIT_OPTIONS = [
  "pieces",
  "rolls",
  "packets of 1000",
  "meters",
  "boxes",
  "sets",
  "packets",
];

// ─── Movement / Usage Log Record ──────────────────────────────────────────────
interface StockMovementLog {
  id: string;
  timestamp: string;
  itemName: string;
  type: "ADDITION" | "USAGE";
  quantity: number;
  unit: string;
  destinationOrSource: string;
  reportedBy: string;
  notes: string;
}

const SEED_MOVEMENTS: StockMovementLog[] = [
  { id: "mov-1", timestamp: "Today, 02:45 PM", itemName: "12mm Lanyard Rolls", type: "USAGE", quantity: 3, unit: "rolls", destinationOrSource: "Sublimation Line 1", reportedBy: "Vikram Singh", notes: "St. Xavier's High School Order batch" },
  { id: "mov-2", timestamp: "Today, 11:15 AM", itemName: "Dog Hook", type: "USAGE", quantity: 500, unit: "pieces", destinationOrSource: "Lanyard Stitching Table 2", reportedBy: "Ramesh Labour", notes: "Northwind Coffee lanyards assembly" },
  { id: "mov-3", timestamp: "Today, 09:30 AM", itemName: "Rings", type: "USAGE", quantity: 1200, unit: "pieces", destinationOrSource: "Metal Ring Press Bench", reportedBy: "Suresh Workshop", notes: "BHEL badges fitting batch" },
  { id: "mov-4", timestamp: "Yesterday, 05:10 PM", itemName: "16mm Lanyard Rolls", type: "USAGE", quantity: 4, unit: "rolls", destinationOrSource: "Sublimation Press Line 2", reportedBy: "Kailash Sublimation", notes: "AIIMS Staff Lanyards run" },
  { id: "mov-5", timestamp: "Yesterday, 04:30 PM", itemName: "Clips", type: "ADDITION", quantity: 5, unit: "packets of 1000", destinationOrSource: "Supplier Receipt Bay", reportedBy: "Amit Patel", notes: "Vendor delivery receipt" },
  { id: "mov-6", timestamp: "Yesterday, 02:00 PM", itemName: "Pins", type: "USAGE", quantity: 6, unit: "packets of 1000", destinationOrSource: "Badge Pinning Bench", reportedBy: "Dinesh Labour", notes: "Symbiosis Event Badges" },
  { id: "mov-7", timestamp: "01 Sep 2026", itemName: "Plastic Holder-V", type: "USAGE", quantity: 800, unit: "pieces", destinationOrSource: "Packaging Bench A", reportedBy: "Priya Sharma", notes: "Govt Engineering College order" },
  { id: "mov-8", timestamp: "01 Sep 2026", itemName: "Plastic Hook", type: "USAGE", quantity: 1500, unit: "pieces", destinationOrSource: "Assembly Table 03", reportedBy: "Ramesh Labour", notes: "Delhi Public School lanyards assembly" },
  { id: "mov-9", timestamp: "31 Aug 2026", itemName: "Crystal Holder", type: "USAGE", quantity: 400, unit: "pieces", destinationOrSource: "VIP Badge Assembly Line", reportedBy: "Sunita Printing", notes: "Executive summit badges" },
  { id: "mov-10", timestamp: "30 Aug 2026", itemName: "Plastic Holder-H", type: "USAGE", quantity: 600, unit: "pieces", destinationOrSource: "Assembly Line 02", reportedBy: "Suresh Workshop", notes: "HCL conference badge inserts" },
  { id: "mov-11", timestamp: "30 Aug 2026", itemName: "England Hook", type: "USAGE", quantity: 800, unit: "pieces", destinationOrSource: "Lanyard Stitching Table 1", reportedBy: "Ramesh Labour", notes: "Rotary Club annual badges" },
  { id: "mov-12", timestamp: "29 Aug 2026", itemName: "DST-V", type: "USAGE", quantity: 500, unit: "pieces", destinationOrSource: "Stitching Bench 3", reportedBy: "Dinesh Labour", notes: "Metro Railway personnel ID cards" },
  { id: "mov-13", timestamp: "28 Aug 2026", itemName: "DST-H", type: "USAGE", quantity: 450, unit: "pieces", destinationOrSource: "Card Assembly Line", reportedBy: "Priya Sharma", notes: "Bank of Baroda staff passes" },
  { id: "mov-14", timestamp: "28 Aug 2026", itemName: "20mm Lanyard Rolls", type: "USAGE", quantity: 5, unit: "rolls", destinationOrSource: "Wide Sublimation Press", reportedBy: "Vikram Singh", notes: "Tech Mahindra VIP neckbands" },
  { id: "mov-15", timestamp: "27 Aug 2026", itemName: "Dog Hook", type: "USAGE", quantity: 1000, unit: "pieces", destinationOrSource: "Assembly Table 01", reportedBy: "Dinesh Labour", notes: "Apex Hospitals lanyards issue" },
  { id: "mov-16", timestamp: "26 Aug 2026", itemName: "Rings", type: "USAGE", quantity: 2000, unit: "pieces", destinationOrSource: "Metal Ring Press Bench", reportedBy: "Ramesh Labour", notes: "Tata Motors badge rings" },
];

export const StockDashboardView: React.FC = () => {
  const { success } = useToast();

  // Navigation: Inventory Table or Movement Log
  const [activeTab, setActiveTab] = useState<"inventory" | "log">("inventory");
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCK_ITEMS);
  const [movements, setMovements] = useState<StockMovementLog[]>(SEED_MOVEMENTS);

  // Search & Column Header Sorting (Like Orders Workspace)
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "availableStock" | "usedStock" | "minThreshold">("availableStock");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (field: "name" | "availableStock" | "usedStock" | "minThreshold") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  };

  // Double-Click Inline Editing State
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof StockItem } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  // Modals & Drawers (Report Stock Addition & Slide-Over Usage Drawer)
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isUsageDrawerOpen, setIsUsageDrawerOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<StockItem>(INITIAL_STOCK_ITEMS[0]);

  // Addition Form fields
  const [adjustQty, setAdjustQty] = useState("500");
  const [adjustSource, setAdjustSource] = useState("Vendor Receipt / Plant Storeroom");
  const [adjustNote, setAdjustNote] = useState("Warehouse replenishment");

  // Usage Drawer Form fields (Who took it, where, why, qty)
  const [useQty, setUseQty] = useState("200");
  const [useReportedBy, setUseReportedBy] = useState("Ramesh Labour");
  const [useDestination, setUseDestination] = useState("Production Assembly Floor");
  const [useNote, setUseNote] = useState("Issued for current client order");

  // New Item Form fields
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<StockCategory>("HOOKS");
  const [newItemUnit, setNewItemUnit] = useState("pieces");
  const [newItemQty, setNewItemQty] = useState("1000");

  // ─── Filtered Items (Searched & Sorted) ───────────────────────────────────────
  const filteredItems = useMemo(() => {
    let list = stockItems.filter((i) => {
      const q = search.toLowerCase().trim();
      return !q || i.name.toLowerCase().includes(q) || i.unit.toLowerCase().includes(q);
    });

    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = (a[sortField] || 0) - (b[sortField] || 0);
      }
      return sortDir === "asc" ? comparison : -comparison;
    });

    return list;
  }, [stockItems, search, sortField, sortDir]);

  // ─── Double Click Handlers ──────────────────────────────────────────────────
  const handleStartEdit = (item: StockItem, field: keyof StockItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCell({ id: item.id, field });
    setEditValue(String(item[field] ?? ""));
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;

    setStockItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (field === "availableStock" || field === "usedStock" || field === "reservedStock" || field === "minThreshold") {
          const num = parseInt(editValue, 10);
          return { ...i, [field]: isNaN(num) ? 0 : num };
        }
        return { ...i, [field]: editValue };
      })
    );

    setEditingCell(null);
    success("Saved", `Updated stock ${field}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  // ─── Stock Adjustments ───────────────────────────────────────────────────────
  const handleConfirmAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(adjustQty, 10) || 0;
    setStockItems((prev) =>
      prev.map((i) => (i.id === targetItem.id ? { ...i, availableStock: i.availableStock + qty } : i))
    );
    setMovements([
      {
        id: `mov-${Date.now()}`,
        timestamp: "Just now",
        itemName: targetItem.name,
        type: "ADDITION",
        quantity: qty,
        unit: targetItem.unit,
        destinationOrSource: adjustSource,
        reportedBy: "Floor Supervisor",
        notes: adjustNote,
      },
      ...movements,
    ]);
    setIsAddStockModalOpen(false);
    success("Stock Added", `Added +${qty} ${targetItem.unit} of ${targetItem.name}`);
  };

  const handleConfirmLogUsage = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(useQty, 10) || 0;
    if (qty <= 0) return;

    setStockItems((prev) =>
      prev.map((i) =>
        i.id === targetItem.id
          ? {
              ...i,
              availableStock: Math.max(0, i.availableStock - qty),
              usedStock: i.usedStock + qty,
            }
          : i
      )
    );

    // Update target item so top summary card in drawer updates in real-time
    setTargetItem((prev) => ({
      ...prev,
      availableStock: Math.max(0, prev.availableStock - qty),
      usedStock: prev.usedStock + qty,
    }));

    const newLog: StockMovementLog = {
      id: `mov-${Date.now()}`,
      timestamp: "Just now",
      itemName: targetItem.name,
      type: "USAGE",
      quantity: qty,
      unit: targetItem.unit,
      destinationOrSource: useDestination || "Production Floor",
      reportedBy: useReportedBy || "Assembly Operator",
      notes: useNote || "Batch usage recorded",
    };

    setMovements([newLog, ...movements]);
    success("Usage Recorded", `Deducted -${qty} ${targetItem.unit} brought/taken by ${useReportedBy || "Operator"}`);
    setUseQty(targetItem.unit === "rolls" ? "2" : targetItem.unit.includes("packet") ? "2" : "100");
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StockItem = {
      id: `stk-custom-${Date.now()}`,
      name: newItemName || "Custom Fitting",
      category: newItemCategory,
      unit: newItemUnit,
      availableStock: parseInt(newItemQty, 10) || 1000,
      usedStock: 0,
      reservedStock: 0,
      minThreshold: 200,
      workstation: "General Floor Storeroom",
      iconName: "package",
      iconColor: "#c084fc",
    };
    setStockItems([newItem, ...stockItems]);
    setIsNewItemModalOpen(false);
    setNewItemName("");
    success("Item Added", `${newItem.name} registered in stock`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>

      {/* ─── SINGLE COMPACT HEADER (No Pricing, No Large Titles) ─────────────── */}
      <div
        style={{
          padding: "12px 24px",
          backgroundColor: "rgba(14, 18, 26, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          position: "sticky",
          top: 0,
          zIndex: 30,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: View Switcher (Inventory Table / Movement Log) & Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "320px", maxWidth: "680px" }}>
          <Tabs
            variant="pill"
            size="sm"
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            tabs={[
              { id: "inventory", label: "Stocks Inventory", badge: stockItems.length },
              { id: "log", label: "Material Usage Log" },
            ]}
          />

          <div
            style={{
              position: "relative",
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "var(--radius-sm, 4px)",
              height: "var(--input-height, 36px)",
              display: "flex",
              alignItems: "center",
              padding: "0 10px",
              gap: "8px",
            }}
          >
            <Icon name="search" size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search hook, holder, roll, clips, pins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "12.5px",
              }}
            />
          </div>
        </div>

        {/* Right: Double Click Hint & Action */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ color: "#38bdf8" }}>💡</span> Double-click any cell to edit stock values
          </span>

          <Button
            variant="primary"
            size="sm"
            icon="plus"
            onClick={() => setIsNewItemModalOpen(true)}
          >
            New Stock Item
          </Button>
        </div>
      </div>

      {/* ─── TAB 1: STOCKS INVENTORY TABLE (Polished Orders Table Style, 68px Rows, Dividing Lines) ─── */}
      {activeTab === "inventory" ? (
        <div style={{ padding: "18px 24px 24px 24px", flex: 1 }}>
          <div
            style={{
              backgroundColor: "rgba(16, 21, 32, 0.85)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              borderRadius: "6px",
              boxShadow: "0 10px 36px rgba(0, 0, 0, 0.48)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "13px" }}>
              <thead>
                <tr
                  style={{
                    background: "linear-gradient(180deg, #161c2c 0%, #0d121c 100%)",
                    color: "#94a3b8",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    fontWeight: 800,
                    letterSpacing: "0.8px",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {/* 1. STOCK ITEM NAME */}
                  <th
                    style={{
                      padding: "16px 18px",
                      textAlign: "left",
                      cursor: "pointer",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => toggleSort("name")}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                      <span style={{ whiteSpace: "nowrap" }}>Stock Item Name</span>
                      {sortField === "name" && (
                        <span style={{ color: "var(--accent-text)", fontSize: "9px", flexShrink: 0 }}>
                          {sortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </span>
                  </th>

                  {/* 2. UNIT / PACKAGING */}
                  <th
                    style={{
                      padding: "16px 18px",
                      textAlign: "center",
                      width: "180px",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Unit / Packaging
                  </th>

                  {/* 3. FLOOR AVAILABLE */}
                  <th
                    style={{
                      padding: "16px 18px",
                      textAlign: "right",
                      width: "195px",
                      cursor: "pointer",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => toggleSort("availableStock")}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", whiteSpace: "nowrap" }}>
                      <span style={{ whiteSpace: "nowrap" }}>Floor Available</span>
                      {sortField === "availableStock" && (
                        <span style={{ color: "var(--accent-text)", fontSize: "9px", flexShrink: 0 }}>
                          {sortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </span>
                  </th>

                  {/* 4. TOTAL CONSUMED */}
                  <th
                    style={{
                      padding: "16px 18px",
                      textAlign: "right",
                      width: "185px",
                      cursor: "pointer",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => toggleSort("usedStock")}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", whiteSpace: "nowrap" }}>
                      <span style={{ whiteSpace: "nowrap" }}>Total Consumed</span>
                      {sortField === "usedStock" && (
                        <span style={{ color: "var(--accent-text)", fontSize: "9px", flexShrink: 0 }}>
                          {sortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </span>
                  </th>

                  {/* 5. MIN ALERT */}
                  <th
                    style={{
                      padding: "16px 18px",
                      textAlign: "right",
                      width: "160px",
                      cursor: "pointer",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => toggleSort("minThreshold")}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", whiteSpace: "nowrap" }}>
                      <span style={{ whiteSpace: "nowrap" }}>Min Alert</span>
                      {sortField === "minThreshold" && (
                        <span style={{ color: "var(--accent-text)", fontSize: "9px", flexShrink: 0 }}>
                          {sortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </span>
                  </th>

                  {/* 6. ACTIONS */}
                  <th
                    style={{
                      padding: "16px 18px",
                      textAlign: "center",
                      width: "230px",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "50px 0", textAlign: "center", color: "var(--text-muted)" }}>
                      No stock items found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isEditing = (field: keyof StockItem) =>
                      editingCell?.id === item.id && editingCell?.field === field;
                    const isLowStock = item.availableStock <= item.minThreshold;

                    return (
                      <tr
                        key={item.id}
                        style={{
                          height: "68px",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                          backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)")}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)")
                        }
                      >
                        {/* 1. Stock Item Name */}
                        <td
                          style={{
                            padding: "16px 18px",
                            cursor: "text",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                            verticalAlign: "middle",
                          }}
                          onDoubleClick={(e) => handleStartEdit(item, "name", e)}
                          title="Double-click to edit item name"
                        >
                          {isEditing("name") ? (
                            <input
                              ref={editInputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={handleKeyDown}
                              style={{
                                width: "100%",
                                height: "36px",
                                padding: "0 10px",
                                backgroundColor: "rgba(0, 0, 0, 0.85)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "4px",
                                color: "#fff",
                                fontSize: "13.5px",
                                fontWeight: 700,
                                outline: "none",
                              }}
                            />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "4px",
                                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                                  border: "1px solid rgba(255, 255, 255, 0.08)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: item.iconColor,
                                  flexShrink: 0,
                                }}
                              >
                                <Icon name={item.iconName} size={16} color={item.iconColor} />
                              </div>
                              <span style={{ color: "#ffffff", fontSize: "13.5px", fontWeight: 700 }}>
                                {item.name}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 2. Unit / Packaging (Interactive Dropdown) */}
                        <td
                          style={{
                            padding: "16px 18px",
                            textAlign: "center",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                            verticalAlign: "middle",
                          }}
                        >
                          <select
                            value={item.unit}
                            onChange={(e) => {
                              const newUnit = e.target.value;
                              setStockItems((prev) =>
                                prev.map((i) => (i.id === item.id ? { ...i, unit: newUnit } : i))
                              );
                              success("Unit Updated", `${item.name} packaging unit set to ${newUnit}`);
                            }}
                            style={{
                              height: "36px",
                              padding: "0 10px",
                              backgroundColor: "rgba(10, 14, 23, 0.85)",
                              border: "1px solid rgba(255, 255, 255, 0.14)",
                              borderRadius: "var(--radius-sm, 4px)",
                              color: "#cbd5e1",
                              fontSize: "12.5px",
                              fontWeight: 600,
                              outline: "none",
                              cursor: "pointer",
                              width: "100%",
                              maxWidth: "155px",
                            }}
                          >
                            {STOCK_UNIT_OPTIONS.map((u) => (
                              <option key={u} value={u} style={{ backgroundColor: "#0f1420", color: "#fff" }}>
                                {u}
                              </option>
                            ))}
                            {!STOCK_UNIT_OPTIONS.includes(item.unit) && (
                              <option value={item.unit} style={{ backgroundColor: "#0f1420", color: "#fff" }}>
                                {item.unit}
                              </option>
                            )}
                          </select>
                        </td>

                        {/* 3. Floor Available (Double-click to edit) */}
                        <td
                          style={{
                            padding: "16px 18px",
                            textAlign: "right",
                            cursor: "text",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                            verticalAlign: "middle",
                          }}
                          onDoubleClick={(e) => handleStartEdit(item, "availableStock", e)}
                          title="Double-click to edit available stock"
                        >
                          {isEditing("availableStock") ? (
                            <input
                              ref={editInputRef}
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={handleKeyDown}
                              style={{
                                width: "100px",
                                height: "36px",
                                padding: "0 8px",
                                backgroundColor: "rgba(0, 0, 0, 0.85)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "4px",
                                color: "#fff",
                                fontSize: "14px",
                                fontFamily: "var(--font-mono)",
                                textAlign: "right",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: "8px" }}>
                              <strong
                                style={{
                                  fontSize: "15px",
                                  fontFamily: "var(--font-mono)",
                                  fontWeight: 800,
                                  color: isLowStock ? "#f87171" : "#ffffff",
                                }}
                              >
                                {item.availableStock.toLocaleString()}
                              </strong>
                              {isLowStock && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    color: "#f87171",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    backgroundColor: "rgba(248, 113, 113, 0.15)",
                                    border: "1px solid rgba(248, 113, 113, 0.3)",
                                  }}
                                >
                                  LOW
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 4. Total Consumed (Double-click to edit) */}
                        <td
                          style={{
                            padding: "16px 18px",
                            textAlign: "right",
                            cursor: "text",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                            verticalAlign: "middle",
                          }}
                          onDoubleClick={(e) => handleStartEdit(item, "usedStock", e)}
                          title="Double-click to edit consumed stock"
                        >
                          {isEditing("usedStock") ? (
                            <input
                              ref={editInputRef}
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={handleKeyDown}
                              style={{
                                width: "90px",
                                height: "36px",
                                padding: "0 8px",
                                backgroundColor: "rgba(0, 0, 0, 0.85)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "4px",
                                color: "#fff",
                                fontSize: "13px",
                                fontFamily: "var(--font-mono)",
                                textAlign: "right",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <span style={{ fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 700, fontSize: "14px" }}>
                              {item.usedStock.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* 5. Min Alert (Double-click to edit) */}
                        <td
                          style={{
                            padding: "16px 18px",
                            textAlign: "right",
                            cursor: "text",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                            verticalAlign: "middle",
                          }}
                          onDoubleClick={(e) => handleStartEdit(item, "minThreshold", e)}
                          title="Double-click to edit minimum threshold"
                        >
                          {isEditing("minThreshold") ? (
                            <input
                              ref={editInputRef}
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={handleKeyDown}
                              style={{
                                width: "80px",
                                height: "36px",
                                padding: "0 8px",
                                backgroundColor: "rgba(0, 0, 0, 0.85)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "4px",
                                color: "#fff",
                                fontSize: "13px",
                                fontFamily: "var(--font-mono)",
                                textAlign: "right",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "12.5px" }}>
                              {item.minThreshold.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* 6. Actions (+ Add Stock, - Log Usage) */}
                        <td
                          style={{
                            padding: "16px 18px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetItem(item);
                                setAdjustQty(item.unit === "rolls" ? "5" : item.unit.includes("packet") ? "5" : "500");
                                setIsAddStockModalOpen(true);
                              }}
                              style={{
                                height: "32px",
                                padding: "0 12px",
                                borderRadius: "4px",
                                backgroundColor: "rgba(16, 185, 129, 0.15)",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                color: "#34d399",
                                fontSize: "11.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.25)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.15)")}
                            >
                              + Add Stock
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setTargetItem(item);
                                setUseQty(item.unit === "rolls" ? "2" : item.unit.includes("packet") ? "2" : "200");
                                setUseReportedBy("Ramesh Labour");
                                setUseDestination(item.workstation || "Production Assembly Floor");
                                setUseNote("Material issued for current client order");
                                setIsUsageDrawerOpen(true);
                              }}
                              style={{
                                height: "32px",
                                padding: "0 12px",
                                borderRadius: "4px",
                                backgroundColor: "rgba(255, 138, 115, 0.15)",
                                border: "1px solid rgba(255, 138, 115, 0.3)",
                                color: "var(--accent-text)",
                                fontSize: "11.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 138, 115, 0.25)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 138, 115, 0.15)")}
                            >
                              - Log Usage
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Table Footer */}
            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(0, 0, 0, 0.25)",
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Showing <strong style={{ color: "#fff" }}>{filteredItems.length}</strong> items · Total floor stock:{" "}
                <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
                  {filteredItems.reduce((acc, i) => acc + i.availableStock, 0).toLocaleString()} units
                </strong>
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Double-click cells to adjust quantities · Select dropdown to change packaging unit
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ─── TAB 2: MATERIAL USAGE MOVEMENT LOG ─────────────────────────────── */
        <div style={{ padding: "16px 24px", flex: 1 }}>
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "13.5px", color: "#fff" }}>Material Usage & Stock Receipts Log</strong>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Real-time production floor audit trail</span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "var(--text-muted)", fontSize: "10.5px", textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 16px" }}>Timestamp</th>
                  <th style={{ padding: "10px 16px" }}>Item Name</th>
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>Movement</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Quantity</th>
                  <th style={{ padding: "10px 16px" }}>Destination / Source</th>
                  <th style={{ padding: "10px 14px" }}>Reported By</th>
                  <th style={{ padding: "10px 16px" }}>Notes / Batch</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "11.5px" }}>{m.timestamp}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#fff" }}>{m.itemName}</td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "2px",
                          backgroundColor: m.type === "ADDITION" ? "rgba(16,185,129,0.15)" : "rgba(255,138,115,0.15)",
                          color: m.type === "ADDITION" ? "#10b981" : "var(--accent-text)",
                        }}
                      >
                        {m.type === "ADDITION" ? "+ RECEIPT" : "- USAGE"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: m.type === "ADDITION" ? "#10b981" : "#f59e0b",
                      }}
                    >
                      {m.type === "ADDITION" ? "+" : "-"}
                      {m.quantity.toLocaleString()} {m.unit}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{m.destinationOrSource}</td>
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>{m.reportedBy}</td>
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "11.5px" }}>{m.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: REPORT STOCK ADDITION (NO PRICING) ──────────────────────── */}
      {isAddStockModalOpen && (
        <Modal
          isOpen={isAddStockModalOpen}
          onClose={() => setIsAddStockModalOpen(false)}
          title={`Stock Addition: ${targetItem.name}`}
        >
          <form onSubmit={handleConfirmAddStock} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "10px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "2px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Current Available:</span>
              <strong style={{ fontSize: "13px", color: "#fff", fontFamily: "var(--font-mono)" }}>
                {targetItem.availableStock.toLocaleString()} {targetItem.unit}
              </strong>
            </div>

            <Input
              label={`Quantity to Add (${targetItem.unit})`}
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              required
            />

            <Input
              label="Source / Vendor Reference"
              value={adjustSource}
              onChange={(e) => setAdjustSource(e.target.value)}
              required
            />

            <Input
              label="Audit Note / Batch Details"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsAddStockModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Confirm Addition
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── DRAWER: MATERIAL USAGE LOG & COMPLETE AUDIT HISTORY ─────────────── */}
      <Drawer
        isOpen={isUsageDrawerOpen}
        onClose={() => setIsUsageDrawerOpen(false)}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 138, 115, 0.12)",
                border: "1px solid rgba(255, 138, 115, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: targetItem.iconColor || "var(--accent-text)",
                flexShrink: 0,
              }}
            >
              <Icon name={targetItem.iconName || "tool"} size={16} color={targetItem.iconColor || "var(--accent-text)"} />
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>
                Material Usage Log — {targetItem.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                Packaging: <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{targetItem.unit}</span> · Workstation: {targetItem.workstation}
              </div>
            </div>
          </div>
        }
        width={640}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* ─── 1. FIXED TOP SUMMARY CARD: HOW MUCH TILL NOW USED ─────────────── */}
          <div
            style={{
              padding: "16px 18px",
              background: "linear-gradient(135deg, rgba(16, 22, 36, 0.95) 0%, rgba(26, 32, 50, 0.9) 100%)",
              border: "1px solid rgba(255, 138, 115, 0.25)",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
                paddingBottom: "8px",
              }}
            >
              <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.8px", color: "var(--accent-text)", textTransform: "uppercase" }}>
                STOCK CONSUMPTION SUMMARY
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "3px",
                  backgroundColor: targetItem.availableStock <= targetItem.minThreshold ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.15)",
                  color: targetItem.availableStock <= targetItem.minThreshold ? "#f87171" : "#34d399",
                  border: targetItem.availableStock <= targetItem.minThreshold ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                {targetItem.availableStock <= targetItem.minThreshold ? "⚠️ Low Stock Alert" : "✓ Healthy Stock"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {/* Stat 1: Total Used Till Now */}
              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: "6px",
                }}
              >
                <div style={{ fontSize: "10px", color: "#34d399", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                  Used Till Now
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#10b981", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                  {targetItem.usedStock.toLocaleString()}
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {targetItem.unit} recorded
                </div>
              </div>

              {/* Stat 2: Current Floor Available */}
              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "6px",
                }}
              >
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                  Floor Available
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                  {targetItem.availableStock.toLocaleString()}
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {targetItem.unit} in store
                </div>
              </div>

              {/* Stat 3: Min Alert Safety Limit */}
              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  borderRadius: "6px",
                }}
              >
                <div style={{ fontSize: "10px", color: "#fbbf24", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                  Min Alert Limit
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#f59e0b", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                  {targetItem.minThreshold.toLocaleString()}
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {targetItem.unit} threshold
                </div>
              </div>
            </div>
          </div>

          {/* ─── 2. TOP INPUT FORM: WHO BROUGHT IT, WHAT THING USED, QTY ───────── */}
          <div
            style={{
              padding: "16px 18px",
              backgroundColor: "rgba(19, 23, 34, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <strong style={{ fontSize: "13.5px", color: "#fff", display: "block" }}>Log New Material Consumption</strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Record who brought/took it and destination workstation</span>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "3px",
                  backgroundColor: "rgba(255, 138, 115, 0.15)",
                  color: "var(--accent-text)",
                  border: "1px solid rgba(255, 138, 115, 0.3)",
                }}
              >
                - USAGE DEDUCTION
              </span>
            </div>

            <form onSubmit={handleConfirmLogUsage} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Row 1: Material Item (Fixed/Displayed) & Quantity to Deduct */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    What Thing Used (Material Item)
                  </label>
                  <div
                    style={{
                      height: "38px",
                      padding: "0 12px",
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Icon name={targetItem.iconName || "tool"} size={14} color={targetItem.iconColor} />
                    <span>{targetItem.name}</span>
                    <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      ({targetItem.unit})
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Quantity Consumed *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      min="1"
                      value={useQty}
                      onChange={(e) => setUseQty(e.target.value)}
                      required
                      placeholder="e.g. 200"
                      style={{
                        width: "100%",
                        height: "38px",
                        padding: "0 55px 0 12px",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid var(--accent-border)",
                        borderRadius: "4px",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        outline: "none",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        pointerEvents: "none",
                      }}
                    >
                      {targetItem.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Who Brought / Took It */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Who Brought / Took It (Labour / Operator / Person) *
                </label>
                <input
                  type="text"
                  value={useReportedBy}
                  onChange={(e) => setUseReportedBy(e.target.value)}
                  required
                  placeholder="e.g., Ramesh Labour, Dinesh Assembly, Suresh Workshop..."
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "4px",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                {/* Quick Selector Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {["Ramesh Labour", "Dinesh Labour", "Suresh Workshop", "Priya Assembly", "Vikram Sublimation"].map((person) => (
                    <button
                      key={person}
                      type="button"
                      onClick={() => setUseReportedBy(person)}
                      style={{
                        padding: "2px 8px",
                        fontSize: "10.5px",
                        borderRadius: "3px",
                        backgroundColor: useReportedBy === person ? "rgba(255, 138, 115, 0.25)" : "rgba(255, 255, 255, 0.05)",
                        border: useReportedBy === person ? "1px solid rgba(255, 138, 115, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                        color: useReportedBy === person ? "var(--accent-text)" : "#cbd5e1",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      + {person}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Destination Workstation / Order */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Destination Workstation / Production Order *
                </label>
                <input
                  type="text"
                  value={useDestination}
                  onChange={(e) => setUseDestination(e.target.value)}
                  required
                  placeholder="e.g., Lanyard Stitching Table 2, Sublimation Line 1, Client Order Batch"
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "4px",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                {/* Quick Station Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {["Production Assembly Floor", "Stitching Bench 2", "Sublimation Line 1", "Metal Ring Press", "Client Order Batch"].map((station) => (
                    <button
                      key={station}
                      type="button"
                      onClick={() => setUseDestination(station)}
                      style={{
                        padding: "2px 8px",
                        fontSize: "10.5px",
                        borderRadius: "3px",
                        backgroundColor: useDestination === station ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        border: useDestination === station ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                        color: useDestination === station ? "#38bdf8" : "#cbd5e1",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      + {station}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 4: Job Notes */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Job Notes / Reason
                </label>
                <input
                  type="text"
                  value={useNote}
                  onChange={(e) => setUseNote(e.target.value)}
                  placeholder="e.g., Issued for school lanyards order, urgent rush batch..."
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "4px",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Submit & Cancel Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsUsageDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  - Deduct & Record Usage
                </Button>
              </div>
            </form>
          </div>

          {/* ─── 3. BELOW: THE WHOLE HISTORY WHO BRING WHAT ETC. ───────────────── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <strong style={{ fontSize: "13.5px", color: "#fff", display: "block" }}>Complete Issuance & Usage History</strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Audit log of who brought/took what, quantities, timestamps and workstations
                </span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  padding: "3px 8px",
                  borderRadius: "3px",
                }}
              >
                {movements.filter((m) => m.itemName.toLowerCase() === targetItem.name.toLowerCase()).length} records
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {movements
                .filter((m) => m.itemName.toLowerCase() === targetItem.name.toLowerCase())
                .length === 0 ? (
                <div
                  style={{
                    padding: "30px 20px",
                    textAlign: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.25)",
                    border: "1px dashed rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px",
                  }}
                >
                  <Icon name="tag" size={24} color="var(--text-muted)" />
                  <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "8px", marginBottom: 0 }}>
                    No recorded movement history for <strong style={{ color: "#fff" }}>{targetItem.name}</strong> yet.
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", marginBottom: 0 }}>
                    Submit the form above to record the first material consumption.
                  </p>
                </div>
              ) : (
                movements
                  .filter((m) => m.itemName.toLowerCase() === targetItem.name.toLowerCase())
                  .map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: "12px 14px",
                        backgroundColor: "rgba(10, 14, 23, 0.7)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        borderRadius: "6px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(10, 14, 23, 0.7)")}
                    >
                      {/* Top line: Who brought/took it + Destination + Quantity */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              backgroundColor: log.type === "ADDITION" ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 138, 115, 0.2)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 800,
                              color: log.type === "ADDITION" ? "#10b981" : "var(--accent-text)",
                            }}
                          >
                            {log.type === "ADDITION" ? "+" : "—"}
                          </span>
                          <div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                              {log.reportedBy || "Floor Operator"}
                            </span>
                            <span style={{ fontSize: "11.5px", color: "var(--text-muted)", marginLeft: "6px" }}>
                              took for <span style={{ color: "#38bdf8", fontWeight: 600 }}>{log.destinationOrSource}</span>
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 800,
                              fontFamily: "var(--font-mono)",
                              color: log.type === "ADDITION" ? "#10b981" : "#f59e0b",
                            }}
                          >
                            {log.type === "ADDITION" ? "+" : "-"}
                            {log.quantity.toLocaleString()} {log.unit}
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: "9.5px",
                              fontWeight: 700,
                              color: log.type === "ADDITION" ? "#34d399" : "var(--accent-text)",
                              textTransform: "uppercase",
                              marginTop: "1px",
                            }}
                          >
                            {log.type === "ADDITION" ? "Receipt" : "Usage"}
                          </span>
                        </div>
                      </div>

                      {/* Bottom line: Note and Timestamp */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingTop: "4px",
                          borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                          fontSize: "11px",
                        }}
                      >
                        <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                          "{log.notes || "No notes provided"}"
                        </span>
                        <span style={{ color: "var(--text-muted)", fontSize: "10.5px", flexShrink: 0, marginLeft: "12px" }}>
                          🕒 {log.timestamp}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* ─── MODAL 3: NEW STOCK ITEM (NO PRICING) ─────────────────────────────── */}
      {isNewItemModalOpen && (
        <Modal
          isOpen={isNewItemModalOpen}
          onClose={() => setIsNewItemModalOpen(false)}
          title="Add New Stock Item"
        >
          <form onSubmit={handleCreateNewItem} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Input
              label="Item Name"
              placeholder="e.g. 25mm Swivel Trigger Hook"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
            />

            <Select
              label="Stock Category"
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as StockCategory)}
              options={[
                { value: "HOOKS", label: "Hooks (Dog, England, Plastic)" },
                { value: "HOLDERS", label: "Holders (Plastic-V/H, DST-V/H, Crystal)" },
                { value: "LANYARDS", label: "Lanyard Rolls (12mm, 16mm, 20mm)" },
                { value: "OTHERS", label: "Others (Clips, Rings, Pins)" },
              ]}
            />

            <Input
              label="Packaging / Unit"
              placeholder="e.g. pieces, rolls, packets of 1000"
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              required
            />

            <Input
              label="Initial Floor Quantity"
              type="number"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              required
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsNewItemModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Register Stock Item
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
