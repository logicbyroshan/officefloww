import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { Drawer } from "../../design-system/components/Drawer";
import { Tabs } from "../../design-system/components/Tabs";
import { useToast } from "../../design-system/components/Toast";

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

export function parseSupportingItemsFromDescription(
  description: string,
  itemOrdered: string,
  orderQty: number
): RegisteredStockItem[] {
  const desc = (description || "").toLowerCase();
  const items: RegisteredStockItem[] = [];
  const isCard = itemOrdered === "Card";

  if (isCard) {
    // 1. Holders for Cards
    if (desc.includes("plastic holder-h") || desc.includes("horizontal holder") || desc.includes("horizontal pouch") || desc.includes("horizontal") || desc.includes("-h holder") || desc.includes("holder-h")) {
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
        badgeBg: "rgba(16, 185, 129, 0.16)",
        badgeColor: "#34d399",
        badgeBorder: "rgba(16, 185, 129, 0.4)",
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
        badgeBg: "rgba(96, 165, 250, 0.16)",
        badgeColor: "#60a5fa",
        badgeBorder: "rgba(96, 165, 250, 0.4)",
        detectedReason: "Matched 'crystal' VIP holder in description",
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
        badgeLabel: "DST-H Holder",
        badgeBg: "rgba(251, 191, 36, 0.16)",
        badgeColor: "#fbbf24",
        badgeBorder: "rgba(251, 191, 36, 0.4)",
        detectedReason: "Matched 'DST-H' holder in description",
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
        badgeLabel: "DST-V Holder",
        badgeBg: "rgba(245, 158, 11, 0.16)",
        badgeColor: "#f59e0b",
        badgeBorder: "rgba(245, 158, 11, 0.4)",
        detectedReason: "Matched 'DST' dual-slot holder in description",
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
        badgeBg: "rgba(52, 211, 153, 0.16)",
        badgeColor: "#6ee7b7",
        badgeBorder: "rgba(52, 211, 153, 0.4)",
        detectedReason:
          desc.includes("holder") || desc.includes("pouch") || desc.includes("sleeve") || desc.includes("case") || desc.includes("pasting") || desc.includes("-v") || desc.includes("v holder")
            ? "Matched vertical holder/pouch in description"
            : "Standard vertical PVC ID card holder required",
        unit: "pieces",
        requiredQty: orderQty,
      });
    }

    // 2. Clips (Registered unit: packets of 1000)
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
      badgeBg: "rgba(236, 72, 153, 0.16)",
      badgeColor: "#f472b6",
      badgeBorder: "rgba(236, 72, 153, 0.4)",
      detectedReason: desc.includes("clip")
        ? "Matched keyword 'clip' in description (unit: packets of 1000)"
        : "Standard ID badge clips required (unit: packets of 1000)",
      unit: "packets of 1000",
      requiredQty: clipPacks,
    });

    // 3. Optional Jointer/Breakaway (Registered unit: packets of 1000)
    if (desc.includes("jointer") || desc.includes("jointers") || desc.includes("breakaway") || desc.includes("buckle") || desc.includes("release")) {
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
        badgeBg: "rgba(244, 63, 94, 0.16)",
        badgeColor: "#fb7185",
        badgeBorder: "rgba(244, 63, 94, 0.4)",
        detectedReason: "Matched keyword 'jointer / breakaway buckle' in description (unit: packets of 1000)",
        unit: "packets of 1000",
        requiredQty: jointerPacks,
      });
    }

    // 4. Optional Ring if mentioned
    if (desc.includes("ring") || desc.includes("rings") || desc.includes("keyring")) {
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
        badgeBg: "rgba(217, 70, 239, 0.16)",
        badgeColor: "#e879f9",
        badgeBorder: "rgba(217, 70, 239, 0.4)",
        detectedReason: "Matched keyword 'ring' accessory in description",
        unit: "pieces",
        requiredQty: orderQty,
      });
    }
  } else {
    // ─── Lanyard Orders ──────────────────────────────────────────────────────────
    // 1. Ribbon Rolls (1 roll = 200 units)
    const rollsNeeded = Math.max(1, Math.ceil(orderQty / 200));
    if (desc.includes("12mm") || desc.includes("10mm")) {
      items.push({
        name: "12mm Lanyard Rolls",
        category: "LANYARDS",
        canonicalUnit: "rolls",
        packSize: 200,
        unitDisplay: "rolls",
        requiredPacks: rollsNeeded,
        totalPieces: rollsNeeded * 200,
        icon: "🎗️",
        badgeLabel: "12mm Ribbon",
        badgeBg: "rgba(255, 138, 115, 0.15)",
        badgeColor: "#ff8a73",
        badgeBorder: "rgba(255, 138, 115, 0.4)",
        detectedReason: "Matched keyword '10/12mm' ribbon rolls (unit: rolls)",
        unit: "rolls",
        requiredQty: rollsNeeded,
      });
    } else if (desc.includes("20mm")) {
      items.push({
        name: "20mm Lanyard Rolls",
        category: "LANYARDS",
        canonicalUnit: "rolls",
        packSize: 200,
        unitDisplay: "rolls",
        requiredPacks: rollsNeeded,
        totalPieces: rollsNeeded * 200,
        icon: "🎗️",
        badgeLabel: "20mm Ribbon",
        badgeBg: "rgba(249, 115, 22, 0.15)",
        badgeColor: "#fb923c",
        badgeBorder: "rgba(249, 115, 22, 0.4)",
        detectedReason: "Matched keyword '20mm' satin rolls (unit: rolls)",
        unit: "rolls",
        requiredQty: rollsNeeded,
      });
    } else {
      items.push({
        name: "16mm Lanyard Rolls",
        category: "LANYARDS",
        canonicalUnit: "rolls",
        packSize: 200,
        unitDisplay: "rolls",
        requiredPacks: rollsNeeded,
        totalPieces: rollsNeeded * 200,
        icon: "🎗️",
        badgeLabel: "16mm Ribbon",
        badgeBg: "rgba(234, 88, 12, 0.15)",
        badgeColor: "#fdba74",
        badgeBorder: "rgba(234, 88, 12, 0.4)",
        detectedReason: desc.includes("15mm") || desc.includes("16mm")
          ? "Matched keyword '15/16mm' ribbon from description (unit: rolls)"
          : "Standard 16mm ribbon rolls required (unit: rolls)",
        unit: "rolls",
        requiredQty: rollsNeeded,
      });
    }

    // 2. Hooks
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
        badgeBg: "rgba(168, 85, 247, 0.15)",
        badgeColor: "#c084fc",
        badgeBorder: "rgba(168, 85, 247, 0.4)",
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
        badgeBg: "rgba(56, 189, 248, 0.15)",
        badgeColor: "#38bdf8",
        badgeBorder: "rgba(56, 189, 248, 0.4)",
        detectedReason: "Matched keyword 'Plastic Hook' in description",
        unit: "pieces",
        requiredQty: orderQty,
      });
    } else {
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
        badgeBg: "rgba(192, 132, 252, 0.15)",
        badgeColor: "#e9d5ff",
        badgeBorder: "rgba(192, 132, 252, 0.4)",
        detectedReason: desc.includes("dog hook") || desc.includes("dog clip")
          ? "Matched keyword 'Dog Hook' in description"
          : "Standard lanyard dog hook required",
        unit: "pieces",
        requiredQty: orderQty,
      });
    }

    // 3. Supporting items: Holders / Pouch / Pasting (written in description by user)
    if (
      desc.includes("holder") ||
      desc.includes("holders") ||
      desc.includes("pouch") ||
      desc.includes("sleeve") ||
      desc.includes("case") ||
      desc.includes("dst") ||
      desc.includes("crystal") ||
      desc.includes("pasting") ||
      desc.includes("-v") ||
      desc.includes("-h")
    ) {
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
          badgeBg: "rgba(16, 185, 129, 0.16)",
          badgeColor: "#34d399",
          badgeBorder: "rgba(16, 185, 129, 0.4)",
          detectedReason: "Matched keyword 'horizontal pouch/holder' in description",
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
          badgeBg: "rgba(96, 165, 250, 0.16)",
          badgeColor: "#60a5fa",
          badgeBorder: "rgba(96, 165, 250, 0.4)",
          detectedReason: "Matched keyword 'crystal' holder in description",
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
          badgeLabel: "DST-H Holder",
          badgeBg: "rgba(251, 191, 36, 0.16)",
          badgeColor: "#fbbf24",
          badgeBorder: "rgba(251, 191, 36, 0.4)",
          detectedReason: "Matched keyword 'DST-H' holder in description",
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
          badgeLabel: "DST-V Holder",
          badgeBg: "rgba(245, 158, 11, 0.16)",
          badgeColor: "#f59e0b",
          badgeBorder: "rgba(245, 158, 11, 0.4)",
          detectedReason: "Matched keyword 'DST' holder in description",
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
          badgeBg: "rgba(52, 211, 153, 0.16)",
          badgeColor: "#6ee7b7",
          badgeBorder: "rgba(52, 211, 153, 0.4)",
          detectedReason: "Matched keyword 'holder/pouch/pasting' in description",
          unit: "pieces",
          requiredQty: orderQty,
        });
      }
    }

    // 4. Supporting items: Clips (keyword: clip, clips, crocodile)
    // Factory unit: packets of 1000 (1000s)
    const hasClipKeyword = (desc.includes("clip") && !desc.includes("dog clip")) || desc.includes("clips") || desc.includes("crocodile");
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
        badgeBg: "rgba(236, 72, 153, 0.16)",
        badgeColor: "#f472b6",
        badgeBorder: "rgba(236, 72, 153, 0.4)",
        detectedReason: "Matched keyword 'clips' in description (factory unit: 1000s per packet)",
        unit: "packets of 1000",
        requiredQty: clipPacks,
      });
    }

    // 5. Supporting items: Jointer / Breakaway buckle (keyword: jointer, jointers, breakaway, buckle, release)
    // Factory unit: packets of 1000 (1000s)
    const hasJointerKeyword = desc.includes("jointer") || desc.includes("jointers") || desc.includes("breakaway") || desc.includes("buckle") || desc.includes("release");
    if (hasJointerKeyword) {
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
        badgeBg: "rgba(244, 63, 94, 0.16)",
        badgeColor: "#fb7185",
        badgeBorder: "rgba(244, 63, 94, 0.4)",
        detectedReason: "Matched keyword 'jointer / breakaway' in description (factory unit: 1000s per packet)",
        unit: "packets of 1000",
        requiredQty: jointerPacks,
      });
    }

    // 6. Supporting items: Rings / Keyrings
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
        badgeBg: "rgba(217, 70, 239, 0.16)",
        badgeColor: "#e879f9",
        badgeBorder: "rgba(217, 70, 239, 0.4)",
        detectedReason: "Matched keyword 'ring' accessory in description",
        unit: "pieces",
        requiredQty: orderQty,
      });
    }
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
}

