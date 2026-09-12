import React, { useState, useMemo } from "react";
import { Icon } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";
import { useLanyardStore, LanyardOrderEntry } from "./lanyardOrdersStore";
import { useIDCardStore, IDCardCategory, IDCardFileFormat } from "./idCardOrdersStore";

export type OrderScope = "full_set" | "lanyard_only" | "idcard_only";

function getFormattedDateToday(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

function parseQtyFromDescription(desc: string): number {
  const match = desc.match(/\b(\d[\d,]*)\b/);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ""), 10) || 0;
}

const SCOPE_OPTIONS: { id: OrderScope; label: string; color: string; accent: string; btnColor: string }[] = [
  { id: "full_set", label: "Full Set", color: "#4ade80", accent: "rgba(34, 197, 94, 0.15)", btnColor: "#16a34a" },
  { id: "lanyard_only", label: "Lanyard Only", color: "#38bdf8", accent: "rgba(56, 189, 248, 0.15)", btnColor: "#0284c7" },
  { id: "idcard_only", label: "ID Card Only", color: "#c084fc", accent: "rgba(192, 132, 252, 0.15)", btnColor: "#7c3aed" },
];

const DEFAULT_FITTING_ITEMS = [
  "DST-V",
  "DST-H",
  "Plastic Holder-V",
  "Plastic Holder-H",
  "Cards Only",
  "Silicone Jacket",
  "Acrylic Magnetic Badge",
  "Soft Vinyl Pouch",
  "Without Fitting",
];

const DEFAULT_HOOK_TYPES = [
  "Dog Hook",
  "England Hook",
  "Fish Hook",
  "Crocodile Clip",
  "Round Ring",
  "Oval Hook",
  "None",
];

const DEFAULT_LANYARD_SIZES = ["12mm", "16mm", "20mm", "25mm"];

