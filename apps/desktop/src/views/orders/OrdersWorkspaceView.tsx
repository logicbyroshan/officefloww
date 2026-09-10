import React, { useState, useMemo, useEffect } from "react";
import { Icon } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";
import { useLanyardStore, LanyardOrderEntry } from "./lanyardOrdersStore";
import { useIDCardStore, IDCardOrderEntry, IDCardCategory, IDCardFileFormat } from "./idCardOrdersStore";
import { useStockStore } from "../stock/stockStore";
import { SIZE_BATCH_UNITS } from "./LanyardWorkspaceView";

export interface FittingCategory {
  id: string;
  name: string; // e.g. "Hook Attachment", "Card Holder", "Safety Jointer", or custom
  label: string;
  options: string[];
  selected: string;
  isDeletable?: boolean;
}

const DEFAULT_FITTING_CATEGORIES: FittingCategory[] = [
  {
    id: "hook",
    name: "Hook Attachment",
    label: "Hook",
    options: ["Dog Hook", "England Hook", "Fish Hook", "Crocodile Clip", "None"],
    selected: "Dog Hook",
    isDeletable: false,
  },
  {
    id: "holder",
    name: "Card Holder",
    label: "Holder",
    options: ["DST-V", "DST-H", "CCH", "PH", "PV", "DST-BIG", "None"],
    selected: "DST-V",
    isDeletable: false,
  },
  {
    id: "jointer",
    name: "Jointer / Buckle",
    label: "Jointer",
    options: ["None", "12mm-j", "16mm-j", "20mm-j", "Breakaway Buckle", "Quick Release Clip"],
    selected: "None",
    isDeletable: false,
  },
];

