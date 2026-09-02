import React, { useState, useEffect } from "react";
import { Client, Order } from "@officefloww/api-types";
import { ClientsService, OrdersService } from "../../api/services";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Card } from "../../design-system/components/Card";
import { Table, Column } from "../../design-system/components/Table";
import { PriorityBadge, OrderStatusBadge, Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";

export interface ClientDetailViewProps {
  clientId: string;
  onBack: () => void;
  onSelectOrder: (orderId: string) => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  clientId,
  onBack,
  onSelectOrder,
}) => {
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, ords] = await Promise.all([
        ClientsService.get(clientId),
        OrdersService.list({ client_id: clientId }).catch(() => []),
      ]);
      setClient(c);
      setOrders(ords);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  if (loading) return <LoadingState message="Loading client profile..." />;
  if (error || !client) return <ErrorState message={error?.message || "Client not found"} onRetry={loadData} />;

  const orderColumns: Column<Order>[] = [
    {
      key: "order_number",
      header: "Order Number",
      width: "140px",
      render: (o) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          {o.order_number}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      width: "110px",
      render: (o) => <PriorityBadge priority={o.priority} />,
    },
    {
      key: "status",
      header: "Status",
      width: "130px",
      render: (o) => <OrderStatusBadge status={o.status} />,
    },
    {
      key: "total_amount",
      header: "Total Value",
      align: "right",
      width: "130px",
      render: (o) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
          ₹{Number(o.total_amount || 0).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title={client.organization_name}
        subtitle={`Client Code: ${client.client_code} • Tax Identifier: ${client.tax_identifier || "Unregistered"}`}
        breadcrumbs={[
          { label: "Clients Directory", onClick: onBack },
          { label: client.organization_name },
        ]}
        secondaryActions={
          <Button variant="secondary" icon="refresh" onClick={loadData}>
            Refresh
          </Button>
        }
      />

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Address & Tax Information */}
          <Card title="Institutional Profile & Addresses">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Billing Address: </span>
                <span style={{ color: "var(--text-primary)" }}>
                  {client.billing_address || "Not specified"}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Delivery / Dispatch Address: </span>
                <span style={{ color: "var(--text-primary)" }}>
                  {client.delivery_address || "Not specified"}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Registration Date: </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {new Date(client.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Contact Persons Directory */}
          <Card title="Contact Persons & Key Stakeholders" subtitle={`${client.contacts?.length || 0} registered contacts`}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(!client.contacts || client.contacts.length === 0) ? (
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>No contacts registered yet.</div>
              ) : (
                client.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    style={{
                      padding: "8px 10px",
                      backgroundColor: "var(--bg-surface)",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {contact.name}
                        </span>
                        {contact.is_primary && <Badge variant="accent">Primary</Badge>}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {contact.designation || "Contact Person"} • {contact.email || "No email"} • {contact.phone || "No phone"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Client Production Orders */}
        <Card title="Associated Production Orders" subtitle={`Lifetime orders: ${orders.length}`}>
          <Table
            columns={orderColumns}
            data={orders}
            keyExtractor={(o) => o.id}
            onRowClick={(o) => onSelectOrder(o.id)}
            emptyText="No production orders placed by this client yet."
          />
        </Card>
      </div>
    </div>
  );
};
