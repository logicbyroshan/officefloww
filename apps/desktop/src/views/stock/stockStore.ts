import { useState, useEffect } from "react";

export type StockCategory = "HOOKS" | "HOLDERS" | "LANYARDS" | "OTHERS";

export interface StockItem {
  id: string;
  code?: string;
  name: string;
  category: StockCategory;
  unit: string;
  availableStock: number;
  usedStock: number;
  reservedStock: number;
  minThreshold: number;
  workstation: string;
  iconName: "tool" | "layers" | "package" | "tag";
  iconColor: string;
}

export interface StockMovementLog {
  id: string;
  timestamp: string;
  itemName: string;
  type: "ADDITION" | "USAGE";
  quantity: number;
  unit: string;
  destinationOrSource: string;
  reportedBy: string;
  notes: string;
}

export const INITIAL_STOCK_ITEMS: StockItem[] = [
  // 3 Hooks (Unit: pieces)
  {
    id: "stk-hook-1",
    code: "dog-hook",
    name: "Dog Hook",
    category: "HOOKS",
    unit: "pieces",
    availableStock: 8500,
    usedStock: 7500,
    reservedStock: 1500,
    minThreshold: 2000,
    workstation: "Lanyard Stitching Bench 2",
    iconName: "tool",
    iconColor: "#c084fc",
  },
  {
    id: "stk-hook-2",
    code: "england-hook",
    name: "England Hook",
    category: "HOOKS",
    unit: "pieces",
    availableStock: 6200,
    usedStock: 4800,
    reservedStock: 1000,
    minThreshold: 1500,
    workstation: "Lanyard Stitching Bench 1",
    iconName: "tool",
    iconColor: "#a855f7",
  },
  {
    id: "stk-hook-3",
    code: "fish-hook",
    name: "Fish Hook",
    category: "HOOKS",
    unit: "pieces",
    availableStock: 11400,
    usedStock: 9200,
    reservedStock: 2000,
    minThreshold: 3000,
    workstation: "Assembly Table 03",
    iconName: "tool",
    iconColor: "#38bdf8",
  },

  // 5 Holders (Unit: pieces)
  {
    id: "stk-holder-1",
    code: "pv",
    name: "Plastic Holder-V",
    category: "HOLDERS",
    unit: "pieces",
    availableStock: 9500,
    usedStock: 6800,
    reservedStock: 2500,
    minThreshold: 2000,
    workstation: "Card Packaging Station A",
    iconName: "layers",
    iconColor: "#34d399",
  },
  {
    id: "stk-holder-2",
    code: "ph",
    name: "Plastic Holder-H",
    category: "HOLDERS",
    unit: "pieces",
    availableStock: 8200,
    usedStock: 5400,
    reservedStock: 1800,
    minThreshold: 2000,
    workstation: "Card Packaging Station B",
    iconName: "layers",
    iconColor: "#10b981",
  },
  {
    id: "stk-holder-3",
    code: "dst-v",
    name: "DST-V",
    category: "HOLDERS",
    unit: "pieces",
    availableStock: 4500,
    usedStock: 3200,
    reservedStock: 1200,
    minThreshold: 1000,
    workstation: "Specialty Mounting Line",
    iconName: "layers",
    iconColor: "#f59e0b",
  },
  {
    id: "stk-holder-4",
    code: "dst-h",
    name: "DST-H",
    category: "HOLDERS",
    unit: "pieces",
    availableStock: 3800,
    usedStock: 2900,
    reservedStock: 800,
    minThreshold: 1000,
    workstation: "Specialty Mounting Line",
    iconName: "layers",
    iconColor: "#fbbf24",
  },
  {
    id: "stk-holder-5",
    code: "cch-v",
    name: "Crystal Holder",
    category: "HOLDERS",
    unit: "pieces",
    availableStock: 5200,
    usedStock: 4100,
    reservedStock: 1500,
    minThreshold: 1200,
    workstation: "VIP Badge Assembly Line",
    iconName: "layers",
    iconColor: "#60a5fa",
  },

  // 3 Lanyard Types (Unit: rolls - 1 roll = ~450 completed lanyards)
  {
    id: "stk-lanyard-1",
    code: "12mm",
    name: "12mm Lanyard Rolls",
    category: "LANYARDS",
    unit: "rolls",
    availableStock: 45,
    usedStock: 28,
    reservedStock: 8,
    minThreshold: 10,
    workstation: "Sublimation Press Line 1",
    iconName: "package",
    iconColor: "#ff8a73",
  },
  {
    id: "stk-lanyard-2",
    code: "16mm",
    name: "16mm Lanyard Rolls",
    category: "LANYARDS",
    unit: "rolls",
    availableStock: 6, // Low Stock Alert (< 8 minThreshold)
    usedStock: 45,
    reservedStock: 6,
    minThreshold: 8,
    workstation: "Sublimation Press Line 2",
    iconName: "package",
    iconColor: "#ea580c",
  },
  {
    id: "stk-lanyard-3",
    code: "20mm",
    name: "20mm Lanyard Rolls",
    category: "LANYARDS",
    unit: "rolls",
    availableStock: 58,
    usedStock: 42,
    reservedStock: 12,
    minThreshold: 15,
    workstation: "Sublimation Press Line 1",
    iconName: "package",
    iconColor: "#f97316",
  },

  // Hardware Accessories & Jointers
  {
    id: "stk-other-1",
    code: "clips",
    name: "Clips",
    category: "OTHERS",
    unit: "packets of 1000",
    availableStock: 18, // 18,000 clips
    usedStock: 12,
    reservedStock: 4,
    minThreshold: 5,
    workstation: "Lanyard Ring & Clip Table",
    iconName: "tag",
    iconColor: "#ec4899",
  },
  {
    id: "stk-other-2",
    code: "rings",
    name: "Rings",
    category: "OTHERS",
    unit: "pieces",
    availableStock: 14500,
    usedStock: 11200,
    reservedStock: 3000,
    minThreshold: 4000,
    workstation: "Metal Ring Press Bench",
    iconName: "tag",
    iconColor: "#d946ef",
  },
  {
    id: "stk-other-3",
    code: "pins",
    name: "Pins",
    category: "OTHERS",
    unit: "packets of 1000",
    availableStock: 4, // Low Stock Alert
    usedStock: 37,
    reservedStock: 5,
    minThreshold: 6,
    workstation: "Badge Pinning Bench",
    iconName: "tag",
    iconColor: "#a855f7",
  },

  // Blank PVC Cards & Thermal Printing Consumables for Kamal Sir ID Desk
  {
    id: "stk-id-1",
    code: "pvc-cards",
    name: "Blank PVC Cards (CR80)",
    category: "OTHERS",
    unit: "cards",
    availableStock: 15000,
    usedStock: 42500,
    reservedStock: 2473,
    minThreshold: 3000,
    workstation: "Kamal Sir Thermal Printing Desk",
    iconName: "layers",
    iconColor: "#38bdf8",
  },
  {
    id: "stk-id-2",
    code: "ymcko-ribbon",
    name: "YMCKO Thermal Ribbon",
    category: "OTHERS",
    unit: "rolls",
    availableStock: 12,
    usedStock: 34,
    reservedStock: 3,
    minThreshold: 5,
    workstation: "Kamal Sir Thermal Printing Desk",
    iconName: "package",
    iconColor: "#c084fc",
  },
];

