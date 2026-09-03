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

// ─── Standard Items for "Things Ordered" ───────────────────────────────────────
export const STANDARD_ORDER_ITEMS = ["Lanyard", "Card", "Badge"] as const;
export type StandardItem = (typeof STANDARD_ORDER_ITEMS)[number];

export interface OrderRecord {
  internalId: string;
  client: string;
  product: string;
  itemsOrdered: string[]; // e.g. ["Lanyard", "Card"] or ["Badge", "Keychain"]
  qty: number;
  orderDate: string;
  deliveryDate: string;
  notes?: string;
}

const INITIAL_ORDERS: OrderRecord[] = [
  { internalId: "ord-1", client: "St. Xavier's High School", product: "Multicolor Lanyards (15mm)", itemsOrdered: ["Lanyard", "Card"], qty: 2000, orderDate: "28 Aug 2026", deliveryDate: "05 Sep 2026", notes: "Triple color blue/white/red" },
  { internalId: "ord-2", client: "BHEL Township Admin", product: "Single Color Lanyards (10mm)", itemsOrdered: ["Lanyard", "Card"], qty: 500, orderDate: "30 Aug 2026", deliveryDate: "07 Sep 2026", notes: "Navy blue, with ID pouch" },
  { internalId: "ord-3", client: "Northwind Coffee", product: "Custom Printed Lanyards", itemsOrdered: ["Lanyard"], qty: 1500, orderDate: "22 Aug 2026", deliveryDate: "02 Sep 2026", notes: "Red/white double color" },
  { internalId: "ord-4", client: "AIIMS Bhopal", product: "Medical Staff ID Cards", itemsOrdered: ["Card"], qty: 350, orderDate: "29 Aug 2026", deliveryDate: "04 Sep 2026", notes: "PVC laminated, photo embed" },
  { internalId: "ord-5", client: "Govt Engineering College Bhopal", product: "Lanyards + PVC Badges", itemsOrdered: ["Lanyard", "Badge"], qty: 800, orderDate: "25 Aug 2026", deliveryDate: "03 Sep 2026" },
  { internalId: "ord-6", client: "Reliance Retail - Bhopal", product: "Staff Access Cards", itemsOrdered: ["Card"], qty: 200, orderDate: "01 Sep 2026", deliveryDate: "10 Sep 2026" },
  { internalId: "ord-7", client: "NIT Bhopal", product: "Faculty + Student Lanyards", itemsOrdered: ["Lanyard"], qty: 1200, orderDate: "31 Aug 2026", deliveryDate: "08 Sep 2026", notes: "20mm full color print" },
  { internalId: "ord-8", client: "Maulana Azad Hospital", product: "Staff ID Lanyards", itemsOrdered: ["Lanyard", "Card"], qty: 600, orderDate: "03 Sep 2026", deliveryDate: "12 Sep 2026" },
  { internalId: "ord-9", client: "Smart City Council", product: "Event Delegate Badges", itemsOrdered: ["Badge"], qty: 450, orderDate: "02 Sep 2026", deliveryDate: "06 Sep 2026", notes: "Rush conference delegate" },
  { internalId: "ord-10", client: "Indraprastha School", product: "Lanyards + Clear Sleeves", itemsOrdered: ["Lanyard", "Clear Sleeves"], qty: 1000, orderDate: "20 Aug 2026", deliveryDate: "01 Sep 2026", notes: "Dog hooks + clear pouches" },
  { internalId: "ord-11", client: "MP Secretariat", product: "Embossed Security ID Cards", itemsOrdered: ["Card", "Badge"], qty: 150, orderDate: "01 Sep 2026", deliveryDate: "09 Sep 2026" },
  { internalId: "ord-12", client: "Bansal Group Schools", product: "Lanyards (12mm Blue/White)", itemsOrdered: ["Lanyard"], qty: 3000, orderDate: "27 Aug 2026", deliveryDate: "06 Sep 2026" },
];

