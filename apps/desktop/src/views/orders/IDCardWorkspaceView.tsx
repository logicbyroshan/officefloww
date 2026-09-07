import React, { useState, useMemo, useRef, useEffect } from "react";
import { Icon } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";
import {
  useIDCardStore,
  IDCardOrderEntry,
  IDCardCategory,
  IDCardFileFormat,
  parseIDCQuantity,
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

// Category Badge (Student vs Staff vs Other)
function renderCategoryBadge(category: IDCardCategory) {
  if (category === "Staff") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2.5px 8px",
          borderRadius: "4px",
          backgroundColor: "rgba(168, 85, 247, 0.12)",
          border: "1px solid rgba(168, 85, 247, 0.28)",
          color: "#c084fc",
          fontSize: "11.5px",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#c084fc" }} />
        Staff
      </span>
    );
  }

  if (category === "Other") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2.5px 8px",
          borderRadius: "4px",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          color: "#cbd5e1",
          fontSize: "11.5px",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        Other
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2.5px 8px",
        borderRadius: "4px",
        backgroundColor: "rgba(56, 189, 248, 0.1)",
        border: "1px solid rgba(56, 189, 248, 0.25)",
        color: "#38bdf8",
        fontSize: "11.5px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#38bdf8" }} />
      Student
    </span>
  );
}

