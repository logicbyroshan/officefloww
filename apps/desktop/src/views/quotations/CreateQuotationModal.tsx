import React, { useState } from "react";
import { Client, Product, Quotation } from "@officefloww/api-types";
import { QuotationsService } from "../../api/services";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select } from "../../design-system/components/Input";
import { Button, IconButton } from "../../design-system/components/Button";
import { useToast } from "../../design-system/components/Toast";

export interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  products: Product[];
  onQuotationCreated: (quote: Quotation) => void;
}

interface QuoteLineForm {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
  isOpen,
  onClose,
  clients,
  products,
  onQuotationCreated,
}) => {
  const { success, error: toastError } = useToast();
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [items, setItems] = useState<QuoteLineForm[]>([
    {
      product_id: products[0]?.id || "",
      quantity: 2000,
      unit_price: 32.50,
    },
  ]);
  const [notes, setNotes] = useState("Quotation valid for 30 calendar days.");
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: products[0]?.id || "",
        quantity: 1000,
        unit_price: 24.0,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const updateItem = (idx: number, field: keyof QuoteLineForm, val: any) => {
    setItems((prev) =>
      prev.map((itm, i) => (i === idx ? { ...itm, [field]: val } : itm))
    );
  };

  const totalSubtotal = items.reduce(
    (sum, itm) => sum + Number(itm.quantity) * Number(itm.unit_price),
    0
  );
  const totalTax = totalSubtotal * 0.18;
  const grandTotal = totalSubtotal + totalTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toastError("Validation Error", "Please select a client organization.");
      return;
    }

    setLoading(true);
    try {
      const created = await QuotationsService.createQuotation({
        client_id: clientId,
        notes,
        items: items.map((itm) => ({
          product_id: itm.product_id,
          quantity: Number(itm.quantity),
          unit_price: Number(itm.unit_price),
        })),
      });

      success("Quotation Generated", `Quote ${created.quotation_number || "QUO-2026-001"} prepared (₹${grandTotal.toLocaleString()}).`);
      onQuotationCreated(created);
      onClose();
    } catch (err: any) {
      toastError("Failed to Generate Quotation", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Commercial Quotation"
      subtitle="Configure pricing tiers, compute BOM raw material costing, and verify machine capacity feasibility"
      width={600}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Generate Quote (₹{grandTotal.toLocaleString()})
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Select
          label="Client Organization"
          options={clients.map((c) => ({ label: c.organization_name, value: c.id }))}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
        />

        {/* Quotation Line Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Product Line Items & Tier Rates
            </span>
            <Button size="sm" variant="outline" icon="plus" onClick={addItem}>
              Add Product Line
            </Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1fr 1fr auto",
                  gap: "8px",
                  alignItems: "flex-end",
                  backgroundColor: "var(--bg-surface)",
                  padding: "10px",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <Select
                  label="Product"
                  options={products.map((p) => ({ label: p.name, value: p.id }))}
                  value={item.product_id}
                  onChange={(e) => updateItem(idx, "product_id", e.target.value)}
                />
                <Input
                  label="Quantity"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                  min={1}
                />
                <Input
                  label="Unit Price (₹)"
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))}
                  step="0.01"
                  min={0}
                />
                <div style={{ paddingBottom: "2px" }}>
                  <IconButton
                    icon="trash"
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-xs)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
          }}
        >
          <div>
            <span style={{ color: "var(--text-muted)" }}>Taxable Subtotal: </span>
            <strong style={{ fontFamily: "var(--font-mono)" }}>₹{totalSubtotal.toLocaleString()}</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>GST (18%): </span>
            <span style={{ fontFamily: "var(--font-mono)" }}>₹{totalTax.toLocaleString()}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Grand Total: </span>
            <strong style={{ fontFamily: "var(--font-mono)", color: "var(--accent-text)", fontSize: "14px" }}>
              ₹{grandTotal.toLocaleString()}
            </strong>
          </div>
        </div>
      </form>
    </Modal>
  );
};
