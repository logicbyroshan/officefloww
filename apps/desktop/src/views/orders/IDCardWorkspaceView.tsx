import React, { useState, useMemo, useRef, useEffect } from "react";
import { Icon } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";
import {
  useIDCardStore,
  IDCardOrderEntry,
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

// Structured Student & Staff Breakdown Pills
function renderBreakdownTags(workQtyDisplay: string) {
  if (!workQtyDisplay || !workQtyDisplay.trim()) {
    return <span style={{ color: "#64748b", fontSize: "12px" }}>Standard Batch</span>;
  }
  const str = workQtyDisplay.trim();

  if (str.includes("+")) {
    const parts = str.split("+").map((p) => p.trim());
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
        {parts.map((p, idx) => {
          const isStaff = p.toLowerCase().includes("staff");
          return (
            <span
              key={idx}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "2.5px 7px",
                borderRadius: "4px",
                backgroundColor: isStaff ? "rgba(168, 85, 247, 0.12)" : "rgba(56, 189, 248, 0.12)",
                border: `1px solid ${isStaff ? "rgba(168, 85, 247, 0.3)" : "rgba(56, 189, 248, 0.3)"}`,
                color: isStaff ? "#c084fc" : "#38bdf8",
                whiteSpace: "nowrap",
              }}
            >
              {p}
            </span>
          );
        })}
      </div>
    );
  }

  const isStaff = str.toLowerCase().includes("staff");
  return (
    <span
      style={{
        fontSize: "12px",
        fontWeight: 700,
        padding: "2.5px 8px",
        borderRadius: "4px",
        backgroundColor: isStaff ? "rgba(168, 85, 247, 0.1)" : "rgba(255, 255, 255, 0.05)",
        border: `1px solid ${isStaff ? "rgba(168, 85, 247, 0.25)" : "rgba(255, 255, 255, 0.1)"}`,
        color: isStaff ? "#c084fc" : "#cbd5e1",
        whiteSpace: "nowrap",
      }}
    >
      {str}
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
          backgroundColor: "rgba(56, 189, 248, 0.1)",
          border: "1px solid rgba(56, 189, 248, 0.28)",
          color: "#38bdf8",
          fontSize: "12px",
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
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#94a3b8",
          fontSize: "12px",
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
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        border: "1px solid rgba(245, 158, 11, 0.25)",
        color: "#fbbf24",
        fontSize: "12px",
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
    setOrders,
    addOrder,
    updateOrder,
    cycleStatus,
    updateOrderStatus,
    toggleSentForPrint,
  } = useIDCardStore();

  const { getBlankPVCStats, items: stockItems } = useStockStore();

  // View Queue Mode: "ACTIVE" (Default, hides done), "COMPLETED", or "ALL"
  const [viewTab, setViewTab] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");

  // Filter and search states
  const [statusFilter, setStatusFilter] = useState<"ALL" | "kamal" | "ready" | "done">("ALL");
  const [fileFilter, setFileFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Smart Ingestion Console states
  const [newClient, setNewClient] = useState("");
  const [newQtyStr, setNewQtyStr] = useState("");
  const [newFileLocation, setNewFileLocation] = useState<
    "doc" | "pdf" | "excel" | "doc + pdf" | "excel and doc"
  >("doc");
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

    if (field === "workQtyDisplay") {
      const computed = parseIDCQuantity(val);
      updateOrder(id, { workQtyDisplay: val, totalQty: computed });
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
    if (!orders || orders.length === 0) return 1492;
    return Math.max(...orders.map((o) => o.sn || 0)) + 1;
  }, [orders]);

  // Overall Blank PVC Card Stock status
  const pvcCardItem = useMemo(() => {
    return stockItems.find((it) => it.code === "pvc-cards") || {
      availableStock: 15000,
      reservedStock: 2473,
      minThreshold: 3000,
    };
  }, [stockItems]);

  // Intake prospective qty check
  const parsedIntakeQty = useMemo(() => {
    return parseIDCQuantity(newQtyStr) || 1;
  }, [newQtyStr]);

  const intakeStockCheck = useMemo(() => {
    return getBlankPVCStats(parsedIntakeQty);
  }, [getBlankPVCStats, parsedIntakeQty]);

  // Executive Metric Calculations
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalPieces = orders.reduce((sum, o) => sum + (o.totalQty || 0), 0);

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
      inKamalCount: inKamalOrders.length,
      inKamalPieces,
      readyCount: readyOrders.length,
      readyPieces,
      doneCount: doneOrders.length,
      donePieces,
      donePercentage,
      activeCount: inKamalOrders.length + readyOrders.length,
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

        // 3. File filter
        if (fileFilter !== "ALL" && !o.fileLocation?.toLowerCase().includes(fileFilter.toLowerCase())) {
          return false;
        }

        // 4. Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesClient = o.client?.toLowerCase().includes(q);
          const matchesSn = String(o.sn).includes(q);
          const matchesQty = o.workQtyDisplay?.toLowerCase().includes(q);
          const matchesLanyard = o.holderLanyardStatus?.toLowerCase().includes(q);
          const matchesRemark = o.remarks?.toLowerCase().includes(q);
          const matchesFile = o.fileLocation?.toLowerCase().includes(q);
          if (
            !matchesClient &&
            !matchesSn &&
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
      .sort((a, b) => b.sn - a.sn); // LATEST ON TOP!
  }, [orders, viewTab, statusFilter, fileFilter, searchQuery]);

  // Ingestion Handler
  const handleIngestOrder = () => {
    if (!newClient.trim()) {
      toastError("Required Field", "Please enter a Client / School Title.");
      return;
    }

    const qtyDisplay = newQtyStr.trim() || "1 card";
    const computedTotal = parseIDCQuantity(qtyDisplay);

    addOrder({
      sn: nextSN,
      date: getFormattedDateToday(),
      client: newClient.trim(),
      workQtyDisplay: qtyDisplay,
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
      `Added #${nextSN}: ${newClient.trim()} (${computedTotal.toLocaleString()} cards) • In Queue for Kamal Sir.`
    );
  };

  // 1-Click Status Advance Handler
  const handleCycleStatusClick = (order: IDCardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus: "kamal" | "ready" | "done" = "kamal";
    if (order.status === "kamal") {
      nextStatus = "ready";
    } else if (order.status === "ready" || order.status === "ready (1 pending he)") {
      nextStatus = "done";
    } else {
      nextStatus = "kamal";
    }

    updateOrderStatus(order.id, nextStatus);
    const labelMap = {
      kamal: "With Kamal Sir (In Printing)",
      ready: "Printed (Ready)",
      done: "Completed & Dispatched",
    };
    toastSuccess("Status Advanced", `Order #${order.sn} is now: ${labelMap[nextStatus]}`);
  };

  // Quick navigation to Lanyard / Labour View
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
      {/* 1. RESTRAINED 4-CARD KPI METRICS DECK                                      */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Card 1: Total Volume */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Total Ingested
            </span>
            <Icon name="credit-card" size={14} color="#64748b" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#f8fafc",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {metrics.totalPieces.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>cards</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            Across {metrics.totalOrders} school / client batches
          </div>
        </div>

        {/* Card 2: With Kamal Sir */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              With Kamal Sir
            </span>
            <Icon name="printer" size={14} color="#38bdf8" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#38bdf8",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {metrics.inKamalPieces.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "rgba(56, 189, 248, 0.7)", fontWeight: 500 }}>
              cards
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            {metrics.inKamalCount} batches active in thermal printing
          </div>
        </div>

        {/* Card 3: Printed (Ready) */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Printed (Ready)
            </span>
            <Icon name="check" size={14} color="#c084fc" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#c084fc",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {metrics.readyPieces.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "rgba(192, 132, 252, 0.7)", fontWeight: 500 }}>
              cards
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            {metrics.readyCount} batches ready for packaging / lanyard matching
          </div>
        </div>

        {/* Card 4: Done */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Done & Dispatched
            </span>
            <Icon name="check-circle" size={14} color="#22c55e" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#22c55e",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {metrics.donePieces.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "rgba(34, 197, 94, 0.7)", fontWeight: 500 }}>
              cards
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            {metrics.doneCount} batches completed ({metrics.donePercentage}% fulfilled)
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 3. COMPACT 34PX HIGH-DENSITY SMART INGESTION BAR                           */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 10px",
          backgroundColor: "#0e131f",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          borderRadius: "6px",
          flexWrap: "wrap",
        }}
      >
        {/* SN Pill */}
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: "#38bdf8",
            backgroundColor: "rgba(56, 189, 248, 0.1)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            padding: "3px 8px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
          }}
        >
          #{nextSN}
        </span>

        {/* Client / School Name Input */}
        <input
          type="text"
          placeholder="Client / School Title (e.g. svm kotra, blue bird)..."
          value={newClient}
          onChange={(e) => setNewClient(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
          style={{
            flex: 1.5,
            minWidth: "200px",
            height: "30px",
            padding: "0 10px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "4px",
            color: "#f8fafc",
            fontSize: "12.5px",
            outline: "none",
          }}
        />

        {/* Work / Breakdown Quantity Input */}
        <input
          type="text"
          placeholder="Work / Qty (e.g. 14 stu + 21 staff)"
          value={newQtyStr}
          onChange={(e) => setNewQtyStr(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
          style={{
            width: "180px",
            height: "30px",
            padding: "0 10px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "4px",
            color: "#38bdf8",
            fontSize: "12px",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            outline: "none",
          }}
        />

        {/* File Format Selector Segment */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "30px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "4px",
            padding: "2px",
            gap: "2px",
          }}
        >
          {(["doc", "pdf", "excel"] as const).map((fmt) => {
            const isSel = newFileLocation === fmt;
            return (
              <button
                key={fmt}
                type="button"
                onClick={() => setNewFileLocation(fmt)}
                style={{
                  height: "24px",
                  padding: "0 8px",
                  fontSize: "11px",
                  fontWeight: isSel ? 700 : 500,
                  color: isSel ? "#38bdf8" : "#64748b",
                  backgroundColor: isSel ? "rgba(56, 189, 248, 0.15)" : "transparent",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {fmt}
              </button>
            );
          })}
        </div>

        {/* Holder / Lanyard status */}
        <input
          type="text"
          placeholder="Lanyard status (e.g. available he)"
          value={newHolderLanyard}
          onChange={(e) => setNewHolderLanyard(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
          style={{
            width: "150px",
            height: "30px",
            padding: "0 10px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "4px",
            color: "#94a3b8",
            fontSize: "11.5px",
            outline: "none",
          }}
        />

        {/* Live Stock Check Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 8px",
            borderRadius: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            fontSize: "11px",
            color: intakeStockCheck.statusColor,
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="layers" size={12} color={intakeStockCheck.statusColor} />
          <span>{intakeStockCheck.statusText}</span>
        </div>

        {/* Ingest Action Button */}
        <button
          type="button"
          onClick={handleIngestOrder}
          style={{
            height: "30px",
            padding: "0 14px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#080b12",
            backgroundColor: "#38bdf8",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="plus" size={13} color="#080b12" />
          <span>Ingest & Send</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 4. UNIFIED TOOLBAR: SEGMENTED VIEW TABS, SEARCH, FILTERS                   */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Segmented View Tabs + Live Blank PVC Stock Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px",
              backgroundColor: "#0e131f",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: "6px",
              gap: "2px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setViewTab("ACTIVE");
                setStatusFilter("ALL");
              }}
              style={{
                padding: "4px 10px",
                fontSize: "11.5px",
                fontWeight: viewTab === "ACTIVE" ? 600 : 500,
                color: viewTab === "ACTIVE" ? "#f8fafc" : "#64748b",
                backgroundColor: viewTab === "ACTIVE" ? "rgba(255, 255, 255, 0.08)" : "transparent",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>Active Queue</span>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  color: viewTab === "ACTIVE" ? "#38bdf8" : "#64748b",
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
                padding: "4px 10px",
                fontSize: "11.5px",
                fontWeight: viewTab === "COMPLETED" ? 600 : 500,
                color: viewTab === "COMPLETED" ? "#f8fafc" : "#64748b",
                backgroundColor: viewTab === "COMPLETED" ? "rgba(255, 255, 255, 0.08)" : "transparent",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>Completed</span>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  color: viewTab === "COMPLETED" ? "#22c55e" : "#64748b",
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
                padding: "4px 10px",
                fontSize: "11.5px",
                fontWeight: viewTab === "ALL" ? 600 : 500,
                color: viewTab === "ALL" ? "#f8fafc" : "#64748b",
                backgroundColor: viewTab === "ALL" ? "rgba(255, 255, 255, 0.08)" : "transparent",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>All Records</span>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  color: "#64748b",
                  fontWeight: 700,
                }}
              >
                {metrics.totalOrders}
              </span>
            </button>
          </div>

          {/* Live PVC Stock Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 9px",
              borderRadius: "5px",
              backgroundColor: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.22)",
              fontSize: "11px",
              color: "#4ade80",
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
              }}
            />
            <span>Blank PVC: {pvcCardItem.availableStock.toLocaleString()} cards in stock</span>
          </div>
        </div>

        {/* Right: Search, File Filter & Quick Link to Lanyard Desk */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* File Format Filter */}
          <select
            value={fileFilter}
            onChange={(e) => setFileFilter(e.target.value)}
            style={{
              height: "28px",
              padding: "0 8px",
              backgroundColor: "#0e131f",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: "4px",
              color: "#94a3b8",
              fontSize: "11.5px",
              outline: "none",
            }}
          >
            <option value="ALL">All File Types</option>
            <option value="doc">DOC</option>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="hard copy">Hard Copy</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              height: "28px",
              padding: "0 8px",
              backgroundColor: "#0e131f",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: "4px",
              color: "#94a3b8",
              fontSize: "11.5px",
              outline: "none",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="kamal">With Kamal Sir</option>
            <option value="ready">Printed (Ready)</option>
            <option value="done">Done & Completed</option>
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
                height: "28px",
                padding: "0 10px 0 26px",
                backgroundColor: "#0e131f",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                borderRadius: "4px",
                color: "#f8fafc",
                fontSize: "11.5px",
                outline: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                opacity: 0.5,
              }}
            >
              <Icon name="search" size={11} color="#94a3b8" />
            </div>
          </div>

          {/* Quick link button to Lanyard Hub */}
          <button
            type="button"
            onClick={handleJumpToLanyard}
            style={{
              height: "28px",
              padding: "0 10px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              color: "#94a3b8",
              fontSize: "11.5px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
            title="Switch to Lanyard Workspace"
          >
            <Icon name="tag" size={12} color="#94a3b8" />
            <span>Lanyard Hub</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 5. HIGH-DENSITY ENTERPRISE PRODUCTION TABLE (LATEST ON TOP!)               */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.07)",
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
                    padding: "12px 12px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "65px",
                  }}
                >
                  SN
                </th>
                <th
                  style={{
                    padding: "12px 10px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "80px",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    minWidth: "200px",
                  }}
                >
                  Client / School Title
                </th>
                <th
                  style={{
                    padding: "12px 12px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "170px",
                  }}
                >
                  Student / Staff Breakdown
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "95px",
                  }}
                >
                  Cards Qty
                </th>
                <th
                  style={{
                    padding: "12px 10px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "90px",
                  }}
                >
                  Format
                </th>
                <th
                  style={{
                    padding: "12px 12px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "140px",
                  }}
                >
                  Blank PVC Stock
                </th>
                <th
                  style={{
                    padding: "12px 10px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "140px",
                  }}
                >
                  Stage (1-Click)
                </th>
                <th
                  style={{
                    padding: "12px 12px",
                    textAlign: "left",
                    fontSize: "12px",
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
                    padding: "12px 12px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    width: "140px",
                  }}
                >
                  Remarks & Link
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
                        height: "48px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.012)",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.04)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.012)")
                      }
                    >
                      {/* 1. SN */}
                      <td
                        style={{
                          padding: "11px 12px",
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
                          padding: "11px 10px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "12.5px",
                          color: "#94a3b8",
                        }}
                      >
                        {o.date}
                      </td>

                      {/* 3. Client / School */}
                      <td
                        style={{
                          padding: "11px 14px",
                          fontSize: "14.5px",
                          fontWeight: 700,
                          color: "#ffffff",
                          cursor: "pointer",
                          letterSpacing: "-0.01em",
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
                              backgroundColor: "#070a11",
                              border: "1px solid #38bdf8",
                              borderRadius: "4px",
                              color: "#fff",
                              fontSize: "14px",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <span>{formatClientTitle(o.client)}</span>
                        )}
                      </td>

                      {/* 4. Breakdown */}
                      <td
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                        }}
                        onDoubleClick={(e) =>
                          handleStartEdit(o.id, "workQtyDisplay", o.workQtyDisplay, e)
                        }
                        title="Double-click to edit breakdown"
                      >
                        {editingCell?.id === o.id && editingCell?.field === "workQtyDisplay" ? (
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
                              backgroundColor: "#070a11",
                              border: "1px solid #38bdf8",
                              borderRadius: "4px",
                              color: "#38bdf8",
                              fontSize: "12px",
                              fontFamily: "var(--font-mono)",
                              outline: "none",
                            }}
                          />
                        ) : (
                          renderBreakdownTags(o.workQtyDisplay)
                        )}
                      </td>

                      {/* 5. Total Quantity */}
                      <td
                        style={{
                          padding: "11px 14px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#ffffff",
                        }}
                      >
                        {o.totalQty.toLocaleString()}{" "}
                        <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
                          cards
                        </span>
                      </td>

                      {/* 6. File Format */}
                      <td style={{ padding: "11px 10px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            backgroundColor:
                              o.fileLocation === "pdf"
                                ? "rgba(239, 68, 68, 0.14)"
                                : o.fileLocation === "excel" || o.fileLocation === "excel and doc"
                                ? "rgba(34, 197, 94, 0.14)"
                                : o.fileLocation === "hard copy"
                                ? "rgba(245, 158, 11, 0.14)"
                                : "rgba(56, 189, 248, 0.14)",
                            border: `1px solid ${
                              o.fileLocation === "pdf"
                                ? "rgba(239, 68, 68, 0.35)"
                                : o.fileLocation === "excel" || o.fileLocation === "excel and doc"
                                ? "rgba(34, 197, 94, 0.35)"
                                : o.fileLocation === "hard copy"
                                ? "rgba(245, 158, 11, 0.35)"
                                : "rgba(56, 189, 248, 0.35)"
                            }`,
                            color:
                              o.fileLocation === "pdf"
                                ? "#f87171"
                                : o.fileLocation === "excel" || o.fileLocation === "excel and doc"
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

                      {/* 7. Blank PVC Stock Status */}
                      <td style={{ padding: "11px 12px" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            color: "#4ade80",
                            backgroundColor: "rgba(34, 197, 94, 0.1)",
                            border: "1px solid rgba(34, 197, 94, 0.28)",
                            padding: "3px 9px",
                            borderRadius: "4px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Icon name="check" size={12} color="#22c55e" />
                          <span>{o.totalQty} Reserved</span>
                        </div>
                      </td>

                      {/* 8. 1-Click Status Advance */}
                      <td style={{ padding: "11px 10px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={(e) => handleCycleStatusClick(o, e)}
                          title="Click to advance status: Kamal -> Ready -> Done"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4.5px 12px",
                            borderRadius: "5px",
                            border: `1px solid ${
                              isDone
                                ? "rgba(34, 197, 94, 0.4)"
                                : isReady
                                ? "rgba(192, 132, 252, 0.4)"
                                : "rgba(56, 189, 248, 0.4)"
                            }`,
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 700,
                            backgroundColor: isDone
                              ? "rgba(34, 197, 94, 0.15)"
                              : isReady
                              ? "rgba(192, 132, 252, 0.15)"
                              : "rgba(56, 189, 248, 0.15)",
                            color: isDone ? "#4ade80" : isReady ? "#c084fc" : "#38bdf8",
                            transition: "all 0.15s ease",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: isDone ? "#22c55e" : isReady ? "#c084fc" : "#38bdf8",
                            }}
                          />
                          <span>
                            {isDone
                              ? "Dispatched ✓"
                              : isReady
                              ? "Printed (Ready)"
                              : "With Kamal"}
                          </span>
                        </button>
                      </td>

                      {/* 9. Lanyard / Holder */}
                      <td
                        style={{
                          padding: "11px 12px",
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
                              backgroundColor: "#070a11",
                              border: "1px solid #38bdf8",
                              borderRadius: "4px",
                              color: "#38bdf8",
                              fontSize: "13px",
                              outline: "none",
                            }}
                          />
                        ) : (
                          renderLanyardStatus(o.holderLanyardStatus)
                        )}
                      </td>

                      {/* 10. Remarks & Jump Link */}
                      <td
                        style={{
                          padding: "10px 12px",
                        }}
                      >
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
                              maxWidth: "100px",
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
                                  backgroundColor: "#070a11",
                                  border: "1px solid #38bdf8",
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
                            title="Jump to Lanyard Hub"
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
            <span>• Double-click any text cell to edit inline</span>
            <span>• 1-Click status button advances Kamal &rarr; Ready &rarr; Done</span>
          </div>
        </div>
      </div>
    </div>
  );
};
