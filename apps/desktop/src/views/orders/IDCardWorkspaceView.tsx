import React, { useState, useMemo, useRef, useEffect } from "react";
import { Icon } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";
import {
  useIDCardStore,
  IDCardOrderEntry,
  IDCardCategory,
  IDCardFileFormat,
  parseIDCQuantity,
  resolveHolderName,
} from "./idCardOrdersStore";
import { useStockStore } from "../stock/stockStore";

function getFormattedDateToday(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

// Clean Title Casing for schools and clients
function formatClientTitle(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((w) => {
      const lower = w.toLowerCase().replace(/[()]/g, "");
      if (
        lower === "dps" ||
        lower === "svm" ||
        lower === "vps" ||
        lower === "tsvs" ||
        lower === "vcd" ||
        lower === "bcm" ||
        lower === "bhel" ||
        lower === "nit" ||
        lower === "aiims"
      ) {
        return w.toUpperCase();
      }
      if (w.startsWith("(") && w.endsWith(")")) {
        const inner = w.slice(1, -1);
        return `(${inner.charAt(0).toUpperCase() + inner.slice(1)})`;
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

// Category Badge (Student vs Staff vs Other) — Crisp, restrained industrial tag inline with Client Name
function renderCategoryBadge(category: IDCardCategory) {
  const isStaff = category === "Staff";
  const isOther = category === "Other";
  const label = isStaff ? "Staff" : isOther ? "Other" : "Student";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "2px 7px",
        borderRadius: "4px",
        backgroundColor: isStaff ? "rgba(255, 255, 255, 0.09)" : isOther ? "transparent" : "rgba(255, 255, 255, 0.05)",
        border: isStaff ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.12)",
        color: isStaff ? "#f8fafc" : isOther ? "#94a3b8" : "#cbd5e1",
        fontSize: "11px",
        fontWeight: isStaff ? 700 : 600,
        fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
        flexShrink: 0,
        lineHeight: 1.3,
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          backgroundColor: isStaff ? "#cbd5e1" : isOther ? "#64748b" : "#94a3b8",
        }}
      />
      {label}
    </span>
  );
}

// File Format Badge (DOC / EXCEL / HARD COPY) — Clean, unified technical monospace tag
function renderFormatBadge(format: IDCardFileFormat) {
  const fmt = (format || "doc").toUpperCase();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        color: "#cbd5e1",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
      }}
    >
      {fmt}
    </span>
  );
}

// Card Holder Badge — Strictly displays Holder Item Name ONLY (e.g. DST-V, DST-H, Cards Only, CCH, PV, PH)
function renderHolderBadge(holderName?: string) {
  const name = holderName && holderName.trim() ? holderName.trim() : "DST-V";
  const isOnlyCard = name.toLowerCase().includes("only") || name.toLowerCase().includes("card");

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 9px",
        borderRadius: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        color: isOnlyCard ? "#64748b" : "#cbd5e1",
        fontSize: "12px",
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
      }}
    >
      <span>{isOnlyCard ? "Cards Only" : name}</span>
    </span>
  );
}

