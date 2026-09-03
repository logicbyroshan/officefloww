import React, { useState, useMemo } from "react";
import { Order, Client, OrderPriority, OrderStatus } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
import { SearchInput } from "../../design-system/components/Input";
import { Select } from "../../design-system/components/Input";
import { PriorityBadge, OrderStatusBadge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";

export interface OrdersViewProps {
  orders: Order[];
  clients: Client[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onSelectOrder: (orderId: string) => void;
  onNewOrder: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  clients,
  loading,
  error,
  onRefresh,
  onSelectOrder,
  onNewOrder,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const clientsMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((c) => map.set(c.id, c.organization_name));
    return map;
  }, [clients]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        search === "" ||
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        (clientsMap.get(o.client_id) || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || o.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [orders, search, statusFilter, priorityFilter, clientsMap]);

  const columns: Column<Order>[] = [
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
      key: "client_id",
      header: "Client Organization",
      render: (o) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {clientsMap.get(o.client_id) || "Client Order"}
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
      header: "Stage / Status",
      width: "140px",
      render: (o) => <OrderStatusBadge status={o.status} />,
    },
    {
      key: "promised_delivery_date",
      header: "Promised Delivery",
      width: "140px",
      render: (o) => (
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {o.promised_delivery_date ? new Date(o.promised_delivery_date).toLocaleDateString() : "Flexible"}
        </span>
      ),
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

  if (loading && orders.length === 0) {
    return <LoadingState message="Loading factory orders directory..." />;
  }

  if (error && orders.length === 0) {
    return <ErrorState message={error.message} onRetry={onRefresh} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Production Orders Directory"
        subtitle="Manage custom print orders, independent workflow DAGs, and delivery deadlines."
        primaryAction={{
          label: "New Production Order",
          icon: "plus",
          onClick: onNewOrder,
        }}
        secondaryActions={
          <Button variant="secondary" size="sm" icon="refresh" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {/* Filters Toolbar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 180px 180px",
            gap: "12px",
            backgroundColor: "var(--bg-surface)",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder="Search by order number or client..."
          />
          <Select
            options={[
              { label: "All Statuses", value: "ALL" },
              { label: "Draft", value: OrderStatus.DRAFT },
              { label: "Confirmed", value: OrderStatus.CONFIRMED },
              { label: "In Production", value: OrderStatus.IN_PRODUCTION },
              { label: "Ready For Dispatch", value: OrderStatus.READY_FOR_DISPATCH },
              { label: "Dispatched", value: OrderStatus.DISPATCHED },
              { label: "Completed", value: OrderStatus.COMPLETED },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            options={[
              { label: "All Priorities", value: "ALL" },
              { label: "Normal", value: OrderPriority.NORMAL },
              { label: "High", value: OrderPriority.HIGH },
              { label: "Urgent / Critical", value: OrderPriority.URGENT },
              { label: "Low", value: OrderPriority.LOW },
            ]}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          />
        </div>

        {/* Orders Table */}
        <Table
          columns={columns}
          data={filteredOrders}
          keyExtractor={(o) => o.id}
          onRowClick={(o) => onSelectOrder(o.id)}
          emptyText="No production orders match the selected filters."
        />
      </div>
    </div>
  );
};
