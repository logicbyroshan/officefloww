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
  "Badge",
  "Clear Sleeves",
  "Other",
] as const;

export type StandardItem = (typeof STANDARD_ORDER_ITEMS)[number];

// ─── Labour Contractors & Unconsumed Material Holdings ────────────────────────
export interface LabourMaterialHolding {
  productType: string;
  qtyOnHand: number;
  unit: string;
  sourceOrder: string;
  details: string;
}

export interface LabourContractor {
  id: string;
  name: string;
  specialty: string;
  location: string;
  ratePerPiece: number;
  materialHoldings: LabourMaterialHolding[];
  activeJobsCount: number;
  phone: string;
}

export const LABOUR_CONTRACTORS: LabourContractor[] = [
  {
    id: "lb-1",
    name: "Ramesh Lanyard Stitching Unit",
    specialty: "Lanyard Stitching & Dog Hook Crimping",
    location: "Table 02 (Plant South)",
    ratePerPiece: 2.50,
    materialHoldings: [
      {
        productType: "Lanyard",
        qtyOnHand: 200,
        unit: "pcs",
        sourceOrder: "Previous Order #ORD-982 (Bansal Schools)",
        details: "15mm Satin pre-cut ribbon & nickel dog hooks held in buffer credit"
      }
    ],
    activeJobsCount: 2,
    phone: "+91 98260 11420",
  },
  {
    id: "lb-2",
    name: "Suresh Badge Assembly Workshop",
    specialty: "PVC Round & Magnetic Badge Pressing",
    location: "Pin Press Table 01 (East Wing)",
    ratePerPiece: 1.80,
    materialHoldings: [
      {
        productType: "Badge",
        qtyOnHand: 150,
        unit: "pcs",
        sourceOrder: "Previous Order #ORD-965 (Govt Engg)",
        details: "58mm Metal badge tin shells, pin backs & mylar film rolls in buffer"
      }
    ],
    activeJobsCount: 1,
    phone: "+91 94250 88319",
  },
  {
    id: "lb-3",
    name: "Deepak Card Lamination Unit",
    specialty: "PVC Smartcard Die-Cutting & NFC Foil",
    location: "Lamination Room 3B",
    ratePerPiece: 3.50,
    materialHoldings: [
      {
        productType: "Card",
        qtyOnHand: 80,
        unit: "pcs",
        sourceOrder: "Previous Order #ORD-974 (AIIMS)",
        details: "Blank PVC CR-80 cards with RFID chip inlays & hologram laminate"
      }
    ],
    activeJobsCount: 2,
    phone: "+91 98272 55431",
  },
  {
    id: "lb-4",
    name: "Kailash Heat Sublimation Lab",
    specialty: "Heat Transfer & Double-Sided Sublimation",
    location: "Sublimation Line B",
    ratePerPiece: 2.80,
    materialHoldings: [
      {
        productType: "Lanyard",
        qtyOnHand: 300,
        unit: "pcs",
        sourceOrder: "Previous Order #ORD-979 (NIT Bhopal)",
        details: "20mm Sublimation white satin rolls & heat release tape"
      }
    ],
    activeJobsCount: 1,
    phone: "+91 97551 22890",
  },
  {
    id: "lb-5",
    name: "Amit ID Finishing & Sleeves Unit",
    specialty: "Transparent Vinyl Pouch & ID Clip Sealing",
    location: "Finishing Floor West (Station 4)",
    ratePerPiece: 1.50,
    materialHoldings: [
      {
        productType: "Clear Sleeves",
        qtyOnHand: 250,
        unit: "pcs",
        sourceOrder: "Previous Order #ORD-961 (Indraprastha)",
        details: "Heavy vinyl sleeves & plastic strap clips in unconsumed buffer credit"
      }
    ],
    activeJobsCount: 1,
    phone: "+91 99814 33712",
  },
  {
    id: "lb-6",
    name: "Shyam Screen Print Workshop",
    specialty: "Screen Printing & Fabric Stamping",
    location: "Screen Table 04",
    ratePerPiece: 2.10,
    materialHoldings: [
      {
        productType: "Lanyard",
        qtyOnHand: 120,
        unit: "pcs",
        sourceOrder: "Previous Order #ORD-953 (Maulana Azad)",
        details: "12mm Navy blue tape & metallic screen print ink buffer"
      }
    ],
    activeJobsCount: 0,
    phone: "+91 98263 77419",
  },
];

