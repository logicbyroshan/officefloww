import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";

// ─── Order Interface (No ID, Amount, Priority, or Status in UI) ───────────────
export interface OrderRecord {
  internalId: string; // internal tracking key only, never shown in UI
  client: string;
  phone: string;
  product: string;
  category: string;
  qty: number;
  orderDate: string;
  deliveryDate: string;
  assignedTo: string;
  notes?: string;
}

const INITIAL_ORDERS: OrderRecord[] = [
  { internalId: "ord-1", client: "St. Xavier's High School", phone: "+91 98200 11223", product: "Multicolor Lanyards (15mm)", category: "Lanyards", qty: 2000, orderDate: "28 Aug 2026", deliveryDate: "05 Sep 2026", assignedTo: "Adharsh Team", notes: "Triple color blue/white/red" },
  { internalId: "ord-2", client: "BHEL Township Admin", phone: "+91 76200 44322", product: "Single Color Lanyards (10mm)", category: "Lanyards", qty: 500, orderDate: "30 Aug 2026", deliveryDate: "07 Sep 2026", assignedTo: "Suresh Batch", notes: "Navy blue, with ID pouch" },
  { internalId: "ord-3", client: "Northwind Coffee", phone: "+91 90000 33211", product: "Custom Printed Lanyards", category: "Lanyards", qty: 1500, orderDate: "22 Aug 2026", deliveryDate: "02 Sep 2026", assignedTo: "Suresh Batch", notes: "Red/white double color" },
  { internalId: "ord-4", client: "AIIMS Bhopal", phone: "+91 75500 22110", product: "Medical Staff ID Cards", category: "ID Cards", qty: 350, orderDate: "29 Aug 2026", deliveryDate: "04 Sep 2026", assignedTo: "Print Floor A", notes: "PVC laminated, photo embed" },
  { internalId: "ord-5", client: "Govt Engineering College", phone: "+91 84400 55661", product: "Lanyards + PVC Badges", category: "Combo", qty: 800, orderDate: "25 Aug 2026", deliveryDate: "03 Sep 2026", assignedTo: "Dispatch Team" },
  { internalId: "ord-6", client: "Reliance Retail - Bhopal", phone: "+91 77200 66541", product: "Staff Access Cards", category: "ID Cards", qty: 200, orderDate: "01 Sep 2026", deliveryDate: "10 Sep 2026", assignedTo: "Print Floor B" },
  { internalId: "ord-7", client: "NIT Bhopal", phone: "+91 89100 12345", product: "Faculty + Student Lanyards", category: "Lanyards", qty: 1200, orderDate: "31 Aug 2026", deliveryDate: "08 Sep 2026", assignedTo: "Adharsh Team", notes: "20mm full color print" },
  { internalId: "ord-8", client: "Maulana Azad Hospital", phone: "+91 91000 77812", product: "Staff ID Lanyards", category: "Lanyards", qty: 600, orderDate: "03 Sep 2026", deliveryDate: "12 Sep 2026", assignedTo: "Unassigned" },
  { internalId: "ord-9", client: "Smart City Council", phone: "+91 94300 55219", product: "Event Delegate Badges", category: "Badges", qty: 450, orderDate: "02 Sep 2026", deliveryDate: "06 Sep 2026", assignedTo: "Unassigned", notes: "Rush conference delegate" },
  { internalId: "ord-10", client: "Indraprastha School", phone: "+91 80000 44312", product: "Lanyards + ID Holders", category: "Combo", qty: 1000, orderDate: "20 Aug 2026", deliveryDate: "01 Sep 2026", assignedTo: "Adharsh Team", notes: "Dog hooks + clear pouches" },
  { internalId: "ord-11", client: "MP Secretariat", phone: "+91 75600 11990", product: "Embossed Security ID Cards", category: "ID Cards", qty: 150, orderDate: "01 Sep 2026", deliveryDate: "09 Sep 2026", assignedTo: "Print Floor A" },
  { internalId: "ord-12", client: "Bansal Group Schools", phone: "+91 98100 55441", product: "Lanyards (12mm Blue/White)", category: "Lanyards", qty: 3000, orderDate: "27 Aug 2026", deliveryDate: "06 Sep 2026", assignedTo: "Both Teams" },
];

