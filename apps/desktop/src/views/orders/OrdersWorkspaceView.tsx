import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { Drawer } from "../../design-system/components/Drawer";
import { Tabs } from "../../design-system/components/Tabs";
import { useToast } from "../../design-system/components/Toast";
import { LabourContractor as LabourProfileContractor, INITIAL_LABOUR } from "../labour/LabourView";
import { LabourDetailProfileView } from "../labour/LabourDetailProfileView";

// ─── Default Known Clients List for Auto-Fetch ────────────────────────────────
export const DEFAULT_CLIENTS = [
  "St. Xavier's High School",
  "Northwind Coffee",
  "BHEL Township Admin",
  "Govt Engineering College Bhopal",
  "AIIMS Bhopal",
  "Delhi Public School",
  "Reliance Retail - Bhopal",
  "NIT Bhopal",
  "Maulana Azad Hospital",
  "Smart City Council",
  "Indraprastha School",
  "MP Secretariat",
  "Bansal Group Schools",
  "MP Police Academy",
  "Apex Polymers Ltd.",
  "Adharsh Vidya Mandir",
];

// ─── Standard Items for "Things Ordered" (Single Product Selection) ───────────
export const STANDARD_ORDER_ITEMS = [
  "Lanyard",
  "Card",
] as const;

export type StandardItem = (typeof STANDARD_ORDER_ITEMS)[number];

// ─── Worker Material Holdings & Profiles ─────────────────────────────────────
export interface MaterialHolding {
  item: string;
  qtyOnHand: number;
  unit: string;
  sourceOrder?: string;
  details?: string;
}

export interface EmployeeMember {
  id: string;
  name: string;
  role: string;
  department: string;
  workstation: string;
  activeJobsCount: number;
  phone: string;
  email: string;
  materialHoldings: MaterialHolding[];
}

export interface LabourContractor {
  id: string;
  name: string;
  specialty: string;
  location: string;
  ratePerPiece: number;
  materialHoldings: MaterialHolding[];
  activeJobsCount: number;
  phone: string;
}

export interface AllocationRow {
  workerId: string;
  workerName: string;
  workerRole: string;
  workerType: "STAFF" | "LABOUR";
  qty: number;
}

// In-House Staff/Employees for ID Card Production
export const INHOUSE_EMPLOYEES: EmployeeMember[] = [
  {
    id: "emp-1",
    name: "Sneha Roy",
    role: "ID Card Print Specialist",
    department: "Digital Printing & RFID Desk",
    workstation: "Card Printing Desk 01",
    activeJobsCount: 2,
    phone: "+91 98200 11005",
    email: "sneha.roy@adharshbhopal.in",
    materialHoldings: [
      {
        item: "Plastic Holder-V",
        qtyOnHand: 150,
        unit: "pieces",
        sourceOrder: "Previous Order #ORD-974 (AIIMS)",
        details: "Vertical PVC Card Holders held at Desk 01",
      },
      {
        item: "Clips",
        qtyOnHand: 1,
        unit: "packets of 1000",
        sourceOrder: "Stock Lot #STK-49",
        details: "1 packet of 1000 crocodile badge clips on workbench",
      },
      {
        item: "Safety Jointer Buckles",
        qtyOnHand: 1,
        unit: "packets of 1000",
        sourceOrder: "Batch #LN-380",
        details: "1 packet of 1000 breakaway jointers on workbench",
      },
      {
        item: "Dog Hook",
        qtyOnHand: 150,
        unit: "pieces",
        sourceOrder: "Batch #LN-390",
        details: "Nickel dog hooks at internal assembly desk",
      },
      {
        item: "16mm Lanyard Rolls",
        qtyOnHand: 2,
        unit: "rolls",
        sourceOrder: "Buffer Stock",
        details: "Satin rolls held at internal desk",
      },
    ],
  },
  {
    id: "emp-2",
    name: "Priya Nair",
    role: "Smart Card & Quality Operator",
    department: "Card Thermal Lamination",
    workstation: "Thermal Press Station A",
    activeJobsCount: 1,
    phone: "+91 98200 11003",
    email: "priya.nair@adharshbhopal.in",
    materialHoldings: [
      {
        item: "Plastic Holder-H",
        qtyOnHand: 300,
        unit: "pieces",
        sourceOrder: "Previous Order #ORD-965 (Govt Engg)",
        details: "Horizontal PVC Card Holders staged on rack",
      },
      {
        item: "Clips",
        qtyOnHand: 1,
        unit: "packets of 1000",
        sourceOrder: "Lot #STK-49",
        details: "1 packet of 1000 standard badge clips staged on rack",
      },
    ],
  },
  {
    id: "emp-3",
    name: "Dinesh Kumar",
    role: "Card Embossing & Encoding Worker",
    department: "Encoding & Foil Stamping",
    workstation: "Embossing Bench 02",
    activeJobsCount: 1,
    phone: "+91 98200 11008",
    email: "dinesh.kumar@adharshbhopal.in",
    materialHoldings: [
      {
        item: "DST-V",
        qtyOnHand: 100,
        unit: "pieces",
        sourceOrder: "Previous Order #ORD-961 (Indraprastha)",
        details: "Dual-slot Card Holders at station",
      },
    ],
  },
  {
    id: "emp-4",
    name: "Sunil Yadav",
    role: "ID Card Finishing & QC",
    department: "Quality Control & Packaging",
    workstation: "Card QC Table 01",
    activeJobsCount: 0,
    phone: "+91 98200 11009",
    email: "sunil.yadav@adharshbhopal.in",
    materialHoldings: [
      {
        item: "Crystal Holder",
        qtyOnHand: 80,
        unit: "pieces",
        sourceOrder: "Lot #CR-12",
        details: "VIP Crystal Card Holders buffer",
      },
      {
        item: "Clips",
        qtyOnHand: 1,
        unit: "packets of 1000",
        sourceOrder: "Buffer stock",
        details: "1 packet of 1000 finishing clips in tray",
      },
    ],
  },
  {
    id: "emp-5",
    name: "Rohan Sharma",
    role: "Production Floor Supervisor",
    department: "Production Operations",
    workstation: "Floor Admin Console",
    activeJobsCount: 1,
    phone: "+91 98200 11002",
    email: "rohan.sharma@adharshbhopal.in",
    materialHoldings: [],
  },
];

// External Piece-Rate Labour Contractors for Lanyard Production
export interface PrintContractorItem {
  id: string;
  name: string;
  specialty: string;
  rate: string;
  icon: string;
}

export const PRINT_CONTRACTORS: PrintContractorItem[] = [
  {
    id: "lb-2",
    name: "Kailash Heat Sublimation Lab",
    specialty: "Heat Transfer & Sublimation",
    rate: "₹2.80/pc",
    icon: "🔥",
  },
  {
    id: "lb-3",
    name: "Shyam Screen Print Workshop",
    specialty: "Screen Printing & Stamping",
    rate: "₹2.10/pc",
    icon: "🎨",
  },
  {
    id: "lb-1",
    name: "Ramesh Lanyard Stitching Unit",
    specialty: "Stitching & Rotary Print Unit",
    rate: "₹2.50/pc",
    icon: "🖨️",
  },
  {
    id: "lb-4",
    name: "Pooja Manual Pack & Clip Crew",
    specialty: "Manual Assembly & Pad Print",
    rate: "₹1.50/pc",
    icon: "📦",
  },
];

export const LABOUR_CONTRACTORS: LabourContractor[] = [
  {
    id: "lb-1",
    name: "Ramesh Lanyard Stitching Unit",
    specialty: "Lanyard Stitching & Dog Hook Crimping",
    location: "Table 02 (Plant South)",
    ratePerPiece: 2.50,
    materialHoldings: [
      {
        item: "Dog Hook",
        qtyOnHand: 500,
        unit: "pieces",
        sourceOrder: "Previous Order #ORD-982 (Bansal Schools)",
        details: "Standard nickel Dog Hooks held in contractor buffer",
      },
      {
        item: "16mm Lanyard Rolls",
        qtyOnHand: 3,
        unit: "rolls",
        sourceOrder: "Batch #LN-401",
        details: "Satin ribbon rolls held in contractor storage",
      },
      {
        item: "Plastic Holder-V",
        qtyOnHand: 200,
        unit: "pieces",
        sourceOrder: "Batch #LN-401",
        details: "Vertical pouch holders held in contractor buffer",
      },
      {
        item: "Clips",
        qtyOnHand: 1,
        unit: "packets of 1000",
        sourceOrder: "Stock Lot #STK-49",
        details: "1 packet of 1000 crocodile badge clips on workbench",
      },
      {
        item: "Safety Jointer Buckles",
        qtyOnHand: 1,
        unit: "packets of 1000",
        sourceOrder: "Buffer Lot #STK-92",
        details: "1 packet of 1000 safety breakaway buckles on workbench",
      },
    ],
    activeJobsCount: 2,
    phone: "+91 98260 11420",
  },
  {
    id: "lb-2",
    name: "Kailash Heat Sublimation Lab",
    specialty: "Heat Transfer & Double-Sided Sublimation",
    location: "Sublimation Line B",
    ratePerPiece: 2.80,
    materialHoldings: [
      {
        item: "20mm Lanyard Rolls",
        qtyOnHand: 4,
        unit: "rolls",
        sourceOrder: "Previous Order #ORD-979 (NIT Bhopal)",
        details: "20mm Sublimation white satin rolls in buffer credit",
      },
      {
        item: "Plastic Hook",
        qtyOnHand: 350,
        unit: "pieces",
        sourceOrder: "Batch #LN-309",
        details: "Plastic snap hooks on hand",
      },
    ],
    activeJobsCount: 1,
    phone: "+91 97551 22890",
  },
  {
    id: "lb-3",
    name: "Shyam Screen Print Workshop",
    specialty: "Screen Printing & Fabric Stamping",
    location: "Screen Table 04",
    ratePerPiece: 2.10,
    materialHoldings: [
      {
        item: "12mm Lanyard Rolls",
        qtyOnHand: 2,
        unit: "rolls",
        sourceOrder: "Previous Order #ORD-953 (Maulana Azad)",
        details: "12mm Navy blue tape rolls in buffer",
      },
      {
        item: "England Hook",
        qtyOnHand: 250,
        unit: "pieces",
        sourceOrder: "Batch #LN-291",
        details: "England type swivel hooks held",
      },
    ],
    activeJobsCount: 0,
    phone: "+91 98263 77419",
  },
  {
    id: "lb-4",
    name: "Pooja Manual Pack & Clip Crew",
    specialty: "Manual Assembly & Ring Fitting",
    location: "Packing Table 04",
    ratePerPiece: 1.50,
    materialHoldings: [
      {
        item: "Dog Hook",
        qtyOnHand: 200,
        unit: "pieces",
        sourceOrder: "Previous Order #ORD-944",
        details: "Dog Hooks in assembly bin",
      },
      {
        item: "Clips",
        qtyOnHand: 1,
        unit: "packets of 1000",
        sourceOrder: "Stock Lot #STK-49",
        details: "1 packet of 1000 crocodile badge clips in assembly bin",
      },
      {
        item: "Safety Jointer Buckles",
        qtyOnHand: 1,
        unit: "packets of 1000",
        sourceOrder: "Batch #LN-380",
        details: "1 packet of 1000 breakaway jointer buckles on hand",
      },
    ],
    activeJobsCount: 1,
    phone: "+91 98200 44554",
  },
];

// ─── Supporting Accessories Detection from Order Description ───────────────────
// ─── Registered Stock Item & Factory Unit Requirements ─────────────────────────
export type StockUnit = "packets of 1000" | "rolls" | "pieces";

export interface RegisteredStockItem {
  name: string;
  category: "HOOKS" | "LANYARDS" | "HOLDERS" | "OTHERS";
  canonicalUnit: StockUnit;
  packSize: number; // 1000 for clips/jointers, 200 for rolls, 1 for pieces
  unitDisplay: string; // "pkts (1000s)", "rolls", "pcs"
  requiredPacks: number;
  totalPieces: number;
  icon: string;
  badgeLabel: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  detectedReason: string;
  // Aliases for backwards compatibility
  unit: string;
  requiredQty: number;
}

export type RequiredMaterialItem = RegisteredStockItem;

const CLEAN_BADGE_STYLE = {
  badgeBg: "rgba(255, 255, 255, 0.05)",
  badgeColor: "#e2e8f0",
  badgeBorder: "rgba(255, 255, 255, 0.12)",
};

