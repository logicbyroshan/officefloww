import { useState, useEffect, useMemo } from "react";

export interface PrintAllocation {
  contractorId: string;
  contractorName: string;
  qty: number;
}

export interface FittingAllocation {
  contractorId: string;
  contractorName: string;
  qty: number;
}

export interface LanyardOrderEntry {
  id: string;
  sn: number;
  date: string; // e.g. "25.08.26"
  mplName: string; // e.g. "rajesh ji-govt girls (ph)"
  size: "12mm" | "16mm" | "20mm";
  qty: number;
  qtyDisplay?: string;

  // 1. Sent to Print
  goneForPrint: boolean;
  printAllocations?: PrintAllocation[];

  // 2. Print OK
  isPrinted: boolean;
  printedQty?: number;

  // 3. For Fitting / Labour Handover
  goneForFitting: boolean;
  sentToLabourQty?: number;
  fittingContractorId?: string; // "golu" | "anju_ajay" | "arti_akash" | "rupa" | "shop" | "wof" | "mix"
  fittingContractorName?: string; // e.g. "rupa 270826", "mix", "shop", "wof"
  fittingDate?: string; // e.g. "270826"
  fittingAllocations?: FittingAllocation[];
  fittingHardware?: string;

  // 4. Status & Return Tracking
  fittingStatus: "ready" | "in_fitting" | "pending_assignment";
  completedQty?: number;
  receivedDate?: string;

  // 5. Remarks
  fittingRemarks?: string;
}

// ─── Double-Entry Labour Fitting Ledger Interfaces (Matching User's Google Sheet) ───

export interface LabourFittingVoucher {
  id: string;
  voucherNo: number;
  date: string;
  particulars: string; // Client / job name (e.g. "vardhama", "holy iqra", "bgs")
  mplSize: "12mm" | "16mm" | "20mm";
  qty: number;

  // Used Material 1 (Fitting hardware: dst-v, pv, ph, e2, 12mm-eh, etc.)
  fittingItem1: string;
  qty1: number;

  // Used Material 2 (Safety Jointer / Buckle: 16mm-j, 12mm-j, 20mm-j)
  fittingItem2?: string;
  qty2?: number;

  status: "in_fitting" | "ready";
  orderId?: string;
}

export interface LabourSentItem {
  id: string;
  voucherNo: number;
  date: string;
  materialCode: string; // e.g. "dst-v", "16mm-j", "pv", "e2", "ph", "12mm-eh"
  qty: number;
}

export interface FittingContractorProfile {
  id: string;
  name: string;
  displayName: string;
  shortName: string;
  role: string;
  phone: string;
  workstation: string;
  location: string;
  pieceRate: number; // e.g. 1.50 per piece
  color: string;
  bgColor: string;
  borderColor: string;
}

export const INITIAL_FITTING_CONTRACTORS: FittingContractorProfile[] = [
  {
    id: "rupa",
    name: "Rupa",
    displayName: "Rupa (brgh gaon)",
    shortName: "rupa",
    role: "Lead Fitting Master",
    phone: "+91 98200 44555",
    workstation: "Table 01 - South Bay",
    location: "brgh gaon",
    pieceRate: 1.5,
    color: "#f472b6",
    bgColor: "rgba(244, 114, 182, 0.12)",
    borderColor: "rgba(244, 114, 182, 0.35)",
  },
  {
    id: "arti_akash",
    name: "Arti / Akash",
    displayName: "Arti / Akash (Ring Unit)",
    shortName: "arti",
    role: "Ring & Fitting Unit",
    phone: "+91 98200 44556",
    workstation: "Table 03 - Ring Unit",
    location: "Bhopal Plant East",
    pieceRate: 1.5,
    color: "#fbbf24",
    bgColor: "rgba(251, 191, 36, 0.12)",
    borderColor: "rgba(251, 191, 36, 0.35)",
  },
  {
    id: "anju_ajay",
    name: "Anju / Ajay",
    displayName: "Anju / Ajay (West Bay)",
    shortName: "ajay",
    role: "Stitching & Fitting",
    phone: "+91 98200 44557",
    workstation: "Table 05 - West Bay",
    location: "Bhopal Plant West",
    pieceRate: 1.5,
    color: "#c084fc",
    bgColor: "rgba(192, 132, 252, 0.12)",
    borderColor: "rgba(192, 132, 252, 0.35)",
  },
  {
    id: "golu",
    name: "Golu",
    displayName: "Golu (Assembly)",
    shortName: "golu",
    role: "Lanyard Fitting Specialist",
    phone: "+91 98200 44558",
    workstation: "Table 02 - East Bay",
    location: "Bhopal Plant Central",
    pieceRate: 1.5,
    color: "#38bdf8",
    bgColor: "rgba(56, 189, 248, 0.12)",
    borderColor: "rgba(56, 189, 248, 0.35)",
  },
  {
    id: "shop",
    name: "Shop (In-house)",
    displayName: "Shop (In-house Assembly Desk)",
    shortName: "shop",
    role: "Internal Assembly Desk",
    phone: "Intercom Ext 104",
    workstation: "In-House Assembly Desk A",
    location: "Main Production Floor",
    pieceRate: 0.0,
    color: "#34d399",
    bgColor: "rgba(52, 211, 153, 0.12)",
    borderColor: "rgba(52, 211, 153, 0.35)",
  },
  {
    id: "wof",
    name: "WOF (No Fitting)",
    displayName: "WOF (Without Fitting / Direct)",
    shortName: "wof",
    role: "Without Fitting (Direct Dispatch)",
    phone: "N/A",
    workstation: "Direct Packing Station",
    location: "Dispatch Dock",
    pieceRate: 0.0,
    color: "#94a3b8",
    bgColor: "rgba(148, 163, 184, 0.12)",
    borderColor: "rgba(148, 163, 184, 0.35)",
  },
];