const AVAILABLE_COLORS = [
  { name: "Red", code: "R", color: "#f87171", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.4)" },
  { name: "Blue", code: "B", color: "#60a5fa", bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.4)" },
  { name: "Yellow", code: "Y", color: "#facc15", bg: "rgba(234, 179, 8, 0.15)", border: "rgba(234, 179, 8, 0.4)" },
  { name: "Green", code: "G", color: "#4ade80", bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.4)" },
  { name: "Orange", code: "O", color: "#fb923c", bg: "rgba(249, 115, 22, 0.15)", border: "rgba(249, 115, 22, 0.4)" },
  { name: "Maroon", code: "M", color: "#f472b6", bg: "rgba(244, 114, 182, 0.15)", border: "rgba(244, 114, 182, 0.4)" },
  { name: "Navy", code: "NAV", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.4)" },
  { name: "Black", code: "BLK", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", border: "rgba(148, 163, 184, 0.4)" },
];

function getFormattedDateToday(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

export type OrderScope = "full_set" | "lanyard_only" | "idcard_only";
export type BreakdownMode = "uniform" | "size_only" | "color_only" | "matrix";

export const OrdersWorkspaceView: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { orders: lanyardOrders, addOrder: addLanyardOrder } = useLanyardStore();
  const { orders: idCardOrders, addOrder: addIDCardOrder } = useIDCardStore();
  const { getRollStats } = useStockStore();

  // 1. Order Scope (Full Set is First)
  const [orderScope, setOrderScope] = useState<OrderScope>("full_set");
  const includeLanyard = orderScope === "full_set" || orderScope === "lanyard_only";
  const includeIDCard = orderScope === "full_set" || orderScope === "idcard_only";

  // 2. Client & Description (2 lines high)
  const [clientTitle, setClientTitle] = useState<string>("");

  // 3. Lanyard Hardware Specifications
  const [lanyardSize, setLanyardSize] = useState<"12mm" | "16mm" | "20mm">("16mm");
  const [withFitting, setWithFitting] = useState<boolean>(true);

  // 4. Dynamic Fitting Categories & Custom Lists System
  const [fittingCategories, setFittingCategories] = useState<FittingCategory[]>(DEFAULT_FITTING_CATEGORIES);
  const [activeOpenDropdown, setActiveOpenDropdown] = useState<string | null>(null);
  const [newOptionInputs, setNewOptionInputs] = useState<Record<string, string>>({});

  // Modal state to add brand new Fitting Category / List
  const [showAddListModal, setShowAddListModal] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryLabel, setNewCategoryLabel] = useState<string>("");
  const [newCategoryInitialOptions, setNewCategoryInitialOptions] = useState<string>("");

  // 5. ID Card Specifications
  const [idCardCategory, setIdCardCategory] = useState<IDCardCategory>("Student");
  const [idCardFormat, setIdCardFormat] = useState<IDCardFileFormat>("excel");

  // 6. Intelligent Quantities & Ceiling Lanyard Calculations
  const [cardCountInput, setCardCountInput] = useState<number>(985);
  const [lanyardOnlyBatches, setLanyardOnlyBatches] = useState<number>(5);

  const baseBatchUnit = SIZE_BATCH_UNITS[lanyardSize]; // 37 for 12mm, 30 for 16mm, 25 for 20mm

  // Compute required lanyard batches in Full Set mode (always ceiling, never rounded down!)
  const fullSetCalculations = useMemo(() => {
    const validCardCount = Math.max(1, cardCountInput || 1);
    const batchesNeeded = Math.ceil(validCardCount / baseBatchUnit);
    const lanyardsProduced = batchesNeeded * baseBatchUnit;
    const spareLanyards = lanyardsProduced - validCardCount;
    return {
      cardCount: validCardCount,
      batches: batchesNeeded,
      lanyards: lanyardsProduced,
      spare: spareLanyards,
    };
  }, [cardCountInput, baseBatchUnit]);

  // Target batch count and target pieces for lanyard production
  const targetLanyardBatches = useMemo(() => {
    if (orderScope === "full_set") {
      return fullSetCalculations.batches;
    }
    return Math.max(1, lanyardOnlyBatches);
  }, [orderScope, fullSetCalculations.batches, lanyardOnlyBatches]);

  const targetLanyardPieces = targetLanyardBatches * baseBatchUnit;

  // 7. Enhanced Size & Color Breakdown Engine
  const [showBreakdownDrawer, setShowBreakdownDrawer] = useState<boolean>(false);
  const [breakdownMode, setBreakdownMode] = useState<BreakdownMode>("uniform");

  // Size Allocations (in batches)
  const [sizeBatches, setSizeBatches] = useState<Record<"small" | "medium" | "big", number>>({
    small: 1,
    medium: 0,
    big: 2,
  });

  // Active Colors Selection
  const [selectedColorCodes, setSelectedColorCodes] = useState<string[]>(["R", "B"]);

  // Color-Only Allocations (in batches)
  const [colorBatches, setColorBatches] = useState<Record<string, number>>({
    R: 2,
    B: 1,
  });

  // Combination Matrix: [sizeKey_colorCode] -> batches
  const [matrixBatches, setMatrixBatches] = useState<Record<string, number>>({
    small_R: 1,
    big_R: 1,
    big_B: 1,
  });

  // Calculate current allocated batches & pieces based on active breakdown mode
  const currentAllocated = useMemo(() => {
    if (!includeLanyard) {
      return {
        batches: 1,
        pieces: cardCountInput,
      };
    }

    if (breakdownMode === "uniform") {
      return {
        batches: targetLanyardBatches,
        pieces: targetLanyardPieces,
      };
    }

    if (breakdownMode === "size_only") {
      const b = (sizeBatches.small || 0) + (sizeBatches.medium || 0) + (sizeBatches.big || 0);
      return { batches: b, pieces: b * baseBatchUnit };
    }

    if (breakdownMode === "color_only") {
      const b = selectedColorCodes.reduce((acc, code) => acc + (colorBatches[code] || 0), 0);
      return { batches: b, pieces: b * baseBatchUnit };
    }

    // Combination matrix (Sizes + Colors)
    let totalB = 0;
    (["small", "medium", "big"] as const).forEach((s) => {
      selectedColorCodes.forEach((c) => {
        const key = `${s}_${c}`;
        totalB += matrixBatches[key] || 0;
      });
    });
    return { batches: totalB, pieces: totalB * baseBatchUnit };
  }, [
    includeLanyard,
    breakdownMode,
    targetLanyardBatches,
    targetLanyardPieces,
    baseBatchUnit,
    cardCountInput,
    sizeBatches,
    selectedColorCodes,
    colorBatches,
    matrixBatches,
  ]);

  const remainingBatches = targetLanyardBatches - currentAllocated.batches;
  const remainingPieces = remainingBatches * baseBatchUnit;

  // Auto-synchronize default allocations when target batches change and user enters breakdown
  useEffect(() => {
    if (breakdownMode === "size_only") {
      const currentSum = (sizeBatches.small || 0) + (sizeBatches.medium || 0) + (sizeBatches.big || 0);
      if (currentSum === 0 || currentSum !== targetLanyardBatches) {
        setSizeBatches({ small: 0, medium: 0, big: targetLanyardBatches });
      }
    } else if (breakdownMode === "color_only") {
      const currentSum = selectedColorCodes.reduce((acc, code) => acc + (colorBatches[code] || 0), 0);
      if (currentSum === 0 || currentSum !== targetLanyardBatches) {
        const first = selectedColorCodes[0] || "R";
        setColorBatches({ [first]: targetLanyardBatches });
      }
    }
  }, [targetLanyardBatches, breakdownMode]);

  // Roll stock estimation
  const rollStockReport = useMemo(() => {
    return getRollStats(lanyardSize, currentAllocated.pieces > 0 ? currentAllocated.pieces : baseBatchUnit);
  }, [getRollStats, lanyardSize, currentAllocated.pieces, baseBatchUnit]);

  // Handle adding an option to an existing fitting category
  const handleAddOptionToCategory = (catId: string) => {
    const raw = (newOptionInputs[catId] || "").trim();
    if (!raw) return;
    setFittingCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        if (!cat.options.includes(raw)) {
          return { ...cat, options: [...cat.options, raw], selected: raw };
        }
        return { ...cat, selected: raw };
      })
    );
    setNewOptionInputs((prev) => ({ ...prev, [catId]: "" }));
    setActiveOpenDropdown(null);
    toastSuccess("Item Added", `Added "${raw}" to fitting items.`);
  };

  // Handle creating a brand new fitting category / list
  const handleCreateNewFittingCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      toastError("Name Required", "Please enter a fitting list name.");
      return;
    }
    const label = newCategoryLabel.trim() || name.slice(0, 8);
    const rawOptions = newCategoryInitialOptions
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const finalOptions = rawOptions.length > 0 ? rawOptions : ["Option 1", "None"];
    const id = `cat_${Date.now()}`;

    const newCat: FittingCategory = {
      id,
      name,
      label,
      options: finalOptions,
      selected: finalOptions[0],
      isDeletable: true,
    };

    setFittingCategories((prev) => [...prev, newCat]);
    setNewCategoryName("");
    setNewCategoryLabel("");
    setNewCategoryInitialOptions("");
    setShowAddListModal(false);
    toastSuccess("Fitting List Created", `Created fitting category "${name}".`);
  };

  // Handle removing a user-created custom fitting category
  const handleRemoveCategory = (catId: string) => {
    setFittingCategories((prev) => prev.filter((c) => c.id !== catId));
    toastSuccess("List Removed", "Fitting category removed.");
  };

  // Build Breakdown String and Structured Metadata
  const buildBreakdownData = () => {
    const currentUnit = baseBatchUnit;

    if (breakdownMode === "uniform") {
      return {
        qtyDisplayStr: String(currentAllocated.pieces),
        doriBreakdown: undefined,
      };
    }

    if (breakdownMode === "size_only") {
      const s = (sizeBatches.small || 0) * currentUnit;
      const m = (sizeBatches.medium || 0) * currentUnit;
      const b = (sizeBatches.big || 0) * currentUnit;
      const parts: string[] = [];
      if (b > 0) parts.push(`Big: ${b}`);
      if (m > 0) parts.push(`Med: ${m}`);
      if (s > 0) parts.push(`Small: ${s}`);
      return {
        qtyDisplayStr: `${currentAllocated.pieces} (${parts.join(", ")})`,
        doriBreakdown: { small: s || undefined, medium: m || undefined, big: b || undefined },
      };
    }

    if (breakdownMode === "color_only") {
      const parts: string[] = [];
      selectedColorCodes.forEach((code) => {
        const b = colorBatches[code] || 0;
        if (b > 0) parts.push(`${code}-${b * currentUnit}`);
      });
      return {
        qtyDisplayStr: parts.join(", "),
        doriBreakdown: undefined,
      };
    }

    // Both Sizes & Colors Combination Matrix
    const sizeSegments: string[] = [];
    const breakdownObj: { small?: number; medium?: number; big?: number } = {};

    (["big", "medium", "small"] as const).forEach((s) => {
      const colorParts: string[] = [];
      let sizeTotal = 0;
      selectedColorCodes.forEach((c) => {
        const key = `${s}_${c}`;
        const b = matrixBatches[key] || 0;
        if (b > 0) {
          const pcs = b * currentUnit;
          colorParts.push(`${c.toLowerCase()}-${pcs}`);
          sizeTotal += pcs;
        }
      });
      if (sizeTotal > 0) {
        breakdownObj[s] = sizeTotal;
        sizeSegments.push(`${s}=${colorParts.join(",")}`);
      }
    });

    return {
      qtyDisplayStr: sizeSegments.join(" / "),
      doriBreakdown: breakdownObj,
    };
  };

  // Compile full fitting description string
  const compiledFittingSummary = useMemo(() => {
    if (!withFitting) return "Without Fitting (Tape Only)";
    const items = fittingCategories
      .filter((c) => c.selected && c.selected !== "None")
      .map((c) => `${c.label}: ${c.selected}`);
    return items.length > 0 ? items.join(", ") : "Standard Fitting";
  }, [withFitting, fittingCategories]);

  // Submit and Ingest into Respective Ledgers
  const handleCreateOrder = () => {
    if (!clientTitle.trim()) {
      toastError("Required Field", "Please enter the Client Name / Job Title.");
      return;
    }

    const title = clientTitle.trim();
    const today = getFormattedDateToday();

    const hookCat = fittingCategories.find((c) => c.id === "hook");
    const holderCat = fittingCategories.find((c) => c.id === "holder");
    const jointerCat = fittingCategories.find((c) => c.id === "jointer");

    const selectedHook = hookCat?.selected || "Dog Hook";
    const selectedHolder = holderCat?.selected || "DST-V";
    const selectedJointer = jointerCat?.selected || "None";

    const createdLedgers: string[] = [];

    // 1. Create in Lanyard Ledger
    if (includeLanyard) {
      const lanyardPieces = currentAllocated.pieces;
      const { qtyDisplayStr, doriBreakdown } = buildBreakdownData();
      const nextLanyardSN = (lanyardOrders[0]?.sn || 1280) + 1;

      const newLanyardOrder: LanyardOrderEntry = {
        id: `lan_hub_${Date.now()}`,
        sn: nextLanyardSN,
        date: today,
        mplName: title,
        size: lanyardSize,
        qty: lanyardPieces,
        qtyDisplay:
          orderScope === "full_set"
            ? `${lanyardPieces} (Covers ${fullSetCalculations.cardCount} cards + ${fullSetCalculations.spare} spare)`
            : qtyDisplayStr !== String(lanyardPieces)
            ? qtyDisplayStr
            : undefined,
        designDone: false,
        goneForPrint: false,
        isPrinted: false,
        goneForFitting: false,
        fittingStatus: "pending_assignment",
        fittingItem: withFitting ? selectedHolder : "Tape Only",
        hookType: withFitting ? selectedHook : "None",
        jointerType: withFitting ? selectedJointer : "None",
        fittingHardware: compiledFittingSummary,
        doriBreakdown,
        fittingRemarks:
          orderScope === "full_set"
            ? `Full Set: ${fullSetCalculations.cardCount} cards covered with ${lanyardPieces} lanyards`
            : undefined,
      };

      addLanyardOrder(newLanyardOrder);
      createdLedgers.push("Lanyard Ledger");
    }

    // 2. Create in ID Card Ledger
    if (includeIDCard) {
      const cardQty = orderScope === "full_set" ? fullSetCalculations.cardCount : cardCountInput;
      const nextIdcSN = (idCardOrders[0]?.sn || 1500) + 1;

      addIDCardOrder({
        sn: nextIdcSN,
        date: today,
        client: title,
        cardCategory: idCardCategory,
        workQtyDisplay: `${cardQty} ${idCardCategory.toLowerCase()}s`,
        totalQty: cardQty,
        designDone: false,
        sentForPrint: false,
        printOperator: "Kamal Sir",
        fileLocation: idCardFormat,
        status: "kamal",
        holderName: selectedHolder !== "None" ? selectedHolder : "Cards Only",
      });
      createdLedgers.push("ID Card Ledger");
    }

    toastSuccess(
      "Order Ingested Successfully",
      orderScope === "full_set"
        ? `Created Full Set for ${title}: ${fullSetCalculations.cardCount} Cards & ${currentAllocated.pieces} Lanyards ingested into both ledgers.`
        : `Created order for ${title} (${(includeLanyard ? currentAllocated.pieces : cardCountInput).toLocaleString()} pcs). Ingested into ${createdLedgers.join(" and ")}.`
    );

    setClientTitle("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px 20px",
        backgroundColor: "#07090e",
        minHeight: "100vh",
        color: "#f8fafc",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* UNIFIED EXECUTIVE ORDER INTAKE CONSOLE                                     */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          borderRadius: "8px",
          backgroundColor: "#0d1322",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.35)",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* CONSOLE TOP BAR: Clean Segmented Scope Switcher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            paddingBottom: "8px",
          }}
        >
          {/* Compact 3-Way Segmented Scope Switcher */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "#07090e",
              padding: "2px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <button
              type="button"
              onClick={() => setOrderScope("full_set")}
              style={{
                height: "26px",
                padding: "0 12px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: orderScope === "full_set" ? "rgba(34, 197, 94, 0.2)" : "transparent",
                color: orderScope === "full_set" ? "#4ade80" : "#94a3b8",
                boxShadow: orderScope === "full_set" ? "0 0 10px rgba(34, 197, 94, 0.25)" : "none",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
            >
              <Icon name="layers" size={12} color={orderScope === "full_set" ? "#4ade80" : "#94a3b8"} />
              <span>Full Set</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderScope("lanyard_only")}
              style={{
                height: "26px",
                padding: "0 12px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: orderScope === "lanyard_only" ? "rgba(56, 189, 248, 0.2)" : "transparent",
                color: orderScope === "lanyard_only" ? "#38bdf8" : "#94a3b8",
                boxShadow: orderScope === "lanyard_only" ? "0 0 10px rgba(56, 189, 248, 0.25)" : "none",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
            >
              <Icon name="tag" size={12} color={orderScope === "lanyard_only" ? "#38bdf8" : "#94a3b8"} />
              <span>Lanyard</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderScope("idcard_only")}
              style={{
                height: "26px",
                padding: "0 12px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: orderScope === "idcard_only" ? "rgba(168, 85, 247, 0.2)" : "transparent",
                color: orderScope === "idcard_only" ? "#c084fc" : "#94a3b8",
                boxShadow: orderScope === "idcard_only" ? "0 0 10px rgba(168, 85, 247, 0.25)" : "none",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
            >
              <Icon name="credit-card" size={12} color={orderScope === "idcard_only" ? "#c084fc" : "#94a3b8"} />
              <span>ID Card</span>
            </button>
          </div>

          {/* Quick Date & Live Stock Requirements */}
          <div style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "10px" }}>
            <span>Date: <strong style={{ color: "#94a3b8" }}>{getFormattedDateToday()}</strong></span>
            {includeLanyard && (
              <span style={{ color: rollStockReport.statusColor }}>
                {rollStockReport.exactRolls} roll req ({lanyardSize})
              </span>
            )}
          </div>
        </div>

        {/* CONSOLE CORE FORM: Two-Column Integrated Layout (Left = Textarea | Right = Specs + Quantity) */}
        <div style={{ display: "flex", gap: "16px", alignItems: "stretch", flexWrap: "wrap" }}>
          {/* LEFT COLUMN: Large, Spacious 2-Line Client Description Input */}
          <div style={{ width: "460px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
            <textarea
              rows={2}
              placeholder="Client / Job details (e.g. School or Organization Name)..."
              value={clientTitle}
              onChange={(e) => setClientTitle(e.target.value)}
              style={{
                width: "100%",
                height: "76px",
                padding: "10px 14px",
                backgroundColor: "#07090e",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "14px",
                lineHeight: "1.4",
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#38bdf8")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)")}
            />
          </div>

          {/* RIGHT COLUMN: Tightly Grouped Controls (Row 1: Hardware Specs | Row 2: Quantity & Calculation) */}
          <div style={{ flex: 1, minWidth: "520px", display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
            {/* ROW 1: Hardware & Specifications Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {/* Lanyard Size Dropdown */}
              {includeLanyard && (
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setActiveOpenDropdown(activeOpenDropdown === "size" ? null : "size")}
                    style={{
                      height: "30px",
                      padding: "0 10px",
                      borderRadius: "5px",
                      backgroundColor: "#07090e",
                      border: activeOpenDropdown === "size" ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span style={{ color: "#94a3b8", fontSize: "11px" }}>Size:</span>
                    <span style={{ color: "#38bdf8", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{lanyardSize}</span>
                    <span style={{ fontSize: "10.5px", color: "#64748b" }}>({SIZE_BATCH_UNITS[lanyardSize]}x)</span>
                    <Icon name="chevron-down" size={11} color="#94a3b8" />
                  </button>

                  {activeOpenDropdown === "size" && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setActiveOpenDropdown(null)} />
                      <div
                        style={{
                          position: "absolute",
                          top: "34px",
                          left: 0,
                          zIndex: 110,
                          backgroundColor: "#0d1322",
                          border: "1px solid rgba(56, 189, 248, 0.4)",
                          borderRadius: "5px",
                          padding: "3px",
                          minWidth: "140px",
                          boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        {(["12mm", "16mm", "20mm"] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              setLanyardSize(sz);
                              setActiveOpenDropdown(null);
                            }}
                            style={{
                              padding: "5px 8px",
                              borderRadius: "4px",
                              border: "none",
                              backgroundColor: lanyardSize === sz ? "#2563eb" : "transparent",
                              color: "#fff",
                              fontSize: "11.5px",
                              fontWeight: 600,
                              fontFamily: "var(--font-mono)",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>{sz}</span>
                            <span style={{ opacity: 0.7 }}>{SIZE_BATCH_UNITS[sz]}x</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Dynamic Fitting Categories (Hook, Holder, Jointer, etc.) */}
              {includeLanyard &&
                withFitting &&
                fittingCategories.map((cat) => {
                  const isOpen = activeOpenDropdown === cat.id;
                  return (
                    <div key={cat.id} style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => setActiveOpenDropdown(isOpen ? null : cat.id)}
                        style={{
                          height: "30px",
                          padding: "0 10px",
                          borderRadius: "5px",
                          backgroundColor: "#07090e",
                          border: isOpen ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span style={{ color: "#94a3b8", fontSize: "11px" }}>{cat.label}:</span>
                        <span style={{ color: cat.selected !== "None" ? "#e2e8f0" : "#64748b" }}>{cat.selected}</span>
                        <Icon name="chevron-down" size={11} color="#94a3b8" />
                      </button>

                      {isOpen && (
                        <>
                          <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setActiveOpenDropdown(null)} />
                          <div
                            style={{
                              position: "absolute",
                              top: "34px",
                              left: 0,
                              zIndex: 110,
                              backgroundColor: "#0d1322",
                              border: "1px solid rgba(56, 189, 248, 0.4)",
                              borderRadius: "6px",
                              padding: "5px",
                              minWidth: "180px",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
                            <div style={{ padding: "3px 6px", fontSize: "10.5px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>{cat.name}</span>
                              {cat.isDeletable && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCategory(cat.id)}
                                  style={{ border: "none", background: "none", color: "#f87171", fontSize: "10px", cursor: "pointer" }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>

                            {cat.options.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setFittingCategories((prev) =>
                                    prev.map((c) => (c.id === cat.id ? { ...c, selected: opt } : c))
                                  );
                                  setActiveOpenDropdown(null);
                                }}
                                style={{
                                  padding: "5px 8px",
                                  borderRadius: "4px",
                                  border: "none",
                                  backgroundColor: cat.selected === opt ? "#2563eb" : "transparent",
                                  color: "#fff",
                                  fontSize: "11.5px",
                                  textAlign: "left",
                                  cursor: "pointer",
                                }}
                              >
                                {opt}
                              </button>
                            ))}

                            {/* Inline Add Option */}
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "4px", paddingTop: "4px", display: "flex", gap: "4px" }}>
                              <input
                                type="text"
                                placeholder={`+ Add to ${cat.label}`}
                                value={newOptionInputs[cat.id] || ""}
                                onChange={(e) => setNewOptionInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && handleAddOptionToCategory(cat.id)}
                                style={{
                                  flex: 1,
                                  height: "24px",
                                  padding: "0 6px",
                                  backgroundColor: "#07090e",
                                  border: "1px solid rgba(255,255,255,0.18)",
                                  borderRadius: "4px",
                                  color: "#fff",
                                  fontSize: "11px",
                                  outline: "none",
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddOptionToCategory(cat.id)}
                                style={{ padding: "0 8px", borderRadius: "4px", border: "none", backgroundColor: "#2563eb", color: "#fff", fontSize: "10.5px", fontWeight: 600, cursor: "pointer" }}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

              {/* + List button */}
              {includeLanyard && withFitting && (
                <button
                  type="button"
                  onClick={() => setShowAddListModal(true)}
                  style={{
                    height: "30px",
                    padding: "0 8px",
                    borderRadius: "5px",
                    backgroundColor: "rgba(56, 189, 248, 0.08)",
                    border: "1px dashed rgba(56, 189, 248, 0.3)",
                    color: "#38bdf8",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Add new custom fitting category"
                >
                  <Icon name="plus" size={11} />
                  <span>List</span>
                </button>
              )}

              {/* With Fitting toggle */}
              {includeLanyard && (
                <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", cursor: "pointer", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={withFitting}
                    onChange={(e) => setWithFitting(e.target.checked)}
                    style={{ accentColor: "#38bdf8", width: "13px", height: "13px" }}
                  />
                  <span style={{ fontSize: "11.5px", color: withFitting ? "#cbd5e1" : "#64748b" }}>
                    {withFitting ? "Fitting" : "Tape Only"}
                  </span>
                </label>
              )}

              {/* ID Card Category & Format - Custom Popovers matching Design Flow */}
              {includeIDCard && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
                  {/* Category Popover */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setActiveOpenDropdown(activeOpenDropdown === "id_category" ? null : "id_category")}
                      style={{
                        height: "30px",
                        padding: "0 10px",
                        borderRadius: "5px",
                        backgroundColor: "#07090e",
                        border: activeOpenDropdown === "id_category" ? "1px solid #c084fc" : "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span style={{ color: "#94a3b8", fontSize: "11px" }}>Card:</span>
                      <span style={{ color: "#c084fc", fontWeight: 700 }}>{idCardCategory}</span>
                      <Icon name="chevron-down" size={11} color="#94a3b8" />
                    </button>

                    {activeOpenDropdown === "id_category" && (
                      <>
                        <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setActiveOpenDropdown(null)} />
                        <div
                          style={{
                            position: "absolute",
                            top: "34px",
                            right: 0,
                            zIndex: 110,
                            backgroundColor: "#0d1322",
                            border: "1px solid rgba(192, 132, 252, 0.4)",
                            borderRadius: "5px",
                            padding: "3px",
                            minWidth: "140px",
                            boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                          }}
                        >
                          {(["Student", "Staff", "Other"] as const).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setIdCardCategory(cat);
                                setActiveOpenDropdown(null);
                              }}
                              style={{
                                padding: "5px 8px",
                                borderRadius: "4px",
                                border: "none",
                                backgroundColor: idCardCategory === cat ? "#7c3aed" : "transparent",
                                color: "#fff",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                textAlign: "left",
                                cursor: "pointer",
                              }}
                            >
                              {cat} Cards
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Format Popover */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setActiveOpenDropdown(activeOpenDropdown === "id_format" ? null : "id_format")}
                      style={{
                        height: "30px",
                        padding: "0 10px",
                        borderRadius: "5px",
                        backgroundColor: "#07090e",
                        border: activeOpenDropdown === "id_format" ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span style={{ color: "#94a3b8", fontSize: "11px" }}>Format:</span>
                      <span style={{ color: "#38bdf8", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        {idCardFormat === "excel" ? "EXCEL" : idCardFormat === "doc" ? "DOC" : "HARD COPY"}
                      </span>
                      <Icon name="chevron-down" size={11} color="#94a3b8" />
                    </button>

                    {activeOpenDropdown === "id_format" && (
                      <>
                        <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setActiveOpenDropdown(null)} />
                        <div
                          style={{
                            position: "absolute",
                            top: "34px",
                            right: 0,
                            zIndex: 110,
                            backgroundColor: "#0d1322",
                            border: "1px solid rgba(56, 189, 248, 0.4)",
                            borderRadius: "5px",
                            padding: "3px",
                            minWidth: "130px",
                            boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                          }}
                        >
                          {([
                            { id: "excel", label: "EXCEL File" },
                            { id: "doc", label: "DOC File" },
                            { id: "hard copy", label: "HARD COPY" },
                          ] as const).map((fmt) => (
                            <button
                              key={fmt.id}
                              type="button"
                              onClick={() => {
                                setIdCardFormat(fmt.id as IDCardFileFormat);
                                setActiveOpenDropdown(null);
                              }}
                              style={{
                                padding: "5px 8px",
                                borderRadius: "4px",
                                border: "none",
                                backgroundColor: idCardFormat === fmt.id ? "#2563eb" : "transparent",
                                color: "#fff",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                fontFamily: "var(--font-mono)",
                                textAlign: "left",
                                cursor: "pointer",
                              }}
                            >
                              {fmt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ROW 2: Compact Quantity, Ceiling Lanyard Math & Breakdown Trigger */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", backgroundColor: "rgba(255, 255, 255, 0.02)", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              {/* Scope A: Full Set Mode */}
              {orderScope === "full_set" && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  {/* Step 1: Input Exact Cards Count */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#c084fc", textTransform: "uppercase" }}>
                      Cards:
                    </span>
                    <div style={{ display: "inline-flex", alignItems: "center", height: "30px", borderRadius: "5px", backgroundColor: "#07090e", border: "1px solid rgba(168, 85, 247, 0.4)", overflow: "hidden" }}>
                      <button
                        type="button"
                        onClick={() => setCardCountInput(Math.max(1, cardCountInput - 10))}
                        style={{ width: "24px", height: "100%", border: "none", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={cardCountInput}
                        onChange={(e) => setCardCountInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        style={{
                          width: "68px",
                          height: "100%",
                          backgroundColor: "transparent",
                          border: "none",
                          color: "#fff",
                          fontSize: "13.5px",
                          fontWeight: 700,
                          textAlign: "center",
                          fontFamily: "var(--font-mono)",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setCardCountInput(cardCountInput + 10)}
                        style={{ width: "24px", height: "100%", border: "none", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <span style={{ color: "#475569", fontSize: "14px" }}>&rarr;</span>

                  {/* Step 2: Auto-Calculated Lanyards */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase" }}>
                      Lanyards:
                    </span>
                    <div
                      style={{
                        height: "30px",
                        padding: "0 8px",
                        borderRadius: "5px",
                        backgroundColor: "rgba(56, 189, 248, 0.12)",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span style={{ fontSize: "12.5px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#38bdf8" }}>
                        {fullSetCalculations.batches}b = {fullSetCalculations.lanyards.toLocaleString()} pcs
                      </span>
                      <span style={{ fontSize: "10.5px", color: "#4ade80", fontWeight: 600, backgroundColor: "rgba(34, 197, 94, 0.15)", padding: "1px 6px", borderRadius: "3px" }}>
                        +{fullSetCalculations.spare} spare
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scope B: Lanyard Only */}
              {orderScope === "lanyard_only" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase" }}>
                    Lanyard Batches:
                  </span>
                  <div style={{ display: "inline-flex", alignItems: "center", height: "30px", borderRadius: "5px", backgroundColor: "#07090e", border: "1px solid rgba(56, 189, 248, 0.4)", overflow: "hidden" }}>
                    <button
                      type="button"
                      onClick={() => setLanyardOnlyBatches(Math.max(1, lanyardOnlyBatches - 1))}
                      style={{ width: "24px", height: "100%", border: "none", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={lanyardOnlyBatches}
                      onChange={(e) => setLanyardOnlyBatches(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      style={{
                        width: "50px",
                        height: "100%",
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 700,
                        textAlign: "center",
                        fontFamily: "var(--font-mono)",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setLanyardOnlyBatches(lanyardOnlyBatches + 1)}
                      style={{ width: "24px", height: "100%", border: "none", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: "12.5px", color: "#38bdf8", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    = {lanyardOnlyBatches * baseBatchUnit} pcs ({lanyardSize})
                  </span>
                </div>
              )}

              {/* Scope C: ID Card Only */}
              {orderScope === "idcard_only" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#c084fc", textTransform: "uppercase" }}>
                    Target Cards:
                  </span>
                  <div style={{ display: "inline-flex", alignItems: "center", height: "30px", borderRadius: "5px", backgroundColor: "#07090e", border: "1px solid rgba(168, 85, 247, 0.4)", overflow: "hidden" }}>
                    <button
                      type="button"
                      onClick={() => setCardCountInput(Math.max(1, cardCountInput - 10))}
                      style={{ width: "24px", height: "100%", border: "none", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={cardCountInput}
                      onChange={(e) => setCardCountInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      style={{
                        width: "68px",
                        height: "100%",
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#fff",
                        fontSize: "13.5px",
                        fontWeight: 700,
                        textAlign: "center",
                        fontFamily: "var(--font-mono)",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setCardCountInput(cardCountInput + 10)}
                      style={{ width: "24px", height: "100%", border: "none", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: "12.5px", color: "#c084fc", fontWeight: 700 }}>
                    {cardCountInput} cards
                  </span>
                </div>
              )}

              {/* Breakdown Drawer Toggle Button (Right Aligned) */}
              {includeLanyard && (
                <button
                  type="button"
                  onClick={() => setShowBreakdownDrawer(!showBreakdownDrawer)}
                  style={{
                    height: "30px",
                    padding: "0 10px",
                    borderRadius: "5px",
                    backgroundColor: showBreakdownDrawer || breakdownMode !== "uniform" ? "rgba(192, 132, 252, 0.15)" : "rgba(255, 255, 255, 0.04)",
                    border: showBreakdownDrawer || breakdownMode !== "uniform" ? "1px solid #c084fc" : "1px solid rgba(255, 255, 255, 0.12)",
                    color: showBreakdownDrawer || breakdownMode !== "uniform" ? "#c084fc" : "#94a3b8",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Icon name="sliders" size={12} />
                  <span>
                    {showBreakdownDrawer
                      ? "Hide Splits ▴"
                      : breakdownMode !== "uniform"
                      ? `Splits (${currentAllocated.pieces}) ▾`
                      : "Splits ▾"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PROGRESSIVE BREAKDOWN DRAWER (Only when expanded) */}
        {showBreakdownDrawer && includeLanyard && (
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(192, 132, 252, 0.25)",
              borderRadius: "6px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "2px",
            }}
          >
            {/* Mode Switcher Tabs */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                Target: <span style={{ color: "#38bdf8", fontWeight: 700 }}>{targetLanyardBatches} batches ({targetLanyardPieces.toLocaleString()} pcs)</span>
              </div>

              <div style={{ display: "inline-flex", gap: "4px", backgroundColor: "#07090e", padding: "2px", borderRadius: "5px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <button
                  type="button"
                  onClick={() => setBreakdownMode("uniform")}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor: breakdownMode === "uniform" ? "#2563eb" : "transparent",
                    color: breakdownMode === "uniform" ? "#fff" : "#94a3b8",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Uniform (All Same)
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownMode("size_only")}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor: breakdownMode === "size_only" ? "#7c3aed" : "transparent",
                    color: breakdownMode === "size_only" ? "#fff" : "#94a3b8",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Split Sizes
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownMode("color_only")}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor: breakdownMode === "color_only" ? "#d97706" : "transparent",
                    color: breakdownMode === "color_only" ? "#fff" : "#94a3b8",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Split Colors
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownMode("matrix")}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor: breakdownMode === "matrix" ? "#059669" : "transparent",
                    color: breakdownMode === "matrix" ? "#fff" : "#94a3b8",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Matrix (Size &times; Color)
                </button>
              </div>
            </div>

            {/* Sub-view: Uniform Mode */}
            {breakdownMode === "uniform" && (
              <div style={{ padding: "8px 12px", borderRadius: "4px", backgroundColor: "#07090e", border: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Standard uniform single specification batch</span>
                <span style={{ fontSize: "12.5px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#38bdf8" }}>
                  {targetLanyardBatches} batches = {targetLanyardPieces} pcs
                </span>
              </div>
            )}

            {/* Sub-view: Size Only Mode */}
            {breakdownMode === "size_only" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {(["small", "medium", "big"] as const).map((s) => {
                  const b = sizeBatches[s] || 0;
                  const pcs = b * baseBatchUnit;
                  const colorMap = { small: "#38bdf8", medium: "#facc15", big: "#c084fc" };
                  return (
                    <div
                      key={s}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "5px",
                        backgroundColor: "#07090e",
                        border: b > 0 ? `1px solid ${colorMap[s]}` : "1px solid rgba(255, 255, 255, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "capitalize", color: colorMap[s] }}>
                        {s}:
                      </span>
                      <div style={{ display: "inline-flex", alignItems: "center", height: "26px", borderRadius: "4px", backgroundColor: "#0d1322", border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden" }}>
                        <button
                          type="button"
                          onClick={() => setSizeBatches((prev) => ({ ...prev, [s]: Math.max(0, b - 1) }))}
                          style={{ width: "22px", height: "100%", border: "none", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                        >
                          -
                        </button>
                        <span style={{ padding: "0 8px", fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                          {b}b
                        </span>
                        <button
                          type="button"
                          onClick={() => setSizeBatches((prev) => ({ ...prev, [s]: b + 1 }))}
                          style={{ width: "22px", height: "100%", border: "none", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                        >
                          +
                        </button>
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                        {pcs} pcs
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sub-view: Color Only Mode */}
            {breakdownMode === "color_only" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Palette:</span>
                  {AVAILABLE_COLORS.map((col) => {
                    const isSelected = selectedColorCodes.includes(col.code);
                    return (
                      <button
                        key={col.code}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedColorCodes.length > 1) {
                              setSelectedColorCodes(selectedColorCodes.filter((c) => c !== col.code));
                            }
                          } else {
                            setSelectedColorCodes([...selectedColorCodes, col.code]);
                          }
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          backgroundColor: isSelected ? col.bg : "rgba(255, 255, 255, 0.02)",
                          border: isSelected ? `1px solid ${col.border}` : "1px solid rgba(255, 255, 255, 0.08)",
                          color: isSelected ? col.color : "#64748b",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: col.color }} />
                        {col.name} ({col.code})
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
                  {selectedColorCodes.map((code) => {
                    const col = AVAILABLE_COLORS.find((c) => c.code === code) || AVAILABLE_COLORS[0];
                    const b = colorBatches[code] || 0;
                    const pcs = b * baseBatchUnit;
                    return (
                      <div
                        key={code}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "5px",
                          backgroundColor: "#07090e",
                          border: `1px solid ${col.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ fontSize: "11.5px", fontWeight: 700, color: col.color }}>
                          {col.name}:
                        </span>
                        <div style={{ display: "inline-flex", alignItems: "center", height: "24px", borderRadius: "3px", backgroundColor: "#0d1322", border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden" }}>
                          <button
                            type="button"
                            onClick={() => setColorBatches((prev) => ({ ...prev, [code]: Math.max(0, b - 1) }))}
                            style={{ width: "20px", height: "100%", border: "none", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                          >
                            -
                          </button>
                          <span style={{ padding: "0 6px", fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                            {b}b
                          </span>
                          <button
                            type="button"
                            onClick={() => setColorBatches((prev) => ({ ...prev, [code]: b + 1 }))}
                            style={{ width: "20px", height: "100%", border: "none", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                          >
                            +
                          </button>
                        </div>
                        <span style={{ fontSize: "10.5px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                          {pcs}p
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-view: Matrix Mode */}
            {breakdownMode === "matrix" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "11.5px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                        <th style={{ textAlign: "left", padding: "4px 6px", color: "#64748b" }}>Size \ Color</th>
                        {selectedColorCodes.map((code) => {
                          const col = AVAILABLE_COLORS.find((c) => c.code === code);
                          return (
                            <th key={code} style={{ textAlign: "center", padding: "4px 6px", color: col?.color }}>
                              {col?.name} ({code})
                            </th>
                          );
                        })}
                        <th style={{ textAlign: "right", padding: "4px 6px", color: "#94a3b8" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(["small", "medium", "big"] as const).map((s) => {
                        let rowSum = 0;
                        selectedColorCodes.forEach((code) => {
                          rowSum += matrixBatches[`${s}_${code}`] || 0;
                        });
                        return (
                          <tr key={s} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <td style={{ padding: "5px 6px", fontWeight: 700, textTransform: "capitalize", color: s === "small" ? "#38bdf8" : s === "medium" ? "#facc15" : "#c084fc" }}>
                              {s}
                            </td>
                            {selectedColorCodes.map((code) => {
                              const key = `${s}_${code}`;
                              const b = matrixBatches[key] || 0;
                              return (
                                <td key={code} style={{ textAlign: "center", padding: "2px 4px" }}>
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: "1px", backgroundColor: "#07090e", padding: "1px 4px", borderRadius: "3px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <button
                                      type="button"
                                      onClick={() => setMatrixBatches((prev) => ({ ...prev, [key]: Math.max(0, b - 1) }))}
                                      style={{ width: "16px", height: "16px", border: "none", background: "none", color: "#94a3b8", cursor: "pointer", fontWeight: 700 }}
                                    >
                                      -
                                    </button>
                                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: b > 0 ? "#fff" : "#64748b", minWidth: "16px" }}>
                                      {b}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setMatrixBatches((prev) => ({ ...prev, [key]: b + 1 }))}
                                      style={{ width: "16px", height: "16px", border: "none", background: "none", color: "#94a3b8", cursor: "pointer", fontWeight: 700 }}
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                            <td style={{ textAlign: "right", padding: "5px 6px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                              {rowSum}b ({rowSum * baseBatchUnit} pcs)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Smart Remainder Balancer Banner */}
            {breakdownMode !== "uniform" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  borderRadius: "5px",
                  backgroundColor: remainingPieces === 0 ? "rgba(34, 197, 94, 0.12)" : remainingPieces > 0 ? "rgba(234, 179, 8, 0.12)" : "rgba(239, 68, 68, 0.12)",
                  border: remainingPieces === 0 ? "1px solid rgba(34, 197, 94, 0.3)" : remainingPieces > 0 ? "1px solid rgba(234, 179, 8, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: remainingPieces === 0 ? "#4ade80" : remainingPieces > 0 ? "#facc15" : "#f87171" }}>
                    Allocated: {currentAllocated.pieces.toLocaleString()} / {targetLanyardPieces.toLocaleString()} pcs
                  </span>
                  <span style={{ color: "#64748b" }}>&bull;</span>
                  <span style={{ color: remainingPieces === 0 ? "#4ade80" : remainingPieces > 0 ? "#facc15" : "#f87171" }}>
                    {remainingPieces === 0
                      ? "✓ Balanced to target"
                      : remainingPieces > 0
                      ? `${remainingPieces.toLocaleString()} pcs left (${remainingBatches}b)`
                      : `Over by ${Math.abs(remainingPieces).toLocaleString()} pcs`}
                  </span>
                </div>

                {remainingBatches > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (breakdownMode === "size_only") {
                        setSizeBatches((prev) => ({ ...prev, big: (prev.big || 0) + remainingBatches }));
                      } else if (breakdownMode === "color_only") {
                        const firstCode = selectedColorCodes[0];
                        setColorBatches((prev) => ({ ...prev, [firstCode]: (prev[firstCode] || 0) + remainingBatches }));
                      } else if (breakdownMode === "matrix") {
                        const firstKey = `big_${selectedColorCodes[0]}`;
                        setMatrixBatches((prev) => ({ ...prev, [firstKey]: (prev[firstKey] || 0) + remainingBatches }));
                      }
                    }}
                    style={{
                      padding: "2px 8px",
                      borderRadius: "3px",
                      backgroundColor: "rgba(234, 179, 8, 0.2)",
                      border: "1px solid rgba(234, 179, 8, 0.4)",
                      color: "#fde047",
                      fontSize: "10.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Auto-Fill Remainder (+{remainingPieces} pcs)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* CONSOLE FOOTER ACTION BAR (Clean, Single Row) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "8px",
          }}
        >
          {/* Fitting Summary & Scope Tags */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "11.5px" }}>
            <span style={{ color: "#64748b" }}>Active:</span>
            <span style={{ color: "#e2e8f0" }}>{compiledFittingSummary}</span>
            {orderScope === "full_set" && (
              <span style={{ color: "#4ade80", backgroundColor: "rgba(34, 197, 94, 0.12)", padding: "1px 6px", borderRadius: "3px", fontWeight: 600 }}>
                Sync: {fullSetCalculations.cardCount} cards &bull; {currentAllocated.pieces} lanyards
              </span>
            )}
          </div>

          {/* Action Ingest Button */}
          <button
            type="button"
            onClick={handleCreateOrder}
            disabled={includeLanyard ? currentAllocated.pieces <= 0 : cardCountInput <= 0}
            style={{
              height: "36px",
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
              boxShadow: "0 2px 10px rgba(37, 99, 235, 0.35)",
              transition: "all 0.15s ease",
            }}
          >
            <Icon name="plus" size={14} />
            <span>
              {orderScope === "full_set"
                ? `Create Full Set (${currentAllocated.pieces.toLocaleString()} pcs)`
                : orderScope === "lanyard_only"
                ? `Create Order (${currentAllocated.pieces.toLocaleString()} pcs)`
                : `Create Order (${cardCountInput.toLocaleString()} cards)`}
            </span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: ADD BRAND NEW FITTING LIST / CATEGORY                               */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {showAddListModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              backgroundColor: "#0d1322",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "8px",
              padding: "16px 20px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "7px" }}>
                <Icon name="plus" size={15} color="#38bdf8" />
                <span>Create New Fitting Category / List</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddListModal(false)}
                style={{ border: "none", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "11.5px", color: "#94a3b8", margin: 0 }}>
              Add a new fitting category (e.g. "Safety Breakaway", "Metal Rivet", "Adjuster Bead", "Card Pouch"). It will appear as a selectable dropdown on the order form.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: 600 }}>Category Name</label>
              <input
                type="text"
                placeholder="e.g. Safety Breakaway, Metal Rivet, Slider Bead"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                style={{
                  height: "32px",
                  padding: "0 8px",
                  backgroundColor: "#07090e",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: 600 }}>Short Label (Button Prefix)</label>
              <input
                type="text"
                placeholder="e.g. Breakaway, Rivet, Slider"
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                style={{
                  height: "32px",
                  padding: "0 8px",
                  backgroundColor: "#07090e",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: 600 }}>Initial Options (Comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Plastic Quick Release, Metal Release, None"
                value={newCategoryInitialOptions}
                onChange={(e) => setNewCategoryInitialOptions(e.target.value)}
                style={{
                  height: "32px",
                  padding: "0 8px",
                  backgroundColor: "#07090e",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => setShowAddListModal(false)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  fontSize: "11.5px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewFittingCategory}
                style={{
                  padding: "6px 14px",
                  borderRadius: "4px",
                  backgroundColor: "#2563eb",
                  border: "none",
                  color: "#fff",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Create Fitting List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* CROSS-LEDGER ACTIVE ORDERS REGISTRY (Matches Lanyard Ledger Styling)      */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "#0e131f",
          overflow: "hidden",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.02em" }}>
            Cross-Ledger Production Pipeline
          </span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {lanyardOrders.length} Lanyard orders &bull; {idCardOrders.length} ID Card orders
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <th style={{ padding: "12px 14px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "70px" }}>
                  SN
                </th>
                <th style={{ padding: "12px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "85px" }}>
                  DATE
                </th>
                <th style={{ padding: "12px 14px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", minWidth: "220px" }}>
                  CLIENT / JOB TITLE
                </th>
                <th style={{ padding: "12px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "130px" }}>
                  SCOPE
                </th>
                <th style={{ padding: "12px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "95px" }}>
                  QTY
                </th>
                <th style={{ padding: "12px 14px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", minWidth: "190px" }}>
                  FITTING / HARDWARE
                </th>
                <th style={{ padding: "12px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "135px" }}>
                  LANYARD LEDGER
                </th>
                <th style={{ padding: "12px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "135px" }}>
                  ID CARD LEDGER
                </th>
              </tr>
            </thead>
            <tbody>
              {lanyardOrders.slice(0, 15).map((lo) => {
                const linkedIdc = idCardOrders.find(
                  (io) => io.client.toLowerCase() === lo.mplName.toLowerCase() || io.date === lo.date
                );

                return (
                  <tr
                    key={lo.id}
                    style={{
                      height: "48px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "11px 14px", fontFamily: "var(--font-mono)", color: "#38bdf8", fontWeight: 700, fontSize: "12.5px" }}>
                      #{lo.sn}
                    </td>
                    <td style={{ padding: "11px 12px", fontFamily: "var(--font-mono)", color: "#94a3b8", fontSize: "12.5px" }}>
                      {lo.date}
                    </td>
                    <td style={{ padding: "11px 14px", fontWeight: 600, color: "#f1f5f9", fontSize: "13px" }}>
                      {lo.mplName}
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <span style={{ padding: "2px 7px", borderRadius: "3px", backgroundColor: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", fontSize: "11px", fontWeight: 700 }}>
                          LANYARD
                        </span>
                        {linkedIdc && (
                          <span style={{ padding: "2px 7px", borderRadius: "3px", backgroundColor: "rgba(168, 85, 247, 0.12)", color: "#c084fc", fontSize: "11px", fontWeight: 700 }}>
                            ID CARD
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "11px 12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff", fontSize: "13px" }}>
                      {lo.qty.toLocaleString()}
                    </td>
                    <td style={{ padding: "11px 14px", color: "#94a3b8", fontSize: "12.5px" }}>
                      {lo.fittingHardware || lo.fittingItem || "Standard"}
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          backgroundColor: lo.orderReady
                            ? "rgba(34, 197, 94, 0.15)"
                            : lo.goneForFitting
                            ? "rgba(234, 179, 8, 0.15)"
                            : "rgba(255, 255, 255, 0.05)",
                          color: lo.orderReady
                            ? "#4ade80"
                            : lo.goneForFitting
                            ? "#facc15"
                            : lo.isPrinted
                            ? "#38bdf8"
                            : "#94a3b8",
                          fontSize: "11.5px",
                          fontWeight: 600,
                        }}
                      >
                        {lo.orderReady ? "✓ Ready" : lo.goneForFitting ? "In Fitting" : lo.isPrinted ? "Printed" : lo.goneForPrint ? "In Print" : "Design"}
                      </span>
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      {linkedIdc ? (
                        <span style={{ padding: "3px 8px", borderRadius: "4px", backgroundColor: "rgba(168, 85, 247, 0.12)", color: "#c084fc", fontSize: "11.5px", fontWeight: 600 }}>
                          #{linkedIdc.sn}: {linkedIdc.status}
                        </span>
                      ) : (
                        <span style={{ color: "#475569", fontSize: "12px" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
