import React, { useState, useMemo, useEffect } from "react";
import { Client, Order, OrderPriority, OrderStatus, ClientContact } from "@officefloww/api-types";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { PriorityBadge, OrderStatusBadge } from "../../design-system/components/Badge";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";
import { Modal, Drawer } from "../../design-system/components/Modal";
import { Input } from "../../design-system/components/Input";
import { Tabs } from "../../design-system/components/Tabs";
import { useToast } from "../../design-system/components/Toast";
import { getInitials, getAvatarColor } from "../../design-system/components/UserAvatar";
import { NewClientModal } from "./NewClientModal";
import { OrdersWorkspaceView } from "../orders/OrdersWorkspaceView";

export interface ClientsViewProps {
  clients: Client[];
  orders?: Order[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  initialClientId?: string | null;
  onSelectClient?: (clientId: string) => void;
  onSelectOrder?: (orderId: string) => void;
  onNewOrder?: () => void;
}

interface ClientLogItem {
  id: string;
  actorName: string;
  actorRole: string;
  actionType: "dispatch" | "invoice" | "proof" | "note";
  actionText: string;
  targetText?: string;
  timeAgo: string;
  timestamp: string;
}

interface ClientInvoiceItem {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  issueDate: string;
  dueDate: string;
  total: number;
  paid: number;
  status: "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";
}

interface AssignedCrewMember {
  initials: string;
  name: string;
  role: string;
  color: string;
}

// Production Assigned Crew by Client
const CLIENT_CREW_POOL: AssignedCrewMember[][] = [
  [
    { initials: "RS", name: "Rohan Sharma", role: "Plant Admin", color: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" },
    { initials: "PN", name: "Priya Nair", role: "QA Colorimeter Operator", color: "linear-gradient(135deg, #10b981 0%, #047857 100%)" },
    { initials: "DK", name: "Dinesh Kumar", role: "Heat Transfer Worker", color: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)" },
    { initials: "RL", name: "Ramesh Stitching Unit", role: "Lanyard Stitching Labour", color: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" },
  ],
  [
    { initials: "SY", name: "Sunil Yadav", role: "Precision Weighing Worker", color: "linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)" },
    { initials: "PN", name: "Priya Nair", role: "QA Lead", color: "linear-gradient(135deg, #10b981 0%, #047857 100%)" },
    { initials: "SR", name: "Sneha Roy", role: "Sublimation Studio Operator", color: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)" },
    { initials: "RS", name: "Rohan Sharma", role: "Admin", color: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" },
  ],
  [
    { initials: "SR", name: "Sneha Roy", role: "Design Specialist", color: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)" },
    { initials: "DK", name: "Dinesh Kumar", role: "Press Operator", color: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)" },
    { initials: "RL", name: "Ramesh Unit", role: "Packaging Labour", color: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" },
  ],
  [
    { initials: "PN", name: "Priya Nair", role: "QA Colorimeter Operator", color: "linear-gradient(135deg, #10b981 0%, #047857 100%)" },
    { initials: "SY", name: "Sunil Yadav", role: "Packing Worker", color: "linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)" },
    { initials: "RS", name: "Rohan Sharma", role: "Production Head", color: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" },
  ],
  [
    { initials: "DK", name: "Dinesh Kumar", role: "Thermal Press Worker", color: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)" },
    { initials: "SR", name: "Sneha Roy", role: "Artwork Inspector", color: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)" },
    { initials: "RL", name: "Ramesh Unit", role: "Lanyard Labour Team", color: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" },
  ],
];

// Initial Realistic Production Logs
const INITIAL_LOGS: Record<string, ClientLogItem[]> = {
  default: [
    {
      id: "log-1",
      actorName: "Rajesh Sharma",
      actorRole: "Production Head",
      actionType: "dispatch",
      actionText: "completed batch QA & dispatched 5,000 RFID PVC Cards batch 1 for",
      targetText: "Campus Student Identification Project",
      timeAgo: "22 minutes ago",
      timestamp: "2026-09-03T10:40:00Z",
    },
    {
      id: "log-2",
      actorName: "Ananya Roy",
      actorRole: "Finance & Accounts",
      actionType: "invoice",
      actionText: "generated GST Tax Invoice for",
      targetText: "₹1,82,500 Direct Settlement",
      timeAgo: "1 hour ago",
      timestamp: "2026-09-03T09:40:00Z",
    },
    {
      id: "log-3",
      actorName: "Vikram Singh",
      actorRole: "Design Studio",
      actionType: "proof",
      actionText: "uploaded updated artwork proof for",
      targetText: "Multicolor Sublimation Satin Lanyards",
      timeAgo: "3 hours ago",
      timestamp: "2026-09-03T07:40:00Z",
    },
    {
      id: "log-4",
      actorName: "Sophia Williams",
      actorRole: "Managing Director",
      actionType: "note",
      actionText: "approved production contract for",
      targetText: "Annual Student RFID Smartcard Retainer",
      timeAgo: "Yesterday",
      timestamp: "2026-09-02T14:20:00Z",
    },
    {
      id: "log-5",
      actorName: "Arthur Taylor",
      actorRole: "Senior Estimator",
      actionType: "note",
      actionText: "logged client review on sample cards:",
      targetText: "Approved frosted finish with magnetic stripe",
      timeAgo: "Yesterday",
      timestamp: "2026-09-02T11:00:00Z",
    },
  ],
};

const INITIAL_INVOICES: Record<string, ClientInvoiceItem[]> = {
  default: [
    {
      id: "inv-01",
      invoiceNumber: "Invoice #42",
      orderNumber: "Smartcard Batch",
      issueDate: "2026-08-20",
      dueDate: "2026-09-20",
      total: 182500,
      paid: 120000,
      status: "PARTIAL",
    },
    {
      id: "inv-02",
      invoiceNumber: "Invoice #28",
      orderNumber: "Lanyard Sublimation",
      issueDate: "2026-07-15",
      dueDate: "2026-08-15",
      total: 350000,
      paid: 350000,
      status: "PAID",
    },
    {
      id: "inv-03",
      invoiceNumber: "Invoice #11",
      orderNumber: "Frosted ID Badges",
      issueDate: "2026-05-10",
      dueDate: "2026-06-10",
      total: 245000,
      paid: 245000,
      status: "PAID",
    },
  ],
};

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  orders = [],
  loading,
  error,
  onRefresh,
  initialClientId,
  onSelectClient,
  onSelectOrder,
  onNewOrder,
}) => {
  const { success } = useToast();

  // Selected client for details view (defaults to null so directory list is shown first)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId || null);

  useEffect(() => {
    if (initialClientId !== undefined) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId]);

  // Active Tab inside Client Management View (Tabs at top header: Overview, Orders, Logs)
  const [clientTab, setClientTab] = useState<"overview" | "orders" | "logs">("overview");

  // Directory search filter
  const [search, setSearch] = useState("");
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  // Interactive Drawers
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderProduct, setNewOrderProduct] = useState("Custom Printed Lanyards (15mm)");
  const [newOrderQty, setNewOrderQty] = useState("1500");
  const [newOrderValue, setNewOrderValue] = useState("152000");
  const [newOrderDelivery, setNewOrderDelivery] = useState("2026-09-15");

  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [newInvoiceAmount, setNewInvoiceAmount] = useState("182500");
  const [newInvoiceDue, setNewInvoiceDue] = useState("2026-09-30");

  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRole, setNewContactRole] = useState("");

  // Quick log state
  const [quickLogType, setQuickLogType] = useState<"note" | "dispatch" | "proof" | "invoice">("note");
  const [quickLogText, setQuickLogText] = useState("");

  // Dynamic state stores
  const [logsMap, setLogsMap] = useState<Record<string, ClientLogItem[]>>(INITIAL_LOGS);
  const [invoicesMap, setInvoicesMap] = useState<Record<string, ClientInvoiceItem[]>>(INITIAL_INVOICES);
  const [extraContactsMap, setExtraContactsMap] = useState<Record<string, ClientContact[]>>({});

  // Active Client
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  // Client logs
  const clientLogs = useMemo(() => {
    if (!selectedClient) return [];
    return logsMap[selectedClient.id] || logsMap.default || [];
  }, [logsMap, selectedClient]);

  // Client invoices
  const clientInvoices = useMemo(() => {
    if (!selectedClient) return [];
    return invoicesMap[selectedClient.id] || invoicesMap.default || [];
  }, [invoicesMap, selectedClient]);

  // Client orders
  const clientOrders = useMemo(() => {
    if (!selectedClient) return [];
    return orders.filter((o) => o.client_id === selectedClient.id);
  }, [orders, selectedClient]);

  // Synchronized Client Orders (synced with Orders workspace registry + backend orders)
  const syncedOrders = useMemo(() => {
    if (!selectedClient) return [];
    const clientNameLower = selectedClient.organization_name.toLowerCase();

    // 1. Backend orders matching this client
    const backendMatches = orders
      .filter((o) => {
        if (o.client_id === selectedClient.id) return true;
        const c = clients.find((cl) => cl.id === o.client_id);
        return (
          c?.organization_name?.toLowerCase().includes(clientNameLower) ||
          clientNameLower.includes(c?.organization_name?.toLowerCase() || "")
        );
      })
      .map((ord) => ({
        id: ord.id,
        orderNumber: ord.order_number,
        product: ord.notes || "High-Volume Production Run",
        itemsOrdered: ["Lanyard", "Card"],
        quantity: 1000,
        deliveryDate: ord.promised_delivery_date
          ? new Date(ord.promised_delivery_date).toLocaleDateString("en-IN")
          : "Flexible",
        totalAmount: Number(ord.total_amount || 0),
        priority: ord.priority,
        status: ord.status,
      }));

    // 2. Orders workspace registry
    const registry = [
      { id: "ord-1", client: "St. Xavier's High School", orderNumber: "ORD-2026-0001", product: "Multicolor Lanyards (15mm)", itemsOrdered: ["Lanyard", "Card"], quantity: 2000, deliveryDate: "05 Sep 2026", totalAmount: 182500, priority: OrderPriority.HIGH, status: OrderStatus.IN_PRODUCTION },
      { id: "ord-2", client: "BHEL Township Admin", orderNumber: "ORD-2026-0002", product: "Single Color Lanyards (10mm)", itemsOrdered: ["Lanyard", "Card"], quantity: 500, deliveryDate: "07 Sep 2026", totalAmount: 49560, priority: OrderPriority.NORMAL, status: OrderStatus.IN_PRODUCTION },
      { id: "ord-3", client: "Northwind Coffee", orderNumber: "ORD-2026-0003", product: "Custom Printed Lanyards", itemsOrdered: ["Lanyard"], quantity: 1500, deliveryDate: "02 Sep 2026", totalAmount: 152000, priority: OrderPriority.HIGH, status: OrderStatus.IN_PRODUCTION },
      { id: "ord-4", client: "AIIMS Bhopal", orderNumber: "ORD-2026-0004", product: "Medical Staff ID Cards", itemsOrdered: ["Card"], quantity: 350, deliveryDate: "04 Sep 2026", totalAmount: 52500, priority: OrderPriority.URGENT, status: OrderStatus.PENDING_PREPRESS },
      { id: "ord-5", client: "Govt Engineering College Bhopal", orderNumber: "ORD-2026-0005", product: "PVC Identity Cards", itemsOrdered: ["Card"], quantity: 800, deliveryDate: "03 Sep 2026", totalAmount: 96000, priority: OrderPriority.NORMAL, status: OrderStatus.IN_PRODUCTION },
      { id: "ord-6", client: "Reliance Retail - Bhopal", orderNumber: "ORD-2026-0006", product: "Staff Access Cards", itemsOrdered: ["Card"], quantity: 200, deliveryDate: "10 Sep 2026", totalAmount: 38000, priority: OrderPriority.NORMAL, status: OrderStatus.DRAFT },
      { id: "ord-7", client: "NIT Bhopal", orderNumber: "ORD-2026-0007", product: "Faculty + Student Lanyards", itemsOrdered: ["Lanyard"], quantity: 1200, deliveryDate: "08 Sep 2026", totalAmount: 144000, priority: OrderPriority.HIGH, status: OrderStatus.IN_PRODUCTION },
      { id: "ord-8", client: "Maulana Azad Hospital", orderNumber: "ORD-2026-0008", product: "Staff ID Lanyards", itemsOrdered: ["Lanyard", "Card"], quantity: 600, deliveryDate: "12 Sep 2026", totalAmount: 78000, priority: OrderPriority.NORMAL, status: OrderStatus.IN_PRODUCTION },
      { id: "ord-9", client: "Smart City Council", orderNumber: "ORD-2026-0009", product: "Event Delegate Smart Cards", itemsOrdered: ["Card"], quantity: 450, deliveryDate: "06 Sep 2026", totalAmount: 63000, priority: OrderPriority.URGENT, status: OrderStatus.IN_PRODUCTION },
      { id: "ord-10", client: "Indraprastha School", orderNumber: "ORD-2026-0010", product: "School ID Lanyards", itemsOrdered: ["Lanyard"], quantity: 1000, deliveryDate: "01 Sep 2026", totalAmount: 115000, priority: OrderPriority.NORMAL, status: OrderStatus.COMPLETED },
      { id: "ord-11", client: "MP Secretariat", orderNumber: "ORD-2026-0011", product: "Embossed Security ID Cards", itemsOrdered: ["Card"], quantity: 150, deliveryDate: "09 Sep 2026", totalAmount: 42000, priority: OrderPriority.HIGH, status: OrderStatus.IN_PRODUCTION },
      { id: "ord-12", client: "Bansal Group Schools", orderNumber: "ORD-2026-0012", product: "Lanyards (12mm Blue/White)", itemsOrdered: ["Lanyard"], quantity: 3000, deliveryDate: "06 Sep 2026", totalAmount: 285000, priority: OrderPriority.HIGH, status: OrderStatus.IN_PRODUCTION },
    ];

    const matchedRegistry = registry.filter(
      (r) =>
        r.client.toLowerCase().includes(clientNameLower) ||
        clientNameLower.includes(r.client.toLowerCase())
    );

    if (backendMatches.length > 0) return backendMatches;
    if (matchedRegistry.length > 0) return matchedRegistry;

    return [
      {
        id: `ord-mock-${selectedClient.id}`,
        orderNumber: "ORD-2026-0001",
        product: "Campus Identification Smartcards & Lanyards",
        itemsOrdered: ["Lanyard", "Card"],
        quantity: 2500,
        deliveryDate: "15 Sep 2026",
        totalAmount: 182500,
        priority: OrderPriority.HIGH,
        status: OrderStatus.IN_PRODUCTION,
      },
    ];
  }, [selectedClient, orders, clients]);


  // Client contacts
  const clientContacts = useMemo(() => {
    if (!selectedClient) return [];
    const base = selectedClient.contacts || [];
    const extra = extraContactsMap[selectedClient.id] || [];
    if (base.length === 0 && extra.length === 0) {
      return [
        {
          id: "cnt-seed-1",
          client_id: selectedClient.id,
          name: "Rajesh Sharma",
          email: "procurement@institution.org",
          phone: "+91 98260 12345",
          designation: "Director of Procurement & Administration",
          is_primary: true,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2026-09-01T00:00:00Z",
        },
        {
          id: "cnt-seed-2",
          client_id: selectedClient.id,
          name: "Ananya Roy",
          email: "accounts@institution.org",
          phone: "+91 98260 67890",
          designation: "Accounts & Billing Controller",
          is_primary: false,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2026-09-01T00:00:00Z",
        },
        {
          id: "cnt-seed-3",
          client_id: selectedClient.id,
          name: "Vikram Singh",
          email: "operations@institution.org",
          phone: "+91 98260 99881",
          designation: "Head of Security Systems & Access",
          is_primary: false,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2026-09-01T00:00:00Z",
        },
      ];
    }
    return [...base, ...extra];
  }, [selectedClient, extraContactsMap]);

  // Computed Financials
  const metrics = useMemo(() => {
    if (!selectedClient) return { revenue: 3850000, outstanding: 425000, avgDays: 13, activeProjects: 2 };
    const totalRev = clientOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 3850000;
    const unpaid = Math.round(totalRev * 0.14) || 425000;
    return {
      revenue: totalRev,
      outstanding: unpaid,
      avgDays: 13,
      activeProjects: Math.max(1, clientOrders.filter((o) => o.status !== OrderStatus.COMPLETED).length || 2),
    };
  }, [selectedClient, clientOrders]);

  // One-click copy handler with toast feedback
  const handleCopy = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    success("Copied to Clipboard", `${label} "${text}" copied.`);
  };

  // Handlers
  const handlePostQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogText.trim() || !selectedClient) return;

    const actionTextMap = {
      note: "logged production update:",
      dispatch: "dispatched material consignment for",
      proof: "uploaded digital proof approval for",
      invoice: "sent commercial ledger reminder for",
    };

    const newItem: ClientLogItem = {
      id: `log-${Date.now()}`,
      actorName: "Rohan Sharma",
      actorRole: "Plant Administrator",
      actionType: quickLogType,
      actionText: actionTextMap[quickLogType],
      targetText: quickLogText.trim(),
      timeAgo: "Just now",
      timestamp: new Date().toISOString(),
    };

    setLogsMap((prev) => ({
      ...prev,
      [selectedClient.id]: [newItem, ...(prev[selectedClient.id] || prev.default || [])],
    }));

    setQuickLogText("");
    success("Log Recorded", "Timeline entry added to client logs.");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const newItem: ClientLogItem = {
      id: `log-${Date.now()}`,
      actorName: "Rohan Sharma",
      actorRole: "Client Desk",
      actionType: "note",
      actionText: `dispatched client notice "${messageSubject}":`,
      targetText: messageBody.slice(0, 50) + (messageBody.length > 50 ? "..." : ""),
      timeAgo: "Just now",
      timestamp: new Date().toISOString(),
    };

    setLogsMap((prev) => ({
      ...prev,
      [selectedClient.id]: [newItem, ...(prev[selectedClient.id] || prev.default || [])],
    }));

    setShowMessageModal(false);
    setMessageSubject("");
    setMessageBody("");
    success("Message Dispatched", `Sent to ${selectedClient.organization_name} contacts.`);
  };