// Clean formatting for Lanyard & Holder Status
function renderLanyardStatus(status?: string) {
  if (!status || !status.trim() || status === "—") {
    return (
      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
        Cards Only
      </span>
    );
  }
  const s = status.toLowerCase();
  if (s.includes("available") || s === "available he") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 8px",
          borderRadius: "4px",
          backgroundColor: "rgba(56, 189, 248, 0.08)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          color: "#38bdf8",
          fontSize: "11.5px",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        <Icon name="tag" size={11} color="#38bdf8" />
        <span>Lanyard Ready ✓</span>
      </span>
    );
  }
  if (s.includes("only") || s.includes("card")) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 8px",
          borderRadius: "4px",
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          color: "#94a3b8",
          fontSize: "11.5px",
          fontWeight: 600,
        }}
      >
        <span>Cards Only</span>
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        borderRadius: "4px",
        backgroundColor: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(245, 158, 11, 0.22)",
        color: "#fbbf24",
        fontSize: "11.5px",
        fontWeight: 600,
      }}
    >
      <span>{status}</span>
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
  const [newFileLocation, setNewFileLocation] = useState<IDCardFileFormat>("doc");
  const [newHolderLanyard, setNewHolderLanyard] = useState("available he");
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
          const matchesLanyard = o.holderLanyardStatus?.toLowerCase().includes(q);
          const matchesRemark = o.remarks?.toLowerCase().includes(q);
          const matchesFile = o.fileLocation?.toLowerCase().includes(q);
          if (
            !matchesClient &&
            !matchesSn &&
            !matchesCat &&
            !matchesQty &&
            !matchesLanyard &&
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
      sentForPrint: true,
      printOperator: "Kamal Sir",
      fileLocation: newFileLocation,
      status: "kamal",
      holderLanyardStatus: newHolderLanyard.trim() || "available he",
      remarks: newRemark.trim(),
    });

    setNewClient("");
    setNewQtyStr("");
    setNewRemark("");
    toastSuccess(
      "Batch Ingested",
      `Added #${nextSN}: ${title} [${newCategory}] (${computedTotal.toLocaleString()} cards) • Sent to Kamal Sir.`
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

  // 1-Click Thermal Printing Verification (With Kamal <-> Printed)
  const handleTogglePrinted = (order: IDCardOrderEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (order.status === "kamal") {
      updateOrderStatus(order.id, "ready");
      toastSuccess("Printed OK", `Order #${order.sn}: Thermal printing verified ✓ (Unlocked Dispatch).`);
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
            <Icon name="credit-card" size={14} color="#38bdf8" />
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
            {metrics.activeCount}{" "}
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>batches</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
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
            <Icon name="layers" size={14} color="#34d399" />
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
            <Icon name="package" size={14} color="#c084fc" />
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
            Thermal Printing Consumables
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
            <Icon name="printer" size={14} color="#fbbf24" />
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
            <Icon name="check-circle" size={14} color="#34d399" />
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
          gap: "16px",
          padding: "18px 20px",
          borderRadius: "10px",
          backgroundColor: "#0d1322",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Top Row: Next SN Badge + School/Client Input + Qty Input + Ingest Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
          }}
        >
          <div
            style={{
              height: "40px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 14px",
              borderRadius: "6px",
              backgroundColor: "rgba(56, 189, 248, 0.08)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              color: "#38bdf8",
              fontSize: "13.5px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: "#38bdf8",
                boxShadow: "0 0 6px #38bdf8",
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
              height: "40px",
              padding: "0 15px",
              backgroundColor: "#07090e",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              borderRadius: "6px",
              color: "#ffffff",
              fontSize: "13.5px",
              outline: "none",
              transition: "all 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.25)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          <input
            type="text"
            placeholder="Quantity (e.g. 500)"
            value={newQtyStr}
            onChange={(e) => setNewQtyStr(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
            style={{
              width: "180px",
              height: "40px",
              padding: "0 14px",
              backgroundColor: "#07090e",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              borderRadius: "6px",
              color: "#ffffff",
              fontSize: "13.5px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              textAlign: "center",
              outline: "none",
              transition: "all 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.25)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          <button
            type="button"
            onClick={handleIngestOrder}
            style={{
              height: "40px",
              padding: "0 24px",
              borderRadius: "6px",
              backgroundColor: "#2563eb",
              border: "none",
              color: "#ffffff",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              boxShadow: "0 2px 10px rgba(37, 99, 235, 0.4)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
          >
            <Icon name="plus" size={16} />
            <span>Ingest Batch</span>
          </button>
        </div>

        {/* Bottom Row: Card Category + Single Format (No PDF) + Lanyard Match & Live Stock */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "24px",
            paddingTop: "14px",
            borderTop: "1px solid rgba(255, 255, 255, 0.07)",
            flexWrap: "wrap",
          }}
        >
          {/* 1. Card Category Selector (Separate Order Counts for Student vs Staff) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Card Category
            </span>
            <div
              style={{
                display: "flex",
                backgroundColor: "#07090e",
                borderRadius: "6px",
                padding: "3px",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                height: "36px",
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
                      height: "28px",
                      padding: "0 16px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: isSelected ? "#2563eb" : "transparent",
                      color: isSelected ? "#ffffff" : "#94a3b8",
                      fontSize: "12.5px",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                      boxShadow: isSelected ? "0 1px 4px rgba(0, 0, 0, 0.35)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.07)";
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

          {/* 2. File Format Selector (Single format only, Strictly NO PDF) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              File Format
            </span>
            <div
              style={{
                display: "flex",
                backgroundColor: "#07090e",
                borderRadius: "6px",
                padding: "3px",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                height: "36px",
                boxSizing: "border-box",
                alignItems: "center",
                gap: "2px",
              }}
            >
              {(["doc", "excel", "hard copy"] as const).map((fmt) => {
                const isSelected = newFileLocation === fmt;
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setNewFileLocation(fmt)}
                    style={{
                      height: "28px",
                      padding: "0 16px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: isSelected ? "#2563eb" : "transparent",
                      color: isSelected ? "#ffffff" : "#94a3b8",
                      fontSize: "12px",
                      fontWeight: isSelected ? 700 : 500,
                      fontFamily: "var(--font-mono)",
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      boxShadow: isSelected ? "0 1px 4px rgba(0, 0, 0, 0.35)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.07)";
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
                    {fmt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Lanyard / Holder Match */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Lanyard & Holder Match
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="text"
                placeholder="e.g. available he"
                value={newHolderLanyard}
                onChange={(e) => setNewHolderLanyard(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
                style={{
                  width: "135px",
                  height: "36px",
                  padding: "0 12px",
                  backgroundColor: "#07090e",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  outline: "none",
                  transition: "all 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.25)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                {[
                  { key: "available he", label: "Available he" },
                  { key: "only card hi", label: "Cards Only" },
                  { key: "with holder", label: "With Holder" },
                ].map(({ key, label }) => {
                  const isActive = newHolderLanyard.toLowerCase() === key.toLowerCase();
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewHolderLanyard(isActive ? "" : key)}
                      style={{
                        height: "36px",
                        padding: "0 12px",
                        borderRadius: "6px",
                        border: isActive
                          ? "1px solid #3b82f6"
                          : "1px solid rgba(255, 255, 255, 0.12)",
                        backgroundColor: isActive ? "#2563eb" : "#07090e",
                        color: isActive ? "#ffffff" : "#94a3b8",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.12s ease",
                        whiteSpace: "nowrap",
                        boxShadow: isActive ? "0 1px 4px rgba(37, 99, 235, 0.35)" : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
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

          {/* 4. Remarks (Optional) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Remarks (Optional)
            </span>
            <input
              type="text"
              placeholder="e.g. 1 student pending"
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
              style={{
                width: "160px",
                height: "36px",
                padding: "0 12px",
                backgroundColor: "#07090e",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "12.5px",
                outline: "none",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.25)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* 5. Live Blank PVC Stock Status */}
          <div
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 14px",
              height: "36px",
              borderRadius: "6px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              fontSize: "12px",
              color: intakeStockCheck.statusColor,
              whiteSpace: "nowrap",
            }}
          >
            <Icon name="layers" size={14} color={intakeStockCheck.statusColor} />
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
          gap: "10px",
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
              border: "none",
              backgroundColor: viewTab === "ACTIVE" ? "rgba(255, 255, 255, 0.12)" : "transparent",
              color: viewTab === "ACTIVE" ? "#ffffff" : "#94a3b8",
              fontSize: "12px",
              fontWeight: viewTab === "ACTIVE" ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.12s ease",
            }}
          >
            <span>Active Queue</span>
            <span
              style={{
                fontSize: "10.5px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: viewTab === "ACTIVE" ? "#38bdf8" : "#64748b",
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
              border: "none",
              backgroundColor: viewTab === "COMPLETED" ? "rgba(255, 255, 255, 0.12)" : "transparent",
              color: viewTab === "COMPLETED" ? "#ffffff" : "#94a3b8",
              fontSize: "12px",
              fontWeight: viewTab === "COMPLETED" ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.12s ease",
            }}
          >
            <span>Completed</span>
            <span
              style={{
                fontSize: "10.5px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: viewTab === "COMPLETED" ? "#34d399" : "#64748b",
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
              border: "none",
              backgroundColor: viewTab === "ALL" ? "rgba(255, 255, 255, 0.12)" : "transparent",
              color: viewTab === "ALL" ? "#ffffff" : "#94a3b8",
              fontSize: "12px",
              fontWeight: viewTab === "ALL" ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.12s ease",
            }}
          >
            <span>All Records</span>
            <span
              style={{
                fontSize: "10.5px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: "#64748b",
              }}
            >
              {metrics.totalOrders}
            </span>
          </button>
        </div>

        {/* Right: Search, Filters & Quick Link to Lanyard Hub */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Card Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              height: "30px",
              padding: "0 10px",
              backgroundColor: "#07090e",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "5px",
              color: "#94a3b8",
              fontSize: "12px",
              outline: "none",
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="Student">Students Only</option>
            <option value="Staff">Staff Only</option>
            <option value="Other">Other</option>
          </select>

          {/* File Format Filter (No PDF, Single formats only) */}
          <select
            value={fileFilter}
            onChange={(e) => setFileFilter(e.target.value)}
            style={{
              height: "30px",
              padding: "0 10px",
              backgroundColor: "#07090e",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "5px",
              color: "#94a3b8",
              fontSize: "12px",
              outline: "none",
            }}
          >
            <option value="ALL">All Formats</option>
            <option value="doc">DOC</option>
            <option value="excel">Excel</option>
            <option value="hard copy">Hard Copy</option>
          </select>

          {/* Stage Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              height: "30px",
              padding: "0 10px",
              backgroundColor: "#07090e",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "5px",
              color: "#94a3b8",
              fontSize: "12px",
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
            <input
              type="text"
              placeholder="Search school / SN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "180px",
                height: "30px",
                padding: "0 10px 0 28px",
                backgroundColor: "#07090e",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "5px",
                color: "#f8fafc",
                fontSize: "12px",
                outline: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "9px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                opacity: 0.6,
              }}
            >
              <Icon name="search" size={12} color="#94a3b8" />
            </div>
          </div>

          {/* Quick link button to Lanyard Hub */}
          <button
            type="button"
            onClick={handleJumpToLanyard}
            style={{
              height: "30px",
              padding: "0 12px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "5px",
              color: "#94a3b8",
              fontSize: "12px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.12s ease",
            }}
            title="Switch to Lanyard Workspace"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.color = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            <Icon name="tag" size={13} color="#38bdf8" />
            <span>Lanyard Hub</span>
          </button>
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
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: "12px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <th
                  style={{
                    padding: "12px 14px",
                    textAlign: "left",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "70px",
                  }}
                >
                  SN
                </th>
                <th
                  style={{
                    padding: "12px 10px",
                    textAlign: "left",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "85px",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    textAlign: "left",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    minWidth: "220px",
                  }}
                >
                  School / Client Title
                </th>
                <th
                  style={{
                    padding: "12px 12px",
                    textAlign: "left",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "110px",
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    textAlign: "right",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "90px",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    padding: "12px 10px",
                    textAlign: "center",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "95px",
                  }}
                >
                  Format
                </th>
                <th
                  style={{
                    padding: "12px 10px",
                    textAlign: "center",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "145px",
                  }}
                >
                  Thermal Printing
                </th>
                <th
                  style={{
                    padding: "12px 12px",
                    textAlign: "left",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "145px",
                  }}
                >
                  Lanyard / Holder
                </th>
                <th
                  style={{
                    padding: "12px 10px",
                    textAlign: "center",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "155px",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    textAlign: "left",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    minWidth: "120px",
                  }}
                >
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      padding: "48px 16px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    No ID card orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => {
                  const isDone = o.status === "done";
                  const isReady = o.status === "ready" || o.status === "ready (1 pending he)";
                  const isKamal = o.status === "kamal";

                  return (
                    <tr
                      key={o.id}
                      style={{
                        height: "46px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.012)",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.03)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.012)")
                      }
                    >
                      {/* 1. SN */}
                      <td
                        style={{
                          padding: "10px 14px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#38bdf8",
                        }}
                      >
                        #{o.sn}
                      </td>

                      {/* 2. Date */}
                      <td
                        style={{
                          padding: "10px 10px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          color: "#94a3b8",
                        }}
                      >
                        {o.date}
                      </td>

                      {/* 3. School / Client Title */}
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#ffffff",
                          cursor: "pointer",
                        }}
                        onDoubleClick={(e) => handleStartEdit(o.id, "client", o.client, e)}
                        title="Double-click to edit client"
                      >
                        {editingCell?.id === o.id && editingCell?.field === "client" ? (
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
                              height: "28px",
                              padding: "0 8px",
                              backgroundColor: "#07090e",
                              border: "1px solid #3b82f6",
                              borderRadius: "4px",
                              color: "#fff",
                              fontSize: "13.5px",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <span>{formatClientTitle(o.client)}</span>
                        )}
                      </td>

                      {/* 4. Card Category (Student vs Staff - Strictly Separate) */}
                      <td
                        style={{
                          padding: "9px 12px",
                          cursor: "pointer",
                        }}
                        onDoubleClick={() => {
                          const nextCat: IDCardCategory =
                            o.cardCategory === "Student" ? "Staff" : o.cardCategory === "Staff" ? "Other" : "Student";
                          updateOrder(o.id, { cardCategory: nextCat });
                          toastSuccess("Category Updated", `Order #${o.sn} is now marked as ${nextCat}.`);
                        }}
                        title="Double-click to toggle Student / Staff"
                      >
                        {renderCategoryBadge(o.cardCategory || "Student")}
                      </td>

                      {/* 5. Total Quantity */}
                      <td
                        style={{
                          padding: "10px 14px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          fontSize: "14.5px",
                          fontWeight: 700,
                          color: "#ffffff",
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
                              width: "70px",
                              height: "26px",
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
                          <span>{o.totalQty.toLocaleString()}</span>
                        )}
                      </td>

                      {/* 6. File Format (Strictly Single format: doc / excel / hard copy, NO PDF) */}
                      <td style={{ padding: "10px 10px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            padding: "2.5px 7px",
                            borderRadius: "4px",
                            backgroundColor:
                              o.fileLocation === "excel"
                                ? "rgba(34, 197, 94, 0.1)"
                                : o.fileLocation === "hard copy"
                                ? "rgba(245, 158, 11, 0.1)"
                                : "rgba(56, 189, 248, 0.1)",
                            border: `1px solid ${
                              o.fileLocation === "excel"
                                ? "rgba(34, 197, 94, 0.25)"
                                : o.fileLocation === "hard copy"
                                ? "rgba(245, 158, 11, 0.25)"
                                : "rgba(56, 189, 248, 0.25)"
                            }`,
                            color:
                              o.fileLocation === "excel"
                                ? "#4ade80"
                                : o.fileLocation === "hard copy"
                                ? "#fbbf24"
                                : "#38bdf8",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {o.fileLocation}
                        </span>
                      </td>

                      {/* 7. Thermal Printing (Kamal Sir) */}
                      <td style={{ padding: "10px 10px", textAlign: "center" }}>
                        {isDone ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 9px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(34, 197, 94, 0.08)",
                              border: "1px solid rgba(34, 197, 94, 0.2)",
                              color: "#4ade80",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            <Icon name="check" size={11} color="#22c55e" />
                            <span>Printed ✓</span>
                          </span>
                        ) : isReady ? (
                          <button
                            type="button"
                            onClick={(e) => handleTogglePrinted(o, e)}
                            title="Click to reset to With Kamal"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "3px 9px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(34, 197, 94, 0.12)",
                              border: "1px solid rgba(34, 197, 94, 0.3)",
                              color: "#4ade80",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Icon name="check" size={11} color="#22c55e" />
                            <span>Printed ✓</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleTogglePrinted(o, e)}
                            title="Click to mark printing complete"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "3px 9px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(56, 189, 248, 0.1)",
                              border: "1px solid rgba(56, 189, 248, 0.28)",
                              color: "#38bdf8",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.18)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.1)")}
                          >
                            <Icon name="printer" size={11} color="#38bdf8" />
                            <span>With Kamal ⚡</span>
                          </button>
                        )}
                      </td>

                      {/* 8. Lanyard / Holder */}
                      <td
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                        }}
                        onDoubleClick={(e) =>
                          handleStartEdit(o.id, "holderLanyardStatus", o.holderLanyardStatus, e)
                        }
                        title="Double-click to edit lanyard status"
                      >
                        {editingCell?.id === o.id && editingCell?.field === "holderLanyardStatus" ? (
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
                              height: "28px",
                              padding: "0 8px",
                              backgroundColor: "#07090e",
                              border: "1px solid #3b82f6",
                              borderRadius: "4px",
                              color: "#38bdf8",
                              fontSize: "12.5px",
                              outline: "none",
                            }}
                          />
                        ) : (
                          renderLanyardStatus(o.holderLanyardStatus)
                        )}
                      </td>

                      {/* 9. Status & Dispatch Action */}
                      <td style={{ padding: "10px 10px", textAlign: "center" }}>
                        {isDone ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3.5px 9px",
                                borderRadius: "4px",
                                backgroundColor: "rgba(34, 197, 94, 0.12)",
                                border: "1px solid rgba(34, 197, 94, 0.3)",
                                color: "#4ade80",
                                fontSize: "11px",
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
                                height: "22px",
                                width: "22px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "rgba(255, 255, 255, 0.04)",
                                border: "1px solid rgba(255, 255, 255, 0.09)",
                                borderRadius: "3px",
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
                              height: "28px",
                              padding: "0 12px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(34, 197, 94, 0.15)",
                              border: "1px solid rgba(34, 197, 94, 0.4)",
                              color: "#4ade80",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              whiteSpace: "nowrap",
                              boxShadow: "0 1px 6px rgba(34, 197, 94, 0.15)",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#15803d";
                              e.currentTarget.style.color = "#ffffff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 0.15)";
                              e.currentTarget.style.color = "#4ade80";
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
                              gap: "4px",
                              padding: "3.5px 8px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              color: "#64748b",
                              fontSize: "11px",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Icon name="clock" size={11} color="#64748b" />
                            <span>In Printing</span>
                          </span>
                        )}
                      </td>

                      {/* 10. Remarks & Jump Link */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <span
                            onDoubleClick={(e) => handleStartEdit(o.id, "remarks", o.remarks, e)}
                            title="Double-click to edit remarks"
                            style={{
                              fontSize: "11.5px",
                              color: o.remarks ? "#cbd5e1" : "#64748b",
                              cursor: "pointer",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "110px",
                            }}
                          >
                            {editingCell?.id === o.id && editingCell?.field === "remarks" ? (
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
                                  height: "24px",
                                  padding: "0 6px",
                                  backgroundColor: "#07090e",
                                  border: "1px solid #3b82f6",
                                  borderRadius: "3px",
                                  color: "#fff",
                                  fontSize: "11.5px",
                                  outline: "none",
                                }}
                              />
                            ) : (
                              o.remarks || "—"
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={handleJumpToLanyard}
                            title="Jump to Lanyard Workspace"
                            style={{
                              padding: "2px 6px",
                              borderRadius: "3px",
                              backgroundColor: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              color: "#94a3b8",
                              fontSize: "10.5px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              flexShrink: 0,
                            }}
                          >
                            <Icon name="tag" size={10} color="#38bdf8" />
                          </button>
                        </div>
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
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
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
