import React, { useState, useMemo, useEffect, useRef } from "react";
import { Icon } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";
import {
  useLanyardStore,
  LanyardOrderEntry,
  FittingAllocation,
} from "./lanyardOrdersStore";
import { useStockStore } from "../stock/stockStore";

function getNextSN(list: LanyardOrderEntry[]): number {
  if (list.length === 0) return 1277;
  return Math.max(...list.map((e) => e.sn || 0)) + 1;
}

function getFormattedDateToday(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

/** Format school and company names into clean Title Case and preserve known acronyms */
function formatClientTitle(raw: string): string {
  if (!raw) return "—";
  const acronyms = ["DPS", "SVM", "VPS", "TSVS", "BCM", "BHEL", "AIIMS", "NIT", "MPL", "PH", "HQ", "DAV"];
  return raw
    .split(/\s+/)
    .map((word) => {
      const clean = word.replace(/[^a-zA-Z0-9]/g, "");
      const upper = clean.toUpperCase();
      if (acronyms.includes(upper)) {
        return word.replace(clean, upper);
      }
      if (word.length <= 2 && !word.match(/\d/)) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Format contractor display label e.g. "ajay 050926" -> "Ajay (05.09.26)" */
function formatContractorLabel(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  const cName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  if (parts.length > 1) {
    const rawDate = parts[1];
    if (rawDate.length === 6) {
      const formattedDate = `${rawDate.slice(0, 2)}.${rawDate.slice(2, 4)}.${rawDate.slice(4, 6)}`;
      return `${cName} (${formattedDate})`;
    }
    return `${cName} (${parts.slice(1).join(" ")})`;
  }
  return cName;
}

export const LanyardWorkspaceView: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const {
    orders,
    setOrders,
    addOrder,
    contractors,
    setSelectedContractorId,
    assignLabourAndRegisterVoucher,
  } = useLanyardStore();

  const { getRollStats, items: stockItems } = useStockStore();

  // View Queue Mode: "ACTIVE" (Default, hides completed), "COMPLETED", or "ALL"
  const [viewTab, setViewTab] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");

  // Filters
  const [contractorFilter, setContractorFilter] = useState<string>("ALL");
  const [filterSize, setFilterSize] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Intake bar states
  const [newMplName, setNewMplName] = useState("");
  const [newSize, setNewSize] = useState<"12mm" | "16mm" | "20mm">("16mm");
  const [newQtyStr, setNewQtyStr] = useState("");

  // Prospective Intake Stock Calculation
  const parsedIntakeQty = useMemo(() => {
    const qtyNums = newQtyStr.match(/\d+/g);
    if (qtyNums && qtyNums.length > 0) {
      return qtyNums.reduce((sum, n) => sum + parseInt(n, 10), 0);
    }
    const nameNums = newMplName.match(/\d+/g);
    if (nameNums && nameNums.length > 0) {
      return parseInt(nameNums[0], 10);
    }
    return 100;
  }, [newQtyStr, newMplName]);

  const intakeStockReport = useMemo(() => {
    return getRollStats(newSize, parsedIntakeQty);
  }, [getRollStats, newSize, parsedIntakeQty]);

  // Inline Cell Editing State
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof LanyardOrderEntry } | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  // Labour Assignment Modal State
  const [fittingModalOrder, setFittingModalOrder] = useState<LanyardOrderEntry | null>(null);
  const [selectedFittingContractorId, setSelectedFittingContractorId] = useState<string>("rupa");
  const [fittingDateInput, setFittingDateInput] = useState<string>("050926");
  const [isMixFitting, setIsMixFitting] = useState<boolean>(false);
  const [mixFittingContractorIds, setMixFittingContractorIds] = useState<string[]>(["arti_akash", "rupa"]);
  const [mixFittingQtys, setMixFittingQtys] = useState<Record<string, number>>({});

  // Floor Progress Quick Update Modal State
  const [floorModalOrder, setFloorModalOrder] = useState<LanyardOrderEntry | null>(null);
  const [floorPrintedInput, setFloorPrintedInput] = useState<string>("0");
  const [floorSentInput, setFloorSentInput] = useState<string>("0");
  const [floorReadyInput, setFloorReadyInput] = useState<string>("0");
  const [floorContractorInput, setFloorContractorInput] = useState<string>("rupa");

  // Quick navigation to Labour Workspace for specific contractor
  const handleJumpToLabourPage = (contractorId?: string) => {
    if (contractorId && contractorId !== "mix" && contractorId !== "wof") {
      setSelectedContractorId(contractorId);
    }
    window.dispatchEvent(
      new CustomEvent("officefloww:navigate", {
        detail: { section: "labour_lanyard", contractorId },
      })
    );
  };

  // 1-Click Print Status Cycle: Needs Print -> In Print -> Printed OK -> Reset
  const handleCyclePrintStatus = (order: LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order.goneForPrint) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                goneForPrint: true,
                isPrinted: false,
                printAllocations: [{ contractorId: "pr-1", contractorName: "In-House Sublimation", qty: o.qty }],
              }
            : o
        )
      );
      toastSuccess("Print Scheduled", `Order #${order.sn} marked In Print.`);
    } else if (!order.isPrinted) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                isPrinted: true,
              }
            : o
        )
      );
      toastSuccess("Print Verified", `Order #${order.sn} verified printed.`);
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                goneForPrint: false,
                isPrinted: false,
              }
            : o
        )
      );
      toastSuccess("Print Reset", `Order #${order.sn} reset to intake.`);
    }
  };

  // 1-Click Fitting Status Cycle: Pending -> In Fitting -> Ready
  const handleCycleFittingStatus = (order: LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus: "pending_assignment" | "in_fitting" | "ready";
    let completedQty = 0;

    if (order.fittingStatus === "pending_assignment") {
      nextStatus = "in_fitting";
    } else if (order.fittingStatus === "in_fitting") {
      nextStatus = "ready";
      completedQty = order.qty;
    } else {
      nextStatus = "in_fitting";
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              fittingStatus: nextStatus,
              completedQty: nextStatus === "ready" ? o.qty : completedQty,
            }
          : o
      )
    );

    if (nextStatus === "ready") {
      toastSuccess("Order Completed", `Order #${order.sn} marked Ready.`);
    } else {
      toastSuccess("Status Updated", `Order #${order.sn} is now in fitting.`);
    }
  };

  // Ingest Order Handler
  const handleIngestOrder = () => {
    if (!newMplName.trim()) {
      toastError("Required Field", "Please enter an Order / MPL Client Name.");
      return;
    }

    let parsedQty = 0;
    const nums = newMplName.match(/\d+/g);
    const qtyNums = newQtyStr.match(/\d+/g);

    if (qtyNums && qtyNums.length > 0) {
      parsedQty = qtyNums.reduce((sum, n) => sum + parseInt(n, 10), 0);
    } else if (nums && nums.length > 0) {
      parsedQty = parseInt(nums[0], 10);
    } else {
      parsedQty = 100;
    }

    const nextSN = getNextSN(orders);
    const newEntry = addOrder({
      sn: nextSN,
      date: getFormattedDateToday(),
      mplName: newMplName.trim(),
      size: newSize,
      qty: parsedQty,
      qtyDisplay: newQtyStr.trim() || String(parsedQty),
      goneForPrint: false,
      isPrinted: false,
      goneForFitting: false,
      fittingHardware: `${newSize} Dog Hook + Clip`,
      fittingStatus: "pending_assignment",
      fittingRemarks: "",
    });

    setNewMplName("");
    setNewQtyStr("");
    toastSuccess("Order Ingested", `Added #${nextSN}: ${newEntry.mplName} (${parsedQty.toLocaleString()} pcs)`);
  };

  // Inline Editing
  const handleStartEdit = (entry: LanyardOrderEntry, field: keyof LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCell({ id: entry.id, field });
    if (field === "qty") {
      setEditValue(entry.qtyDisplay || String(entry.qty));
    } else {
      setEditValue(String(entry[field] || ""));
    }
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const val = editValue.trim();

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        if (field === "qty") {
          const parsed = parseInt(val, 10) || o.qty;
          return { ...o, qty: parsed, qtyDisplay: val };
        }
        return { ...o, [field]: val };
      })
    );
    setEditingCell(null);
  };

  // Labour Assignment Modal
  const openLabourAssignmentModal = (order: LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setFittingModalOrder(order);
    setSelectedFittingContractorId(order.fittingContractorId || "rupa");
    setFittingDateInput(order.fittingDate || "050926");
    setIsMixFitting(order.fittingContractorId === "mix");

    if (order.fittingAllocations && order.fittingAllocations.length > 0) {
      const cIds = order.fittingAllocations.map((a) => a.contractorId);
      setMixFittingContractorIds(cIds);
      const qtys: Record<string, number> = {};
      order.fittingAllocations.forEach((a) => {
        qtys[a.contractorId] = a.qty;
      });
      setMixFittingQtys(qtys);
    } else {
      const half = Math.floor(order.qty / 2);
      setMixFittingQtys({
        arti_akash: half,
        rupa: order.qty - half,
      });
    }
  };

  const handleConfirmFittingAssignment = () => {
    if (!fittingModalOrder) return;

    if (isMixFitting) {
      const allocations: FittingAllocation[] = mixFittingContractorIds.map((id) => {
        const c = contractors.find((con) => con.id === id);
        return {
          contractorId: id,
          contractorName: c ? c.displayName : id,
          qty: Number(mixFittingQtys[id]) || 0,
        };
      });

      assignLabourAndRegisterVoucher(
        fittingModalOrder.id,
        "mix",
        "mix",
        fittingDateInput,
        allocations
      );

      toastSuccess(
        "Labour Assigned (Mix)",
        `Order split across ${allocations.length} labour contractors.`
      );
    } else {
      const contractor = contractors.find((c) => c.id === selectedFittingContractorId);
      const shortName = contractor ? contractor.shortName : selectedFittingContractorId;
      const formattedName =
        shortName === "shop" || shortName === "wof" ? shortName : `${shortName} ${fittingDateInput}`;

      assignLabourAndRegisterVoucher(
        fittingModalOrder.id,
        selectedFittingContractorId,
        formattedName,
        shortName === "shop" || shortName === "wof" ? "" : fittingDateInput
      );

      toastSuccess(
        "Labour Assigned",
        `Assigned to ${contractor ? contractor.name : selectedFittingContractorId}.`
      );
    }

    setFittingModalOrder(null);
  };

  // Floor Progress Quick Update Handlers
  const openFloorUpdateModal = (order: LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setFloorModalOrder(order);
    setFloorPrintedInput(String(order.printedQty ?? (order.isPrinted ? order.qty : 0)));
    setFloorSentInput(String(order.sentToLabourQty ?? (order.goneForFitting ? order.qty : 0)));
    setFloorReadyInput(String(order.completedQty ?? (order.fittingStatus === "ready" ? order.qty : 0)));
    setFloorContractorInput(order.fittingContractorId || "rupa");
  };

  const handleSaveFloorUpdate = () => {
    if (!floorModalOrder) return;
    const pQty = Math.min(floorModalOrder.qty, Math.max(0, parseInt(floorPrintedInput, 10) || 0));
    const sQty = Math.min(floorModalOrder.qty, Math.max(0, parseInt(floorSentInput, 10) || 0));
    const rQty = Math.min(floorModalOrder.qty, Math.max(0, parseInt(floorReadyInput, 10) || 0));

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== floorModalOrder.id) return o;
        return {
          ...o,
          printedQty: pQty,
          isPrinted: pQty >= o.qty,
          goneForPrint: pQty > 0 || o.goneForPrint,
          sentToLabourQty: sQty,
          goneForFitting: sQty > 0 || o.goneForFitting,
          fittingContractorId: floorContractorInput,
          fittingContractorName:
            contractors.find((c) => c.id === floorContractorInput)?.shortName || floorContractorInput,
          completedQty: rQty,
          fittingStatus: rQty >= o.qty ? "ready" : sQty > 0 ? "in_fitting" : o.fittingStatus,
        };
      })
    );

    toastSuccess(
      "Floor Status Updated",
      `Order #${floorModalOrder.sn}: Printed ${pQty.toLocaleString()} • Sent ${sQty.toLocaleString()} • Ready ${rQty.toLocaleString()} (${floorModalOrder.qty - rQty} left).`
    );
    setFloorModalOrder(null);
  };

  // Executive Metric Calculations
  const metrics = useMemo(() => {
    const totalCount = orders.length;
    const totalVolume = orders.reduce((sum, o) => sum + (o.qty || 0), 0);

    const activeOrders = orders.filter((o) => o.fittingStatus !== "ready");
    const activeCount = activeOrders.length;
    const activeVolume = activeOrders.reduce((sum, o) => sum + (o.qty || 0), 0);

    const completedOrders = orders.filter((o) => o.fittingStatus === "ready");
    const completedCount = completedOrders.length;
    const completedVolume = completedOrders.reduce((sum, o) => sum + (o.qty || 0), 0);

    const inPrintOrders = orders.filter((o) => o.goneForPrint && !o.isPrinted);
    const inPrintVolume = inPrintOrders.reduce((sum, o) => sum + (o.qty || 0), 0);

    const inFittingOrders = orders.filter((o) => o.fittingStatus === "in_fitting");
    const inFittingVolume = inFittingOrders.reduce((sum, o) => sum + (o.qty || 0), 0);

    const completionRate = totalVolume > 0 ? Math.round((completedVolume / totalVolume) * 100) : 0;

    return {
      totalCount,
      totalVolume,
      activeCount,
      activeVolume,
      completedCount,
      completedVolume,
      inPrintCount: inPrintOrders.length,
      inPrintVolume,
      inFittingCount: inFittingOrders.length,
      inFittingVolume,
      completionRate,
    };
  }, [orders]);

  // Filtered Orders (Latest on Top!)
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // 1. View Tab Filter (Active Queue hides completed by default)
        if (viewTab === "ACTIVE" && o.fittingStatus === "ready") return false;
        if (viewTab === "COMPLETED" && o.fittingStatus !== "ready") return false;

        // 2. Contractor Filter
        if (contractorFilter !== "ALL") {
          const matchesPrimary = o.fittingContractorId === contractorFilter;
          const matchesAlloc = o.fittingAllocations?.some((a) => a.contractorId === contractorFilter);
          if (!matchesPrimary && !matchesAlloc) return false;
        }

        // 3. Size Filter
        if (filterSize !== "ALL" && o.size !== filterSize) {
          return false;
        }

        // 4. Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesMpl = o.mplName?.toLowerCase().includes(q);
          const matchesSn = String(o.sn).includes(q);
          const matchesContractor = o.fittingContractorName?.toLowerCase().includes(q);
          const matchesRemarks = o.fittingRemarks?.toLowerCase().includes(q);
          const matchesDate = o.date?.toLowerCase().includes(q);
          if (!matchesMpl && !matchesSn && !matchesContractor && !matchesRemarks && !matchesDate) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => (b.sn || 0) - (a.sn || 0)); // STRICTLY LATEST ON TOP!
  }, [orders, viewTab, contractorFilter, filterSize, searchQuery]);

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
              Total Volume
            </span>
            <Icon name="layers" size={14} color="#64748b" />
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
            {metrics.totalVolume.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>pcs</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            {metrics.totalCount} batches across all sizes
          </div>
        </div>

        {/* Card 2: In Print */}
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
              In Sublimation Print
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
            {metrics.inPrintVolume.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "rgba(56, 189, 248, 0.7)", fontWeight: 500 }}>pcs</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            {metrics.inPrintCount} batches on machine floor
          </div>
        </div>

        {/* Card 3: In Labour Fitting */}
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
              In Labour Fitting
            </span>
            <Icon name="tool" size={14} color="#f59e0b" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#fbbf24",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {metrics.inFittingVolume.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "rgba(251, 191, 36, 0.7)", fontWeight: 500 }}>pcs</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            {metrics.inFittingCount} batches with outside contractors
          </div>
        </div>

        {/* Card 4: Completed & Ready */}
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
              Completed & Ready
            </span>
            <Icon name="check-circle" size={14} color="#22c55e" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#4ade80",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {metrics.completedVolume.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "rgba(74, 222, 128, 0.7)", fontWeight: 500 }}>pcs</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            {metrics.completedCount} orders verified ({metrics.completionRate}%)
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 3. COMPACT INTAKE STRIP                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          borderRadius: "8px",
          backgroundColor: "#0e131f",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            padding: "4px 8px",
            borderRadius: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            color: "#94a3b8",
          }}
        >
          #{getNextSN(orders)}
        </span>

        <input
          type="text"
          placeholder="Client / MPL Title (e.g. rajesh ji-govt girls 500)"
          value={newMplName}
          onChange={(e) => setNewMplName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
          style={{
            flex: 1,
            minWidth: "220px",
            height: "32px",
            padding: "0 10px",
            backgroundColor: "#090c13",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "5px",
            color: "#fff",
            fontSize: "12.5px",
            outline: "none",
          }}
        />

        {/* Size Selector: strictly 12mm | 16mm | 20mm */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#090c13",
            borderRadius: "5px",
            padding: "2px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            height: "32px",
            boxSizing: "border-box",
            alignItems: "center",
          }}
        >
          {(["12mm", "16mm", "20mm"] as const).map((sz) => {
            const isSelected = newSize === sz;
            return (
              <button
                key={sz}
                type="button"
                onClick={() => setNewSize(sz)}
                style={{
                  height: "26px",
                  padding: "0 9px",
                  borderRadius: "3px",
                  border: "none",
                  backgroundColor: isSelected ? "rgba(255, 255, 255, 0.12)" : "transparent",
                  color: isSelected ? "#fff" : "#64748b",
                  fontSize: "11.5px",
                  fontWeight: isSelected ? 700 : 500,
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                }}
              >
                {sz}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Qty"
          value={newQtyStr}
          onChange={(e) => setNewQtyStr(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
          style={{
            width: "90px",
            height: "32px",
            padding: "0 8px",
            backgroundColor: "#090c13",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "5px",
            color: "#fff",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            outline: "none",
          }}
        />

        {/* Live Roll Stock Indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 9px",
            borderRadius: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            fontSize: "11px",
            color: intakeStockReport.statusColor,
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="package" size={12} color={intakeStockReport.statusColor} />
          <span>
            {intakeStockReport.size}: {intakeStockReport.exactRolls} roll{parseFloat(intakeStockReport.exactRolls) === 1 ? "" : "s"} req &bull; {intakeStockReport.statusText}
          </span>
        </div>

        <button
          type="button"
          onClick={handleIngestOrder}
          style={{
            height: "32px",
            padding: "0 14px",
            borderRadius: "5px",
            backgroundColor: "#2563eb",
            border: "none",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="plus" size={13} />
          <span>Ingest Order</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 4. UNIFIED QUEUE & FILTER TOOLBAR                                          */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          padding: "8px 12px",
          borderRadius: "8px",
          backgroundColor: "#0e131f",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Left: Segmented Queue Tabs (Active vs Completed vs All) */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            type="button"
            onClick={() => setViewTab("ACTIVE")}
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
            onClick={() => setViewTab("COMPLETED")}
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
              {metrics.completedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab("ALL")}
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
            <span>All</span>
            <span
              style={{
                fontSize: "10.5px",
                fontFamily: "var(--font-mono)",
                padding: "1px 5px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                color: "#94a3b8",
              }}
            >
              {orders.length}
            </span>
          </button>
        </div>

        {/* Right: Contractor dropdown, Size filter & Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Contractor Filter Dropdown */}
          <select
            value={contractorFilter}
            onChange={(e) => setContractorFilter(e.target.value)}
            style={{
              height: "30px",
              padding: "0 8px",
              backgroundColor: "#090c13",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "5px",
              color: "#cbd5e1",
              fontSize: "11.5px",
              outline: "none",
            }}
          >
            <option value="ALL">All Contractors</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName.split(" (")[0]}
              </option>
            ))}
          </select>

          {/* Size Filter Dropdown */}
          <select
            value={filterSize}
            onChange={(e) => setFilterSize(e.target.value)}
            style={{
              height: "30px",
              padding: "0 8px",
              backgroundColor: "#090c13",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "5px",
              color: "#cbd5e1",
              fontSize: "11.5px",
              fontFamily: "var(--font-mono)",
              outline: "none",
            }}
          >
            <option value="ALL">All Sizes</option>
            <option value="12mm">12mm</option>
            <option value="16mm">16mm</option>
            <option value="20mm">20mm</option>
          </select>

          {/* Search Box */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
                pointerEvents: "none",
              }}
            >
              <Icon name="search" size={12} />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                height: "30px",
                width: "180px",
                paddingLeft: "26px",
                paddingRight: "8px",
                backgroundColor: "#090c13",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "5px",
                color: "#fff",
                fontSize: "11.5px",
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 5. INDUSTRIAL WORKSPACE TABLE (Sorted Latest on Top)                       */}
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
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <th style={{ padding: "12px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "65px" }}>
                  SN
                </th>
                <th style={{ padding: "12px 10px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "80px" }}>
                  DATE
                </th>
                <th style={{ padding: "12px 14px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", minWidth: "220px" }}>
                  ORDER / MPL CLIENT
                </th>
                <th style={{ padding: "12px 10px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "95px" }}>
                  QTY
                </th>
                <th style={{ padding: "12px 10px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "145px" }}>
                  ROLL STOCK
                </th>
                <th style={{ padding: "12px 10px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "185px" }}>
                  FLOOR PROGRESS
                </th>
                <th style={{ padding: "12px 10px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "145px" }}>
                  FITTING LABOUR
                </th>
                <th style={{ padding: "12px 10px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "115px", textAlign: "center" }}>
                  STATUS
                </th>
                <th style={{ padding: "12px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", textAlign: "right", width: "125px" }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px 16px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <Icon name="inbox" size={28} color="#475569" />
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
                filteredOrders.map((entry) => {
                  const isReady = entry.fittingStatus === "ready";
                  const contractor = contractors.find((c) => c.id === entry.fittingContractorId);
                  const isMix = entry.fittingContractorId === "mix";
                  const rollReport = getRollStats(entry.size, entry.qty);

                  const pQty = entry.printedQty ?? (entry.isPrinted ? entry.qty : 0);
                  const sQty = entry.sentToLabourQty ?? (entry.goneForFitting ? entry.qty : 0);
                  const rQty = entry.completedQty ?? (entry.fittingStatus === "ready" ? entry.qty : 0);
                  const leftQty = Math.max(0, entry.qty - rQty);

                  return (
                    <tr
                      key={entry.id}
                      style={{
                        height: "48px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        backgroundColor: isReady ? "rgba(34, 197, 94, 0.015)" : "transparent",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.04)")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = isReady ? "rgba(34, 197, 94, 0.015)" : "transparent")
                      }
                    >
                      {/* 1. SN */}
                      <td style={{ padding: "11px 12px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "13px", color: "#38bdf8" }}>
                        #{entry.sn}
                      </td>

                      {/* 2. Date */}
                      <td style={{ padding: "11px 10px", fontFamily: "var(--font-mono)", color: "#94a3b8", fontSize: "12.5px" }}>
                        {entry.date}
                      </td>

                      {/* 3. MPL Client & Size Tag */}
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontSize: "11.5px",
                              fontWeight: 700,
                              fontFamily: "var(--font-mono)",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(56, 189, 248, 0.12)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              color: "#38bdf8",
                            }}
                          >
                            {entry.size}
                          </span>

                          {editingCell?.id === entry.id && editingCell?.field === "mplName" ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                              style={{
                                height: "28px",
                                padding: "0 8px",
                                backgroundColor: "#090c13",
                                border: "1px solid #38bdf8",
                                borderRadius: "4px",
                                color: "#fff",
                                fontSize: "14px",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <span
                              onClick={(e) => handleStartEdit(entry, "mplName", e)}
                              title="Click to edit title"
                              style={{
                                fontSize: "14.5px",
                                fontWeight: 700,
                                color: isReady ? "#94a3b8" : "#ffffff",
                                cursor: "pointer",
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {formatClientTitle(entry.mplName)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Quantity */}
                      <td style={{ padding: "11px 10px" }}>
                        {editingCell?.id === entry.id && editingCell?.field === "qty" ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                            style={{
                              width: "70px",
                              height: "28px",
                              padding: "0 8px",
                              backgroundColor: "#090c13",
                              border: "1px solid #38bdf8",
                              borderRadius: "4px",
                              color: "#fff",
                              fontSize: "14px",
                              fontFamily: "var(--font-mono)",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <div
                            onClick={(e) => handleStartEdit(entry, "qty", e)}
                            title="Click to edit quantity"
                            style={{ cursor: "pointer" }}
                          >
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>
                              {entry.qty.toLocaleString()}
                            </span>{" "}
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>pcs</span>
                            {entry.qtyDisplay && entry.qtyDisplay !== String(entry.qty) && (
                              <div style={{ fontSize: "10.5px", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                                ({entry.qtyDisplay})
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 5. Roll Stock Readiness */}
                      <td style={{ padding: "10px 10px" }}>
                        <div
                          style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}
                          title={rollReport.statusText}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div
                              style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                backgroundColor: rollReport.statusColor,
                              }}
                            />
                            <span
                              style={{
                                fontSize: "12px",
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                color: rollReport.statusColor,
                              }}
                            >
                              {rollReport.exactRolls} roll{parseFloat(rollReport.exactRolls) === 1 ? "" : "s"}
                            </span>
                          </div>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                            {rollReport.availableRolls} in stock ({entry.size})
                          </span>
                        </div>
                      </td>

                      {/* 6. Floor Progress: Print • Labour • Ready */}
                      <td style={{ padding: "11px 10px" }}>
                        <div
                          onClick={(e) => openFloorUpdateModal(entry, e)}
                          title="Click to update floor quantities (Print, Fitting, Ready)"
                          style={{ cursor: "pointer", display: "inline-flex", flexDirection: "column", gap: "4px" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span
                              title={`Sublimation Print: ${pQty} / ${entry.qty}`}
                              style={{
                                fontSize: "11.5px",
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "3px",
                                backgroundColor: pQty >= entry.qty ? "rgba(34, 197, 94, 0.16)" : pQty > 0 ? "rgba(56, 189, 248, 0.14)" : "rgba(255, 255, 255, 0.04)",
                                color: pQty >= entry.qty ? "#4ade80" : pQty > 0 ? "#38bdf8" : "#64748b",
                                border: pQty >= entry.qty ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid rgba(255, 255, 255, 0.07)",
                              }}
                            >
                              P:{pQty}
                            </span>
                            <span
                              title={`Labour Fitting: ${sQty} / ${entry.qty}`}
                              style={{
                                fontSize: "11.5px",
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "3px",
                                backgroundColor: sQty >= entry.qty ? "rgba(34, 197, 94, 0.16)" : sQty > 0 ? "rgba(245, 158, 11, 0.14)" : "rgba(255, 255, 255, 0.04)",
                                color: sQty >= entry.qty ? "#4ade80" : sQty > 0 ? "#fbbf24" : "#64748b",
                                border: sQty >= entry.qty ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid rgba(255, 255, 255, 0.07)",
                              }}
                            >
                              F:{sQty}
                            </span>
                            <span
                              title={`Ready / Inspected: ${rQty} / ${entry.qty}`}
                              style={{
                                fontSize: "11.5px",
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "3px",
                                backgroundColor: rQty >= entry.qty ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.04)",
                                color: rQty >= entry.qty ? "#4ade80" : "#64748b",
                                border: rQty >= entry.qty ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid rgba(255, 255, 255, 0.07)",
                              }}
                            >
                              R:{rQty}
                            </span>
                          </div>
                          {leftQty > 0 ? (
                            <span style={{ fontSize: "11.5px", color: "#fbbf24", fontWeight: 600 }}>
                              {leftQty.toLocaleString()} pcs remaining
                            </span>
                          ) : (
                            <span style={{ fontSize: "11.5px", color: "#4ade80", fontWeight: 700 }}>
                              100% finished ✓
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Fitting Labour */}
                      <td style={{ padding: "11px 10px" }}>
                        {entry.fittingContractorName ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (entry.fittingContractorId && entry.fittingContractorId !== "mix") {
                                handleJumpToLabourPage(entry.fittingContractorId);
                              } else {
                                handleJumpToLabourPage();
                              }
                            }}
                            title={`Click to view ${entry.fittingContractorName} ledger in Labour Workspace`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4.5px 11px",
                              borderRadius: "5px",
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.16)",
                              color: "#f8fafc",
                              fontSize: "12.5px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <span>{formatContractorLabel(entry.fittingContractorName)}</span>
                            <Icon name="external-link" size={12} color="#94a3b8" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => openLabourAssignmentModal(entry, e)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4.5px 11px",
                              borderRadius: "5px",
                              backgroundColor: "transparent",
                              border: "1px dashed rgba(255, 255, 255, 0.28)",
                              color: "#94a3b8",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <Icon name="plus" size={12} />
                            <span>Assign</span>
                          </button>
                        )}
                      </td>

                      {/* 8. Status Toggle */}
                      <td style={{ padding: "11px 10px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={(e) => handleCycleFittingStatus(entry, e)}
                          title="Click to advance status"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4.5px 12px",
                            borderRadius: "5px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            border:
                              entry.fittingStatus === "ready"
                                ? "1px solid rgba(34, 197, 94, 0.4)"
                                : entry.fittingStatus === "in_fitting"
                                ? "1px solid rgba(56, 189, 248, 0.4)"
                                : "1px solid rgba(255, 255, 255, 0.14)",
                            backgroundColor:
                              entry.fittingStatus === "ready"
                                ? "rgba(34, 197, 94, 0.16)"
                                : entry.fittingStatus === "in_fitting"
                                ? "rgba(56, 189, 248, 0.16)"
                                : "rgba(255, 255, 255, 0.04)",
                            color:
                              entry.fittingStatus === "ready"
                                ? "#4ade80"
                                : entry.fittingStatus === "in_fitting"
                                ? "#38bdf8"
                                : "#cbd5e1",
                          }}
                        >
                          <Icon
                            name={
                              entry.fittingStatus === "ready"
                                ? "check-circle"
                                : entry.fittingStatus === "in_fitting"
                                ? "tool"
                                : "clock"
                            }
                            size={12}
                          />
                          <span>
                            {entry.fittingStatus === "ready"
                              ? "Ready"
                              : entry.fittingStatus === "in_fitting"
                              ? "In Fitting"
                              : "Pending"}
                          </span>
                        </button>
                      </td>

                      {/* 9. Actions */}
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          {/* Quick Floor Progress Update */}
                          <button
                            type="button"
                            onClick={(e) => openFloorUpdateModal(entry, e)}
                            title="Update Floor Progress (Printed / Sent / Ready)"
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(56, 189, 248, 0.1)",
                              border: "1px solid rgba(56, 189, 248, 0.25)",
                              color: "#38bdf8",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            <Icon name="sliders" size={12} />
                            <span>Floor</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => openLabourAssignmentModal(entry, e)}
                            title="Assign or reassign labour"
                            style={{
                              padding: "4px 7px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid rgba(255, 255, 255, 0.09)",
                              color: "#cbd5e1",
                              cursor: "pointer",
                            }}
                          >
                            <Icon name="user-check" size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (entry.fittingContractorId && entry.fittingContractorId !== "mix") {
                                handleJumpToLabourPage(entry.fittingContractorId);
                              } else {
                                handleJumpToLabourPage();
                              }
                            }}
                            title="Open in Labour Workspace"
                            style={{
                              padding: "4px 7px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid rgba(255, 255, 255, 0.09)",
                              color: "#cbd5e1",
                              cursor: "pointer",
                            }}
                          >
                            <Icon name="file-text" size={12} />
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
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 6. LABOUR ASSIGNMENT MODAL                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {fittingModalOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setFittingModalOrder(null)}
        >
          <div
            style={{
              width: "480px",
              maxWidth: "92vw",
              backgroundColor: "#0e131f",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>
                  Assign Labour Contractor
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Order #{fittingModalOrder.sn} • {fittingModalOrder.mplName} ({fittingModalOrder.qty.toLocaleString()} pcs)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFittingModalOrder(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Mode: Single Contractor vs Mix Split */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => setIsMixFitting(false)}
                style={{
                  flex: 1,
                  padding: "7px",
                  borderRadius: "5px",
                  border: !isMixFitting ? "1px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: !isMixFitting ? "rgba(59, 130, 246, 0.15)" : "transparent",
                  color: !isMixFitting ? "#3b82f6" : "#64748b",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Single Contractor
              </button>
              <button
                type="button"
                onClick={() => setIsMixFitting(true)}
                style={{
                  flex: 1,
                  padding: "7px",
                  borderRadius: "5px",
                  border: isMixFitting ? "1px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: isMixFitting ? "rgba(59, 130, 246, 0.15)" : "transparent",
                  color: isMixFitting ? "#3b82f6" : "#64748b",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Mix Split
              </button>
            </div>

            {/* Single Contractor Selector */}
            {!isMixFitting ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b" }}>
                  Select Contractor:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {contractors.map((c) => {
                    const isSelected = selectedFittingContractorId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedFittingContractorId(c.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          padding: "7px 10px",
                          borderRadius: "5px",
                          backgroundColor: isSelected ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.03)",
                          border: isSelected ? "1px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.08)",
                          color: isSelected ? "#fff" : "#94a3b8",
                          fontSize: "12px",
                          fontWeight: isSelected ? 700 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span>{c.displayName.split(" (")[0]}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: "4px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "3px" }}>
                    Fitting Date Code:
                  </label>
                  <input
                    type="text"
                    value={fittingDateInput}
                    onChange={(e) => setFittingDateInput(e.target.value)}
                    style={{
                      width: "100%",
                      height: "32px",
                      padding: "0 8px",
                      backgroundColor: "#090c13",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "5px",
                      color: "#fff",
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b" }}>
                  Distribute {fittingModalOrder.qty.toLocaleString()} pcs:
                </label>
                {contractors
                  .filter((c) => c.id !== "wof" && c.id !== "shop")
                  .map((c) => {
                    const isChecked = mixFittingContractorIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "5px 8px",
                          borderRadius: "5px",
                          backgroundColor: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                        }}
                      >
                        <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setMixFittingContractorIds((prev) => prev.filter((id) => id !== c.id));
                              } else {
                                setMixFittingContractorIds((prev) => [...prev, c.id]);
                              }
                            }}
                          />
                          <span style={{ fontSize: "12px", color: "#cbd5e1" }}>
                            {c.displayName.split(" (")[0]}
                          </span>
                        </label>
                        {isChecked && (
                          <input
                            type="number"
                            placeholder="Qty"
                            value={mixFittingQtys[c.id] || ""}
                            onChange={(e) =>
                              setMixFittingQtys((prev) => ({
                                ...prev,
                                [c.id]: parseInt(e.target.value, 10) || 0,
                              }))
                            }
                            style={{
                              width: "80px",
                              height: "26px",
                              padding: "0 6px",
                              backgroundColor: "#090c13",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              borderRadius: "4px",
                              color: "#fff",
                              fontSize: "11.5px",
                              fontFamily: "var(--font-mono)",
                              textAlign: "right",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
              <button
                type="button"
                onClick={() => setFittingModalOrder(null)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "5px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#cbd5e1",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFittingAssignment}
                style={{
                  padding: "7px 16px",
                  borderRadius: "5px",
                  backgroundColor: "#2563eb",
                  border: "none",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 7. FLOOR PROGRESS QUICK UPDATE MODAL                                       */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {floorModalOrder && (() => {
        const rollInfo = getRollStats(floorModalOrder.size, floorModalOrder.qty);
        const pVal = parseInt(floorPrintedInput, 10) || 0;
        const sVal = parseInt(floorSentInput, 10) || 0;
        const rVal = parseInt(floorReadyInput, 10) || 0;
        const remaining = Math.max(0, floorModalOrder.qty - rVal);

        return (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
            onClick={() => setFloorModalOrder(null)}
          >
            <div
              style={{
                width: "490px",
                maxWidth: "92vw",
                backgroundColor: "#0e131f",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "10px",
                padding: "20px 22px",
                boxShadow: "0 24px 48px rgba(0, 0, 0, 0.65)",
                color: "#f1f5f9",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        padding: "2px 7px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(56, 189, 248, 0.12)",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        color: "#38bdf8",
                        fontSize: "11px",
                        fontWeight: 700,
                        fontFamily: "monospace",
                      }}
                    >
                      #{floorModalOrder.sn}
                    </span>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                      Floor Progress & Quantities
                    </h3>
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "3px" }}>
                    {floorModalOrder.mplName} • <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{floorModalOrder.qty.toLocaleString()} pcs</span> ({floorModalOrder.size})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFloorModalOrder(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              {/* Stock roll check badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  backgroundColor: rollInfo.isShortage ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
                  border: `1px solid ${rollInfo.isShortage ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.2)"}`,
                  fontSize: "11px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="package" size={13} style={{ color: rollInfo.isShortage ? "#ef4444" : "#10b981" }} />
                  <span style={{ color: "#cbd5e1" }}>
                    Stock check: Need <strong>{rollInfo.requiredRolls}</strong> roll(s) of {floorModalOrder.size}
                  </span>
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    color: rollInfo.isShortage ? "#ef4444" : "#10b981",
                  }}
                >
                  {rollInfo.stockRolls} rolls available {rollInfo.isShortage ? "(DEFICIT)" : "✓"}
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "10.5px", textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: "0.5px", marginBottom: "6px" }}>
                  Floor Quick Presets
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setFloorPrintedInput(String(floorModalOrder.qty))}
                    style={{
                      flex: 1,
                      padding: "5px 8px",
                      borderRadius: "5px",
                      backgroundColor: "rgba(56, 189, 248, 0.08)",
                      border: "1px solid rgba(56, 189, 248, 0.25)",
                      color: "#38bdf8",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    All Printed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFloorPrintedInput(String(floorModalOrder.qty));
                      setFloorSentInput(String(floorModalOrder.qty));
                    }}
                    style={{
                      flex: 1,
                      padding: "5px 8px",
                      borderRadius: "5px",
                      backgroundColor: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.25)",
                      color: "#f59e0b",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    All Sent
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFloorPrintedInput(String(floorModalOrder.qty));
                      setFloorSentInput(String(floorModalOrder.qty));
                      setFloorReadyInput(String(floorModalOrder.qty));
                    }}
                    style={{
                      flex: 1.2,
                      padding: "5px 8px",
                      borderRadius: "5px",
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      color: "#10b981",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    100% Ready ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFloorPrintedInput("0");
                      setFloorSentInput("0");
                      setFloorReadyInput("0");
                    }}
                    style={{
                      padding: "5px 8px",
                      borderRadius: "5px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      color: "#94a3b8",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Quantities Form Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                {/* 1. Printed Qty */}
                <div style={{ padding: "8px 10px", backgroundColor: "#080b12", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>Printed Qty</label>
                    <button
                      type="button"
                      onClick={() => setFloorPrintedInput(String(floorModalOrder.qty))}
                      style={{ fontSize: "10px", color: "#38bdf8", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Max
                    </button>
                  </div>
                  <input
                    type="number"
                    value={floorPrintedInput}
                    min={0}
                    max={floorModalOrder.qty}
                    onChange={(e) => setFloorPrintedInput(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      padding: "5px 8px",
                      color: "#f8fafc",
                      fontSize: "13px",
                      fontWeight: 700,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>
                    {pVal >= floorModalOrder.qty ? "Fully printed ✓" : `${floorModalOrder.qty - pVal} to print`}
                  </div>
                </div>

                {/* 2. Sent to Labour */}
                <div style={{ padding: "8px 10px", backgroundColor: "#080b12", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>Sent to Labour</label>
                    <button
                      type="button"
                      onClick={() => setFloorSentInput(String(floorModalOrder.qty))}
                      style={{ fontSize: "10px", color: "#f59e0b", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Max
                    </button>
                  </div>
                  <input
                    type="number"
                    value={floorSentInput}
                    min={0}
                    max={floorModalOrder.qty}
                    onChange={(e) => setFloorSentInput(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      padding: "5px 8px",
                      color: "#f8fafc",
                      fontSize: "13px",
                      fontWeight: 700,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>
                    {sVal >= floorModalOrder.qty ? "All dispatched ✓" : `${floorModalOrder.qty - sVal} pending issue`}
                  </div>
                </div>

                {/* 3. Labour Contractor */}
                <div style={{ padding: "8px 10px", backgroundColor: "#080b12", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                    Contractor
                  </label>
                  <select
                    value={floorContractorInput}
                    onChange={(e) => setFloorContractorInput(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      padding: "5px 8px",
                      color: "#f8fafc",
                      fontSize: "12px",
                      fontWeight: 600,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    {contractors.map((c) => (
                      <option key={c.id} value={c.id} style={{ backgroundColor: "#0e131f", color: "#fff" }}>
                        {c.displayName}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>
                    Assigned table
                  </div>
                </div>

                {/* 4. Ready / Finished Qty */}
                <div style={{ padding: "8px 10px", backgroundColor: "#080b12", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>Ready / Finished</label>
                    <button
                      type="button"
                      onClick={() => setFloorReadyInput(String(floorModalOrder.qty))}
                      style={{ fontSize: "10px", color: "#10b981", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Max
                    </button>
                  </div>
                  <input
                    type="number"
                    value={floorReadyInput}
                    min={0}
                    max={floorModalOrder.qty}
                    onChange={(e) => setFloorReadyInput(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      padding: "5px 8px",
                      color: "#10b981",
                      fontSize: "13px",
                      fontWeight: 700,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ fontSize: "10px", color: remaining === 0 ? "#10b981" : "#f59e0b", marginTop: "3px", fontWeight: 600 }}>
                    {remaining === 0 ? "100% Completed ✓" : `${remaining} remained`}
                  </div>
                </div>
              </div>

              {/* Progress Bar and Breakdown */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "6px" }}>
                  <span style={{ color: "#94a3b8" }}>Order Completion</span>
                  <span style={{ fontWeight: 700, color: rVal >= floorModalOrder.qty ? "#10b981" : "#f8fafc" }}>
                    {Math.round((rVal / floorModalOrder.qty) * 100)}% ({rVal} / {floorModalOrder.qty} pcs)
                  </span>
                </div>
                <div style={{ height: "6px", borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.08)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, Math.round((rVal / floorModalOrder.qty) * 100))}%`,
                      backgroundColor: rVal >= floorModalOrder.qty ? "#10b981" : "#38bdf8",
                      borderRadius: "3px",
                      transition: "width 0.2s ease",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "#64748b", marginTop: "6px" }}>
                  <span>Printed: {pVal}</span>
                  <span>Sent: {sVal}</span>
                  <span style={{ color: remaining === 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                    Remained: {remaining}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setFloorModalOrder(null)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "5px",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#cbd5e1",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveFloorUpdate}
                  style={{
                    padding: "7px 18px",
                    borderRadius: "5px",
                    backgroundColor: "#2563eb",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save Floor Progress
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