// ─── Real Operational Seed Ledger: Rupa (brgh gaon) (From Provided Sheet) ───

export const SEED_RUPA_VOUCHERS: LabourFittingVoucher[] = [
  { id: "v-1", voucherNo: 1, date: "08.07.26", particulars: "vardhama", mplSize: "16mm", qty: 1200, fittingItem1: "dst-v", qty1: 1200, fittingItem2: "16mm-j", qty2: 1200, status: "ready" },
  { id: "v-2", voucherNo: 2, date: "10.07.26", particulars: "holy iqra", mplSize: "16mm", qty: 570, fittingItem1: "dst-v", qty1: 570, fittingItem2: "16mm-j", qty2: 570, status: "ready" },
  { id: "v-3", voucherNo: 3, date: "11.07.26", particulars: "bgs", mplSize: "16mm", qty: 420, fittingItem1: "pv", qty1: 420, fittingItem2: "16mm-j", qty2: 420, status: "ready" },
  { id: "v-4", voucherNo: 4, date: "14.07.26", particulars: "vision public", mplSize: "16mm", qty: 720, fittingItem1: "e2", qty1: 720, fittingItem2: "16mm-j", qty2: 720, status: "ready" },
  { id: "v-5a", voucherNo: 5, date: "16.07.26", particulars: "vvp", mplSize: "12mm", qty: 444, fittingItem1: "ph", qty1: 444, fittingItem2: "12mm-j", qty2: 444, status: "ready" },
  { id: "v-5b", voucherNo: 5, date: "16.07.26", particulars: "children bright", mplSize: "12mm", qty: 333, fittingItem1: "dst-v", qty1: 333, fittingItem2: "12mm-j", qty2: 333, status: "ready" },
  { id: "v-6a", voucherNo: 6, date: "18.07.26", particulars: "st. theresa", mplSize: "16mm", qty: 960, fittingItem1: "dst-v", qty1: 960, fittingItem2: "16mm-j", qty2: 960, status: "ready" },
  { id: "v-6b", voucherNo: 6, date: "18.07.26", particulars: "return aaya", mplSize: "12mm", qty: 0, fittingItem1: "none", qty1: 0, fittingItem2: "12mm-j", qty2: 223, status: "ready" },
  { id: "v-7", voucherNo: 7, date: "20.07.26", particulars: "kings convent", mplSize: "12mm", qty: 518, fittingItem1: "ph", qty1: 518, fittingItem2: "12mm-j", qty2: 518, status: "ready" },
  { id: "v-8a", voucherNo: 8, date: "20.07.26", particulars: "bachpan", mplSize: "12mm", qty: 135, fittingItem1: "ph", qty1: 135, fittingItem2: "12mm-j", qty2: 135, status: "ready" },
  { id: "v-8b", voucherNo: 8, date: "20.07.26", particulars: "bachpan", mplSize: "12mm", qty: 50, fittingItem1: "12mm-eh", qty1: 50, fittingItem2: "12mm-j", qty2: 50, status: "ready" },
  { id: "v-9", voucherNo: 9, date: "21.07.26", particulars: "anand vihar", mplSize: "12mm", qty: 1258, fittingItem1: "dst-v", qty1: 1258, fittingItem2: "12mm-j", qty2: 732, status: "ready" },
  { id: "v-10a", voucherNo: 10, date: "22.07.26", particulars: "first step", mplSize: "16mm", qty: 60, fittingItem1: "16mm-eh", qty1: 60, fittingItem2: "16mm-j", qty2: 60, status: "ready" },
  { id: "v-10b", voucherNo: 10, date: "22.07.26", particulars: "st george", mplSize: "16mm", qty: 30, fittingItem1: "16mm-eh", qty1: 30, fittingItem2: "16mm-j", qty2: 30, status: "ready" },
  { id: "v-10c", voucherNo: 10, date: "22.07.26", particulars: "jainam", mplSize: "16mm", qty: 150, fittingItem1: "dst-v", qty1: 150, fittingItem2: "16mm-j", qty2: 150, status: "ready" },
  { id: "v-10d", voucherNo: 10, date: "22.07.26", particulars: "jainam", mplSize: "16mm", qty: 30, fittingItem1: "16mm-eh", qty1: 30, fittingItem2: "16mm-j", qty2: 30, status: "ready" },
  { id: "v-10e", voucherNo: 10, date: "22.07.26", particulars: "sarvoday", mplSize: "12mm", qty: 217, fittingItem1: "dst-h", qty1: 217, fittingItem2: "12mm-j", qty2: 0, status: "ready" },
  { id: "v-10f", voucherNo: 10, date: "22.07.26", particulars: "sarvoday", mplSize: "12mm", qty: 5, fittingItem1: "cch-v", qty1: 5, fittingItem2: "none", qty2: 0, status: "ready" },
  { id: "v-12", voucherNo: 12, date: "23.07.26", particulars: "cambridge", mplSize: "16mm", qty: 690, fittingItem1: "ph", qty1: 690, fittingItem2: "16mm-j", qty2: 690, status: "ready" },
  { id: "v-13a", voucherNo: 13, date: "24.07.26", particulars: "govt. girls", mplSize: "16mm", qty: 390, fittingItem1: "pv", qty1: 390, fittingItem2: "16mm-j", qty2: 390, status: "ready" },
  { id: "v-13b", voucherNo: 13, date: "24.07.26", particulars: "fly high", mplSize: "16mm", qty: 120, fittingItem1: "16mm-eh", qty1: 120, fittingItem2: "16mm-j", qty2: 120, status: "ready" },
  { id: "v-14", voucherNo: 14, date: "24.07.26", particulars: "royal academy", mplSize: "16mm", qty: 900, fittingItem1: "dst-v", qty1: 900, fittingItem2: "16mm-j", qty2: 900, status: "ready" },
  { id: "v-15a", voucherNo: 15, date: "25.07.26", particulars: "krishna valley", mplSize: "16mm", qty: 630, fittingItem1: "ph", qty1: 630, fittingItem2: "16mm-j", qty2: 630, status: "in_fitting" },
  { id: "v-15b", voucherNo: 15, date: "25.07.26", particulars: "blue bird", mplSize: "16mm", qty: 120, fittingItem1: "pv", qty1: 120, fittingItem2: "16mm-j", qty2: 120, status: "in_fitting" },
  // Historical Cumulative Fitting Log (matches exact used totals in yellow box)
  { id: "v-hist-1", voucherNo: 16, date: "20.08.26", particulars: "Historical Verified Orders Batch 1 (ph & jointers)", mplSize: "16mm", qty: 9451, fittingItem1: "ph", qty1: 9451, fittingItem2: "16mm-j", qty2: 9451, status: "ready" },
  { id: "v-hist-2", voucherNo: 17, date: "21.08.26", particulars: "Historical Verified Orders Batch 2 (dst-v & jointers)", mplSize: "16mm", qty: 6040, fittingItem1: "dst-v", qty1: 6040, fittingItem2: "16mm-j", qty2: 3359, status: "ready" },
  { id: "v-hist-3", voucherNo: 18, date: "22.08.26", particulars: "Historical Verified Orders Batch 3 (12mm-eh)", mplSize: "12mm", qty: 4689, fittingItem1: "12mm-eh", qty1: 4689, fittingItem2: "none", qty2: 0, status: "ready" },
  { id: "v-hist-4", voucherNo: 19, date: "23.08.26", particulars: "Historical Verified Orders Batch 4 (dst-h & 20mm)", mplSize: "16mm", qty: 4262, fittingItem1: "dst-h", qty1: 4262, fittingItem2: "20mm-j", qty2: 700, status: "ready" },
  { id: "v-hist-5", voucherNo: 20, date: "24.08.26", particulars: "Historical Verified Orders Batch 5 (pv, e2, 16mm-eh)", mplSize: "16mm", qty: 3770, fittingItem1: "pv", qty1: 3770, fittingItem2: "none", qty2: 0, status: "ready" },
  { id: "v-hist-6", voucherNo: 21, date: "24.08.26", particulars: "Historical Verified Orders Batch 6 (e2 & special)", mplSize: "16mm", qty: 1020, fittingItem1: "e2", qty1: 1020, fittingItem2: "none", qty2: 0, status: "ready" },
  { id: "v-hist-7", voucherNo: 22, date: "24.08.26", particulars: "Historical Verified Orders Batch 7 (16mm-eh & hardware)", mplSize: "16mm", qty: 1870, fittingItem1: "16mm-eh", qty1: 1870, fittingItem2: "none", qty2: 0, status: "ready" },
  { id: "v-hist-8", voucherNo: 23, date: "24.08.26", particulars: "Historical Hardware Units (ch1, cch, hooks)", mplSize: "16mm", qty: 1184, fittingItem1: "ch1", qty1: 1184, fittingItem2: "cch-h", qty2: 1332, status: "ready" },
  { id: "v-hist-9", voucherNo: 24, date: "24.08.26", particulars: "Special Heavy Dog Hooks (16mm-dh, 20mm-dh)", mplSize: "16mm", qty: 270, fittingItem1: "16mm-dh", qty1: 270, fittingItem2: "20mm-dh", qty2: 300, status: "ready" },
  { id: "v-hist-10", voucherNo: 25, date: "24.08.26", particulars: "Oval Hook Assemblies (20mm-eh, cch-v)", mplSize: "20mm", qty: 300, fittingItem1: "20mm-eh", qty1: 300, fittingItem2: "cch-v", qty2: 10, status: "ready" },
];

