import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";

// ─── Default Known Clients List for Auto-Fetch ────────────────────────────────
const DEFAULT_CLIENTS = [
  "St. Xavier's High School",
  "Northwind Coffee",
  "BHEL Township Admin",
  "Govt Engineering College Bhopal",
  "AIIMS Bhopal",
  "Delhi Public School",
  "Reliance Retail - Bhopal",
  "NIT Bhopal",
  "Maulana Azad Hospital",
  "Smart City Council",
  "Indraprastha School",
  "MP Secretariat",
  "Bansal Group Schools",
  "MP Police Academy",
  "Apex Polymers Ltd.",
  "Adharsh Vidya Mandir",
];

export interface OrderRecord {
  internalId: string;
  client: string;
  product: string;
  category: string;
  qty: number;
  orderDate: string;
  deliveryDate: string;
  notes?: string;
}

const INITIAL_ORDERS: OrderRecord[] = [
  { internalId: "ord-1", client: "St. Xavier's High School", product: "Multicolor Lanyards (15mm)", category: "Lanyards", qty: 2000, orderDate: "28 Aug 2026", deliveryDate: "05 Sep 2026", notes: "Triple color blue/white/red" },
  { internalId: "ord-2", client: "BHEL Township Admin", product: "Single Color Lanyards (10mm)", category: "Lanyards", qty: 500, orderDate: "30 Aug 2026", deliveryDate: "07 Sep 2026", notes: "Navy blue, with ID pouch" },
  { internalId: "ord-3", client: "Northwind Coffee", product: "Custom Printed Lanyards", category: "Lanyards", qty: 1500, orderDate: "22 Aug 2026", deliveryDate: "02 Sep 2026", notes: "Red/white double color" },
  { internalId: "ord-4", client: "AIIMS Bhopal", product: "Medical Staff ID Cards", category: "ID Cards", qty: 350, orderDate: "29 Aug 2026", deliveryDate: "04 Sep 2026", notes: "PVC laminated, photo embed" },
  { internalId: "ord-5", client: "Govt Engineering College Bhopal", product: "Lanyards + PVC Badges", category: "Combo", qty: 800, orderDate: "25 Aug 2026", deliveryDate: "03 Sep 2026" },
  { internalId: "ord-6", client: "Reliance Retail - Bhopal", product: "Staff Access Cards", category: "ID Cards", qty: 200, orderDate: "01 Sep 2026", deliveryDate: "10 Sep 2026" },
  { internalId: "ord-7", client: "NIT Bhopal", product: "Faculty + Student Lanyards", category: "Lanyards", qty: 1200, orderDate: "31 Aug 2026", deliveryDate: "08 Sep 2026", notes: "20mm full color print" },
  { internalId: "ord-8", client: "Maulana Azad Hospital", product: "Staff ID Lanyards", category: "Lanyards", qty: 600, orderDate: "03 Sep 2026", deliveryDate: "12 Sep 2026" },
  { internalId: "ord-9", client: "Smart City Council", product: "Event Delegate Badges", category: "Badges", qty: 450, orderDate: "02 Sep 2026", deliveryDate: "06 Sep 2026", notes: "Rush conference delegate" },
  { internalId: "ord-10", client: "Indraprastha School", product: "Lanyards + ID Holders", category: "Combo", qty: 1000, orderDate: "20 Aug 2026", deliveryDate: "01 Sep 2026", notes: "Dog hooks + clear pouches" },
  { internalId: "ord-11", client: "MP Secretariat", product: "Embossed Security ID Cards", category: "ID Cards", qty: 150, orderDate: "01 Sep 2026", deliveryDate: "09 Sep 2026" },
  { internalId: "ord-12", client: "Bansal Group Schools", product: "Lanyards (12mm Blue/White)", category: "Lanyards", qty: 3000, orderDate: "27 Aug 2026", deliveryDate: "06 Sep 2026" },
];

export interface OrdersWorkspaceViewProps {
  clients?: any[];
  onSelectOrder?: (id: string) => void;
}

