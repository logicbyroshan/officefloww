import React, { useState, useMemo } from "react";
import { Client, Order, OrderPriority, OrderStatus, ClientContact } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
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
  actorAvatar: string;
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

// Initial Mock Activity entries matching user's reference screenshot
const INITIAL_ACTIVITIES: Record<string, ClientActivityItem[]> = {
  default: [
    {
      id: "act-1",
      actorName: "Wei Chen",
      actorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      actionText: "logged 2h 30m on",
      targetText: "Photo art direction",
      timeAgo: "18 minutes ago",
      timestamp: "2026-09-03T10:40:00Z",
    },
    {
      id: "act-2",
      actorName: "Sophia Williams",
      actorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      actionText: "moved Brand system refresh to",
      targetText: "Negotiation",
      timeAgo: "1 hour ago",
      timestamp: "2026-09-03T09:40:00Z",
    },
    {
      id: "act-3",
      actorName: "Laura Perez",
      actorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      actionText: "sent a payment reminder for",
      targetText: "INV 2026-044",
      timeAgo: "3 hours ago",
      timestamp: "2026-09-03T07:40:00Z",
    },
    {
      id: "act-4",
      actorName: "Emma Wright",
      actorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
      actionText: "completed Label dielines on",
      targetText: "Kaya packaging",
      timeAgo: "Yesterday",
      timestamp: "2026-09-02T14:20:00Z",
    },
    {
      id: "act-5",
      actorName: "Arthur Taylor",
      actorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      actionText: "created proposal",
      targetText: "Design ops audit",
      timeAgo: "Yesterday",
      timestamp: "2026-09-02T11:00:00Z",
    },
  ],
};

const INITIAL_DEALS: Record<string, ClientDealItem[]> = {
  default: [
    {
      id: "dl-1",
      title: "Brand System Refresh & Cafe Signage",
      stage: "Negotiation",
      value: 12400,
      probability: 85,
      expectedClose: "2026-09-28",
    },
    {
      id: "dl-2",
      title: "Smart NFC Member Loyalty Cards (10,000 units)",
      stage: "Proposal Sent",
      value: 38000,
      probability: 65,
      expectedClose: "2026-10-15",
    },
    {
      id: "dl-3",
      title: "Custom Frosted Nitro Cups & Sleeve Packaging",
      stage: "Won",
      value: 7600,
      probability: 100,
      expectedClose: "2026-08-14",
    },
  ],
};

