import React, { useState, useMemo } from "react";
import { Client, Order, OrderPriority } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { PriorityBadge, OrderStatusBadge } from "../../design-system/components/Badge";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";
import { NewClientModal } from "./NewClientModal";

export interface ClientsViewProps {
  clients: Client[];
  orders?: Order[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onSelectClient: (clientId: string) => void;
  onSelectOrder?: (orderId: string) => void;
  onNewOrder?: () => void;
}

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
  const [activeTab, setActiveTab] = useState<"clients" | "orders" | "quotations" | "approvals">("clients");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

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

  const clientColumns: Column<Client>[] = [
    {
      key: "client_code",
      header: "Client Code",
      width: "130px",
      render: (c) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)", fontSize: "12px" }}>
          {c.client_code}
        </span>
      ),
    },
    {
      key: "organization_name",
      header: "Organization / Institution",
      render: (c) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px" }}>
            {c.organization_name}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {c.contacts?.[0]?.email || c.billing_address?.city || "Active Client"}
          </span>
        </div>
      ),
    },
    {
      key: "contacts",
      header: "Primary Contact",
      render: (c) => {
        const contact = c.contacts?.[0];
        if (!contact) return <span style={{ color: "var(--text-muted)" }}>None registered</span>;
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12.5px", color: "var(--text-primary)" }}>{contact.name}</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{contact.phone || contact.email}</span>
          </div>
        );
      },
    },
    {
      key: "active_orders",
      header: "Active Orders",
      align: "right",
      width: "120px",
      render: (c) => {
        const count = orders.filter((o) => o.client_id === c.id && o.status !== "COMPLETED").length;
        return (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: 600, color: count > 0 ? "#fff" : "var(--text-muted)" }}>
            {count} active
          </span>
        );
      },
    },
    {
      key: "credit_limit",
      header: "Credit / Ledger",
      align: "right",
      width: "130px",
      render: (c) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#34d399", fontWeight: 600 }}>
          ₹{(c.credit_limit || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "95px",
      align: "right",
      render: (c) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectClient(c.id);
          }}
          style={{
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "5px 12px",
            borderRadius: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "var(--text-secondary)",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
            lineHeight: 1,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 138, 115, 0.15)";
            e.currentTarget.style.borderColor = "var(--accent-border)";
            e.currentTarget.style.color = "var(--accent-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <span>View</span>
          <span style={{ fontSize: "11px" }}>→</span>
        </button>
      ),
    },
  ];

  const orderColumns: Column<Order>[] = [
    {
      key: "order_number",
      header: "Order Code",
      width: "140px",
      render: (o) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)", fontSize: "12.5px" }}>
          {o.order_number}
        </span>
      ),
    },
    {
      key: "client_id",
      header: "Client Institution",
      render: (o) => {
        const client = clients.find((c) => c.id === o.client_id);
        return <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{client?.organization_name || "Client Order"}</span>;
      },
    },
    {
      key: "promised_delivery_date",
      header: "Delivery Promised",
      render: (o) => (
        <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
          {o.promised_delivery_date ? new Date(o.promised_delivery_date).toLocaleDateString("en-IN") : "Flexible"}
        </span>
      ),
    },
    {
      key: "total_amount",
      header: "Total Value",
      align: "right",
      render: (o) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#34d399" }}>
          ₹{Number(o.total_amount || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (o) => <PriorityBadge priority={o.priority || OrderPriority.NORMAL} />,
    },
    {
      key: "status",
      header: "Status",
      render: (o) => <OrderStatusBadge status={o.status} />,
    },
  ];

  if (loading && clients.length === 0) {
    return <LoadingState message="Loading client accounts and institutional dossiers..." />;
  }

  if (error && clients.length === 0) {
    return <ErrorState message={error.message} onRetry={onRefresh} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Clients & Orders Hub"
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
          onClick: () => setShowNewModal(true),
        }}
        secondaryActions={
          onNewOrder ? (
            <Button variant="secondary" size="sm" icon="plus" onClick={onNewOrder}>
              New Order
            </Button>
          ) : undefined
        }
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Navigation Tabs Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "10px",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[
              { id: "clients" as const, label: "Client Directory" },
              { id: "orders" as const, label: "All Orders" },
              { id: "quotations" as const, label: "Quotations & Costing" },
              { id: "approvals" as const, label: "Proof Approvals" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor:
                    activeTab === tab.id ? "rgba(255, 138, 115, 0.14)" : "transparent",
                  color: activeTab === tab.id ? "var(--accent-text)" : "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  cursor: "pointer",
                }}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

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
                width: "180px",
              }}
            />
          </div>
        </div>

        {/* Tab View Contents */}
        {activeTab === "orders" ? (
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.75)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <Table
              columns={orderColumns}
              data={orders}
              onRowClick={(o) => onSelectOrder?.(o.id)}
              emptyText="No production orders found."
            />
          </div>
        ) : activeTab === "quotations" ? (
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.75)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              overflow: "hidden",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "14px", color: "#fff" }}>Formal Commercial Proposals</h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "var(--text-muted)" }}>
                  Cost calculation, margins, and lead time estimators.
                </p>
              </div>
              <Button variant="primary" size="sm" icon="plus">
                Create Quotation
              </Button>
            </div>

            <Table
              columns={[
                { key: "code", header: "Quote #", render: () => <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-text)", fontWeight: 700 }}>QTN-2026-0042</span> },
                { key: "client", header: "Client", render: () => <span style={{ fontWeight: 600, color: "#fff" }}>St. Xavier's High School</span> },
                { key: "items", header: "Items Ordered", render: () => <span>500 Multicolor Lanyards + ID Badges</span> },
                { key: "amount", header: "Quoted Total", align: "right", render: () => <span style={{ fontFamily: "var(--font-mono)", color: "#34d399", fontWeight: 700 }}>₹1,82,500</span> },
                { key: "status", header: "Status", render: () => <span style={{ fontSize: "10.5px", padding: "2px 6px", borderRadius: "3px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 700 }}>CONVERTED</span> },
              ]}
              data={[{ id: "1" }]}
            />
          </div>
        ) : activeTab === "approvals" ? (
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.75)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              overflow: "hidden",
              padding: "16px",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>
              Client Artwork Signoff Queue
            </div>
            <Table
              columns={[
                { key: "code", header: "Proof ID", render: () => <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-text)", fontWeight: 700 }}>PRF-LANYARD-01</span> },
                { key: "order", header: "Order", render: () => <span>#ORD-2026-0001 (St. Xavier's)</span> },
                { key: "status", header: "Approval Status", render: () => <span style={{ fontSize: "10.5px", padding: "2px 6px", borderRadius: "3px", backgroundColor: "rgba(255, 138, 115, 0.15)", color: "var(--accent-text)", fontWeight: 700 }}>WAITING CLIENT SIGNOFF</span> },
              ]}
              data={[{ id: "1" }]}
            />
          </div>
        ) : (
          /* Main Client Directory Table */
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.75)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <Table
              columns={clientColumns}
              data={filteredClients}
              onRowClick={(c) => onSelectClient(c.id)}
              emptyText="No client organizations found matching search."
            />
          </div>
        )}
      </div>

      <NewClientModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onClientCreated={() => {
          onRefresh();
          setShowNewModal(false);
        }}
      />
    </div>
  );
};