export function parseSupportingItemsFromDescription(
  description: string,
  itemOrdered: string,
  orderQty: number
): RegisteredStockItem[] {
  const desc = (description || "").toLowerCase();
  const items: RegisteredStockItem[] = [];
  const isCard = itemOrdered === "Card";

  // ─── 1. Lanyard Ribbon Rolls (Strictly 3 types: 12mm, 16mm, 20mm) ───────────────
  // Aliases/synonyms: ribbon, dori, lanyard, mpl, satin, multi-print
  const hasLanyardSignal =
    !isCard ||
    desc.includes("ribbon") ||
    desc.includes("dori") ||
    desc.includes("lanyard") ||
    desc.includes("mpl") ||
    desc.includes("12mm") ||
    desc.includes("16mm") ||
    desc.includes("20mm") ||
    desc.includes("10mm") ||
    desc.includes("15mm");

  if (hasLanyardSignal) {
    const rollsNeeded = Math.max(1, Math.ceil(orderQty / 200));

    if (desc.includes("12mm") || desc.includes("10mm") || desc.includes("12 mm") || desc.includes("10 mm")) {
      items.push({
        name: "12mm Lanyard Rolls",
        category: "LANYARDS",
        canonicalUnit: "rolls",
        packSize: 200,
        unitDisplay: "rolls",
        requiredPacks: rollsNeeded,
        totalPieces: rollsNeeded * 200,
        icon: "🎗️",
        badgeLabel: "12mm Lanyard",
        ...CLEAN_BADGE_STYLE,
        detectedReason: "12mm lanyard ribbon rolls required (unit: rolls of 200)",
        unit: "rolls",
        requiredQty: rollsNeeded,
      });
    } else if (desc.includes("20mm") || desc.includes("20 mm")) {
      items.push({
        name: "20mm Lanyard Rolls",
        category: "LANYARDS",
        canonicalUnit: "rolls",
        packSize: 200,
        unitDisplay: "rolls",
        requiredPacks: rollsNeeded,
        totalPieces: rollsNeeded * 200,
        icon: "🎗️",
        badgeLabel: "20mm Lanyard",
        ...CLEAN_BADGE_STYLE,
        detectedReason: "20mm lanyard ribbon rolls required (unit: rolls of 200)",
        unit: "rolls",
        requiredQty: rollsNeeded,
      });
    } else {
      // Default standard width or 15mm/16mm/ribbon/dori/lanyard/mpl
      items.push({
        name: "16mm Lanyard Rolls",
        category: "LANYARDS",
        canonicalUnit: "rolls",
        packSize: 200,
        unitDisplay: "rolls",
        requiredPacks: rollsNeeded,
        totalPieces: rollsNeeded * 200,
        icon: "🎗️",
        badgeLabel: "16mm Lanyard",
        ...CLEAN_BADGE_STYLE,
        detectedReason: "Standard 16mm lanyard ribbon rolls required (unit: rolls of 200)",
        unit: "rolls",
        requiredQty: rollsNeeded,
      });
    }
  }

  // ─── 2. Hooks (For Lanyard orders or if hook keyword is present) ─────────────────
  if (!isCard || desc.includes("hook")) {
    if (desc.includes("england hook")) {
      items.push({
        name: "England Hook",
        category: "HOOKS",
        canonicalUnit: "pieces",
        packSize: 1,
        unitDisplay: "pcs",
        requiredPacks: orderQty,
        totalPieces: orderQty,
        icon: "🪝",
        badgeLabel: "England Hook",
        ...CLEAN_BADGE_STYLE,
        detectedReason: "Matched keyword 'England Hook' in description",
        unit: "pieces",
        requiredQty: orderQty,
      });
    } else if (desc.includes("plastic hook") || desc.includes("snap hook")) {
      items.push({
        name: "Plastic Hook",
        category: "HOOKS",
        canonicalUnit: "pieces",
        packSize: 1,
        unitDisplay: "pcs",
        requiredPacks: orderQty,
        totalPieces: orderQty,
        icon: "🪝",
        badgeLabel: "Plastic Hook",
        ...CLEAN_BADGE_STYLE,
        detectedReason: "Matched keyword 'Plastic Hook' in description",
        unit: "pieces",
        requiredQty: orderQty,
      });
    } else if (!isCard || desc.includes("dog hook") || desc.includes("dog clip") || desc.includes("hook")) {
      items.push({
        name: "Dog Hook",
        category: "HOOKS",
        canonicalUnit: "pieces",
        packSize: 1,
        unitDisplay: "pcs",
        requiredPacks: orderQty,
        totalPieces: orderQty,
        icon: "🪝",
        badgeLabel: "Dog Hook",
        ...CLEAN_BADGE_STYLE,
        detectedReason: "Standard lanyard dog hook required",
        unit: "pieces",
        requiredQty: orderQty,
      });
    }
  }

  // ─── 3. Holders / Pouches / Pasting ─────────────────────────────────────────────
  const hasHolderKeyword =
    isCard ||
    desc.includes("holder") ||
    desc.includes("holders") ||
    desc.includes("pouch") ||
    desc.includes("sleeve") ||
    desc.includes("case") ||
    desc.includes("dst") ||
    desc.includes("crystal") ||
    desc.includes("pasting") ||
    desc.includes("-v") ||
    desc.includes("-h");

  if (hasHolderKeyword) {
    if (desc.includes("plastic holder-h") || desc.includes("horizontal") || desc.includes("-h holder") || desc.includes("holder-h")) {
      items.push({
        name: "Plastic Holder-H",
        category: "HOLDERS",
        canonicalUnit: "pieces",
        packSize: 1,
        unitDisplay: "pcs",
        requiredPacks: orderQty,
        totalPieces: orderQty,
        icon: "🏷️",
        badgeLabel: "Holder-H",
        ...CLEAN_BADGE_STYLE,
        detectedReason: "Matched horizontal pouch/holder in description",
        unit: "pieces",
        requiredQty: orderQty,
      });
    } else if (desc.includes("crystal")) {
      items.push({
        name: "Crystal Holder",
        category: "HOLDERS",
        canonicalUnit: "pieces",
        packSize: 1,
        unitDisplay: "pcs",
        requiredPacks: orderQty,
        totalPieces: orderQty,
        icon: "🏷️",
        badgeLabel: "Crystal Holder",
        ...CLEAN_BADGE_STYLE,
        detectedReason: "Matched crystal holder in description",
        unit: "pieces",
        requiredQty: orderQty,
      });
    } else if (desc.includes("dst-h")) {
      items.push({
        name: "DST-H",
        category: "HOLDERS",
        canonicalUnit: "pieces",
        packSize: 1,
        unitDisplay: "pcs",
        requiredPacks: orderQty,
        totalPieces: orderQty,
        icon: "🏷️",
        badgeLabel: "DST-H",
        ...CLEAN_BADGE_STYLE,
        detectedReason: "Matched DST-H holder in description",
        unit: "pieces",
        requiredQty: orderQty,
      });
    } else if (desc.includes("dst-v") || desc.includes("dst")) {
      items.push({
        name: "DST-V",
        category: "HOLDERS",
        canonicalUnit: "pieces",
        packSize: 1,
        unitDisplay: "pcs",
        requiredPacks: orderQty,
        totalPieces: orderQty,
        icon: "🏷️",
        badgeLabel: "DST-V",
        ...CLEAN_BADGE_STYLE,
        detectedReason: "Matched DST holder in description",
        unit: "pieces",
        requiredQty: orderQty,
      });
    } else {
      items.push({
        name: "Plastic Holder-V",
        category: "HOLDERS",
        canonicalUnit: "pieces",
        packSize: 1,
        unitDisplay: "pcs",
        requiredPacks: orderQty,
        totalPieces: orderQty,
        icon: "🏷️",
        badgeLabel: "Plastic Holder-V",
        ...CLEAN_BADGE_STYLE,
        detectedReason: "Standard vertical ID card holder required",
        unit: "pieces",
        requiredQty: orderQty,
      });
    }
  }

  // ─── 4. Clips (Factory unit: packets of 1000) ──────────────────────────────────
  const hasClipKeyword =
    isCard ||
    (desc.includes("clip") && !desc.includes("dog clip")) ||
    desc.includes("clips") ||
    desc.includes("crocodile");

  if (hasClipKeyword) {
    const clipPacks = Math.max(1, Math.ceil(orderQty / 1000));
    items.push({
      name: "Clips",
      category: "OTHERS",
      canonicalUnit: "packets of 1000",
      packSize: 1000,
      unitDisplay: "pkts (1000s)",
      requiredPacks: clipPacks,
      totalPieces: clipPacks * 1000,
      icon: "📦",
      badgeLabel: "Clips",
      ...CLEAN_BADGE_STYLE,
      detectedReason: "Matched clips in description (unit: packets of 1000)",
      unit: "packets of 1000",
      requiredQty: clipPacks,
    });
  }

  // ─── 5. Jointer / Breakaway Buckles (Factory unit: packets of 1000) ─────────────
  if (
    desc.includes("jointer") ||
    desc.includes("jointers") ||
    desc.includes("breakaway") ||
    desc.includes("buckle") ||
    desc.includes("release")
  ) {
    const jointerPacks = Math.max(1, Math.ceil(orderQty / 1000));
    items.push({
      name: "Safety Jointer Buckles",
      category: "OTHERS",
      canonicalUnit: "packets of 1000",
      packSize: 1000,
      unitDisplay: "pkts (1000s)",
      requiredPacks: jointerPacks,
      totalPieces: jointerPacks * 1000,
      icon: "🔗",
      badgeLabel: "Safety Jointer",
      ...CLEAN_BADGE_STYLE,
      detectedReason: "Matched jointer/breakaway in description (unit: packets of 1000)",
      unit: "packets of 1000",
      requiredQty: jointerPacks,
    });
  }

  // ─── 6. Rings / Keyrings ───────────────────────────────────────────────────────
  if (desc.includes("ring") || desc.includes("rings") || desc.includes("keyring") || desc.includes("split ring")) {
    items.push({
      name: "Split Key Rings",
      category: "OTHERS",
      canonicalUnit: "pieces",
      packSize: 1,
      unitDisplay: "pcs",
      requiredPacks: orderQty,
      totalPieces: orderQty,
      icon: "🔗",
      badgeLabel: "Split Rings",
      ...CLEAN_BADGE_STYLE,
      detectedReason: "Matched ring accessory in description",
      unit: "pieces",
      requiredQty: orderQty,
    });
  }

  return items;
}

export interface AssignedWorker {
  name: string;
  role: string;
  type: "STAFF" | "LABOUR";
  id?: string;
  contractorId?: string;
  allocatedQty?: number;
}

export interface ContractorAllocation {
  contractorId: string;
  contractorName: string;
  qty: number;
}

export interface OrderRecord {
  internalId: string;
  client: string;
  product: string; // Description (unified single text)
  itemOrdered: string; // One single product per order ("Card" | "Lanyard")
  itemsOrdered?: string[];
  qty: number;
  assignedTo?: AssignedWorker[]; // Assigned Employee (for Card) or Labour Contractor (for Lanyard)
  orderDate: string;
  deliveryDate: string;
  notes?: string;
  status?: string;
  // Labour Lanyard specific tracking:
  mplName?: string;
  size?: string; // "12mm" | "15mm" | "16mm" | "20mm"
  goneForPrint?: boolean;
  printAllocations?: ContractorAllocation[];
  isPrinted?: boolean;
  goneForFitting?: boolean;
}

export const INITIAL_ORDERS: OrderRecord[] = [
  {
    internalId: "ord-1",
    client: "St. Xavier's High School",
    mplName: "St. Xavier's High School",
    size: "15mm",
    product: "Multicolor Lanyards (15mm) — Satin ribbon with Dog Hook & Clips",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 2000,
    goneForPrint: true,
    printAllocations: [
      { contractorId: "lb-2", contractorName: "Kailash Heat Sublimation Lab", qty: 1000 },
      { contractorId: "lb-3", contractorName: "Shyam Screen Print Workshop", qty: 1000 },
    ],
    isPrinted: true,
    goneForFitting: true,
    assignedTo: [
      { name: "Ramesh Lanyard Stitching Unit", role: "Lanyard Stitching Labour", type: "LABOUR", contractorId: "lb-1" },
    ],
    orderDate: "28 Aug 2026",
    deliveryDate: "05 Sep 2026",
  },
  {
    internalId: "ord-2",
    client: "BHEL Township Admin",
    mplName: "BHEL Township Admin",
    size: "12mm",
    product: "Single Color Lanyards (10mm) — Navy blue polyester with Plastic Holder-V, Clips & Jointer",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 500,
    goneForPrint: true,
    printAllocations: [
      { contractorId: "lb-3", contractorName: "Shyam Screen Print Workshop", qty: 500 },
    ],
    isPrinted: true,
    goneForFitting: false,
    assignedTo: [
      { name: "Ramesh Lanyard Stitching Unit", role: "Lanyard Stitching Labour", type: "LABOUR", contractorId: "lb-1" },
    ],
    orderDate: "30 Aug 2026",
    deliveryDate: "07 Sep 2026",
  },
  {
    internalId: "ord-3",
    client: "Northwind Coffee",
    mplName: "Northwind Coffee",
    size: "16mm",
    product: "Custom Printed Premium Lanyards — Red/white satin print, Dog Hook & Safety Jointer",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 1500,
    goneForPrint: true,
    printAllocations: [
      { contractorId: "lb-2", contractorName: "Kailash Heat Sublimation Lab", qty: 1500 },
    ],
    isPrinted: false,
    goneForFitting: false,
    assignedTo: [
      { name: "Ramesh Lanyard Stitching Unit", role: "Lanyard Stitching Labour", type: "LABOUR", contractorId: "lb-1" },
    ],
    orderDate: "22 Aug 2026",
    deliveryDate: "02 Sep 2026",
  },
  {
    internalId: "ord-4",
    client: "AIIMS Bhopal",
    mplName: "AIIMS Bhopal",
    size: "58mm",
    product: "Medical Staff ID Cards — PVC laminated with Plastic Holder-V & Clips",
    itemOrdered: "Card",
    itemsOrdered: ["Card"],
    qty: 350,
    assignedTo: [
      { name: "Sneha Roy", role: "ID Card Print Specialist", type: "STAFF", id: "emp-1" },
    ],
    orderDate: "29 Aug 2026",
    deliveryDate: "04 Sep 2026",
  },
  {
    internalId: "ord-5",
    client: "Govt Engineering College Bhopal",
    mplName: "Govt Engineering College Bhopal",
    size: "58mm",
    product: "PVC Identity Cards (58mm) — Plastic Holder-H & Clips",
    itemOrdered: "Card",
    itemsOrdered: ["Card"],
    qty: 800,
    assignedTo: [
      { name: "Priya Nair", role: "Smart Card & Quality Operator", type: "STAFF", id: "emp-2" },
    ],
    orderDate: "25 Aug 2026",
    deliveryDate: "03 Sep 2026",
  },
  {
    internalId: "ord-6",
    client: "Reliance Retail - Bhopal",
    mplName: "Reliance Retail - Bhopal",
    size: "58mm",
    product: "Staff Access Cards — Barcode & magnetic stripe encoded with DST-V Holder",
    itemOrdered: "Card",
    itemsOrdered: ["Card"],
    qty: 200,
    assignedTo: [
      { name: "Dinesh Kumar", role: "Card Embossing & Encoding Worker", type: "STAFF", id: "emp-3" },
    ],
    orderDate: "01 Sep 2026",
    deliveryDate: "10 Sep 2026",
  },
  {
    internalId: "ord-7",
    client: "NIT Bhopal",
    mplName: "NIT Bhopal",
    size: "20mm",
    product: "Faculty + Student Lanyards — 20mm full color heat sublimation with Plastic Hook & Jointer",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 1200,
    goneForPrint: false,
    printAllocations: [],
    isPrinted: false,
    goneForFitting: false,
    assignedTo: [
      { name: "Kailash Heat Sublimation Lab", role: "Heat Transfer Contractor", type: "LABOUR", contractorId: "lb-2" },
    ],
    orderDate: "31 Aug 2026",
    deliveryDate: "08 Sep 2026",
  },
  {
    internalId: "ord-8",
    client: "Maulana Azad Hospital",
    mplName: "Maulana Azad Hospital",
    size: "12mm",
    product: "Staff ID Lanyards — Screen printed navy with England Hook & Clips",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 600,
    goneForPrint: false,
    printAllocations: [],
    isPrinted: false,
    goneForFitting: false,
    assignedTo: [
      { name: "Shyam Screen Print Workshop", role: "Screen Printing & Stamping", type: "LABOUR", contractorId: "lb-3" },
    ],
    orderDate: "03 Sep 2026",
    deliveryDate: "12 Sep 2026",
  },
  {
    internalId: "ord-9",
    client: "Smart City Council",
    mplName: "Smart City Council",
    size: "58mm",
    product: "Event Delegate Smart Cards — Magnetic clip back with Crystal Holder",
    itemOrdered: "Card",
    itemsOrdered: ["Card"],
    qty: 450,
    assignedTo: [
      { name: "Sneha Roy", role: "ID Card Print Specialist", type: "STAFF", id: "emp-1" },
    ],
    orderDate: "02 Sep 2026",
    deliveryDate: "06 Sep 2026",
  },
  {
    internalId: "ord-10",
    client: "Indraprastha School",
    mplName: "Indraprastha School",
    size: "16mm",
    product: "Heavy Duty School ID Lanyards — Transparent Plastic Holder-V with Dog Hook & Clips",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 1000,
    goneForPrint: false,
    printAllocations: [],
    isPrinted: false,
    goneForFitting: false,
    assignedTo: [
      { name: "Ramesh Lanyard Stitching Unit", role: "Lanyard Stitching Labour", type: "LABOUR", contractorId: "lb-1" },
    ],
    orderDate: "20 Aug 2026",
    deliveryDate: "01 Sep 2026",
  },
  {
    internalId: "ord-11",
    client: "MP Secretariat",
    mplName: "MP Secretariat",
    size: "58mm",
    product: "Embossed Security ID Cards — Hologram foil & micro-text overlay with Clips",
    itemOrdered: "Card",
    itemsOrdered: ["Card"],
    qty: 150,
    assignedTo: [
      { name: "Sunil Yadav", role: "ID Card Finishing & QC", type: "STAFF", id: "emp-4" },
    ],
    orderDate: "01 Sep 2026",
    deliveryDate: "09 Sep 2026",
  },
  {
    internalId: "ord-12",
    client: "Bansal Group Schools",
    mplName: "Bansal Group Schools",
    size: "12mm",
    product: "Lanyards (12mm Blue/White) — Double-sided print with Dog Hook, Clips & Safety Jointer",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 3000,
    goneForPrint: false,
    printAllocations: [],
    isPrinted: false,
    goneForFitting: false,
    assignedTo: [
      { name: "Ramesh Lanyard Stitching Unit", role: "Lanyard Stitching Labour", type: "LABOUR", contractorId: "lb-1" },
    ],
    orderDate: "27 Aug 2026",
    deliveryDate: "06 Sep 2026",
  },
];

