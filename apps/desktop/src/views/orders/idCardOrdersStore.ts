import { useState, useEffect } from "react";

export interface IDCardOrderEntry {
  id: string;
  sn: number;
  date: string; // e.g. "25.08.26"
  client: string; // e.g. "svm kotra", "vps (kotra)"
  workQtyDisplay: string; // e.g. "14 stu + 21 staff", "1377 student"
  totalQty: number; // numeric computed total
  sentForPrint: boolean; // "yes"
  printOperator: string; // strictly "Kamal Sir" (In-house printing desk)
  fileLocation: "doc" | "pdf" | "excel" | "doc + pdf" | "excel and doc" | "hard copy";
  status: "kamal" | "ready" | "done" | "ready (1 pending he)";
  holderLanyardStatus?: string; // e.g. "available he", "only card hi", "green printed"
  remarks?: string; // e.g. "4th staff me student"
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
    workQtyDisplay: "15 stu",
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
    workQtyDisplay: "3 stu",
    totalQty: 3,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1436",
    sn: 1436,
    date: "25.08.26",
    client: "svm bhagmugalia",
    workQtyDisplay: "11+1 stu + 1 staff",
    totalQty: 13,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "ready (1 pending he)",
    holderLanyardStatus: "available he",
    remarks: "1 pending student verification",
  },
  {
    id: "idc-1437",
    sn: 1437,
    date: "04.09.26",
    client: "blue bird",
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
    workQtyDisplay: "hard copy (student)",
    totalQty: 1,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1455",
    sn: 1455,
    date: "29.08.26",
    client: "govt subash excel",
    workQtyDisplay: "1377 student",
    totalQty: 1377,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "pdf",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "bulk school batch",
  },
  {
    id: "idc-1457",
    sn: 1457,
    date: "31.08.26",
    client: "krishna heights (kurawar)",
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
    id: "idc-1458",
    sn: 1458,
    date: "31.08.26",
    client: "kv brgh",
    workQtyDisplay: "42 stu + 4+3 health + 14+1 staff",
    totalQty: 64,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "pdf",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "Includes health cards",
  },
  {
    id: "idc-1459",
    sn: 1459,
    date: "31.08.26",
    client: "canyon bhopal",
    workQtyDisplay: "5 stud",
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
    workQtyDisplay: "332 student",
    totalQty: 332,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1462",
    sn: 1462,
    date: "31.08.26",
    client: "sun rise jamunia",
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
    workQtyDisplay: "194 student",
    totalQty: 194,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1464",
    sn: 1464,
    date: "31.08.26",
    client: "sjc",
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
    id: "idc-1468",
    sn: 1468,
    date: "31.08.26",
    client: "vatsalya vidisha",
    workQtyDisplay: "104+14 stu + 8 staff",
    totalQty: 126,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1470",
    sn: 1470,
    date: "01.09.26",
    client: "svm (neelbad)",
    workQtyDisplay: "hard copy (student)",
    totalQty: 1,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1471",
    sn: 1471,
    date: "01.09.26",
    client: "nhlps",
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
    id: "idc-1474",
    sn: 1474,
    date: "01.09.26",
    client: "bhopal girls school",
    workQtyDisplay: "34 stu + 7 staff (4th)",
    totalQty: 41,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "4th staff me student",
    remarks: "4th staff me student",
  },
  {
    id: "idc-1475",
    sn: 1475,
    date: "01.09.26",
    client: "at shahani",
    workQtyDisplay: "12 stu + 3 staff",
    totalQty: 15,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "done",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1477",
    sn: 1477,
    date: "01.09.26",
    client: "green fields",
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
    id: "idc-1478",
    sn: 1478,
    date: "02.09.26",
    client: "sunil soni-narmada",
    workQtyDisplay: "295",
    totalQty: 295,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "pdf",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1479",
    sn: 1479,
    date: "02.09.26",
    client: "saket shishu ranjan",
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
    id: "idc-1480",
    sn: 1480,
    date: "02.09.26",
    client: "vcd",
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
    id: "idc-1481",
    sn: 1481,
    date: "02.09.26",
    client: "vps (kotra)",
    workQtyDisplay: "14 stu + 21 staff",
    totalQty: 35,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1482",
    sn: 1482,
    date: "02.09.26",
    client: "vps (nehru nagar)",
    workQtyDisplay: "17 stu + 16 staff",
    totalQty: 33,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1483",
    sn: 1483,
    date: "02.09.26",
    client: "st mary",
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
    id: "idc-1484",
    sn: 1484,
    date: "02.09.26",
    client: "mjwa",
    workQtyDisplay: "1 card",
    totalQty: 1,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "pdf",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1485",
    sn: 1485,
    date: "03.09.26",
    client: "ips seoni",
    workQtyDisplay: "50 student + 1 staff",
    totalQty: 51,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc + pdf",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1486",
    sn: 1486,
    date: "03.09.26",
    client: "techno india group",
    workQtyDisplay: "562 student",
    totalQty: 562,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "pdf",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1487",
    sn: 1487,
    date: "03.09.26",
    client: "dhakad",
    workQtyDisplay: "267+230 cards",
    totalQty: 497,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "pdf",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1488",
    sn: 1488,
    date: "04.09.26",
    client: "red rose lambakheda",
    workQtyDisplay: "707 student + 67 staff",
    totalQty: 774,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "excel and doc",
    status: "kamal",
    holderLanyardStatus: "available he",
    remarks: "Large staff + student batch",
  },
  {
    id: "idc-1489",
    sn: 1489,
    date: "04.09.26",
    client: "eternity",
    workQtyDisplay: "168 stu + 4 staff",
    totalQty: 172,
    sentForPrint: true,
    printOperator: "Kamal Sir",
    fileLocation: "doc",
    status: "ready",
    holderLanyardStatus: "available he",
    remarks: "",
  },
  {
    id: "idc-1491",
    sn: 1491,
    date: "05.09.26",
    client: "tsvs",
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

const STORAGE_KEY = "officefloww_idcard_orders_v3";

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