const DEFAULT_COLORS = [
  { name: "Royal Blue", hex: "#2563eb" },
  { name: "Navy Blue", hex: "#1e3a8a" },
  { name: "Red", hex: "#dc2626" },
  { name: "Maroon", hex: "#881337" },
  { name: "Dark Green", hex: "#15803d" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Black", hex: "#0f172a" },
  { name: "White", hex: "#f8fafc" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Sky Blue", hex: "#0284c7" },
  { name: "Golden", hex: "#d97706" },
];

export const OrdersWorkspaceView: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { orders: lanyardOrders, addOrder: addLanyardOrder } = useLanyardStore();
  const { orders: idCardOrders, addOrder: addIDCardOrder } = useIDCardStore();

  const today = getFormattedDateToday();

  // Core single description input (Takes Left 50% Width)
  const [description, setDescription] = useState<string>("");
  const [orderScope, setOrderScope] = useState<OrderScope>("full_set");

  // Dropdowns: Size, Holders, Hooks (no labels)
  const [lanyardSizes, setLanyardSizes] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("officefloww_lanyard_sizes");
      return s ? JSON.parse(s) : DEFAULT_LANYARD_SIZES;
    } catch {
      return DEFAULT_LANYARD_SIZES;
    }
  });
  const [selectedSize, setSelectedSize] = useState<string>("16mm");

  const [fittingItems, setFittingItems] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("officefloww_fitting_items");
      return s ? JSON.parse(s) : DEFAULT_FITTING_ITEMS;
    } catch {
      return DEFAULT_FITTING_ITEMS;
    }
  });
  const [selectedFitting, setSelectedFitting] = useState<string>("DST-V");

  const [hookTypes, setHookTypes] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("officefloww_hook_types");
      return s ? JSON.parse(s) : DEFAULT_HOOK_TYPES;
    } catch {
      return DEFAULT_HOOK_TYPES;
    }
  });
  const [selectedHook, setSelectedHook] = useState<string>("Dog Hook");

  // Checkbox & Modal States
  const [isColorModalOpen, setIsColorModalOpen] = useState<boolean>(false);
  const [hasColorsConfigured, setHasColorsConfigured] = useState<boolean>(false);
  const [selectedColors, setSelectedColors] = useState<string[]>(["Royal Blue"]);
  const [customColorInput, setCustomColorInput] = useState<string>("");

  const [isSizeModalOpen, setIsSizeModalOpen] = useState<boolean>(false);
  const [hasSizesConfigured, setHasSizesConfigured] = useState<boolean>(false);
  const [customWidth, setCustomWidth] = useState<string>("");
  const [doriSmall, setDoriSmall] = useState<string>("");
  const [doriMedium, setDoriMedium] = useState<string>("");
  const [doriBig, setDoriBig] = useState<string>("");

  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState<boolean>(false);
  const [hasIDSpecsConfigured, setHasIDSpecsConfigured] = useState<boolean>(false);
  const [cardCategory, setCardCategory] = useState<IDCardCategory>("Student");
  const [fileLocation, setFileLocation] = useState<IDCardFileFormat>("excel");
  const [printOperator, setPrintOperator] = useState<string>("Kamal Sir");

  // Add Item to Dropdown Modal
  const [addItemModal, setAddItemModal] = useState<{
    isOpen: boolean;
    type: "fitting" | "hook" | "size" | null;
    title: string;
    inputValue: string;
  }>({
    isOpen: false,
    type: null,
    title: "",
    inputValue: "",
  });

  const parsedQty = useMemo(() => parseQtyFromDescription(description), [description]);
  const includeLanyard = orderScope === "full_set" || orderScope === "lanyard_only";
  const includeIDCard = orderScope === "full_set" || orderScope === "idcard_only";
  const scopeActive = SCOPE_OPTIONS.find((s) => s.id === orderScope)!;
  const hasDesc = description.trim().length > 0;

  // Append spec to description
  const appendSpecToDesc = (specText: string) => {
    setDescription((prev) => {
      const clean = prev.trim();
      if (!clean) return specText;
      if (clean.includes(specText)) return clean;
      return `${clean}, ${specText}`;
    });
  };

  // Color modal handlers
  const toggleColor = (col: string) => {
    setSelectedColors((prev) => {
      if (prev.includes(col)) {
        const next = prev.filter((c) => c !== col);
        return next.length === 0 ? [col] : next;
      } else {
        return [...prev, col];
      }
    });
  };

  const handleAddCustomColor = () => {
    const val = customColorInput.trim();
    if (!val) return;
    if (!selectedColors.includes(val)) {
      setSelectedColors((prev) => [...prev, val]);
    }
    setCustomColorInput("");
  };

  const applyColors = () => {
    setHasColorsConfigured(true);
    setIsColorModalOpen(false);
    if (selectedColors.length > 0) {
      appendSpecToDesc(`${selectedColors.join(" + ")} color`);
    }
    toastSuccess("Colors Applied", `${selectedColors.join(", ")} applied to order.`);
  };

  const applyCustomSizes = () => {
    setHasSizesConfigured(true);
    setIsSizeModalOpen(false);
    const parts: string[] = [];
    if (customWidth.trim()) parts.push(`${customWidth.trim()} width`);
    if (doriSmall.trim()) parts.push(`${doriSmall} Small`);
    if (doriMedium.trim()) parts.push(`${doriMedium} Med`);
    if (doriBig.trim()) parts.push(`${doriBig} Big`);
    if (parts.length > 0) {
      appendSpecToDesc(parts.join(" / "));
    }
    toastSuccess("Sizes Applied", "Custom size & dori breakdown applied.");
  };

  const applyIDSpecs = () => {
    setHasIDSpecsConfigured(true);
    setIsIDCardModalOpen(false);
    appendSpecToDesc(`${cardCategory} ID (${fileLocation.toUpperCase()})`);
    toastSuccess("ID Specs Applied", `${cardCategory} card via ${printOperator} saved.`);
  };

  // Save new custom dropdown item
  const handleSaveCustomItem = () => {
    const val = addItemModal.inputValue.trim();
    if (!val) return;

    if (addItemModal.type === "fitting") {
      if (!fittingItems.includes(val)) {
        const updated = [...fittingItems, val];
        setFittingItems(updated);
        localStorage.setItem("officefloww_fitting_items", JSON.stringify(updated));
      }
      setSelectedFitting(val);
      appendSpecToDesc(`Holder: ${val}`);
      toastSuccess("Holder Added", `"${val}" added and selected.`);
    } else if (addItemModal.type === "hook") {
      if (!hookTypes.includes(val)) {
        const updated = [...hookTypes, val];
        setHookTypes(updated);
        localStorage.setItem("officefloww_hook_types", JSON.stringify(updated));
      }
      setSelectedHook(val);
      appendSpecToDesc(val);
      toastSuccess("Hook Added", `"${val}" added and selected.`);
    } else if (addItemModal.type === "size") {
      if (!lanyardSizes.includes(val)) {
        const updated = [...lanyardSizes, val];
        setLanyardSizes(updated);
        localStorage.setItem("officefloww_lanyard_sizes", JSON.stringify(updated));
      }
      setSelectedSize(val);
      appendSpecToDesc(val);
      toastSuccess("Size Added", `"${val}" added and selected.`);
    }

    setAddItemModal({ isOpen: false, type: null, title: "", inputValue: "" });
  };

  const handleCreateOrder = () => {
    const desc = description.trim();
    if (!desc) {
      toastError("Description Required", "Please enter order details in the description input.");
      return;
    }

    const qty = parsedQty || 100;
    const nextLanyardSN = (lanyardOrders[0]?.sn || 1280) + 1;
    const nextIdcSN = (idCardOrders[0]?.sn || 1500) + 1;

    const sizeVal = (
      hasSizesConfigured && customWidth.trim()
        ? customWidth.trim()
        : selectedSize.includes("12")
        ? "12mm"
        : selectedSize.includes("20")
        ? "20mm"
        : "16mm"
    ) as any;

    const colorsStr = hasColorsConfigured && selectedColors.length > 0 ? selectedColors.join("/") : "";

    if (includeLanyard) {
      const newEntry: LanyardOrderEntry = {
        id: `lan_hub_${Date.now()}`,
        sn: nextLanyardSN,
        date: today,
        mplName: desc,
        size: sizeVal,
        qty,
        designDone: false,
        goneForPrint: false,
        isPrinted: false,
        goneForFitting: false,
        fittingStatus: "pending_assignment",
        fittingItem: selectedFitting,
        hookType: selectedHook,
        jointerType: "None",
        fittingHardware: `${selectedHook} + ${selectedFitting} ${colorsStr ? `(${colorsStr})` : ""}`,
        doriBreakdown: {
          small: parseInt(doriSmall, 10) || undefined,
          medium: parseInt(doriMedium, 10) || undefined,
          big: parseInt(doriBig, 10) || undefined,
        },
        fittingRemarks: desc,
      };
      addLanyardOrder(newEntry);
    }

    if (includeIDCard) {
      addIDCardOrder({
        sn: nextIdcSN,
        date: today,
        client: desc,
        cardCategory: cardCategory,
        workQtyDisplay: `${qty} ${cardCategory.toLowerCase()}s`,
        totalQty: qty,
        designDone: false,
        sentForPrint: false,
        printOperator: printOperator,
        fileLocation: fileLocation,
        status: "kamal",
        holderName: selectedFitting,
        remarks: desc,
      });
    }

    toastSuccess(
      "Order Ingested",
      includeLanyard && includeIDCard
        ? `Full set (${qty} pcs) added to Lanyard #${nextLanyardSN} & ID Card #${nextIdcSN}.`
        : includeLanyard
        ? `Lanyard order #${nextLanyardSN} (${qty} pcs) added.`
        : `ID Card order #${nextIdcSN} (${qty} cards) added.`
    );

    setDescription("");
    setHasColorsConfigured(false);
    setHasSizesConfigured(false);
    setHasIDSpecsConfigured(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "16px 20px",
        backgroundColor: "#080b12",
        minHeight: "100vh",
        color: "#f8fafc",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* ─── STREAMLINED 50/50 COMPACT ORDER BAR (NO TITLES / NO LABELS) ─── */}
      <div
        style={{
          borderRadius: "10px",
          backgroundColor: "#0e131f",
          border: `1.5px solid ${hasDesc ? scopeActive.color + "45" : "rgba(255, 255, 255, 0.08)"}`,
          boxShadow: hasDesc ? `0 4px 20px ${scopeActive.color}15` : "0 2px 12px rgba(0,0,0,0.3)",
          padding: "14px 16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          alignItems: "center",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {/* ──── LEFT 50%: CLEAN SINGLE DESCRIPTION INPUT (NO LABELS / NO DETECT BADGE) ──── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", height: "100%" }}>
          <textarea
            id="order-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleCreateOrder();
              }
            }}
            placeholder="Enter client & order details (e.g. DPS Bhopal — 1000 pcs, 16mm Red, Dog Hook, DST-V holder, Student ID)..."
            rows={3}
            style={{
              width: "100%",
              resize: "none",
              height: "82px",
              padding: "10px 12px",
              backgroundColor: "rgba(255, 255, 255, 0.025)",
              border: `1.5px solid ${hasDesc ? scopeActive.color + "50" : "rgba(255, 255, 255, 0.1)"}`,
              borderRadius: "6px",
              color: "#f1f5f9",
              fontSize: "13.5px",
              lineHeight: "1.55",
              fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "#475569" }}>
            <span>Include: client · qty · size · color · hook · holder</span>
            <span>Ctrl+Enter to submit</span>
          </div>
        </div>

        {/* ──── RIGHT 50%: 2-LEVEL DROPDOWNS & MODAL CHECKBOXES ──── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Top Row: Date & Scope Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                fontFamily: "var(--font-mono)",
                fontSize: "11.5px",
                color: "#94a3b8",
              }}
            >
              📅 {today}
            </span>

            {/* Scope Toggle */}
            <div
              style={{
                display: "inline-flex",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                padding: "2px",
                borderRadius: "5px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                gap: "2px",
              }}
            >
              {SCOPE_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setOrderScope(s.id)}
                  style={{
                    height: "26px",
                    padding: "0 10px",
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor: orderScope === s.id ? s.accent : "transparent",
                    color: orderScope === s.id ? s.color : "#64748b",
                    fontSize: "11.5px",
                    fontWeight: orderScope === s.id ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Level 1: 3 Direct Dropdowns (No labels above) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1fr", gap: "8px" }}>
            {/* Lanyard Size Dropdown */}
            <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
              <select
                value={selectedSize}
                onChange={(e) => {
                  if (e.target.value === "__add__") {
                    setAddItemModal({ isOpen: true, type: "size", title: "Add Lanyard Size", inputValue: "" });
                  } else {
                    setSelectedSize(e.target.value);
                    appendSpecToDesc(e.target.value);
                  }
                }}
                style={{
                  flex: 1,
                  height: "32px",
                  backgroundColor: "#131826",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "4px",
                  padding: "0 8px",
                  color: "#f8fafc",
                  fontSize: "12px",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {lanyardSizes.map((sz) => (
                  <option key={sz} value={sz} style={{ background: "#131826" }}>
                    {sz} Width
                  </option>
                ))}
                <option value="__add__" style={{ background: "#131826", color: "#38bdf8" }}>
                  + Add Size...
                </option>
              </select>
            </div>

            {/* Holder / Fitting Dropdown */}
            <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
              <select
                value={selectedFitting}
                onChange={(e) => {
                  if (e.target.value === "__add__") {
                    setAddItemModal({ isOpen: true, type: "fitting", title: "Add Holder / Fitting", inputValue: "" });
                  } else {
                    setSelectedFitting(e.target.value);
                    appendSpecToDesc(`Holder: ${e.target.value}`);
                  }
                }}
                style={{
                  flex: 1,
                  height: "32px",
                  backgroundColor: "#131826",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "4px",
                  padding: "0 8px",
                  color: "#f8fafc",
                  fontSize: "12px",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {fittingItems.map((item) => (
                  <option key={item} value={item} style={{ background: "#131826" }}>
                    {item}
                  </option>
                ))}
                <option value="__add__" style={{ background: "#131826", color: "#38bdf8" }}>
                  + Add Holder...
                </option>
              </select>
            </div>

            {/* Hook Type Dropdown */}
            <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
              <select
                value={selectedHook}
                onChange={(e) => {
                  if (e.target.value === "__add__") {
                    setAddItemModal({ isOpen: true, type: "hook", title: "Add Hook Type", inputValue: "" });
                  } else {
                    setSelectedHook(e.target.value);
                    appendSpecToDesc(e.target.value);
                  }
                }}
                style={{
                  flex: 1,
                  height: "32px",
                  backgroundColor: "#131826",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "4px",
                  padding: "0 8px",
                  color: "#f8fafc",
                  fontSize: "12px",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {hookTypes.map((h) => (
                  <option key={h} value={h} style={{ background: "#131826" }}>
                    {h}
                  </option>
                ))}
                <option value="__add__" style={{ background: "#131826", color: "#38bdf8" }}>
                  + Add Hook...
                </option>
              </select>
            </div>
          </div>

          {/* Level 2: Interactive Checkboxes That Open Modals */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "11.5px", color: "#cbd5e1" }}>
            {/* Colors Checkbox / Trigger */}
            <div
              onClick={() => setIsColorModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: hasColorsConfigured ? "rgba(56, 189, 248, 0.12)" : "transparent",
                border: hasColorsConfigured ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid transparent",
              }}
            >
              <input
                type="checkbox"
                checked={hasColorsConfigured}
                onChange={(e) => {
                  if (e.target.checked) setIsColorModalOpen(true);
                  else setHasColorsConfigured(false);
                }}
                style={{ accentColor: "#38bdf8", cursor: "pointer" }}
              />
              <span style={{ fontWeight: hasColorsConfigured ? 700 : 500, color: hasColorsConfigured ? "#38bdf8" : "#94a3b8" }}>
                Colors {hasColorsConfigured ? `(${selectedColors.length})` : ""}
              </span>
            </div>

            {/* Custom Sizes / Dori Checkbox / Trigger */}
            <div
              onClick={() => setIsSizeModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: hasSizesConfigured ? "rgba(56, 189, 248, 0.12)" : "transparent",
                border: hasSizesConfigured ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid transparent",
              }}
            >
              <input
                type="checkbox"
                checked={hasSizesConfigured}
                onChange={(e) => {
                  if (e.target.checked) setIsSizeModalOpen(true);
                  else setHasSizesConfigured(false);
                }}
                style={{ accentColor: "#38bdf8", cursor: "pointer" }}
              />
              <span style={{ fontWeight: hasSizesConfigured ? 700 : 500, color: hasSizesConfigured ? "#38bdf8" : "#94a3b8" }}>
                Sizes / Dori {hasSizesConfigured ? "✓" : ""}
              </span>
            </div>

            {/* ID Card Specs Checkbox / Trigger */}
            <div
              onClick={() => setIsIDCardModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: hasIDSpecsConfigured ? "rgba(192, 132, 252, 0.12)" : "transparent",
                border: hasIDSpecsConfigured ? "1px solid rgba(192, 132, 252, 0.3)" : "1px solid transparent",
              }}
            >
              <input
                type="checkbox"
                checked={hasIDSpecsConfigured}
                onChange={(e) => {
                  if (e.target.checked) setIsIDCardModalOpen(true);
                  else setHasIDSpecsConfigured(false);
                }}
                style={{ accentColor: "#c084fc", cursor: "pointer" }}
              />
              <span style={{ fontWeight: hasIDSpecsConfigured ? 700 : 500, color: hasIDSpecsConfigured ? "#c084fc" : "#94a3b8" }}>
                ID Card Specs {hasIDSpecsConfigured ? "✓" : ""}
              </span>
            </div>
          </div>

          {/* Action Row: Ledger Target & Create Button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "2px" }}>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              {"Ingest: "}
              {includeLanyard && <span style={{ color: "#38bdf8", fontWeight: 700 }}>Lanyard</span>}
              {includeLanyard && includeIDCard && " + "}
              {includeIDCard && <span style={{ color: "#c084fc", fontWeight: 700 }}>ID Card</span>}
            </span>

            <button
              type="button"
              disabled={!hasDesc}
              onClick={handleCreateOrder}
              style={{
                height: "34px",
                padding: "0 20px",
                borderRadius: "5px",
                backgroundColor: hasDesc ? scopeActive.btnColor : "#1e293b",
                border: "none",
                color: hasDesc ? "#fff" : "#475569",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: hasDesc ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: hasDesc ? `0 2px 10px ${scopeActive.color}35` : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Icon name="plus" size={13} />
              <span>Create Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: COLOR PALETTE SELECTION ─── */}
      {isColorModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setIsColorModalOpen(false)}
        >
          <div
            style={{
              width: "440px",
              backgroundColor: "#0f1422",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "10px",
              padding: "22px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                🎨 Configure Lanyard Colors
              </span>
              <button
                type="button"
                onClick={() => setIsColorModalOpen(false)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
              Select one or multiple preset ribbon colors, or enter a custom Pantone/color shade.
            </p>

            {/* Color chips */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {DEFAULT_COLORS.map((col) => {
                const isSelected = selectedColors.includes(col.name);
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => toggleColor(col.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "6px 10px",
                      borderRadius: "5px",
                      border: isSelected ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.1)",
                      backgroundColor: isSelected ? "rgba(56, 189, 248, 0.2)" : "#131826",
                      color: isSelected ? "#fff" : "#94a3b8",
                      fontSize: "11.5px",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: col.hex, flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Type custom color (e.g. Neon Green, Dual Tone)..."
                value={customColorInput}
                onChange={(e) => setCustomColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomColor();
                  }
                }}
                style={{
                  flex: 1,
                  height: "36px",
                  backgroundColor: "#161b2c",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "5px",
                  padding: "0 10px",
                  color: "#fff",
                  fontSize: "12.5px",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomColor}
                style={{
                  height: "36px",
                  padding: "0 14px",
                  backgroundColor: "#0284c7",
                  border: "none",
                  borderRadius: "5px",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Add
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => setIsColorModalOpen(false)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "5px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "transparent",
                  color: "#94a3b8",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyColors}
                style={{
                  padding: "7px 18px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply Colors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CUSTOM SIZES & DORI BREAKDOWN ─── */}
      {isSizeModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setIsSizeModalOpen(false)}
        >
          <div
            style={{
              width: "420px",
              backgroundColor: "#0f1422",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "10px",
              padding: "22px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                📏 Custom Lanyard Sizes & Dori Breakdown
              </span>
              <button
                type="button"
                onClick={() => setIsSizeModalOpen(false)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                Custom Width (mm)
              </label>
              <input
                type="text"
                placeholder="e.g. 18mm, 22mm, 30mm..."
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                style={{
                  width: "100%",
                  height: "36px",
                  backgroundColor: "#161b2c",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "5px",
                  padding: "0 10px",
                  color: "#fff",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                Dori Length Breakdown (Pcs):
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Small Dori</span>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={doriSmall}
                    onChange={(e) => setDoriSmall(e.target.value)}
                    style={{
                      width: "100%",
                      height: "32px",
                      backgroundColor: "#161b2c",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "4px",
                      padding: "0 8px",
                      color: "#fff",
                      fontSize: "12px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Medium Dori</span>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={doriMedium}
                    onChange={(e) => setDoriMedium(e.target.value)}
                    style={{
                      width: "100%",
                      height: "32px",
                      backgroundColor: "#161b2c",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "4px",
                      padding: "0 8px",
                      color: "#fff",
                      fontSize: "12px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Big Dori</span>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={doriBig}
                    onChange={(e) => setDoriBig(e.target.value)}
                    style={{
                      width: "100%",
                      height: "32px",
                      backgroundColor: "#161b2c",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "4px",
                      padding: "0 8px",
                      color: "#fff",
                      fontSize: "12px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsSizeModalOpen(false)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "5px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "transparent",
                  color: "#94a3b8",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCustomSizes}
                style={{
                  padding: "7px 18px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply Sizes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ID CARD SPECIFICATIONS ─── */}
      {isIDCardModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setIsIDCardModalOpen(false)}
        >
          <div
            style={{
              width: "420px",
              backgroundColor: "#0f1422",
              border: "1px solid rgba(192, 132, 252, 0.3)",
              borderRadius: "10px",
              padding: "22px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                💳 ID Card Specifications
              </span>
              <button
                type="button"
                onClick={() => setIsIDCardModalOpen(false)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                Classification
              </label>
              <select
                value={cardCategory}
                onChange={(e) => setCardCategory(e.target.value as IDCardCategory)}
                style={{
                  width: "100%",
                  height: "36px",
                  backgroundColor: "#161b2c",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "5px",
                  padding: "0 10px",
                  color: "#fff",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="Student">Student ID</option>
                <option value="Staff">Staff / Teacher ID</option>
                <option value="Other">Corporate / Visitor / Other</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                Data / File Format
              </label>
              <select
                value={fileLocation}
                onChange={(e) => setFileLocation(e.target.value as IDCardFileFormat)}
                style={{
                  width: "100%",
                  height: "36px",
                  backgroundColor: "#161b2c",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "5px",
                  padding: "0 10px",
                  color: "#fff",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="excel">Excel (.xlsx / .csv)</option>
                <option value="doc">Word Document (.docx)</option>
                <option value="hard copy">Hard Copy / Physical Sheet</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                In-House Print Operator
              </label>
              <select
                value={printOperator}
                onChange={(e) => setPrintOperator(e.target.value)}
                style={{
                  width: "100%",
                  height: "36px",
                  backgroundColor: "#161b2c",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "5px",
                  padding: "0 10px",
                  color: "#fff",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="Kamal Sir">Kamal Sir (Thermal Station)</option>
                <option value="Floor Line 1">Floor Line 1 (Direct UV)</option>
                <option value="Floor Line 2">Floor Line 2 (Sublimation)</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsIDCardModalOpen(false)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "5px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "transparent",
                  color: "#94a3b8",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyIDSpecs}
                style={{
                  padding: "7px 18px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#7c3aed",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply Specs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: ADD CUSTOM DROPDOWN ITEM ─── */}
      {addItemModal.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setAddItemModal({ isOpen: false, type: null, title: "", inputValue: "" })}
        >
          <div
            style={{
              width: "380px",
              backgroundColor: "#0f1422",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
                {addItemModal.title}
              </span>
              <button
                type="button"
                onClick={() => setAddItemModal({ isOpen: false, type: null, title: "", inputValue: "" })}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "16px" }}
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="e.g. DST-Extra, Rotary Clip, 30mm..."
              value={addItemModal.inputValue}
              onChange={(e) => setAddItemModal((prev) => ({ ...prev, inputValue: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveCustomItem();
                }
              }}
              style={{
                width: "100%",
                height: "36px",
                backgroundColor: "#161b2c",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                borderRadius: "5px",
                padding: "0 10px",
                color: "#f8fafc",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setAddItemModal({ isOpen: false, type: null, title: "", inputValue: "" })}
                style={{
                  padding: "6px 14px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "transparent",
                  color: "#94a3b8",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomItem}
                disabled={!addItemModal.inputValue.trim()}
                style={{
                  padding: "6px 16px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: addItemModal.inputValue.trim() ? "pointer" : "not-allowed",
                  opacity: addItemModal.inputValue.trim() ? 1 : 0.6,
                }}
              >
                Save & Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RECENT ORDERS LEDGER TABLE ─── */}
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
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>Recent Orders</span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {lanyardOrders.length} Lanyard &bull; {idCardOrders.length} ID Card
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                <th style={{ padding: "10px 14px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", width: "70px" }}>SN</th>
                <th style={{ padding: "10px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", width: "80px" }}>Date</th>
                <th style={{ padding: "10px 14px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Description / Client</th>
                <th style={{ padding: "10px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", width: "120px" }}>Scope</th>
                <th style={{ padding: "10px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", width: "90px" }}>Qty</th>
                <th style={{ padding: "10px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", width: "140px" }}>Lanyard</th>
                <th style={{ padding: "10px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", width: "140px" }}>ID Card</th>
              </tr>
            </thead>
            <tbody>
              {lanyardOrders.length === 0 && idCardOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 14px", textAlign: "center", color: "#475569", fontSize: "12.5px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "7px" }}>
                      <Icon name="package" size={28} color="#1e293b" />
                      <span>No orders yet — enter order details above and click Create</span>
                    </div>
                  </td>
                </tr>
              ) : (
                lanyardOrders.slice(0, 20).map((lo) => {
                  const linkedIdc = idCardOrders.find(
                    (io) => io.client.toLowerCase() === lo.mplName.toLowerCase() || io.date === lo.date
                  );
                  return (
                    <tr
                      key={lo.id}
                      style={{ height: "48px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", transition: "background-color 0.12s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.025)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "#38bdf8", fontWeight: 700, fontSize: "12.5px" }}>#{lo.sn}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "#94a3b8", fontSize: "12px" }}>{lo.date}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 500, color: "#e2e8f0", fontSize: "13px", maxWidth: "380px" }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lo.mplName}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          <span style={{ padding: "2px 7px", borderRadius: "3px", backgroundColor: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", fontSize: "10.5px", fontWeight: 700 }}>LANYARD</span>
                          {linkedIdc && <span style={{ padding: "2px 7px", borderRadius: "3px", backgroundColor: "rgba(168, 85, 247, 0.12)", color: "#c084fc", fontSize: "10.5px", fontWeight: 700 }}>ID CARD</span>}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff", fontSize: "13px" }}>{lo.qty.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            backgroundColor: lo.orderReady ? "rgba(34, 197, 94, 0.15)" : lo.goneForFitting ? "rgba(234, 179, 8, 0.15)" : "rgba(255, 255, 255, 0.05)",
                            color: lo.orderReady ? "#4ade80" : lo.goneForFitting ? "#facc15" : lo.isPrinted ? "#38bdf8" : "#94a3b8",
                            fontSize: "11.5px",
                            fontWeight: 600,
                          }}
                        >
                          {lo.orderReady ? "Ready" : lo.goneForFitting ? "In Fitting" : lo.isPrinted ? "Printed" : lo.goneForPrint ? "In Print" : "Design"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {linkedIdc ? (
                          <span style={{ padding: "3px 8px", borderRadius: "4px", backgroundColor: "rgba(168, 85, 247, 0.12)", color: "#c084fc", fontSize: "11.5px", fontWeight: 600 }}>
                            #{linkedIdc.sn}: {linkedIdc.status}
                          </span>
                        ) : (
                          <span style={{ color: "#334155", fontSize: "12px" }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};