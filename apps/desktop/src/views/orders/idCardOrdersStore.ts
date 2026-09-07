import { useState, useEffect } from "react";

export type IDCardCategory = "Student" | "Staff" | "Other";
export type IDCardFileFormat = "doc" | "excel" | "hard copy";

export interface IDCardOrderEntry {
  id: string;
  sn: number;
  date: string; // e.g. "25.08.26"
  client: string; // e.g. "svm kotra", "vps (kotra)"
  cardCategory: IDCardCategory; // strictly separate orders for Student vs Staff
  workQtyDisplay: string; // e.g. "15 student", "8 staff"
  totalQty: number; // numeric computed total
  sentForPrint: boolean; // true
  printOperator: string; // strictly "Kamal Sir" (In-house printing desk)
  fileLocation: IDCardFileFormat; // strictly single format: "doc" | "excel" | "hard copy" (no PDF, no combinations)
  status: "kamal" | "ready" | "done" | "ready (1 pending he)";
  holderLanyardStatus?: string; // e.g. "available he", "only card hi", "green printed"
  remarks?: string;
}

export function parseIDCQuantity(qtyStr: string): number {
  if (!qtyStr || !qtyStr.trim()) return 0;
  const nums = qtyStr.match(/\d+/g);
  if (!nums || nums.length === 0) {
    if (qtyStr.toLowerCase().includes("hard copy") || qtyStr.toLowerCase().includes("card")) return 1;
    return 0;
  }
  return nums.reduce((sum, n) => sum + parseInt(n, 10), 0);
}