export const INITIAL_ORDERS: OrderRecord[] = [
  {
    internalId: "ord-1",
    client: "St. Xavier's High School",
    product: "Multicolor Lanyards (15mm) — Satin ribbon with Dog Hook & Clips",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 2000,
    assignedTo: [
      { name: "Ramesh Lanyard Stitching Unit", role: "Lanyard Stitching Labour", type: "LABOUR", contractorId: "lb-1" },
    ],
    orderDate: "28 Aug 2026",
    deliveryDate: "05 Sep 2026",
  },
  {
    internalId: "ord-2",
    client: "BHEL Township Admin",
    product: "Single Color Lanyards (10mm) — Navy blue polyester with Plastic Holder-V, Clips & Jointer",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 500,
    assignedTo: [
      { name: "Ramesh Lanyard Stitching Unit", role: "Lanyard Stitching Labour", type: "LABOUR", contractorId: "lb-1" },
    ],
    orderDate: "30 Aug 2026",
    deliveryDate: "07 Sep 2026",
  },
  {
    internalId: "ord-3",
    client: "Northwind Coffee",
    product: "Custom Printed Premium Lanyards — Red/white satin print, Dog Hook & Safety Jointer",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 1500,
    assignedTo: [
      { name: "Ramesh Lanyard Stitching Unit", role: "Lanyard Stitching Labour", type: "LABOUR", contractorId: "lb-1" },
    ],
    orderDate: "22 Aug 2026",
    deliveryDate: "02 Sep 2026",
  },
  {
    internalId: "ord-4",
    client: "AIIMS Bhopal",
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
    product: "Faculty + Student Lanyards — 20mm full color heat sublimation with Plastic Hook & Jointer",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 1200,
    assignedTo: [
      { name: "Kailash Heat Sublimation Lab", role: "Heat Transfer Contractor", type: "LABOUR", contractorId: "lb-2" },
    ],
    orderDate: "31 Aug 2026",
    deliveryDate: "08 Sep 2026",
  },
  {
    internalId: "ord-8",
    client: "Maulana Azad Hospital",
    product: "Staff ID Lanyards — Screen printed navy with England Hook & Clips",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 600,
    assignedTo: [
      { name: "Shyam Screen Print Workshop", role: "Screen Printing & Stamping", type: "LABOUR", contractorId: "lb-3" },
    ],
    orderDate: "03 Sep 2026",
    deliveryDate: "12 Sep 2026",
  },
  {
    internalId: "ord-9",
    client: "Smart City Council",
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
    product: "Heavy Duty School ID Lanyards — Transparent Plastic Holder-V with Dog Hook & Clips",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 1000,
    assignedTo: [
      { name: "Ramesh Lanyard Stitching Unit", role: "Lanyard Stitching Labour", type: "LABOUR", contractorId: "lb-1" },
    ],
    orderDate: "20 Aug 2026",
    deliveryDate: "01 Sep 2026",
  },
  {
    internalId: "ord-11",
    client: "MP Secretariat",
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
    product: "Lanyards (12mm Blue/White) — Double-sided print with Dog Hook, Clips & Safety Jointer",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 3000,
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

export interface OrdersWorkspaceViewProps {
  clients?: any[];
  onSelectOrder?: (id: string) => void;
  filterClientName?: string;
  embedded?: boolean;
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
}) => {
  const { success } = useToast();
  const [orders, setOrders] = useSharedOrders();
  const [search, setSearch] = useState("");
  const [filterItem, setFilterItem] = useState("ALL");
  const [sortField, setSortField] = useState<"client" | "qty" | "orderDate" | "deliveryDate">("deliveryDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

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
  const [newOrderDate, setNewOrderDate] = useState("03 Sep 2026");
  const [newDeliveryDate, setNewDeliveryDate] = useState("10 Sep 2026");

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

  const isAssigningCard = useMemo(() => {
    return (assigningOrder?.itemOrdered || assigningOrder?.itemsOrdered?.[0] || "Lanyard") === "Card";
  }, [assigningOrder]);

  // When opening assign drawer for an order, pre-populate existing or default allocations
  useEffect(() => {
    if (assigningOrder) {
      const isCard = (assigningOrder.itemOrdered || assigningOrder.itemsOrdered?.[0] || "Lanyard") === "Card";
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
      const currentItem = o.itemOrdered || o.itemsOrdered?.[0] || "";
      const matchSearch =
        !q ||
        o.client.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        currentItem.toLowerCase().includes(q) ||
        (o.assignedTo || []).some((a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));

      // 3. Category pill filter
      let matchFilter = true;
      if (filterItem !== "ALL") {
        matchFilter = currentItem.toLowerCase() === filterItem.toLowerCase();
      }

      return matchSearch && matchFilter;
    });

    list = [...list].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = typeof aVal === "number" ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [orders, search, filterItem, sortField, sortDir, filterClientName]);

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
      orderDate: newOrderDate || "03 Sep 2026",
      deliveryDate: newDeliveryDate || "10 Sep 2026",
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
    setEditValue(String(order[field] ?? ""));

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
        {/* Left: Modern Search Bar & Product Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "300px", maxWidth: "720px" }}>
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

          {/* Product Type Filter Pills */}
          <Tabs
            variant="pill"
            size="sm"
            activeTab={filterItem}
            onChange={(id) => setFilterItem(id)}
            tabs={filterOptions.map((opt) => ({
              id: opt,
              label: opt === "ALL" ? "All" : opt,
            }))}
          />
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 1.1fr 2.2fr 0.8fr 1fr 1fr auto",
              gap: "10px",
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

            {/* 2. Things Ordered */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                Things Ordered
              </label>
              <select
                value={newItemOrdered}
                onChange={(e) => setNewItemOrdered(e.target.value)}
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
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <option value="Lanyard" style={{ backgroundColor: "#0e131f", color: "#c084fc" }}>Lanyard</option>
                <option value="Card" style={{ backgroundColor: "#0e131f", color: "#38bdf8" }}>Card</option>
              </select>
            </div>

            {/* 3. Description (Single unified text field) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                Description
              </label>
              <input
                type="text"
                placeholder="Description (e.g. 15mm Satin, Dog Hook, Blue/White Print)..."
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

            {/* 5. Order Date */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                Order Date
              </label>
              <input
                type="text"
                value={newOrderDate}
                onChange={(e) => setNewOrderDate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFromQuickEntry();
                }}
                style={{
                  width: "100%",
                  height: "36px",
                  padding: "0 10px",
                  backgroundColor: "rgba(9, 12, 19, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "var(--radius-sm, 4px)",
                  color: "var(--text-secondary)",
                  fontSize: "12px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* 6. Delivery Due */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                Delivery Due
              </label>
              <input
                type="text"
                value={newDeliveryDate}
                onChange={(e) => setNewDeliveryDate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFromQuickEntry();
                }}
                style={{
                  width: "100%",
                  height: "36px",
                  padding: "0 10px",
                  backgroundColor: "rgba(9, 12, 19, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "var(--radius-sm, 4px)",
                  color: "#f59e0b",
                  fontSize: "12px",
                  fontWeight: 700,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* 7. Action Button */}
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

          {/* Live Auto-Registered Stock Requirements Preview */}
          {liveDetectedStock.length > 0 && (
            <div
              style={{
                marginTop: "12px",
                padding: "8px 12px",
                backgroundColor: "rgba(10, 14, 23, 0.75)",
                border: "1px dashed rgba(56, 189, 248, 0.35)",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>⚡</span>
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
                    fontWeight: 700,
                    backgroundColor: stk.badgeBg,
                    color: stk.badgeColor,
                    border: `1px solid ${stk.badgeBorder}`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }}
                  title={`Unit: ${stk.canonicalUnit} · Total: ${stk.totalPieces.toLocaleString()} pcs (${stk.detectedReason})`}
                >
                  <span>{stk.icon}</span>
                  <span>{stk.badgeLabel}</span>
                </span>
              ))}
              <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "auto", fontStyle: "italic" }}>
                Auto-recognized from description & factory packaging units
              </span>
            </div>
          )}
        </div>

        {/* ─── ORDERS TABLE (Polished Gradient Header, Spacious 68px Rows) ────── */}
        {/* Columns: CLIENT -> THINGS ORDERED -> DESCRIPTION -> QUANTITY -> ASSIGNED -> ORDER DATE -> DELIVERY DUE -> ACTION */}
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

                {/* 2. THINGS ORDERED */}
                <th
                  style={{
                    padding: "16px 16px",
                    textAlign: "left",
                    width: "135px",
                    borderBottom: "2px solid rgba(255, 138, 115, 0.4)",
                    borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  Things Ordered
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
            </thead>
            <tbody>

              {/* ─── ORDERS ROWS (Spacious 68px Row Height, Double-Click Editable) ─ */}
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "50px 0", textAlign: "center", color: "var(--text-muted)" }}>
                    {filterClientName
                      ? `No orders found for ${filterClientName}. Use the Direct Order Entry panel above to create one.`
                      : "No orders match your search criteria. Use the Direct Order Entry panel above to create one."}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const isEditing = (field: keyof OrderRecord) =>
                    editingCell?.id === order.internalId && editingCell?.field === field;

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

                      {/* 2. Things Ordered */}
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

                      {/* 7. Delivery Due Date */}
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
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: "3px",
                              backgroundColor: "rgba(245, 158, 11, 0.1)",
                              border: "1px solid rgba(245, 158, 11, 0.25)",
                              color: "#f59e0b",
                              fontSize: "12.5px",
                              fontWeight: 700,
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {order.deliveryDate}
                          </span>
                        )}
                      </td>

                      {/* 8. Action (Assign Button: Employee for Card, Labour for Lanyard) */}
                      <td style={{ padding: "16px 16px", textAlign: "center" }}>
                        {(() => {
                          const isCard = (order.itemOrdered || order.itemsOrdered?.[0] || "Lanyard") === "Card";
                          return (
                            <button
                              type="button"
                              onClick={() => setAssigningOrder(order)}
                              style={{
                                height: "30px",
                                padding: "0 12px",
                                borderRadius: "4px",
                                backgroundColor: isCard ? "rgba(56, 189, 248, 0.14)" : "rgba(249, 115, 22, 0.14)",
                                border: isCard ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid rgba(249, 115, 22, 0.4)",
                                color: isCard ? "#38bdf8" : "#fdba74",
                                fontSize: "11.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isCard ? "rgba(56, 189, 248, 0.28)" : "rgba(249, 115, 22, 0.28)";
                                e.currentTarget.style.borderColor = isCard ? "#7dd3fc" : "#fb923c";
                                e.currentTarget.style.color = "#ffffff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isCard ? "rgba(56, 189, 248, 0.14)" : "rgba(249, 115, 22, 0.14)";
                                e.currentTarget.style.borderColor = isCard ? "rgba(56, 189, 248, 0.4)" : "rgba(249, 115, 22, 0.4)";
                                e.currentTarget.style.color = isCard ? "#38bdf8" : "#fdba74";
                              }}
                              title={`Assign order to ${isCard ? "In-House Employee" : "Labour Contractor"}`}
                            >
                              <span>{isCard ? "👤" : "🤝"}</span>
                              <span>{isCard ? "Assign Staff" : "Assign Labour"}</span>
                            </button>
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
            ? `${assigningOrder.client} · Total Volume: ${assigningOrder.qty.toLocaleString()} units`
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

            {/* Workflow Notice */}
            {isAssigningCard ? (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "5px",
                  backgroundColor: "rgba(56, 189, 248, 0.1)",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1 }}>👤</span>
                <div style={{ fontSize: "12px", lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    In-House Staff Operators
                  </div>
                  <div style={{ color: "#e2e8f0", marginTop: "2px" }}>
                    ID Card printing, lamination, and RFID encoding are performed internally by trained staff operators.
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "5px",
                  backgroundColor: "rgba(249, 115, 22, 0.08)",
                  border: "1px solid rgba(249, 115, 22, 0.3)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1 }}>🔀</span>
                <div style={{ fontSize: "12px", lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 800, color: "#fb923c", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Production Delegation & Order Splitting
                  </div>
                  <div style={{ color: "#e2e8f0", marginTop: "2px" }}>
                    Select which labour contractor(s) or staff operator(s) to assign. You can divide the {assigningOrder.qty.toLocaleString()} total units across multiple workers. Material buffers & handovers are managed on the Labour Profile page.
                  </div>
                </div>
              </div>
            )}

            {/* Order Details Card with Recognized Badges */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                padding: "14px 16px",
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Client</div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff", marginTop: "2px" }}>{assigningOrder.client}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Ordered Product</div>
                <div style={{ marginTop: "4px" }}>
                  <ItemBadge name={assigningOrder.itemOrdered || "Lanyard"} />
                </div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Description</div>
                <div style={{ fontSize: "12.5px", color: "#e2e8f0", marginTop: "2px" }}>{assigningOrder.product}</div>

                {/* Recognized Stock Badges */}
                {orderRequiredItems.length > 0 && (
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.5px" }}>
                      Identified Items:
                    </span>
                    {orderRequiredItems.map((item, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
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
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Target Delivery SLA</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", marginTop: "2px" }}>{assigningOrder.deliveryDate}</div>
              </div>
            </div>

            {/* ─── ALLOCATION WORKSPACE ─── */}
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
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Volume Allocation ({allocations.length} {allocations.length === 1 ? "Assignee" : "Assignees"})
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
                  + Divide Order / Add Assignee
                </Button>

                {remainingToAllocate > 0 && (
                  <span style={{ fontSize: "11px", color: "#f59e0b", fontStyle: "italic" }}>
                    {remainingToAllocate.toLocaleString()} units left to divide
                  </span>
                )}
              </div>
            </div>

            {/* Note explaining stock buffer location */}
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "5px",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "11.5px",
                color: "var(--text-muted)",
              }}
            >
              <span>ℹ️</span>
              <span>
                Contractor stock buffer holdings and live warehouse material issue (handover) are managed on the <strong>Labour Profile</strong> page.
              </span>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