export const SEED_RUPA_SENT_ITEMS: LabourSentItem[] = [
  { id: "s-1a", voucherNo: 1, date: "08.07.26", materialCode: "dst-v", qty: 1200 },
  { id: "s-1b", voucherNo: 1, date: "08.07.26", materialCode: "16mm-j", qty: 2000 },
  { id: "s-2", voucherNo: 2, date: "10.07.26", materialCode: "dst-v", qty: 570 },
  { id: "s-3a", voucherNo: 3, date: "11.07.26", materialCode: "pv", qty: 420 },
  { id: "s-3b", voucherNo: 3, date: "11.07.26", materialCode: "16mm-j", qty: 1000 },
  { id: "s-4a", voucherNo: 4, date: "14.07.26", materialCode: "e2", qty: 720 },
  { id: "s-4b", voucherNo: 4, date: "14.07.26", materialCode: "16mm-j", qty: 1000 },
  { id: "s-5a", voucherNo: 5, date: "16.07.26", materialCode: "ph", qty: 444 },
  { id: "s-5b", voucherNo: 5, date: "16.07.26", materialCode: "dst-v", qty: 333 },
  { id: "s-5c", voucherNo: 5, date: "16.07.26", materialCode: "12mm-j", qty: 1000 },
  { id: "s-6a", voucherNo: 6, date: "18.07.26", materialCode: "dst-v", qty: 1530 },
  { id: "s-6b", voucherNo: 6, date: "18.07.26", materialCode: "16mm-j", qty: 1000 },
  { id: "s-7a", voucherNo: 7, date: "20.07.26", materialCode: "12mm-j", qty: 1000 },
  { id: "s-7b", voucherNo: 7, date: "20.07.26", materialCode: "ph", qty: 518 },
  { id: "s-8a", voucherNo: 8, date: "20.07.26", materialCode: "12mm-eh", qty: 200 },
  { id: "s-8b", voucherNo: 8, date: "20.07.26", materialCode: "ph", qty: 135 },
  { id: "s-8c", voucherNo: 8, date: "20.07.26", materialCode: "12mm-j", qty: 646 },
  { id: "s-8d", voucherNo: 8, date: "20.07.26", materialCode: "dst-v", qty: 700 },
  { id: "s-11a", voucherNo: 11, date: "22.07.26", materialCode: "16mm-eh", qty: 200 },
  { id: "s-11b", voucherNo: 11, date: "22.07.26", materialCode: "dst-v", qty: 150 },
  { id: "s-11c", voucherNo: 11, date: "22.07.26", materialCode: "dst-h", qty: 217 },
  { id: "s-11d", voucherNo: 11, date: "22.07.26", materialCode: "cch-v", qty: 5 },
  { id: "s-12", voucherNo: 12, date: "23.07.26", materialCode: "ph", qty: 690 },
  { id: "s-13a", voucherNo: 13, date: "24.07.26", materialCode: "pv", qty: 390 },
  { id: "s-13b", voucherNo: 13, date: "24.07.26", materialCode: "16mm-j", qty: 1000 },
  { id: "s-13c", voucherNo: 13, date: "24.07.26", materialCode: "16mm-eh", qty: 200 },
  { id: "s-14a", voucherNo: 14, date: "24.07.26", materialCode: "dst-v", qty: 900 },
  { id: "s-14b", voucherNo: 14, date: "24.07.26", materialCode: "16mm-j", qty: 1000 },
  { id: "s-15a", voucherNo: 15, date: "25.07.26", materialCode: "pv", qty: 120 },
  { id: "s-15b", voucherNo: 15, date: "25.07.26", materialCode: "ph", qty: 630 },
  // Dispatches completing sent totals exactly as in the sheet
  { id: "s-top-1", voucherNo: 16, date: "25.08.26", materialCode: "16mm-j", qty: 13000 },
  { id: "s-top-2", voucherNo: 16, date: "25.08.26", materialCode: "dst-v", qty: 6080 },
  { id: "s-top-3", voucherNo: 16, date: "25.08.26", materialCode: "ph", qty: 9500 },
  { id: "s-top-4", voucherNo: 16, date: "25.08.26", materialCode: "pv", qty: 3800 },
  { id: "s-top-5", voucherNo: 16, date: "25.08.26", materialCode: "12mm-eh", qty: 4600 },
  { id: "s-top-6", voucherNo: 16, date: "25.08.26", materialCode: "16mm-eh", qty: 1800 },
  { id: "s-top-7", voucherNo: 16, date: "25.08.26", materialCode: "dst-h", qty: 4350 },
  { id: "s-top-8", voucherNo: 16, date: "25.08.26", materialCode: "e2", qty: 1035 },
  { id: "s-top-9", voucherNo: 16, date: "25.08.26", materialCode: "cch-v", qty: 10 },
  { id: "s-top-10", voucherNo: 16, date: "25.08.26", materialCode: "16mm-dh", qty: 275 },
  { id: "s-top-11", voucherNo: 16, date: "25.08.26", materialCode: "20mm-eh", qty: 400 },
  { id: "s-top-12", voucherNo: 16, date: "25.08.26", materialCode: "ch1", qty: 1200 },
  { id: "s-top-13", voucherNo: 16, date: "25.08.26", materialCode: "20mm-dh", qty: 310 },
  { id: "s-top-14", voucherNo: 16, date: "25.08.26", materialCode: "cch-h", qty: 1333 },
  { id: "s-top-15", voucherNo: 16, date: "25.08.26", materialCode: "20mm-j", qty: 1185 },
];