export const INITIAL_MOVEMENTS: StockMovementLog[] = [
  { id: "mov-1", timestamp: "Today, 02:45 PM", itemName: "12mm Lanyard Rolls", type: "USAGE", quantity: 3, unit: "rolls", destinationOrSource: "Sublimation Line 1", reportedBy: "Vikram Singh", notes: "St. Xavier's High School Order batch" },
  { id: "mov-2", timestamp: "Today, 11:15 AM", itemName: "Dog Hook", type: "USAGE", quantity: 500, unit: "pieces", destinationOrSource: "Lanyard Stitching Table 2", reportedBy: "Ramesh Labour", notes: "Northwind Coffee lanyards assembly" },
  { id: "mov-3", timestamp: "Today, 09:30 AM", itemName: "Rings", type: "USAGE", quantity: 1200, unit: "pieces", destinationOrSource: "Metal Ring Press Bench", reportedBy: "Suresh Workshop", notes: "BHEL badges fitting batch" },
  { id: "mov-4", timestamp: "Yesterday, 05:10 PM", itemName: "16mm Lanyard Rolls", type: "USAGE", quantity: 4, unit: "rolls", destinationOrSource: "Sublimation Press Line 2", reportedBy: "Kailash Sublimation", notes: "AIIMS Staff Lanyards run" },
  { id: "mov-5", timestamp: "Yesterday, 04:30 PM", itemName: "Clips", type: "ADDITION", quantity: 5, unit: "packets of 1000", destinationOrSource: "Supplier Receipt Bay", reportedBy: "Amit Patel", notes: "Vendor delivery receipt" },
  { id: "mov-6", timestamp: "Yesterday, 02:00 PM", itemName: "Blank PVC Cards (CR80)", type: "USAGE", quantity: 850, unit: "cards", destinationOrSource: "Kamal Sir Desk", reportedBy: "Kamal Sir", notes: "DPS Bhopal student badges run" },
];