export const SEED_IDCARD_ORDERS: IDCardOrderEntry[] = [
  {
    id: "idc-1434",
    sn: 1434,
    date: "25.08.26",
    client: "svm kotra",
    cardCategory: "Student",
    workQtyDisplay: "15 student",
    totalQty: 15,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1435",
    sn: 1435,
    date: "25.08.26",
    client: "svm chuna bhatti",
    cardCategory: "Student",
    workQtyDisplay: "3 student",
    totalQty: 3,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1436-stu",
    sn: 1436,
    date: "25.08.26",
    client: "svm bhagmugalia",
    cardCategory: "Student",
    workQtyDisplay: "12 student",
    totalQty: 12,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "ready (1 pending he)",
    holderLanyardStatus: "available he",
    remarks: "1 pending verification",
  },
  {
    id: "idc-1436-stf",
    sn: 1437,
    date: "25.08.26",
    client: "svm bhagmugalia (Staff)",
    cardCategory: "Staff",
    workQtyDisplay: "1 staff",
    totalQty: 1,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1438",
    sn: 1438,
    date: "04.09.26",
    client: "blue bird",
    cardCategory: "Student",
    workQtyDisplay: "12 student",
    totalQty: 12,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1453",
    sn: 1453,
    date: "29.08.26",
    client: "dpsps",
    cardCategory: "Student",
    workQtyDisplay: "1 student",
    totalQty: 1,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "hard copy",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "Hard copy sample provided",
  },
  {
    id: "idc-1455",
    sn: 1455,
    date: "29.08.26",
    client: "govt subash excel",
    cardCategory: "Student",
    workQtyDisplay: "1377 student",
    totalQty: 1377,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "bulk school batch",
  },
  {
    id: "idc-1457",
    sn: 1457,
    date: "31.08.26",
    client: "krishna heights (kurawar)",
    cardCategory: "Student",
    workQtyDisplay: "163 student",
    totalQty: 163,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1458-stu",
    sn: 1458,
    date: "31.08.26",
    client: "kv brgh",
    cardCategory: "Student",
    workQtyDisplay: "49 student",
    totalQty: 49,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "Includes health cards",
  },
  {
    id: "idc-1458-stf",
    sn: 1459,
    date: "31.08.26",
    client: "kv brgh (Staff)",
    cardCategory: "Staff",
    workQtyDisplay: "15 staff",
    totalQty: 15,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "Staff & faculty batch",
  },
  {
    id: "idc-1460",
    sn: 1460,
    date: "31.08.26",
    client: "canyon bhopal",
    cardCategory: "Student",
    workQtyDisplay: "5 student",
    totalQty: 5,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "only card hi",
    remarks: "Without lanyard",
  },
  {
    id: "idc-1461",
    sn: 1461,
    date: "31.08.26",
    client: "glory children",
    cardCategory: "Student",
    workQtyDisplay: "332 student",
    totalQty: 332,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1462",
    sn: 1462,
    date: "31.08.26",
    client: "sun rise jamunia",
    cardCategory: "Student",
    workQtyDisplay: "12 student",
    totalQty: 12,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "only card hi",
    remarks: "",
  },
  {
    id: "idc-1463",
    sn: 1463,
    date: "31.08.26",
    client: "uttamchand issrani sindhu",
    cardCategory: "Student",
    workQtyDisplay: "194 student",
    totalQty: 194,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1464",
    sn: 1464,
    date: "31.08.26",
    client: "sjc",
    cardCategory: "Student",
    workQtyDisplay: "17 student",
    totalQty: 17,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1468-stu",
    sn: 1468,
    date: "31.08.26",
    client: "vatsalya vidisha",
    cardCategory: "Student",
    workQtyDisplay: "118 student",
    totalQty: 118,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1468-stf",
    sn: 1469,
    date: "31.08.26",
    client: "vatsalya vidisha (Staff)",
    cardCategory: "Staff",
    workQtyDisplay: "8 staff",
    totalQty: 8,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "Staff batch",
  },
  {
    id: "idc-1470",
    sn: 1470,
    date: "01.09.26",
    client: "svm (neelbad)",
    cardCategory: "Student",
    workQtyDisplay: "1 student",
    totalQty: 1,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "hard copy",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1471",
    sn: 1471,
    date: "01.09.26",
    client: "nhlps",
    cardCategory: "Student",
    workQtyDisplay: "2 student",
    totalQty: 2,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1472",
    sn: 1472,
    date: "01.09.26",
    client: "sadhu vaswani",
    cardCategory: "Student",
    workQtyDisplay: "1 student",
    totalQty: 1,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1474-stu",
    sn: 1474,
    date: "01.09.26",
    client: "bhopal girls school",
    cardCategory: "Student",
    workQtyDisplay: "34 student",
    totalQty: 34,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "4th class students",
  },
  {
    id: "idc-1474-stf",
    sn: 1475,
    date: "01.09.26",
    client: "bhopal girls school (Staff)",
    cardCategory: "Staff",
    workQtyDisplay: "7 staff",
    totalQty: 7,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "Staff members",
  },
  {
    id: "idc-1476-stu",
    sn: 1476,
    date: "01.09.26",
    client: "at shahani",
    cardCategory: "Student",
    workQtyDisplay: "12 student",
    totalQty: 12,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1476-stf",
    sn: 1477,
    date: "01.09.26",
    client: "at shahani (Staff)",
    cardCategory: "Staff",
    workQtyDisplay: "3 staff",
    totalQty: 3,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1478",
    sn: 1478,
    date: "01.09.26",
    client: "green fields",
    cardCategory: "Student",
    workQtyDisplay: "9 student",
    totalQty: 9,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "green printed",
    remarks: "green printed lanyards",
  },
  {
    id: "idc-1479",
    sn: 1479,
    date: "02.09.26",
    client: "sunil soni-narmada",
    cardCategory: "Student",
    workQtyDisplay: "295 student",
    totalQty: 295,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1480",
    sn: 1480,
    date: "02.09.26",
    client: "saket shishu ranjan",
    cardCategory: "Student",
    workQtyDisplay: "583 student",
    totalQty: 583,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1481",
    sn: 1481,
    date: "02.09.26",
    client: "vcd",
    cardCategory: "Student",
    workQtyDisplay: "1 student",
    totalQty: 1,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1482-stu",
    sn: 1482,
    date: "02.09.26",
    client: "vps (kotra)",
    cardCategory: "Student",
    workQtyDisplay: "14 student",
    totalQty: 14,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1482-stf",
    sn: 1483,
    date: "02.09.26",
    client: "vps (kotra) - Staff",
    cardCategory: "Staff",
    workQtyDisplay: "21 staff",
    totalQty: 21,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "Staff cards",
  },
  {
    id: "idc-1484-stu",
    sn: 1484,
    date: "02.09.26",
    client: "vps (nehru nagar)",
    cardCategory: "Student",
    workQtyDisplay: "17 student",
    totalQty: 17,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1484-stf",
    sn: 1485,
    date: "02.09.26",
    client: "vps (nehru nagar) - Staff",
    cardCategory: "Staff",
    workQtyDisplay: "16 staff",
    totalQty: 16,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "Staff cards",
  },
  {
    id: "idc-1486",
    sn: 1486,
    date: "02.09.26",
    client: "st mary",
    cardCategory: "Student",
    workQtyDisplay: "10 student",
    totalQty: 10,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1487",
    sn: 1487,
    date: "02.09.26",
    client: "mjwa",
    cardCategory: "Student",
    workQtyDisplay: "1 student",
    totalQty: 1,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "hard copy",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1488-stu",
    sn: 1488,
    date: "03.09.26",
    client: "ips seoni",
    cardCategory: "Student",
    workQtyDisplay: "50 student",
    totalQty: 50,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1488-stf",
    sn: 1489,
    date: "03.09.26",
    client: "ips seoni (Staff)",
    cardCategory: "Staff",
    workQtyDisplay: "1 staff",
    totalQty: 1,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1490",
    sn: 1490,
    date: "03.09.26",
    client: "techno india group",
    cardCategory: "Student",
    workQtyDisplay: "562 student",
    totalQty: 562,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1491",
    sn: 1491,
    date: "03.09.26",
    client: "dhakad",
    cardCategory: "Student",
    workQtyDisplay: "497 student",
    totalQty: 497,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1492",
    sn: 1492,
    date: "04.09.26",
    client: "red rose lambakheda",
    cardCategory: "Student",
    workQtyDisplay: "707 student",
    totalQty: 707,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "Large student batch",
  },
  {
    id: "idc-1493",
    sn: 1493,
    date: "04.09.26",
    client: "red rose lambakheda (Staff)",
    cardCategory: "Staff",
    workQtyDisplay: "67 staff",
    totalQty: 67,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "Staff card batch",
  },
  {
    id: "idc-1494",
    sn: 1494,
    date: "04.09.26",
    client: "eternity",
    cardCategory: "Student",
    workQtyDisplay: "168 student",
    totalQty: 168,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1495",
    sn: 1495,
    date: "04.09.26",
    client: "eternity (Staff)",
    cardCategory: "Staff",
    workQtyDisplay: "4 staff",
    totalQty: 4,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1496",
    sn: 1496,
    date: "05.09.26",
    client: "tsvs",
    cardCategory: "Student",
    workQtyDisplay: "21 student",
    totalQty: 21,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
];

const STORAGE_KEY = "officefloww_idcard_orders_v4";

function loadInitialOrders(): IDCardOrderEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load ID card orders from storage", e);
  }
  return [...SEED_IDCARD_ORDERS];
}