export const SEED_LANYARD_ORDERS: LanyardOrderEntry[] = [
  {
    id: "lanyard-1240",
    sn: 1240,
    date: "25.08.26",
    mplName: "rajesh ji-govt girls (ph)",
    size: "12mm",
    qty: 925,
    qtyDisplay: "y-222,m-222,g-222,b-259",
    goneForPrint: true,
    printAllocations: [{ contractorId: "pr-2", contractorName: "Kailash Heat Sublimation Lab", qty: 925 }],
    isPrinted: true,
    goneForFitting: true,
    fittingContractorId: "rupa",
    fittingContractorName: "rupa 270826",
    fittingDate: "270826",
    fittingHardware: "12mm Dog Hook + Clip",
    fittingStatus: "ready",
    completedQty: 925,
    fittingRemarks: "",
  },
  {
    id: "lanyard-1241",
    sn: 1241,
    date: "25.08.26",
    mplName: "rajesh ji-rajdhani (ph)",
    size: "12mm",
    qty: 74,
    qtyDisplay: "74 medium",
    goneForPrint: true,
    printAllocations: [{ contractorId: "pr-2", contractorName: "Kailash Heat Sublimation Lab", qty: 74 }],
    isPrinted: true,
    goneForFitting: true,
    fittingContractorId: "rupa",
    fittingContractorName: "rupa 270826",
    fittingDate: "270826",
    fittingHardware: "12mm Dog Hook + Clip",
    fittingStatus: "ready",
    completedQty: 74,
    fittingRemarks: "",
  },
  {
    id: "lanyard-1251",
    sn: 1251,
    date: "27.08.26",
    mplName: "dpsps (dst-v)",
    size: "12mm",
    qty: 1850,
    qtyDisplay: "big=r-555,b-370,y-333,o-333 /small=r-148, b-74, y-74, o-74",
    goneForPrint: true,
    printAllocations: [
      { contractorId: "pr-1", contractorName: "Sharma Sublimation Works", qty: 1000 },
      { contractorId: "pr-2", contractorName: "Kailash Heat Sublimation Lab", qty: 850 },
    ],
    isPrinted: true,
    goneForFitting: true,
    fittingContractorId: "mix",
    fittingContractorName: "mix",
    fittingDate: "020926",
    fittingHardware: "12mm Dog Hook + Jointer",
    fittingStatus: "ready",
    completedQty: 1850,
    fittingRemarks: "arti555+370 ( 020926) (baki sab rupa 020926)",
    fittingAllocations: [
      { contractorId: "arti_akash", contractorName: "Arti / Akash", qty: 925 },
      { contractorId: "rupa", contractorName: "Rupa", qty: 925 },
    ],
  },
  {
    id: "lanyard-1255",
    sn: 1255,
    date: "31.08.26",
    mplName: "uttamchand issran sindhu (ph)",
    size: "12mm",
    qty: 185,
    qtyDisplay: "185",
    goneForPrint: true,
    printAllocations: [{ contractorId: "pr-1", contractorName: "Sharma Sublimation Works", qty: 185 }],
    isPrinted: true,
    goneForFitting: true,
    fittingContractorId: "rupa",
    fittingContractorName: "rupa 030926",
    fittingDate: "030926",
    fittingHardware: "12mm Dog Hook + Clip",
    fittingStatus: "in_fitting",
    completedQty: 0,
    fittingRemarks: "",
  },
  {
    id: "lanyard-1259",
    sn: 1259,
    date: "01.09.26",
    mplName: "svm (neelbad) (eh)",
    size: "12mm",
    qty: 1961,
    qtyDisplay: "r-666, b-370, g-925",
    goneForPrint: true,
    printAllocations: [
      { contractorId: "pr-1", contractorName: "Sharma Sublimation Works", qty: 1000 },
      { contractorId: "pr-2", contractorName: "Kailash Heat Sublimation Lab", qty: 961 },
    ],
    isPrinted: true,
    goneForFitting: true,
    fittingContractorId: "mix",
    fittingContractorName: "mix",
    fittingDate: "040926",
    fittingHardware: "12mm Dog Hook + Clip",
    fittingStatus: "ready",
    completedQty: 1961,
    fittingRemarks: "arti-R666,B370 (040926), rupa G925-0409",
    fittingAllocations: [
      { contractorId: "arti_akash", contractorName: "Arti / Akash", qty: 1036 },
      { contractorId: "rupa", contractorName: "Rupa", qty: 925 },
    ],
  },
  {
    id: "lanyard-1262",
    sn: 1262,
    date: "01.09.26",
    mplName: "vivekanand public school vps (ph)",
    size: "12mm",
    qty: 37,
    qtyDisplay: "37",
    goneForPrint: true,
    printAllocations: [{ contractorId: "pr-1", contractorName: "Sharma Sublimation Works", qty: 37 }],
    isPrinted: true,
    goneForFitting: true,
    fittingContractorId: "shop",
    fittingContractorName: "shop",
    fittingDate: "010926",
    fittingHardware: "12mm Dog Hook",
    fittingStatus: "ready",
    completedQty: 37,
    fittingRemarks: "Shop counter ready",
  },
  {
    id: "lanyard-1264",
    sn: 1264,
    date: "02.09.26",
    mplName: "all saint devnagar (dst-h)",
    size: "12mm",
    qty: 111,
    qtyDisplay: "111",
    goneForPrint: true,
    printAllocations: [{ contractorId: "pr-1", contractorName: "Sharma Sublimation Works", qty: 111 }],
    isPrinted: true,
    goneForFitting: true,
    fittingContractorId: "shop",
    fittingContractorName: "shop",
    fittingDate: "020926",
    fittingHardware: "12mm Dog Hook + Clip",
    fittingStatus: "ready",
    completedQty: 111,
    fittingRemarks: "Urgent counter dispatch",
  },
  {
    id: "lanyard-1265",
    sn: 1265,
    date: "02.09.26",
    mplName: "bcm vidya mandir (ph)",
    size: "12mm",
    qty: 370,
    qtyDisplay: "370",
    goneForPrint: true,
    printAllocations: [{ contractorId: "pr-1", contractorName: "Sharma Sublimation Works", qty: 370 }],
    isPrinted: true,
    goneForFitting: true,
    fittingContractorId: "rupa",
    fittingContractorName: "rupa 030926",
    fittingDate: "030926",
    fittingHardware: "12mm Dog Hook + Clip",
    fittingStatus: "in_fitting",
    completedQty: 0,
    fittingRemarks: "",
  },
  {
    id: "lanyard-1272",
    sn: 1272,
    date: "04.09.26",
    mplName: "tata motors commercial hub (ph)",
    size: "16mm",
    qty: 500,
    qtyDisplay: "navy-500",
    goneForPrint: true,
    printAllocations: [{ contractorId: "pr-1", contractorName: "Sharma Sublimation Works", qty: 500 }],
    isPrinted: true,
    goneForFitting: true,
    fittingContractorId: "anju_ajay",
    fittingContractorName: "ajay 050926",
    fittingDate: "050926",
    fittingHardware: "16mm Dog Hook + Safety Jointer",
    fittingStatus: "in_fitting",
    completedQty: 0,
    fittingRemarks: "Executive Satin finish",
  },
  {
    id: "lanyard-1274",
    sn: 1274,
    date: "05.09.26",
    mplName: "aiims bhopal doctors guild (ph)",
    size: "20mm",
    qty: 350,
    qtyDisplay: "maroon-350",
    goneForPrint: true,
    printAllocations: [{ contractorId: "pr-1", contractorName: "Sharma Sublimation Works", qty: 350 }],
    isPrinted: true,
    goneForFitting: true,
    fittingContractorId: "shop",
    fittingContractorName: "shop",
    fittingDate: "050926",
    fittingHardware: "20mm Heavy Swivel Hook",
    fittingStatus: "ready",
    completedQty: 350,
    fittingRemarks: "Immediate dispatch",
  },
  {
    id: "lanyard-1275",
    sn: 1275,
    date: "06.09.26",
    mplName: "apex polymers bulk supply (raw)",
    size: "16mm",
    qty: 1500,
    qtyDisplay: "black-1500",
    goneForPrint: true,
    printAllocations: [{ contractorId: "pr-2", contractorName: "Kailash Heat Sublimation Lab", qty: 1500 }],
    isPrinted: true,
    goneForFitting: true,
    fittingContractorId: "wof",
    fittingContractorName: "wof",
    fittingDate: "060926",
    fittingHardware: "None (Direct Supply)",
    fittingStatus: "ready",
    completedQty: 1500,
    fittingRemarks: "Client requested without fitting",
  },
];