const STORAGE_KEY_STOCK_ITEMS = "officefloww_stock_items_v2";
const STORAGE_KEY_STOCK_MOVEMENTS = "officefloww_stock_movements_v2";

function loadInitialStock(): StockItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STOCK_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load stock from storage", e);
  }
  return [...INITIAL_STOCK_ITEMS];
}

function loadInitialMovements(): StockMovementLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STOCK_MOVEMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load movements from storage", e);
  }
  return [...INITIAL_MOVEMENTS];
}

let globalStockItems: StockItem[] = loadInitialStock();
let globalMovements: StockMovementLog[] = loadInitialMovements();
const stockListeners = new Set<() => void>();

function notifyStockListeners() {
  try {
    localStorage.setItem(STORAGE_KEY_STOCK_ITEMS, JSON.stringify(globalStockItems));
    localStorage.setItem(STORAGE_KEY_STOCK_MOVEMENTS, JSON.stringify(globalMovements));
  } catch (e) {
    console.error("Failed to persist stock state", e);
  }
  stockListeners.forEach((fn) => fn());
}

// ─── Mathematical Constants ──────────────────────────────────────────────────
// 1 standard 400m lanyard roll with 90cm cut length gives ~444-450 lanyards.
export const PCS_PER_LANYARD_ROLL = 450;

export interface RollCapacityReport {
  size: "12mm" | "16mm" | "20mm";
  qty: number;
  rollsNeeded: number;
  exactRolls: string;
  availableRolls: number;
  totalCapacityPcs: number;
  surplusDeficitPcs: number;
  isSufficient: boolean;
  statusText: string;
  statusColor: string;
  isLowStockAlert: boolean;
}