// ─── Reactive Shared Orders Store ─────────────────────────────────────────────
let globalOrdersState: OrderRecord[] = [...INITIAL_ORDERS];
const orderSubscribers = new Set<() => void>();

export function useSharedOrders() {
  const [orders, setOrdersState] = useState<OrderRecord[]>(globalOrdersState);

  useEffect(() => {
    const notify = () => setOrdersState([...globalOrdersState]);
    orderSubscribers.add(notify);
    return () => {
      orderSubscribers.delete(notify);
    };
  }, []);

  const setOrders = (updater: OrderRecord[] | ((prev: OrderRecord[]) => OrderRecord[])) => {
    if (typeof updater === "function") {
      globalOrdersState = updater(globalOrdersState);
    } else {
      globalOrdersState = updater;
    }
    orderSubscribers.forEach((fn) => fn());
  };

  return [orders, setOrders] as const;
}

export type OrdersViewMode = "LANYARD_ORDERS" | "CARD_ORDERS" | "LABOUR_LANYARD";

export interface OrdersWorkspaceViewProps {
  clients?: any[];
  onSelectOrder?: (id: string) => void;
  filterClientName?: string;
  embedded?: boolean;
  mode?: OrdersViewMode;
}

// ─── Helper Badge for Single Product (Things Ordered) ─────────────────────────
export const ItemBadge: React.FC<{ name: string }> = ({ name }) => {
  const isLanyard = name.toLowerCase().includes("lanyard");
  const colors = isLanyard
    ? { bg: "rgba(168, 85, 247, 0.18)", text: "#c084fc", border: "rgba(168, 85, 247, 0.4)" }
    : { bg: "rgba(56, 189, 248, 0.18)", text: "#38bdf8", border: "rgba(56, 189, 248, 0.4)" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: "3px",
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontSize: "11.5px",
        fontWeight: 700,
        letterSpacing: "0.2px",
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </span>
  );
};