export interface OrdersWorkspaceViewProps {
  clients?: any[];
  onSelectOrder?: (id: string) => void;
}

// ─── Helper Badge for Things Ordered ──────────────────────────────────────────
const ItemBadge: React.FC<{ name: string }> = ({ name }) => {
  const isLanyard = name.toLowerCase().includes("lanyard");
  const isCard = name.toLowerCase().includes("card");
  const isBadge = name.toLowerCase().includes("badge");

  const colors = isLanyard
    ? { bg: "rgba(168, 85, 247, 0.16)", text: "#c084fc", border: "rgba(168, 85, 247, 0.35)" }
    : isCard
    ? { bg: "rgba(56, 189, 248, 0.16)", text: "#38bdf8", border: "rgba(56, 189, 248, 0.35)" }
    : isBadge
    ? { bg: "rgba(244, 114, 182, 0.16)", text: "#f472b6", border: "rgba(244, 114, 182, 0.35)" }
    : { bg: "rgba(251, 191, 36, 0.16)", text: "#fbbf24", border: "rgba(251, 191, 36, 0.35)" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "2px",
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.2px",
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </span>
  );
};

export const OrdersWorkspaceView: React.FC<OrdersWorkspaceViewProps> = ({ clients = [] }) => {
  const { success } = useToast();
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [search, setSearch] = useState("");
  const [filterItem, setFilterItem] = useState("ALL");
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
  const [newItemsOrdered, setNewItemsOrdered] = useState<string[]>(["Lanyard"]);
  const [otherItemText, setOtherItemText] = useState("");
  const [hasOtherChecked, setHasOtherChecked] = useState(false);
  const [newQty, setNewQty] = useState("");
  const [newOrderDate, setNewOrderDate] = useState("03 Sep 2026");
  const [newDeliveryDate, setNewDeliveryDate] = useState("10 Sep 2026");

  // Autocomplete dropdown for First Row Client
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Multi-select popover for First Row "Things Ordered"
  const [isItemsDropdownOpen, setIsItemsDropdownOpen] = useState(false);
  const itemsSelectorRef = useRef<HTMLDivElement>(null);

  // Filtered client suggestions for First Row
  const clientSuggestions = useMemo(() => {
    if (!newClient.trim()) return clientNames;
    const q = newClient.toLowerCase();
    return clientNames.filter((c) => c.toLowerCase().includes(q));
  }, [clientNames, newClient]);

  // ─── Double-Click Inline Editing State for Existing Rows ────────────────────
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof OrderRecord } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editItemsArray, setEditItemsArray] = useState<string[]>([]);
  const [editOtherText, setEditOtherText] = useState("");
  const [editHasOther, setEditHasOther] = useState(false);
  const [isEditClientDropdownOpen, setIsEditClientDropdownOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && editInputRef.current && editingCell.field !== "itemsOrdered") {
      editInputRef.current.focus();
      if (editingCell.field !== "client") {
        editInputRef.current.select();
      }
    }
  }, [editingCell]);

  // Close dropdowns on outside click
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

      if (itemsSelectorRef.current && !itemsSelectorRef.current.contains(e.target as Node)) {
        setIsItemsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterOptions = ["ALL", "Lanyard", "Card", "Badge", "Other"];

  const filteredOrders = useMemo(() => {
    let list = orders.filter((o) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        o.client.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        o.itemsOrdered.some((item) => item.toLowerCase().includes(q));

      let matchFilter = true;
      if (filterItem !== "ALL") {
        if (filterItem === "Other") {
          matchFilter = o.itemsOrdered.some(
            (item) => !["lanyard", "card", "badge"].includes(item.toLowerCase())
          );
        } else {
          matchFilter = o.itemsOrdered.some(
            (item) => item.toLowerCase() === filterItem.toLowerCase()
          );
        }
      }

      return matchSearch && matchFilter;
    });

    list = [...list].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = typeof aVal === "number" ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [orders, search, filterItem, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ─── Helper to Toggle Things Ordered in First Row ───────────────────────────
  const toggleFirstRowItem = (item: StandardItem) => {
    setNewItemsOrdered((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  // ─── Add Order From First Row ───────────────────────────────────────────────
  const handleAddFromFirstRow = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newClient.trim()) {
      clientInputRef.current?.focus();
      return;
    }

    // Assemble final items ordered array
    let items = [...newItemsOrdered];
    if (hasOtherChecked && otherItemText.trim()) {
      items.push(otherItemText.trim());
    }
    if (items.length === 0) {
      items = ["Lanyard"];
    }

    const createdOrder: OrderRecord = {
      internalId: `ord-${Date.now()}`,
      client: newClient.trim(),
      product: newProduct.trim() || items.join(" + ") + " Production",
      itemsOrdered: items,
      qty: parseInt(newQty, 10) || 500,
      orderDate: newOrderDate || "Today",
      deliveryDate: newDeliveryDate || "Next Week",
    };

    setOrders([createdOrder, ...orders]);
    setNewClient("");
    setNewProduct("");
    setNewQty("");
    setHasOtherChecked(false);
    setOtherItemText("");
    setIsClientDropdownOpen(false);
    setIsItemsDropdownOpen(false);
    success("Order Added", `Recorded order for ${createdOrder.client}`);
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
        if (field === "itemsOrdered") {
          let items = [...editItemsArray];
          if (editHasOther && editOtherText.trim()) {
            items.push(editOtherText.trim());
          }
          if (items.length === 0) items = ["Lanyard"];
          return { ...o, itemsOrdered: items };
        }
        return { ...o, [field]: editValue };
      })
    );

    setEditingCell(null);
    setIsEditClientDropdownOpen(false);
    success("Saved", `Updated order details`);
  };

  const handleStartEdit = (order: OrderRecord, field: keyof OrderRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCell({ id: order.internalId, field });
    setEditValue(String(order[field] ?? ""));

    if (field === "client") {
      setIsEditClientDropdownOpen(true);
    } else if (field === "itemsOrdered") {
      const std = order.itemsOrdered.filter((x) =>
        STANDARD_ORDER_ITEMS.includes(x as StandardItem)
      );
      const other = order.itemsOrdered.find(
        (x) => !STANDARD_ORDER_ITEMS.includes(x as StandardItem)
      );
      setEditItemsArray(std);
      setEditHasOther(Boolean(other));
      setEditOtherText(other || "");
    }
  };

  const editClientSuggestions = useMemo(() => {
    if (!editValue.trim()) return clientNames;
    const q = editValue.toLowerCase();
    return clientNames.filter((c) => c.toLowerCase().includes(q));
  }, [clientNames, editValue]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>

      {/* ─── SINGLE COMPACT HEADER BAR ───────────────────────────────────────── */}
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
        {/* Left: Modern Search Bar & Things Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "320px", maxWidth: "720px" }}>
          <div
            style={{
              position: "relative",
              flex: 1,
              backgroundColor: "rgba(10, 14, 23, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "3px",
              height: "38px",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: "8px",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            <Icon name="search" size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search orders by client, product, or item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "13px",
              }}
            />
            {search && (
              <span
                onClick={() => setSearch("")}
                style={{ cursor: "pointer", color: "var(--text-muted)", fontSize: "12px", padding: "2px" }}
              >
                ✕
              </span>
            )}
          </div>

          {/* Quick Filter Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "rgba(0,0,0,0.3)", padding: "3px", borderRadius: "3px" }}>
            {filterOptions.map((opt) => {
              const active = filterItem === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFilterItem(opt)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "2px",
                    border: "none",
                    backgroundColor: active ? "rgba(255,138,115,0.18)" : "transparent",
                    color: active ? "var(--accent-text)" : "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {opt === "ALL" ? "All" : opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Counter, Hint & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ color: "#38bdf8" }}>💡</span> First row for direct entry · Double-click row to edit
          </span>

          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              padding: "5px 10px",
              borderRadius: "2px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              fontFamily: "var(--font-mono)",
            }}
          >
            {filteredOrders.length} Orders
          </span>

          <Button
            variant="secondary"
            size="sm"
            icon="refresh"
            style={{ borderRadius: "2px", height: "36px" }}
            onClick={() => success("Refreshed", "Orders synchronized")}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── ORDERS TABLE (Polished Inputs, Multi-Select Checkboxes, Seamless Style) ─ */}
      <div style={{ padding: "18px 24px", flex: 1 }}>
        <div
          style={{
            backgroundColor: "rgba(16, 21, 32, 0.8)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "4px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
            overflow: "visible", // allows dropdowns to display cleanly
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "rgba(9, 12, 20, 0.9)",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-muted)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: "0.6px",
                  userSelect: "none",
                }}
              >
                <th
                  style={{ padding: "14px 18px", textAlign: "left", cursor: "pointer", width: "260px" }}
                  onClick={() => toggleSort("client")}
                >
                  Client {sortField === "client" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th style={{ padding: "14px 16px", textAlign: "left" }}>Product Specification</th>
                <th style={{ padding: "14px 14px", textAlign: "left", width: "220px" }}>Things Ordered</th>
                <th
                  style={{ padding: "14px 14px", textAlign: "center", width: "110px", cursor: "pointer" }}
                  onClick={() => toggleSort("qty")}
                >
                  Quantity {sortField === "qty" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ padding: "14px 14px", textAlign: "left", width: "135px", cursor: "pointer" }}
                  onClick={() => toggleSort("orderDate")}
                >
                  Order Date {sortField === "orderDate" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ padding: "14px 14px", textAlign: "left", width: "135px", cursor: "pointer" }}
                  onClick={() => toggleSort("deliveryDate")}
                >
                  Delivery Due {sortField === "deliveryDate" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th style={{ padding: "14px 18px", textAlign: "center", width: "100px" }}>Action</th>
              </tr>
            </thead>
            <tbody>

              {/* ─── ROW 1: SLEEK QUICK ENTRY ROW (Inputs styled with glow & polish) ─── */}
              <tr
                style={{
                  backgroundColor: "rgba(255, 138, 115, 0.04)",
                  borderBottom: "2px solid rgba(255, 138, 115, 0.35)",
                }}
              >
                {/* 1. Client Field with Auto-Fetch Autocomplete Selector */}
                <td style={{ padding: "10px 16px", position: "relative" }}>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      ref={clientInputRef}
                      type="text"
                      placeholder="Search or type client..."
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
                        height: "38px",
                        padding: "0 28px 0 12px",
                        backgroundColor: "rgba(9, 12, 19, 0.85)",
                        border: "1px solid rgba(255, 138, 115, 0.4)",
                        borderRadius: "3px",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 600,
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "all 0.15s ease",
                      }}
                    />
                    <span
                      onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        cursor: "pointer",
                        fontSize: "10px",
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
                        left: "16px",
                        right: "16px",
                        zIndex: 100,
                        backgroundColor: "#0c101a",
                        border: "1px solid var(--accent-border)",
                        borderRadius: "3px",
                        maxHeight: "240px",
                        overflowY: "auto",
                        boxShadow: "0 12px 36px rgba(0,0,0,0.75)",
                        marginTop: "4px",
                      }}
                    >
                      <div
                        style={{
                          padding: "8px 12px",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          backgroundColor: "rgba(255,255,255,0.02)",
                        }}
                      >
                        Registered Clients ({clientSuggestions.length})
                      </div>
                      {clientSuggestions.length === 0 ? (
                        <div style={{ padding: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                          No matching registered client. Press Enter to add "{newClient}"
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
                              padding: "9px 12px",
                              fontSize: "12.5px",
                              color: "#fff",
                              cursor: "pointer",
                              borderBottom: "1px solid rgba(255,255,255,0.03)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(255,138,115,0.18)";
                              e.currentTarget.style.borderLeft = "2px solid var(--accent)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.borderLeft = "none";
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{c}</span>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>SELECT</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </td>

                {/* 2. Product Specification Input */}
                <td style={{ padding: "10px 12px" }}>
                  <input
                    type="text"
                    placeholder="Specification (e.g. 15mm Double Color Satin)..."
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddFromFirstRow();
                    }}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 12px",
                      backgroundColor: "rgba(9, 12, 19, 0.85)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "3px",
                      color: "#fff",
                      fontSize: "12.5px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </td>

                {/* 3. THINGS ORDERED (Multi-select Checkbox Trigger & Popover) */}
                <td style={{ padding: "10px 12px", position: "relative" }}>
                  <div
                    ref={itemsSelectorRef}
                    onClick={() => setIsItemsDropdownOpen(!isItemsDropdownOpen)}
                    style={{
                      minHeight: "38px",
                      padding: "4px 8px",
                      backgroundColor: "rgba(9, 12, 19, 0.85)",
                      border: "1px solid " + (isItemsDropdownOpen ? "var(--accent-border)" : "rgba(255, 255, 255, 0.12)"),
                      borderRadius: "3px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "6px",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {newItemsOrdered.map((item) => (
                        <ItemBadge key={item} name={item} />
                      ))}
                      {hasOtherChecked && otherItemText.trim() && (
                        <ItemBadge name={otherItemText.trim()} />
                      )}
                      {newItemsOrdered.length === 0 && !hasOtherChecked && (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Select items...</span>
                      )}
                    </div>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)", flexShrink: 0 }}>▼</span>
                  </div>

                  {/* Multi-Select Dropdown Popover */}
                  {isItemsDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "12px",
                        width: "260px",
                        zIndex: 110,
                        backgroundColor: "#0d111a",
                        border: "1px solid var(--accent-border)",
                        borderRadius: "4px",
                        padding: "12px",
                        boxShadow: "0 12px 36px rgba(0,0,0,0.8)",
                        marginTop: "4px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        What is being ordered?
                      </div>

                      {/* Checkboxes for Lanyard, Card, Badge */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {STANDARD_ORDER_ITEMS.map((item) => {
                          const checked = newItemsOrdered.includes(item);
                          return (
                            <label
                              key={item}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "12.5px",
                                color: checked ? "#fff" : "var(--text-secondary)",
                                cursor: "pointer",
                                userSelect: "none",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleFirstRowItem(item)}
                                style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                              />
                              <ItemBadge name={item} />
                            </label>
                          );
                        })}

                        {/* Other Checkbox with input */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "2px" }}>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "12.5px",
                              color: hasOtherChecked ? "#fff" : "var(--text-secondary)",
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={hasOtherChecked}
                              onChange={(e) => setHasOtherChecked(e.target.checked)}
                              style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                            />
                            <span>Other (Custom item)</span>
                          </label>

                          {hasOtherChecked && (
                            <input
                              type="text"
                              placeholder="Type item (e.g. Keychains, ID Sleeve)..."
                              value={otherItemText}
                              onChange={(e) => setOtherItemText(e.target.value)}
                              autoFocus
                              style={{
                                width: "100%",
                                height: "32px",
                                padding: "0 8px",
                                backgroundColor: "rgba(0,0,0,0.5)",
                                border: "1px solid rgba(255,255,255,0.18)",
                                borderRadius: "2px",
                                color: "#fff",
                                fontSize: "12px",
                                outline: "none",
                                boxSizing: "border-box",
                              }}
                            />
                          )}
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "8px", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => setIsItemsDropdownOpen(false)}
                          style={{
                            padding: "4px 12px",
                            borderRadius: "2px",
                            backgroundColor: "var(--accent)",
                            border: "none",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </td>

                {/* 4. Quantity Input */}
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <input
                    type="number"
                    placeholder="500"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddFromFirstRow();
                    }}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 8px",
                      backgroundColor: "rgba(9, 12, 19, 0.85)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "3px",
                      color: "#fff",
                      fontSize: "13px",
                      fontFamily: "var(--font-mono)",
                      textAlign: "center",
                      fontWeight: 700,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </td>

                {/* 5. Order Date Input */}
                <td style={{ padding: "10px 12px" }}>
                  <input
                    type="text"
                    value={newOrderDate}
                    onChange={(e) => setNewOrderDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddFromFirstRow();
                    }}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 10px",
                      backgroundColor: "rgba(9, 12, 19, 0.85)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "3px",
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </td>

                {/* 6. Delivery Due Date Input */}
                <td style={{ padding: "10px 12px" }}>
                  <input
                    type="text"
                    value={newDeliveryDate}
                    onChange={(e) => setNewDeliveryDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddFromFirstRow();
                    }}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 10px",
                      backgroundColor: "rgba(9, 12, 19, 0.85)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "3px",
                      color: "#f59e0b",
                      fontSize: "12px",
                      fontWeight: 700,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </td>

                {/* 7. Action: Add Order button */}
                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => handleAddFromFirstRow()}
                    style={{
                      height: "38px",
                      width: "100%",
                      borderRadius: "3px",
                      backgroundColor: "var(--accent)",
                      backgroundImage: "linear-gradient(135deg, #ff8a73 0%, #ea580c 100%)",
                      border: "none",
                      color: "#fff",
                      fontSize: "12.5px",
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 8px rgba(234, 88, 12, 0.35)",
                    }}
                  >
                    + Add
                  </button>
                </td>
              </tr>

              {/* ─── EXISTING ORDERS LIST (Double-Click Inline Editable) ─────────── */}
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
                    No orders match your search criteria. Type above to create one.
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
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)")
                      }
                    >
                      {/* 1. Client (Double-click to select or edit) */}
                      <td
                        style={{ padding: "13px 18px", cursor: "text", position: "relative" }}
                        onDoubleClick={(e) => handleStartEdit(order, "client", e)}
                        title="Double-click to change client"
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
                                height: "34px",
                                padding: "0 8px",
                                backgroundColor: "rgba(0,0,0,0.85)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "2px",
                                color: "#fff",
                                fontSize: "13px",
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
                                  maxHeight: "200px",
                                  overflowY: "auto",
                                  boxShadow: "0 12px 36px rgba(0,0,0,0.7)",
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
                                      success("Updated Client", `Assigned to ${c}`);
                                    }}
                                    style={{
                                      padding: "8px 12px",
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
                          <strong style={{ color: "#ffffff", fontSize: "13.5px", letterSpacing: "-0.1px" }}>
                            {order.client}
                          </strong>
                        )}
                      </td>

                      {/* 2. Product Specification */}
                      <td
                        style={{ padding: "13px 16px", cursor: "text" }}
                        onDoubleClick={(e) => handleStartEdit(order, "product", e)}
                        title="Double-click to edit specification"
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
                              height: "34px",
                              padding: "0 8px",
                              backgroundColor: "rgba(0,0,0,0.85)",
                              border: "1px solid var(--accent-border)",
                              borderRadius: "2px",
                              color: "#fff",
                              fontSize: "13px",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "13px" }}>
                              {order.product}
                            </span>
                            {order.notes && (
                              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                                {order.notes}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 3. Things Ordered (Pill badges + Double click multi-select) */}
                      <td
                        style={{ padding: "13px 14px", cursor: "pointer", position: "relative" }}
                        onDoubleClick={(e) => handleStartEdit(order, "itemsOrdered", e)}
                        title="Double-click to customize items ordered"
                      >
                        {isEditing("itemsOrdered") ? (
                          <div
                            style={{
                              position: "absolute",
                              top: "5px",
                              left: "10px",
                              width: "250px",
                              zIndex: 120,
                              backgroundColor: "#0d111a",
                              border: "1px solid var(--accent-border)",
                              borderRadius: "4px",
                              padding: "12px",
                              boxShadow: "0 12px 36px rgba(0,0,0,0.85)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                              Edit Things Ordered
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {STANDARD_ORDER_ITEMS.map((item) => {
                                const checked = editItemsArray.includes(item);
                                return (
                                  <label key={item} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#fff", cursor: "pointer" }}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() =>
                                        setEditItemsArray((prev) =>
                                          prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
                                        )
                                      }
                                      style={{ accentColor: "var(--accent)" }}
                                    />
                                    <ItemBadge name={item} />
                                  </label>
                                );
                              })}

                              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#fff", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={editHasOther}
                                  onChange={(e) => setEditHasOther(e.target.checked)}
                                  style={{ accentColor: "var(--accent)" }}
                                />
                                <span>Other (Custom)</span>
                              </label>

                              {editHasOther && (
                                <input
                                  type="text"
                                  placeholder="Specify other item..."
                                  value={editOtherText}
                                  onChange={(e) => setEditOtherText(e.target.value)}
                                  style={{
                                    width: "100%",
                                    height: "30px",
                                    padding: "0 8px",
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    border: "1px solid rgba(255,255,255,0.18)",
                                    borderRadius: "2px",
                                    color: "#fff",
                                    fontSize: "12px",
                                    outline: "none",
                                  }}
                                />
                              )}
                            </div>

                            <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => setEditingCell(null)}
                                style={{ padding: "4px 8px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.08)", border: "none", color: "#fff", fontSize: "11px", cursor: "pointer" }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                style={{ padding: "4px 10px", borderRadius: "2px", backgroundColor: "var(--accent)", border: "none", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {order.itemsOrdered.map((item) => (
                              <ItemBadge key={item} name={item} />
                            ))}
                          </div>
                        )}
                      </td>

                      {/* 4. Quantity */}
                      <td
                        style={{ padding: "13px 14px", textAlign: "center", cursor: "text" }}
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
                              width: "80px",
                              height: "32px",
                              padding: "0 6px",
                              backgroundColor: "rgba(0,0,0,0.85)",
                              border: "1px solid var(--accent-border)",
                              borderRadius: "2px",
                              color: "#fff",
                              fontSize: "12.5px",
                              fontFamily: "var(--font-mono)",
                              textAlign: "center",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "#fff", fontSize: "13.5px" }}>
                            {order.qty.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* 5. Order Date */}
                      <td
                        style={{ padding: "13px 14px", fontSize: "12px", color: "var(--text-secondary)", cursor: "text" }}
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
                              width: "115px",
                              height: "32px",
                              padding: "0 6px",
                              backgroundColor: "rgba(0,0,0,0.85)",
                              border: "1px solid var(--accent-border)",
                              borderRadius: "2px",
                              color: "#fff",
                              fontSize: "12px",
                              outline: "none",
                            }}
                          />
                        ) : (
                          order.orderDate
                        )}
                      </td>

                      {/* 6. Delivery Due Date */}
                      <td
                        style={{ padding: "13px 14px", fontSize: "12.5px", color: "#f59e0b", fontWeight: 700, cursor: "text" }}
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
                              width: "115px",
                              height: "32px",
                              padding: "0 6px",
                              backgroundColor: "rgba(0,0,0,0.85)",
                              border: "1px solid var(--accent-border)",
                              borderRadius: "2px",
                              color: "#fff",
                              fontSize: "12px",
                              outline: "none",
                            }}
                          />
                        ) : (
                          order.deliveryDate
                        )}
                      </td>

                      {/* 7. Action Indicator */}
                      <td style={{ padding: "13px 18px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(16, 185, 129, 0.12)",
                            color: "#10b981",
                            fontSize: "11px",
                            fontWeight: 800,
                          }}
                        >
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
              padding: "12px 18px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "rgba(8, 11, 18, 0.5)",
            }}
          >
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
              Showing {filteredOrders.length} production orders · Total volume:{" "}
              <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
                {filteredOrders.reduce((s, o) => s + o.qty, 0).toLocaleString()} units
              </strong>
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Top row is ready for quick entry · Double-click any row to edit values inline
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