export const OrdersWorkspaceView: React.FC<OrdersWorkspaceViewProps> = ({ clients = [] }) => {
  const { success } = useToast();
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortField, setSortField] = useState<"client" | "qty" | "orderDate" | "deliveryDate">("deliveryDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Combined client names list from props + defaults
  const clientNames = useMemo(() => {
    const propNames = (clients || []).map((c) => c.organization_name).filter(Boolean);
    const set = new Set([...propNames, ...DEFAULT_CLIENTS]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clients]);

  // ─── First Row Quick Entry States ───────────────────────────────────────────
  const [newClient, setNewClient] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newCategory, setNewCategory] = useState("Lanyards");
  const [newQty, setNewQty] = useState("");
  const [newOrderDate, setNewOrderDate] = useState("03 Sep 2026");
  const [newDeliveryDate, setNewDeliveryDate] = useState("10 Sep 2026");

  // Autocomplete dropdown for First Row
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Filtered client suggestions for First Row
  const clientSuggestions = useMemo(() => {
    if (!newClient.trim()) return clientNames;
    const q = newClient.toLowerCase();
    return clientNames.filter((c) => c.toLowerCase().includes(q));
  }, [clientNames, newClient]);

  // ─── Double-Click Inline Editing State for Existing Rows ────────────────────
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof OrderRecord } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isEditClientDropdownOpen, setIsEditClientDropdownOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      if (editingCell.field !== "client") {
        editInputRef.current.select();
      }
    }
  }, [editingCell]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(e.target as Node) &&
        clientInputRef.current &&
        !clientInputRef.current.contains(e.target as Node)
      ) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = ["ALL", "Lanyards", "ID Cards", "Combo", "Badges"];

  const filteredOrders = useMemo(() => {
    let list = orders.filter((o) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        o.client.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q);
      const matchCategory = categoryFilter === "ALL" || o.category === categoryFilter;
      return matchSearch && matchCategory;
    });

    list = [...list].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = typeof aVal === "number" ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [orders, search, categoryFilter, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ─── Add Order From First Row (No Drawer Needed) ────────────────────────────
  const handleAddFromFirstRow = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newClient.trim()) {
      clientInputRef.current?.focus();
      return;
    }

    const createdOrder: OrderRecord = {
      internalId: `ord-${Date.now()}`,
      client: newClient.trim(),
      product: newProduct.trim() || "Multicolor Lanyards",
      category: newCategory,
      qty: parseInt(newQty, 10) || 500,
      orderDate: newOrderDate || "Today",
      deliveryDate: newDeliveryDate || "Next Week",
    };

    setOrders([createdOrder, ...orders]);
    setNewClient("");
    setNewProduct("");
    setNewQty("");
    setIsClientDropdownOpen(false);
    success("Order Added", `New order created for ${createdOrder.client}`);
  };

  // ─── Save Inline Edit ──────────────────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.internalId !== id) return o;
        if (field === "qty") {
          return { ...o, qty: parseInt(editValue, 10) || 0 };
        }
        return { ...o, [field]: editValue };
      })
    );

    setEditingCell(null);
    setIsEditClientDropdownOpen(false);
    success("Updated", `Saved changes to ${field}`);
  };

  const handleStartEdit = (order: OrderRecord, field: keyof OrderRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCell({ id: order.internalId, field });
    setEditValue(String(order[field] ?? ""));
    if (field === "client") {
      setIsEditClientDropdownOpen(true);
    }
  };

  const editClientSuggestions = useMemo(() => {
    if (!editValue.trim()) return clientNames;
    const q = editValue.toLowerCase();
    return clientNames.filter((c) => c.toLowerCase().includes(q));
  }, [clientNames, editValue]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>

      {/* ─── SINGLE HEADER BAR (No Title, No Stats Cards, Compact) ───────────── */}
      <div
        style={{
          padding: "12px 24px",
          backgroundColor: "rgba(14, 18, 26, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Search Bar & Category Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "320px", maxWidth: "680px" }}>
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
              placeholder="Search orders by client, product, or category..."
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
            {search && (
              <span
                onClick={() => setSearch("")}
                style={{ cursor: "pointer", color: "var(--text-muted)", fontSize: "12px" }}
              >
                ✕
              </span>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              height: "36px",
              padding: "0 12px",
              borderRadius: "2px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: categoryFilter === "ALL" ? "var(--text-secondary)" : "var(--accent-text)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c} style={{ backgroundColor: "#0f1420", color: "#fff" }}>
                {c === "ALL" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Counter, Quick Hint & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ color: "#38bdf8" }}>💡</span> Type in 1st row to add · Double-click to edit
          </span>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 8px",
              borderRadius: "2px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {filteredOrders.length} Orders
          </span>

          <Button
            variant="secondary"
            size="sm"
            icon="refresh"
            style={{ borderRadius: "2px" }}
            onClick={() => success("Refreshed", "Order queue reloaded")}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── ORDERS TABLE (With 1st Empty Row for Entry, No Assigned Team, No X btn) ─── */}
      <div style={{ padding: "16px 24px", flex: 1 }}>
        <div
          style={{
            backgroundColor: "rgba(19, 23, 34, 0.85)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "3px",
            overflow: "visible", // allows dropdown suggestions to show cleanly
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "rgba(0,0,0,0.35)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-muted)",
                  fontSize: "10.5px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  userSelect: "none",
                }}
              >
                <th
                  style={{ padding: "12px 16px", textAlign: "left", cursor: "pointer", width: "240px" }}
                  onClick={() => toggleSort("client")}
                >
                  Client {sortField === "client" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Product Specification</th>
                <th style={{ padding: "12px 14px", textAlign: "center", width: "130px" }}>Category</th>
                <th
                  style={{ padding: "12px 14px", textAlign: "center", width: "110px", cursor: "pointer" }}
                  onClick={() => toggleSort("qty")}
                >
                  Quantity {sortField === "qty" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ padding: "12px 14px", textAlign: "left", width: "130px", cursor: "pointer" }}
                  onClick={() => toggleSort("orderDate")}
                >
                  Order Date {sortField === "orderDate" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ padding: "12px 14px", textAlign: "left", width: "130px", cursor: "pointer" }}
                  onClick={() => toggleSort("deliveryDate")}
                >
                  Delivery Due {sortField === "deliveryDate" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "90px" }}>Action</th>
              </tr>
            </thead>
            <tbody>

              {/* ─── ROW 1: EMPTY ROW FOR QUICK ENTRY (No Drawer Needed) ───────── */}
              <tr
                style={{
                  backgroundColor: "rgba(255, 138, 115, 0.05)",
                  borderBottom: "2px solid rgba(255, 138, 115, 0.3)",
                }}
              >
                {/* 1. Client Field with Auto-Fetch Autocomplete Selector */}
                <td style={{ padding: "8px 14px", position: "relative" }}>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      ref={clientInputRef}
                      type="text"
                      placeholder="Type or select client..."
                      value={newClient}
                      onChange={(e) => {
                        setNewClient(e.target.value);
                        setIsClientDropdownOpen(true);
                      }}
                      onFocus={() => setIsClientDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddFromFirstRow();
                      }}
                      style={{
                        width: "100%",
                        height: "32px",
                        padding: "0 24px 0 8px",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(255, 138, 115, 0.4)",
                        borderRadius: "2px",
                        color: "#fff",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <span
                      onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                      style={{
                        position: "absolute",
                        right: "6px",
                        cursor: "pointer",
                        fontSize: "9px",
                        color: "var(--accent-text)",
                        userSelect: "none",
                      }}
                    >
                      ▼
                    </span>
                  </div>

                  {/* Auto-Fetch Floating Dropdown */}
                  {isClientDropdownOpen && (
                    <div
                      ref={clientDropdownRef}
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "14px",
                        right: "14px",
                        zIndex: 100,
                        backgroundColor: "#0d111a",
                        border: "1px solid var(--accent-border)",
                        borderRadius: "3px",
                        maxHeight: "220px",
                        overflowY: "auto",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                        marginTop: "4px",
                      }}
                    >
                      <div style={{ padding: "6px 10px", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        Select from Clients List ({clientSuggestions.length})
                      </div>
                      {clientSuggestions.length === 0 ? (
                        <div style={{ padding: "10px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                          No matching client. Press Enter to use "{newClient}"
                        </div>
                      ) : (
                        clientSuggestions.map((c) => (
                          <div
                            key={c}
                            onClick={() => {
                              setNewClient(c);
                              setIsClientDropdownOpen(false);
                            }}
                            style={{
                              padding: "7px 10px",
                              fontSize: "12px",
                              color: "#fff",
                              cursor: "pointer",
                              borderBottom: "1px solid rgba(255,255,255,0.03)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,138,115,0.18)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <span>{c}</span>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Select</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </td>

                {/* 2. Product Specification Input */}
                <td style={{ padding: "8px 14px" }}>
                  <input
                    type="text"
                    placeholder="Product specification (e.g. 15mm Double Color Lanyards)..."
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddFromFirstRow();
                    }}
                    style={{
                      width: "100%",
                      height: "32px",
                      padding: "0 8px",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "2px",
                      color: "#fff",
                      fontSize: "12px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </td>

                {/* 3. Category Selector */}
                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{
                      width: "100%",
                      height: "32px",
                      padding: "0 6px",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "2px",
                      color: "#c084fc",
                      fontWeight: 700,
                      fontSize: "11.5px",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="Lanyards" style={{ backgroundColor: "#0f1420", color: "#fff" }}>Lanyards</option>
                    <option value="ID Cards" style={{ backgroundColor: "#0f1420", color: "#fff" }}>ID Cards</option>
                    <option value="Combo" style={{ backgroundColor: "#0f1420", color: "#fff" }}>Combo</option>
                    <option value="Badges" style={{ backgroundColor: "#0f1420", color: "#fff" }}>Badges</option>
                  </select>
                </td>

                {/* 4. Quantity Input */}
                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddFromFirstRow();
                    }}
                    style={{
                      width: "100%",
                      height: "32px",
                      padding: "0 6px",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "2px",
                      color: "#fff",
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                      textAlign: "center",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </td>

                {/* 5. Order Date Input */}
                <td style={{ padding: "8px 10px" }}>
                  <input
                    type="text"
                    value={newOrderDate}
                    onChange={(e) => setNewOrderDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddFromFirstRow();
                    }}
                    style={{
                      width: "100%",
                      height: "32px",
                      padding: "0 6px",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "2px",
                      color: "var(--text-secondary)",
                      fontSize: "11.5px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </td>

                {/* 6. Delivery Due Date Input */}
                <td style={{ padding: "8px 10px" }}>
                  <input
                    type="text"
                    value={newDeliveryDate}
                    onChange={(e) => setNewDeliveryDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddFromFirstRow();
                    }}
                    style={{
                      width: "100%",
                      height: "32px",
                      padding: "0 6px",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "2px",
                      color: "#f59e0b",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </td>

                {/* 7. Action: Add Order button */}
                <td style={{ padding: "8px 14px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => handleAddFromFirstRow()}
                    style={{
                      height: "32px",
                      padding: "0 12px",
                      borderRadius: "2px",
                      backgroundColor: "var(--accent)",
                      backgroundImage: "linear-gradient(135deg, #ff8a73 0%, #ea580c 100%)",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    + Add
                  </button>
                </td>
              </tr>

              {/* ─── EXISTING ORDERS (DOUBLE CLICK EDITABLE) ────────────────────── */}
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "36px 0", textAlign: "center", color: "var(--text-muted)" }}>
                    No orders match your search criteria. Enter above to create one.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const isEditing = (field: keyof OrderRecord) =>
                    editingCell?.id === order.internalId && editingCell?.field === field;

                  return (
                    <tr
                      key={order.internalId}
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
                      {/* 1. Client (Selector / Auto-fetch on double click) */}
                      <td
                        style={{ padding: "12px 16px", cursor: "text", position: "relative" }}
                        onDoubleClick={(e) => handleStartEdit(order, "client", e)}
                        title="Double-click to select or edit client"
                      >
                        {isEditing("client") ? (
                          <div style={{ position: "relative" }}>
                            <input
                              ref={editInputRef}
                              value={editValue}
                              onChange={(e) => {
                                setEditValue(e.target.value);
                                setIsEditClientDropdownOpen(true);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              onBlur={() => {
                                setTimeout(() => handleSaveEdit(), 150);
                              }}
                              style={{
                                width: "100%",
                                padding: "4px 8px",
                                backgroundColor: "rgba(0,0,0,0.7)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "2px",
                                color: "#fff",
                                fontSize: "12.5px",
                                fontWeight: 700,
                                outline: "none",
                              }}
                            />
                            {isEditClientDropdownOpen && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "100%",
                                  left: 0,
                                  right: 0,
                                  zIndex: 100,
                                  backgroundColor: "#0d111a",
                                  border: "1px solid var(--accent-border)",
                                  borderRadius: "3px",
                                  maxHeight: "180px",
                                  overflowY: "auto",
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                                  marginTop: "2px",
                                }}
                              >
                                {editClientSuggestions.map((c) => (
                                  <div
                                    key={c}
                                    onMouseDown={() => {
                                      setOrders((prev) =>
                                        prev.map((o) => (o.internalId === order.internalId ? { ...o, client: c } : o))
                                      );
                                      setEditingCell(null);
                                      setIsEditClientDropdownOpen(false);
                                      success("Updated Client", `Selected ${c}`);
                                    }}
                                    style={{
                                      padding: "6px 10px",
                                      fontSize: "12px",
                                      color: "#fff",
                                      cursor: "pointer",
                                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,138,115,0.18)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                  >
                                    {c}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <strong style={{ color: "#ffffff", fontSize: "13px" }}>{order.client}</strong>
                        )}
                      </td>

                      {/* 2. Product Specification */}
                      <td
                        style={{ padding: "12px 16px", cursor: "text" }}
                        onDoubleClick={(e) => handleStartEdit(order, "product", e)}
                        title="Double-click to edit product spec"
                      >
                        {isEditing("product") ? (
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            style={{
                              width: "100%",
                              padding: "4px 8px",
                              backgroundColor: "rgba(0,0,0,0.6)",
                              border: "1px solid var(--accent-border)",
                              borderRadius: "2px",
                              color: "#fff",
                              fontSize: "12.5px",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{order.product}</span>
                            {order.notes && (
                              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                                {order.notes}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 3. Category */}
                      <td
                        style={{ padding: "12px 14px", textAlign: "center", cursor: "pointer" }}
                        onDoubleClick={(e) => handleStartEdit(order, "category", e)}
                        title="Double-click to edit category"
                      >
                        {isEditing("category") ? (
                          <select
                            value={editValue}
                            onChange={(e) => {
                              setOrders((prev) =>
                                prev.map((o) => (o.internalId === order.internalId ? { ...o, category: e.target.value } : o))
                              );
                              setEditingCell(null);
                              success("Updated Category", `Category set to ${e.target.value}`);
                            }}
                            onBlur={() => setEditingCell(null)}
                            style={{
                              padding: "3px 6px",
                              backgroundColor: "#0f1420",
                              border: "1px solid var(--accent-border)",
                              borderRadius: "2px",
                              color: "#fff",
                              fontSize: "11px",
                            }}
                          >
                            <option value="Lanyards">Lanyards</option>
                            <option value="ID Cards">ID Cards</option>
                            <option value="Combo">Combo</option>
                            <option value="Badges">Badges</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "2px",
                              backgroundColor: "rgba(168, 85, 247, 0.14)",
                              color: "#c084fc",
                            }}
                          >
                            {order.category}
                          </span>
                        )}
                      </td>

                      {/* 4. Quantity */}
                      <td
                        style={{ padding: "12px 14px", textAlign: "center", cursor: "text" }}
                        onDoubleClick={(e) => handleStartEdit(order, "qty", e)}
                        title="Double-click to edit quantity"
                      >
                        {isEditing("qty") ? (
                          <input
                            ref={editInputRef}
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            style={{
                              width: "75px",
                              padding: "3px 6px",
                              backgroundColor: "rgba(0,0,0,0.6)",
                              border: "1px solid var(--accent-border)",
                              borderRadius: "2px",
                              color: "#fff",
                              fontSize: "12px",
                              fontFamily: "var(--font-mono)",
                              textAlign: "center",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff", fontSize: "13px" }}>
                            {order.qty.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* 5. Order Date */}
                      <td
                        style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)", cursor: "text" }}
                        onDoubleClick={(e) => handleStartEdit(order, "orderDate", e)}
                        title="Double-click to edit order date"
                      >
                        {isEditing("orderDate") ? (
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            style={{
                              width: "110px",
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
                          order.orderDate
                        )}
                      </td>

                      {/* 6. Delivery Due Date */}
                      <td
                        style={{ padding: "12px 14px", fontSize: "12px", color: "#f59e0b", fontWeight: 600, cursor: "text" }}
                        onDoubleClick={(e) => handleStartEdit(order, "deliveryDate", e)}
                        title="Double-click to edit delivery date"
                      >
                        {isEditing("deliveryDate") ? (
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            style={{
                              width: "110px",
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
                          order.deliveryDate
                        )}
                      </td>

                      {/* 7. Action (Empty or quick indicator) */}
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          ✓
                        </span>
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
              Showing {filteredOrders.length} production orders · Total volume:{" "}
              <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
                {filteredOrders.reduce((s, o) => s + o.qty, 0).toLocaleString()} units
              </strong>
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Top row is ready for quick entry · Double-click any cell below to edit inline
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
