import React, { useState, useEffect } from "react";
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

const SCOPE_OPTIONS: { id: OrderScope; label: string; color: string; accent: string; btnColor: string }[] = [
  { id: "full_set", label: "Full Set (Lanyard + ID Card)", color: "#4ade80", accent: "rgba(34, 197, 94, 0.15)", btnColor: "#16a34a" },
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

const DEFAULT_LANYARD_COLORS = [
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

const DEFAULT_CARD_CATEGORIES = [
  "Student",
  "Staff",
  "Corporate",
  "Visitor / Event",
  "Membership",
  "RFID Proximity",
  "Other",
];

const QUANTITY_PRESETS = [100, 250, 500, 1000, 1500, 2000, 2500, 5000];

export const OrdersWorkspaceView: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { orders: lanyardOrders, addOrder: addLanyardOrder } = useLanyardStore();
  const { orders: idCardOrders, addOrder: addIDCardOrder } = useIDCardStore();

  const today = getFormattedDateToday();

  // Core Order State
  const [orderScope, setOrderScope] = useState<OrderScope>("full_set");
  const [clientName, setClientName] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(500);
  const [description, setDescription] = useState<string>("");
  const [isManualDesc, setIsManualDesc] = useState<boolean>(false);

  // Extensible Item Lists with localStorage persistence
  const [fittingItems, setFittingItems] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("officefloww_fitting_items");
      return stored ? JSON.parse(stored) : DEFAULT_FITTING_ITEMS;
    } catch {
      return DEFAULT_FITTING_ITEMS;
    }
  });
  const [selectedFittingItem, setSelectedFittingItem] = useState<string>("DST-V");

  const [hookTypes, setHookTypes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("officefloww_hook_types");
      return stored ? JSON.parse(stored) : DEFAULT_HOOK_TYPES;
    } catch {
      return DEFAULT_HOOK_TYPES;
    }
  });
  const [selectedHookType, setSelectedHookType] = useState<string>("Dog Hook");

  const [lanyardSizes, setLanyardSizes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("officefloww_lanyard_sizes");
      return stored ? JSON.parse(stored) : DEFAULT_LANYARD_SIZES;
    } catch {
      return DEFAULT_LANYARD_SIZES;
    }
  });
  const [selectedSize, setSelectedSize] = useState<string>("16mm");

  const [cardCategories, setCardCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("officefloww_card_categories");
      return stored ? JSON.parse(stored) : DEFAULT_CARD_CATEGORIES;
    } catch {
      return DEFAULT_CARD_CATEGORIES;
    }
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("Student");

  // Lanyard colors & hardware
  const [selectedColors, setSelectedColors] = useState<string[]>(["Royal Blue"]);
  const [customColorInput, setCustomColorInput] = useState<string>("");
  const [jointerType, setJointerType] = useState<string>("None");

  // ID card fields
  const [fileLocation, setFileLocation] = useState<IDCardFileFormat>("excel");
  const [printOperator, setPrintOperator] = useState<string>("Kamal Sir");

  // Modal / Prompt State for adding custom items to dropdowns
  const [addItemModal, setAddItemModal] = useState<{
    isOpen: boolean;
    type: "fitting" | "hook" | "size" | "category" | null;
    title: string;
    inputValue: string;
  }>({
    isOpen: false,
    type: null,
    title: "",
    inputValue: "",
  });

  const includeLanyard = orderScope === "full_set" || orderScope === "lanyard_only";
  const includeIDCard = orderScope === "full_set" || orderScope === "idcard_only";
  const scopeActive = SCOPE_OPTIONS.find((s) => s.id === orderScope)!;

  // Auto-generate synthesized description when form controls change (unless user manually typed custom text)
  useEffect(() => {
    if (isManualDesc) return;

    const parts: string[] = [];
    const client = clientName.trim() || "Untitled Client";
    parts.push(client);
    parts.push(`${quantity.toLocaleString()} pcs`);

    if (includeLanyard) {
      const colorsStr = selectedColors.length > 0 ? selectedColors.join(" + ") : "Standard";
      parts.push(`${selectedSize} (${colorsStr})`);
      if (selectedHookType && selectedHookType !== "None") parts.push(selectedHookType);
      if (jointerType && jointerType !== "None") parts.push(jointerType);
    }

    if (selectedFittingItem && selectedFittingItem !== "Without Fitting") {
      parts.push(`Holder: ${selectedFittingItem}`);
    }

    if (includeIDCard) {
      parts.push(`${selectedCategory} ID (${fileLocation.toUpperCase()})`);
    }

    setDescription(parts.join(" — "));
  }, [
    clientName,
    quantity,
    orderScope,
    selectedSize,
    selectedColors,
    selectedHookType,
    jointerType,
    selectedFittingItem,
    selectedCategory,
    fileLocation,
    includeLanyard,
    includeIDCard,
    isManualDesc,
  ]);

  // Handle color toggle
  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) => {
      if (prev.includes(colorName)) {
        const next = prev.filter((c) => c !== colorName);
        return next.length === 0 ? [colorName] : next;
      } else {
        return [...prev, colorName];
      }
    });
  };

  // Add custom color from input
  const handleAddCustomColor = () => {
    const clean = customColorInput.trim();
    if (!clean) return;
    if (!selectedColors.includes(clean)) {
      setSelectedColors((prev) => [...prev, clean]);
    }
    setCustomColorInput("");
  };

  // Save new custom item into lists and localStorage
  const handleSaveCustomItem = () => {
    const val = addItemModal.inputValue.trim();
    if (!val) return;

    if (addItemModal.type === "fitting") {
      if (!fittingItems.includes(val)) {
        const updated = [...fittingItems, val];
        setFittingItems(updated);
        localStorage.setItem("officefloww_fitting_items", JSON.stringify(updated));
      }
      setSelectedFittingItem(val);
      toastSuccess("Fitting Item Added", `"${val}" added and selected.`);
    } else if (addItemModal.type === "hook") {
      if (!hookTypes.includes(val)) {
        const updated = [...hookTypes, val];
        setHookTypes(updated);
        localStorage.setItem("officefloww_hook_types", JSON.stringify(updated));
      }
      setSelectedHookType(val);
      toastSuccess("Hook Type Added", `"${val}" added and selected.`);
    } else if (addItemModal.type === "size") {
      if (!lanyardSizes.includes(val)) {
        const updated = [...lanyardSizes, val];
        setLanyardSizes(updated);
        localStorage.setItem("officefloww_lanyard_sizes", JSON.stringify(updated));
      }
      setSelectedSize(val);
      toastSuccess("Size Added", `"${val}" added and selected.`);
    } else if (addItemModal.type === "category") {
      if (!cardCategories.includes(val)) {
        const updated = [...cardCategories, val];
        setCardCategories(updated);
        localStorage.setItem("officefloww_card_categories", JSON.stringify(updated));
      }
      setSelectedCategory(val);
      toastSuccess("Category Added", `"${val}" added and selected.`);
    }

    setAddItemModal({ isOpen: false, type: null, title: "", inputValue: "" });
  };

  const handleCreateOrder = () => {
    const desc = description.trim();
    const client = clientName.trim() || desc.split("—")[0].trim() || "Commercial Client";
    if (!desc) {
      toastError("Description Required", "Please specify order details before creating.");
      return;
    }

    const qty = quantity || 100;
    const nextLanyardSN = (lanyardOrders[0]?.sn || 1280) + 1;
    const nextIdcSN = (idCardOrders[0]?.sn || 1500) + 1;

    if (includeLanyard) {
      const newEntry: LanyardOrderEntry = {
        id: `lan_hub_${Date.now()}`,
        sn: nextLanyardSN,
        date: today,
        mplName: `${client} (${selectedSize} ${selectedColors.join("/")})`,
        size: (selectedSize.includes("12") ? "12mm" : selectedSize.includes("20") ? "20mm" : "16mm") as any,
        qty,
        designDone: false,
        goneForPrint: false,
        isPrinted: false,
        goneForFitting: false,
        fittingStatus: "pending_assignment",
        fittingItem: selectedFittingItem,
        hookType: selectedHookType,
        jointerType: jointerType,
        fittingHardware: `${selectedHookType} + ${selectedFittingItem}`,
        fittingRemarks: desc,
      };
      addLanyardOrder(newEntry);
    }

    if (includeIDCard) {
      addIDCardOrder({
        sn: nextIdcSN,
        date: today,
        client: `${client} (${selectedCategory})`,
        cardCategory: selectedCategory.includes("Staff") ? "Staff" : selectedCategory.includes("Student") ? "Student" : ("Other" as IDCardCategory),
        workQtyDisplay: `${qty} ${selectedCategory.toLowerCase()}s`,
        totalQty: qty,
        designDone: false,
        sentForPrint: false,
        printOperator: printOperator || "Kamal Sir",
        fileLocation: fileLocation,
        status: "kamal",
        holderName: selectedFittingItem,
        remarks: desc,
      });
    }

    toastSuccess(
      "Order Ingested Successfully",
      includeLanyard && includeIDCard
        ? `Full set (${qty} pcs) added to Lanyard SN #${nextLanyardSN} & ID Card SN #${nextIdcSN}.`
        : includeLanyard
        ? `Lanyard order #${nextLanyardSN} (${qty} pcs) added.`
        : `ID Card order #${nextIdcSN} (${qty} cards) added.`
    );

    // Reset fields
    setClientName("");
    setIsManualDesc(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        padding: "20px 24px",
        backgroundColor: "#080b12",
        minHeight: "100vh",
        color: "#f8fafc",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* ─── DUAL-PANEL 50/50 ORDER CREATION WORKSTATION ─── */}
      <div
        style={{
          borderRadius: "12px",
          backgroundColor: "#0d111c",
          border: `1.5px solid ${scopeActive.color}35`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.45), 0 0 20px ${scopeActive.color}10`,
          padding: "22px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {/* Top Header: Date, Scope Segmented Selector */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "5px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontFamily: "var(--font-mono)",
                fontSize: "12.5px",
                color: "#94a3b8",
                letterSpacing: "0.5px",
              }}
            >
              📅 {today}
            </span>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "5px",
                backgroundColor: scopeActive.accent,
                border: `1px solid ${scopeActive.color}50`,
                fontSize: "12.5px",
                fontWeight: 700,
                color: scopeActive.color,
                fontFamily: "var(--font-mono)",
              }}
            >
              {quantity.toLocaleString()} units configured
            </span>
          </div>

          {/* Scope Segmented Buttons */}
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "rgba(15, 20, 32, 0.8)",
              padding: "4px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              gap: "4px",
            }}
          >
            {SCOPE_OPTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setOrderScope(s.id)}
                style={{
                  height: "32px",
                  padding: "0 16px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: orderScope === s.id ? s.btnColor : "transparent",
                  color: orderScope === s.id ? "#ffffff" : "#64748b",
                  fontSize: "12.5px",
                  fontWeight: orderScope === s.id ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: orderScope === s.id ? `0 2px 8px ${s.color}40` : "none",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 50/50 Dual Column Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {/* ──── LEFT COLUMN: Dropdowns & Configuration Controls (50%) ──── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              backgroundColor: "rgba(255, 255, 255, 0.015)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "10px",
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: scopeActive.color }}>
                1. Specifications & Hardware
              </span>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Fast presets & custom lists</span>
            </div>

            {/* Quantity Input & Preset Chips */}
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
                Order Quantity (Pcs / Cards)
              </label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{
                    width: "140px",
                    height: "38px",
                    backgroundColor: "#131826",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "6px",
                    padding: "0 12px",
                    color: "#f8fafc",
                    fontSize: "15px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", flex: 1 }}>
                  {QUANTITY_PRESETS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      style={{
                        padding: "4px 9px",
                        borderRadius: "4px",
                        border: quantity === q ? `1px solid ${scopeActive.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                        backgroundColor: quantity === q ? scopeActive.accent : "rgba(255, 255, 255, 0.03)",
                        color: quantity === q ? scopeActive.color : "#94a3b8",
                        fontSize: "11px",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        cursor: "pointer",
                      }}
                    >
                      {q >= 1000 ? `${q / 1000}k` : q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fitting Item Dropdown with Add Option */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Fitting / Holder Item
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setAddItemModal({
                      isOpen: true,
                      type: "fitting",
                      title: "Add New Fitting / Holder Item",
                      inputValue: "",
                    })
                  }
                  style={{
                    border: "none",
                    background: "none",
                    color: "var(--accent-text, #38bdf8)",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Icon name="plus" size={11} />
                  <span>Add New Item</span>
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={selectedFittingItem}
                  onChange={(e) => setSelectedFittingItem(e.target.value)}
                  style={{
                    flex: 1,
                    height: "38px",
                    backgroundColor: "#131826",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "6px",
                    padding: "0 12px",
                    color: "#f8fafc",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {fittingItems.map((item) => (
                    <option key={item} value={item} style={{ background: "#131826", color: "#fff" }}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ─── LANYARD SECTION (Shown if Full Set or Lanyard Only) ─── */}
            {includeLanyard && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  padding: "14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(56, 189, 248, 0.03)",
                  border: "1px solid rgba(56, 189, 248, 0.15)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                    Lanyard Specifications
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAddItemModal({
                        isOpen: true,
                        type: "size",
                        title: "Add Custom Lanyard Width / Size",
                        inputValue: "",
                      })
                    }
                    style={{
                      border: "none",
                      background: "none",
                      color: "#38bdf8",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Add Size
                  </button>
                </div>

                {/* Size Chips */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "5px" }}>
                    Width / Size:
                  </label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {lanyardSizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "5px",
                          border: selectedSize === sz ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.1)",
                          backgroundColor: selectedSize === sz ? "rgba(56, 189, 248, 0.18)" : "#131826",
                          color: selectedSize === sz ? "#38bdf8" : "#cbd5e1",
                          fontSize: "12px",
                          fontWeight: selectedSize === sz ? 800 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors Palette & Custom Add */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                    Ribbon Color(s):
                  </label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {DEFAULT_LANYARD_COLORS.map((col) => {
                      const isSelected = selectedColors.includes(col.name);
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => toggleColor(col.name)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 9px",
                            borderRadius: "4px",
                            border: isSelected ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.08)",
                            backgroundColor: isSelected ? "rgba(56, 189, 248, 0.15)" : "#131826",
                            color: isSelected ? "#ffffff" : "#94a3b8",
                            fontSize: "11px",
                            fontWeight: isSelected ? 700 : 500,
                            cursor: "pointer",
                          }}
                        >
                          <span
                            style={{
                              width: "9px",
                              height: "9px",
                              borderRadius: "50%",
                              backgroundColor: col.hex,
                              border: "1px solid rgba(255,255,255,0.3)",
                              flexShrink: 0,
                            }}
                          />
                          <span>{col.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom color input */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      placeholder="Add custom color (e.g. Pantone 286C, Dual Tone)..."
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
                        height: "32px",
                        backgroundColor: "#0d111a",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "4px",
                        padding: "0 10px",
                        color: "#f8fafc",
                        fontSize: "12px",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomColor}
                      style={{
                        height: "32px",
                        padding: "0 12px",
                        backgroundColor: "rgba(56, 189, 248, 0.2)",
                        border: "1px solid rgba(56, 189, 248, 0.4)",
                        borderRadius: "4px",
                        color: "#38bdf8",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Hook & Jointer Dropdowns */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>Hook Type</label>
                      <span
                        onClick={() =>
                          setAddItemModal({
                            isOpen: true,
                            type: "hook",
                            title: "Add Custom Hook Type",
                            inputValue: "",
                          })
                        }
                        style={{ fontSize: "10.5px", color: "#38bdf8", cursor: "pointer" }}
                      >
                        + Add
                      </span>
                    </div>
                    <select
                      value={selectedHookType}
                      onChange={(e) => setSelectedHookType(e.target.value)}
                      style={{
                        width: "100%",
                        height: "34px",
                        backgroundColor: "#131826",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "4px",
                        padding: "0 8px",
                        color: "#f8fafc",
                        fontSize: "12.5px",
                        outline: "none",
                      }}
                    >
                      {hookTypes.map((h) => (
                        <option key={h} value={h} style={{ background: "#131826" }}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                      Safety Jointer / Buckle
                    </label>
                    <select
                      value={jointerType}
                      onChange={(e) => setJointerType(e.target.value)}
                      style={{
                        width: "100%",
                        height: "34px",
                        backgroundColor: "#131826",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "4px",
                        padding: "0 8px",
                        color: "#f8fafc",
                        fontSize: "12.5px",
                        outline: "none",
                      }}
                    >
                      <option value="None" style={{ background: "#131826" }}>None</option>
                      <option value="Safety Breakaway" style={{ background: "#131826" }}>Safety Breakaway</option>
                      <option value="Plastic Release Buckle" style={{ background: "#131826" }}>Plastic Release Buckle</option>
                      <option value="Mobile Attachment Loop" style={{ background: "#131826" }}>Mobile Loop</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ─── ID CARD SECTION (Shown if Full Set or ID Card Only) ─── */}
            {includeIDCard && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  padding: "14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(192, 132, 252, 0.03)",
                  border: "1px solid rgba(192, 132, 252, 0.15)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#c084fc", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                    ID Card Specifications
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAddItemModal({
                        isOpen: true,
                        type: "category",
                        title: "Add Custom Card Category",
                        inputValue: "",
                      })
                    }
                    style={{
                      border: "none",
                      background: "none",
                      color: "#c084fc",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Add Category
                  </button>
                </div>

                {/* Card Category Chips */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "5px" }}>
                    Card Classification:
                  </label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {cardCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "4px",
                          border: selectedCategory === cat ? "1.5px solid #c084fc" : "1px solid rgba(255, 255, 255, 0.1)",
                          backgroundColor: selectedCategory === cat ? "rgba(192, 132, 252, 0.18)" : "#131826",
                          color: selectedCategory === cat ? "#c084fc" : "#cbd5e1",
                          fontSize: "11.5px",
                          fontWeight: selectedCategory === cat ? 800 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File format & Operator */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                      Data / File Format
                    </label>
                    <select
                      value={fileLocation}
                      onChange={(e) => setFileLocation(e.target.value as IDCardFileFormat)}
                      style={{
                        width: "100%",
                        height: "34px",
                        backgroundColor: "#131826",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "4px",
                        padding: "0 8px",
                        color: "#f8fafc",
                        fontSize: "12.5px",
                        outline: "none",
                      }}
                    >
                      <option value="excel" style={{ background: "#131826" }}>Excel (.xlsx / .csv)</option>
                      <option value="doc" style={{ background: "#131826" }}>Word Document (.docx)</option>
                      <option value="hard copy" style={{ background: "#131826" }}>Hard Copy / Manual</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                      In-House Print Operator
                    </label>
                    <select
                      value={printOperator}
                      onChange={(e) => setPrintOperator(e.target.value)}
                      style={{
                        width: "100%",
                        height: "34px",
                        backgroundColor: "#131826",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "4px",
                        padding: "0 8px",
                        color: "#f8fafc",
                        fontSize: "12.5px",
                        outline: "none",
                      }}
                    >
                      <option value="Kamal Sir" style={{ background: "#131826" }}>Kamal Sir (Thermal Station)</option>
                      <option value="Floor Line 1" style={{ background: "#131826" }}>Floor Line 1 (Direct UV)</option>
                      <option value="Floor Line 2" style={{ background: "#131826" }}>Floor Line 2 (Sublimation)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ──── RIGHT COLUMN: Client, Synthesized Description & Ingestion (50%) ──── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "16px",
              backgroundColor: "rgba(255, 255, 255, 0.015)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "10px",
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: scopeActive.color }}>
                  2. Client & Order Description
                </span>
                {isManualDesc && (
                  <button
                    type="button"
                    onClick={() => setIsManualDesc(false)}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#38bdf8",
                      fontSize: "11px",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    🔄 Auto-Sync with Form
                  </button>
                )}
              </div>

              {/* Client Name Input */}
              <div>
                <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
                  Client / Institution Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. DPS Bhopal, St. Xavier's High School, Apollo Hospitals..."
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (isManualDesc) setIsManualDesc(false);
                  }}
                  style={{
                    width: "100%",
                    height: "38px",
                    backgroundColor: "#131826",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "6px",
                    padding: "0 12px",
                    color: "#f8fafc",
                    fontSize: "14px",
                    fontWeight: 600,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Description Textarea (Takes Half Height & Full Width of Right Column) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Synthesized Order Description & Notes
                  </label>
                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>
                    {isManualDesc ? "✏️ Custom text mode" : "⚡ Live auto-generated"}
                  </span>
                </div>

                <textarea
                  id="order-description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setIsManualDesc(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleCreateOrder();
                    }
                  }}
                  placeholder="Order description synthesized from form settings..."
                  rows={6}
                  style={{
                    width: "100%",
                    resize: "vertical",
                    minHeight: "150px",
                    padding: "12px 14px",
                    backgroundColor: "#111624",
                    border: `1.5px solid ${description.trim() ? scopeActive.color + "50" : "rgba(255, 255, 255, 0.12)"}`,
                    borderRadius: "8px",
                    color: "#f1f5f9",
                    fontSize: "14px",
                    lineHeight: "1.7",
                    fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease",
                  }}
                />
                <div style={{ fontSize: "11px", color: "#475569", display: "flex", justifyContent: "space-between" }}>
                  <span>Editable description stored with ledger entry</span>
                  <span>Ctrl+Enter to submit</span>
                </div>
              </div>
            </div>

            {/* Bottom Ingestion Action & Ledger Target Summary */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "14px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>
                  Target Ledger:
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {includeLanyard && (
                    <span style={{ padding: "2px 8px", borderRadius: "4px", backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", fontSize: "11px", fontWeight: 700 }}>
                      Lanyard Ledger
                    </span>
                  )}
                  {includeIDCard && (
                    <span style={{ padding: "2px 8px", borderRadius: "4px", backgroundColor: "rgba(192, 132, 252, 0.15)", color: "#c084fc", fontSize: "11px", fontWeight: 700 }}>
                      ID Card Ledger
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={!description.trim()}
                onClick={handleCreateOrder}
                style={{
                  height: "44px",
                  padding: "0 28px",
                  borderRadius: "6px",
                  backgroundColor: description.trim() ? scopeActive.btnColor : "#1e293b",
                  border: "none",
                  color: description.trim() ? "#fff" : "#475569",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: description.trim() ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: description.trim() ? `0 4px 16px ${scopeActive.color}40` : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon name="plus" size={15} />
                <span>+ Ingest & Create Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL: ADD CUSTOM ITEM (Fitting, Hook, Size, Category) ─── */}
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
              width: "420px",
              backgroundColor: "#0f1422",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "10px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                {addItemModal.title}
              </span>
              <button
                type="button"
                onClick={() => setAddItemModal({ isOpen: false, type: null, title: "", inputValue: "" })}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "12.5px", color: "#94a3b8", lineHeight: "1.4", margin: 0 }}>
              Type the name of the new specification. It will be added to your permanent catalog and selected for this order.
            </p>

            <input
              type="text"
              autoFocus
              placeholder="e.g. DST-Extra-Large, Rotary Clip, 30mm, VIP Pass..."
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
                height: "40px",
                backgroundColor: "#161b2c",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                borderRadius: "6px",
                padding: "0 12px",
                color: "#f8fafc",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setAddItemModal({ isOpen: false, type: null, title: "", inputValue: "" })}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "transparent",
                  color: "#94a3b8",
                  fontSize: "13px",
                  fontWeight: 600,
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
                  padding: "8px 18px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  fontSize: "13px",
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
          borderRadius: "10px",
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
            padding: "12px 18px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#f1f5f9" }}>Recent Orders Ledger</span>
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
                      <span>No orders yet — configure an order above and click Ingest</span>
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