  const handleCreateNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const amt = parseFloat(newInvoiceAmount) || 182500;
    const invNumber = `Invoice #${Math.floor(Math.random() * 900 + 100)}`;

    const newInv: ClientInvoiceItem = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber,
      orderNumber: "Production Batch",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: newInvoiceDue,
      total: amt,
      paid: 0,
      status: "PENDING",
    };

    setInvoicesMap((prev) => ({
      ...prev,
      [selectedClient.id]: [newInv, ...(prev[selectedClient.id] || prev.default || [])],
    }));

    const newItem: ClientLogItem = {
      id: `log-${Date.now()}`,
      actorName: "Rohan Sharma",
      actorRole: "Accounts",
      actionType: "invoice",
      actionText: "generated tax invoice",
      targetText: `${invNumber} for ₹${amt.toLocaleString("en-IN")}`,
      timeAgo: "Just now",
      timestamp: new Date().toISOString(),
    };

    setLogsMap((prev) => ({
      ...prev,
      [selectedClient.id]: [newItem, ...(prev[selectedClient.id] || prev.default || [])],
    }));

    setShowNewInvoiceModal(false);
    success("Tax Invoice Drafted", `${invNumber} generated.`);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newContactName) return;

    const contact: ClientContact = {
      id: `cnt-${Date.now()}`,
      client_id: selectedClient.id,
      name: newContactName,
      email: newContactEmail || "contact@client.com",
      phone: newContactPhone || "+91 98000 00000",
      designation: newContactRole || "Decision Maker",
      is_primary: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setExtraContactsMap((prev) => ({
      ...prev,
      [selectedClient.id]: [...(prev[selectedClient.id] || []), contact],
    }));

    setShowNewContactModal(false);
    setNewContactName("");
    setNewContactEmail("");
    setNewContactPhone("");
    setNewContactRole("");
    success("Contact Registered", `${contact.name} added to client directory.`);
  };

  // Filtered clients for directory list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase();
      return (
        !q ||
        c.organization_name.toLowerCase().includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    });
  }, [clients, search]);

  if (loading && clients.length === 0) {
    return <LoadingState message="Loading client accounts and institutional dossiers..." />;
  }

  if (error && clients.length === 0) {
    return <ErrorState message={error.message} onRetry={onRefresh} />;
  }

  // ----------------------------------------------------
  // RENDER 1: CLIENT PROFILE PAGE (With Tabs Moved to Header, Contacts Inside Overview)
  // ----------------------------------------------------
  if (selectedClient) {
    const isNorthwind = selectedClient.organization_name.toLowerCase().includes("northwind");
    const clientMeta = isNorthwind
      ? "Enterprise Security & NFC Smartcard Systems • Owner Sophia Williams • Net 30 Commercial Terms"
      : `${selectedClient.notes || "Educational & Institutional Client"} • GSTIN: ${selectedClient.tax_identifier || "23AAAAA0000A1Z5"} • Net 30 Commercial Terms`;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          boxSizing: "border-box",
          overflowY: "auto",
          backgroundColor: "#070a10",
          backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 138, 115, 0.04), transparent)",
          color: "#e2e8f0",
        }}
      >
        {/* TOP HEADER BAR: Back Link + TABS MOVED TO TOP AS HEADER + Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 28px",
            backgroundColor: "rgba(14, 18, 28, 0.95)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            gap: "20px",
            flexWrap: "wrap",
            position: "sticky",
            top: 0,
            zIndex: 30,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Left: Back button & Tabs Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <Button
              variant="secondary"
              size="sm"
              icon="chevron-left"
              onClick={() => {
                setSelectedClientId(null);
                onSelectClient?.("");
              }}
            >
              All Clients
            </Button>

            {/* TABS IN HEADER (Overview, Orders, Logs) - Invoices merged with Overview */}
            <Tabs
              variant="pill"
              size="md"
              activeTab={clientTab}
              onChange={(id) => setClientTab(id as any)}
              tabs={[
                { id: "overview", label: "Overview" },
                { id: "orders", label: "Orders", badge: syncedOrders.length },
                { id: "logs", label: "Logs", badge: clientLogs.length },
              ]}
            />
          </div>

          {/* Right: Switcher & Quick Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              value={selectedClient.id}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                onSelectClient?.(e.target.value);
              }}
              style={{
                height: "var(--input-height, 36px)",
                padding: "0 10px",
                borderRadius: "var(--radius-sm, 4px)",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} style={{ backgroundColor: "#131722", color: "#fff" }}>
                  {c.organization_name}
                </option>
              ))}
            </select>

            <Button
              variant="secondary"
              size="sm"
              icon="message-square"
              onClick={() => setShowMessageModal(true)}
            >
              Message
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon="plus"
              onClick={() => {
                if (onNewOrder) onNewOrder();
                else setShowNewOrderModal(true);
              }}
            >
              New Order
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon="billing"
              onClick={() => setShowNewInvoiceModal(true)}
            >
              New Invoice
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            padding: "20px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* 1. OVERVIEW TAB: 2-Column Layout (Left Workspace + Right Profile Card) */}
          {clientTab === "overview" && (
            <div
              style={{
                display: "flex",
                gap: "24px",
                width: "100%",
                boxSizing: "border-box",
                alignItems: "flex-start",
              }}
            >
              {/* Left Side: KPIs + Contacts + Merged Invoices */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "22px" }}>
                
                {/* Full-width KPI Metrics Strip (Only rendered on Overview tab!) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    backgroundColor: "rgba(18, 23, 35, 0.75)",
                    backdropFilter: "blur(18px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    padding: "18px 22px",
                    gap: "20px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Tile 1: Lifetime Revenue */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderRight: "1px solid rgba(255, 255, 255, 0.07)", paddingRight: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                        Lifetime Revenue
                      </span>
                      <span style={{ fontSize: "10.5px", padding: "1px 6px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontWeight: 700 }}>
                        +18.4% YoY
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>
                      ₹{metrics.revenue.toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      Total cumulative billed orders
                    </span>
                  </div>

                  {/* Tile 2: Outstanding */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderRight: "1px solid rgba(255, 255, 255, 0.07)", paddingRight: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                        Outstanding Dues
                      </span>
                      <span style={{ fontSize: "10.5px", padding: "1px 6px", borderRadius: "10px", backgroundColor: "rgba(255, 138, 115, 0.12)", color: "#ff8a73", fontWeight: 700 }}>
                        Due in 15d
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: "#ff8a73", letterSpacing: "-0.5px" }}>
                      ₹{metrics.outstanding.toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      Active receivables ledger
                    </span>
                  </div>

                  {/* Tile 3: Avg Days to Pay */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderRight: "1px solid rgba(255, 255, 255, 0.07)", paddingRight: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                        Avg Days to Pay
                      </span>
                      <span style={{ fontSize: "10.5px", padding: "1px 6px", borderRadius: "10px", backgroundColor: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", fontWeight: 700 }}>
                        ⚡ Prime Grade
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>
                        {metrics.avgDays}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>days</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      Net 30 benchmark
                    </span>
                  </div>

                  {/* Tile 4: Active Projects */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                        Active Production Jobs
                      </span>
                      <span style={{ fontSize: "10.5px", padding: "1px 6px", borderRadius: "10px", backgroundColor: "rgba(167, 139, 250, 0.12)", color: "#a78bfa", fontWeight: 700 }}>
                        Floor Live
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>
                        {metrics.activeProjects}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>manufacturing runs</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      In printing & encoding queues
                    </span>
                  </div>
                </div>

                {/* Contacts Section */}
                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.75)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    padding: "22px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon name="users" size={16} color="var(--accent-text)" />
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>
                        Contacts ({clientContacts.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewContactModal(true)}
                      style={{
                        height: "34px",
                        padding: "0 14px",
                        borderRadius: "5px",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#fff",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)")}
                    >
                      <span>+</span>
                      <span>Add Contact</span>
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px", width: "100%" }}>
                    {clientContacts.map((cnt) => (
                      <div
                        key={cnt.id}
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.25)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          borderRadius: "8px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background: getAvatarColor(cnt.name),
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "14px",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                              }}
                            >
                              {getInitials(cnt.name)}
                            </div>
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{cnt.name}</div>
                              <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{cnt.designation || "Contact Person"}</div>
                            </div>
                          </div>

                          {cnt.is_primary && (
                            <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 700 }}>
                              PRIMARY
                            </span>
                          )}
                        </div>

                        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
                          <div
                            onClick={(e) => handleCopy(cnt.email, "Email", e)}
                            title="Click to copy email"
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-secondary)", cursor: "pointer", padding: "3px 6px", borderRadius: "4px" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Icon name="mail" size={13} color="#34d399" />
                              <span>{cnt.email}</span>
                            </div>
                            <Icon name="copy" size={12} color="var(--text-muted)" />
                          </div>

                          <div
                            onClick={(e) => handleCopy(cnt.phone || "+91 98260 00000", "Phone", e)}
                            title="Click to copy phone"
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-secondary)", cursor: "pointer", padding: "3px 6px", borderRadius: "4px" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Icon name="phone" size={13} color="#f59e0b" />
                              <span style={{ fontFamily: "var(--font-mono)" }}>{cnt.phone || "+91 98260 00000"}</span>
                            </div>
                            <Icon name="copy" size={12} color="var(--text-muted)" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Merged Tax Invoices & Billing Section (Directly on Overview!) */}
                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.75)",
                    backdropFilter: "blur(18px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    padding: "18px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon name="file-text" size={16} color="var(--accent-text)" />
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                        Tax Invoices & Billing ({clientInvoices.length})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowNewInvoiceModal(true)}
                      style={{
                        height: "32px",
                        padding: "0 14px",
                        borderRadius: "4px",
                        backgroundColor: "#2563eb",
                        backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        border: "1px solid rgba(59, 130, 246, 0.4)",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
                      }}
                    >
                      <span>+</span>
                      <span>Draft Invoice</span>
                    </button>
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(255, 255, 255, 0.07)",
                      borderRadius: "6px",
                      overflow: "hidden",
                      backgroundColor: "rgba(12, 15, 23, 0.6)",
                    }}
                  >
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                          <th style={{ padding: "12px 16px" }}>Tax Invoice #</th>
                          <th style={{ padding: "12px 16px" }}>Date Issued</th>
                          <th style={{ padding: "12px 16px" }}>Payment Due</th>
                          <th style={{ padding: "12px 16px", textAlign: "right" }}>Total Amount</th>
                          <th style={{ padding: "12px 16px", textAlign: "right" }}>Paid</th>
                          <th style={{ padding: "12px 16px", textAlign: "center" }}>Status</th>
                          <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientInvoices.map((inv) => (
                          <tr
                            key={inv.id}
                            style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", transition: "background-color 0.15s ease" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <td style={{ padding: "12px 16px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-mono)" }}>
                              {inv.invoiceNumber}
                            </td>
                            <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{inv.issueDate}</td>
                            <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{inv.dueDate}</td>
                            <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                              ₹{inv.total.toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#10b981" }}>
                              ₹{inv.paid.toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "center" }}>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontSize: "10.5px",
                                  fontWeight: 700,
                                  backgroundColor:
                                    inv.status === "PAID"
                                      ? "rgba(16, 185, 129, 0.15)"
                                      : inv.status === "PENDING"
                                      ? "rgba(255, 138, 115, 0.15)"
                                      : "rgba(56, 189, 248, 0.15)",
                                  color:
                                    inv.status === "PAID"
                                      ? "#10b981"
                                      : inv.status === "PENDING"
                                      ? "var(--accent-text)"
                                      : "#38bdf8",
                                  border:
                                    inv.status === "PAID"
                                      ? "1px solid rgba(16, 185, 129, 0.3)"
                                      : "1px solid var(--accent-border)",
                                }}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => success("PDF Downloaded", `${inv.invoiceNumber} saved to Downloads.`)}
                                style={{
                                  background: "rgba(255, 255, 255, 0.05)",
                                  border: "1px solid rgba(255, 255, 255, 0.12)",
                                  borderRadius: "4px",
                                  padding: "4px 10px",
                                  color: "var(--text-secondary)",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                }}
                              >
                                Download PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Side: Clean Profile Card (Strictly on Overview Tab Only!) */}
              <div
                style={{
                  width: "320px",
                  flexShrink: 0,
                  backgroundColor: "rgba(18, 23, 35, 0.8)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
                }}
              >
                {/* Avatar & Organization Identity */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "14px",
                      background: isNorthwind
                        ? "linear-gradient(135deg, #d97706 0%, #78350f 100%)"
                        : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      border: "2px solid rgba(255, 255, 255, 0.18)",
                      boxShadow: "0 6px 18px rgba(0, 0, 0, 0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      fontWeight: 800,
                      color: "#ffffff",
                    }}
                  >
                    {isNorthwind ? "🏢" : selectedClient.organization_name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.3px" }}>
                      {selectedClient.organization_name}
                    </h2>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", lineHeight: 1.3 }}>
                      {isNorthwind ? "Enterprise Security & NFC Smartcard Systems" : (selectedClient.notes || "Commercial Printing Client")}
                    </div>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "2px 9px",
                      borderRadius: "14px",
                      backgroundColor: "rgba(16, 185, 129, 0.14)",
                      border: "1px solid rgba(16, 185, 129, 0.35)",
                      color: "#34d399",
                      fontSize: "10.5px",
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                    Active Account
                  </span>
                </div>

                {/* Quick Actions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(true)}
                    style={{
                      height: "32px",
                      padding: "0 10px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#fff",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Icon name="message-square" size={12} color="var(--text-muted)" />
                    <span>Message</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onNewOrder) onNewOrder();
                      else setShowNewOrderModal(true);
                    }}
                    style={{
                      height: "32px",
                      padding: "0 10px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 138, 115, 0.15)",
                      border: "1px solid var(--accent-border)",
                      color: "var(--accent-text)",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Icon name="plus" size={12} />
                    <span>New Order</span>
                  </button>
                </div>

                {/* Divider */}
                <div style={{ height: "1px", backgroundColor: "rgba(255, 255, 255, 0.07)" }} />

                {/* Profile Details Only (Clean, no credit deficit or extraneous metrics) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)" }}>
                    Profile Details
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Primary Contact</span>
                    <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#fff" }}>
                      {isNorthwind ? "Sophia Williams" : (selectedClient.contact_person || "Primary Contact")} {isNorthwind ? "(Owner & MD)" : ""}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Email</span>
                    <div
                      onClick={(e) => handleCopy(isNorthwind ? "sophia@northwindcoffee.com" : (selectedClient.email || "contact@client.com"), "Email", e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        padding: "3px 6px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")}
                    >
                      <span style={{ fontSize: "12px", color: "#38bdf8" }}>
                        {isNorthwind ? "sophia@northwindcoffee.com" : (selectedClient.email || "contact@client.com")}
                      </span>
                      <Icon name="copy" size={12} color="var(--text-muted)" />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Phone</span>
                    <div
                      onClick={(e) => handleCopy(isNorthwind ? "+91 98260 11223" : (selectedClient.phone || "+91 98260 00000"), "Phone", e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        padding: "3px 6px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")}
                    >
                      <span style={{ fontSize: "12px", color: "#f59e0b", fontFamily: "var(--font-mono)" }}>
                        {isNorthwind ? "+91 98260 11223" : (selectedClient.phone || "+91 98260 00000")}
                      </span>
                      <Icon name="copy" size={12} color="var(--text-muted)" />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Payment Terms</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#34d399" }}>
                      {isNorthwind ? "Net 30 Days (Direct NEFT/RTGS)" : "Net 30 Days"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>GSTIN / Tax ID</span>
                    <div
                      onClick={(e) => handleCopy(isNorthwind ? "23MWCFE9999N1Z0" : (selectedClient.tax_identifier || "23AACCF9823K1ZM"), "GSTIN", e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        padding: "3px 6px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")}
                    >
                      <span style={{ fontSize: "12px", color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {isNorthwind ? "23MWCFE9999N1Z0" : (selectedClient.tax_identifier || "23AACCF9823K1ZM")}
                      </span>
                      <Icon name="copy" size={12} color="var(--text-muted)" />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Registered Office</span>
                    <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      {isNorthwind ? "42 Roaster's Alley, Old Bhopal, MP 462001" : (selectedClient.billing_address || "Industrial Zone, Bhopal, MP 462023")}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Central Dispatch</span>
                    <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      {isNorthwind ? "Central Warehouse, 10 Bean Depot, MP 462002" : (selectedClient.shipping_address || "Bhopal Central Logistics Works, MP")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* 2. ORDERS TAB (EXACT SAME UI AS ORDERS PAGE, FILTERED FOR THIS CLIENT) */}
            {clientTab === "orders" && (
              <div style={{ width: "100%" }}>
                <OrdersWorkspaceView
                  clients={clients}
                  filterClientName={selectedClient.organization_name}
                  embedded
                  onSelectOrder={onSelectOrder}
                />
              </div>
            )}



            {/* 4. LOGS TAB (RENAMED FROM ACTIVITY, NO CRYPTIC CODES) */}
            {clientTab === "logs" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                {/* Interactive Log Bar */}
                <form
                  onSubmit={handlePostQuickLog}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    backgroundColor: "rgba(18, 23, 35, 0.7)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    padding: "14px 18px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Log Type:</span>
                      {[
                        { id: "note" as const, label: "💬 Note / Call" },
                        { id: "dispatch" as const, label: "📦 Dispatch QA" },
                        { id: "proof" as const, label: "✅ Artwork Proof" },
                        { id: "invoice" as const, label: "💰 Ledger Reminder" },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setQuickLogType(chip.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            border: "1px solid " + (quickLogType === chip.id ? "rgba(255, 138, 115, 0.4)" : "rgba(255, 255, 255, 0.08)"),
                            backgroundColor: quickLogType === chip.id ? "rgba(255, 138, 115, 0.15)" : "transparent",
                            color: quickLogType === chip.id ? "var(--accent-text)" : "var(--text-secondary)",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="text"
                      placeholder="Type a production log, client meeting note, or milestone..."
                      value={quickLogText}
                      onChange={(e) => setQuickLogText(e.target.value)}
                      style={{
                        flex: 1,
                        height: "38px",
                        backgroundColor: "rgba(0, 0, 0, 0.25)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "5px",
                        padding: "0 14px",
                        color: "#fff",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        height: "38px",
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
                        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
                      }}
                    >
                      <Icon name="check" size={13} color="#fff" />
                      <span>Post Log</span>
                    </button>
                  </div>
                </form>

                {/* Logs Timeline List */}
                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.75)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                  }}
                >
                  {clientLogs.map((log, idx) => (
                    <div
                      key={log.id}
                      style={{
                        padding: "16px 22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        borderBottom:
                          idx < clientLogs.length - 1
                            ? "1px solid rgba(255, 255, 255, 0.06)"
                            : "none",
                        transition: "background-color 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: getAvatarColor(log.actorName),
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12.5px",
                            fontWeight: 800,
                            border: "1px solid rgba(255, 255, 255, 0.18)",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.35)",
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(log.actorName)}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{ fontSize: "13.5px", color: "#ffffff", lineHeight: 1.4 }}>
                            <strong style={{ fontWeight: 700 }}>{log.actorName}</strong>{" "}
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", backgroundColor: "rgba(255, 255, 255, 0.06)", padding: "1px 6px", borderRadius: "8px", margin: "0 4px" }}>
                              {log.actorRole}
                            </span>{" "}
                            <span style={{ color: "var(--text-secondary)" }}>{log.actionText}</span>{" "}
                            {log.targetText && (
                              <strong style={{ fontWeight: 600, color: "#60a5fa" }}>{log.targetText}</strong>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }}>
                        {log.timeAgo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

        </div>

        {/* DRAWER 1: MESSAGE */}
        {showMessageModal && (
          <Drawer
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            title="Dispatch Message"
            subtitle={selectedClient.organization_name}
            width={480}
            footer={
              <>
                <Button variant="secondary" size="md" onClick={() => setShowMessageModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={handleSendMessage}>
                  Send Message
                </Button>
              </>
            }
          >
            <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Input
                label="Subject Line"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="e.g. Production dispatch update & QA signoff"
                required
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Message Content</label>
                <textarea
                  rows={5}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your notice or dispatch advice..."
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "4px",
                    color: "#fff",
                    padding: "12px",
                    fontSize: "13px",
                    outline: "none",
                    resize: "vertical",
                  }}
                  required
                />
              </div>
            </form>
          </Drawer>
        )}

        {/* DRAWER 2: NEW INVOICE */}
        {showNewInvoiceModal && (
          <Drawer
            isOpen={showNewInvoiceModal}
            onClose={() => setShowNewInvoiceModal(false)}
            title="Draft GST Tax Invoice"
            subtitle={selectedClient.organization_name}
            width={480}
            footer={
              <>
                <Button variant="secondary" size="md" onClick={() => setShowNewInvoiceModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={handleCreateNewInvoice}>
                  Generate Tax Invoice
                </Button>
              </>
            }
          >
            <form onSubmit={handleCreateNewInvoice} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Input
                label="Invoice Amount (₹)"
                type="number"
                value={newInvoiceAmount}
                onChange={(e) => setNewInvoiceAmount(e.target.value)}
                required
              />
              <Input
                label="Payment Due Date"
                type="date"
                value={newInvoiceDue}
                onChange={(e) => setNewInvoiceDue(e.target.value)}
                required
              />
              <div style={{ padding: "12px", backgroundColor: "rgba(255, 255, 255, 0.03)", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.06)", fontSize: "12px", color: "var(--text-secondary)" }}>
                Tax calculation with CGST 9% and SGST 9% will automatically be generated in client receivables.
              </div>
            </form>
          </Drawer>
        )}

        {/* DRAWER 3: ADD CONTACT */}
        {showNewContactModal && (
          <Drawer
            isOpen={showNewContactModal}
            onClose={() => setShowNewContactModal(false)}
            title="Add New Contact"
            subtitle={selectedClient.organization_name}
            width={460}
            footer={
              <>
                <Button variant="secondary" size="md" onClick={() => setShowNewContactModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={handleAddContact}>
                  Save Contact
                </Button>
              </>
            }
          >
            <form onSubmit={handleAddContact} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Input
                label="Contact Full Name"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                required
              />
              <Input
                label="Designation / Role"
                value={newContactRole}
                onChange={(e) => setNewContactRole(e.target.value)}
                placeholder="e.g. Director of Operations"
              />
              <Input
                label="Email Address"
                type="email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                placeholder="e.g. contact@institution.org"
              />
              <Input
                label="Direct Phone"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                placeholder="e.g. +91 98260 12345"
              />
            </form>
          </Drawer>
        )}

        {/* DRAWER 4: NEW ORDER */}
        {showNewOrderModal && (
          <Drawer
            isOpen={showNewOrderModal}
            onClose={() => setShowNewOrderModal(false)}
            title="New Order"
            subtitle={selectedClient.organization_name}
            width={500}
            footer={
              <>
                <Button variant="secondary" size="md" onClick={() => setShowNewOrderModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setShowNewOrderModal(false);
                    if (onNewOrder) {
                      onNewOrder();
                    } else {
                      success("Order Queued", `Order created for ${selectedClient.organization_name}`);
                    }
                  }}
                >
                  Create Order
                </Button>
              </>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Input
                label="Product / Specification"
                value={newOrderProduct}
                onChange={(e) => setNewOrderProduct(e.target.value)}
                placeholder="e.g. 15mm Multicolor Satin Lanyards"
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Input
                  label="Quantity (pcs)"
                  type="number"
                  value={newOrderQty}
                  onChange={(e) => setNewOrderQty(e.target.value)}
                />
                <Input
                  label="Total Value (₹)"
                  type="number"
                  value={newOrderValue}
                  onChange={(e) => setNewOrderValue(e.target.value)}
                />
              </div>
              <Input
                label="Promised Delivery Date"
                type="date"
                value={newOrderDelivery}
                onChange={(e) => setNewOrderDelivery(e.target.value)}
              />
            </div>
          </Drawer>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER 2: CLIENT DIRECTORY IN LARGER CARDS WITH STACKED CREW & ONE-CLICK COPY
  // ----------------------------------------------------
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
        backgroundColor: "#070a10",
        backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 138, 115, 0.04), transparent)",
        color: "#e2e8f0",
      }}
    >
      {/* TOP HEADER: SEARCH BAR & CONTROLS ON TOP (NO REDUNDANT TITLE) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 28px",
          backgroundColor: "rgba(14, 18, 28, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          gap: "16px",
          flexWrap: "wrap",
          position: "sticky",
          top: 0,
          zIndex: 30,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Left: Organization count badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "var(--radius-sm, 4px)",
              backgroundColor: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
              color: "var(--accent-text)",
              fontSize: "12.5px",
              fontWeight: 700,
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
            <span>{clients.length} Client Organizations</span>
          </div>

          <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
            Showing {filteredClients.length} of {clients.length} accounts
          </span>
        </div>

        {/* Right: Search Bar & New Client Action */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, justifyContent: "flex-end", maxWidth: "600px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "var(--input-height, 36px)",
              boxSizing: "border-box",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "var(--radius-sm, 4px)",
              padding: "0 14px",
              flex: 1,
              maxWidth: "380px",
            }}
          >
            <Icon name="search" size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search clients by name, contact, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          <Button
            variant="primary"
            size="md"
            icon="plus"
            onClick={() => setShowNewClientModal(true)}
          >
            New Client
          </Button>
        </div>
      </div>

      {/* BODY AREA: BIGGER CARDS GRID WITH STACKED CREW & ONE-CLICK COPY */}
      <div style={{ padding: "26px 32px", display: "flex", flexDirection: "column", gap: "24px", width: "100%", boxSizing: "border-box" }}>
        
        {/* CARDS GRID (Bigger Cards: minmax 460px) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))",
            gap: "24px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {filteredClients.map((c, clientIdx) => {
            const isNw = c.organization_name.toLowerCase().includes("northwind");
            const subtitle = isNw
              ? "Enterprise NFC & Smartcard Access Control"
              : c.notes || "Institutional RFID Badges & Security Systems";

            const primaryContact = c.contacts?.[0] || {
              name: "Rajesh Sharma",
              designation: "Procurement Director",
              phone: "+91 98260 12345",
              email: "contact@institution.org",
            };

            const assignedCrew = CLIENT_CREW_POOL[clientIdx % CLIENT_CREW_POOL.length];

            return (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedClientId(c.id);
                  onSelectClient?.(c.id);
                }}
                style={{
                  backgroundColor: "rgba(18, 23, 35, 0.75)",
                  backdropFilter: "blur(18px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "3px",
                  padding: "26px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "rgba(255, 138, 115, 0.4)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Top Row: Avatar (54px) + Organization Name (18px) + Active Badge */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                      style={{
                        width: "54px",
                        height: "54px",
                        borderRadius: "3px",
                        background: isNw
                          ? "linear-gradient(135deg, #d97706 0%, #78350f 100%)"
                          : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        fontWeight: 800,
                        color: "#fff",
                        flexShrink: 0,
                        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
                      }}
                    >
                      {isNw ? "🏢" : c.organization_name.slice(0, 2).toUpperCase()}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.3px" }}>
                        {c.organization_name}
                      </h3>
                      <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                        {subtitle}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "3px 8px",
                      borderRadius: "2px",
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      color: "#34d399",
                      fontSize: "11px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ width: "5px", height: "5px", borderRadius: "1px", backgroundColor: "#10b981" }} />
                    Active
                  </span>
                </div>

                {/* Middle Details Section with One-Click Copy */}
                <div
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.22)",
                    borderRadius: "3px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {/* Contact Name - Click to copy */}
                  <div
                    onClick={(e) => handleCopy(primaryContact.name, "Contact Name", e)}
                    title="Click to copy contact name"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 8px",
                      borderRadius: "2px",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", color: "#ffffff" }}>
                      <Icon name="user" size={14} color="var(--accent-text)" />
                      <span style={{ fontWeight: 700, fontSize: "13.5px" }}>{primaryContact.name}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>({primaryContact.designation || "Primary Contact"})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", fontSize: "11px" }}>
                      <Icon name="copy" size={12} color="var(--text-muted)" />
                      <span>Copy</span>
                    </div>
                  </div>

                  {/* Phone - Click to copy */}
                  <div
                    onClick={(e) => handleCopy(primaryContact.phone || "+91 98260 12345", "Phone Number", e)}
                    title="Click to copy phone number"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 8px",
                      borderRadius: "2px",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", color: "var(--text-secondary)" }}>
                      <Icon name="phone" size={14} color="#f59e0b" />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600 }}>
                        {primaryContact.phone || "+91 98260 12345"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", fontSize: "11px" }}>
                      <Icon name="copy" size={12} color="var(--text-muted)" />
                      <span>Copy</span>
                    </div>
                  </div>

                  {/* Email - Click to copy */}
                  <div
                    onClick={(e) => handleCopy(primaryContact.email || "contact@org.in", "Email Address", e)}
                    title="Click to copy email address"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 8px",
                      borderRadius: "2px",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", color: "var(--text-secondary)" }}>
                      <Icon name="mail" size={14} color="#34d399" />
                      <span style={{ fontSize: "12.5px" }}>{primaryContact.email || "contact@org.in"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", fontSize: "11px" }}>
                      <Icon name="copy" size={12} color="var(--text-muted)" />
                      <span>Copy</span>
                    </div>
                  </div>

                  {/* Worksite / Factory Address */}
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "5px 8px", color: "var(--text-muted)", fontSize: "12px" }}>
                    <Icon name="map-pin" size={14} color="#c084fc" />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.billing_address || "Bhopal Industrial Zone, Sector 2, MP"}
                    </span>
                  </div>
                </div>

                {/* Bottom Card Footer: Stacked User/Labour Profiles in place of Terms */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "6px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  
                  {/* Stacked User Profiles Working on this Client */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {assignedCrew.map((crew, idx) => (
                        <div
                          key={crew.name}
                          title={`${crew.name} (${crew.role})`}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "3px",
                            background: crew.color,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: 800,
                            border: "2px solid #131722",
                            marginLeft: idx === 0 ? 0 : "-8px",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.4)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            zIndex: 5 - idx,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px) scale(1.15)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                        >
                          {crew.initials}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>
                        Assigned Team
                      </span>
                      <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                        {assignedCrew.length} Production Staff
                      </span>
                    </div>
                  </div>

                  {/* Open Workspace Action */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClientId(c.id);
                      onSelectClient?.(c.id);
                    }}
                    style={{
                      height: "34px",
                      padding: "0 16px",
                      borderRadius: "2px",
                      backgroundColor: "rgba(59, 130, 246, 0.12)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      color: "#60a5fa",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2563eb";
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.boxShadow = "0 3px 12px rgba(37, 99, 235, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.12)";
                      e.currentTarget.style.color = "#60a5fa";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span>Open Workspace</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onClientCreated={() => {
          onRefresh();
          setShowNewClientModal(false);
        }}
      />
    </div>
  );
};