let globalIDCardOrders: IDCardOrderEntry[] = loadInitialOrders();
const listeners = new Set<() => void>();

function notifyAll() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalIDCardOrders));
  } catch (e) {
    console.error("Failed to persist ID card orders", e);
  }
  listeners.forEach((fn) => fn());
}

export function useIDCardStore() {
  const [orders, setOrdersState] = useState<IDCardOrderEntry[]>(globalIDCardOrders);

  useEffect(() => {
    const update = () => {
      setOrdersState([...globalIDCardOrders]);
    };
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const setOrders = (updater: IDCardOrderEntry[] | ((prev: IDCardOrderEntry[]) => IDCardOrderEntry[])) => {
    if (typeof updater === "function") {
      globalIDCardOrders = updater(globalIDCardOrders);
    } else {
      globalIDCardOrders = updater;
    }
    notifyAll();
  };

  const addOrder = (entry: Omit<IDCardOrderEntry, "id">) => {
    const newEntry: IDCardOrderEntry = {
      ...entry,
      id: `idc-${entry.sn}-${Date.now()}`,
    };
    globalIDCardOrders = [newEntry, ...globalIDCardOrders];
    notifyAll();
    return newEntry;
  };

  const updateOrderStatus = (id: string, newStatus: IDCardOrderEntry["status"]) => {
    globalIDCardOrders = globalIDCardOrders.map((o) => (o.id === id ? { ...o, status: newStatus } : o));
    notifyAll();
  };

  const cycleStatus = (id: string) => {
    globalIDCardOrders = globalIDCardOrders.map((o) => {
      if (o.id !== id) return o;
      let nextStatus: IDCardOrderEntry["status"] = "kamal";
      if (o.status === "kamal") nextStatus = "ready";
      else if (o.status === "ready" || o.status === "ready (1 pending he)") nextStatus = "done";
      else if (o.status === "done") nextStatus = "kamal";
      return { ...o, status: nextStatus };
    });
    notifyAll();
  };

  const updateOrder = (id: string, updates: Partial<IDCardOrderEntry>) => {
    globalIDCardOrders = globalIDCardOrders.map((o) => (o.id === id ? { ...o, ...updates } : o));
    notifyAll();
  };

  const toggleSentForPrint = (id: string) => {
    globalIDCardOrders = globalIDCardOrders.map((o) => {
      if (o.id !== id) return o;
      const nextSent = !o.sentForPrint;
      return {
        ...o,
        sentForPrint: nextSent,
        status: nextSent ? "kamal" : "kamal",
      };
    });
    notifyAll();
  };

  return {
    orders,
    setOrders,
    addOrder,
    updateOrder,
    updateOrderStatus,
    cycleStatus,
    toggleSentForPrint,
  };
}
