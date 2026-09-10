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

interface CheckboxBoxProps {
  checked: boolean;
  locked?: boolean;
  color?: string;
}

const CheckboxBox: React.FC<CheckboxBoxProps> = ({
  checked,
  locked = false,
  color = "#22c55e",
}) => (
  <div
    style={{
      width: "14px",
      height: "14px",
      borderRadius: "3px",
      border: locked
        ? "1px solid rgba(255, 255, 255, 0.2)"
        : checked
        ? `1.5px solid ${color}`
        : "1.5px solid rgba(255, 255, 255, 0.35)",
      backgroundColor: checked && !locked ? color : "rgba(255, 255, 255, 0.04)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      transition: "all 0.15s ease",
    }}
  >
    {checked && !locked && (
      <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
        <path d="M1 4L3.5 6.5L9 1" stroke="#080b12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
    {locked && <Icon name="lock" size={8} color="#64748b" />}
  </div>
);

export const SIZE_BATCH_UNITS: Record<"12mm" | "16mm" | "20mm", number> = {
  "12mm": 37,
  "16mm": 30,
  "20mm": 25,
};

const DEFAULT_HOOKS = ["Dog Hook", "England Hook", "Fish Hook", "None"] as const;
const DEFAULT_HOLDERS = ["DST-V", "DST-H", "CCH", "PH", "PV"] as const;

const STORAGE_HOOKS_KEY = "officefloww_custom_hooks";
const STORAGE_HOLDERS_KEY = "officefloww_custom_holders";

function loadSavedHooks(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_HOOKS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return [...DEFAULT_HOOKS];
}

function loadSavedHolders(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_HOLDERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return [...DEFAULT_HOLDERS];
}

function parseQtyBreakdown(qtyDisplay?: string, doriBreakdown?: { small?: number; medium?: number; big?: number }): { label: string; color: string; bg: string; border: string; tooltip?: string }[] | null {
  if (doriBreakdown && (doriBreakdown.small || doriBreakdown.medium || doriBreakdown.big)) {
    const badges: { label: string; color: string; bg: string; border: string; tooltip?: string }[] = [];
    if (doriBreakdown.small) {
      badges.push({
        label: `Small: ${doriBreakdown.small}`,
        color: "#38bdf8",
        bg: "rgba(56, 189, 248, 0.12)",
        border: "rgba(56, 189, 248, 0.3)",
      });
    }
    if (doriBreakdown.medium) {
      badges.push({
        label: `Med: ${doriBreakdown.medium}`,
        color: "#facc15",
        bg: "rgba(234, 179, 8, 0.12)",
        border: "rgba(234, 179, 8, 0.3)",
      });
    }
    if (doriBreakdown.big) {
      badges.push({
        label: `Big: ${doriBreakdown.big}`,
        color: "#c084fc",
        bg: "rgba(168, 85, 247, 0.12)",
        border: "rgba(168, 85, 247, 0.3)",
      });
    }
    if (badges.length > 0) return badges;
  }

  if (!qtyDisplay) return null;
  const str = qtyDisplay.replace(/pcs/gi, "").trim();
  if (!str) return null;

  const lower = str.toLowerCase();

  // Pattern with slash: e.g. "big=r-555,b-370,y-333,o-333 /small=r-148, b-74, y-74, o-74"
  if (str.includes("/")) {
    const segments = str.split("/").map((s) => s.trim()).filter(Boolean);
    const badges: { label: string; color: string; bg: string; border: string; tooltip?: string }[] = [];

    for (const seg of segments) {
      const segLower = seg.toLowerCase();
      let name = "Size";
      let color = "#94a3b8";
      let bg = "rgba(255, 255, 255, 0.05)";
      let border = "rgba(255, 255, 255, 0.15)";

      if (segLower.includes("big")) {
        name = "Big";
        color = "#c084fc";
        bg = "rgba(168, 85, 247, 0.12)";
        border = "rgba(168, 85, 247, 0.3)";
      } else if (segLower.includes("small")) {
        name = "Small";
        color = "#38bdf8";
        bg = "rgba(56, 189, 248, 0.12)";
        border = "rgba(56, 189, 248, 0.3)";
      } else if (segLower.includes("med")) {
        name = "Med";
        color = "#facc15";
        bg = "rgba(234, 179, 8, 0.12)";
        border = "rgba(234, 179, 8, 0.3)";
      }

      // Sum all numeric values in this segment
      const nums = seg.match(/\d+/g);
      const total = nums ? nums.map(Number).reduce((a, b) => a + b, 0) : null;
      const label = total ? `${name}: ${total.toLocaleString()}` : seg;

      badges.push({
        label,
        color,
        bg,
        border,
        tooltip: seg,
      });
    }
    return badges;
  }

  // Pattern: "Small: 37, Big: 74" or "74 medium"
  if (lower.includes("big") || lower.includes("small") || lower.includes("medium") || lower.includes("med")) {
    const cleanStr = str.replace(/^\d+\s*\((.*)\)$/, "$1");
    const parts = cleanStr.split(",").map((p) => p.trim()).filter(Boolean);
    const badges: { label: string; color: string; bg: string; border: string; tooltip?: string }[] = [];

    for (const p of parts) {
      const pLower = p.toLowerCase();
      let color = "#94a3b8";
      let bg = "rgba(255, 255, 255, 0.05)";
      let border = "rgba(255, 255, 255, 0.15)";

      if (pLower.includes("big")) {
        color = "#c084fc";
        bg = "rgba(168, 85, 247, 0.12)";
        border = "rgba(168, 85, 247, 0.3)";
      } else if (pLower.includes("small")) {
        color = "#38bdf8";
        bg = "rgba(56, 189, 248, 0.12)";
        border = "rgba(56, 189, 248, 0.3)";
      } else if (pLower.includes("med")) {
        color = "#facc15";
        bg = "rgba(234, 179, 8, 0.12)";
        border = "rgba(234, 179, 8, 0.3)";
      }

      badges.push({ label: p, color, bg, border });
    }
    return badges.length > 0 ? badges : null;
  }

  // Pattern: Color codes like "y-222,m-222,g-222,b-259" or "r-666,b-370,g-925"
  if (str.includes("-") && (str.includes(",") || str.includes("="))) {
    const items = str.split(",").map((i) => i.trim()).filter(Boolean);
    return items.map((item) => {
      const iLower = item.toLowerCase();
      let color = "#94a3b8";
      let bg = "rgba(255, 255, 255, 0.05)";
      let border = "rgba(255, 255, 255, 0.15)";

      if (iLower.startsWith("r-")) {
        color = "#f87171";
        bg = "rgba(239, 68, 68, 0.12)";
        border = "rgba(239, 68, 68, 0.3)";
      } else if (iLower.startsWith("y-")) {
        color = "#facc15";
        bg = "rgba(234, 179, 8, 0.12)";
        border = "rgba(234, 179, 8, 0.3)";
      } else if (iLower.startsWith("g-")) {
        color = "#4ade80";
        bg = "rgba(34, 197, 94, 0.12)";
        border = "rgba(34, 197, 94, 0.3)";
      } else if (iLower.startsWith("b-")) {
        color = "#60a5fa";
        bg = "rgba(59, 130, 246, 0.12)";
        border = "rgba(59, 130, 246, 0.3)";
      } else if (iLower.startsWith("m-") || iLower.startsWith("o-")) {
        color = "#fb923c";
        bg = "rgba(249, 115, 22, 0.12)";
        border = "rgba(249, 115, 22, 0.3)";
      }

      return { label: item.toUpperCase(), color, bg, border };
    });
  }

  // Fallback if not purely numeric
  if (isNaN(Number(str))) {
    return [{ label: str, color: "#94a3b8", bg: "rgba(255, 255, 255, 0.05)", border: "rgba(255, 255, 255, 0.12)" }];
  }

  return null;
}

export const LanyardWorkspaceView: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const {
    orders,
    setOrders,
    addOrder,
    deleteOrder,
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

  // Intake bar states with size-based multiplier engine (12mm=37, 16mm=30, 20mm=25)
  const [newMplName, setNewMplName] = useState("");
  const [newSize, setNewSize] = useState<"12mm" | "16mm" | "20mm">("12mm");
  const [batchCount, setBatchCount] = useState<number>(5); // e.g. 5 batches = 185 pcs for 12mm
  const [customQtyStr, setCustomQtyStr] = useState<string>("185");

  // Dynamic Hooks List & Add Hook Popover
  const [hookList, setHookList] = useState<string[]>(loadSavedHooks);
  const [newHook, setNewHook] = useState<string>("Dog Hook");
  const [showAddHookPopover, setShowAddHookPopover] = useState<boolean>(false);
  const [newCustomHookName, setNewCustomHookName] = useState<string>("");

  // Dynamic Holders List & Add Holder Popover
  const [holderList, setHolderList] = useState<string[]>(loadSavedHolders);
  const [newFittingItem, setNewFittingItem] = useState<string>("");
  const [showAddHolderPopover, setShowAddHolderPopover] = useState<boolean>(false);
  const [newCustomHolderName, setNewCustomHolderName] = useState<string>("");

  // Compact Dropdown Selector States (Size, Hook, Holder)
  const [showSizeDropdown, setShowSizeDropdown] = useState<boolean>(false);
  const [showHookDropdown, setShowHookDropdown] = useState<boolean>(false);
  const [showHolderDropdown, setShowHolderDropdown] = useState<boolean>(false);

  // Split Sizes (Small / Medium / Big) State with Checkbox
  const [splitSizesEnabled, setSplitSizesEnabled] = useState<boolean>(false);
  const [splitSmallEnabled, setSplitSmallEnabled] = useState<boolean>(true);
  const [splitMediumEnabled, setSplitMediumEnabled] = useState<boolean>(false);
  const [splitBigEnabled, setSplitBigEnabled] = useState<boolean>(true);
  const [splitSmallBatches, setSplitSmallBatches] = useState<number>(1);
  const [splitMediumBatches, setSplitMediumBatches] = useState<number>(0);
  const [splitBigBatches, setSplitBigBatches] = useState<number>(2);

  const baseBatchUnit = SIZE_BATCH_UNITS[newSize];

  // Prospective Intake Stock Calculation & Quantities
  const totalCalculatedQty = useMemo(() => {
    if (splitSizesEnabled) {
      const s = splitSmallEnabled ? splitSmallBatches : 0;
      const m = splitMediumEnabled ? splitMediumBatches : 0;
      const b = splitBigEnabled ? splitBigBatches : 0;
      return (s + m + b) * baseBatchUnit;
    }
    const parsed = parseInt(customQtyStr.replace(/\D/g, ""), 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    return batchCount * baseBatchUnit;
  }, [
    splitSizesEnabled,
    splitSmallEnabled,
    splitSmallBatches,
    splitMediumEnabled,
    splitMediumBatches,
    splitBigEnabled,
    splitBigBatches,
    customQtyStr,
    batchCount,
    baseBatchUnit,
  ]);

  const handleAddCustomHook = () => {
    const trimmed = newCustomHookName.trim();
    if (!trimmed) return;
    if (!hookList.includes(trimmed)) {
      const updated = [...hookList, trimmed];
      setHookList(updated);
      try {
        localStorage.setItem(STORAGE_HOOKS_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
    setNewHook(trimmed);
    setNewCustomHookName("");
    setShowAddHookPopover(false);
    setShowHookDropdown(false);
    toastSuccess("Hook Added", `Added "${trimmed}" to hook options.`);
  };

  const handleDeleteCustomHook = (hookToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = hookList.filter((h) => h !== hookToDelete);
    setHookList(updated);
    try {
      localStorage.setItem(STORAGE_HOOKS_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    if (newHook === hookToDelete) {
      setNewHook(updated[0] || "None");
    }
    toastSuccess("Hook Removed", `Removed "${hookToDelete}" from hook options.`);
  };

  const handleAddCustomHolder = () => {
    const trimmed = newCustomHolderName.trim().toUpperCase();
    if (!trimmed) return;
    if (!holderList.includes(trimmed)) {
      const updated = [...holderList, trimmed];
      setHolderList(updated);
      try {
        localStorage.setItem(STORAGE_HOLDERS_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
    setNewFittingItem(trimmed);
    setNewCustomHolderName("");
    setShowAddHolderPopover(false);
    setShowHolderDropdown(false);
    toastSuccess("Holder Added", `Added "${trimmed}" to card holder presets.`);
  };

  const handleDeleteCustomHolder = (holderToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = holderList.filter((h) => h !== holderToDelete);
    setHolderList(updated);
    try {
      localStorage.setItem(STORAGE_HOLDERS_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    if (newFittingItem.toUpperCase() === holderToDelete) {
      setNewFittingItem("");
    }
    toastSuccess("Holder Removed", `Removed "${holderToDelete}" from holder presets.`);
  };

  const isMultipleValid = useMemo(() => {
    if (splitSizesEnabled) return totalCalculatedQty > 0;
    return totalCalculatedQty >= baseBatchUnit && totalCalculatedQty % baseBatchUnit === 0;
  }, [splitSizesEnabled, totalCalculatedQty, baseBatchUnit]);

  const nearestMultiples = useMemo(() => {
    if (isMultipleValid) return null;
    const lower = Math.max(baseBatchUnit, Math.floor(totalCalculatedQty / baseBatchUnit) * baseBatchUnit);
    const upper = Math.max(baseBatchUnit, Math.ceil(totalCalculatedQty / baseBatchUnit) * baseBatchUnit);
    return {
      lower,
      upper: upper === lower ? upper + baseBatchUnit : upper,
    };
  }, [isMultipleValid, totalCalculatedQty, baseBatchUnit]);

  const handleSizeChange = (sz: "12mm" | "16mm" | "20mm") => {
    setNewSize(sz);
    const newUnit = SIZE_BATCH_UNITS[sz];
    setCustomQtyStr(String(batchCount * newUnit));
  };

  const handleBatchStep = (delta: number) => {
    const nextBatches = Math.max(1, batchCount + delta);
    setBatchCount(nextBatches);
    setCustomQtyStr(String(nextBatches * baseBatchUnit));
  };

  const handleCustomQtyChange = (val: string) => {
    const numeric = val.replace(/\D/g, "");
    setCustomQtyStr(numeric);
    const parsed = parseInt(numeric, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const b = Math.floor(parsed / baseBatchUnit);
      if (b > 0) setBatchCount(b);
    }
  };

  const snapToMultiple = (targetQty: number) => {
    setCustomQtyStr(String(targetQty));
    setBatchCount(Math.round(targetQty / baseBatchUnit));
  };

  const intakeStockReport = useMemo(() => {
    return getRollStats(newSize, totalCalculatedQty > 0 ? totalCalculatedQty : baseBatchUnit);
  }, [getRollStats, newSize, totalCalculatedQty, baseBatchUnit]);

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

  // Divided Labour Dropdown Popover State
  const [openSplitDropdownOrderId, setOpenSplitDropdownOrderId] = useState<string | null>(null);

  // Secure Order Deletion Confirmation Modal State (with random 4-digit PIN verification)
  const [deleteModalOrder, setDeleteModalOrder] = useState<LanyardOrderEntry | null>(null);
  const [deleteGeneratedPin, setDeleteGeneratedPin] = useState<string>("");
  const [deleteInputPin, setDeleteInputPin] = useState<string>("");

  // Open Delete Confirmation Modal and generate a random 4-digit PIN (Completed orders protected)
  const openDeleteModal = (order: LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.orderReady) {
      toastError("Order Protected", `Order #${order.sn} is marked as Completed and cannot be deleted.`);
      return;
    }
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setDeleteModalOrder(order);
    setDeleteGeneratedPin(pin);
    setDeleteInputPin("");
  };

  // Confirm permanent order deletion
  const handleConfirmDelete = () => {
    if (!deleteModalOrder) return;
    if (deleteInputPin.trim() !== deleteGeneratedPin) {
      toastError("Verification Failed", "Security PIN does not match. Please re-enter the 4-digit PIN.");
      return;
    }
    const orderSn = deleteModalOrder.sn;
    deleteOrder(deleteModalOrder.id);
    toastSuccess("Order Deleted", `Order #${orderSn} was permanently deleted.`);
    setDeleteModalOrder(null);
    setDeleteInputPin("");
    setDeleteGeneratedPin("");
  };

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

  // Step 1: Checkbox Toggle Design (Pending <-> OK)
  const handleToggleDesign = (order: LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextDesign = order.designDone === false ? true : false;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== order.id) return o;
        if (!nextDesign) {
          // Unchecking Design locks subsequent print & fitting steps
          return {
            ...o,
            designDone: false,
            goneForPrint: false,
            isPrinted: false,
            printedQty: 0,
            goneForFitting: false,
            fittingStatus: "pending_assignment",
            completedQty: 0,
          };
        }
        return { ...o, designDone: true };
      })
    );
    if (nextDesign) {
      toastSuccess("Design Approved", `Order #${order.sn}: Artwork approved ✓ (Unlocked Step 2: Print).`);
    } else {
      toastSuccess("Design Pending", `Order #${order.sn}: Artwork marked pending proof.`);
    }
  };

  // Step 2: Checkbox Toggle Gone to Print (Send to Print <-> In Print ⚡)
  const handleToggleGoneForPrint = (order: LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const isStep1Done = order.designDone !== false;
    if (!isStep1Done) {
      toastError("Step Locked", "Please approve Design (Step 1) first before sending to print.");
      return;
    }
    const nextGone = !order.goneForPrint;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== order.id) return o;
        if (!nextGone) {
          // Unchecking Gone to Print locks Step 3 (Printed) & Step 4 (Fitting)
          return {
            ...o,
            goneForPrint: false,
            isPrinted: false,
            printedQty: 0,
            goneForFitting: false,
            fittingStatus: "pending_assignment",
            completedQty: 0,
          };
        }
        return {
          ...o,
          goneForPrint: true,
          printAllocations:
            o.printAllocations && o.printAllocations.length > 0
              ? o.printAllocations
              : [{ contractorId: "pr-1", contractorName: "In-House Sublimation", qty: o.qty }],
        };
      })
    );
    if (nextGone) {
      toastSuccess("Gone to Print", `Order #${order.sn}: Sent to sublimation floor ⚡ (Unlocked Step 3: Printed).`);
    } else {
      toastSuccess("Print Reset", `Order #${order.sn}: Returned to print queue.`);
    }
  };

  // Step 3: Checkbox Toggle Printed (Mark Printed <-> Printed ✓)
  const handleTogglePrinted = (order: LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order.goneForPrint) {
      toastError("Step Locked", "Order must be Sent to Print (Step 2) first before marking as printed.");
      return;
    }
    const nextPrinted = !order.isPrinted;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== order.id) return o;
        if (!nextPrinted) {
          // Unchecking Printed locks Step 4 (Fitting)
          return {
            ...o,
            isPrinted: false,
            printedQty: 0,
            goneForFitting: false,
            fittingStatus: "pending_assignment",
            completedQty: 0,
          };
        }
        return {
          ...o,
          isPrinted: true,
          printedQty: o.qty,
        };
      })
    );
    if (nextPrinted) {
      toastSuccess("Printed OK", `Order #${order.sn}: Sublimation verified (${order.qty.toLocaleString()} pcs) ✓ (Unlocked Step 4: Fitting).`);
    } else {
      toastSuccess("Print Reset", `Order #${order.sn}: Sublimation marked incomplete.`);
    }
  };

  // Step 4 Option A: Without Fitting (1-Click direct Done)
  const handleSetWithoutFitting = (order: LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order.isPrinted) {
      toastError("Step Locked", "Printing (Step 3) must be verified before completing order.");
      return;
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              fittingContractorId: "wof",
              fittingContractorName: "wof",
              goneForFitting: true,
              fittingStatus: "ready",
              // NOTE: orderReady remains false until user explicitly clicks "Mark Ready" in the Status column
              fittingHardware: "None (Direct Supply)",
              fittingRemarks: o.fittingRemarks || "Client requested without fitting",
            }
          : o
      )
    );
    toastSuccess("Without Fitting Set", `Order #${order.sn}: Fitting stage done (Without Fitting). Click "Mark Ready" in Status column to complete.`);
  };

  // Step 4 Option B: Toggle Fitting Done (for contractor assigned orders)
  const handleToggleFittingDone = (order: LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order.isPrinted) {
      toastError("Step Locked", "Printing (Step 3) must be verified first.");
      return;
    }
    const isDone = order.fittingStatus === "ready";
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              fittingStatus: isDone ? "in_fitting" : "ready",
              goneForFitting: true,
              // NOTE: orderReady remains false until user explicitly clicks "Mark Ready" in the Status column
            }
          : o
      )
    );
    if (!isDone) {
      toastSuccess("Fitting Done", `Order #${order.sn}: Fitting assembled & verified. Click "Mark Ready" in Status column to complete.`);
    } else {
      toastSuccess("Status Updated", `Order #${order.sn}: Returned to In Fitting.`);
    }
  };

  // Step 4: Reset Fitting (to switch between Without Fitting and Labour Contractor)
  const handleResetFitting = (order: LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              fittingContractorId: undefined,
              fittingContractorName: undefined,
              goneForFitting: false,
              fittingStatus: "pending_assignment",
              completedQty: 0,
              fittingAllocations: [],
            }
          : o
      )
    );
    toastSuccess("Fitting Reset", `Order #${order.sn}: Cleared fitting choice. Select Labour or Without Fitting.`);
  };

  // Helper for clicking locked steps
  const handleLockedStepClick = (stepName: string, requiredStep: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toastError("Step Locked", `Please complete "${requiredStep}" before advancing to "${stepName}".`);
  };

  // Overall Order Status Toggle (Ready <-> Active)
  const handleCycleOrderStatus = (order: LanyardOrderEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const isReady = order.orderReady === true;
    if (!isReady) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                designDone: true,
                goneForPrint: true,
                isPrinted: true,
                printedQty: o.qty,
                goneForFitting: true,
                fittingContractorId: o.fittingContractorId || "wof",
                fittingContractorName: o.fittingContractorName || "wof",
                fittingStatus: "ready",
                orderReady: true,
                completedQty: o.qty,
              }
            : o
        )
      );
      toastSuccess("Order Completed", `Order #${order.sn} marked Ready and moved to Completed queue.`);
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                orderReady: false,
                completedQty: 0,
              }
            : o
        )
      );
      toastSuccess("Order Re-opened", `Order #${order.sn} returned to active queue.`);
    }
  };

  // Ingest Order Handler with Size Multiplier Rule & Dori Breakdown Support
  const handleIngestOrder = () => {
    if (!newMplName.trim()) {
      toastError("Required Field", "Please enter an Order / MPL Client Name.");
      return;
    }

    const currentUnit = SIZE_BATCH_UNITS[newSize];
    const finalQty = totalCalculatedQty;

    // Enforce size-based minimum & multiple rule
    if (finalQty < currentUnit) {
      toastError(
        "Minimum Quantity Required",
        `For ${newSize} lanyards, minimum order quantity is ${currentUnit} pcs (1 batch).`
      );
      return;
    }

    if (finalQty % currentUnit !== 0) {
      const nearest = Math.round(finalQty / currentUnit) * currentUnit;
      toastError(
        "Invalid Batch Multiplier",
        `Quantity for ${newSize} must be in multiples of ${currentUnit} pcs. Nearest valid: ${nearest} pcs (${nearest / currentUnit} batches).`
      );
      return;
    }

    const nextSN = getNextSN(orders);
    const holderUpper = newFittingItem.trim().toUpperCase();

    // Construct clean display title
    let title = newMplName.trim();
    if (holderUpper && !title.toUpperCase().includes(holderUpper)) {
      title = `${title} (${holderUpper})`;
    }

    // Build hardware specification
    const hardwareParts: string[] = [];
    if (newHook && newHook !== "None") {
      hardwareParts.push(`${newSize} ${newHook}`);
    } else {
      hardwareParts.push(`${newSize} Tape`);
    }
    if (holderUpper) {
      hardwareParts.push(holderUpper);
    }
    
    // Auto-detect jointer: size automatically dictates jointer size (e.g. 20mm -> 20mm jointer)
    const hasJointer =
      title.toLowerCase().includes("jointer") ||
      title.toLowerCase().includes("buckle") ||
      title.toLowerCase().includes("-j") ||
      holderUpper.includes("-J") ||
      holderUpper.includes("JOINTER");

    if (hasJointer) {
      hardwareParts.push("Safety Jointer");
    }
    const fittingHardware = hardwareParts.join(" + ");

    let qtyDisplayStr = String(finalQty);
    let doriBreakdownObj: { small?: number; medium?: number; big?: number } | undefined = undefined;

    if (splitSizesEnabled) {
      const sPcs = splitSmallEnabled && splitSmallBatches > 0 ? splitSmallBatches * currentUnit : 0;
      const mPcs = splitMediumEnabled && splitMediumBatches > 0 ? splitMediumBatches * currentUnit : 0;
      const bPcs = splitBigEnabled && splitBigBatches > 0 ? splitBigBatches * currentUnit : 0;

      if (sPcs > 0 || mPcs > 0 || bPcs > 0) {
        doriBreakdownObj = {
          ...(sPcs > 0 ? { small: sPcs } : {}),
          ...(mPcs > 0 ? { medium: mPcs } : {}),
          ...(bPcs > 0 ? { big: bPcs } : {}),
        };
        const parts: string[] = [];
        if (bPcs > 0) parts.push(`Big: ${bPcs}`);
        if (mPcs > 0) parts.push(`Med: ${mPcs}`);
        if (sPcs > 0) parts.push(`Small: ${sPcs}`);
        qtyDisplayStr = `${finalQty} (${parts.join(", ")})`;
      }
    }

    const newEntry = addOrder({
      sn: nextSN,
      date: getFormattedDateToday(),
      mplName: title,
      size: newSize,
      qty: finalQty,
      qtyDisplay: qtyDisplayStr,
      designDone: false,
      goneForPrint: false,
      isPrinted: false,
      goneForFitting: false,
      fittingHardware,
      fittingStatus: "pending_assignment",
      fittingRemarks: "",
      orderReady: false,
      fittingItem: holderUpper || undefined,
      hookType: newHook,
      jointerType: hasJointer ? `${newSize}-j` : undefined,
      doriBreakdown: doriBreakdownObj,
    });

    setNewMplName("");
    setNewFittingItem("");
    toastSuccess(
      "Order Ingested",
      `Added #${nextSN}: ${newEntry.mplName} (${finalQty.toLocaleString()} pcs in ${finalQty / currentUnit} batches of ${currentUnit})`
    );
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

    const activeOrders = orders.filter((o) => o.orderReady !== true);
    const activeCount = activeOrders.length;
    const activeVolume = activeOrders.reduce((sum, o) => sum + (o.qty || 0), 0);

    const completedOrders = orders.filter((o) => o.orderReady === true);
    const completedCount = completedOrders.length;
    const completedVolume = completedOrders.reduce((sum, o) => sum + (o.qty || 0), 0);

    const inPrintOrders = orders.filter((o) => o.goneForPrint && !o.isPrinted && o.orderReady !== true);
    const inPrintVolume = inPrintOrders.reduce((sum, o) => sum + (o.qty || 0), 0);

    const inFittingOrders = orders.filter((o) => o.fittingStatus === "in_fitting" && o.orderReady !== true);
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

  // Hardware Stock Calculations for Top KPI Deck (Live stock for Hooks & Jointers)
  const hookStats = useMemo(() => {
    const dogHook = stockItems.find((s) => s.code === "dog-hook")?.availableStock ?? 8500;
    const englandHook = stockItems.find((s) => s.code === "england-hook")?.availableStock ?? 6200;
    const fishHook =
      stockItems.find((s) => s.code === "fish-hook" || s.code === "plastic-hook")?.availableStock ?? 11400;
    const total = dogHook + englandHook + fishHook;
    return { total, dogHook, englandHook, fishHook };
  }, [stockItems]);

  const jointerStats = useMemo(() => {
    const clipsOrJointers = stockItems.find((s) => s.code === "clips")?.availableStock ?? 18;
    const total = typeof clipsOrJointers === "number" && clipsOrJointers < 100 ? clipsOrJointers * 1000 : 18000;
    return {
      total,
      j16mm: 9500,
      j12mm: 8500,
    };
  }, [stockItems]);

  // Filtered Orders (Latest on Top!)
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // 1. View Tab Filter (Active Queue hides completed by default)
        if (viewTab === "ACTIVE" && o.orderReady === true) return false;
        if (viewTab === "COMPLETED" && o.orderReady !== true) return false;

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
      {/* 1. LANYARD LEDGER QUEUE & FILTER TOOLBAR                                  */}
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
                <th style={{ padding: "12px 14px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", minWidth: "210px" }}>
                  ORDER / MPL CLIENT
                </th>
                <th style={{ padding: "12px 10px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "90px" }}>
                  QTY
                </th>
                <th style={{ padding: "12px 8px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "135px" }}>
                  1. DESIGN
                </th>
                <th style={{ padding: "12px 8px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "140px" }}>
                  2. GONE TO PRINT
                </th>
                <th style={{ padding: "12px 8px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "135px" }}>
                  3. PRINTED
                </th>
                <th style={{ padding: "12px 8px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", minWidth: "310px" }}>
                  4. FITTING &amp; LABOUR
                </th>
                <th style={{ padding: "12px 8px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", width: "115px", textAlign: "center" }}>
                  STATUS
                </th>
                <th style={{ padding: "12px 10px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", textAlign: "right", width: "85px" }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px 16px", textAlign: "center", color: "#64748b" }}>
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
                filteredOrders.map((entry) => {
                  const isReady = entry.orderReady === true;
                  const contractor = contractors.find((c) => c.id === entry.fittingContractorId);
                  const isMix = entry.fittingContractorId === "mix";
                  const rollReport = getRollStats(entry.size, entry.qty);

                  const pQty = entry.printedQty ?? (entry.isPrinted ? entry.qty : 0);
                  const sQty = entry.sentToLabourQty ?? (entry.goneForFitting ? entry.qty : 0);
                  const rQty = entry.completedQty ?? (entry.orderReady ? entry.qty : 0);
                  const leftQty = Math.max(0, entry.qty - rQty);

                  // Sequential Unlocking Step Calculations
                  const isStep1Done = entry.designDone !== false;
                  const isStep2Unlocked = isStep1Done;
                  const isStep2Done = entry.goneForPrint === true;
                  const isStep3Unlocked = isStep2Done;
                  const isStep3Done = entry.isPrinted === true;
                  const isStep4Unlocked = isStep3Done;
                  const isWithoutFitting = entry.fittingContractorId === "wof";
                  const isStep4Done = isWithoutFitting || entry.fittingStatus === "ready";
                  const allStepsDone = isStep1Done && isStep2Done && isStep3Done && isStep4Done;

                  return (
                    <tr
                      key={entry.id}
                      style={{
                        height: "48px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        backgroundColor: isReady ? "rgba(255, 255, 255, 0.015)" : "transparent",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = isReady ? "rgba(255, 255, 255, 0.015)" : "transparent")
                      }
                    >
                      {/* 1. SN */}
                      <td style={{ padding: "11px 12px", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "12.5px", color: "#94a3b8" }}>
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
                              fontSize: "11px",
                              fontWeight: 600,
                              fontFamily: "var(--font-mono)",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              color: "#cbd5e1",
                            }}
                          >
                            {entry.size}
                          </span>

                          {entry.fittingItem && (
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 600,
                                fontFamily: "var(--font-mono)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                backgroundColor: "rgba(255, 255, 255, 0.04)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                color: "#94a3b8",
                              }}
                            >
                              {entry.fittingItem}
                            </span>
                          )}

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
                                border: "1px solid rgba(255, 255, 255, 0.3)",
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
                                fontSize: "14px",
                                fontWeight: 600,
                                color: isReady ? "#94a3b8" : "#f1f5f9",
                                cursor: "pointer",
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {formatClientTitle(entry.mplName)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Quantity (No pcs mentioned) */}
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
                              border: "1px solid rgba(255, 255, 255, 0.3)",
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
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
                              {entry.qty.toLocaleString()}
                            </span>
                            {(() => {
                              const breakdownBadges = parseQtyBreakdown(entry.qtyDisplay, entry.doriBreakdown);
                              if (!breakdownBadges || breakdownBadges.length === 0) return null;
                              return (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                                  {breakdownBadges.map((b, idx) => (
                                    <span
                                      key={idx}
                                      title={b.tooltip || b.label}
                                      style={{
                                        padding: "1px 6px",
                                        borderRadius: "4px",
                                        backgroundColor: b.bg,
                                        border: `1px solid ${b.border}`,
                                        color: b.color,
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        fontFamily: "var(--font-mono)",
                                        whiteSpace: "nowrap",
                                        display: "inline-flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      {b.label}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </td>

                      {/* 5. Step 1: Design Status (Checkbox Style - Muted Palette) */}
                      <td style={{ padding: "10px 8px" }}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleDesign(entry, e)}
                          title={
                            isStep1Done
                              ? "Step 1: Design Approved ✓. Click to mark Pending."
                              : "Step 1: Click to approve Design (Unlocks Step 2: Print)."
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            width: "100%",
                            height: "30px",
                            boxSizing: "border-box",
                            padding: "0 10px",
                            borderRadius: "5px",
                            backgroundColor: isStep1Done
                              ? "rgba(255, 255, 255, 0.04)"
                              : "rgba(255, 255, 255, 0.02)",
                            border: isStep1Done
                              ? "1px solid rgba(255, 255, 255, 0.12)"
                              : "1px solid rgba(255, 255, 255, 0.08)",
                            color: isStep1Done ? "#f1f5f9" : "#94a3b8",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <CheckboxBox checked={isStep1Done} color="#10b981" />
                          <span>{isStep1Done ? "Design OK" : "Design Pending"}</span>
                        </button>
                      </td>

                      {/* 6. Step 2: Gone to Print (Checkbox Style - Muted Palette) */}
                      <td style={{ padding: "10px 8px" }}>
                        {!isStep2Unlocked ? (
                          <div
                            onClick={(e) => handleLockedStepClick("Print Stage", "Step 1: Design", e)}
                            title="Locked: Approve Design (Step 1) first"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              width: "100%",
                              height: "30px",
                              boxSizing: "border-box",
                              padding: "0 10px",
                              borderRadius: "5px",
                              backgroundColor: "transparent",
                              border: "1px dashed rgba(255, 255, 255, 0.07)",
                              color: "#475569",
                              fontSize: "11.5px",
                              cursor: "not-allowed",
                              opacity: 0.6,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <CheckboxBox checked={false} locked={true} />
                            <span>Locked</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleToggleGoneForPrint(entry, e)}
                            title={
                              isStep2Done
                                ? "Step 2: In Print ⚡. Click to return to pending."
                                : "Step 2: Click to send to Print floor (Unlocks Step 3: Printed)."
                            }
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              width: "100%",
                              height: "30px",
                              boxSizing: "border-box",
                              padding: "0 10px",
                              borderRadius: "5px",
                              backgroundColor: isStep2Done
                                ? "rgba(255, 255, 255, 0.04)"
                                : "rgba(255, 255, 255, 0.02)",
                              border: isStep2Done
                                ? "1px solid rgba(255, 255, 255, 0.12)"
                                : "1px solid rgba(255, 255, 255, 0.08)",
                              color: isStep2Done ? "#f1f5f9" : "#94a3b8",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <CheckboxBox checked={isStep2Done} color="#38bdf8" />
                            <span>{isStep2Done ? "In Print ⚡" : "Send to Print"}</span>
                          </button>
                        )}
                      </td>

                      {/* 7. Step 3: Printed (Checkbox Style - Muted Palette) */}
                      <td style={{ padding: "10px 8px" }}>
                        {!isStep3Unlocked ? (
                          <div
                            onClick={(e) => handleLockedStepClick("Printed Stage", "Step 2: Gone to Print", e)}
                            title="Locked: Order must be Sent to Print (Step 2) first"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              width: "100%",
                              height: "30px",
                              boxSizing: "border-box",
                              padding: "0 10px",
                              borderRadius: "5px",
                              backgroundColor: "transparent",
                              border: "1px dashed rgba(255, 255, 255, 0.07)",
                              color: "#475569",
                              fontSize: "11.5px",
                              cursor: "not-allowed",
                              opacity: 0.6,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <CheckboxBox checked={false} locked={true} />
                            <span>Locked</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleTogglePrinted(entry, e)}
                            title={
                              isStep3Done
                                ? "Step 3: Printed verified ✓. Click to mark incomplete."
                                : "Step 3: Click to verify sublimation printing (Unlocks Step 4: Fitting)."
                            }
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              width: "100%",
                              height: "30px",
                              boxSizing: "border-box",
                              padding: "0 10px",
                              borderRadius: "5px",
                              backgroundColor: isStep3Done
                                ? "rgba(255, 255, 255, 0.04)"
                                : "rgba(255, 255, 255, 0.02)",
                              border: isStep3Done
                                ? "1px solid rgba(255, 255, 255, 0.12)"
                                : "1px solid rgba(255, 255, 255, 0.08)",
                              color: isStep3Done ? "#f1f5f9" : "#94a3b8",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <CheckboxBox checked={isStep3Done} color="#10b981" />
                            <span>{isStep3Done ? "Printed ✓" : "Mark Printed"}</span>
                          </button>
                        )}
                      </td>

                      {/* 8. Step 4: Fitting / Labour Assignment (Muted Palette) */}
                      <td style={{ padding: "10px 8px" }}>
                        {!isStep4Unlocked ? (
                          <div
                            onClick={(e) => handleLockedStepClick("Fitting Stage", "Step 3: Printed", e)}
                            title="Locked: Sublimation printing must be completed first"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              width: "100%",
                              height: "30px",
                              boxSizing: "border-box",
                              padding: "0 10px",
                              borderRadius: "5px",
                              backgroundColor: "transparent",
                              border: "1px dashed rgba(255, 255, 255, 0.07)",
                              color: "#475569",
                              fontSize: "11.5px",
                              cursor: "not-allowed",
                              opacity: 0.6,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <CheckboxBox checked={false} locked={true} />
                            <span>Locked (Print first)</span>
                          </div>
                        ) : isWithoutFitting ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                flex: 1,
                                height: "30px",
                                boxSizing: "border-box",
                                padding: "0 10px",
                                borderRadius: "5px",
                                backgroundColor: "rgba(255, 255, 255, 0.04)",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                color: "#f1f5f9",
                                fontSize: "12px",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <CheckboxBox checked={true} color="#10b981" />
                              <span>Without Fitting (Done)</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleResetFitting(entry, e)}
                              title="Reset fitting option (Assign Labour instead)"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "30px",
                                height: "30px",
                                flexShrink: 0,
                                boxSizing: "border-box",
                                borderRadius: "5px",
                                backgroundColor: "rgba(255, 255, 255, 0.04)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                color: "#94a3b8",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <Icon name="refresh" size={12} color="#94a3b8" />
                            </button>
                          </div>
                        ) : entry.fittingContractorId ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                            {/* 1. Contractor Pill or Divided Multi-Contractor Dropdown */}
                            <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                              {entry.fittingContractorId === "mix" || (entry.fittingAllocations && entry.fittingAllocations.length > 0) ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenSplitDropdownOrderId(openSplitDropdownOrderId === entry.id ? null : entry.id);
                                    }}
                                    title="Divided across multiple contractors. Click to view allocation breakdown."
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: "5px",
                                      width: "100%",
                                      height: "30px",
                                      boxSizing: "border-box",
                                      padding: "0 8px",
                                      borderRadius: "5px",
                                      backgroundColor: "rgba(56, 189, 248, 0.08)",
                                      border: "1px solid rgba(56, 189, 248, 0.3)",
                                      color: "#38bdf8",
                                      fontSize: "11.5px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: "5px", overflow: "hidden" }}>
                                      <Icon name="users" size={12} color="#38bdf8" />
                                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                        Divided ({entry.fittingAllocations?.length || "2+"})
                                      </span>
                                    </div>
                                    <Icon name="chevron-down" size={10} color="#38bdf8" />
                                  </button>

                                  {/* Popover showing split breakdown */}
                                  {openSplitDropdownOrderId === entry.id && (
                                    <>
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenSplitDropdownOrderId(null);
                                        }}
                                        style={{
                                          position: "fixed",
                                          top: 0,
                                          left: 0,
                                          right: 0,
                                          bottom: 0,
                                          zIndex: 80,
                                        }}
                                      />
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          position: "absolute",
                                          top: "34px",
                                          left: 0,
                                          zIndex: 81,
                                          minWidth: "230px",
                                          backgroundColor: "#0d111c",
                                          border: "1px solid rgba(255, 255, 255, 0.15)",
                                          borderRadius: "8px",
                                          padding: "8px",
                                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6)",
                                        }}
                                      >
                                        <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 4px 6px" }}>
                                          Divided Allocation ({entry.fittingAllocations?.length || 0})
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                          {entry.fittingAllocations && entry.fittingAllocations.length > 0 ? (
                                            entry.fittingAllocations.map((alloc) => (
                                              <div
                                                key={alloc.contractorId}
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "space-between",
                                                  padding: "5px 7px",
                                                  borderRadius: "5px",
                                                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                                                  border: "1px solid rgba(255, 255, 255, 0.06)",
                                                }}
                                              >
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                  <Icon name="user" size={11} color="#38bdf8" />
                                                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#f1f5f9" }}>
                                                    {alloc.contractorName.split(" (")[0]}
                                                  </span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                  <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#facc15" }}>
                                                    {alloc.qty.toLocaleString()}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenSplitDropdownOrderId(null);
                                                      handleJumpToLabourPage(alloc.contractorId);
                                                    }}
                                                    title={`Open ${alloc.contractorName}'s ledger`}
                                                    style={{
                                                      display: "inline-flex",
                                                      alignItems: "center",
                                                      padding: "2px 5px",
                                                      borderRadius: "4px",
                                                      backgroundColor: "rgba(56, 189, 248, 0.12)",
                                                      border: "1px solid rgba(56, 189, 248, 0.3)",
                                                      color: "#38bdf8",
                                                      fontSize: "10px",
                                                      fontWeight: 600,
                                                      cursor: "pointer",
                                                    }}
                                                  >
                                                    Ledger ↗
                                                  </button>
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <div style={{ fontSize: "11px", color: "#64748b", padding: "4px" }}>No allocations recorded</div>
                                          )}
                                        </div>
                                        <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              setOpenSplitDropdownOrderId(null);
                                              openLabourAssignmentModal(entry, e);
                                            }}
                                            style={{
                                              width: "100%",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              gap: "5px",
                                              padding: "5px 8px",
                                              borderRadius: "5px",
                                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                                              border: "1px solid rgba(255, 255, 255, 0.12)",
                                              color: "#cbd5e1",
                                              fontSize: "11px",
                                              fontWeight: 600,
                                              cursor: "pointer",
                                            }}
                                          >
                                            <Icon name="users" size={11} color="#38bdf8" />
                                            <span>Edit Split / Reassign</span>
                                          </button>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => openLabourAssignmentModal(entry, e)}
                                  title={`Assigned to ${entry.fittingContractorName}. Click to change or reassign.`}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    width: "100%",
                                    height: "30px",
                                    boxSizing: "border-box",
                                    padding: "0 8px",
                                    borderRadius: "5px",
                                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                                    border: "1px solid rgba(255, 255, 255, 0.12)",
                                    color: "#cbd5e1",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <Icon name="user" size={12} color="#94a3b8" />
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {formatContractorLabel(entry.fittingContractorName || "")}
                                  </span>
                                </button>
                              )}
                            </div>

                            {/* 2. Direct Contractor Ledger Shortcut Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJumpToLabourPage(entry.fittingContractorId === "mix" ? undefined : entry.fittingContractorId);
                              }}
                              title={`Open ${entry.fittingContractorName || "contractor"}'s ledger in Labour Workspace`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                height: "30px",
                                padding: "0 8px",
                                flexShrink: 0,
                                boxSizing: "border-box",
                                borderRadius: "5px",
                                backgroundColor: "rgba(56, 189, 248, 0.08)",
                                border: "1px solid rgba(56, 189, 248, 0.25)",
                                color: "#38bdf8",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.16)";
                                e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.45)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.08)";
                                e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.25)";
                              }}
                            >
                              <Icon name="external-link" size={11} color="#38bdf8" />
                              <span>Ledger ↗</span>
                            </button>

                            {/* 3. Fitting Status: Yellow Tick (In Fitting) vs Green Tick (Fitting Done) */}
                            {entry.fittingStatus === "ready" ? (
                              <button
                                type="button"
                                onClick={(e) => handleToggleFittingDone(entry, e)}
                                title="Fitting completed & verified ✓. Click to return to In Fitting."
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                  flex: 1,
                                  height: "30px",
                                  boxSizing: "border-box",
                                  padding: "0 8px",
                                  borderRadius: "5px",
                                  backgroundColor: "rgba(34, 197, 94, 0.12)",
                                  border: "1px solid rgba(34, 197, 94, 0.35)",
                                  color: "#4ade80",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 0.12)";
                                }}
                              >
                                <CheckboxBox checked={true} color="#22c55e" />
                                <span>Fitting Done ✓</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleToggleFittingDone(entry, e)}
                                title="Fitting in process (Contractor working). Click when completed to mark Fitting Done ✓."
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                  flex: 1,
                                  height: "30px",
                                  boxSizing: "border-box",
                                  padding: "0 8px",
                                  borderRadius: "5px",
                                  backgroundColor: "rgba(234, 179, 8, 0.12)",
                                  border: "1px solid rgba(234, 179, 8, 0.38)",
                                  color: "#facc15",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "rgba(234, 179, 8, 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "rgba(234, 179, 8, 0.12)";
                                }}
                              >
                                <div
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "3px",
                                    border: "1.5px solid #eab308",
                                    backgroundColor: "#eab308",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="#080b12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                                <span>In Fitting ⚡</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                            <button
                              type="button"
                              onClick={(e) => openLabourAssignmentModal(entry, e)}
                              title="Assign to outside contractor (Rupa, Ajay, Arti, Golu, Shop...)"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "5px",
                                flex: 1,
                                height: "30px",
                                boxSizing: "border-box",
                                padding: "0 8px",
                                borderRadius: "5px",
                                backgroundColor: "rgba(255, 255, 255, 0.03)",
                                border: "1px dashed rgba(255, 255, 255, 0.15)",
                                color: "#cbd5e1",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Icon name="plus" size={11} color="#94a3b8" />
                              <span>+ Give to Labour</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleSetWithoutFitting(entry, e)}
                              title="Fitting not needed. Mark as Without Fitting (Done)."
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "5px",
                                flex: 1,
                                height: "30px",
                                boxSizing: "border-box",
                                padding: "0 8px",
                                borderRadius: "5px",
                                backgroundColor: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                color: "#cbd5e1",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Icon name="check" size={11} color="#94a3b8" />
                              <span>Without Fitting</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 9. Overall Order Status (User manually marks Ready to Complete) */}
                      <td style={{ padding: "10px 8px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={(e) => handleCycleOrderStatus(entry, e)}
                          title={
                            isReady
                              ? "Order verified & completed. Click to re-open to Active Queue."
                              : allStepsDone
                              ? "All production steps finished! Click to mark Ready and move to Completed."
                              : "In production. Click to force mark Ready & complete."
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            width: "100%",
                            height: "30px",
                            boxSizing: "border-box",
                            padding: "0 8px",
                            borderRadius: "5px",
                            fontSize: "12px",
                            fontWeight: isReady || allStepsDone ? 700 : 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            border: isReady
                              ? "1px solid rgba(16, 185, 129, 0.25)"
                              : allStepsDone
                              ? "1px solid rgba(59, 130, 246, 0.5)"
                              : "1px solid rgba(255, 255, 255, 0.08)",
                            backgroundColor: isReady
                              ? "rgba(16, 185, 129, 0.08)"
                              : allStepsDone
                              ? "rgba(59, 130, 246, 0.12)"
                              : "rgba(255, 255, 255, 0.03)",
                            color: isReady
                              ? "#34d399"
                              : allStepsDone
                              ? "#60a5fa"
                              : "#94a3b8",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Icon
                            name={
                              isReady
                                ? "check-circle"
                                : allStepsDone
                                ? "arrow-right"
                                : entry.fittingStatus === "in_fitting"
                                ? "tool"
                                : entry.goneForPrint || entry.isPrinted
                                ? "printer"
                                : "clock"
                            }
                            size={12}
                          />
                          <span>
                            {isReady
                              ? "Ready ✓"
                              : allStepsDone
                              ? "Mark Ready →"
                              : entry.fittingStatus === "in_fitting"
                              ? "In Fitting"
                              : entry.isPrinted
                              ? "Printed"
                              : entry.goneForPrint
                              ? "In Print"
                              : "Pending"}
                          </span>
                        </button>
                      </td>

                      {/* 10. Actions */}
                      <td style={{ padding: "10px 10px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
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
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "30px",
                              height: "30px",
                              boxSizing: "border-box",
                              borderRadius: "5px",
                              backgroundColor: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              color: "#94a3b8",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                              e.currentTarget.style.color = "#f1f5f9";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                              e.currentTarget.style.color = "#94a3b8";
                            }}
                          >
                            <Icon name="file-text" size={13} />
                          </button>

                          {/* Delete Order Action (Completed orders are strictly protected) */}
                          {entry.orderReady ? (
                            <div
                              title="Completed order — permanently locked against deletion (Audit & Ledger Protection)"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "30px",
                                height: "30px",
                                boxSizing: "border-box",
                                borderRadius: "5px",
                                backgroundColor: "rgba(255, 255, 255, 0.02)",
                                border: "1px solid rgba(255, 255, 255, 0.06)",
                                color: "#475569",
                                cursor: "not-allowed",
                              }}
                            >
                              <Icon name="lock" size={12} color="#475569" />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => openDeleteModal(entry, e)}
                              title={`Delete order #${entry.sn}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "30px",
                                height: "30px",
                                boxSizing: "border-box",
                                borderRadius: "5px",
                                backgroundColor: "rgba(239, 68, 68, 0.08)",
                                border: "1px solid rgba(239, 68, 68, 0.22)",
                                color: "#f87171",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
                                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.45)";
                                e.currentTarget.style.color = "#ff8585";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
                                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.22)";
                                e.currentTarget.style.color = "#f87171";
                              }}
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          )}
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
            ) : (() => {
                const totalOrderQty = fittingModalOrder.qty;
                const sumAllocated = mixFittingContractorIds.reduce(
                  (acc, id) => acc + (Number(mixFittingQtys[id]) || 0),
                  0
                );
                const unallocated = totalOrderQty - sumAllocated;

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b" }}>
                        Distribute {totalOrderQty.toLocaleString()} pcs:
                      </label>
                    </div>

                    {/* Live Remainder Feedback Banner */}
                    {unallocated === 0 ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(34, 197, 94, 0.12)",
                          border: "1px solid rgba(34, 197, 94, 0.3)",
                          color: "#4ade80",
                          fontSize: "11.5px",
                          fontWeight: 700,
                        }}
                      >
                        <span>✓ Exactly {totalOrderQty.toLocaleString()} pcs allocated</span>
                        <span style={{ fontFamily: "var(--font-mono)" }}>0 left</span>
                      </div>
                    ) : unallocated > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(234, 179, 8, 0.12)",
                          border: "1px solid rgba(234, 179, 8, 0.3)",
                          color: "#facc15",
                          fontSize: "11.5px",
                          fontWeight: 700,
                        }}
                      >
                        <span>Allocated: {sumAllocated.toLocaleString()} / {totalOrderQty.toLocaleString()} pcs</span>
                        <span style={{ fontFamily: "var(--font-mono)" }}>⚠ {unallocated.toLocaleString()} pcs left</span>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(239, 68, 68, 0.12)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#f87171",
                          fontSize: "11.5px",
                          fontWeight: 700,
                        }}
                      >
                        <span>Allocated: {sumAllocated.toLocaleString()} / {totalOrderQty.toLocaleString()} pcs</span>
                        <span style={{ fontFamily: "var(--font-mono)" }}>✖ Over by {Math.abs(unallocated).toLocaleString()} pcs</span>
                      </div>
                    )}

                    {contractors
                      .filter((c) => c.id !== "wof" && c.id !== "shop")
                      .map((c) => {
                        const isChecked = mixFittingContractorIds.includes(c.id);
                        const cQty = Number(mixFittingQtys[c.id]) || 0;

                        return (
                          <div
                            key={c.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 8px",
                              borderRadius: "5px",
                              backgroundColor: isChecked ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.015)",
                              border: isChecked ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(255, 255, 255, 0.06)",
                            }}
                          >
                            <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setMixFittingContractorIds((prev) => prev.filter((id) => id !== c.id));
                                    setMixFittingQtys((prev) => {
                                      const next = { ...prev };
                                      delete next[c.id];
                                      return next;
                                    });
                                  } else {
                                    setMixFittingContractorIds((prev) => [...prev, c.id]);
                                    if (unallocated > 0) {
                                      setMixFittingQtys((prev) => ({
                                        ...prev,
                                        [c.id]: unallocated,
                                      }));
                                    }
                                  }
                                }}
                                style={{ accentColor: "#3b82f6" }}
                              />
                              <span style={{ fontSize: "12px", color: isChecked ? "#fff" : "#94a3b8", fontWeight: isChecked ? 600 : 400 }}>
                                {c.displayName.split(" (")[0]}
                              </span>
                            </label>

                            {isChecked && (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {unallocated > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMixFittingQtys((prev) => ({
                                        ...prev,
                                        [c.id]: cQty + unallocated,
                                      }));
                                    }}
                                    title={`Add remaining ${unallocated} pcs to ${c.displayName}`}
                                    style={{
                                      padding: "2px 6px",
                                      borderRadius: "3px",
                                      backgroundColor: "rgba(234, 179, 8, 0.15)",
                                      border: "1px solid rgba(234, 179, 8, 0.3)",
                                      color: "#facc15",
                                      fontSize: "10.5px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    +{unallocated}
                                  </button>
                                )}
                                <input
                                  type="number"
                                  placeholder="Qty"
                                  value={mixFittingQtys[c.id] || ""}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 0;
                                    setMixFittingQtys((prev) => ({
                                      ...prev,
                                      [c.id]: val,
                                    }));
                                  }}
                                  style={{
                                    width: "85px",
                                    height: "28px",
                                    padding: "0 8px",
                                    backgroundColor: "#090c13",
                                    border: "1px solid rgba(255, 255, 255, 0.18)",
                                    borderRadius: "4px",
                                    color: "#fff",
                                    fontSize: "12px",
                                    fontFamily: "var(--font-mono)",
                                    textAlign: "right",
                                    fontWeight: 700,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })()}

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
                  backgroundColor: !rollInfo.isSufficient ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
                  border: `1px solid ${!rollInfo.isSufficient ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.2)"}`,
                  fontSize: "11px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="package" size={13} color={!rollInfo.isSufficient ? "#ef4444" : "#10b981"} />
                  <span style={{ color: "#cbd5e1" }}>
                    Stock check: Need <strong>{rollInfo.rollsNeeded}</strong> roll(s) of {floorModalOrder.size}
                  </span>
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    color: !rollInfo.isSufficient ? "#ef4444" : "#10b981",
                  }}
                >
                  {rollInfo.availableRolls} rolls available {!rollInfo.isSufficient ? "(DEFICIT)" : "✓"}
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

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 8. SECURE ORDER DELETION MODAL (Random 4-Digit Security PIN)              */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {deleteModalOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setDeleteModalOrder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "440px",
              maxWidth: "95vw",
              backgroundColor: "#0d111c",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(239, 68, 68, 0.15)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: "rgba(239, 68, 68, 0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="alert-triangle" size={16} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>
                    Delete Order #{deleteModalOrder.sn}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#94a3b8" }}>
                    Permanent deletion safety verification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOrder(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Order Summary Card */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
                    {deleteModalOrder.mplName}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#38bdf8",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(56, 189, 248, 0.1)",
                    }}
                  >
                    {deleteModalOrder.size}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                  <span>Qty: <strong style={{ color: "#fff" }}>{deleteModalOrder.qty.toLocaleString()}</strong></span>
                  <span>Date: <strong style={{ color: "#fff" }}>{deleteModalOrder.date}</strong></span>
                  <span>Labour: <strong style={{ color: "#fff" }}>{deleteModalOrder.fittingContractorName || "None"}</strong></span>
                </div>
              </div>

              {/* Warning Notice */}
              <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: 1.5 }}>
                This action cannot be undone. It will permanently remove this order from the queue and purge any registered vouchers from contractor ledgers.
              </p>

              {/* Random 4-digit PIN Verification */}
              <div
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239, 68, 68, 0.05)",
                  border: "1px dashed rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#cbd5e1" }}>
                  Enter the 4-digit confirmation PIN below:
                </span>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "30px",
                    fontWeight: 800,
                    letterSpacing: "10px",
                    color: "#f87171",
                    textShadow: "0 0 12px rgba(239, 68, 68, 0.4)",
                    userSelect: "all",
                  }}
                >
                  {deleteGeneratedPin}
                </div>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  placeholder="Type 4 digits"
                  value={deleteInputPin}
                  onChange={(e) => setDeleteInputPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && deleteInputPin === deleteGeneratedPin) {
                      handleConfirmDelete();
                    }
                  }}
                  style={{
                    width: "160px",
                    height: "40px",
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: "20px",
                    fontWeight: 700,
                    letterSpacing: "6px",
                    backgroundColor: "#07090e",
                    border:
                      deleteInputPin === deleteGeneratedPin
                        ? "2px solid #22c55e"
                        : deleteInputPin.length === 4
                        ? "2px solid #ef4444"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    outline: "none",
                    boxShadow:
                      deleteInputPin === deleteGeneratedPin
                        ? "0 0 10px rgba(34, 197, 94, 0.3)"
                        : "none",
                  }}
                />
                {deleteInputPin.length === 4 && deleteInputPin !== deleteGeneratedPin && (
                  <span style={{ fontSize: "11px", color: "#f87171", fontWeight: 600 }}>
                    Incorrect PIN. Please enter {deleteGeneratedPin} to confirm.
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setDeleteModalOrder(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  backgroundColor: "transparent",
                  color: "#94a3b8",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteInputPin !== deleteGeneratedPin}
                onClick={handleConfirmDelete}
                style={{
                  padding: "8px 18px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: deleteInputPin === deleteGeneratedPin ? "#ef4444" : "rgba(239, 68, 68, 0.2)",
                  color: deleteInputPin === deleteGeneratedPin ? "#ffffff" : "rgba(255, 255, 255, 0.3)",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: deleteInputPin === deleteGeneratedPin ? "pointer" : "not-allowed",
                  transition: "all 0.15s ease",
                  boxShadow:
                    deleteInputPin === deleteGeneratedPin
                      ? "0 2px 10px rgba(239, 68, 68, 0.4)"
                      : "none",
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
