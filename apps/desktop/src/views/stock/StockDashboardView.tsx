import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select } from "../../design-system/components/Input";
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
const INITIAL_STOCK_ITEMS: StockItem[] = [
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
    availableStock: 32,
    usedStock: 19,
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
    availableStock: 25, // 25 packets
    usedStock: 16,
    reservedStock: 5,
    minThreshold: 6,
    workstation: "Badge Pinning Bench",
    iconName: "tag",
    iconColor: "#a855f7",
  },
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
  { id: "mov-3", timestamp: "Yesterday, 04:30 PM", itemName: "Clips", type: "ADDITION", quantity: 5, unit: "packets of 1000", destinationOrSource: "Supplier Receipt Bay", reportedBy: "Amit Patel", notes: "Vendor delivery receipt" },
  { id: "mov-4", timestamp: "01 Sep 2026", itemName: "Plastic Holder-V", type: "USAGE", quantity: 800, unit: "pieces", destinationOrSource: "Packaging Bench A", reportedBy: "Priya Sharma", notes: "Govt Engineering College order" },
];

export const StockDashboardView: React.FC = () => {
  const { success } = useToast();

  // Navigation: Inventory Table or Movement Log
  const [activeTab, setActiveTab] = useState<"inventory" | "log">("inventory");
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCK_ITEMS);
  const [movements, setMovements] = useState<StockMovementLog[]>(SEED_MOVEMENTS);

  // Search & Category Filter
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | StockCategory>("ALL");
  const [sortBy, setSortBy] = useState<"available" | "used" | "name">("available");

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

  // Modals (Report Stock Addition & Report Material Usage — NO PRICING)
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<StockItem>(INITIAL_STOCK_ITEMS[0]);

  // Form fields
  const [adjustQty, setAdjustQty] = useState("500");
  const [adjustSource, setAdjustSource] = useState("Vendor Receipt / Plant Storeroom");
  const [adjustNote, setAdjustNote] = useState("Warehouse replenishment");

  const [useQty, setUseQty] = useState("200");
  const [useDestination, setUseDestination] = useState("Production Assembly Floor");
  const [useNote, setUseNote] = useState("Issued for current client order");

  // New Item Form fields
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<StockCategory>("HOOKS");
  const [newItemUnit, setNewItemUnit] = useState("pieces");
  const [newItemQty, setNewItemQty] = useState("1000");

  // ─── Filtered Items ──────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let list = stockItems.filter((i) => {
      const q = search.toLowerCase();
      const matchSearch = !q || i.name.toLowerCase().includes(q) || i.workstation.toLowerCase().includes(q);
      const matchCat = categoryFilter === "ALL" || i.category === categoryFilter;
      return matchSearch && matchCat;
    });

    list.sort((a, b) => {
      if (sortBy === "available") return b.availableStock - a.availableStock;
      if (sortBy === "used") return b.usedStock - a.usedStock;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    return list;
  }, [stockItems, search, categoryFilter, sortBy]);

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
    setMovements([
      {
        id: `mov-${Date.now()}`,
        timestamp: "Just now",
        itemName: targetItem.name,
        type: "USAGE",
        quantity: qty,
        unit: targetItem.unit,
        destinationOrSource: useDestination,
        reportedBy: "Assembly Operator",
        notes: useNote,
      },
      ...movements,
    ]);
    setIsUsageModalOpen(false);
    success("Usage Logged", `Consumed ${qty} ${targetItem.unit} of ${targetItem.name}`);
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

  const categoryLabels: Record<StockCategory, { label: string; count: number; color: string }> = {
    HOOKS: { label: "Hooks", count: stockItems.filter((i) => i.category === "HOOKS").length, color: "#c084fc" },
    HOLDERS: { label: "Holders", count: stockItems.filter((i) => i.category === "HOLDERS").length, color: "#34d399" },
    LANYARDS: { label: "Lanyard Rolls", count: stockItems.filter((i) => i.category === "LANYARDS").length, color: "#ff8a73" },
    OTHERS: { label: "Others (Clips, Rings, Pins)", count: stockItems.filter((i) => i.category === "OTHERS").length, color: "#38bdf8" },
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
          <div style={{ display: "flex", gap: "2px", backgroundColor: "rgba(0,0,0,0.3)", padding: "3px", borderRadius: "2px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              style={{
                padding: "6px 12px",
                borderRadius: "2px",
                border: "none",
                backgroundColor: activeTab === "inventory" ? "rgba(255,138,115,0.15)" : "transparent",
                color: activeTab === "inventory" ? "var(--accent-text)" : "var(--text-secondary)",
                fontSize: "12px",
                fontWeight: activeTab === "inventory" ? 700 : 500,
                cursor: "pointer",
              }}
            >
              Stocks Inventory ({stockItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("log")}
              style={{
                padding: "6px 12px",
                borderRadius: "2px",
                border: "none",
                backgroundColor: activeTab === "log" ? "rgba(255,138,115,0.15)" : "transparent",
                color: activeTab === "log" ? "var(--accent-text)" : "var(--text-secondary)",
                fontSize: "12px",
                fontWeight: activeTab === "log" ? 700 : 500,
                cursor: "pointer",
              }}
            >
              Material Usage Log
            </button>
          </div>

          <div
            style={{
              position: "relative",
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "2px",
              height: "36px",
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
            style={{ borderRadius: "2px", backgroundColor: "var(--accent)", border: "none" }}
            onClick={() => setIsNewItemModalOpen(true)}
          >
            New Stock Item
          </Button>
        </div>
      </div>

      {/* ─── CATEGORY FILTER PILLS ───────────────────────────────────────────── */}
      {activeTab === "inventory" && (
        <div
          style={{
            padding: "10px 24px 0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setCategoryFilter("ALL")}
              style={{
                padding: "5px 12px",
                borderRadius: "2px",
                border: "1px solid " + (categoryFilter === "ALL" ? "var(--accent-border)" : "rgba(255,255,255,0.08)"),
                backgroundColor: categoryFilter === "ALL" ? "rgba(255,138,115,0.15)" : "rgba(255,255,255,0.03)",
                color: categoryFilter === "ALL" ? "var(--accent-text)" : "var(--text-secondary)",
                fontSize: "11.5px",
                fontWeight: categoryFilter === "ALL" ? 700 : 500,
                cursor: "pointer",
              }}
            >
              All Items ({stockItems.length})
            </button>

            {(Object.keys(categoryLabels) as StockCategory[]).map((cat) => {
              const meta = categoryLabels[cat];
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "2px",
                    border: "1px solid " + (isSelected ? `${meta.color}66` : "rgba(255,255,255,0.08)"),
                    backgroundColor: isSelected ? `${meta.color}22` : "rgba(255,255,255,0.03)",
                    color: isSelected ? meta.color : "var(--text-secondary)",
                    fontSize: "11.5px",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {meta.label} ({meta.count})
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                height: "28px",
                padding: "0 8px",
                borderRadius: "2px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                fontSize: "11.5px",
                cursor: "pointer",
              }}
            >
              <option value="available" style={{ backgroundColor: "#0f1420" }}>Highest Available Stock</option>
              <option value="used" style={{ backgroundColor: "#0f1420" }}>Most Consumed</option>
              <option value="name" style={{ backgroundColor: "#0f1420" }}>Alphabetical Name</option>
            </select>
          </div>
        </div>
      )}

      {/* ─── TAB 1: STOCKS INVENTORY TABLE (DOUBLE-CLICK EDITABLE, NO PRICING) ─── */}
      {activeTab === "inventory" ? (
        <div style={{ padding: "14px 24px 24px 24px", flex: 1 }}>
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "rgba(0,0,0,0.3)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--text-muted)",
                    fontSize: "10.5px",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Stock Item Name</th>
                  <th style={{ padding: "12px 12px", textAlign: "center", width: "130px" }}>Category</th>
                  <th style={{ padding: "12px 12px", textAlign: "center", width: "140px" }}>Unit / Packaging</th>
                  <th style={{ padding: "12px 14px", textAlign: "right", width: "140px" }}>Floor Available</th>
                  <th style={{ padding: "12px 14px", textAlign: "right", width: "130px" }}>Total Consumed</th>
                  <th style={{ padding: "12px 14px", textAlign: "right", width: "120px" }}>Reserved</th>
                  <th style={{ padding: "12px 14px", textAlign: "right", width: "120px" }}>Min Alert</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Assigned Line / Station</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", width: "210px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)" }}>
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
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                          backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)")
                        }
                      >
                        {/* 1. Item Name (Double-click to edit) */}
                        <td
                          style={{ padding: "12px 16px", cursor: "text" }}
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
                                padding: "4px 8px",
                                backgroundColor: "rgba(0,0,0,0.6)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "2px",
                                color: "#fff",
                                fontSize: "13px",
                                fontWeight: 700,
                                outline: "none",
                              }}
                            />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "2px",
                                  backgroundColor: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: item.iconColor,
                                  flexShrink: 0,
                                }}
                              >
                                <Icon name={item.iconName} size={14} color={item.iconColor} />
                              </div>
                              <strong style={{ color: "#ffffff", fontSize: "13px" }}>{item.name}</strong>
                            </div>
                          )}
                        </td>

                        {/* 2. Category */}
                        <td
                          style={{ padding: "12px 12px", textAlign: "center", cursor: "pointer" }}
                          onDoubleClick={(e) => handleStartEdit(item, "category", e)}
                          title="Double-click to edit category"
                        >
                          {isEditing("category") ? (
                            <select
                              value={editValue}
                              onChange={(e) => {
                                setEditValue(e.target.value);
                              }}
                              onBlur={handleSaveEdit}
                              style={{
                                padding: "3px 6px",
                                backgroundColor: "#0f1420",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "2px",
                                color: "#fff",
                                fontSize: "11px",
                              }}
                            >
                              <option value="HOOKS">HOOKS</option>
                              <option value="HOLDERS">HOLDERS</option>
                              <option value="LANYARDS">LANYARDS</option>
                              <option value="OTHERS">OTHERS</option>
                            </select>
                          ) : (
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: "2px",
                                backgroundColor: `${categoryLabels[item.category]?.color || "#c084fc"}18`,
                                color: categoryLabels[item.category]?.color || "#c084fc",
                              }}
                            >
                              {item.category}
                            </span>
                          )}
                        </td>

                        {/* 3. Unit / Packaging (Double-click to edit) */}
                        <td
                          style={{ padding: "12px 12px", textAlign: "center", cursor: "text" }}
                          onDoubleClick={(e) => handleStartEdit(item, "unit", e)}
                          title="Double-click to edit packaging unit"
                        >
                          {isEditing("unit") ? (
                            <input
                              ref={editInputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={handleKeyDown}
                              style={{
                                width: "110px",
                                padding: "3px 6px",
                                backgroundColor: "rgba(0,0,0,0.6)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "2px",
                                color: "#fff",
                                fontSize: "11.5px",
                                textAlign: "center",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", fontWeight: 500 }}>
                              {item.unit}
                            </span>
                          )}
                        </td>

                        {/* 4. Floor Available (Double-click to edit) */}
                        <td
                          style={{ padding: "12px 14px", textAlign: "right", cursor: "text" }}
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
                                width: "90px",
                                padding: "3px 6px",
                                backgroundColor: "rgba(0,0,0,0.6)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "2px",
                                color: "#fff",
                                fontSize: "13px",
                                fontFamily: "var(--font-mono)",
                                textAlign: "right",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: "5px" }}>
                              <strong
                                style={{
                                  fontSize: "14.5px",
                                  fontFamily: "var(--font-mono)",
                                  fontWeight: 800,
                                  color: isLowStock ? "#f87171" : "#ffffff",
                                }}
                              >
                                {item.availableStock.toLocaleString()}
                              </strong>
                              {isLowStock && (
                                <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#f87171", padding: "1px 4px", borderRadius: "2px", backgroundColor: "rgba(248,113,113,0.12)" }}>
                                  LOW
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 5. Total Consumed / Used (Double-click to edit) */}
                        <td
                          style={{ padding: "12px 14px", textAlign: "right", cursor: "text" }}
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
                                width: "80px",
                                padding: "3px 6px",
                                backgroundColor: "rgba(0,0,0,0.6)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "2px",
                                color: "#fff",
                                fontSize: "12px",
                                fontFamily: "var(--font-mono)",
                                textAlign: "right",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <span style={{ fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 700 }}>
                              {item.usedStock.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* 6. Reserved Stock (Double-click to edit) */}
                        <td
                          style={{ padding: "12px 14px", textAlign: "right", cursor: "text" }}
                          onDoubleClick={(e) => handleStartEdit(item, "reservedStock", e)}
                          title="Double-click to edit reserved stock"
                        >
                          {isEditing("reservedStock") ? (
                            <input
                              ref={editInputRef}
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={handleKeyDown}
                              style={{
                                width: "70px",
                                padding: "3px 6px",
                                backgroundColor: "rgba(0,0,0,0.6)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "2px",
                                color: "#fff",
                                fontSize: "12px",
                                fontFamily: "var(--font-mono)",
                                textAlign: "right",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                              {item.reservedStock.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* 7. Min Threshold Alert (Double-click to edit) */}
                        <td
                          style={{ padding: "12px 14px", textAlign: "right", cursor: "text" }}
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
                                width: "70px",
                                padding: "3px 6px",
                                backgroundColor: "rgba(0,0,0,0.6)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "2px",
                                color: "#fff",
                                fontSize: "12px",
                                fontFamily: "var(--font-mono)",
                                textAlign: "right",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "11.5px" }}>
                              {item.minThreshold.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* 8. Assigned Station (Double-click to edit) */}
                        <td
                          style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-secondary)", cursor: "text" }}
                          onDoubleClick={(e) => handleStartEdit(item, "workstation", e)}
                          title="Double-click to edit assigned line"
                        >
                          {isEditing("workstation") ? (
                            <input
                              ref={editInputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={handleKeyDown}
                              style={{
                                width: "160px",
                                padding: "3px 6px",
                                backgroundColor: "rgba(0,0,0,0.6)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "2px",
                                color: "#fff",
                                fontSize: "11.5px",
                                outline: "none",
                              }}
                            />
                          ) : (
                            item.workstation
                          )}
                        </td>

                        {/* 9. Actions (+ Add Report, - Usage Report) */}
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetItem(item);
                                setAdjustQty(item.unit === "rolls" ? "5" : item.unit.includes("packet") ? "5" : "500");
                                setIsAddStockModalOpen(true);
                              }}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "2px",
                                backgroundColor: "rgba(16, 185, 129, 0.15)",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                color: "#34d399",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              + Add Stock
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setTargetItem(item);
                                setUseQty(item.unit === "rolls" ? "2" : item.unit.includes("packet") ? "2" : "200");
                                setIsUsageModalOpen(true);
                              }}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "2px",
                                backgroundColor: "rgba(255, 138, 115, 0.15)",
                                border: "1px solid rgba(255, 138, 115, 0.3)",
                                color: "var(--accent-text)",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
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
                padding: "10px 18px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(0,0,0,0.2)",
              }}
            >
              <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                Showing {filteredItems.length} items (3 Hooks, 5 Holders, 3 Lanyard Rolls, 3 Others) · Total floor stock:{" "}
                <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
                  {filteredItems.reduce((acc, i) => acc + i.availableStock, 0).toLocaleString()} units
                </strong>
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Double-click any cell to edit details inline
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

      {/* ─── MODAL 2: REPORT MATERIAL USAGE (NO PRICING) ──────────────────────── */}
      {isUsageModalOpen && (
        <Modal
          isOpen={isUsageModalOpen}
          onClose={() => setIsUsageModalOpen(false)}
          title={`Log Consumption: ${targetItem.name}`}
        >
          <form onSubmit={handleConfirmLogUsage} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "10px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "2px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Current Floor Stock:</span>
              <strong style={{ fontSize: "13px", color: "#fff", fontFamily: "var(--font-mono)" }}>
                {targetItem.availableStock.toLocaleString()} {targetItem.unit}
              </strong>
            </div>

            <Input
              label={`Quantity Consumed (${targetItem.unit})`}
              type="number"
              value={useQty}
              onChange={(e) => setUseQty(e.target.value)}
              required
            />

            <Input
              label="Destination Workstation / Production Order"
              value={useDestination}
              onChange={(e) => setUseDestination(e.target.value)}
              required
            />

            <Input
              label="Job Notes"
              value={useNote}
              onChange={(e) => setUseNote(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsUsageModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Deduct & Record Usage
              </Button>
            </div>
          </form>
        </Modal>
      )}

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
