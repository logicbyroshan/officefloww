import React, { useState, useMemo } from "react";
import { Client, Order, OrderPriority, OrderStatus, ClientContact } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { PriorityBadge, OrderStatusBadge } from "../../design-system/components/Badge";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";
import { NewClientModal } from "./NewClientModal";

export interface ClientsViewProps {
  clients: Client[];
  orders?: Order[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onSelectClient?: (clientId: string) => void;
  onSelectOrder?: (orderId: string) => void;
  onNewOrder?: () => void;
}

interface ClientActivityItem {
  id: string;
  actorName: string;
  actorRole: string;
  actionType: "dispatch" | "invoice" | "proof" | "deal" | "note";
  actionText: string;
  targetText?: string;
  timeAgo: string;
  timestamp: string;
}

interface ClientDealItem {
  id: string;
  title: string;
  stage: "Qualified" | "Proposal Sent" | "Negotiation" | "Won";
  value: number;
  probability: number;
  expectedClose: string;
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

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = [
    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    "linear-gradient(135deg, #10b981 0%, #047857 100%)",
    "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
    "linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)",
    "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// Initial Realistic Activities
const INITIAL_ACTIVITIES: Record<string, ClientActivityItem[]> = {
  default: [
    {
      id: "act-1",
      actorName: "Rajesh Sharma",
      actorRole: "Production Head",
      actionType: "dispatch",
      actionText: "completed batch QA & dispatched 5,000 RFID PVC Cards batch 1 for",
      targetText: "Production Run ORD-2026-0001",
      timeAgo: "22 minutes ago",
      timestamp: "2026-09-03T10:40:00Z",
    },
    {
      id: "act-2",
      actorName: "Ananya Roy",
      actorRole: "Finance & Accounts",
      actionType: "invoice",
      actionText: "generated GST Tax Invoice",
      targetText: "INV 2026-044 for ₹1,82,500",
      timeAgo: "1 hour ago",
      timestamp: "2026-09-03T09:40:00Z",
    },
    {
      id: "act-3",
      actorName: "Vikram Singh",
      actorRole: "Design Studio",
      actionType: "proof",
      actionText: "uploaded updated artwork proof",
      targetText: "PRF-LANYARD-01 (Multicolor Sublimation)",
      timeAgo: "3 hours ago",
      timestamp: "2026-09-03T07:40:00Z",
    },
    {
      id: "act-4",
      actorName: "Sophia Williams",
      actorRole: "Managing Director",
      actionType: "deal",
      actionText: "approved commercial quotation for",
      targetText: "Annual Student RFID Smartcard Retainer",
      timeAgo: "Yesterday",
      timestamp: "2026-09-02T14:20:00Z",
    },
    {
      id: "act-5",
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

const INITIAL_DEALS: Record<string, ClientDealItem[]> = {
  default: [
    {
      id: "dl-1",
      title: "Annual Student RFID Smartcards & Lanyards (15,000 units)",
      stage: "Negotiation",
      value: 1850000,
      probability: 85,
      expectedClose: "2026-09-28",
    },
    {
      id: "dl-2",
      title: "Smart NFC Access Control Cards (5,000 Staff Units)",
      stage: "Proposal Sent",
      value: 620000,
      probability: 65,
      expectedClose: "2026-10-15",
    },
    {
      id: "dl-3",
      title: "Custom Frosted Metal Clip Badges & Sublimation Ribbons",
      stage: "Won",
      value: 380000,
      probability: 100,
      expectedClose: "2026-08-14",
    },
  ],
};

const INITIAL_INVOICES: Record<string, ClientInvoiceItem[]> = {
  default: [
    {
      id: "inv-01",
      invoiceNumber: "INV-2026-0042",
      orderNumber: "ORD-2026-0001",
      issueDate: "2026-08-20",
      dueDate: "2026-09-20",
      total: 182500,
      paid: 120000,
      status: "PARTIAL",
    },
    {
      id: "inv-02",
      invoiceNumber: "INV-2026-0028",
      orderNumber: "ORD-2026-0012",
      issueDate: "2026-07-15",
      dueDate: "2026-08-15",
      total: 350000,
      paid: 350000,
      status: "PAID",
    },
    {
      id: "inv-03",
      invoiceNumber: "INV-2026-0011",
      orderNumber: "ORD-2026-0004",
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
  onSelectClient,
  onSelectOrder,
  onNewOrder,
}) => {
  const { success } = useToast();

  // Selected client for details view (defaults to null so directory list is shown first)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Active Tab inside Client Management View
  const [clientTab, setClientTab] = useState<
    "overview" | "contacts" | "deals" | "projects" | "invoices" | "activity"
  >("activity");

  // Directory search filter
  const [search, setSearch] = useState("");
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  // Interactive Modals
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [newInvoiceAmount, setNewInvoiceAmount] = useState("182500");
  const [newInvoiceDue, setNewInvoiceDue] = useState("2026-09-30");

  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRole, setNewContactRole] = useState("");

  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealValue, setNewDealValue] = useState("500000");
  const [newDealStage, setNewDealStage] = useState<"Qualified" | "Proposal Sent" | "Negotiation" | "Won">("Proposal Sent");

  // Quick activity log state
  const [quickActivityType, setQuickActivityType] = useState<"note" | "dispatch" | "proof" | "invoice">("note");
  const [quickActivityText, setQuickActivityText] = useState("");

  // Dynamic state stores
  const [activitiesMap, setActivitiesMap] = useState<Record<string, ClientActivityItem[]>>(INITIAL_ACTIVITIES);
  const [dealsMap, setDealsMap] = useState<Record<string, ClientDealItem[]>>(INITIAL_DEALS);
  const [invoicesMap, setInvoicesMap] = useState<Record<string, ClientInvoiceItem[]>>(INITIAL_INVOICES);
  const [extraContactsMap, setExtraContactsMap] = useState<Record<string, ClientContact[]>>({});

  // Active Client
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  // Client activities
  const clientActivities = useMemo(() => {
    if (!selectedClient) return [];
    return activitiesMap[selectedClient.id] || activitiesMap.default || [];
  }, [activitiesMap, selectedClient]);

  // Client deals
  const clientDeals = useMemo(() => {
    if (!selectedClient) return [];
    return dealsMap[selectedClient.id] || dealsMap.default || [];
  }, [dealsMap, selectedClient]);

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

  // Handlers
  const handlePostQuickActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickActivityText.trim() || !selectedClient) return;

    const actionTextMap = {
      note: "logged production update:",
      dispatch: "dispatched material consignment for",
      proof: "uploaded digital proof approval for",
      invoice: "sent commercial ledger reminder for",
    };

    const newItem: ClientActivityItem = {
      id: `act-${Date.now()}`,
      actorName: "Rohan Sharma",
      actorRole: "Plant Administrator",
      actionType: quickActivityType,
      actionText: actionTextMap[quickActivityType],
      targetText: quickActivityText.trim(),
      timeAgo: "Just now",
      timestamp: new Date().toISOString(),
    };

    setActivitiesMap((prev) => ({
      ...prev,
      [selectedClient.id]: [newItem, ...(prev[selectedClient.id] || prev.default || [])],
    }));

    setQuickActivityText("");
    success("Activity Logged", "New timeline event recorded.");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const newItem: ClientActivityItem = {
      id: `act-${Date.now()}`,
      actorName: "Rohan Sharma",
      actorRole: "Client Desk",
      actionType: "note",
      actionText: `dispatched client notice "${messageSubject}":`,
      targetText: messageBody.slice(0, 50) + (messageBody.length > 50 ? "..." : ""),
      timeAgo: "Just now",
      timestamp: new Date().toISOString(),
    };

    setActivitiesMap((prev) => ({
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
    const invNumber = `INV-2026-${Math.floor(Math.random() * 900 + 100)}`;

    const newInv: ClientInvoiceItem = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber,
      orderNumber: clientOrders[0]?.order_number || "ORD-2026-0001",
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

    const newItem: ClientActivityItem = {
      id: `act-${Date.now()}`,
      actorName: "Rohan Sharma",
      actorRole: "Accounts",
      actionType: "invoice",
      actionText: "generated tax invoice",
      targetText: `${invNumber} for ₹${amt.toLocaleString("en-IN")}`,
      timeAgo: "Just now",
      timestamp: new Date().toISOString(),
    };

    setActivitiesMap((prev) => ({
      ...prev,
      [selectedClient.id]: [newItem, ...(prev[selectedClient.id] || prev.default || [])],
    }));

    setShowNewInvoiceModal(false);
    success("Tax Invoice Drafted", `Invoice ${invNumber} generated.`);
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

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newDealTitle) return;

    const val = parseFloat(newDealValue) || 250000;
    const deal: ClientDealItem = {
      id: `dl-${Date.now()}`,
      title: newDealTitle,
      stage: newDealStage,
      value: val,
      probability: newDealStage === "Won" ? 100 : newDealStage === "Negotiation" ? 80 : 60,
      expectedClose: "2026-10-30",
    };

    setDealsMap((prev) => ({
      ...prev,
      [selectedClient.id]: [deal, ...(prev[selectedClient.id] || prev.default || [])],
    }));

    setShowNewDealModal(false);
    setNewDealTitle("");
    success("Commercial Deal Registered", `Deal "${deal.title}" entered into pipeline.`);
  };

  // Filtered clients for directory list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase();
      return (
        !q ||
        c.organization_name.toLowerCase().includes(q) ||
        c.client_code.toLowerCase().includes(q)
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
  // RENDER: FULL-WIDTH CLIENT MANAGEMENT WORKSPACE
  // ----------------------------------------------------
  if (selectedClient) {
    const isNorthwind = selectedClient.organization_name.toLowerCase().includes("northwind");
    const clientMeta = isNorthwind
      ? "Enterprise Security & NFC Cards • Owner Sophia Williams • Client since 2024-03-11 • Net 30 Commercial Terms"
      : `${selectedClient.notes || "Educational & Institutional Client"} • Code ${selectedClient.client_code} • GSTIN: ${selectedClient.tax_identifier || "23AAAAA0000A1Z5"} • Net 30 Terms`;

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
        {/* Full-width container with responsive side padding */}
        <div
          style={{
            padding: "22px 32px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Top Bar: Back to Directory + Quick Client Switcher */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setSelectedClientId(null)}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "20px",
                color: "var(--text-secondary)",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }}
            >
              <span style={{ fontSize: "14px" }}>‹</span>
              <span>All Clients Directory</span>
              <span style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "10px", padding: "1px 7px", fontSize: "11px" }}>
                {clients.length}
              </span>
            </button>

            {/* Quick Switcher Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Switch Client:</span>
              <select
                value={selectedClient.id}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  onSelectClient?.(e.target.value);
                }}
                style={{
                  height: "32px",
                  padding: "0 10px",
                  borderRadius: "4px",
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
                    {c.organization_name} ({c.client_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Client Header Row (Avatar + Name + Status + Luxury Buttons) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
              backgroundColor: "rgba(18, 23, 35, 0.7)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "20px 24px",
            }}
          >
            {/* Left: Avatar + Title + Subtitle */}
            <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "14px",
                  background: isNorthwind
                    ? "linear-gradient(135deg, #d97706 0%, #78350f 100%)"
                    : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  border: "2px solid rgba(255, 255, 255, 0.18)",
                  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.45)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                {isNorthwind ? "🏢" : selectedClient.organization_name.slice(0, 2).toUpperCase()}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.4px" }}>
                    {selectedClient.organization_name}
                  </h1>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "3px 11px",
                      borderRadius: "14px",
                      backgroundColor: "rgba(16, 185, 129, 0.14)",
                      border: "1px solid rgba(16, 185, 129, 0.35)",
                      color: "#34d399",
                      fontSize: "11.5px",
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                    Active Account
                  </span>
                </div>

                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  {clientMeta}
                </span>
              </div>
            </div>

            {/* Right: 3 Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowMessageModal(true)}
                style={{
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "5px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
                }}
              >
                <Icon name="message-square" size={14} color="var(--text-muted)" />
                <span>Message</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNewOrder) onNewOrder();
                  else setShowNewProjectModal(true);
                }}
                style={{
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "5px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
                }}
              >
                <Icon name="plus" size={14} color="var(--text-muted)" />
                <span>New Project</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewInvoiceModal(true)}
                style={{
                  height: "38px",
                  padding: "0 20px",
                  borderRadius: "5px",
                  backgroundColor: "#2563eb",
                  backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  border: "1px solid rgba(59, 130, 246, 0.4)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  boxShadow: "0 3px 12px rgba(37, 99, 235, 0.4)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundImage = "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)";
                  e.currentTarget.style.boxShadow = "0 5px 16px rgba(37, 99, 235, 0.55)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundImage = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
                  e.currentTarget.style.boxShadow = "0 3px 12px rgba(37, 99, 235, 0.4)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <Icon name="file-text" size={14} color="#fff" />
                <span>New Invoice</span>
              </button>
            </div>
          </div>

          {/* Full-width Luxury KPI Metrics Strip (4 tiles with dividers and trend pills) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              backgroundColor: "rgba(18, 23, 35, 0.75)",
              backdropFilter: "blur(18px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "20px 24px",
              gap: "24px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Tile 1: Lifetime Revenue */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderRight: "1px solid rgba(255, 255, 255, 0.07)", paddingRight: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Lifetime Revenue
                </span>
                <span style={{ fontSize: "10.5px", padding: "1px 6px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontWeight: 700 }}>
                  +18.4% YoY
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "26px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>
                ₹{metrics.revenue.toLocaleString("en-IN")}
              </span>
              <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                Total cumulative billed orders
              </span>
            </div>

            {/* Tile 2: Outstanding */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderRight: "1px solid rgba(255, 255, 255, 0.07)", paddingRight: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Outstanding Dues
                </span>
                <span style={{ fontSize: "10.5px", padding: "1px 6px", borderRadius: "10px", backgroundColor: "rgba(255, 138, 115, 0.12)", color: "#ff8a73", fontWeight: 700 }}>
                  Due in 15d
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "26px", fontWeight: 800, color: "#ff8a73", letterSpacing: "-0.5px" }}>
                ₹{metrics.outstanding.toLocaleString("en-IN")}
              </span>
              <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                Active receivables ledger
              </span>
            </div>

            {/* Tile 3: Avg Days to Pay */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderRight: "1px solid rgba(255, 255, 255, 0.07)", paddingRight: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Avg Days to Pay
                </span>
                <span style={{ fontSize: "10.5px", padding: "1px 6px", borderRadius: "10px", backgroundColor: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", fontWeight: 700 }}>
                  ⚡ Prime Grade
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "26px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>
                  {metrics.avgDays}
                </span>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>days</span>
              </div>
              <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                Fast turnaround (Net 30 benchmark)
              </span>
            </div>

            {/* Tile 4: Active Projects */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Active Production Jobs
                </span>
                <span style={{ fontSize: "10.5px", padding: "1px 6px", borderRadius: "10px", backgroundColor: "rgba(167, 139, 250, 0.12)", color: "#a78bfa", fontWeight: 700 }}>
                  Floor Live
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "26px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>
                  {metrics.activeProjects}
                </span>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>manufacturing runs</span>
              </div>
              <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                In printing & RFID encoding queues
              </span>
            </div>
          </div>

          {/* Full-width Modern Tabs Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "0px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {[
              { id: "overview" as const, label: "Overview", count: undefined },
              { id: "contacts" as const, label: "Contacts", count: clientContacts.length },
              { id: "deals" as const, label: "Deals", count: clientDeals.length },
              { id: "projects" as const, label: "Projects / Orders", count: Math.max(clientOrders.length, 2) },
              { id: "invoices" as const, label: "Invoices", count: clientInvoices.length },
              { id: "activity" as const, label: "Activity", count: clientActivities.length },
            ].map((t) => {
              const isActive = clientTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setClientTab(t.id)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "12px 6px 14px 6px",
                    fontSize: "13.5px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "color 0.15s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: "10px",
                        backgroundColor: isActive ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.06)",
                        color: isActive ? "#60a5fa" : "var(--text-muted)",
                      }}
                    >
                      {t.count}
                    </span>
                  )}
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-1px",
                        left: 0,
                        right: 0,
                        height: "2px",
                        backgroundColor: "#3b82f6",
                        boxShadow: "0 0 8px #3b82f6",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENTS (Full Width) */}
          <div style={{ width: "100%", boxSizing: "border-box" }}>
            
            {/* 1. ACTIVITY TAB */}
            {clientTab === "activity" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                {/* Interactive Activity Log Bar with Type Chips */}
                <form
                  onSubmit={handlePostQuickActivity}
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
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Log Event:</span>
                      {[
                        { id: "note" as const, label: "💬 Note / Call" },
                        { id: "dispatch" as const, label: "📦 Dispatch QA" },
                        { id: "proof" as const, label: "✅ Artwork Proof" },
                        { id: "invoice" as const, label: "💰 Ledger Reminder" },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setQuickActivityType(chip.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            border: "1px solid " + (quickActivityType === chip.id ? "rgba(59, 130, 246, 0.4)" : "rgba(255, 255, 255, 0.08)"),
                            backgroundColor: quickActivityType === chip.id ? "rgba(59, 130, 246, 0.15)" : "transparent",
                            color: quickActivityType === chip.id ? "#60a5fa" : "var(--text-secondary)",
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
                      placeholder="Type a production update, client meeting note, or milestone..."
                      value={quickActivityText}
                      onChange={(e) => setQuickActivityText(e.target.value)}
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
                      <span>Post Update</span>
                    </button>
                  </div>
                </form>

                {/* Activity Timeline List (Full Width) */}
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
                  {clientActivities.map((act, idx) => (
                    <div
                      key={act.id}
                      style={{
                        padding: "16px 22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        borderBottom:
                          idx < clientActivities.length - 1
                            ? "1px solid rgba(255, 255, 255, 0.06)"
                            : "none",
                        transition: "background-color 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Left: Avatar + Details */}
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: getAvatarColor(act.actorName),
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
                          {getInitials(act.actorName)}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{ fontSize: "13.5px", color: "#ffffff", lineHeight: 1.4 }}>
                            <strong style={{ fontWeight: 700 }}>{act.actorName}</strong>{" "}
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", backgroundColor: "rgba(255, 255, 255, 0.06)", padding: "1px 6px", borderRadius: "8px", margin: "0 4px" }}>
                              {act.actorRole}
                            </span>{" "}
                            <span style={{ color: "var(--text-secondary)" }}>{act.actionText}</span>{" "}
                            {act.targetText && (
                              <strong style={{ fontWeight: 600, color: "#60a5fa" }}>{act.targetText}</strong>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Timestamp */}
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }}>
                        {act.timeAgo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. OVERVIEW TAB */}
            {clientTab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px", width: "100%", boxSizing: "border-box" }}>
                {/* Institutional Coordinates */}
                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.75)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon name="briefcase" size={16} color="#60a5fa" />
                    <span>Corporate Dossier & Commercial Terms</span>
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Client Organization Code:</span>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "var(--accent-text)" }}>{selectedClient.client_code}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Tax Identifier / GSTIN:</span>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>{selectedClient.tax_identifier || "23AAAAA0000A1Z5"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Agreed Payment Terms:</span>
                      <strong style={{ color: "#34d399" }}>Net 30 Days (Direct NEFT/RTGS)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Registered Office Address:</span>
                      <span style={{ color: "var(--text-secondary)", textAlign: "right", maxWidth: "340px" }}>
                        {selectedClient.billing_address || "12 Industrial Corridor, Govindpura, Bhopal 462023"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Central Dispatch Works:</span>
                      <span style={{ color: "var(--text-secondary)", textAlign: "right", maxWidth: "340px" }}>
                        {selectedClient.delivery_address || "AIDC Central Factory Hub, Sector 4, Mandideep"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Credit Ledger Health */}
                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.75)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon name="pie-chart" size={16} color="#34d399" />
                    <span>Commercial Credit & Ledger Standing</span>
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Account Standing:</span>
                      <strong style={{ color: "#10b981" }}>A+ Prime Corporate (Punctual Payee)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Credit Limit Authorized:</span>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>₹10,00,000</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Active Credit Utilization:</span>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "#ff8a73" }}>₹{metrics.outstanding.toLocaleString("en-IN")} (42.5%)</strong>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "4px", overflow: "hidden", marginTop: "4px" }}>
                      <div style={{ width: "42.5%", height: "100%", backgroundColor: "#34d399", borderRadius: "4px" }} />
                    </div>

                    <div style={{ marginTop: "8px", padding: "14px", backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", fontWeight: 700, letterSpacing: "0.5px" }}>
                        OFFICEFLOWW CREDIT ADVISORY
                      </span>
                      <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "4px", display: "block", lineHeight: 1.4 }}>
                        Client account has cleared 98% of all prior invoices within the Net 30 window. Approved for high-volume automated production dispatch.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CONTACTS TAB */}
            {clientTab === "contacts" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {clientContacts.length} Key Stakeholders & Authorized Contacts
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewContactModal(true)}
                    style={{
                      height: "36px",
                      padding: "0 16px",
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
                    }}
                  >
                    <span>+</span>
                    <span>Add Stakeholder</span>
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "18px", width: "100%" }}>
                  {clientContacts.map((cnt) => (
                    <div
                      key={cnt.id}
                      style={{
                        backgroundColor: "rgba(18, 23, 35, 0.75)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "8px",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "50%",
                              background: getAvatarColor(cnt.name),
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "15px",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                            }}
                          >
                            {getInitials(cnt.name)}
                          </div>
                          <div>
                            <div style={{ fontSize: "14.5px", fontWeight: 700, color: "#fff" }}>{cnt.name}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{cnt.designation || "Executive Stakeholder"}</div>
                          </div>
                        </div>

                        {cnt.is_primary && (
                          <span style={{ fontSize: "10.5px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 700 }}>
                            PRIMARY
                          </span>
                        )}
                      </div>

                      <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                          <Icon name="mail" size={13} color="var(--text-muted)" />
                          <span>{cnt.email}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                          <Icon name="phone" size={13} color="var(--text-muted)" />
                          <span>{cnt.phone || "+91 98260 00000"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. DEALS TAB */}
            {clientTab === "deals" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Commercial Proposals & Manufacturing Retainers
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewDealModal(true)}
                    style={{
                      height: "36px",
                      padding: "0 16px",
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
                    }}
                  >
                    <span>+</span>
                    <span>New Deal</span>
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.75)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    width: "100%",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                        <th style={{ padding: "16px 20px" }}>Deal Title</th>
                        <th style={{ padding: "16px 20px" }}>Stage</th>
                        <th style={{ padding: "16px 20px", textAlign: "right" }}>Contract Value</th>
                        <th style={{ padding: "16px 20px", textAlign: "right" }}>Win Probability</th>
                        <th style={{ padding: "16px 20px" }}>Target Close</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientDeals.map((dl) => (
                        <tr key={dl.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <td style={{ padding: "16px 20px", fontWeight: 600, color: "#fff" }}>{dl.title}</td>
                          <td style={{ padding: "16px 20px" }}>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: 700,
                                backgroundColor:
                                  dl.stage === "Won"
                                    ? "rgba(16, 185, 129, 0.15)"
                                    : dl.stage === "Negotiation"
                                    ? "rgba(56, 189, 248, 0.15)"
                                    : "rgba(255, 138, 115, 0.15)",
                                color:
                                  dl.stage === "Won"
                                    ? "#10b981"
                                    : dl.stage === "Negotiation"
                                    ? "#38bdf8"
                                    : "var(--accent-text)",
                              }}
                            >
                              {dl.stage}
                            </span>
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#34d399" }}>
                            ₹{dl.value.toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                            {dl.probability}%
                          </td>
                          <td style={{ padding: "16px 20px", color: "var(--text-muted)" }}>{dl.expectedClose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. PROJECTS / ORDERS TAB */}
            {clientTab === "projects" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Production Batches & Manufacturing Runs
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNewOrder) onNewOrder();
                      else setShowNewProjectModal(true);
                    }}
                    style={{
                      height: "36px",
                      padding: "0 16px",
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
                    }}
                  >
                    <span>+</span>
                    <span>New Production Batch</span>
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.75)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    width: "100%",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                        <th style={{ padding: "16px 20px" }}>Order Code</th>
                        <th style={{ padding: "16px 20px" }}>Specifications & Items</th>
                        <th style={{ padding: "16px 20px" }}>Promised Delivery</th>
                        <th style={{ padding: "16px 20px", textAlign: "right" }}>Total Value</th>
                        <th style={{ padding: "16px 20px" }}>Priority</th>
                        <th style={{ padding: "16px 20px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientOrders.length === 0 ? (
                        <tr>
                          <td style={{ padding: "16px 20px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
                            ORD-2026-0001
                          </td>
                          <td style={{ padding: "16px 20px", fontWeight: 600, color: "#fff" }}>
                            5,000 High-Gloss RFID Smart PVC Cards + Multicolor Satin Lanyards
                          </td>
                          <td style={{ padding: "16px 20px", color: "var(--text-secondary)" }}>
                            10 Sep 2026
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#34d399" }}>
                            ₹1,82,500
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            <PriorityBadge priority={OrderPriority.HIGH} />
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            <OrderStatusBadge status={OrderStatus.IN_PRODUCTION} />
                          </td>
                        </tr>
                      ) : (
                        clientOrders.map((ord) => (
                          <tr
                            key={ord.id}
                            onClick={() => onSelectOrder?.(ord.id)}
                            style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", cursor: "pointer" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <td style={{ padding: "16px 20px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
                              {ord.order_number}
                            </td>
                            <td style={{ padding: "16px 20px", fontWeight: 600, color: "#fff" }}>
                              {ord.notes || "Production run batch"}
                            </td>
                            <td style={{ padding: "16px 20px", color: "var(--text-secondary)" }}>
                              {ord.promised_delivery_date ? new Date(ord.promised_delivery_date).toLocaleDateString("en-IN") : "Flexible"}
                            </td>
                            <td style={{ padding: "16px 20px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#34d399" }}>
                              ₹{Number(ord.total_amount || 0).toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "16px 20px" }}>
                              <PriorityBadge priority={ord.priority} />
                            </td>
                            <td style={{ padding: "16px 20px" }}>
                              <OrderStatusBadge status={ord.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. INVOICES TAB */}
            {clientTab === "invoices" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    GST Tax Invoices & Billing Records
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewInvoiceModal(true)}
                    style={{
                      height: "36px",
                      padding: "0 16px",
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
                    }}
                  >
                    <span>+</span>
                    <span>Draft Invoice</span>
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.75)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    width: "100%",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                        <th style={{ padding: "16px 20px" }}>Invoice Code</th>
                        <th style={{ padding: "16px 20px" }}>Date Issued</th>
                        <th style={{ padding: "16px 20px" }}>Payment Due</th>
                        <th style={{ padding: "16px 20px", textAlign: "right" }}>Total Amount</th>
                        <th style={{ padding: "16px 20px", textAlign: "right" }}>Paid</th>
                        <th style={{ padding: "16px 20px" }}>Status</th>
                        <th style={{ padding: "16px 20px", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientInvoices.map((inv) => (
                        <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <td style={{ padding: "16px 20px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                            {inv.invoiceNumber}
                          </td>
                          <td style={{ padding: "16px 20px", color: "var(--text-secondary)" }}>{inv.issueDate}</td>
                          <td style={{ padding: "16px 20px", color: "var(--text-secondary)" }}>{inv.dueDate}</td>
                          <td style={{ padding: "16px 20px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                            ₹{inv.total.toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#10b981" }}>
                            ₹{inv.paid.toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            <span
                              style={{
                                padding: "3px 9px",
                                borderRadius: "4px",
                                fontSize: "11px",
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
                              }}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => success("PDF Downloaded", `Invoice ${inv.invoiceNumber} saved.`)}
                              style={{
                                background: "none",
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
            )}

          </div>
        </div>

        {/* MODAL 1: MESSAGE TO CLIENT */}
        {showMessageModal && (
          <Modal
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            title={`Message to ${selectedClient.organization_name}`}
          >
            <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <Input
                label="Subject Line"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="e.g. Schedule for upcoming RFID batch delivery"
                required
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Message Body</label>
                <textarea
                  rows={4}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your communication to the client account team..."
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.25)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "4px",
                    color: "#fff",
                    padding: "10px",
                    fontSize: "13px",
                    outline: "none",
                    resize: "vertical",
                  }}
                  required
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <Button variant="secondary" size="md" onClick={() => setShowMessageModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit">
                  Dispatch Message
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* MODAL 2: NEW INVOICE */}
        {showNewInvoiceModal && (
          <Modal
            isOpen={showNewInvoiceModal}
            onClose={() => setShowNewInvoiceModal(false)}
            title={`Draft GST Tax Invoice: ${selectedClient.organization_name}`}
          >
            <form onSubmit={handleCreateNewInvoice} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <Button variant="secondary" size="md" onClick={() => setShowNewInvoiceModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit">
                  Generate Tax Invoice
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* MODAL 3: ADD CONTACT */}
        {showNewContactModal && (
          <Modal
            isOpen={showNewContactModal}
            onClose={() => setShowNewContactModal(false)}
            title={`Register Stakeholder: ${selectedClient.organization_name}`}
          >
            <form onSubmit={handleAddContact} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
                placeholder="e.g. Operations Director"
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
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <Button variant="secondary" size="md" onClick={() => setShowNewContactModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit">
                  Save Contact Person
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* MODAL 4: NEW DEAL */}
        {showNewDealModal && (
          <Modal
            isOpen={showNewDealModal}
            onClose={() => setShowNewDealModal(false)}
            title={`Create Deal Proposal: ${selectedClient.organization_name}`}
          >
            <form onSubmit={handleCreateDeal} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <Input
                label="Deal Title"
                value={newDealTitle}
                onChange={(e) => setNewDealTitle(e.target.value)}
                placeholder="e.g. Annual Smartcard Retainer 2026-27"
                required
              />
              <Input
                label="Estimated Value (₹)"
                type="number"
                value={newDealValue}
                onChange={(e) => setNewDealValue(e.target.value)}
                required
              />
              <Select
                label="Pipeline Stage"
                value={newDealStage}
                onChange={(e) => setNewDealStage(e.target.value as any)}
                options={[
                  { value: "Qualified", label: "Qualified Lead" },
                  { value: "Proposal Sent", label: "Proposal Sent" },
                  { value: "Negotiation", label: "Negotiation" },
                  { value: "Won", label: "Closed / Won" },
                ]}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <Button variant="secondary" size="md" onClick={() => setShowNewDealModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit">
                  Save Pipeline Deal
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: FULL CLIENTS DIRECTORY (When < All clients is clicked or on initial visit)
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
      <PageHeader
        title="Client Directory & Institutional Accounts"
        badge={
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--accent-text)",
              backgroundColor: "rgba(255, 138, 115, 0.12)",
              border: "1px solid var(--accent-border)",
              borderRadius: "4px",
              padding: "2px 8px",
            }}
          >
            {clients.length} Client Organizations
          </span>
        }
        primaryAction={{
          label: "New Client",
          icon: "plus",
          onClick: () => setShowNewClientModal(true),
        }}
      />

      <div style={{ padding: "20px 32px", display: "flex", flexDirection: "column", gap: "18px", width: "100%", boxSizing: "border-box" }}>
        {/* KPI Summary Tiles for Directory */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(18, 23, 35, 0.75)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Registered Clients
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: "#fff" }}>
                {clients.length}
              </span>
              <span style={{ fontSize: "12px", color: "#34d399", fontWeight: 600 }}>Active Institutions</span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(18, 23, 35, 0.75)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Contract Book
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: "#ffffff" }}>
                ₹48.25 L
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Order Value</span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(18, 23, 35, 0.75)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Active Floor Batches
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: "#38bdf8" }}>
                8 Runs
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>In Manufacturing</span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(18, 23, 35, 0.75)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Settlement Health
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: "#34d399" }}>
                98.4%
              </span>
              <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>Prime Recovery</span>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "38px",
              boxSizing: "border-box",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "5px",
              padding: "0 14px",
              width: "320px",
            }}
          >
            <Icon name="search" size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by client name, code, GSTIN..."
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

          <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
            Showing {filteredClients.length} of {clients.length} institutions
          </span>
        </div>

        {/* Clients Directory Table (Full Width with Luxury Styling) */}
        <div
          style={{
            backgroundColor: "rgba(18, 23, 35, 0.75)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "8px",
            overflow: "hidden",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                <th style={{ padding: "16px 22px" }}>Client Organization</th>
                <th style={{ padding: "16px 22px" }}>Code</th>
                <th style={{ padding: "16px 22px" }}>Key Stakeholder</th>
                <th style={{ padding: "16px 22px" }}>Tax GSTIN</th>
                <th style={{ padding: "16px 22px" }}>Status</th>
                <th style={{ padding: "16px 22px", textAlign: "right" }}>Workspace Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => {
                const isNw = c.organization_name.toLowerCase().includes("northwind");
                const subtitle = isNw
                  ? "Enterprise NFC & Smartcard Access Control"
                  : c.notes || "Institutional RFID Badges & Security Systems";

                return (
                  <tr
                    key={c.id}
                    onClick={() => {
                      setSelectedClientId(c.id);
                      onSelectClient?.(c.id);
                    }}
                    style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", cursor: "pointer", transition: "background-color 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Organization with Logo Avatar */}
                    <td style={{ padding: "16px 22px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "10px",
                            background: isNw
                              ? "linear-gradient(135deg, #d97706 0%, #78350f 100%)"
                              : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            fontWeight: 800,
                            color: "#fff",
                            flexShrink: 0,
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
                          }}
                        >
                          {isNw ? "🏢" : c.organization_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#fff", fontSize: "14px" }}>{c.organization_name}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{subtitle}</div>
                        </div>
                      </div>
                    </td>

                    {/* Client Code */}
                    <td style={{ padding: "16px 22px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
                      {c.client_code}
                    </td>

                    {/* Primary Contact */}
                    <td style={{ padding: "16px 22px" }}>
                      <div style={{ fontWeight: 600, color: "#e2e8f0" }}>
                        {c.contacts?.[0]?.name || "Authorized Director"}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        {c.contacts?.[0]?.phone || "+91 98260 00000"}
                      </div>
                    </td>

                    {/* Tax ID */}
                    <td style={{ padding: "16px 22px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                      {c.tax_identifier || "23AAAAA0000A1Z5"}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "16px 22px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          color: "#34d399",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                        Active Contract
                      </span>
                    </td>

                    {/* Action Button */}
                    <td style={{ padding: "16px 22px", textAlign: "right" }}>
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
                          borderRadius: "4px",
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
                          e.currentTarget.style.boxShadow = "0 3px 10px rgba(37, 99, 235, 0.4)";
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