const INITIAL_INVOICES: Record<string, ClientInvoiceItem[]> = {
  default: [
    {
      id: "inv-01",
      invoiceNumber: "INV 2026-044",
      orderNumber: "ORD-2026-0000",
      issueDate: "2026-08-20",
      dueDate: "2026-09-20",
      total: 12400,
      paid: 0,
      status: "PENDING",
    },
    {
      id: "inv-02",
      invoiceNumber: "INV 2026-028",
      orderNumber: "ORD-2026-0012",
      issueDate: "2026-07-15",
      dueDate: "2026-08-15",
      total: 24500,
      paid: 24500,
      status: "PAID",
    },
    {
      id: "inv-03",
      invoiceNumber: "INV 2026-011",
      orderNumber: "ORD-2026-0004",
      issueDate: "2026-05-10",
      dueDate: "2026-06-10",
      total: 21100,
      paid: 21100,
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

  // Selected client for details view (defaults to first client e.g. Northwind Coffee)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    clients.length > 0 ? clients[0].id : null
  );

  // Active Tab inside Client Management View (matching screenshot)
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
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectAmount, setNewProjectAmount] = useState("15000");

  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [newInvoiceAmount, setNewInvoiceAmount] = useState("12400");
  const [newInvoiceDue, setNewInvoiceDue] = useState("2026-09-30");

  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRole, setNewContactRole] = useState("");

  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealValue, setNewDealValue] = useState("25000");
  const [newDealStage, setNewDealStage] = useState<"Qualified" | "Proposal Sent" | "Negotiation" | "Won">("Proposal Sent");

  // Quick activity log state
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
    return [...base, ...extra];
  }, [selectedClient, extraContactsMap]);

  // Computed Financials
  const metrics = useMemo(() => {
    if (!selectedClient) return { revenue: 58000, outstanding: 12400, avgDays: 13, activeProjects: 1 };
    if (selectedClient.organization_name === "Northwind Coffee") {
      return {
        revenue: 58000,
        outstanding: 12400,
        avgDays: 13,
        activeProjects: Math.max(1, clientOrders.length),
      };
    }
    const totalRev = clientOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 85000;
    const unpaid = Math.round(totalRev * 0.22);
    return {
      revenue: totalRev,
      outstanding: unpaid,
      avgDays: 14,
      activeProjects: clientOrders.filter((o) => o.status !== OrderStatus.COMPLETED).length || 1,
    };
  }, [selectedClient, clientOrders]);

  // Handlers
  const handlePostQuickActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickActivityText.trim() || !selectedClient) return;

    const newItem: ClientActivityItem = {
      id: `act-${Date.now()}`,
      actorName: "Rohan Sharma",
      actorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      actionText: "posted update:",
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
      actorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      actionText: `sent message "${messageSubject}":`,
      targetText: messageBody.slice(0, 45) + (messageBody.length > 45 ? "..." : ""),
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

    const amt = parseFloat(newInvoiceAmount) || 12000;
    const invNumber = `INV 2026-0${Math.floor(Math.random() * 90 + 10)}`;

    const newInv: ClientInvoiceItem = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber,
      orderNumber: clientOrders[0]?.order_number || "ORD-2026-0000",
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

    // Post to activity
    const newItem: ClientActivityItem = {
      id: `act-${Date.now()}`,
      actorName: "Rohan Sharma",
      actorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      actionText: "issued tax invoice",
      targetText: `${invNumber} for ₹${amt.toLocaleString("en-IN")}`,
      timeAgo: "Just now",
      timestamp: new Date().toISOString(),
    };

    setActivitiesMap((prev) => ({
      ...prev,
      [selectedClient.id]: [newItem, ...(prev[selectedClient.id] || prev.default || [])],
    }));

    setShowNewInvoiceModal(false);
    success("Invoice Created", `Invoice ${invNumber} generated.`);
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
      designation: newContactRole || "Stakeholder",
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
    success("Contact Added", `${contact.name} added to client directory.`);
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newDealTitle) return;

    const val = parseFloat(newDealValue) || 10000;
    const deal: ClientDealItem = {
      id: `dl-${Date.now()}`,
      title: newDealTitle,
      stage: newDealStage,
      value: val,
      probability: newDealStage === "Won" ? 100 : newDealStage === "Negotiation" ? 80 : 50,
      expectedClose: "2026-10-30",
    };

    setDealsMap((prev) => ({
      ...prev,
      [selectedClient.id]: [deal, ...(prev[selectedClient.id] || prev.default || [])],
    }));

    setShowNewDealModal(false);
    setNewDealTitle("");
    success("Deal Registered", `Pipeline deal "${deal.title}" created.`);
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
  // RENDER: CLIENT MANAGEMENT WORKSPACE (Matching Reference)
  // ----------------------------------------------------
  if (selectedClient) {
    const isNorthwind = selectedClient.organization_name.toLowerCase().includes("northwind");
    const clientMeta = isNorthwind
      ? "Retail & F&B • Owner Sophia Williams • Client since 2024-03-11 • $150/hr default rate"
      : `${selectedClient.notes || "Enterprise Client"} • Code ${selectedClient.client_code} • Client since ${new Date(selectedClient.created_at).toLocaleDateString()}`;

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", backgroundColor: "#0b0f17", color: "#e2e8f0" }}>
        {/* Main Content Area */}
        <div style={{ padding: "24px 36px", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1400px", width: "100%", boxSizing: "border-box", margin: "0 auto" }}>
          
          {/* Back to All Clients link */}
          <div>
            <button
              type="button"
              onClick={() => setSelectedClientId(null)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 0",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <span>‹</span>
              <span>All clients</span>
            </button>
          </div>

          {/* Client Header Row (Avatar + Name + Status + Buttons) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
            {/* Left: Avatar + Title + Subtitle */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
                  backgroundColor: "rgba(255, 138, 115, 0.15)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isNorthwind ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #d97706 0%, #78350f 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                    }}
                  >
                    ☕
                  </div>
                ) : (
                  <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent-text)" }}>
                    {selectedClient.organization_name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.3px" }}>
                    {selectedClient.organization_name}
                  </h1>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      color: "#34d399",
                      fontSize: "11.5px",
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                    Active
                  </span>
                </div>

                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  {clientMeta}
                </span>
              </div>
            </div>

            {/* Right: 3 Action Buttons (Message, New project, New invoice) */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowMessageModal(true)}
                style={{
                  height: "36px",
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
                  justifyContent: "center",
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
                Message
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNewOrder) onNewOrder();
                  else setShowNewProjectModal(true);
                }}
                style={{
                  height: "36px",
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
                  justifyContent: "center",
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
                New project
              </button>

              <button
                type="button"
                onClick={() => setShowNewInvoiceModal(true)}
                style={{
                  height: "36px",
                  padding: "0 18px",
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
                  justifyContent: "center",
                  boxShadow: "0 2px 10px rgba(37, 99, 235, 0.35)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundImage = "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(37, 99, 235, 0.5)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundImage = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(37, 99, 235, 0.35)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                New invoice
              </button>
            </div>
          </div>

          {/* KPI Metrics Strip (4 tiles with vertical dividers) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1px 1.2fr 1px 1fr 1px 1fr",
              backgroundColor: "rgba(18, 23, 35, 0.8)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "6px",
              padding: "16px 24px",
              alignItems: "center",
              gap: "20px",
            }}
          >
            {/* Tile 1: Lifetime Revenue */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Lifetime Revenue
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: "#ffffff" }}>
                ${metrics.revenue.toLocaleString()}
              </span>
            </div>

            {/* Divider 1 */}
            <div style={{ height: "40px", backgroundColor: "rgba(255, 255, 255, 0.08)" }} />

            {/* Tile 2: Outstanding */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Outstanding
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: "#ff8a73" }}>
                ${metrics.outstanding.toLocaleString()}
              </span>
            </div>

            {/* Divider 2 */}
            <div style={{ height: "40px", backgroundColor: "rgba(255, 255, 255, 0.08)" }} />

            {/* Tile 3: Avg Days to Pay */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Avg Days to Pay
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: "#ffffff" }}>
                {metrics.avgDays}
              </span>
            </div>

            {/* Divider 3 */}
            <div style={{ height: "40px", backgroundColor: "rgba(255, 255, 255, 0.08)" }} />

            {/* Tile 4: Active Projects */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Active Projects
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: "#ffffff" }}>
                {metrics.activeProjects}
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Overview, Contacts, Deals, Projects, Invoices, Activity) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "0px",
              marginTop: "4px",
            }}
          >
            {[
              { id: "overview" as const, label: "Overview" },
              { id: "contacts" as const, label: "Contacts" },
              { id: "deals" as const, label: "Deals" },
              { id: "projects" as const, label: "Projects" },
              { id: "invoices" as const, label: "Invoices" },
              { id: "activity" as const, label: "Activity" },
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
                    padding: "10px 4px 12px 4px",
                    fontSize: "13.5px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <span>{t.label}</span>
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-1px",
                        left: 0,
                        right: 0,
                        height: "2px",
                        backgroundColor: "#3b82f6",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENTS */}
          <div style={{ marginTop: "4px" }}>
            
            {/* 1. ACTIVITY TAB (Active in User's Reference Screenshot) */}
            {clientTab === "activity" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Quick Post Note / Log Activity Bar */}
                <form
                  onSubmit={handlePostQuickActivity}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    backgroundColor: "rgba(18, 23, 35, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                  }}
                >
                  <Icon name="message-square" size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Log a client interaction, phone call, or production milestone..."
                    value={quickActivityText}
                    onChange={(e) => setQuickActivityText(e.target.value)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      height: "32px",
                      padding: "0 14px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--accent)";
                      e.currentTarget.style.color = "#090c13";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.color = "#fff";
                    }}
                  >
                    Post Update
                  </button>
                </form>

                {/* Activity Timeline List (matching user screenshot) */}
                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.8)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {clientActivities.map((act, idx) => (
                    <div
                      key={act.id}
                      style={{
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        borderBottom:
                          idx < clientActivities.length - 1
                            ? "1px solid rgba(255, 255, 255, 0.06)"
                            : "none",
                        transition: "background-color 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Actor Avatar with colorful initials badge */}
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "50%",
                          background: getAvatarColor(act.actorName),
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 800,
                          border: "1px solid rgba(255, 255, 255, 0.18)",
                          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(act.actorName)}
                      </div>

                      {/* Content line */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
                        <div style={{ fontSize: "13.5px", color: "#ffffff", lineHeight: 1.4 }}>
                          <strong style={{ fontWeight: 700 }}>{act.actorName}</strong>{" "}
                          <span style={{ color: "var(--text-secondary)" }}>{act.actionText}</span>{" "}
                          {act.targetText && (
                            <strong style={{ fontWeight: 600, color: "#ffffff" }}>{act.targetText}</strong>
                          )}
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {act.timeAgo}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. OVERVIEW TAB */}
            {clientTab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Institutional Profile */}
                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "6px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>
                    Institutional Profile & Accounts
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Client Code:</span>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "var(--accent-text)" }}>{selectedClient.client_code}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Tax Identifier / GSTIN:</span>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>{selectedClient.tax_identifier || "23AAAAA0000A1Z5"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Payment Terms:</span>
                      <strong style={{ color: "#34d399" }}>Net 30 Days</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Currency:</span>
                      <strong style={{ color: "#fff" }}>USD / INR</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Billing Address:</span>
                      <span style={{ color: "var(--text-secondary)", textAlign: "right", maxWidth: "260px" }}>
                        {selectedClient.billing_address || "42 Roaster's Alley, Central Sector"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Delivery Hub:</span>
                      <span style={{ color: "var(--text-secondary)", textAlign: "right", maxWidth: "260px" }}>
                        {selectedClient.delivery_address || "Distribution Depot 10, Warehouse Line"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Health & Credit Limit */}
                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "6px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>
                    Commercial Credit & Account Health
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Account Standing:</span>
                      <strong style={{ color: "#10b981" }}>Prime Grade (Prompt Payee)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Credit Limit Authorized:</span>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>$50,000</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Credit Utilization:</span>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "#ff8a73" }}>$12,400 (24.8%)</strong>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "4px", overflow: "hidden", marginTop: "4px" }}>
                      <div style={{ width: "24.8%", height: "100%", backgroundColor: "#ff8a73", borderRadius: "4px" }} />
                    </div>

                    <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>ACCOUNT ADVISORY</span>
                      <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>
                        Client has consistent on-time payment history averaging 13 days from dispatch. Ready for higher project capacity.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CONTACTS TAB */}
            {clientTab === "contacts" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {clientContacts.length} Registered Stakeholders & Decision Makers
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewContactModal(true)}
                    style={{
                      height: "34px",
                      padding: "0 14px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
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
                    <span>Add Contact</span>
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                  {clientContacts.map((cnt) => (
                    <div
                      key={cnt.id}
                      style={{
                        backgroundColor: "rgba(18, 23, 35, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "6px",
                        padding: "18px",
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
                              backgroundColor: "rgba(255, 138, 115, 0.15)",
                              color: "var(--accent-text)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "14px",
                            }}
                          >
                            {cnt.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{cnt.name}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{cnt.designation || "Stakeholder"}</div>
                          </div>
                        </div>

                        {cnt.is_primary && (
                          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontWeight: 700 }}>
                            PRIMARY
                          </span>
                        )}
                      </div>

                      <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                          <Icon name="mail" size={13} color="var(--text-muted)" />
                          <span>{cnt.email}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                          <Icon name="phone" size={13} color="var(--text-muted)" />
                          <span>{cnt.phone || "No direct phone"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. DEALS TAB */}
            {clientTab === "deals" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Commercial Deals & Proposals Pipeline
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewDealModal(true)}
                    style={{
                      height: "34px",
                      padding: "0 14px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
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
                    backgroundColor: "rgba(18, 23, 35, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                        <th style={{ padding: "14px 18px" }}>Deal Title</th>
                        <th style={{ padding: "14px 18px" }}>Stage</th>
                        <th style={{ padding: "14px 18px", textAlign: "right" }}>Value</th>
                        <th style={{ padding: "14px 18px", textAlign: "right" }}>Probability</th>
                        <th style={{ padding: "14px 18px" }}>Close Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientDeals.map((dl) => (
                        <tr key={dl.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <td style={{ padding: "14px 18px", fontWeight: 600, color: "#fff" }}>{dl.title}</td>
                          <td style={{ padding: "14px 18px" }}>
                            <span
                              style={{
                                padding: "3px 8px",
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
                          <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#34d399" }}>
                            ${dl.value.toLocaleString()}
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                            {dl.probability}%
                          </td>
                          <td style={{ padding: "14px 18px", color: "var(--text-muted)" }}>{dl.expectedClose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. PROJECTS / ORDERS TAB */}
            {clientTab === "projects" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Production Projects & Dispatches for {selectedClient.organization_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNewOrder) onNewOrder();
                      else setShowNewProjectModal(true);
                    }}
                    style={{
                      height: "34px",
                      padding: "0 14px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
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
                    <span>New Project</span>
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                        <th style={{ padding: "14px 18px" }}>Order / Project</th>
                        <th style={{ padding: "14px 18px" }}>Items Specification</th>
                        <th style={{ padding: "14px 18px" }}>Delivery Date</th>
                        <th style={{ padding: "14px 18px", textAlign: "right" }}>Total Value</th>
                        <th style={{ padding: "14px 18px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                            No orders logged yet for this client.
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
                            <td style={{ padding: "14px 18px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
                              {ord.order_number}
                            </td>
                            <td style={{ padding: "14px 18px", fontWeight: 600, color: "#fff" }}>
                              {ord.notes || "Production run batch"}
                            </td>
                            <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>
                              {ord.promised_delivery_date ? new Date(ord.promised_delivery_date).toLocaleDateString() : "Flexible"}
                            </td>
                            <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#34d399" }}>
                              ₹{Number(ord.total_amount || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: "14px 18px" }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Tax Invoices & Receivables
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewInvoiceModal(true)}
                    style={{
                      height: "34px",
                      padding: "0 14px",
                      borderRadius: "4px",
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
                    <span>New Invoice</span>
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(18, 23, 35, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                        <th style={{ padding: "14px 18px" }}>Invoice #</th>
                        <th style={{ padding: "14px 18px" }}>Issue Date</th>
                        <th style={{ padding: "14px 18px" }}>Due Date</th>
                        <th style={{ padding: "14px 18px", textAlign: "right" }}>Total</th>
                        <th style={{ padding: "14px 18px", textAlign: "right" }}>Paid</th>
                        <th style={{ padding: "14px 18px" }}>Status</th>
                        <th style={{ padding: "14px 18px", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientInvoices.map((inv) => (
                        <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <td style={{ padding: "14px 18px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                            {inv.invoiceNumber}
                          </td>
                          <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>{inv.issueDate}</td>
                          <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>{inv.dueDate}</td>
                          <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                            ${inv.total.toLocaleString()}
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#10b981" }}>
                            ${inv.paid.toLocaleString()}
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <span
                              style={{
                                padding: "2px 8px",
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
                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => success("PDF Downloaded", `Invoice ${inv.invoiceNumber} saved.`)}
                              style={{
                                background: "none",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                borderRadius: "3px",
                                padding: "3px 8px",
                                color: "var(--text-secondary)",
                                fontSize: "11px",
                                cursor: "pointer",
                              }}
                            >
                              PDF
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
            title={`Draft Tax Invoice: ${selectedClient.organization_name}`}
          >
            <form onSubmit={handleCreateNewInvoice} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <Input
                label="Invoice Amount ($)"
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
                placeholder="e.g. Alex Morgan"
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
                placeholder="e.g. alex@client.com"
              />
              <Input
                label="Direct Phone"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                placeholder="e.g. +91 98000 12345"
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
                placeholder="e.g. Annual Smartcard Retainer 2026"
                required
              />
              <Input
                label="Estimated Value ($)"
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
  // RENDER: FULL CLIENTS DIRECTORY (When < All clients is clicked)
  // ----------------------------------------------------
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Client Directory & Accounts"
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

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Search and Action Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "36px",
              boxSizing: "border-box",
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "0 12px",
            }}
          >
            <Icon name="search" size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search clients, code, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "12.5px",
                outline: "none",
                width: "220px",
              }}
            />
          </div>
        </div>

        {/* Clients Directory Table */}
        <div
          style={{
            backgroundColor: "rgba(19, 23, 34, 0.85)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 18px" }}>Client Code</th>
                <th style={{ padding: "14px 18px" }}>Organization Name</th>
                <th style={{ padding: "14px 18px" }}>Primary Contact</th>
                <th style={{ padding: "14px 18px" }}>Tax ID / GSTIN</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => {
                    setSelectedClientId(c.id);
                    onSelectClient?.(c.id);
                  }}
                  style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "14px 18px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
                    {c.client_code}
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: 700, color: "#fff" }}>
                    {c.organization_name}
                  </td>
                  <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>
                    {c.contacts?.[0]?.name || "Active Stakeholder"}
                  </td>
                  <td style={{ padding: "14px 18px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    {c.tax_identifier || "23AAAAA0000A1Z5"}
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClientId(c.id);
                        onSelectClient?.(c.id);
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "var(--text-secondary)",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Manage →
                    </button>
                  </td>
                </tr>
              ))}
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