export const OrdersWorkspaceView: React.FC<OrdersWorkspaceViewProps> = ({
  clients = [],
  onSelectOrder,
  filterClientName,
  embedded = false,
  mode = "LANYARD_ORDERS",
}) => {
  const { success } = useToast();
  const [orders, setOrders] = useSharedOrders();
  const [search, setSearch] = useState("");
  const [filterItem, setFilterItem] = useState("ALL");
  const [sortField, setSortField] = useState<"client" | "qty" | "orderDate" | "deliveryDate">("deliveryDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // In-place Labour Profile viewing (from Labour Lanyard workspace)
  const [selectedContractorForProfile, setSelectedContractorForProfile] = useState<LabourProfileContractor | null>(null);
  const [labourSubTab, setLabourSubTab] = useState<"TABLE" | "CONTRACTORS">("TABLE");

  const handleOpenContractorProfile = (contractorNameOrId: string) => {
    const q = contractorNameOrId.toLowerCase();
    const matched = INITIAL_LABOUR.find(
      (c) => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()) || c.id.toLowerCase() === q
    ) || INITIAL_LABOUR[0];
    setSelectedContractorForProfile(matched);
  };

  // Combined client names list from props + defaults
  const clientNames = useMemo(() => {
    const propNames = (clients || []).map((c) => c.organization_name).filter(Boolean);
    const set = new Set([...propNames, ...DEFAULT_CLIENTS]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clients]);

  // ─── Separate Quick Entry Panel States (Above Table Header) ─────────────────
  const [newClient, setNewClient] = useState(filterClientName || "");
  const [newDescription, setNewDescription] = useState("");
  const [newItemOrdered, setNewItemOrdered] = useState<string>("Lanyard");
  const [customItemText, setCustomItemText] = useState("");
  const [newQty, setNewQty] = useState("");

  // Labour Lanyard Specific Entry & Print Allocation States
  const [newLanyardMplName, setNewLanyardMplName] = useState("");
  const [newLanyardSize, setNewLanyardSize] = useState("16mm");

  const [printModalOrder, setPrintModalOrder] = useState<OrderRecord | null>(null);
  const [selectedPrintContractorIds, setSelectedPrintContractorIds] = useState<string[]>([]);
  const [printQtys, setPrintQtys] = useState<Record<string, number>>({});

  const openPrintModal = (order: OrderRecord) => {
    setPrintModalOrder(order);
    if (order.printAllocations && order.printAllocations.length > 0) {
      setSelectedPrintContractorIds(order.printAllocations.map((a) => a.contractorId));
      const qtys: Record<string, number> = {};
      order.printAllocations.forEach((a) => {
        qtys[a.contractorId] = a.qty;
      });
      setPrintQtys(qtys);
    } else {
      const defaultId = PRINT_CONTRACTORS[0].id;
      setSelectedPrintContractorIds([defaultId]);
      setPrintQtys({ [defaultId]: order.qty });
    }
  };

  const handleTogglePrintContractor = (contractorId: string) => {
    if (!printModalOrder) return;
    const isSelected = selectedPrintContractorIds.includes(contractorId);
    if (isSelected) {
      const nextSelected = selectedPrintContractorIds.filter((id) => id !== contractorId);
      setSelectedPrintContractorIds(nextSelected);
      const nextQtys = { ...printQtys };
      delete nextQtys[contractorId];
      if (nextSelected.length === 1) {
        nextQtys[nextSelected[0]] = printModalOrder.qty;
      }
      setPrintQtys(nextQtys);
    } else {
      const nextSelected = [...selectedPrintContractorIds, contractorId];
      setSelectedPrintContractorIds(nextSelected);
      const count = nextSelected.length;
      const baseQty = Math.floor(printModalOrder.qty / count);
      const remainder = printModalOrder.qty - baseQty * count;
      const nextQtys: Record<string, number> = {};
      nextSelected.forEach((id, idx) => {
        nextQtys[id] = baseQty + (idx === 0 ? remainder : 0);
      });
      setPrintQtys(nextQtys);
    }
  };

  const handleDivideEqually = () => {
    if (!printModalOrder || selectedPrintContractorIds.length === 0) return;
    const count = selectedPrintContractorIds.length;
    const baseQty = Math.floor(printModalOrder.qty / count);
    const remainder = printModalOrder.qty - baseQty * count;
    const nextQtys: Record<string, number> = {};
    selectedPrintContractorIds.forEach((id, idx) => {
      nextQtys[id] = baseQty + (idx === 0 ? remainder : 0);
    });
    setPrintQtys(nextQtys);
  };

  const totalAllocatedPrint = useMemo(() => {
    return selectedPrintContractorIds.reduce((sum, id) => sum + (Number(printQtys[id]) || 0), 0);
  }, [selectedPrintContractorIds, printQtys]);

  const isAllocationBalanced = useMemo(() => {
    if (!printModalOrder) return false;
    return totalAllocatedPrint === printModalOrder.qty;
  }, [printModalOrder, totalAllocatedPrint]);

  const handleConfirmPrintAllocation = () => {
    if (!printModalOrder) return;
    if (selectedPrintContractorIds.length === 0) return;
    if (selectedPrintContractorIds.length > 1 && !isAllocationBalanced) return;

    const allocations: ContractorAllocation[] = selectedPrintContractorIds.map((id) => {
      const c = PRINT_CONTRACTORS.find((p) => p.id === id);
      return {
        contractorId: id,
        contractorName: c ? c.name : id,
        qty: selectedPrintContractorIds.length === 1 ? printModalOrder.qty : (Number(printQtys[id]) || 0),
      };
    });

    setOrders((prev) =>
      prev.map((o) => {
        if (o.internalId !== printModalOrder.internalId) return o;
        return {
          ...o,
          goneForPrint: true,
          printAllocations: allocations,
        };
      })
    );

    const summary = allocations.map((a) => `${a.contractorName} (${a.qty.toLocaleString()} units)`).join(" + ");
    success("Order Sent to Print", `Allocated to: ${summary}`);
    setPrintModalOrder(null);
  };

  // Keep newClient synced if filterClientName prop changes
  useEffect(() => {
    if (filterClientName) {
      setNewClient(filterClientName);
    }
  }, [filterClientName]);

  // Autocomplete dropdown for Client in Quick Entry Panel
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Filtered client suggestions for Quick Entry Panel
  const clientSuggestions = useMemo(() => {
    if (!newClient.trim()) return clientNames;
    const q = newClient.toLowerCase();
    return clientNames.filter((c) => c.toLowerCase().includes(q));
  }, [clientNames, newClient]);

  // ─── Worker Assignment & Order Dividing States ──────────────────────────────
  const [assigningOrder, setAssigningOrder] = useState<OrderRecord | null>(null);
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [isDivided, setIsDivided] = useState<boolean>(false);

  const isAssigningCard = useMemo(() => {
    return (assigningOrder?.itemOrdered || assigningOrder?.itemsOrdered?.[0] || "Lanyard") === "Card";
  }, [assigningOrder]);

  // When opening assign drawer for an order, pre-populate existing or default allocations
  useEffect(() => {
    if (assigningOrder) {
      const isCard = (assigningOrder.itemOrdered || assigningOrder.itemsOrdered?.[0] || "Lanyard") === "Card";
      const hasDividedAssignees = Boolean(assigningOrder.assignedTo && assigningOrder.assignedTo.length > 1);
      setIsDivided(hasDividedAssignees);

      if (assigningOrder.assignedTo && assigningOrder.assignedTo.length > 0) {
        setAllocations(
          assigningOrder.assignedTo.map((w, idx) => {
            const isStaff = w.type === "STAFF";
            const empMatch = isStaff ? INHOUSE_EMPLOYEES.find((e) => e.name === w.name || e.id === w.id) : null;
            const labMatch = !isStaff ? LABOUR_CONTRACTORS.find((c) => c.name === w.name || c.id === w.contractorId) : null;
            return {
              workerId: (isStaff ? empMatch?.id || w.id : labMatch?.id || w.contractorId) || (isStaff ? INHOUSE_EMPLOYEES[0].id : LABOUR_CONTRACTORS[0].id),
              workerName: w.name,
              workerRole: w.role || (isStaff ? empMatch?.role : labMatch?.specialty) || "",
              workerType: w.type,
              qty: w.allocatedQty !== undefined ? w.allocatedQty : (idx === 0 ? assigningOrder.qty : 0),
            };
          })
        );
      } else {
        // Initialize with 1 default assignee covering full order volume
        if (isCard) {
          const defaultEmp = INHOUSE_EMPLOYEES[0];
          setAllocations([
            {
              workerId: defaultEmp.id,
              workerName: defaultEmp.name,
              workerRole: defaultEmp.role,
              workerType: "STAFF",
              qty: assigningOrder.qty,
            },
          ]);
        } else {
          const defaultLab = LABOUR_CONTRACTORS[0];
          setAllocations([
            {
              workerId: defaultLab.id,
              workerName: defaultLab.name,
              workerRole: defaultLab.specialty,
              workerType: "LABOUR",
              qty: assigningOrder.qty,
            },
          ]);
        }
      }
    } else {
      setAllocations([]);
      setIsDivided(false);
    }
  }, [assigningOrder]);

  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, a) => sum + (Number(a.qty) || 0), 0);
  }, [allocations]);

  const remainingToAllocate = useMemo(() => {
    if (!assigningOrder) return 0;
    return Math.max(0, assigningOrder.qty - totalAllocated);
  }, [assigningOrder, totalAllocated]);

  const handleAddAllocation = () => {
    if (!assigningOrder) return;
    const isCard = isAssigningCard;
    const rem = remainingToAllocate > 0 ? remainingToAllocate : Math.max(1, Math.floor(assigningOrder.qty / (allocations.length + 1)));

    if (isCard) {
      const unused = INHOUSE_EMPLOYEES.find((e) => !allocations.some((a) => a.workerId === e.id)) || INHOUSE_EMPLOYEES[0];
      setAllocations((prev) => [
        ...prev,
        {
          workerId: unused.id,
          workerName: unused.name,
          workerRole: unused.role,
          workerType: "STAFF",
          qty: rem,
        },
      ]);
    } else {
      const unused = LABOUR_CONTRACTORS.find((c) => !allocations.some((a) => a.workerId === c.id)) || LABOUR_CONTRACTORS[0];
      setAllocations((prev) => [
        ...prev,
        {
          workerId: unused.id,
          workerName: unused.name,
          workerRole: unused.specialty,
          workerType: "LABOUR",
          qty: rem,
        },
      ]);
    }
  };

  const handleRemoveAllocation = (index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAllocation = (index: number, updates: Partial<AllocationRow>) => {
    setAllocations((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return { ...item, ...updates };
      })
    );
  };

  const handleSelectWorkerForAllocation = (index: number, workerId: string, workerType: "STAFF" | "LABOUR") => {
    if (workerType === "STAFF") {
      const emp = INHOUSE_EMPLOYEES.find((e) => e.id === workerId) || INHOUSE_EMPLOYEES[0];
      handleUpdateAllocation(index, {
        workerId: emp.id,
        workerName: emp.name,
        workerRole: emp.role,
        workerType: "STAFF",
      });
    } else {
      const lab = LABOUR_CONTRACTORS.find((c) => c.id === workerId) || LABOUR_CONTRACTORS[0];
      handleUpdateAllocation(index, {
        workerId: lab.id,
        workerName: lab.name,
        workerRole: lab.specialty,
        workerType: "LABOUR",
      });
    }
  };

  // Detected required items from order and description (shown as clean badges)
  const orderRequiredItems = useMemo(() => {
    if (!assigningOrder) return [];
    const itemOrdered = assigningOrder.itemOrdered || assigningOrder.itemsOrdered?.[0] || "Lanyard";
    return parseSupportingItemsFromDescription(assigningOrder.product, itemOrdered, assigningOrder.qty);
  }, [assigningOrder]);

  // Live detected stock requirements as the user types in Direct Order Entry
  const liveDetectedStock = useMemo(() => {
    const qty = parseInt(newQty, 10) || 500;
    return parseSupportingItemsFromDescription(newDescription, newItemOrdered, qty);
  }, [newDescription, newItemOrdered, newQty]);

  const handleConfirmAssignment = () => {
    if (!assigningOrder) return;
    const targetId = assigningOrder.internalId;

    const assignedWorkers: AssignedWorker[] = allocations.map((a) => ({
      name: a.workerName,
      role: a.workerRole,
      type: a.workerType,
      id: a.workerType === "STAFF" ? a.workerId : undefined,
      contractorId: a.workerType === "LABOUR" ? a.workerId : undefined,
      allocatedQty: Number(a.qty) || 0,
    }));

    setOrders((prev) =>
      prev.map((o) => {
        if (o.internalId !== targetId) return o;
        return {
          ...o,
          assignedTo: assignedWorkers,
        };
      })
    );

    const summaryText = assignedWorkers
      .map((w) => `${w.name} (${(w.allocatedQty || 0).toLocaleString()} units)`)
      .join(" + ");

    if (assignedWorkers.length > 1) {
      success(
        "Order Divided & Assigned",
        `Order divided across ${assignedWorkers.length} assignees: ${summaryText}. Stock buffer & handover managed on Labour Profile.`
      );
    } else {
      success(
        "Order Assigned",
        `Assigned ${assigningOrder.qty.toLocaleString()} units to ${assignedWorkers[0].name}. Stock buffer & handover managed on Labour Profile.`
      );
    }
    setAssigningOrder(null);
  };

  // ─── Double-Click Inline Editing State for Existing Rows ────────────────────
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof OrderRecord } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editItem, setEditItem] = useState<string>("Lanyard");
  const [editCustomItem, setEditCustomItem] = useState<string>("");
  const [isEditClientDropdownOpen, setIsEditClientDropdownOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && editInputRef.current && editingCell.field !== "itemOrdered") {
      editInputRef.current.focus();
      if (editingCell.field !== "client") {
        editInputRef.current.select();
      }
    }
  }, [editingCell]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(e.target as Node) &&
        clientInputRef.current &&
        !clientInputRef.current.contains(e.target as Node)
      ) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterOptions = ["ALL", "Lanyard", "Card"];

  const filteredOrders = useMemo(() => {
    let list = orders.filter((o) => {
      // 0. Mode specific product filtering
      const currentItem = o.itemOrdered || o.itemsOrdered?.[0] || "Lanyard";
      if (mode === "LANYARD_ORDERS" || mode === "LABOUR_LANYARD") {
        if (currentItem.toLowerCase() !== "lanyard") return false;
      } else if (mode === "CARD_ORDERS") {
        if (currentItem.toLowerCase() !== "card") return false;
      }

      // 1. Client filter if specific client tab
      if (filterClientName) {
        const clientA = o.client.toLowerCase().trim();
        const clientB = filterClientName.toLowerCase().trim();
        const matchClient =
          clientA === clientB ||
          clientA.includes(clientB) ||
          clientB.includes(clientA);
        if (!matchClient) return false;
      }

      // 2. Search query filter
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (o.mplName && o.mplName.toLowerCase().includes(q)) ||
        o.client.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        (o.size && o.size.toLowerCase().includes(q)) ||
        currentItem.toLowerCase().includes(q) ||
        (o.assignedTo || []).some((a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));

      return matchSearch;
    });

    list = [...list].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = typeof aVal === "number" ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [orders, search, filterItem, sortField, sortDir, filterClientName, mode]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ─── Add Order From Separate Quick Entry Panel ─────────────────────────────
  const handleAddFromQuickEntry = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const orderDateStr = `${String(now.getDate()).padStart(2, "0")} ${months[now.getMonth()]} ${now.getFullYear()}`;
    const plus7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const deliveryDateStr = `${String(plus7.getDate()).padStart(2, "0")} ${months[plus7.getMonth()]} ${plus7.getFullYear()}`;

    // Special quick entry handling for LABOUR_LANYARD: MPL Name, Size, Qty
    if (mode === "LABOUR_LANYARD") {
      const mplName = newLanyardMplName.trim() || "Custom Lanyard Job";
      const size = newLanyardSize || "16mm";
      const qty = parseInt(newQty, 10) || 500;

      const createdOrder: OrderRecord = {
        internalId: `ord-${Date.now()}`,
        client: mplName,
        mplName: mplName,
        size: size,
        product: `${mplName} (${size})`,
        itemOrdered: "Lanyard",
        itemsOrdered: ["Lanyard"],
        qty: qty,
        goneForPrint: false,
        printAllocations: [],
        isPrinted: false,
        goneForFitting: false,
        assignedTo: [],
        orderDate: orderDateStr,
        deliveryDate: deliveryDateStr,
      };

      setOrders([createdOrder, ...orders]);
      setNewLanyardMplName("");
      setNewQty("");
      success("Labour Order Created", `Added order for ${mplName} (${size}, ${qty.toLocaleString()} units). Ready to send for print.`);
      return;
    }

    const effectiveClient = (filterClientName || newClient).trim();
    if (!effectiveClient) {
      clientInputRef.current?.focus();
      return;
    }

    const finalItem = newItemOrdered === "Card" ? "Card" : "Lanyard";
    const finalDescription = newDescription.trim() || `${finalItem} Custom Production Run`;

    const createdOrder: OrderRecord = {
      internalId: `ord-${Date.now()}`,
      client: effectiveClient,
      product: finalDescription,
      itemOrdered: finalItem,
      itemsOrdered: [finalItem],
      qty: parseInt(newQty, 10) || 500,
      assignedTo: [],
      orderDate: orderDateStr,
      deliveryDate: deliveryDateStr,
    };

    setOrders([createdOrder, ...orders]);
    if (!filterClientName) {
      setNewClient("");
    }
    setNewDescription("");
    setNewQty("");
    setNewItemOrdered("Lanyard");
    setIsClientDropdownOpen(false);
    success("Order Created", `Added order for ${createdOrder.client}. Click 'Assign' to delegate.`);
  };

  // ─── Save Inline Edit ──────────────────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.internalId !== id) return o;
        if (field === "qty") {
          return { ...o, qty: parseInt(editValue, 10) || 0 };
        }
        if (field === "mplName") {
          return { ...o, mplName: editValue, client: editValue, product: `${editValue} (${o.size || "16mm"})` };
        }
        if (field === "itemOrdered") {
          const finalItem = editItem === "Card" ? "Card" : "Lanyard";
          let newAssignedTo = o.assignedTo;
          const currentType = o.assignedTo?.[0]?.type;
          if (finalItem === "Card" && currentType !== "STAFF") {
            newAssignedTo = [{ name: INHOUSE_EMPLOYEES[0].name, role: INHOUSE_EMPLOYEES[0].role, type: "STAFF", id: INHOUSE_EMPLOYEES[0].id }];
          } else if (finalItem === "Lanyard" && currentType !== "LABOUR") {
            newAssignedTo = [{ name: LABOUR_CONTRACTORS[0].name, role: LABOUR_CONTRACTORS[0].specialty, type: "LABOUR", id: LABOUR_CONTRACTORS[0].id, contractorId: LABOUR_CONTRACTORS[0].id }];
          }
          return { ...o, itemOrdered: finalItem, itemsOrdered: [finalItem], assignedTo: newAssignedTo };
        }
        return { ...o, [field]: editValue };
      })
    );

    setEditingCell(null);
    setIsEditClientDropdownOpen(false);
    success("Saved", `Updated order details`);
  };

  const handleStartEdit = (order: OrderRecord, field: keyof OrderRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCell({ id: order.internalId, field });
    if (field === "mplName") {
      setEditValue(order.mplName || order.client || order.product);
    } else {
      setEditValue(String(order[field] ?? ""));
    }

    if (field === "client" && !filterClientName) {
      setIsEditClientDropdownOpen(true);
    } else if (field === "itemOrdered") {
      const current = order.itemOrdered || order.itemsOrdered?.[0] || "Lanyard";
      setEditItem(current === "Card" ? "Card" : "Lanyard");
    }
  };

  const editClientSuggestions = useMemo(() => {
    if (!editValue.trim()) return clientNames;
    const q = editValue.toLowerCase();
    return clientNames.filter((c) => c.toLowerCase().includes(q));
  }, [clientNames, editValue]);

  // If user clicked into a Labour Contractor profile from Labour Lanyard
  if (selectedContractorForProfile) {
    return (
      <LabourDetailProfileView
        contractor={selectedContractorForProfile}
        onBack={() => setSelectedContractorForProfile(null)}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", overflowY: "auto" }}>

      {/* ─── TOP FILTER BAR ─────────────────────────────────────────────────── */}
      <div
        style={{
          padding: embedded ? "10px 16px" : "12px 24px",
          backgroundColor: "rgba(14, 18, 26, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Mode Badge / Toggle & Search Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "300px", maxWidth: "800px" }}>
          {/* Mode Title Badges & Toggles */}
          {mode === "LANYARD_ORDERS" && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#c084fc",
                padding: "5px 10px",
                borderRadius: "3px",
                backgroundColor: "rgba(168, 85, 247, 0.12)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                whiteSpace: "nowrap",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              🏷️ Lanyard Order
            </span>
          )}

          {mode === "CARD_ORDERS" && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#38bdf8",
                padding: "5px 10px",
                borderRadius: "3px",
                backgroundColor: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                whiteSpace: "nowrap",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              🪪 ID Card Order
            </span>
          )}

          {mode === "LABOUR_LANYARD" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#fb923c",
                  padding: "5px 10px",
                  borderRadius: "3px",
                  backgroundColor: "rgba(249, 115, 22, 0.12)",
                  border: "1px solid rgba(249, 115, 22, 0.3)",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                🤝 Labour Lanyard
              </span>

              {/* Sub-tab switcher */}
              <div
                style={{
                  display: "flex",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  borderRadius: "4px",
                  padding: "2px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setLabourSubTab("TABLE")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "3px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: labourSubTab === "TABLE" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                    color: labourSubTab === "TABLE" ? "#fff" : "var(--text-muted)",
                  }}
                >
                  📋 Orders Table
                </button>
                <button
                  type="button"
                  onClick={() => setLabourSubTab("CONTRACTORS")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "3px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: labourSubTab === "CONTRACTORS" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                    color: labourSubTab === "CONTRACTORS" ? "#fff" : "var(--text-muted)",
                  }}
                >
                  👥 Contractors & Buffers ({INITIAL_LABOUR.length})
                </button>
              </div>
            </div>
          )}

          {/* Search Box */}
          <div
            style={{
              position: "relative",
              flex: 1,
              backgroundColor: "rgba(10, 14, 23, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "var(--radius-sm, 4px)",
              height: "var(--input-height, 36px)",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: "8px",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            <Icon name="search" size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={
                filterClientName
                  ? `Search orders for ${filterClientName}...`
                  : mode === "LANYARD_ORDERS"
                  ? "Search lanyard orders by client or worker..."
                  : mode === "CARD_ORDERS"
                  ? "Search card orders by client or staff..."
                  : mode === "LABOUR_LANYARD"
                  ? "Search labour lanyard orders..."
                  : "Search orders by client, product, or worker..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "13px",
              }}
            />
            {search && (
              <span
                onClick={() => setSearch("")}
                style={{ cursor: "pointer", color: "var(--text-muted)", fontSize: "12px", padding: "2px" }}
              >
                ✕
              </span>
            )}
          </div>

        </div>

        {/* Right: Counter, Hint & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ color: "#38bdf8" }}>💡</span> Double-click row to edit · Click 'Assign' to delegate
          </span>

          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              padding: "5px 10px",
              borderRadius: "3px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              fontFamily: "var(--font-mono)",
            }}
          >
            {filteredOrders.length} Orders
          </span>

          <Button
            variant="secondary"
            size="sm"
            icon="refresh"
            style={{ borderRadius: "3px", height: "36px" }}
            onClick={() => success("Refreshed", "Orders synchronized")}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div style={{ padding: embedded ? "16px 0" : "18px 24px", flex: 1 }}>

        {/* ─── DEDICATED DIRECT ORDER ENTRY BAR (Separated Above Table) ──────── */}
        <div
          style={{
            position: "relative",
            zIndex: 35,
            overflow: "visible",
            marginBottom: "18px",
            backgroundColor: "rgba(16, 21, 32, 0.95)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(255, 138, 115, 0.28)",
            borderRadius: "6px",
            padding: "16px 20px",
            boxShadow: "0 8px 28px rgba(0, 0, 0, 0.45)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: "var(--accent-text)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span>⚡</span> Direct Order Entry
              </span>
              <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                Add new production order directly above table
              </span>
            </div>

            {filterClientName && (
              <span
                style={{
                  fontSize: "11px",
                  color: "#fff",
                  backgroundColor: "rgba(255, 138, 115, 0.12)",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 138, 115, 0.3)",
                }}
              >
                Adding order for: <strong>{filterClientName}</strong>
              </span>
            )}
          </div>

          {mode === "LABOUR_LANYARD" ? (
            /* LABOUR_LANYARD: MPL Name, Size, Qty, + Add Order */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2.5fr 130px 110px auto",
                gap: "12px",
                alignItems: "start",
              }}
            >
              {/* 1. MPL Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  MPL Name
                </label>
                <input
                  type="text"
                  placeholder="MPL / Job Name (e.g. Tata Motors, Bhopal Academy, School Lanyard)..."
                  value={newLanyardMplName}
                  onChange={(e) => setNewLanyardMplName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddFromQuickEntry();
                  }}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 12px",
                    backgroundColor: "rgba(9, 12, 19, 0.85)",
                    border: "1px solid rgba(249, 115, 22, 0.4)",
                    borderRadius: "var(--radius-sm, 4px)",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* 2. Size */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Size
                </label>
                <select
                  value={newLanyardSize}
                  onChange={(e) => setNewLanyardSize(e.target.value)}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    backgroundColor: "rgba(9, 12, 19, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "var(--radius-sm, 4px)",
                    color: "#fbbf24",
                    fontSize: "13px",
                    fontWeight: 700,
                    outline: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="12mm" style={{ backgroundColor: "#0e131f", color: "#38bdf8" }}>12mm</option>
                  <option value="15mm" style={{ backgroundColor: "#0e131f", color: "#c084fc" }}>15mm</option>
                  <option value="16mm" style={{ backgroundColor: "#0e131f", color: "#fbbf24" }}>16mm</option>
                  <option value="20mm" style={{ backgroundColor: "#0e131f", color: "#34d399" }}>20mm</option>
                </select>
              </div>

              {/* 3. Qty */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Qty
                </label>
                <input
                  type="number"
                  placeholder="500"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddFromQuickEntry();
                  }}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 8px",
                    backgroundColor: "rgba(9, 12, 19, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "var(--radius-sm, 4px)",
                    color: "#fff",
                    fontSize: "13px",
                    fontFamily: "var(--font-mono)",
                    textAlign: "center",
                    fontWeight: 700,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* 4. Action Button */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "transparent", letterSpacing: "0.5px" }}>
                  Add
                </label>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleAddFromQuickEntry()}
                  style={{ height: "36px", whiteSpace: "nowrap", backgroundColor: "#f97316", borderColor: "#ea580c", color: "#fff" }}
                >
                  + Add Order
                </Button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.1fr 2.6fr 110px auto",
                gap: "12px",
                alignItems: "start",
              }}
            >
              {/* 1. Client Field */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Client
                </label>
                {filterClientName ? (
                  <div
                    style={{
                      height: "36px",
                      padding: "0 12px",
                      backgroundColor: "rgba(9, 12, 19, 0.95)",
                      border: "1px solid var(--accent-border)",
                      borderRadius: "var(--radius-sm, 4px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 700,
                      boxSizing: "border-box",
                    }}
                    title="Locked for this client"
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {filterClientName}
                    </span>
                    <span style={{ fontSize: "9.5px", color: "var(--accent-text)", opacity: 0.85, letterSpacing: "0.5px" }}>
                      LOCKED
                    </span>
                  </div>
                ) : (
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      ref={clientInputRef}
                      type="text"
                      placeholder="Search client..."
                      value={newClient}
                      onChange={(e) => {
                        setNewClient(e.target.value);
                        setIsClientDropdownOpen(true);
                      }}
                      onFocus={() => setIsClientDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddFromQuickEntry();
                      }}
                      style={{
                        width: "100%",
                        height: "36px",
                        padding: "0 34px 0 12px",
                        backgroundColor: "rgba(9, 12, 19, 0.85)",
                        border: "1px solid var(--accent-border)",
                        borderRadius: "var(--radius-sm, 4px)",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 600,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <span
                      onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                      style={{
                        position: "absolute",
                        right: "13px",
                        cursor: "pointer",
                        fontSize: "10px",
                        color: "var(--accent-text)",
                        userSelect: "none",
                      }}
                    >
                      ▼
                    </span>

                    {/* Floating Suggestions */}
                    {isClientDropdownOpen && (
                      <div
                        ref={clientDropdownRef}
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 100,
                          backgroundColor: "#0c101a",
                          border: "1px solid var(--accent-border)",
                          borderRadius: "3px",
                          maxHeight: "240px",
                          overflowY: "auto",
                          boxShadow: "0 12px 36px rgba(0,0,0,0.8)",
                          marginTop: "4px",
                        }}
                      >
                        <div style={{ padding: "8px 12px", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                          Registered Clients ({clientSuggestions.length})
                        </div>
                        {clientSuggestions.length === 0 ? (
                          <div style={{ padding: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                            No matching client. Press Enter to add "{newClient}"
                          </div>
                        ) : (
                          clientSuggestions.map((c) => (
                            <div
                              key={c}
                              onClick={() => {
                                setNewClient(c);
                                setIsClientDropdownOpen(false);
                              }}
                              style={{
                                padding: "9px 12px",
                                fontSize: "12.5px",
                                color: "#fff",
                                cursor: "pointer",
                                borderBottom: "1px solid rgba(255,255,255,0.03)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--accent-soft)";
                                e.currentTarget.style.borderLeft = "2px solid var(--accent)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.borderLeft = "none";
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{c}</span>
                              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>SELECT</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Order */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Order
                </label>
                <select
                  value={newItemOrdered}
                  onChange={(e) => setNewItemOrdered(e.target.value)}
                  disabled={mode === "LANYARD_ORDERS" || mode === "CARD_ORDERS"}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 34px 0 12px",
                    backgroundColor: "rgba(9, 12, 19, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "var(--radius-sm, 4px)",
                    color: newItemOrdered === "Lanyard" ? "#c084fc" : "#38bdf8",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    outline: "none",
                    cursor: (mode === "LANYARD_ORDERS" || mode === "CARD_ORDERS") ? "default" : "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  {mode !== "CARD_ORDERS" && (
                    <option value="Lanyard" style={{ backgroundColor: "#0e131f", color: "#c084fc" }}>Lanyard</option>
                  )}
                  {mode !== "LANYARD_ORDERS" && (
                    <option value="Card" style={{ backgroundColor: "#0e131f", color: "#38bdf8" }}>Card</option>
                  )}
                </select>
              </div>

              {/* 3. Description (Single unified text field) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder={
                    mode === "CARD_ORDERS"
                      ? "Description (e.g. 58mm PVC, Plastic Holder-V, Clips)..."
                      : "Description (e.g. 16mm Dori, Dog Hook, Plastic Holder-V)..."
                  }
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddFromQuickEntry();
                  }}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 12px",
                    backgroundColor: "rgba(9, 12, 19, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "var(--radius-sm, 4px)",
                    color: "#fff",
                    fontSize: "12.5px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* 4. Quantity */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Qty
                </label>
                <input
                  type="number"
                  placeholder="500"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddFromQuickEntry();
                  }}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 8px",
                    backgroundColor: "rgba(9, 12, 19, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "var(--radius-sm, 4px)",
                    color: "#fff",
                    fontSize: "13px",
                    fontFamily: "var(--font-mono)",
                    textAlign: "center",
                    fontWeight: 700,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* 5. Action Button */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "transparent", letterSpacing: "0.5px" }}>
                  Add
                </label>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleAddFromQuickEntry()}
                  style={{ height: "36px", whiteSpace: "nowrap" }}
                >
                  + Add Order
                </Button>
              </div>
            </div>
          )}

          {/* Live Auto-Registered Stock Requirements Preview */}
          {liveDetectedStock.length > 0 && (
            <div
              style={{
                marginTop: "12px",
                padding: "8px 12px",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>📦</span>
                <span>Auto-Registered Stock Requirements:</span>
              </span>
              {liveDetectedStock.map((stk, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: stk.badgeBg,
                    color: stk.badgeColor,
                    border: `1px solid ${stk.badgeBorder}`,
                  }}
                  title={`Unit: ${stk.canonicalUnit} · Total: ${stk.totalPieces.toLocaleString()} pcs (${stk.detectedReason})`}
                >
                  <span>{stk.icon}</span>
                  <span>{stk.badgeLabel}</span>
                </span>
              ))}
              <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "auto" }}>
                Auto-recognized from description
              </span>
            </div>
          )}
        </div>

        {/* ─── ORDERS TABLE OR CONTRACTORS OVERVIEW ────── */}
        {mode === "LABOUR_LANYARD" && labourSubTab === "CONTRACTORS" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {INITIAL_LABOUR.map((contractor) => {
              const assigned = orders.filter((o) =>
                o.assignedTo?.some(
                  (w) =>
                    w.name.toLowerCase().includes(contractor.name.toLowerCase()) ||
                    contractor.name.toLowerCase().includes(w.name.toLowerCase()) ||
                    w.contractorId === contractor.id
                )
              );
              const activeUnits = assigned.reduce((sum, o) => {
                const match = o.assignedTo?.find(
                  (w) =>
                    w.name.toLowerCase().includes(contractor.name.toLowerCase()) ||
                    contractor.name.toLowerCase().includes(w.name.toLowerCase()) ||
                    w.contractorId === contractor.id
                );
                return sum + (match?.allocatedQty ?? o.qty);
              }, 0);
              const capacityPct = Math.min(100, Math.round((activeUnits / 2500) * 100));

              return (
                <div
                  key={contractor.id}
                  style={{
                    backgroundColor: "rgba(19, 23, 34, 0.85)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "6px",
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#fff" }}>
                        {contractor.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                        {contractor.workstation} • {contractor.phone}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "9.5px",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "2px",
                        backgroundColor: "rgba(249, 115, 22, 0.15)",
                        color: "#fb923c",
                      }}
                    >
                      {contractor.status}
                    </span>
                  </div>

                  {/* Active Workload Bar (2,500 limit) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Active Production Load:</span>
                      <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
                        {activeUnits.toLocaleString()} / 2,500 units
                      </strong>
                    </div>
                    <div style={{ height: "6px", width: "100%", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${capacityPct}%`,
                          backgroundColor: capacityPct >= 100 ? "#f97316" : "#0ea5e9",
                          borderRadius: "3px",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "10px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {assigned.length} Active Orders
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenContractorProfile(contractor.id)}
                      style={{
                        fontSize: "11px",
                        padding: "4px 12px",
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.16)",
                        color: "#fff",
                      }}
                    >
                      Open Profile & Buffers →
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "rgba(16, 21, 32, 0.85)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "6px",
              boxShadow: "0 10px 36px rgba(0, 0, 0, 0.48)",
              overflow: "hidden",
            }}
          >
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "13px" }}>
            <thead>
              {mode === "LABOUR_LANYARD" ? (
                <tr
                  style={{
                    background: "linear-gradient(180deg, #161c2c 0%, #0d121c 100%)",
                    color: "#94a3b8",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    fontWeight: 800,
                    letterSpacing: "0.8px",
                    userSelect: "none",
                  }}
                >
                  {/* 1. MPL Name */}
                  <th
                    style={{
                      padding: "16px 18px",
                      textAlign: "left",
                      cursor: "pointer",
                      width: "220px",
                      borderBottom: "2px solid rgba(249, 115, 22, 0.5)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                    onClick={() => toggleSort("client")}
                  >
                    MPL Name {sortField === "client" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>

                  {/* 2. Size */}
                  <th
                    style={{
                      padding: "16px 14px",
                      textAlign: "center",
                      width: "90px",
                      borderBottom: "2px solid rgba(249, 115, 22, 0.5)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    Size
                  </th>

                  {/* 3. Qty */}
                  <th
                    style={{
                      padding: "16px 16px",
                      textAlign: "center",
                      width: "110px",
                      cursor: "pointer",
                      borderBottom: "2px solid rgba(249, 115, 22, 0.5)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                    onClick={() => toggleSort("qty")}
                  >
                    Qty {sortField === "qty" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>

                  {/* 4. Gone for Print */}
                  <th
                    style={{
                      padding: "16px 18px",
                      textAlign: "center",
                      width: "250px",
                      borderBottom: "2px solid rgba(249, 115, 22, 0.5)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    Gone for Print
                  </th>

                  {/* 5. Is Printed */}
                  <th
                    style={{
                      padding: "16px 16px",
                      textAlign: "center",
                      width: "140px",
                      borderBottom: "2px solid rgba(249, 115, 22, 0.5)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    Is Printed
                  </th>

                  {/* 6. Gone for Fitting */}
                  <th
                    style={{
                      padding: "16px 16px",
                      textAlign: "center",
                      width: "150px",
                      borderBottom: "2px solid rgba(249, 115, 22, 0.5)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    Gone for Fitting
                  </th>

                </tr>
              ) : (
                <tr
                  style={{
                    background: "linear-gradient(180deg, #161c2c 0%, #0d121c 100%)",
                    color: "#94a3b8",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    fontWeight: 800,
                    letterSpacing: "0.8px",
                    userSelect: "none",
                  }}
                >
                  {/* 1. CLIENT */}
                  <th
                    style={{
                      padding: "16px 18px",
                      textAlign: "left",
                      cursor: "pointer",
                      width: "200px",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                    onClick={() => toggleSort("client")}
                  >
                    Client {sortField === "client" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>

                  {/* 2. ORDER */}
                  <th
                    style={{
                      padding: "16px 16px",
                      textAlign: "left",
                      width: "135px",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    Order
                  </th>

                  {/* 3. DESCRIPTION */}
                  <th
                    style={{
                      padding: "16px 18px",
                      textAlign: "left",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    Description
                  </th>

                  {/* 4. QUANTITY */}
                  <th
                    style={{
                      padding: "16px 16px",
                      textAlign: "center",
                      width: "95px",
                      cursor: "pointer",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                    onClick={() => toggleSort("qty")}
                  >
                    Quantity {sortField === "qty" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>

                  {/* 5. ASSIGNED */}
                  <th
                    style={{
                      padding: "16px 18px",
                      textAlign: "left",
                      width: "220px",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    Assigned
                  </th>

                  {/* 6. ORDER DATE */}
                  <th
                    style={{
                      padding: "16px 14px",
                      textAlign: "left",
                      width: "115px",
                      cursor: "pointer",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                    onClick={() => toggleSort("orderDate")}
                  >
                    Order Date {sortField === "orderDate" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>

                  {/* 7. DELIVERY DUE */}
                  <th
                    style={{
                      padding: "16px 14px",
                      textAlign: "left",
                      width: "115px",
                      cursor: "pointer",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                      borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                    onClick={() => toggleSort("deliveryDate")}
                  >
                    Delivery Due {sortField === "deliveryDate" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>

                  {/* 8. ACTION */}
                  <th
                    style={{
                      padding: "16px 16px",
                      textAlign: "center",
                      width: "110px",
                      borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                    }}
                  >
                    Action
                  </th>
                </tr>
              )}
            </thead>
            <tbody>

              {/* ─── ORDERS ROWS (Spacious 68px Row Height, Double-Click Editable) ─ */}
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={mode === "LABOUR_LANYARD" ? 6 : 8} style={{ padding: "50px 0", textAlign: "center", color: "var(--text-muted)" }}>
                    {filterClientName
                      ? `No orders found for ${filterClientName}. Use the Direct Order Entry panel above to create one.`
                      : "No orders match your search criteria. Use the Direct Order Entry panel above to create one."}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const isEditing = (field: keyof OrderRecord) =>
                    editingCell?.id === order.internalId && editingCell?.field === field;

                  if (mode === "LABOUR_LANYARD") {
                    const sizeStr = order.size || "16mm";
                    const sizeColor =
                      sizeStr === "12mm"
                        ? { bg: "rgba(56, 189, 248, 0.15)", text: "#38bdf8", border: "rgba(56, 189, 248, 0.35)" }
                        : sizeStr === "15mm"
                        ? { bg: "rgba(192, 132, 252, 0.15)", text: "#c084fc", border: "rgba(192, 132, 252, 0.35)" }
                        : sizeStr === "16mm"
                        ? { bg: "rgba(251, 191, 36, 0.15)", text: "#fbbf24", border: "rgba(251, 191, 36, 0.35)" }
                        : { bg: "rgba(52, 211, 153, 0.15)", text: "#34d399", border: "rgba(52, 211, 153, 0.35)" };

                    return (
                      <tr
                        key={order.internalId}
                        style={{
                          height: "68px",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                          backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)")}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)")
                        }
                      >
                        {/* 1. MPL Name */}
                        <td
                          style={{
                            padding: "16px 18px",
                            cursor: "text",
                            position: "relative",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                          onDoubleClick={(e) => handleStartEdit(order, "mplName", e)}
                          title="Double-click to edit MPL Name"
                        >
                          {isEditing("mplName") ? (
                            <input
                              ref={editInputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              style={{
                                width: "100%",
                                height: "36px",
                                padding: "0 10px",
                                backgroundColor: "rgba(0,0,0,0.85)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "3px",
                                color: "#fff",
                                fontSize: "13px",
                                fontWeight: 700,
                                outline: "none",
                              }}
                            />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "14px" }}>🏷️</span>
                              <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>
                                {order.mplName || order.client || order.product}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 2. Size */}
                        <td
                          style={{
                            padding: "16px 14px",
                            textAlign: "center",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: "4px",
                              backgroundColor: sizeColor.bg,
                              border: `1px solid ${sizeColor.border}`,
                              color: sizeColor.text,
                              fontSize: "12px",
                              fontWeight: 700,
                              fontFamily: "var(--font-mono)",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {sizeStr}
                          </span>
                        </td>

                        {/* 3. Qty */}
                        <td
                          style={{
                            padding: "16px 16px",
                            textAlign: "center",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                            cursor: "text",
                          }}
                          onDoubleClick={(e) => handleStartEdit(order, "qty", e)}
                          title="Double-click to edit quantity"
                        >
                          {isEditing("qty") ? (
                            <input
                              ref={editInputRef}
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              style={{
                                width: "90px",
                                height: "34px",
                                padding: "0 6px",
                                backgroundColor: "rgba(0,0,0,0.85)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "3px",
                                color: "#fff",
                                fontSize: "13px",
                                fontFamily: "var(--font-mono)",
                                textAlign: "center",
                                fontWeight: 700,
                                outline: "none",
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: "14px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                              {order.qty.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* 4. Gone for Print */}
                        <td
                          style={{
                            padding: "14px 16px",
                            textAlign: "center",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                        >
                          {!order.goneForPrint ? (
                            <button
                              type="button"
                              onClick={() => openPrintModal(order)}
                              style={{
                                height: "32px",
                                padding: "0 14px",
                                borderRadius: "5px",
                                backgroundColor: "rgba(249, 115, 22, 0.15)",
                                border: "1px solid rgba(249, 115, 22, 0.4)",
                                color: "#fb923c",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.15s ease",
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(249, 115, 22, 0.28)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(249, 115, 22, 0.15)")}
                              title="Select print contractor(s) and divide quantity"
                            >
                              <span>🖨️</span>
                              <span>Send to Print ▼</span>
                            </button>
                          ) : (
                            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                              <div
                                onClick={() => openPrintModal(order)}
                                style={{
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "4px 10px",
                                  borderRadius: "5px",
                                  backgroundColor: "rgba(34, 197, 94, 0.14)",
                                  border: "1px solid rgba(34, 197, 94, 0.35)",
                                  color: "#4ade80",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                }}
                                title="Click to view/change print contractor allocation"
                              >
                                <span>✓</span>
                                <span>Gone for Print</span>
                                <span style={{ fontSize: "10px", opacity: 0.7 }}>✎</span>
                              </div>
                              {order.printAllocations && order.printAllocations.length > 0 && (
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--text-muted)",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "4px",
                                    justifyContent: "center",
                                  }}
                                >
                                  {order.printAllocations.map((a) => (
                                    <span
                                      key={a.contractorId}
                                      style={{
                                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                                        padding: "1px 6px",
                                        borderRadius: "3px",
                                        color: "#e2e8f0",
                                      }}
                                    >
                                      {a.contractorName.replace(" Workshop", "").replace(" Unit", "").replace(" Lab", "")} ({a.qty})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 5. Is Printed */}
                        <td
                          style={{
                            padding: "14px 14px",
                            textAlign: "center",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                        >
                          {!order.goneForPrint ? (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                opacity: 0.35,
                                cursor: "not-allowed",
                              }}
                              title="Mark 'Gone for Print' first"
                            >
                              <input type="checkbox" disabled checked={false} style={{ cursor: "not-allowed" }} />
                              <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Printed</span>
                            </div>
                          ) : (
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                cursor: "pointer",
                                padding: "5px 10px",
                                borderRadius: "5px",
                                backgroundColor: order.isPrinted ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.05)",
                                border: order.isPrinted ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(255, 255, 255, 0.12)",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(order.isPrinted)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setOrders((prev) =>
                                    prev.map((o) => (o.internalId === order.internalId ? { ...o, isPrinted: checked } : o))
                                  );
                                  if (checked) {
                                    success("Marked as Printed", `${order.mplName || order.client} is printed. Gone for Fitting is now unlocked!`);
                                  }
                                }}
                                style={{ cursor: "pointer", accentColor: "#22c55e" }}
                              />
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: order.isPrinted ? "#4ade80" : "#94a3b8",
                                  userSelect: "none",
                                }}
                              >
                                {order.isPrinted ? "Printed ✓" : "Mark Printed"}
                              </span>
                            </label>
                          )}
                        </td>

                        {/* 6. Gone for Fitting */}
                        <td
                          style={{
                            padding: "14px 14px",
                            textAlign: "center",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                        >
                          {!order.isPrinted ? (
                            <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.2)", fontStyle: "italic", userSelect: "none" }}>
                              — Pending Print —
                            </span>
                          ) : (
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                cursor: "pointer",
                                padding: "5px 10px",
                                borderRadius: "5px",
                                backgroundColor: order.goneForFitting ? "rgba(168, 85, 247, 0.18)" : "rgba(255, 255, 255, 0.05)",
                                border: order.goneForFitting ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid rgba(255, 255, 255, 0.15)",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(order.goneForFitting)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setOrders((prev) =>
                                    prev.map((o) => (o.internalId === order.internalId ? { ...o, goneForFitting: checked } : o))
                                  );
                                  if (checked) {
                                    success("Gone for Fitting", `${order.mplName || order.client} sent for assembly & fitting.`);
                                  }
                                }}
                                style={{ cursor: "pointer", accentColor: "#a855f7" }}
                              />
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: order.goneForFitting ? "#c084fc" : "#cbd5e1",
                                  userSelect: "none",
                                }}
                              >
                                {order.goneForFitting ? "In Fitting ✓" : "Send for Fitting"}
                              </span>
                            </label>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={order.internalId}
                      style={{
                        height: "68px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                        backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)")
                      }
                    >
                      {/* 1. Client */}
                      {mode !== "LABOUR_LANYARD" && (
                        <td
                          style={{
                            padding: "16px 18px",
                            cursor: filterClientName ? "default" : "text",
                            position: "relative",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                          onDoubleClick={(e) => !filterClientName && handleStartEdit(order, "client", e)}
                          title={filterClientName ? order.client : "Double-click to change client"}
                        >
                          {isEditing("client") ? (
                            <div style={{ position: "relative" }}>
                              <input
                                ref={editInputRef}
                                value={editValue}
                                onChange={(e) => {
                                  setEditValue(e.target.value);
                                  setIsEditClientDropdownOpen(true);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEdit();
                                  if (e.key === "Escape") setEditingCell(null);
                                }}
                                onBlur={() => {
                                  setTimeout(() => handleSaveEdit(), 150);
                                }}
                                style={{
                                  width: "100%",
                                  height: "36px",
                                  padding: "0 10px",
                                  backgroundColor: "rgba(0,0,0,0.85)",
                                  border: "1px solid var(--accent-border)",
                                  borderRadius: "3px",
                                  color: "#fff",
                                  fontSize: "13.5px",
                                  fontWeight: 700,
                                  outline: "none",
                                }}
                              />
                              {isEditClientDropdownOpen && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    zIndex: 100,
                                    backgroundColor: "#0d111a",
                                    border: "1px solid var(--accent-border)",
                                    borderRadius: "3px",
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    boxShadow: "0 12px 36px rgba(0,0,0,0.7)",
                                    marginTop: "2px",
                                  }}
                                >
                                  {editClientSuggestions.map((c) => (
                                    <div
                                      key={c}
                                      onMouseDown={() => {
                                        setOrders((prev) =>
                                          prev.map((o) => (o.internalId === order.internalId ? { ...o, client: c } : o))
                                        );
                                        setEditingCell(null);
                                        setIsEditClientDropdownOpen(false);
                                        success("Updated Client", `Assigned to ${c}`);
                                      }}
                                      style={{
                                        padding: "8px 12px",
                                        fontSize: "12px",
                                        color: "#fff",
                                        cursor: "pointer",
                                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,138,115,0.18)")}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                    >
                                      {c}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <strong style={{ color: "#ffffff", fontSize: "14px", letterSpacing: "-0.2px" }}>
                              {order.client}
                            </strong>
                          )}
                        </td>
                      )}

                      {/* 2. Things Ordered */}
                      {mode !== "LABOUR_LANYARD" && (
                        <td
                          style={{
                            padding: "16px 16px",
                            cursor: "pointer",
                            position: "relative",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                          onDoubleClick={(e) => handleStartEdit(order, "itemOrdered", e)}
                          title="Double-click to change ordered product"
                        >
                          {isEditing("itemOrdered") ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }} onClick={(e) => e.stopPropagation()}>
                              <select
                                value={editItem}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditItem(val);
                                }}
                                onBlur={handleSaveEdit}
                                autoFocus
                                style={{
                                  width: "100%",
                                  height: "32px",
                                  padding: "0 30px 0 8px",
                                  backgroundColor: "rgba(0,0,0,0.9)",
                                  border: "1px solid var(--accent-border)",
                                  borderRadius: "3px",
                                  color: editItem === "Lanyard" ? "#c084fc" : "#38bdf8",
                                  fontSize: "12px",
                                  outline: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <option value="Lanyard" style={{ backgroundColor: "#0e131f", color: "#c084fc" }}>Lanyard</option>
                                <option value="Card" style={{ backgroundColor: "#0e131f", color: "#38bdf8" }}>Card</option>
                              </select>

                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px", marginTop: "2px" }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingCell(null)}
                                  style={{ padding: "2px 6px", fontSize: "10px", backgroundColor: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "2px", cursor: "pointer" }}
                                >
                                  ✕
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveEdit}
                                  style={{ padding: "2px 8px", fontSize: "10px", backgroundColor: "var(--accent)", border: "none", color: "#fff", borderRadius: "2px", fontWeight: 700, cursor: "pointer" }}
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <ItemBadge name={order.itemOrdered || order.itemsOrdered?.[0] || "Lanyard"} />
                          )}
                        </td>
                      )}

                      {/* 3. Description (Single unified, properly formatted text) */}
                      <td
                        style={{
                          padding: "16px 18px",
                          cursor: "text",
                          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                        }}
                        onDoubleClick={(e) => handleStartEdit(order, "product", e)}
                        title="Double-click to edit description"
                      >
                        {isEditing("product") ? (
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            style={{
                              width: "100%",
                              height: "36px",
                              padding: "0 10px",
                              backgroundColor: "rgba(0,0,0,0.85)",
                              border: "1px solid var(--accent-border)",
                              borderRadius: "3px",
                              color: "#fff",
                              fontSize: "13px",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <div>
                            <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "13.5px", lineHeight: 1.45, display: "block" }}>
                              {order.product}
                            </span>
                            {(() => {
                              const itemOrdered = order.itemOrdered || order.itemsOrdered?.[0] || "Lanyard";
                              const detected = parseSupportingItemsFromDescription(order.product, itemOrdered, order.qty);
                              if (detected.length === 0) return null;
                              return (
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", marginTop: "6px" }}>
                                  <span style={{ fontSize: "9.5px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.5px" }}>
                                    Req. Stock:
                                  </span>
                                  {detected.map((item, idx) => (
                                    <span
                                      key={idx}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        padding: "2px 7px",
                                        borderRadius: "4px",
                                        fontSize: "10.5px",
                                        fontWeight: 700,
                                        backgroundColor: item.badgeBg,
                                        color: item.badgeColor,
                                        border: `1px solid ${item.badgeBorder}`,
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                      }}
                                      title={`Registered Requirement: ${item.name} (${item.totalPieces.toLocaleString()} pcs in ${item.canonicalUnit}) — ${item.detectedReason}`}
                                    >
                                      <span>{item.icon}</span>
                                      <span>{item.badgeLabel}</span>
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </td>

                      {/* 4. Quantity */}
                      <td
                        style={{
                          padding: "16px 16px",
                          textAlign: "center",
                          cursor: "text",
                          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                        }}
                        onDoubleClick={(e) => handleStartEdit(order, "qty", e)}
                        title="Double-click to edit quantity"
                      >
                        {isEditing("qty") ? (
                          <input
                            ref={editInputRef}
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            style={{
                              width: "80px",
                              height: "34px",
                              padding: "0 6px",
                              backgroundColor: "rgba(0,0,0,0.85)",
                              border: "1px solid var(--accent-border)",
                              borderRadius: "3px",
                              color: "#fff",
                              fontSize: "13px",
                              fontFamily: "var(--font-mono)",
                              textAlign: "center",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "#fff", fontSize: "14px" }}>
                            {order.qty.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* 5. Assigned (Employee for Card, Labour for Lanyard - Supports Multi-Worker Dividing) */}
                      <td style={{ padding: "12px 16px", borderRight: "1px solid rgba(255, 255, 255, 0.06)" }}>
                        {(() => {
                          const isCard = (order.itemOrdered || order.itemsOrdered?.[0] || "Lanyard") === "Card";
                          const hasWorkers = order.assignedTo && order.assignedTo.length > 0;

                          if (!hasWorkers) {
                            return (
                              <div
                                onClick={() => setAssigningOrder(order)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 12px",
                                  borderRadius: "4px",
                                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                                  border: isCard ? "1px dashed rgba(56, 189, 248, 0.4)" : "1px dashed rgba(249, 115, 22, 0.3)",
                                  color: isCard ? "#38bdf8" : "#fdba74",
                                  fontSize: "11.5px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = isCard ? "#38bdf8" : "var(--accent)";
                                  e.currentTarget.style.backgroundColor = isCard ? "rgba(56, 189, 248, 0.08)" : "rgba(249, 115, 22, 0.08)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = isCard ? "rgba(56, 189, 248, 0.4)" : "rgba(249, 115, 22, 0.3)";
                                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
                                }}
                                title={`Click to assign ${isCard ? "In-House Employee" : "Labour Contractor"}`}
                              >
                                <span style={{ fontSize: "13px" }}>+</span>
                                <span>{isCard ? "Assign Staff" : "Assign Labour"}</span>
                              </div>
                            );
                          }

                          if (order.assignedTo!.length === 1) {
                            const worker = order.assignedTo![0];
                            const isStaff = worker.type === "STAFF";
                            return (
                              <div
                                onClick={() => setAssigningOrder(order)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  cursor: "pointer",
                                  padding: "5px 8px",
                                  borderRadius: "4px",
                                  backgroundColor: isStaff ? "rgba(56, 189, 248, 0.08)" : "rgba(249, 115, 22, 0.06)",
                                  border: isStaff ? "1px solid rgba(56, 189, 248, 0.28)" : "1px solid rgba(249, 115, 22, 0.22)",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = isStaff ? "rgba(56, 189, 248, 0.16)" : "rgba(249, 115, 22, 0.14)";
                                  e.currentTarget.style.borderColor = isStaff ? "rgba(56, 189, 248, 0.5)" : "rgba(249, 115, 22, 0.45)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = isStaff ? "rgba(56, 189, 248, 0.08)" : "rgba(249, 115, 22, 0.06)";
                                  e.currentTarget.style.borderColor = isStaff ? "rgba(56, 189, 248, 0.28)" : "rgba(249, 115, 22, 0.22)";
                                }}
                                title={`Click to reassign or divide order across workers`}
                              >
                                <div
                                  style={{
                                    width: "26px",
                                    height: "26px",
                                    borderRadius: "50%",
                                    backgroundColor: isStaff ? "#0284c7" : "#ea580c",
                                    backgroundImage: isStaff
                                      ? "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)"
                                      : "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
                                    color: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 800,
                                    fontSize: isStaff ? "12px" : "11px",
                                    flexShrink: 0,
                                    boxShadow: isStaff ? "0 2px 6px rgba(2, 132, 199, 0.35)" : "0 2px 6px rgba(234, 88, 12, 0.35)",
                                  }}
                                >
                                  {isStaff ? "👤" : worker.name.slice(0, 1).toUpperCase()}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "155px" }}>
                                      {worker.name}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "9px",
                                        fontWeight: 800,
                                        padding: "1px 5px",
                                        borderRadius: "2px",
                                        backgroundColor: isStaff ? "rgba(56, 189, 248, 0.2)" : "rgba(249, 115, 22, 0.2)",
                                        color: isStaff ? "#38bdf8" : "#fb923c",
                                        letterSpacing: "0.4px",
                                      }}
                                    >
                                      {isStaff ? "STAFF" : "LABOUR"}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                                    <span style={{ fontSize: "10.5px", color: isStaff ? "#bae6fd" : "#fdba74", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px" }}>
                                      {worker.role}
                                    </span>
                                    {worker.allocatedQty !== undefined && worker.allocatedQty !== order.qty && (
                                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#e2e8f0", fontFamily: "var(--font-mono)" }}>
                                        ({worker.allocatedQty.toLocaleString()} units)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // Multiple assignees (Divided Order)
                          return (
                            <div
                              onClick={() => setAssigningOrder(order)}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                cursor: "pointer",
                                padding: "6px 8px",
                                borderRadius: "4px",
                                backgroundColor: "rgba(168, 85, 247, 0.08)",
                                border: "1px solid rgba(168, 85, 247, 0.25)",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.16)";
                                e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.5)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.08)";
                                e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.25)";
                              }}
                              title="Divided order across multiple workers. Click to edit allocations."
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                                <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#c084fc", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <span>🔀</span> Divided ({order.assignedTo!.length})
                                </span>
                                <span style={{ fontSize: "10px", color: "#e2e8f0", fontFamily: "var(--font-mono)" }}>
                                  {order.assignedTo!.reduce((s, w) => s + (w.allocatedQty ?? 0), 0).toLocaleString()} / {order.qty.toLocaleString()}
                                </span>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                {order.assignedTo!.map((w, wIdx) => {
                                  const isStaff = w.type === "STAFF";
                                  return (
                                    <div
                                      key={wIdx}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        fontSize: "10.5px",
                                        padding: "2px 5px",
                                        borderRadius: "2px",
                                        backgroundColor: isStaff ? "rgba(56, 189, 248, 0.1)" : "rgba(249, 115, 22, 0.1)",
                                      }}
                                    >
                                      <span style={{ color: "#ffffff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>
                                        {isStaff ? "👤" : "🤝"} {w.name.split(" ")[0]}
                                      </span>
                                      <span style={{ fontWeight: 800, color: isStaff ? "#38bdf8" : "#fb923c", fontFamily: "var(--font-mono)" }}>
                                        {(w.allocatedQty ?? 0).toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 6. Order Date */}
                      {mode !== "LABOUR_LANYARD" && (
                        <td
                          style={{
                            padding: "16px 14px",
                            fontSize: "12.5px",
                            color: "#94a3b8",
                            cursor: "text",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                          onDoubleClick={(e) => handleStartEdit(order, "orderDate", e)}
                          title="Double-click to edit order date"
                        >
                          {isEditing("orderDate") ? (
                            <input
                              ref={editInputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              style={{
                                width: "115px",
                                height: "34px",
                                padding: "0 8px",
                                backgroundColor: "rgba(0,0,0,0.85)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "3px",
                                color: "#fff",
                                fontSize: "12px",
                                outline: "none",
                              }}
                            />
                          ) : (
                            order.orderDate
                          )}
                        </td>
                      )}

                      {/* 7. Delivery Due Date */}
                      {mode !== "LABOUR_LANYARD" && (
                        <td
                          style={{
                            padding: "16px 14px",
                            cursor: "text",
                            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                          onDoubleClick={(e) => handleStartEdit(order, "deliveryDate", e)}
                          title="Double-click to edit delivery date"
                        >
                          {isEditing("deliveryDate") ? (
                            <input
                              ref={editInputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              style={{
                                width: "115px",
                                height: "34px",
                                padding: "0 8px",
                                backgroundColor: "rgba(0,0,0,0.85)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "3px",
                                color: "#fff",
                                fontSize: "12px",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <span style={{ color: "#e2e8f0", fontSize: "12.5px", fontWeight: 500 }}>
                              {order.deliveryDate}
                            </span>
                          )}
                        </td>
                      )}

                      {/* 8. Action (Assign Button: Employee for Card, Labour for Lanyard) */}
                      <td style={{ padding: "16px 16px", textAlign: "center" }}>
                        {(() => {
                          const isCard = (order.itemOrdered || order.itemsOrdered?.[0] || "Lanyard") === "Card";
                          return (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => setAssigningOrder(order)}
                                style={{
                                  height: "32px",
                                  padding: "0 14px",
                                  borderRadius: "5px",
                                  backgroundColor: isCard ? "#0284c7" : "#ea580c",
                                  border: "none",
                                  color: "#ffffff",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  boxShadow: isCard ? "0 2px 6px rgba(2, 132, 199, 0.35)" : "0 2px 6px rgba(234, 88, 12, 0.35)",
                                  transition: "all 0.15s ease",
                                  whiteSpace: "nowrap",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = isCard ? "#0369a1" : "#c2410c";
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = isCard ? "#0284c7" : "#ea580c";
                                  e.currentTarget.style.transform = "translateY(0)";
                                }}
                                title={`Assign order to ${isCard ? "In-House Employee" : "Labour Contractor"}`}
                              >
                                <span style={{ fontSize: "12px" }}>{isCard ? "👤" : "🤝"}</span>
                                <span>{isCard ? "Assign Staff" : "Assign Labour"}</span>
                              </button>


                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Table Footer */}
          <div
            style={{
              padding: "14px 18px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "rgba(8, 11, 18, 0.6)",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Showing {filteredOrders.length} production orders · Total volume:{" "}
              <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
                {filteredOrders.reduce((s, o) => s + o.qty, 0).toLocaleString()} units
              </strong>
            </span>
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
              Direct Order Entry panel above · Double-click any cell to edit · Assign Staff for Cards, Labour for Lanyards
            </span>
          </div>
        </div>
        )}
      </div>

      {/* ─── WORKER ASSIGNMENT & ORDER DIVIDING DRAWER ─── */}
      <Drawer
        isOpen={Boolean(assigningOrder)}
        onClose={() => setAssigningOrder(null)}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>
              {isAssigningCard ? "👤" : "🔀"}
            </span>
            <span>
              {isAssigningCard
                ? "Assign In-House Staff"
                : "Assign & Allocate Lanyard Order"}
            </span>
          </div>
        }
        subtitle={
          assigningOrder
            ? mode === "LABOUR_LANYARD"
              ? `Total Volume: ${assigningOrder.qty.toLocaleString()} units`
              : `${assigningOrder.client} · Total Volume: ${assigningOrder.qty.toLocaleString()} units`
            : undefined
        }
        width={560}
        footer={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {totalAllocated === (assigningOrder?.qty ?? 0) ? (
                <span style={{ fontSize: "12px", color: "#34d399", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>✅</span> 100% Allocated ({totalAllocated.toLocaleString()} units)
                </span>
              ) : totalAllocated < (assigningOrder?.qty ?? 0) ? (
                <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>⚠️</span> {remainingToAllocate.toLocaleString()} units remaining
                </span>
              ) : (
                <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>🚨</span> Over by {(totalAllocated - (assigningOrder?.qty ?? 0)).toLocaleString()} units
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button variant="outline" size="sm" onClick={() => setAssigningOrder(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAssignment}
                disabled={totalAllocated === 0}
              >
                Confirm & Save Assignment
              </Button>
            </div>
          </div>
        }
      >
        {assigningOrder && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Order Details Card with Clean Recognized Badges */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                padding: "14px 16px",
                display: "grid",
                gridTemplateColumns: mode === "LABOUR_LANYARD" ? "1fr auto" : "1.2fr 1fr",
                gap: "12px",
              }}
            >
              {mode !== "LABOUR_LANYARD" && (
                <>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Client</div>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff", marginTop: "2px" }}>{assigningOrder.client}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Order</div>
                    <div style={{ marginTop: "4px" }}>
                      <ItemBadge name={assigningOrder.itemOrdered || "Lanyard"} />
                    </div>
                  </div>
                </>
              )}
              <div style={{ gridColumn: mode === "LABOUR_LANYARD" ? "1" : "span 2" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Description</div>
                <div style={{ fontSize: "12.5px", color: "#e2e8f0", marginTop: "2px" }}>{assigningOrder.product}</div>

                {/* Recognized Stock Badges */}
                {orderRequiredItems.length > 0 && (
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                      Required Items:
                    </span>
                    {orderRequiredItems.map((item, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          backgroundColor: item.badgeBg,
                          color: item.badgeColor,
                          border: `1px solid ${item.badgeBorder}`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title={`Recognized: ${item.name}`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.badgeLabel}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Order Volume</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                  {assigningOrder.qty.toLocaleString()} units
                </div>
              </div>
              {mode !== "LABOUR_LANYARD" && (
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Target Delivery SLA</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0", marginTop: "2px" }}>{assigningOrder.deliveryDate}</div>
                </div>
              )}
            </div>

            {/* Checkbox: Divide Order or Not */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
              }}
            >
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={isDivided}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsDivided(checked);
                    if (!checked) {
                      // Reset to 1 single assignee covering 100% volume
                      if (allocations.length > 0) {
                        setAllocations([
                          {
                            ...allocations[0],
                            qty: assigningOrder.qty,
                          },
                        ]);
                      }
                    }
                  }}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                    accentColor: "var(--accent)",
                  }}
                />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                  Divide order across multiple workers
                </span>
              </label>
              {isDivided && (
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {allocations.length} {allocations.length === 1 ? "assignee" : "assignees"}
                </span>
              )}
            </div>

            {/* ─── CASE A: SINGLE ASSIGNEE (Clean, minimal, default) ─── */}
            {!isDivided ? (
              <div
                style={{
                  backgroundColor: "rgba(10, 14, 23, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {allocations[0]?.workerType === "STAFF" ? "Assign Staff Operator" : "Assign Labour Contractor"}
                  </label>

                  {/* Worker Type Toggle (Only if Lanyard order) */}
                  {!isAssigningCard && (
                    <div style={{ display: "inline-flex", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: "3px", padding: "1px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectWorkerForAllocation(0, LABOUR_CONTRACTORS[0].id, "LABOUR");
                        }}
                        style={{
                          padding: "3px 10px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          borderRadius: "2px",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: allocations[0]?.workerType !== "STAFF" ? "rgba(249, 115, 22, 0.35)" : "transparent",
                          color: allocations[0]?.workerType !== "STAFF" ? "#fb923c" : "var(--text-muted)",
                        }}
                      >
                        Labour
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectWorkerForAllocation(0, INHOUSE_EMPLOYEES[0].id, "STAFF");
                        }}
                        style={{
                          padding: "3px 10px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          borderRadius: "2px",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: allocations[0]?.workerType === "STAFF" ? "rgba(56, 189, 248, 0.35)" : "transparent",
                          color: allocations[0]?.workerType === "STAFF" ? "#38bdf8" : "var(--text-muted)",
                        }}
                      >
                        Staff
                      </button>
                    </div>
                  )}
                </div>

                <select
                  value={allocations[0]?.workerId || ""}
                  onChange={(e) => handleSelectWorkerForAllocation(0, e.target.value, allocations[0]?.workerType || "LABOUR")}
                  style={{
                    height: "40px",
                    padding: "0 12px",
                    backgroundColor: "rgba(9, 12, 19, 0.95)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: "4px",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {allocations[0]?.workerType === "STAFF"
                    ? INHOUSE_EMPLOYEES.map((emp) => (
                        <option key={emp.id} value={emp.id} style={{ backgroundColor: "#0c101a", color: "#fff" }}>
                          {emp.name} ({emp.role})
                        </option>
                      ))
                    : LABOUR_CONTRACTORS.map((lab) => (
                        <option key={lab.id} value={lab.id} style={{ backgroundColor: "#0c101a", color: "#fff" }}>
                          {lab.name} — {lab.specialty}
                        </option>
                      ))}
                </select>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "4px",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Assigned Volume</span>
                  <strong style={{ fontSize: "13px", color: "#34d399", fontFamily: "var(--font-mono)" }}>
                    {assigningOrder.qty.toLocaleString()} units (100%)
                  </strong>
                </div>
              </div>
            ) : (
              /* ─── CASE B: MULTI-WORKER ALLOCATION WORKSPACE (Only when divided) ─── */
              <div
                style={{
                  backgroundColor: "rgba(10, 14, 23, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Header with allocation meter */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px" }}>⚖️</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Volume Allocation ({allocations.length} Assignees)
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      <strong style={{ color: totalAllocated === assigningOrder.qty ? "#34d399" : totalAllocated < assigningOrder.qty ? "#f59e0b" : "#ef4444" }}>
                        {totalAllocated.toLocaleString()}
                      </strong>
                      <span style={{ color: "var(--text-muted)" }}>/</span>
                      <span style={{ color: "#fff" }}>{assigningOrder.qty.toLocaleString()} units</span>
                    </div>
                  </div>

                  {/* Progress Meter Bar */}
                  <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "3px",
                        width: `${Math.min(100, Math.round((totalAllocated / (assigningOrder.qty || 1)) * 100))}%`,
                        backgroundColor:
                          totalAllocated === assigningOrder.qty
                            ? "#10b981"
                            : totalAllocated < assigningOrder.qty
                            ? "#f59e0b"
                            : "#ef4444",
                        transition: "all 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Allocation Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {allocations.map((alloc, idx) => {
                    const isStaff = alloc.workerType === "STAFF";
                    return (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: "rgba(16, 21, 32, 0.9)",
                          border: isStaff ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid rgba(249, 115, 22, 0.3)",
                          borderRadius: "6px",
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        {/* Row Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                backgroundColor: isStaff ? "#0284c7" : "#ea580c",
                                color: "#fff",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px",
                                fontWeight: 800,
                              }}
                            >
                              {idx + 1}
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                              Assignee #{idx + 1}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {/* Worker Type Toggle (Only if Lanyard order) */}
                            {!isAssigningCard && (
                              <div style={{ display: "inline-flex", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: "3px", padding: "1px" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectWorkerForAllocation(idx, LABOUR_CONTRACTORS[0].id, "LABOUR");
                                  }}
                                  style={{
                                    padding: "2px 8px",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    borderRadius: "2px",
                                    border: "none",
                                    cursor: "pointer",
                                    backgroundColor: !isStaff ? "rgba(249, 115, 22, 0.35)" : "transparent",
                                    color: !isStaff ? "#fb923c" : "var(--text-muted)",
                                  }}
                                >
                                  Labour
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectWorkerForAllocation(idx, INHOUSE_EMPLOYEES[0].id, "STAFF");
                                  }}
                                  style={{
                                    padding: "2px 8px",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    borderRadius: "2px",
                                    border: "none",
                                    cursor: "pointer",
                                    backgroundColor: isStaff ? "rgba(56, 189, 248, 0.35)" : "transparent",
                                    color: isStaff ? "#38bdf8" : "var(--text-muted)",
                                  }}
                                >
                                  Staff
                                </button>
                              </div>
                            )}

                            {allocations.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAllocation(idx)}
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "3px",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                                  color: "#f87171",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                }}
                                title="Remove this assignee"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Worker Selection & Qty Input */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "10px", alignItems: "flex-end" }}>
                          {/* Worker Selector */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                              {isStaff ? "In-House Employee" : "Labour Contractor"}
                            </label>
                            <select
                              value={alloc.workerId}
                              onChange={(e) => handleSelectWorkerForAllocation(idx, e.target.value, alloc.workerType)}
                              style={{
                                height: "36px",
                                padding: "0 10px",
                                backgroundColor: "rgba(9, 12, 19, 0.95)",
                                border: `1px solid ${isStaff ? "rgba(56, 189, 248, 0.4)" : "rgba(249, 115, 22, 0.4)"}`,
                                borderRadius: "4px",
                                color: "#fff",
                                fontSize: "12.5px",
                                fontWeight: 600,
                                outline: "none",
                                cursor: "pointer",
                              }}
                            >
                              {isStaff
                                ? INHOUSE_EMPLOYEES.map((emp) => (
                                    <option key={emp.id} value={emp.id} style={{ backgroundColor: "#0c101a", color: "#fff" }}>
                                      {emp.name} ({emp.role})
                                    </option>
                                  ))
                                : LABOUR_CONTRACTORS.map((lab) => (
                                    <option key={lab.id} value={lab.id} style={{ backgroundColor: "#0c101a", color: "#fff" }}>
                                      {lab.name} — {lab.specialty}
                                    </option>
                                  ))}
                            </select>
                          </div>

                          {/* Qty Input & Quick Split Helpers */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                                Allocated Qty
                              </label>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const bal = remainingToAllocate + Number(alloc.qty || 0);
                                    handleUpdateAllocation(idx, { qty: bal });
                                  }}
                                  style={{
                                    fontSize: "9px",
                                    padding: "1px 5px",
                                    borderRadius: "2px",
                                    backgroundColor: "rgba(255,255,255,0.08)",
                                    border: "none",
                                    color: "#cbd5e1",
                                    cursor: "pointer",
                                  }}
                                  title="Set to remaining balance"
                                >
                                  Max
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const half = Math.floor(assigningOrder.qty / (allocations.length > 1 ? allocations.length : 2));
                                    handleUpdateAllocation(idx, { qty: half });
                                  }}
                                  style={{
                                    fontSize: "9px",
                                    padding: "1px 5px",
                                    borderRadius: "2px",
                                    backgroundColor: "rgba(255,255,255,0.08)",
                                    border: "none",
                                    color: "#cbd5e1",
                                    cursor: "pointer",
                                  }}
                                  title="Split equally"
                                >
                                  Equal
                                </button>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <input
                                type="number"
                                min={1}
                                max={assigningOrder.qty}
                                value={alloc.qty}
                                onChange={(e) => handleUpdateAllocation(idx, { qty: parseInt(e.target.value, 10) || 0 })}
                                style={{
                                  width: "100%",
                                  height: "36px",
                                  padding: "0 10px",
                                  backgroundColor: "rgba(9, 12, 19, 0.95)",
                                  border: "1px solid rgba(255, 255, 255, 0.15)",
                                  borderRadius: "4px",
                                  color: "#fff",
                                  fontSize: "14px",
                                  fontWeight: 800,
                                  fontFamily: "var(--font-mono)",
                                  outline: "none",
                                }}
                              />
                              <span style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>
                                units
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Assignee / Split Order Button */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px" }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddAllocation}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px dashed rgba(255, 255, 255, 0.25)",
                    }}
                  >
                    + Add Another Assignee
                  </Button>

                  {remainingToAllocate > 0 && (
                    <span style={{ fontSize: "11px", color: "#f59e0b", fontStyle: "italic" }}>
                      {remainingToAllocate.toLocaleString()} units left to divide
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
      {/* ─── PRINT CONTRACTOR ALLOCATION & QUANTITY DIVISION MODAL ─── */}
      {printModalOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setPrintModalOrder(null)}
        >
          <div
            style={{
              backgroundColor: "#0d1322",
              border: "1px solid rgba(249, 115, 22, 0.4)",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "530px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(249, 115, 22, 0.18)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                background: "linear-gradient(90deg, rgba(249, 115, 22, 0.18) 0%, rgba(13, 19, 34, 0) 100%)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#fb923c", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  Print Contractor Allocation
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginTop: "3px" }}>
                  {printModalOrder.mplName || printModalOrder.client}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                  Size: <strong style={{ color: "#fbbf24" }}>{printModalOrder.size || "16mm"}</strong> &bull; Total Volume:{" "}
                  <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
                    {printModalOrder.qty.toLocaleString()} units
                  </strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrintModalOrder(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>
                  Select Print Contractor(s):
                </span>
                {selectedPrintContractorIds.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDivideEqually}
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#38bdf8",
                      background: "rgba(56, 189, 248, 0.12)",
                      border: "1px solid rgba(56, 189, 248, 0.35)",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title="Divide total quantity equally among selected contractors"
                  >
                    ⚡ Divide Equally
                  </button>
                )}
              </div>

              {/* Contractor List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {PRINT_CONTRACTORS.map((contractor) => {
                  const isSelected = selectedPrintContractorIds.includes(contractor.id);
                  const currentQty = printQtys[contractor.id] ?? 0;

                  return (
                    <div
                      key={contractor.id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "8px",
                        backgroundColor: isSelected ? "rgba(249, 115, 22, 0.08)" : "rgba(255, 255, 255, 0.02)",
                        border: isSelected ? "1px solid rgba(249, 115, 22, 0.45)" : "1px solid rgba(255, 255, 255, 0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Left: Checkbox & Name */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          cursor: "pointer",
                          flex: 1,
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTogglePrintContractor(contractor.id)}
                          style={{
                            width: "16px",
                            height: "16px",
                            cursor: "pointer",
                            accentColor: "#f97316",
                          }}
                        />
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "14px" }}>{contractor.icon}</span>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: isSelected ? "#fff" : "#cbd5e1" }}>
                              {contractor.name}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {contractor.specialty} &bull; {contractor.rate}
                          </div>
                        </div>
                      </label>

                      {/* Right: Quantity Division Input */}
                      {isSelected && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {selectedPrintContractorIds.length > 1 ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Giving:</span>
                              <input
                                type="number"
                                value={currentQty === 0 ? "" : currentQty}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setPrintQtys((prev) => ({ ...prev, [contractor.id]: val }));
                                }}
                                style={{
                                  width: "85px",
                                  height: "32px",
                                  padding: "0 8px",
                                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                                  border: "1px solid rgba(249, 115, 22, 0.5)",
                                  borderRadius: "4px",
                                  color: "#fff",
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  fontFamily: "var(--font-mono)",
                                  textAlign: "center",
                                  outline: "none",
                                }}
                              />
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>units</span>
                            </div>
                          ) : (
                            <div
                              style={{
                                padding: "4px 10px",
                                borderRadius: "4px",
                                backgroundColor: "rgba(249, 115, 22, 0.15)",
                                border: "1px solid rgba(249, 115, 22, 0.3)",
                                color: "#fb923c",
                                fontSize: "12px",
                                fontWeight: 700,
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              100% ({printModalOrder.qty.toLocaleString()} units)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quantity Summary & Balance Bar (when multi-selected) */}
              {selectedPrintContractorIds.length > 1 && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 14px",
                    borderRadius: "6px",
                    backgroundColor: isAllocationBalanced ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    border: isAllocationBalanced ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Total Required: {printModalOrder.qty.toLocaleString()} units
                    </div>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: isAllocationBalanced ? "#4ade80" : "#f87171", marginTop: "2px" }}>
                      {isAllocationBalanced
                        ? `✓ Balanced: All ${printModalOrder.qty.toLocaleString()} units divided`
                        : totalAllocatedPrint < printModalOrder.qty
                        ? `⚠ Remaining: ${(printModalOrder.qty - totalAllocatedPrint).toLocaleString()} units unassigned`
                        : `⚠ Over-allocated by ${(totalAllocatedPrint - printModalOrder.qty).toLocaleString()} units`}
                    </div>
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 800, fontFamily: "var(--font-mono)", color: isAllocationBalanced ? "#4ade80" : "#f87171" }}>
                    {totalAllocatedPrint.toLocaleString()} / {printModalOrder.qty.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <Button variant="ghost" size="sm" onClick={() => setPrintModalOrder(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedPrintContractorIds.length === 0 || (selectedPrintContractorIds.length > 1 && !isAllocationBalanced)}
                onClick={handleConfirmPrintAllocation}
                style={{
                  backgroundColor: "#f97316",
                  borderColor: "#ea580c",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                Confirm & Mark Gone for Print
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