export const OrdersWorkspaceView: React.FC<{ onSelectOrder?: (id: string) => void }> = ({ onSelectOrder }) => {
  const { success } = useToast();
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortField, setSortField] = useState<"client" | "qty" | "orderDate" | "deliveryDate">("deliveryDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Inline Editing State: which cell is being edited
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof OrderRecord } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const categories = ["ALL", ...Array.from(new Set(orders.map((o) => o.category)))];

  const filteredOrders = useMemo(() => {
    let list = orders.filter((o) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        o.client.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.assignedTo.toLowerCase().includes(q);
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

  const handleStartEdit = (order: OrderRecord, field: keyof OrderRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCell({ id: order.internalId, field });
    setEditValue(String(order[field] ?? ""));
  };

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
    success("Saved", `Updated order ${field}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const handleAddNewRow = () => {
    const newOrd: OrderRecord = {
      internalId: `ord-${Date.now()}`,
      client: "New Client Organization",
      phone: "+91 90000 00000",
      product: "Custom Lanyard Production",
      category: "Lanyards",
      qty: 500,
      orderDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      deliveryDate: "15 Sep 2026",
      assignedTo: "Adharsh Team",
    };
    setOrders([newOrd, ...orders]);
    setEditingCell({ id: newOrd.internalId, field: "client" });
    setEditValue(newOrd.client);
    success("Order Created", "Double-click any cell to customize details");
  };

  const handleDeleteRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrders((prev) => prev.filter((o) => o.internalId !== id));
    success("Removed", "Order deleted from queue");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>

      {/* ─── SINGLE HEADER BAR (No Title, No Stats Cards, Compact Industrial) ─── */}
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
              placeholder="Search client, product, phone, or assigned team..."
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

        {/* Right: Counter, Hint & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ color: "#38bdf8" }}>💡</span> Double-click any cell to edit inline
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

          <Button
            variant="primary"
            size="sm"
            icon="plus"
            style={{ borderRadius: "2px", backgroundColor: "var(--accent)", border: "none" }}
            onClick={handleAddNewRow}
          >
            New Order
          </Button>
        </div>
      </div>

      {/* ─── ORDERS TABLE (No Order ID, No Amount, No Priority, No Status) ────── */}
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
                  userSelect: "none",
                }}
              >
                <th
                  style={{ padding: "12px 16px", textAlign: "left", cursor: "pointer" }}
                  onClick={() => toggleSort("client")}
                >
                  Client Account {sortField === "client" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Product Specification</th>
                <th style={{ padding: "12px 14px", textAlign: "center", width: "110px" }}>Category</th>
                <th
                  style={{ padding: "12px 14px", textAlign: "center", width: "90px", cursor: "pointer" }}
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
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Assigned Team / Station</th>
                <th style={{ padding: "12px 14px", textAlign: "center", width: "60px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)" }}>
                    No orders match your search criteria.
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
                      {/* 1. Client Account (Double-click to edit) */}
                      <td
                        style={{ padding: "12px 16px", cursor: "text" }}
                        onDoubleClick={(e) => handleStartEdit(order, "client", e)}
                        title="Double-click to edit client name"
                      >
                        {isEditing("client") ? (
                          <input
                            ref={inputRef}
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
                              fontSize: "12.5px",
                              fontWeight: 700,
                              outline: "none",
                            }}
                          />
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <strong style={{ color: "#ffffff", fontSize: "13px" }}>{order.client}</strong>
                            <span
                              style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(order, "phone", e);
                              }}
                              title="Double-click to edit phone"
                            >
                              {isEditing("phone") ? (
                                <input
                                  ref={inputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleSaveEdit}
                                  onKeyDown={handleKeyDown}
                                  style={{
                                    width: "140px",
                                    padding: "2px 6px",
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    border: "1px solid var(--accent-border)",
                                    borderRadius: "2px",
                                    color: "#fff",
                                    fontSize: "11px",
                                    outline: "none",
                                  }}
                                />
                              ) : (
                                order.phone
                              )}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 2. Product Specification (Double-click to edit) */}
                      <td
                        style={{ padding: "12px 16px", cursor: "text" }}
                        onDoubleClick={(e) => handleStartEdit(order, "product", e)}
                        title="Double-click to edit product spec"
                      >
                        {isEditing("product") ? (
                          <input
                            ref={inputRef}
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

                      {/* 3. Category (Double-click to edit) */}
                      <td
                        style={{ padding: "12px 14px", textAlign: "center", cursor: "pointer" }}
                        onDoubleClick={(e) => handleStartEdit(order, "category", e)}
                        title="Double-click to edit category"
                      >
                        {isEditing("category") ? (
                          <input
                            ref={inputRef}
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
                              fontSize: "11px",
                              textAlign: "center",
                              outline: "none",
                            }}
                          />
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

                      {/* 4. Quantity (Double-click to edit) */}
                      <td
                        style={{ padding: "12px 14px", textAlign: "center", cursor: "text" }}
                        onDoubleClick={(e) => handleStartEdit(order, "qty", e)}
                        title="Double-click to edit quantity"
                      >
                        {isEditing("qty") ? (
                          <input
                            ref={inputRef}
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={handleKeyDown}
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

                      {/* 5. Order Date (Double-click to edit) */}
                      <td
                        style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)", cursor: "text" }}
                        onDoubleClick={(e) => handleStartEdit(order, "orderDate", e)}
                        title="Double-click to edit order date"
                      >
                        {isEditing("orderDate") ? (
                          <input
                            ref={inputRef}
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
                              outline: "none",
                            }}
                          />
                        ) : (
                          order.orderDate
                        )}
                      </td>

                      {/* 6. Delivery Date (Double-click to edit) */}
                      <td
                        style={{ padding: "12px 14px", fontSize: "12px", color: "#f59e0b", fontWeight: 600, cursor: "text" }}
                        onDoubleClick={(e) => handleStartEdit(order, "deliveryDate", e)}
                        title="Double-click to edit delivery date"
                      >
                        {isEditing("deliveryDate") ? (
                          <input
                            ref={inputRef}
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
                              outline: "none",
                            }}
                          />
                        ) : (
                          order.deliveryDate
                        )}
                      </td>

                      {/* 7. Assigned Team / Workstation (Double-click to edit) */}
                      <td
                        style={{ padding: "12px 16px", fontSize: "12px", color: order.assignedTo === "Unassigned" ? "#f87171" : "var(--text-secondary)", cursor: "text" }}
                        onDoubleClick={(e) => handleStartEdit(order, "assignedTo", e)}
                        title="Double-click to edit assigned team"
                      >
                        {isEditing("assignedTo") ? (
                          <input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={handleKeyDown}
                            style={{
                              width: "140px",
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
                          order.assignedTo
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span
                          onClick={(e) => handleDeleteRow(order.internalId, e)}
                          title="Delete order"
                          style={{
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            fontSize: "13px",
                            padding: "4px",
                            borderRadius: "2px",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                        >
                          ✕
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
              Tip: Double-click any field (Client, Spec, Qty, Dates, Station) to edit inline
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