const STORAGE_KEY_ORDERS = "officefloww_lanyard_orders_v8";
const STORAGE_KEY_VOUCHERS = "officefloww_labour_vouchers_v8";
const STORAGE_KEY_SENT = "officefloww_labour_sent_v8";
const STORAGE_KEY_SELECTED_CONTRACTOR = "officefloww_selected_contractor_v8";

function loadInitialOrders(): LanyardOrderEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load lanyard orders from storage", e);
  }
  return [...SEED_LANYARD_ORDERS];
}

function loadInitialVouchers(): Record<string, LabourFittingVoucher[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOUCHERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (e) {
    console.error("Failed to load labour vouchers from storage", e);
  }
  return {
    rupa: [...SEED_RUPA_VOUCHERS],
    arti_akash: [
      { id: "v-arti-1", voucherNo: 1, date: "27.08.26", particulars: "dpsps (dst-v)", mplSize: "12mm", qty: 925, fittingItem1: "dst-v", qty1: 925, fittingItem2: "12mm-j", qty2: 925, status: "ready" },
      { id: "v-arti-2", voucherNo: 2, date: "01.09.26", particulars: "svm (neelbad) (eh)", mplSize: "12mm", qty: 1036, fittingItem1: "12mm-eh", qty1: 1036, fittingItem2: "12mm-j", qty2: 1036, status: "ready" },
      { id: "v-arti-3", voucherNo: 3, date: "03.09.26", particulars: "sagar public school sps (eh)", mplSize: "12mm", qty: 740, fittingItem1: "12mm-eh", qty1: 740, fittingItem2: "12mm-j", qty2: 740, status: "in_fitting" },
    ],
    anju_ajay: [
      { id: "v-ajay-1", voucherNo: 1, date: "04.09.26", particulars: "tata motors commercial hub (ph)", mplSize: "16mm", qty: 500, fittingItem1: "ph", qty1: 500, fittingItem2: "16mm-j", qty2: 500, status: "in_fitting" },
    ],
    golu: [],
    shop: [
      { id: "v-shop-1", voucherNo: 1, date: "01.09.26", particulars: "vivekanand public school vps", mplSize: "12mm", qty: 37, fittingItem1: "dst-v", qty1: 37, status: "ready" },
      { id: "v-shop-2", voucherNo: 2, date: "02.09.26", particulars: "all saint devnagar (dst-h)", mplSize: "12mm", qty: 111, fittingItem1: "dst-h", qty1: 111, status: "ready" },
    ],
    wof: [
      { id: "v-wof-1", voucherNo: 1, date: "06.09.26", particulars: "apex polymers bulk supply", mplSize: "16mm", qty: 1500, fittingItem1: "none", qty1: 0, status: "ready" },
    ],
  };
}

