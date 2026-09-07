import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { Modal, Drawer } from "../../design-system/components/Modal";
import { Input, Select } from "../../design-system/components/Input";
import { Tabs } from "../../design-system/components/Tabs";
import { useToast } from "../../design-system/components/Toast";
import {
  useStockStore,
  StockCategory,
  StockItem,
  INITIAL_STOCK_ITEMS,
  StockMovementLog,
} from "./stockStore";

export type { StockCategory, StockItem, StockMovementLog };
// ─── Unit Options for Dropdown ────────────────────────────────────────────────
export const STOCK_UNIT_OPTIONS = [
  "pieces",
  "rolls",
  "packets of 1000",
  "meters",
  "boxes",
  "sets",
  "packets",
  "cards",
];

export const StockDashboardView: React.FC = () => {
  const { success } = useToast();
  const {
    items: stockItems,
    movements,
    updateStockItems: setStockItems,
    adjustStock,
  } = useStockStore();

  // Navigation: Inventory Table or Movement Log
  const [activeTab, setActiveTab] = useState<"inventory" | "log">("inventory");

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

    const person = useReportedBy.trim() || "User";

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

    // Update target item so drawer top card updates in real-time
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
      destinationOrSource: "Stock Floor",
      reportedBy: person,
      notes: `Deducted by ${person}`,
    };

    setMovements([newLog, ...movements]);
    success("Stock Deducted", `Deducted -${qty} ${targetItem.unit} by ${person}`);
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
                              padding: "0 34px 0 12px",
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
                                setUseQty(item.unit === "rolls" ? "2" : item.unit.includes("packet") ? "2" : "100");
                                setUseReportedBy("Rohan Sharma");
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

      {/* ─── DRAWER: SIMPLE STOCK USAGE DEDUCTION ─────────────── */}
      <Drawer
        isOpen={isUsageDrawerOpen}
        onClose={() => setIsUsageDrawerOpen(false)}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
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
                Deduct Stock — {targetItem.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                Packaging: <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{targetItem.unit}</span>
              </div>
            </div>
          </div>
        }
        width={480}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* ─── 1. FIXED TOP SUMMARY CARD: FLOOR AVAILABLE & USED TILL NOW ─── */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(16, 22, 36, 0.95) 0%, rgba(22, 28, 44, 0.9) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "6px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {/* Stat 1: Floor Available */}
            <div
              style={{
                padding: "12px 14px",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                Floor Available
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                {targetItem.availableStock.toLocaleString()}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                {targetItem.unit} in store
              </div>
            </div>

            {/* Stat 2: Total Used Till Now */}
            <div
              style={{
                padding: "12px 14px",
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "10.5px", color: "#34d399", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                Used Till Now
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#10b981", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                {targetItem.usedStock.toLocaleString()}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                {targetItem.unit} recorded
              </div>
            </div>
          </div>

          {/* ─── 2. SIMPLE FORM: HOW MUCH IS TAKEN & WHO DID IT ─────────────── */}
          <form
            onSubmit={handleConfirmLogUsage}
            style={{
              padding: "16px 18px",
              backgroundColor: "rgba(19, 23, 34, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "13.5px", color: "#fff" }}>Log Material Deduction</strong>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "3px",
                  backgroundColor: "rgba(255, 138, 115, 0.15)",
                  color: "var(--accent-text)",
                  border: "1px solid rgba(255, 138, 115, 0.3)",
                }}
              >
                - STOCK DEDUCTION
              </span>
            </div>

            {/* Field 1: How much is taken from the stock */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                How Much Taken (Quantity) *
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min="1"
                  max={targetItem.availableStock}
                  value={useQty}
                  onChange={(e) => setUseQty(e.target.value)}
                  required
                  placeholder="e.g., 200"
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 60px 0 12px",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid var(--accent-border)",
                    borderRadius: "4px",
                    color: "#fff",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: "12px",
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

            {/* Field 2: Who did it */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Who Did It (User / Person) *
              </label>
              <input
                type="text"
                value={useReportedBy}
                onChange={(e) => setUseReportedBy(e.target.value)}
                required
                placeholder="Enter user name (e.g., Rohan Sharma)..."
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
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsUsageDrawerOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                - Deduct from Stock
              </Button>
            </div>
          </form>

          {/* ─── 3. DEDUCTION HISTORY ───────────────────────────────────────── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <strong style={{ fontSize: "13px", color: "#fff" }}>Deduction History</strong>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {movements.filter((m) => m.itemName.toLowerCase() === targetItem.name.toLowerCase()).length} records
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {movements
                .filter((m) => m.itemName.toLowerCase() === targetItem.name.toLowerCase())
                .length === 0 ? (
                <div
                  style={{
                    padding: "24px 16px",
                    textAlign: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    border: "1px dashed rgba(255, 255, 255, 0.1)",
                    borderRadius: "4px",
                  }}
                >
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                    No deduction history for <strong style={{ color: "#fff" }}>{targetItem.name}</strong> yet.
                  </p>
                </div>
              ) : (
                movements
                  .filter((m) => m.itemName.toLowerCase() === targetItem.name.toLowerCase())
                  .map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: "10px 14px",
                        backgroundColor: "rgba(10, 14, 23, 0.7)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        borderRadius: "4px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#ffffff" }}>
                          👤 {log.reportedBy || "User"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          🕒 {log.timestamp}
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