export function useStockStore() {
  const [items, setItems] = useState<StockItem[]>(globalStockItems);
  const [movements, setMovements] = useState<StockMovementLog[]>(globalMovements);

  useEffect(() => {
    const update = () => {
      setItems([...globalStockItems]);
      setMovements([...globalMovements]);
    };
    stockListeners.add(update);
    return () => {
      stockListeners.delete(update);
    };
  }, []);

  // Update whole list
  const updateStockItems = (
    updater: StockItem[] | ((prev: StockItem[]) => StockItem[])
  ) => {
    if (typeof updater === "function") {
      globalStockItems = updater(globalStockItems);
    } else {
      globalStockItems = updater;
    }
    notifyStockListeners();
  };

  // Adjust stock for item by ID or code
  const adjustStock = (
    itemIdOrCode: string,
    deltaQty: number, // positive for addition, negative for usage
    destinationOrSource: string,
    reportedBy: string,
    notes: string
  ) => {
    const target = globalStockItems.find(
      (it) => it.id === itemIdOrCode || it.code === itemIdOrCode
    );
    if (!target) return;

    const newAvailable = Math.max(0, target.availableStock + deltaQty);
    const newUsed = deltaQty < 0 ? target.usedStock + Math.abs(deltaQty) : target.usedStock;

    globalStockItems = globalStockItems.map((it) =>
      it.id === target.id
        ? {
            ...it,
            availableStock: newAvailable,
            usedStock: newUsed,
          }
        : it
    );

    const newLog: StockMovementLog = {
      id: `mov-${Date.now()}`,
      timestamp: "Just now",
      itemName: target.name,
      type: deltaQty >= 0 ? "ADDITION" : "USAGE",
      quantity: Math.abs(deltaQty),
      unit: target.unit,
      destinationOrSource,
      reportedBy,
      notes,
    };

    globalMovements = [newLog, ...globalMovements];
    notifyStockListeners();
  };

  // Deduct hardware when issued to labour
  const issueHardwareToLabour = (
    contractorName: string,
    materialCode: string,
    qty: number
  ) => {
    // Map material code to stock item
    const code = materialCode.trim().toLowerCase();
    let targetItem = globalStockItems.find(
      (it) => it.code?.toLowerCase() === code || it.name.toLowerCase().includes(code)
    );

    if (!targetItem) {
      if (code.includes("hook") || code.includes("dh")) {
        targetItem = globalStockItems.find((it) => it.code === "dog-hook");
      } else if (code.includes("eh")) {
        targetItem = globalStockItems.find((it) => it.code === "england-hook");
      } else if (code.includes("ph")) {
        targetItem = globalStockItems.find((it) => it.code === "ph");
      } else if (code.includes("pv")) {
        targetItem = globalStockItems.find((it) => it.code === "pv");
      } else if (code.includes("dst-v")) {
        targetItem = globalStockItems.find((it) => it.code === "dst-v");
      } else if (code.includes("dst-h")) {
        targetItem = globalStockItems.find((it) => it.code === "dst-h");
      }
    }

    if (targetItem) {
      adjustStock(
        targetItem.id,
        -qty,
        `${contractorName} Assembly Bench`,
        "Production Dispatch Bay",
        `Dispatched to ${contractorName} for lanyard fitting`
      );
    }
  };

  // Roll Capacity Math for Lanyard Orders
  const getRollStats = (
    size: "12mm" | "16mm" | "20mm",
    orderQty: number
  ): RollCapacityReport => {
    const rollItem = globalStockItems.find((it) => it.code === size);
    const availableRolls = rollItem ? rollItem.availableStock : 0;
    const isLow = rollItem ? rollItem.availableStock <= rollItem.minThreshold : false;

    const rollsNeeded = Math.ceil(orderQty / PCS_PER_LANYARD_ROLL);
    const exactRolls = (orderQty / PCS_PER_LANYARD_ROLL).toFixed(1);
    const totalCapacityPcs = availableRolls * PCS_PER_LANYARD_ROLL;
    const surplusDeficitPcs = totalCapacityPcs - orderQty;
    const isSufficient = availableRolls >= rollsNeeded;

    let statusText = "";
    let statusColor = "#22c55e";

    if (availableRolls === 0) {
      statusText = "0 rolls in stock (Out of stock!)";
      statusColor = "#ef4444";
    } else if (!isSufficient) {
      const deficitRolls = rollsNeeded - availableRolls;
      statusText = `Short ${deficitRolls} roll${deficitRolls > 1 ? "s" : ""} (Need ${exactRolls} rolls, have ${availableRolls})`;
      statusColor = "#f59e0b";
    } else if (isLow) {
      statusText = `Only ${availableRolls} rolls left (~${totalCapacityPcs.toLocaleString()} pcs cap.)`;
      statusColor = "#f59e0b";
    } else {
      statusText = `${availableRolls} rolls avail (~${totalCapacityPcs.toLocaleString()} pcs cap.) ✓ Sufficient`;
      statusColor = "#22c55e";
    }

    return {
      size,
      qty: orderQty,
      rollsNeeded,
      exactRolls,
      availableRolls,
      totalCapacityPcs,
      surplusDeficitPcs,
      isSufficient,
      statusText,
      statusColor,
      isLowStockAlert: isLow,
    };
  };

  // Blank PVC Card Check for ID Cards
  const getBlankPVCStats = (orderQty: number) => {
    const cardItem = globalStockItems.find((it) => it.code === "pvc-cards");
    const availableCards = cardItem ? cardItem.availableStock : 15000;
    const isSufficient = availableCards >= orderQty;
    const isLow = cardItem ? availableCards <= cardItem.minThreshold : false;

    return {
      availableCards,
      isSufficient,
      isLow,
      statusText: isSufficient
        ? `${availableCards.toLocaleString()} Blank Cards in stock ✓ OK`
        : `⚠️ Short ${Math.abs(availableCards - orderQty)} cards (${availableCards} in stock)`,
      statusColor: isSufficient ? "#22c55e" : "#ef4444",
    };
  };

  return {
    items,
    movements,
    updateStockItems,
    adjustStock,
    issueHardwareToLabour,
    getRollStats,
    getBlankPVCStats,
  };
}