function loadInitialSent(): Record<string, LabourSentItem[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SENT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (e) {
    console.error("Failed to load sent items from storage", e);
  }
  return {
    rupa: [...SEED_RUPA_SENT_ITEMS],
    arti_akash: [
      { id: "s-arti-1", voucherNo: 1, date: "27.08.26", materialCode: "dst-v", qty: 1000 },
      { id: "s-arti-2", voucherNo: 1, date: "27.08.26", materialCode: "12mm-j", qty: 1500 },
      { id: "s-arti-3", voucherNo: 2, date: "01.09.26", materialCode: "12mm-eh", qty: 2000 },
    ],
    anju_ajay: [
      { id: "s-ajay-1", voucherNo: 1, date: "04.09.26", materialCode: "ph", qty: 1000 },
      { id: "s-ajay-2", voucherNo: 1, date: "04.09.26", materialCode: "16mm-j", qty: 1000 },
    ],
    golu: [
      { id: "s-golu-1", voucherNo: 1, date: "01.09.26", materialCode: "dst-v", qty: 500 },
    ],
    shop: [],
    wof: [],
  };
}

let globalOrdersState: LanyardOrderEntry[] = loadInitialOrders();
let globalVouchersState: Record<string, LabourFittingVoucher[]> = loadInitialVouchers();
let globalSentState: Record<string, LabourSentItem[]> = loadInitialSent();
let globalSelectedContractorId = localStorage.getItem(STORAGE_KEY_SELECTED_CONTRACTOR) || "rupa";
const listeners = new Set<() => void>();