export const IDCardWorkspaceView: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const {
    orders,
    addOrder,
    updateOrder,
    updateOrderStatus,
    toggleDesignDone,
  } = useIDCardStore();

  const { getBlankPVCStats, items: stockItems } = useStockStore();

  // View Queue Mode: "ACTIVE" (Default, hides done), "COMPLETED", or "ALL"
  const [viewTab, setViewTab] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");

  // Filter and search states
  const [statusFilter, setStatusFilter] = useState<"ALL" | "kamal" | "ready" | "done">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [fileFilter, setFileFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Ingestion Console states
  const [newClient, setNewClient] = useState("");
  const [newCategory, setNewCategory] = useState<IDCardCategory>("Student");
  const [newQtyStr, setNewQtyStr] = useState("");
  const [newHolderName, setNewHolderName] = useState("DST-V");
  const [newRemark, setNewRemark] = useState("");

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof IDCardOrderEntry } | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  const handleStartEdit = (id: string, field: keyof IDCardOrderEntry, currentValue: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCell({ id, field });
    setEditValue(String(currentValue || ""));
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const val = editValue.trim();

    if (field === "totalQty") {
      const computed = parseIDCQuantity(val);
      updateOrder(id, { totalQty: computed, workQtyDisplay: `${computed} cards` });
      toastSuccess("Updated", "Quantity updated.");
    } else if (field === "sn") {
      const num = parseInt(val, 10);
      if (!isNaN(num)) updateOrder(id, { sn: num });
    } else if (field === "holderName" || field === "holderLanyardStatus") {
      updateOrder(id, { holderName: val, holderLanyardStatus: val });
      toastSuccess("Updated", "Card holder updated.");
    } else {
      updateOrder(id, { [field]: val });
      toastSuccess("Updated", `${String(field)} updated.`);
    }

    setEditingCell(null);
  };

  // Next SN calculation
  const nextSN = useMemo(() => {
    if (!orders || orders.length === 0) return 1497;
    return Math.max(...orders.map((o) => o.sn || 0)) + 1;
  }, [orders]);

  // Overall Blank PVC Card & Ribbon Stock status
  const pvcCardItem = useMemo(() => {
    return stockItems.find((it) => it.code === "pvc-cards") || {
      availableStock: 15000,
      reservedStock: 2473,
      minThreshold: 3000,
    };
  }, [stockItems]);

  const ymckoItem = useMemo(() => {
    return stockItems.find((it) => it.code === "ymcko-ribbon") || {
      availableStock: 12,
      minThreshold: 5,
    };
  }, [stockItems]);

  // Intake prospective qty check
  const parsedIntakeQty = useMemo(() => {
    return parseIDCQuantity(newQtyStr) || 100;
  }, [newQtyStr]);

  const intakeStockCheck = useMemo(() => {
    return getBlankPVCStats(parsedIntakeQty);
  }, [getBlankPVCStats, parsedIntakeQty]);

  // Executive Metric Calculations
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalPieces = orders.reduce((sum, o) => sum + (o.totalQty || 0), 0);

    const activeOrders = orders.filter((o) => o.status !== "done");
    const activeCount = activeOrders.length;
    const activePieces = activeOrders.reduce((sum, o) => sum + (o.totalQty || 0), 0);

    const inKamalOrders = orders.filter((o) => o.status === "kamal");
    const inKamalPieces = inKamalOrders.reduce((sum, o) => sum + (o.totalQty || 0), 0);

    const readyOrders = orders.filter(
      (o) => o.status === "ready" || o.status === "ready (1 pending he)"
    );
    const readyPieces = readyOrders.reduce((sum, o) => sum + (o.totalQty || 0), 0);

    const doneOrders = orders.filter((o) => o.status === "done");
    const donePieces = doneOrders.reduce((sum, o) => sum + (o.totalQty || 0), 0);

    const donePercentage = totalPieces > 0 ? Math.round((donePieces / totalPieces) * 100) : 0;

    return {
      totalOrders,
      totalPieces,
      activeCount,
      activePieces,
      inKamalCount: inKamalOrders.length,
      inKamalPieces,
      readyCount: readyOrders.length,
      readyPieces,
      doneCount: doneOrders.length,
      donePieces,
      donePercentage,
    };
  }, [orders]);

  // Filtered Orders (Latest on Top!)
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // 1. View Tab Filter (Active Queue hides done by default)
        if (viewTab === "ACTIVE" && o.status === "done") return false;
        if (viewTab === "COMPLETED" && o.status !== "done") return false;

        // 2. Status filter
        if (statusFilter === "kamal" && o.status !== "kamal") return false;
        if (statusFilter === "ready" && o.status !== "ready" && o.status !== "ready (1 pending he)")
          return false;
        if (statusFilter === "done" && o.status !== "done") return false;

        // 3. Category filter
        if (categoryFilter !== "ALL" && o.cardCategory !== categoryFilter) {
          return false;
        }

        // 4. File filter
        if (fileFilter !== "ALL" && o.fileLocation !== fileFilter) {
          return false;
        }

        // 5. Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesClient = o.client?.toLowerCase().includes(q);
          const matchesSn = String(o.sn).includes(q);
          const matchesCat = o.cardCategory?.toLowerCase().includes(q);
          const matchesQty = String(o.totalQty).includes(q) || o.workQtyDisplay?.toLowerCase().includes(q);
          const matchesHolder =
            o.holderName?.toLowerCase().includes(q) ||
            o.holderLanyardStatus?.toLowerCase().includes(q);
          const matchesRemark = o.remarks?.toLowerCase().includes(q);
          const matchesFile = o.fileLocation?.toLowerCase().includes(q);
          if (
            !matchesClient &&
            !matchesSn &&
            !matchesCat &&
            !matchesQty &&
            !matchesHolder &&
            !matchesRemark &&
            !matchesFile
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => (b.sn || 0) - (a.sn || 0)); // LATEST ON TOP!
  }, [orders, viewTab, statusFilter, categoryFilter, fileFilter, searchQuery]);

  // Ingestion Handler: Strictly separate orders for Student vs Staff
  const handleIngestOrder = () => {
    if (!newClient.trim()) {
      toastError("Required Field", "Please enter a School Name / Client Title.");
      return;
    }

    const computedTotal = parseIDCQuantity(newQtyStr) || 100;

    let title = newClient.trim();
    if (newCategory === "Staff" && !title.toLowerCase().includes("staff")) {
      title = `${title} (Staff)`;
    }

    addOrder({
      sn: nextSN,
      date: getFormattedDateToday(),
      client: title,
      cardCategory: newCategory,
      workQtyDisplay: `${computedTotal} ${newCategory.toLowerCase()}`,
      totalQty: computedTotal,
      designDone: false, // Strict Step 1: Starts pending
      sentForPrint: false,
      printOperator: "Kamal Sir",
      fileLocation: "doc",
      status: "kamal",
      holderName: newHolderName.trim() || "DST-V",
      holderLanyardStatus: newHolderName.trim() || "DST-V",
      remarks: newRemark.trim(),
    });

    setNewClient("");
    setNewQtyStr("");
    setNewRemark("");
    toastSuccess(
      "Batch Ingested",
      `Added #${nextSN}: ${title} [${newCategory}] (${computedTotal.toLocaleString()} cards) • Step 1 Design Pending.`
    );
  };

  // Step Action: Mark Dispatched (moves from Active Queue to Completed!)
  const handleMarkDispatched = (order: IDCardOrderEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    updateOrderStatus(order.id, "done");
    toastSuccess(
      "Batch Dispatched",
      `Order #${order.sn}: ${formatClientTitle(order.client)} completed & moved to Completed tab.`
    );
  };

  // Re-open Completed Order
  const handleReopenOrder = (order: IDCardOrderEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    updateOrderStatus(order.id, "ready");
    toastSuccess("Order Re-opened", `Order #${order.sn} returned to Active Queue as Printed (Ready).`);
  };

  // Step 1: Toggle Design OK / Pending
  const handleToggleDesign = (order: IDCardOrderEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const willBeDone = !order.designDone;
    toggleDesignDone(order.id);
    if (willBeDone) {
      toastSuccess("Design Approved", `Order #${order.sn}: Step 1 (Design OK) approved ✓ (Unlocked Step 2: Send to Print).`);
    } else {
      toastSuccess("Design Pending", `Order #${order.sn}: Step 1 reset to Pending. Step 2 print locked.`);
    }
  };

  // Step 2: 1-Click Print Verification (Strict Stage-Gate: Step 1 Design must be OK!)
  const handleTogglePrinted = (order: IDCardOrderEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!order.designDone) {
      toastError(
        "Step 1 Required",
        `Order #${order.sn}: Step 1 (Design OK) must be checked before sending to print.`
      );
      return;
    }
    if (order.status === "kamal") {
      updateOrderStatus(order.id, "ready");
      toastSuccess("Printed OK", `Order #${order.sn}: Printing verified ✓ (Unlocked Dispatch).`);
    } else if (order.status === "ready" || order.status === "ready (1 pending he)") {
      updateOrderStatus(order.id, "kamal");
      toastSuccess("Print Reset", `Order #${order.sn}: Returned to In Printing.`);
    }
  };

  // Quick navigation to Lanyard Hub
  const handleJumpToLanyard = () => {
    window.dispatchEvent(
      new CustomEvent("officefloww:navigate", {
        detail: { section: "lanyard_orders" },
      })
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px 20px",
        backgroundColor: "#080b12",
        minHeight: "100vh",
        color: "#f8fafc",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 1. EXECUTIVE 5-CARD KPI METRICS & INVENTORY DECK                          */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Card 1: Active Batches */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Active Batches
            </span>
            <Icon name="credit-card" size={14} color="#94a3b8" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "#ffffff",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {metrics.activeCount}{" "}
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>batches</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
            {metrics.activePieces.toLocaleString()} cards in production
          </div>
        </div>

        {/* Card 2: Blank PVC Card Stock */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Blank PVC Cards
            </span>
            <Icon name="layers" size={14} color="#94a3b8" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "#f1f5f9",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {pvcCardItem.availableStock.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>cards</span>
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
            Kamal Sir Desk &bull; ~{(pvcCardItem.reservedStock ?? 2473).toLocaleString()} reserved
          </div>
        </div>

        {/* Card 3: YMCKO Ribbon Consumables */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              YMCKO Ribbons
            </span>
            <Icon name="package" size={14} color="#94a3b8" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "#f1f5f9",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {ymckoItem.availableStock}{" "}
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>rolls</span>
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
            Printing Desk Consumables
          </div>
        </div>

        {/* Card 4: Printed (Ready) */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Printed (Ready)
            </span>
            <Icon name="printer" size={14} color="#94a3b8" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "#f1f5f9",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {metrics.readyPieces.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>cards</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            {metrics.readyCount} batches ready for dispatch
          </div>
        </div>

        {/* Card 5: Completed */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Completed
            </span>
            <Icon name="check-circle" size={14} color="#94a3b8" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "#f1f5f9",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {metrics.donePieces.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>cards</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            {metrics.doneCount} batches completed ({metrics.donePercentage}%)
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 2. ORDER INTAKE DOCK (Top: Title & Qty | Bottom: Category, Format & Stock)  */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          padding: "16px 18px",
          borderRadius: "8px",
          backgroundColor: "#0d1322",
          border: "1px solid rgba(255, 255, 255, 0.09)",
          boxShadow: "0 2px 14px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Top Row: Next SN Badge + School/Client Input + Qty Input + Ingest Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
          }}
        >
          <div
            style={{
              height: "38px",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "0 12px",
              borderRadius: "5px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              color: "#f1f5f9",
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#94a3b8",
              }}
            />
            #{nextSN}
          </div>

          <input
            type="text"
            placeholder="School Name / Client Title (e.g. DPS Bhopal, St. Xavier High School)"
            value={newClient}
            onChange={(e) => setNewClient(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
            style={{
              flex: 1,
              height: "38px",
              padding: "0 14px",
              backgroundColor: "#07090e",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "5px",
              color: "#ffffff",
              fontSize: "13px",
              outline: "none",
              transition: "border-color 0.12s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
            }}
          />

          <input
            type="text"
            placeholder="Qty (e.g. 500)"
            value={newQtyStr}
            onChange={(e) => setNewQtyStr(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
            style={{
              width: "160px",
              height: "38px",
              padding: "0 12px",
              backgroundColor: "#07090e",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "5px",
              color: "#ffffff",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              textAlign: "center",
              outline: "none",
              transition: "border-color 0.12s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
            }}
          />

          <button
            type="button"
            onClick={handleIngestOrder}
            style={{
              height: "38px",
              padding: "0 22px",
              borderRadius: "5px",
              backgroundColor: "#2563eb",
              border: "none",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              transition: "all 0.12s ease",
              boxShadow: "0 1px 6px rgba(37, 99, 235, 0.3)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
          >
            <Icon name="plus" size={14} />
            <span>Ingest Batch</span>
          </button>
        </div>

        {/* Bottom Row: Card Category + Single Format (No PDF) + Lanyard Match & Live Stock */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "18px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255, 255, 255, 0.07)",
            flexWrap: "wrap",
          }}
        >
          {/* 1. Card Category Selector (Separate Order Counts for Student vs Staff) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Card Category
            </span>
            <div
              style={{
                display: "flex",
                backgroundColor: "#07090e",
                borderRadius: "5px",
                padding: "2px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                height: "32px",
                boxSizing: "border-box",
                alignItems: "center",
                gap: "2px",
              }}
            >
              {(["Student", "Staff", "Other"] as const).map((cat) => {
                const isSelected = newCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    style={{
                      height: "26px",
                      padding: "0 14px",
                      borderRadius: "3px",
                      border: "none",
                      backgroundColor: isSelected ? "#2563eb" : "transparent",
                      color: isSelected ? "#ffffff" : "#94a3b8",
                      fontSize: "12px",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                        e.currentTarget.style.color = "#f1f5f9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#94a3b8";
                      }
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Card Holder (Optional) - Holder Name Only */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Card Holder (Optional)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="text"
                placeholder="e.g. DST-V, Cards Only, DST-H, CCH..."
                value={newHolderName}
                onChange={(e) => setNewHolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
                style={{
                  width: "150px",
                  height: "32px",
                  padding: "0 10px",
                  backgroundColor: "#07090e",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "4px",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                }}
              />
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {[
                  { key: "DST-V", label: "DST-V" },
                  { key: "DST-H", label: "DST-H" },
                  { key: "Cards Only", label: "Cards Only" },
                  { key: "CCH", label: "CCH" },
                  { key: "PV", label: "PV" },
                  { key: "PH", label: "PH" },
                ].map(({ key, label }) => {
                  const isActive = newHolderName.toLowerCase() === key.toLowerCase();
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewHolderName(key)}
                      style={{
                        height: "30px",
                        padding: "0 10px",
                        borderRadius: "4px",
                        border: isActive
                          ? "1px solid #3b82f6"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                        backgroundColor: isActive ? "#2563eb" : "#07090e",
                        color: isActive ? "#ffffff" : "#94a3b8",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.12s ease",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                          e.currentTarget.style.color = "#f1f5f9";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "#07090e";
                          e.currentTarget.style.color = "#94a3b8";
                        }
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Live Blank PVC Stock Status */}
          <div
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "0 12px",
              height: "32px",
              borderRadius: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontSize: "11.5px",
              color: "#94a3b8",
              whiteSpace: "nowrap",
            }}
          >
            <Icon name="layers" size={13} color="#38bdf8" />
            <span>
              Blank PVC: {pvcCardItem.availableStock.toLocaleString()} in stock &bull; {parsedIntakeQty} req
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 3. UNIFIED TOOLBAR: SEGMENTED VIEW TABS, SEARCH, FILTERS                   */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
          padding: "8px 12px",
          borderRadius: "8px",
          backgroundColor: "#0e131f",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Left: Segmented View Tabs (Active vs Completed vs All) */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            type="button"
            onClick={() => {
              setViewTab("ACTIVE");
              setStatusFilter("ALL");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "5px",
              backgroundColor: viewTab === "ACTIVE" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              border: viewTab === "ACTIVE" ? "1px solid rgba(56, 189, 248, 0.35)" : "1px solid transparent",
              color: viewTab === "ACTIVE" ? "#38bdf8" : "#94a3b8",
              fontSize: "12px",
              fontWeight: viewTab === "ACTIVE" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            <span>Active Queue</span>
            <span
              style={{
                fontSize: "10.5px",
                fontFamily: "var(--font-mono)",
                padding: "1px 5px",
                borderRadius: "8px",
                backgroundColor: viewTab === "ACTIVE" ? "#38bdf8" : "rgba(255, 255, 255, 0.06)",
                color: viewTab === "ACTIVE" ? "#080b12" : "#94a3b8",
                fontWeight: 700,
              }}
            >
              {metrics.activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewTab("COMPLETED");
              setStatusFilter("ALL");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "5px",
              backgroundColor: viewTab === "COMPLETED" ? "rgba(34, 197, 94, 0.15)" : "transparent",
              border: viewTab === "COMPLETED" ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid transparent",
              color: viewTab === "COMPLETED" ? "#4ade80" : "#94a3b8",
              fontSize: "12px",
              fontWeight: viewTab === "COMPLETED" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            <span>Completed</span>
            <span
              style={{
                fontSize: "10.5px",
                fontFamily: "var(--font-mono)",
                padding: "1px 5px",
                borderRadius: "8px",
                backgroundColor: viewTab === "COMPLETED" ? "#22c55e" : "rgba(255, 255, 255, 0.06)",
                color: viewTab === "COMPLETED" ? "#080b12" : "#94a3b8",
                fontWeight: 700,
              }}
            >
              {metrics.doneCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewTab("ALL");
              setStatusFilter("ALL");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "5px",
              backgroundColor: viewTab === "ALL" ? "rgba(255, 255, 255, 0.1)" : "transparent",
              border: viewTab === "ALL" ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid transparent",
              color: viewTab === "ALL" ? "#fff" : "#94a3b8",
              fontSize: "12px",
              fontWeight: viewTab === "ALL" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            <span>All Records</span>
            <span
              style={{
                fontSize: "10.5px",
                fontFamily: "var(--font-mono)",
                padding: "1px 5px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                color: "#94a3b8",
                fontWeight: 700,
              }}
            >
              {metrics.totalOrders}
            </span>
          </button>
        </div>

        {/* Right: Category, Stage Filters & Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Card Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              height: "30px",
              padding: "0 8px",
              backgroundColor: "#07090e",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "5px",
              color: "#cbd5e1",
              fontSize: "11.5px",
              outline: "none",
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="Student">Students Only</option>
            <option value="Staff">Staff Only</option>
            <option value="Other">Other</option>
          </select>

          {/* Stage Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              height: "30px",
              padding: "0 8px",
              backgroundColor: "#07090e",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "5px",
              color: "#cbd5e1",
              fontSize: "11.5px",
              outline: "none",
            }}
          >
            <option value="ALL">All Stages</option>
            <option value="kamal">With Kamal Sir</option>
            <option value="ready">Printed (Ready)</option>
            <option value="done">Completed & Dispatched</option>
          </select>

          {/* Search Input */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                opacity: 0.6,
              }}
            >
              <Icon name="search" size={11} color="#94a3b8" />
            </div>
            <input
              type="text"
              placeholder="Search school / SN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "180px",
                height: "30px",
                padding: "0 8px 0 26px",
                backgroundColor: "#07090e",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "5px",
                color: "#f8fafc",
                fontSize: "11.5px",
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 4. ENTERPRISE PRODUCTION TABLE (LATEST ON TOP!)                           */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "#0e131f",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "12.5px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <th
                  style={{
                    padding: "13px 14px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "80px",
                  }}
                >
                  SN
                </th>
                <th
                  style={{
                    padding: "13px 14px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "95px",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    padding: "13px 20px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    minWidth: "260px",
                    width: "28%",
                  }}
                >
                  Order / Client Title
                </th>
                <th
                  style={{
                    padding: "13px 20px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "105px",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    padding: "13px 16px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "160px",
                  }}
                >
                  1. Design
                </th>
                <th
                  style={{
                    padding: "13px 16px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "170px",
                  }}
                >
                  2. Send to Print
                </th>
                <th
                  style={{
                    padding: "13px 16px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "140px",
                  }}
                  title="Format of data given to Kamal Sir for printing (DOC / EXCEL / HARD COPY)"
                >
                  Format Given
                </th>
                <th
                  style={{
                    padding: "13px 16px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "135px",
                  }}
                >
                  Holder
                </th>
                <th
                  style={{
                    padding: "13px 20px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "185px",
                  }}
                >
                  Status / Dispatch
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: "40px 16px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "12.5px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <Icon name="package" size={28} color="#475569" />
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8" }}>
                        {viewTab === "ACTIVE" ? "Active queue is clear" : "No orders found"}
                      </div>
                      <div style={{ fontSize: "11.5px" }}>
                        {viewTab === "ACTIVE"
                          ? "Switch to the 'Completed' tab to review finished batches."
                          : "Try adjusting filters or search query."}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => {
                  const isDone = o.status === "done";
                  const isReady = o.status === "ready" || o.status === "ready (1 pending he)";

                  return (
                    <tr
                      key={o.id}
                      style={{
                        height: "52px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        backgroundColor: isDone
                          ? "rgba(255, 255, 255, 0.015)"
                          : idx % 2 === 0
                          ? "transparent"
                          : "rgba(255, 255, 255, 0.012)",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = isDone
                          ? "rgba(255, 255, 255, 0.015)"
                          : idx % 2 === 0
                          ? "transparent"
                          : "rgba(255, 255, 255, 0.012)")
                      }
                    >
                      {/* 1. SN */}
                      <td
                        style={{
                          padding: "13px 14px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#94a3b8",
                        }}
                      >
                        #{o.sn}
                      </td>

                      {/* 2. Date */}
                      <td
                        style={{
                          padding: "13px 14px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "12.5px",
                          color: "#94a3b8",
                        }}
                      >
                        {o.date}
                      </td>

                      {/* 3. Order / Client Title & Inline Category Tag */}
                      <td
                        style={{
                          padding: "13px 20px",
                          cursor: "pointer",
                        }}
                        onDoubleClick={(e) => handleStartEdit(o.id, "client", o.client, e)}
                        title="Double-click to edit client"
                      >
                        {editingCell?.id === o.id && editingCell?.field === "client" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {renderCategoryBadge(o.cardCategory || "Student")}
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              style={{
                                width: "100%",
                                height: "26px",
                                padding: "0 8px",
                                backgroundColor: "#07090e",
                                border: "1px solid #3b82f6",
                                borderRadius: "4px",
                                color: "#fff",
                                fontSize: "13px",
                                outline: "none",
                              }}
                            />
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextCat: IDCardCategory =
                                  o.cardCategory === "Student" ? "Staff" : o.cardCategory === "Staff" ? "Other" : "Student";
                                updateOrder(o.id, { cardCategory: nextCat });
                                toastSuccess("Category Updated", `Order #${o.sn}: Category set to ${nextCat}.`);
                              }}
                              title="Click to toggle Student / Staff / Other"
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                                display: "inline-flex",
                              }}
                            >
                              {renderCategoryBadge(o.cardCategory || "Student")}
                            </button>

                            <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                              <span
                                style={{
                                  fontSize: "13.5px",
                                  fontWeight: 600,
                                  color: isDone ? "#94a3b8" : "#f1f5f9",
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                {formatClientTitle(o.client)}
                              </span>
                              {o.remarks && o.remarks !== "—" && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "#64748b",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {o.remarks}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 4. Total Quantity */}
                      <td
                        style={{
                          padding: "13px 20px",
                          textAlign: "right",
                          cursor: "pointer",
                        }}
                        onDoubleClick={(e) => handleStartEdit(o.id, "totalQty", o.totalQty, e)}
                        title="Double-click to edit quantity"
                      >
                        {editingCell?.id === o.id && editingCell?.field === "totalQty" ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            style={{
                              width: "65px",
                              height: "24px",
                              padding: "0 6px",
                              backgroundColor: "#07090e",
                              border: "1px solid #3b82f6",
                              borderRadius: "4px",
                              color: "#fff",
                              fontSize: "13px",
                              textAlign: "right",
                              fontFamily: "var(--font-mono)",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "14px",
                              fontWeight: 700,
                              color: isDone ? "#94a3b8" : "#ffffff",
                            }}
                          >
                            {o.totalQty.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* 5. 1. Design (Artwork Verification & OK) */}
                      <td style={{ padding: "13px 16px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleDesign(o, e)}
                          title="Click to toggle Design status"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "5px",
                            backgroundColor: o.designDone ? "rgba(34, 197, 94, 0.12)" : "rgba(255, 255, 255, 0.04)",
                            border: o.designDone ? "1px solid rgba(34, 197, 94, 0.32)" : "1px solid rgba(255, 255, 255, 0.14)",
                            color: o.designDone ? "#4ade80" : "#cbd5e1",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            transition: "all 0.12s ease",
                          }}
                        >
                          <Icon name={o.designDone ? "check" : "clock"} size={11} color={o.designDone ? "#22c55e" : "#94a3b8"} />
                          <span>{o.designDone ? "Design OK ✓" : "Design Pending"}</span>
                        </button>
                      </td>

                      {/* 6. 2. Send to Print (Kamal Sir Desk) */}
                      <td style={{ padding: "13px 16px", textAlign: "center" }}>
                        {isDone ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
                              borderRadius: "5px",
                              backgroundColor: "rgba(34, 197, 94, 0.12)",
                              border: "1px solid rgba(34, 197, 94, 0.32)",
                              color: "#4ade80",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            <Icon name="check" size={11} color="#22c55e" />
                            <span>Printed ✓</span>
                          </span>
                        ) : !o.designDone ? (
                          <button
                            type="button"
                            onClick={(e) => handleTogglePrinted(o, e)}
                            title="Step 1 (Design OK) must be checked before sending to print"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
                              borderRadius: "5px",
                              backgroundColor: "rgba(255, 255, 255, 0.02)",
                              border: "1px dashed rgba(255, 255, 255, 0.12)",
                              color: "#64748b",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "not-allowed",
                              opacity: 0.55,
                              whiteSpace: "nowrap",
                              transition: "all 0.12s ease",
                            }}
                          >
                            <Icon name="lock" size={11} color="#64748b" />
                            <span>With Kamal ⚡</span>
                          </button>
                        ) : isReady ? (
                          <button
                            type="button"
                            onClick={(e) => handleTogglePrinted(o, e)}
                            title="Click to reset to With Kamal"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
                              borderRadius: "5px",
                              backgroundColor: "rgba(34, 197, 94, 0.12)",
                              border: "1px solid rgba(34, 197, 94, 0.32)",
                              color: "#4ade80",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              transition: "all 0.12s ease",
                            }}
                          >
                            <Icon name="check" size={11} color="#22c55e" />
                            <span>Printed ✓</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleTogglePrinted(o, e)}
                            title="Click to mark printing complete (Unlocks Dispatch)"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 11px",
                              borderRadius: "5px",
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.16)",
                              color: "#f1f5f9",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              transition: "all 0.12s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
                            }}
                          >
                            <Icon name="printer" size={11} color="#cbd5e1" />
                            <span>With Kamal ⚡</span>
                          </button>
                        )}
                      </td>

                      {/* 7. Format Given (Format handed to Kamal Sir: DOC / EXCEL / HARD COPY) */}
                      <td style={{ padding: "13px 16px", textAlign: "center" }}>
                        <select
                          value={(o.fileLocation || "doc").toLowerCase()}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            const val = e.target.value as IDCardFileFormat;
                            updateOrder(o.id, { fileLocation: val });
                            toastSuccess("Format Updated", `Order #${o.sn}: Data format set to ${val.toUpperCase()}`);
                          }}
                          title="Format of data given to Kamal Sir for printing (DOC / EXCEL / HARD COPY)"
                          style={{
                            height: "26px",
                            padding: "0 8px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            color: "#cbd5e1",
                            fontSize: "11px",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            letterSpacing: "0.04em",
                            cursor: "pointer",
                            outline: "none",
                            textAlign: "center",
                          }}
                        >
                          <option value="doc" style={{ backgroundColor: "#0e131f", color: "#f1f5f9" }}>DOC</option>
                          <option value="excel" style={{ backgroundColor: "#0e131f", color: "#f1f5f9" }}>EXCEL</option>
                          <option value="hard copy" style={{ backgroundColor: "#0e131f", color: "#f1f5f9" }}>HARD COPY</option>
                        </select>
                      </td>

                      {/* 8. Card Holder (Strictly Holder Name Only: DST-V, DST-H, Cards Only, CCH, PV, PH) */}
                      <td
                        style={{
                          padding: "13px 16px",
                          textAlign: "center",
                          cursor: "pointer",
                        }}
                        onDoubleClick={(e) =>
                          handleStartEdit(o.id, "holderName", o.holderName || resolveHolderName(o), e)
                        }
                        title="Double-click to edit card holder"
                      >
                        {editingCell?.id === o.id && (editingCell?.field === "holderName" || editingCell?.field === "holderLanyardStatus") ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            style={{
                              width: "100%",
                              height: "26px",
                              padding: "0 8px",
                              backgroundColor: "#07090e",
                              border: "1px solid #3b82f6",
                              borderRadius: "4px",
                              color: "#fff",
                              fontSize: "12.5px",
                              outline: "none",
                            }}
                          />
                        ) : (
                          renderHolderBadge(o.holderName || resolveHolderName(o))
                        )}
                      </td>

                      {/* 9. Status / Dispatch */}
                      <td style={{ padding: "13px 20px", textAlign: "center" }}>
                        {isDone ? (
                          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "4px 10px",
                                borderRadius: "5px",
                                backgroundColor: "rgba(34, 197, 94, 0.1)",
                                border: "1px solid rgba(34, 197, 94, 0.25)",
                                color: "#4ade80",
                                fontSize: "12px",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Icon name="check-circle" size={12} color="#22c55e" />
                              <span>Dispatched</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleReopenOrder(o, e)}
                              title="Re-open order to Active Queue"
                              style={{
                                height: "26px",
                                width: "26px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                borderRadius: "4px",
                                color: "#94a3b8",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#f8fafc")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                            >
                              <Icon name="refresh-cw" size={11} color="#94a3b8" />
                            </button>
                          </div>
                        ) : isReady ? (
                          <button
                            type="button"
                            onClick={(e) => handleMarkDispatched(o, e)}
                            style={{
                              height: "30px",
                              padding: "0 14px",
                              borderRadius: "5px",
                              backgroundColor: "#16a34a",
                              border: "none",
                              color: "#ffffff",
                              fontSize: "12.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              whiteSpace: "nowrap",
                              transition: "all 0.12s ease",
                              boxShadow: "0 1px 6px rgba(22, 163, 74, 0.35)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#15803d";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#16a34a";
                            }}
                          >
                            <Icon name="check-circle" size={13} color="currentColor" />
                            <span>Mark Dispatched ✓</span>
                          </button>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 8px",
                              color: "#64748b",
                              fontSize: "12px",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Icon name="clock" size={11} color="#64748b" />
                            <span>In Printing</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Bar */}
        <div
          style={{
            padding: "8px 14px",
            backgroundColor: "rgba(255, 255, 255, 0.015)",
            borderTop: "1px solid rgba(255, 255, 255, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11.5px",
            color: "#64748b",
          }}
        >
          <div>
            Showing {filteredOrders.length} of {orders.length} batches ({metrics.totalPieces.toLocaleString()} total cards)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span>• Staff and student batches are tracked as separate order counts</span>
            <span>• Single format: DOC, Excel, or Hard Copy (PDF excluded)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