export interface AssignedWorker {
  name: string;
  role: string;
  type: "LABOUR" | "STAFF";
  contractorId?: string;
}

export interface OrderRecord {
  internalId: string;
  client: string;
  product: string; // Description (unified single text)
  itemOrdered: string; // One single product per order
  itemsOrdered?: string[];
  qty: number;
  assignedTo?: AssignedWorker[]; // Assigned Labour Contractor
  orderDate: string;
  deliveryDate: string;
  notes?: string;
  status?: string;
}

export const INITIAL_ORDERS: OrderRecord[] = [
  {
    internalId: "ord-1",
    client: "St. Xavier's High School",
    product: "Multicolor Lanyards (15mm) — Triple color blue/white/red satin",
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
    product: "Single Color Lanyards (10mm) — Navy blue polyester with ID pouch",
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
    product: "Custom Printed Premium Lanyards — Red/white double color print",
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
    product: "Medical Staff ID Cards — PVC laminated, NFC chip & photo embed",
    itemOrdered: "Card",
    itemsOrdered: ["Card"],
    qty: 350,
    assignedTo: [
      { name: "Deepak Card Lamination Unit", role: "Card Lamination & Foil", type: "LABOUR", contractorId: "lb-3" },
    ],
    orderDate: "29 Aug 2026",
    deliveryDate: "04 Sep 2026",
  },
  {
    internalId: "ord-5",
    client: "Govt Engineering College Bhopal",
    product: "PVC Round Badges (58mm) — Metal pin back & high-gloss film",
    itemOrdered: "Badge",
    itemsOrdered: ["Badge"],
    qty: 800,
    assignedTo: [
      { name: "Suresh Badge Assembly Workshop", role: "Pin & Film Badge Labour", type: "LABOUR", contractorId: "lb-2" },
    ],
    orderDate: "25 Aug 2026",
    deliveryDate: "03 Sep 2026",
  },
  {
    internalId: "ord-6",
    client: "Reliance Retail - Bhopal",
    product: "Staff Access Cards — Barcode & magnetic stripe encoded",
    itemOrdered: "Card",
    itemsOrdered: ["Card"],
    qty: 200,
    assignedTo: [
      { name: "Deepak Card Lamination Unit", role: "Card Lamination & Foil", type: "LABOUR", contractorId: "lb-3" },
    ],
    orderDate: "01 Sep 2026",
    deliveryDate: "10 Sep 2026",
  },
  {
    internalId: "ord-7",
    client: "NIT Bhopal",
    product: "Faculty + Student Lanyards — 20mm full color heat sublimation",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 1200,
    assignedTo: [
      { name: "Kailash Heat Sublimation Lab", role: "Heat Transfer Contractor", type: "LABOUR", contractorId: "lb-4" },
    ],
    orderDate: "31 Aug 2026",
    deliveryDate: "08 Sep 2026",
  },
  {
    internalId: "ord-8",
    client: "Maulana Azad Hospital",
    product: "Staff ID Lanyards — Screen printed navy with heavy dog hook",
    itemOrdered: "Lanyard",
    itemsOrdered: ["Lanyard"],
    qty: 600,
    assignedTo: [
      { name: "Shyam Screen Print Workshop", role: "Screen Printing & Stamping", type: "LABOUR", contractorId: "lb-6" },
    ],
    orderDate: "03 Sep 2026",
    deliveryDate: "12 Sep 2026",
  },
  {
    internalId: "ord-9",
    client: "Smart City Council",
    product: "Event Delegate Badges — Magnetic clip back & rush conference foil",
    itemOrdered: "Badge",
    itemsOrdered: ["Badge"],
    qty: 450,
    assignedTo: [
      { name: "Suresh Badge Assembly Workshop", role: "Pin & Film Badge Labour", type: "LABOUR", contractorId: "lb-2" },
    ],
    orderDate: "02 Sep 2026",
    deliveryDate: "06 Sep 2026",
  },
  {
    internalId: "ord-10",
    client: "Indraprastha School",
    product: "Heavy Duty Clear ID Sleeves — Transparent vinyl pouch with dog clip",
    itemOrdered: "Clear Sleeves",
    itemsOrdered: ["Clear Sleeves"],
    qty: 1000,
    assignedTo: [
      { name: "Amit ID Finishing & Sleeves Unit", role: "Transparent Vinyl Sleeves", type: "LABOUR", contractorId: "lb-5" },
    ],
    orderDate: "20 Aug 2026",
    deliveryDate: "01 Sep 2026",
  },
  {
    internalId: "ord-11",
    client: "MP Secretariat",
    product: "Embossed Security ID Cards — Hologram foil & micro-text overlay",
    itemOrdered: "Card",
    itemsOrdered: ["Card"],
    qty: 150,
    assignedTo: [
      { name: "Deepak Card Lamination Unit", role: "Card Lamination & Foil", type: "LABOUR", contractorId: "lb-3" },
    ],
    orderDate: "01 Sep 2026",
    deliveryDate: "09 Sep 2026",
  },
  {
    internalId: "ord-12",
    client: "Bansal Group Schools",
    product: "Lanyards (12mm Blue/White) — Double-sided screen print line",
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
  const isCard = name.toLowerCase().includes("card");
  const isBadge = name.toLowerCase().includes("badge");
  const isSleeve = name.toLowerCase().includes("sleeve");

  const colors = isLanyard
    ? { bg: "rgba(168, 85, 247, 0.18)", text: "#c084fc", border: "rgba(168, 85, 247, 0.4)" }
    : isCard
    ? { bg: "rgba(56, 189, 248, 0.18)", text: "#38bdf8", border: "rgba(56, 189, 248, 0.4)" }
    : isBadge
    ? { bg: "rgba(244, 114, 182, 0.18)", text: "#f472b6", border: "rgba(244, 114, 182, 0.4)" }
    : isSleeve
    ? { bg: "rgba(251, 191, 36, 0.18)", text: "#fbbf24", border: "rgba(251, 191, 36, 0.4)" }
    : { bg: "rgba(148, 163, 184, 0.18)", text: "#cbd5e1", border: "rgba(148, 163, 184, 0.4)" };

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

  // ─── Streamlined Labour Assignment Drawer States ────────────────────────────
  const [assigningOrder, setAssigningOrder] = useState<OrderRecord | null>(null);
  const [selectedLabourId, setSelectedLabourId] = useState<string | null>(null);
  const [labourSearch, setLabourSearch] = useState("");

  // When opening assign drawer for an order, pre-select current labour contractor if present
  useEffect(() => {
    if (assigningOrder) {
      setLabourSearch("");
      const currentName = assigningOrder.assignedTo?.[0]?.name;
      const matched = LABOUR_CONTRACTORS.find((c) => c.name === currentName);
      setSelectedLabourId(matched ? matched.id : LABOUR_CONTRACTORS[0].id);
    } else {
      setSelectedLabourId(null);
      setLabourSearch("");
    }
  }, [assigningOrder]);

  // Filtered Labour Contractors based on search
  const filteredLabourContractors = useMemo(() => {
    if (!labourSearch.trim()) return LABOUR_CONTRACTORS;
    const q = labourSearch.toLowerCase().trim();
    return LABOUR_CONTRACTORS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.specialty.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.materialHoldings.some((m) => m.productType.toLowerCase().includes(q) || m.details.toLowerCase().includes(q))
    );
  }, [labourSearch]);

  const selectedLabourContractor = useMemo(() => {
    return LABOUR_CONTRACTORS.find((c) => c.id === selectedLabourId) || null;
  }, [selectedLabourId]);

  const handleConfirmLabourAssignment = () => {
    if (!assigningOrder || !selectedLabourContractor) return;
    const targetId = assigningOrder.internalId;

    const assignedWorker: AssignedWorker = {
      name: selectedLabourContractor.name,
      role: selectedLabourContractor.specialty,
      type: "LABOUR",
      contractorId: selectedLabourContractor.id,
    };

    setOrders((prev) =>
      prev.map((o) => {
        if (o.internalId !== targetId) return o;
        return {
          ...o,
          assignedTo: [assignedWorker],
        };
      })
    );

    const orderItem = assigningOrder.itemOrdered || assigningOrder.itemsOrdered?.[0] || "Lanyard";
    const holding = selectedLabourContractor.materialHoldings.find(
      (m) => m.productType.toLowerCase() === orderItem.toLowerCase()
    );
    const bufferHeld = holding ? holding.qtyOnHand : 0;
    const netToIssue = Math.max(0, assigningOrder.qty - bufferHeld);

    success(
      "Labour Assigned",
      `Assigned order to ${selectedLabourContractor.name}. Holds ${bufferHeld} ${orderItem} buffer units, net raw material issue: ${netToIssue.toLocaleString()} pcs.`
    );
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

  const filterOptions = ["ALL", "Lanyard", "Card", "Badge", "Clear Sleeves", "Other"];

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
        if (filterItem === "Other") {
          matchFilter = !["lanyard", "card", "badge", "clear sleeves"].includes(currentItem.toLowerCase());
        } else {
          matchFilter = currentItem.toLowerCase() === filterItem.toLowerCase();
        }
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

    const finalItem = (
      newItemOrdered === "Other" ? (customItemText.trim() || "Other") : newItemOrdered
    ).trim();

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
    setCustomItemText("");
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
          const finalItem =
            editItem === "Other" ? (editCustomItem.trim() || "Other") : editItem;
          return { ...o, itemOrdered: finalItem, itemsOrdered: [finalItem] };
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
      const isStandard = ["Lanyard", "Card", "Badge", "Clear Sleeves"].includes(current);
      if (isStandard) {
        setEditItem(current);
        setEditCustomItem("");
      } else {
        setEditItem("Other");
        setEditCustomItem(current);
      }
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
                      padding: "0 28px 0 12px",
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
                      right: "10px",
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
                  padding: "0 10px",
                  backgroundColor: "rgba(9, 12, 19, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  borderRadius: "var(--radius-sm, 4px)",
                  color:
                    newItemOrdered === "Lanyard"
                      ? "#c084fc"
                      : newItemOrdered === "Card"
                      ? "#38bdf8"
                      : newItemOrdered === "Badge"
                      ? "#f472b6"
                      : newItemOrdered === "Clear Sleeves"
                      ? "#fbbf24"
                      : "#fff",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  outline: "none",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <option value="Lanyard" style={{ backgroundColor: "#0e131f", color: "#c084fc" }}>Lanyard</option>
                <option value="Card" style={{ backgroundColor: "#0e131f", color: "#38bdf8" }}>Card</option>
                <option value="Badge" style={{ backgroundColor: "#0e131f", color: "#f472b6" }}>Badge</option>
                <option value="Clear Sleeves" style={{ backgroundColor: "#0e131f", color: "#fbbf24" }}>Clear Sleeves</option>
                <option value="Other" style={{ backgroundColor: "#0e131f", color: "#e2e8f0" }}>Other (Custom)</option>
              </select>

              {newItemOrdered === "Other" && (
                <input
                  type="text"
                  placeholder="Specify custom product..."
                  value={customItemText}
                  onChange={(e) => setCustomItemText(e.target.value)}
                  autoFocus
                  style={{
                    marginTop: "2px",
                    width: "100%",
                    height: "30px",
                    padding: "0 8px",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid var(--accent-border)",
                    borderRadius: "2px",
                    color: "#fff",
                    fontSize: "11.5px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}
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
                              onChange={(e) => setEditItem(e.target.value)}
                              style={{
                                width: "100%",
                                height: "32px",
                                padding: "0 6px",
                                backgroundColor: "rgba(0,0,0,0.9)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "3px",
                                color: "#fff",
                                fontSize: "12px",
                                outline: "none",
                                cursor: "pointer",
                              }}
                            >
                              <option value="Lanyard" style={{ backgroundColor: "#0e131f", color: "#c084fc" }}>Lanyard</option>
                              <option value="Card" style={{ backgroundColor: "#0e131f", color: "#38bdf8" }}>Card</option>
                              <option value="Badge" style={{ backgroundColor: "#0e131f", color: "#f472b6" }}>Badge</option>
                              <option value="Clear Sleeves" style={{ backgroundColor: "#0e131f", color: "#fbbf24" }}>Clear Sleeves</option>
                              <option value="Other" style={{ backgroundColor: "#0e131f", color: "#e2e8f0" }}>Other...</option>
                            </select>

                            {editItem === "Other" && (
                              <input
                                type="text"
                                placeholder="Custom product..."
                                value={editCustomItem}
                                onChange={(e) => setEditCustomItem(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEdit();
                                  if (e.key === "Escape") setEditingCell(null);
                                }}
                                style={{
                                  width: "100%",
                                  height: "28px",
                                  padding: "0 6px",
                                  backgroundColor: "rgba(0,0,0,0.8)",
                                  border: "1px solid var(--accent-border)",
                                  borderRadius: "2px",
                                  color: "#fff",
                                  fontSize: "11px",
                                  outline: "none",
                                }}
                              />
                            )}

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
                          <span style={{ color: "#e2e8f0", fontWeight: 500, fontSize: "13.5px", lineHeight: 1.45, display: "block" }}>
                            {order.product}
                          </span>
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

                      {/* 5. Assigned (Labour Contractor Avatar + Name + Specialty) */}
                      <td style={{ padding: "14px 18px", borderRight: "1px solid rgba(255, 255, 255, 0.06)" }}>
                        {order.assignedTo && order.assignedTo.length > 0 ? (
                          <div
                            onClick={() => setAssigningOrder(order)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                              padding: "5px 8px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(249, 115, 22, 0.05)",
                              border: "1px solid rgba(249, 115, 22, 0.2)",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(249, 115, 22, 0.14)";
                              e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.45)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(249, 115, 22, 0.05)";
                              e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.2)";
                            }}
                            title="Click to view Labour buffer & reassign"
                          >
                            <div
                              style={{
                                width: "26px",
                                height: "26px",
                                borderRadius: "50%",
                                backgroundColor: "#ea580c",
                                backgroundImage: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "11px",
                                flexShrink: 0,
                                boxShadow: "0 2px 6px rgba(234, 88, 12, 0.35)",
                              }}
                            >
                              {order.assignedTo[0].name.slice(0, 1).toUpperCase()}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "165px" }}>
                                {order.assignedTo[0].name}
                              </span>
                              <span style={{ fontSize: "10.5px", color: "#fdba74", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "170px" }}>
                                {order.assignedTo[0].role}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => setAssigningOrder(order)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(255, 255, 255, 0.02)",
                              border: "1px dashed rgba(249, 115, 22, 0.3)",
                              color: "#fdba74",
                              fontSize: "11.5px",
                              fontWeight: 500,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "var(--accent)";
                              e.currentTarget.style.backgroundColor = "rgba(249, 115, 22, 0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.3)";
                              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
                            }}
                            title="Click to assign Labour Contractor"
                          >
                            <span style={{ fontSize: "13px", color: "var(--accent-text)" }}>+</span>
                            <span>Assign Labour</span>
                          </div>
                        )}
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

                      {/* 8. Action (Assign Labour Button - No Checkbox) */}
                      <td style={{ padding: "16px 16px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => setAssigningOrder(order)}
                          style={{
                            height: "30px",
                            padding: "0 12px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(249, 115, 22, 0.14)",
                            border: "1px solid rgba(249, 115, 22, 0.4)",
                            color: "#fdba74",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(249, 115, 22, 0.28)";
                            e.currentTarget.style.borderColor = "#fb923c";
                            e.currentTarget.style.color = "#ffffff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(249, 115, 22, 0.14)";
                            e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.4)";
                            e.currentTarget.style.color = "#fdba74";
                          }}
                          title="Assign order to Labour Contractor"
                        >
                          <span>🤝</span>
                          <span>Assign</span>
                        </button>
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
              Direct Order Entry panel above · Double-click any cell to edit · Click 'Assign' to delegate order as a task
            </span>
          </div>
        </div>
      </div>

      {/* ─── STREAMLINED LABOUR ASSIGNMENT DRAWER ─────────────────────────── */}
      <Drawer
        isOpen={Boolean(assigningOrder)}
        onClose={() => setAssigningOrder(null)}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>🤝</span>
            <span>Assign Labour Contractor</span>
          </div>
        }
        subtitle={
          assigningOrder
            ? `${assigningOrder.client} · ${assigningOrder.qty.toLocaleString()} pcs`
            : undefined
        }
        width={540}
        footer={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {selectedLabourContractor ? (
                <span>
                  Selected: <strong style={{ color: "#fff" }}>{selectedLabourContractor.name}</strong>
                </span>
              ) : (
                "Select a labour contractor"
              )}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button variant="outline" size="sm" onClick={() => setAssigningOrder(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedLabourContractor}
                onClick={handleConfirmLabourAssignment}
              >
                Confirm & Assign Labour
              </Button>
            </div>
          </div>
        }
      >
        {assigningOrder && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Card 1 (Top): Basic Order Details Only */}
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
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Order Volume</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                  {assigningOrder.qty.toLocaleString()} units
                </div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Target Delivery SLA</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", marginTop: "2px" }}>{assigningOrder.deliveryDate}</div>
              </div>
            </div>

            {/* Search Bar for Labour Contractors */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.6px" }}>
                  Search Labour Contractors
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {filteredLabourContractors.length} available units
                </span>
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Icon name="search" size={14} color="var(--text-muted)" style={{ position: "absolute", left: "12px" }} />
                <input
                  type="text"
                  placeholder="Search labour units by contractor name, specialty, or location..."
                  value={labourSearch}
                  onChange={(e) => setLabourSearch(e.target.value)}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 12px 0 34px",
                    backgroundColor: "rgba(10, 14, 23, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "12.5px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Selected Contractor Material Holding & Balance Calculation Card */}
            {selectedLabourContractor && (() => {
              const orderItem = assigningOrder.itemOrdered || assigningOrder.itemsOrdered?.[0] || "Lanyard";
              const matchingHolding = selectedLabourContractor.materialHoldings.find(
                (m) => m.productType.toLowerCase() === orderItem.toLowerCase()
              );
              const bufferUnits = matchingHolding ? matchingHolding.qtyOnHand : 0;
              const netIssueUnits = Math.max(0, assigningOrder.qty - bufferUnits);
              const estLabourPay = (assigningOrder.qty * selectedLabourContractor.ratePerPiece).toFixed(2);

              return (
                <div
                  style={{
                    backgroundColor: "rgba(249, 115, 22, 0.08)",
                    border: "1px solid rgba(249, 115, 22, 0.35)",
                    borderRadius: "6px",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#fb923c", letterSpacing: "0.6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>📦</span> Raw Material Holding & Net Issue Calculation
                    </span>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      Rate: ₹{selectedLabourContractor.ratePerPiece.toFixed(2)} / pc
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "8px",
                      backgroundColor: "rgba(10, 14, 23, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "5px",
                      padding: "10px 12px",
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Order Needs</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                        {assigningOrder.qty.toLocaleString()} <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)" }}>pcs</span>
                      </div>
                    </div>

                    <div style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "10px", color: "#fdba74", textTransform: "uppercase", fontWeight: 700 }}>Already With Labour</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#fb923c", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                        {bufferUnits.toLocaleString()} <span style={{ fontSize: "10px", fontWeight: 500, color: "#fdba74" }}>pcs held</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "10px", color: "#86efac", textTransform: "uppercase", fontWeight: 700 }}>Net Material To Issue</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#4ade80", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                        {netIssueUnits.toLocaleString()} <span style={{ fontSize: "10px", fontWeight: 500, color: "#86efac" }}>pcs</span>
                      </div>
                    </div>
                  </div>

                  {matchingHolding ? (
                    <div style={{ fontSize: "11px", color: "#e2e8f0", backgroundColor: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color: "#fb923c", fontWeight: 700 }}>Holding Credit:</span> {matchingHolding.qtyOnHand} {matchingHolding.unit} on hand from {matchingHolding.sourceOrder}.
                      <div style={{ color: "var(--text-muted)", fontSize: "10.5px", marginTop: "2px" }}>{matchingHolding.details}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", backgroundColor: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "4px" }}>
                      This contractor currently has 0 buffer stock of {orderItem}. Full {assigningOrder.qty.toLocaleString()} pcs raw material must be issued from warehouse.
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "8px" }}>
                    <span>Estimated Labour Payable:</span>
                    <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
                      ₹{estLabourPay} (strictly on accepted units Q_accepted)
                    </strong>
                  </div>
                </div>
              );
            })()}

            {/* Labour Contractors List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.6px" }}>
                Available Labour Contractors
              </div>

              {filteredLabourContractors.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.02)" }}>
                  No labour contractor matching "{labourSearch}". Try searching by another skill or name.
                </div>
              ) : (
                filteredLabourContractors.map((contractor) => {
                  const isSelected = selectedLabourId === contractor.id;
                  const orderItem = assigningOrder.itemOrdered || "Lanyard";
                  const holding = contractor.materialHoldings.find((m) => m.productType.toLowerCase() === orderItem.toLowerCase());

                  return (
                    <div
                      key={contractor.id}
                      onClick={() => setSelectedLabourId(contractor.id)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "5px",
                        backgroundColor: isSelected ? "rgba(249, 115, 22, 0.14)" : "rgba(255, 255, 255, 0.025)",
                        border: `1px solid ${isSelected ? "rgba(249, 115, 22, 0.5)" : "rgba(255, 255, 255, 0.08)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.025)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            backgroundColor: "#ea580c",
                            backgroundImage: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "13px",
                            flexShrink: 0,
                          }}
                        >
                          {contractor.name.slice(0, 1).toUpperCase()}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {contractor.name}
                            </span>
                            {holding && (
                              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: "rgba(249, 115, 22, 0.2)", color: "#fdba74" }}>
                                Holds {holding.qtyOnHand} {holding.productType}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {contractor.specialty} · {contractor.location} · {contractor.activeJobsCount} active orders
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border: `2px solid ${isSelected ? "#f97316" : "rgba(255,255,255,0.25)"}`,
                          backgroundColor: isSelected ? "#f97316" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: 800,
                          flexShrink: 0,
                          marginLeft: "12px",
                        }}
                      >
                        {isSelected ? "●" : ""}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