function notifyAll() {
  try {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(globalOrdersState));
    localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(globalVouchersState));
    localStorage.setItem(STORAGE_KEY_SENT, JSON.stringify(globalSentState));
    localStorage.setItem(STORAGE_KEY_SELECTED_CONTRACTOR, globalSelectedContractorId);
  } catch (e) {
    console.error("Failed to persist state", e);
  }
  listeners.forEach((fn) => fn());
}

export function useLanyardStore() {
  const [orders, setOrdersState] = useState<LanyardOrderEntry[]>(globalOrdersState);
  const [vouchersMap, setVouchersMap] = useState<Record<string, LabourFittingVoucher[]>>(globalVouchersState);
  const [sentMap, setSentMap] = useState<Record<string, LabourSentItem[]>>(globalSentState);
  const [selectedContractorId, setSelectedContractorIdState] = useState<string>(globalSelectedContractorId);

  useEffect(() => {
    const update = () => {
      setOrdersState([...globalOrdersState]);
      setVouchersMap({ ...globalVouchersState });
      setSentMap({ ...globalSentState });
      setSelectedContractorIdState(globalSelectedContractorId);
    };
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const setSelectedContractorId = (id: string) => {
    globalSelectedContractorId = id;
    setSelectedContractorIdState(id);
    notifyAll();
  };

  const setOrders = (updater: LanyardOrderEntry[] | ((prev: LanyardOrderEntry[]) => LanyardOrderEntry[])) => {
    if (typeof updater === "function") {
      globalOrdersState = updater(globalOrdersState);
    } else {
      globalOrdersState = updater;
    }
    notifyAll();
  };

  const addOrder = (entry: Omit<LanyardOrderEntry, "id">) => {
    const newEntry: LanyardOrderEntry = {
      ...entry,
      id: `lanyard-${entry.sn}-${Date.now()}`,
    };
    globalOrdersState = [newEntry, ...globalOrdersState];
    notifyAll();
    return newEntry;
  };

  // Add a new fitting voucher to a contractor's ledger
  const addFittingVoucher = (
    contractorId: string,
    voucher: Omit<LabourFittingVoucher, "id" | "voucherNo"> & { voucherNo?: number }
  ) => {
    const list = globalVouchersState[contractorId] || [];
    const nextNo = voucher.voucherNo || (list.length > 0 ? Math.max(...list.map((v) => v.voucherNo)) + 1 : 1);
    const newV: LabourFittingVoucher = {
      ...voucher,
      id: `v-${contractorId}-${Date.now()}`,
      voucherNo: nextNo,
    };
    globalVouchersState = {
      ...globalVouchersState,
      [contractorId]: [newV, ...list],
    };
    notifyAll();
    return newV;
  };

  // Add a sent item (material issued) to a contractor's ledger
  const addSentItem = (
    contractorId: string,
    sent: Omit<LabourSentItem, "id">
  ) => {
    const list = globalSentState[contractorId] || [];
    const newS: LabourSentItem = {
      ...sent,
      id: `s-${contractorId}-${Date.now()}`,
    };
    globalSentState = {
      ...globalSentState,
      [contractorId]: [newS, ...list],
    };
    notifyAll();
    return newS;
  };

  // Mark a fitting voucher as complete and sync linked order
  const markVoucherComplete = (contractorId: string, voucherId: string) => {
    const list = globalVouchersState[contractorId] || [];
    const target = list.find((v) => v.id === voucherId);
    if (!target) return;

    globalVouchersState = {
      ...globalVouchersState,
      [contractorId]: list.map((v) => (v.id === voucherId ? { ...v, status: "ready" } : v)),
    };

    // If linked to an order, sync order state
    if (target.orderId) {
      globalOrdersState = globalOrdersState.map((o) =>
        o.id === target.orderId ? { ...o, fittingStatus: "ready", completedQty: target.qty } : o
      );
    }
    notifyAll();
  };

  // Assign order in Lanyard Hub and auto-register voucher in contractor's ledger
  const assignLabourAndRegisterVoucher = (
    orderId: string,
    contractorId: string,
    contractorName: string,
    dateCode: string,
    allocations?: FittingAllocation[]
  ) => {
    const order = globalOrdersState.find((o) => o.id === orderId);
    if (!order) return;

    // Update order
    globalOrdersState = globalOrdersState.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        goneForFitting: true,
        fittingContractorId: contractorId,
        fittingContractorName: contractorName,
        fittingDate: dateCode,
        fittingAllocations: allocations,
        fittingStatus: contractorId === "wof" ? "ready" : "in_fitting",
        completedQty: contractorId === "wof" ? o.qty : 0,
      };
    });

    // Auto-create voucher in contractor's ledger
    const targetContractors =
      contractorId === "mix" && allocations && allocations.length > 0
        ? allocations.map((a) => ({ id: a.contractorId, qty: a.qty }))
        : [{ id: contractorId, qty: order.qty }];

    targetContractors.forEach(({ id, qty }) => {
      if (id === "wof") return;
      const list = globalVouchersState[id] || [];
      const nextNo = list.length > 0 ? Math.max(...list.map((v) => v.voucherNo)) + 1 : 1;

      // Auto-determine hardware codes based on size
      const fittingItem1 = order.size === "12mm" ? "dst-v" : "ph";
      const fittingItem2 = order.size === "12mm" ? "12mm-j" : "16mm-j";

      const newV: LabourFittingVoucher = {
        id: `v-${id}-${Date.now()}-${order.sn}`,
        voucherNo: nextNo,
        date: order.date,
        particulars: order.mplName,
        mplSize: order.size,
        qty: qty,
        fittingItem1,
        qty1: qty,
        fittingItem2,
        qty2: qty,
        status: "in_fitting",
        orderId: order.id,
      };

      globalVouchersState = {
        ...globalVouchersState,
        [id]: [newV, ...list],
      };
    });

    notifyAll();
  };

  return {
    orders,
    setOrders,
    contractors: INITIAL_FITTING_CONTRACTORS,
    vouchersMap,
    sentMap,
    selectedContractorId,
    setSelectedContractorId,
    addOrder,
    addFittingVoucher,
    addSentItem,
    markVoucherComplete,
    assignLabourAndRegisterVoucher,
  };
}
