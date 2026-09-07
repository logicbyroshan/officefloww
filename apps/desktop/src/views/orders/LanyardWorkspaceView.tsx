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

const HOOK_OPTIONS = ["Dog Hook", "Eagle Hook", "Plastic Hook", "None"] as const;
const HOLDER_PRESETS = ["DST-V", "DST-H", "CCH", "PH", "PV"] as const;

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
  const [newHook, setNewHook] = useState<string>("Dog Hook");
  const [newFittingItem, setNewFittingItem] = useState<string>("");

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

    const newEntry = addOrder({
      sn: nextSN,
      date: getFormattedDateToday(),
      mplName: title,
      size: newSize,
      qty: parsedQty,
      qtyDisplay: newQtyStr.trim() || String(parsedQty),
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
    });

    setNewMplName("");
    setNewQtyStr("");
    setNewFittingItem("");
    toastSuccess("Order Ingested", `Added #${nextSN}: ${newEntry.mplName} (${parsedQty.toLocaleString()})`);
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
    const plasticHook = stockItems.find((s) => s.code === "plastic-hook")?.availableStock ?? 11400;
    const total = dogHook + englandHook + plasticHook;
    return { total, dogHook, englandHook, plasticHook };
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
      {/* 1. EXECUTIVE 5-CARD KPI METRICS & LIVE INVENTORY DECK                      */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Card 1: Active Orders */}
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
              Active Orders
            </span>
            <Icon name="layers" size={14} color="#94a3b8" />
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
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>orders</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
            {metrics.activeVolume.toLocaleString()} total units
          </div>
        </div>

        {/* Card 2: Tape Roll Stock */}
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
              Tape Roll Stock
            </span>
            <Icon name="package" size={14} color="#34d399" />
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
            63{" "}
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>rolls</span>{" "}
            <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 500 }}>
              (~28,350 cap)
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
            12mm: 45r • 16mm: 6r • 20mm: 12r
          </div>
        </div>

        {/* Card 3: Hooks Stock */}
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
              Hooks Stock
            </span>
            <Icon name="tool" size={14} color="#c084fc" />
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
            {hookStats.total.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>units</span>
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
            Dog: {(hookStats.dogHook / 1000).toFixed(1)}k • Eng: {(hookStats.englandHook / 1000).toFixed(1)}k • Plastic: {(hookStats.plasticHook / 1000).toFixed(1)}k
          </div>
        </div>

        {/* Card 4: Safety Jointers */}
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
              Safety Jointers
            </span>
            <Icon name="tag" size={14} color="#fbbf24" />
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
            {jointerStats.total.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>units</span>
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
            16mm-j: {(jointerStats.j16mm / 1000).toFixed(1)}k • 12mm-j: {(jointerStats.j12mm / 1000).toFixed(1)}k
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
            {metrics.completedVolume.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>units</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            {metrics.completedCount} orders completed
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 2. ORDER INTAKE DOCK (Top: Description & Qty | Bottom: Size, Hook & Holders) */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "12px 14px",
          borderRadius: "8px",
          backgroundColor: "#0e131f",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Top Row: SN Badge + Description Input + Qty Input + Ingest Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              padding: "5px 9px",
              borderRadius: "5px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#cbd5e1",
              whiteSpace: "nowrap",
            }}
          >
            #{getNextSN(orders)}
          </span>

          <input
            type="text"
            placeholder="Client Title / Description (e.g. Rajesh ji - Govt Girls 500)"
            value={newMplName}
            onChange={(e) => setNewMplName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
            style={{
              flex: 1,
              height: "34px",
              padding: "0 12px",
              backgroundColor: "#090c13",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "5px",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.6)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)")}
          />

          <input
            type="text"
            placeholder="Qty (e.g. 500)"
            value={newQtyStr}
            onChange={(e) => setNewQtyStr(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
            style={{
              width: "110px",
              height: "34px",
              padding: "0 10px",
              backgroundColor: "#090c13",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "5px",
              color: "#fff",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              outline: "none",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.6)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)")}
          />

          <button
            type="button"
            onClick={handleIngestOrder}
            style={{
              height: "34px",
              padding: "0 18px",
              borderRadius: "5px",
              backgroundColor: "#2563eb",
              border: "none",
              color: "#fff",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
          >
            <Icon name="plus" size={14} />
            <span>Ingest Order</span>
          </button>
        </div>

        {/* Bottom Row: Size + Hook + Holder Input & Presets + Jointer + Live Roll Stock */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            paddingTop: "8px",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            flexWrap: "wrap",
          }}
        >
          {/* 1. Size Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Size:
            </span>
            <div
              style={{
                display: "flex",
                backgroundColor: "#090c13",
                borderRadius: "5px",
                padding: "2px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                height: "28px",
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
                      height: "22px",
                      padding: "0 8px",
                      borderRadius: "3px",
                      border: "none",
                      backgroundColor: isSelected ? "rgba(255, 255, 255, 0.14)" : "transparent",
                      color: isSelected ? "#fff" : "#64748b",
                      fontSize: "11px",
                      fontWeight: isSelected ? 700 : 500,
                      fontFamily: "var(--font-mono)",
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Hooks Option */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Hook:
            </span>
            <div
              style={{
                display: "flex",
                backgroundColor: "#090c13",
                borderRadius: "5px",
                padding: "2px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                height: "28px",
                boxSizing: "border-box",
                alignItems: "center",
              }}
            >
              {HOOK_OPTIONS.map((hk) => {
                const isSelected = newHook === hk;
                return (
                  <button
                    key={hk}
                    type="button"
                    onClick={() => setNewHook(hk)}
                    style={{
                      height: "22px",
                      padding: "0 8px",
                      borderRadius: "3px",
                      border: "none",
                      backgroundColor: isSelected ? "rgba(255, 255, 255, 0.14)" : "transparent",
                      color: isSelected ? "#fff" : "#64748b",
                      fontSize: "11px",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Fitting Item / Holder Input & Presets */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Holder:
            </span>
            <input
              type="text"
              placeholder="e.g. DST-V"
              value={newFittingItem}
              onChange={(e) => setNewFittingItem(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleIngestOrder()}
              style={{
                width: "80px",
                height: "26px",
                padding: "0 7px",
                backgroundColor: "#090c13",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "4px",
                color: "#fff",
                fontSize: "11.5px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                outline: "none",
                textTransform: "uppercase",
              }}
            />
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              {HOLDER_PRESETS.map((holder) => {
                const isActive = newFittingItem.toUpperCase() === holder;
                return (
                  <button
                    key={holder}
                    type="button"
                    onClick={() => setNewFittingItem(isActive ? "" : holder)}
                    title={`Select ${holder}`}
                    style={{
                      height: "24px",
                      padding: "0 6px",
                      borderRadius: "3px",
                      border: isActive
                        ? "1px solid rgba(59, 130, 246, 0.5)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                      backgroundColor: isActive ? "rgba(59, 130, 246, 0.18)" : "rgba(255, 255, 255, 0.03)",
                      color: isActive ? "#93c5fd" : "#94a3b8",
                      fontSize: "10.5px",
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      cursor: "pointer",
                      transition: "all 0.1s ease",
                    }}
                  >
                    {holder}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Roll Stock Status Indicator */}
          <div
            style={{
              marginLeft: "auto",
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
        </div>
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
                <th style={{ padding: "12px 8px", color: "#94a3b8", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em", minWidth: "250px" }}>
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
                            {entry.qtyDisplay && entry.qtyDisplay !== String(entry.qty) && !entry.qtyDisplay.includes(String(entry.qty)) && (
                              <div style={{ fontSize: "10.5px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                                ({entry.qtyDisplay.replace(/pcs/gi, "").trim()})
                              </div>
                            )}
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
                            <button
                              type="button"
                              onClick={(e) => openLabourAssignmentModal(entry, e)}
                              title={`Assigned to ${entry.fittingContractorName}. Click to reassign.`}
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

                            <button
                              type="button"
                              onClick={(e) => handleToggleFittingDone(entry, e)}
                              title={
                                entry.fittingStatus === "ready"
                                  ? "Fitting completed & verified. Click to uncheck."
                                  : "Click to mark Fitting Done"
                              }
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
                                backgroundColor:
                                  entry.fittingStatus === "ready"
                                    ? "rgba(255, 255, 255, 0.04)"
                                    : "rgba(255, 255, 255, 0.02)",
                                border:
                                  entry.fittingStatus === "ready"
                                    ? "1px solid rgba(255, 255, 255, 0.12)"
                                    : "1px solid rgba(255, 255, 255, 0.08)",
                                color: entry.fittingStatus === "ready" ? "#f1f5f9" : "#94a3b8",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <CheckboxBox
                                checked={entry.fittingStatus === "ready"}
                                color="#10b981"
                              />
                              <span>{entry.fittingStatus === "ready" ? "Fitting Done ✓" : "In Fitting"}</span>
                            </button>

                            {entry.fittingContractorId !== "mix" && (
                              <button
                                type="button"
                                onClick={() => handleJumpToLabourPage(entry.fittingContractorId)}
                                title={`Open ${entry.fittingContractorName}'s ledger in Labour Workspace`}
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
                                <Icon name="external-link" size={11} color="#94a3b8" />
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
                              <span>+ Assign Labour</span>
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
                              ? "1px solid rgba(16, 185, 129, 0.4)"
                              : "1px solid rgba(255, 255, 255, 0.08)",
                            backgroundColor: isReady
                              ? "rgba(16, 185, 129, 0.08)"
                              : allStepsDone
                              ? "rgba(16, 185, 129, 0.15)"
                              : "rgba(255, 255, 255, 0.03)",
                            color: isReady
                              ? "#34d399"
                              : allStepsDone
                              ? "#4ade80"
                              : "#94a3b8",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Icon
                            name={
                              isReady
                                ? "check-circle"
                                : allStepsDone
                                ? "check"
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
                              ? "Mark Ready ✓"
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
                            onClick={(e) => openLabourAssignmentModal(entry, e)}
                            title="Assign or reassign labour"
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
                            <Icon name="user" size={13} />
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
    </div>
  );
};
