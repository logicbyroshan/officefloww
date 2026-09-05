import React, { useState } from "react";
import { Client, Product, OrderPriority, OrderCreate } from "@officefloww/api-types";
import { OrdersService } from "../../api/services";
import { Drawer } from "../../design-system/components/Drawer";
import { Input, Select } from "../../design-system/components/Input";
import { Button, IconButton } from "../../design-system/components/Button";
import { useToast } from "../../design-system/components/Toast";

export interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  products: Product[];
  onOrderCreated: () => void;
}

interface OrderItemForm {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  clients,
  products,
  onOrderCreated,
}) => {
  const { success, error: toastError } = useToast();
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [priority, setPriority] = useState<OrderPriority>(OrderPriority.NORMAL);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [items, setItems] = useState<OrderItemForm[]>([
    {
      product_id: products[0]?.id || "",
      quantity: 1000,
      unit_price: 35.0,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: products[0]?.id || "",
        quantity: 500,
        unit_price: 25.0,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const updateItem = (idx: number, field: keyof OrderItemForm, val: any) => {
    setItems((prev) =>
      prev.map((itm, i) => (i === idx ? { ...itm, [field]: val } : itm))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toastError("Validation Error", "Please select a client organization.");
      return;
    }
    if (items.length === 0) {
      toastError("Validation Error", "Order must include at least one product item.");
      return;
    }

    setLoading(true);
    try {
      const payload: OrderCreate = {
        client_id: clientId,
        priority,
        promised_delivery_date: dueDate ? `${dueDate}T18:00:00Z` : undefined,
        items: items.map((itm) => ({
          product_id: itm.product_id,
          quantity: Number(itm.quantity),
          unit_price: Number(itm.unit_price),
        })),
      };

      const created = await OrdersService.create(payload);
      success("Order Created", `Successfully instantiated order ${created.order_number}`);
      onOrderCreated();
      onClose();
    } catch (err: any) {
      toastError("Failed to Create Order", err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = items.reduce(
    (sum, itm) => sum + Number(itm.quantity) * Number(itm.unit_price),
    0
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create Production Order"
      subtitle="Instantiate a multi-product job with automatic DAG workflow generation"
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Create Order (₹{totalValue.toLocaleString()})
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Select
            label="Client Organization"
            options={clients.map((c) => ({ label: c.organization_name, value: c.id }))}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          />

          <Select
            label="Order Priority"
            options={[
              { label: "Normal (Standard Turnaround)", value: OrderPriority.NORMAL },
              { label: "High (Priority Press Queue)", value: OrderPriority.HIGH },
              { label: "Urgent / Critical (Rush Job)", value: OrderPriority.URGENT },
              { label: "Low (Backfill Scheduling)", value: OrderPriority.LOW },
            ]}
            value={priority}
            onChange={(e) => setPriority(e.target.value as OrderPriority)}
          />
        </div>

        <Input
          label="Target SLA Delivery Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />

        {/* Order Item (Single Product Per Order) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
            Ordered Product & Specification
          </span>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.8fr 1fr 1fr",
              gap: "8px",
              alignItems: "flex-end",
              backgroundColor: "var(--bg-surface)",
              padding: "12px",
              borderRadius: "var(--radius-xs)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Select
              label="Product"
              options={products.map((p) => ({ label: p.name, value: p.id }))}
              value={items[0]?.product_id || ""}
              onChange={(e) => updateItem(0, "product_id", e.target.value)}
            />
            <Input
              label="Quantity"
              type="number"
              value={items[0]?.quantity || 1000}
              onChange={(e) => updateItem(0, "quantity", Number(e.target.value))}
              min={1}
            />
            <Input
              label="Unit Price (₹)"
              type="number"
              value={items[0]?.unit_price || 35}
              onChange={(e) => updateItem(0, "unit_price", Number(e.target.value))}
              step="0.01"
              min={0}
            />
          </div>
        </div>
      </form>
    </Drawer>
  );
};
