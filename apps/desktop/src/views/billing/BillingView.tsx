import React, { useState } from "react";
import { Invoice, InvoiceStatus } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Tabs } from "../../design-system/components/Tabs";
import { Card, StatBox } from "../../design-system/components/Card";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  order_number: string;
  client_name: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  paid_amount: number;
  status: InvoiceStatus;
  due_date: string;
}

const SEED_INVOICES: InvoiceRecord[] = [
  {
    id: "inv-01",
    invoice_number: "INV-2026-0001",
    order_number: "ORD-2026-0001",
    client_name: "St. Xavier's High School",
    subtotal: 154661.02,
    cgst: 13919.49,
    sgst: 13919.49,
    total: 182500.0,
    paid_amount: 100000.0,
    status: InvoiceStatus.PARTIALLY_PAID,
    due_date: "2026-09-15",
  },
  {
    id: "inv-02",
    invoice_number: "INV-2026-0002",
    order_number: "ORD-2026-0002",
    client_name: "Delhi Public School",
    subtotal: 215000.0,
    cgst: 19350.0,
    sgst: 19350.0,
    total: 253700.0,
    paid_amount: 253700.0,
    status: InvoiceStatus.PAID,
    due_date: "2026-09-10",
  },
];

interface LedgerEntry {
  id: string;
  timestamp: string;
  client_name: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

const SEED_LEDGER: LedgerEntry[] = [
  {
    id: "led-01",
    timestamp: "2026-08-28",
    client_name: "St. Xavier's High School",
    particulars: "Invoice #INV-2026-0001 (Order #ORD-2026-0001)",
    debit: 182500.0,
    credit: 0,
    balance: 182500.0,
  },
  {
    id: "led-02",
    timestamp: "2026-09-01",
    client_name: "St. Xavier's High School",
    particulars: "NEFT / Bank Transfer (Txn #NEFT99481)",
    debit: 0,
    credit: 100000.0,
    balance: 82500.0,
  },
];

export const BillingView: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"invoices" | "ledger" | "invariant">("invoices");
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(SEED_INVOICES);
  const [ledger, setLedger] = useState<LedgerEntry[]>(SEED_LEDGER);

  // Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(82500);
  const [paymentMode, setPaymentMode] = useState("NEFT_BANK_TRANSFER");
  const [txnRef, setTxnRef] = useState("");
  const [loading, setLoading] = useState(false);

  const totalReceivables = invoices.reduce((sum, inv) => sum + (inv.total - inv.paid_amount), 0);
  const totalCollections = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setLoading(true);
    try {
      const amount = Number(paymentAmount);
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== selectedInvoice.id) return inv;
          const newPaid = inv.paid_amount + amount;
          return {
            ...inv,
            paid_amount: newPaid,
            status: newPaid >= inv.total ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
          };
        })
      );

      const newLedgerEntry: LedgerEntry = {
        id: `led-0${ledger.length + 1}`,
        timestamp: new Date().toISOString().split("T")[0],
        client_name: selectedInvoice.client_name,
        particulars: `Payment Received via ${paymentMode.replace(/_/g, " ")} (${txnRef || "NEFT"})`,
        debit: 0,
        credit: amount,
        balance: Math.max(0, (selectedInvoice.total - selectedInvoice.paid_amount) - amount),
      };

      setLedger((prev) => [...prev, newLedgerEntry]);
      success("Payment Recorded", `Credited ₹${amount.toLocaleString()} to ${selectedInvoice.client_name}`);
      setIsPaymentModalOpen(false);
      setTxnRef("");
    } catch (err: any) {
      toastError("Payment Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const invoiceColumns: Column<InvoiceRecord>[] = [
    {
      key: "invoice_number",
      header: "Tax Invoice #",
      width: "150px",
      render: (i) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          {i.invoice_number}
        </span>
      ),
    },
    {
      key: "client_name",
      header: "Billed Client & Order",
      render: (i) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{i.client_name}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Order: {i.order_number}</div>
        </div>
      ),
    },
    {
      key: "subtotal",
      header: "Taxable Subtotal",
      align: "right",
      width: "130px",
      render: (i) => (
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          ₹{i.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "tax",
      header: "GST (18%)",
      align: "right",
      width: "120px",
      render: (i) => (
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          ₹{(i.cgst + i.sgst).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "total",
      header: "Gross Total",
      align: "right",
      width: "140px",
      render: (i) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
          ₹{i.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "140px",
      render: (i) => {
        let variant: "default" | "accent" | "success" | "warning" | "error" = "default";
        if (i.status === InvoiceStatus.PAID) variant = "success";
        if (i.status === InvoiceStatus.PARTIALLY_PAID) variant = "warning";
        return <Badge variant={variant} dot>{i.status}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      width: "140px",
      render: (i) => (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {i.status !== InvoiceStatus.PAID && (
            <Button
              size="sm"
              variant="outline"
              icon="credit-card"
              onClick={() => {
                setSelectedInvoice(i);
                setPaymentAmount(i.total - i.paid_amount);
                setIsPaymentModalOpen(true);
              }}
            >
              Record Payment
            </Button>
          )}
        </div>
      ),
    },
  ];

  const ledgerColumns: Column<LedgerEntry>[] = [
    {
      key: "timestamp",
      header: "Date",
      width: "110px",
      render: (l) => <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{l.timestamp}</span>,
    },
    {
      key: "client_name",
      header: "Account / Particulars",
      render: (l) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{l.client_name}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{l.particulars}</div>
        </div>
      ),
    },
    {
      key: "debit",
      header: "Debit (+)",
      align: "right",
      width: "120px",
      render: (l) => (
        <span style={{ fontFamily: "var(--font-mono)", color: l.debit > 0 ? "var(--status-error)" : "var(--text-muted)" }}>
          {l.debit > 0 ? `₹${l.debit.toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      key: "credit",
      header: "Credit (−)",
      align: "right",
      width: "120px",
      render: (l) => (
        <span style={{ fontFamily: "var(--font-mono)", color: l.credit > 0 ? "var(--status-success)" : "var(--text-muted)", fontWeight: 600 }}>
          {l.credit > 0 ? `₹${l.credit.toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Net Balance",
      align: "right",
      width: "130px",
      render: (l) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          ₹{l.balance.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Billing, GST Tax Invoices & Client Ledger"
        subtitle="GST-compliant invoicing and cryptographic enforcement of the Tripartite Order Completion Invariant."
      />

      <div style={{ padding: "16px 24px 0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
          <StatBox label="Total Outstanding Receivables" value={`₹${totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} subValue="Pending Collections" icon="billing" status="warning" />
          <StatBox label="Collected This Month" value={`₹${totalCollections.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} subValue="Settled Bank Deposits" icon="credit-card" status="success" />
          <StatBox label="Completion Invariant" value="ACTIVE" subValue="Strict Verification Enforced" icon="shield" status="success" />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "invoices", label: "Tax Invoices", icon: "billing", badge: invoices.length },
          { id: "ledger", label: "Client Account Ledger", icon: "credit-card", badge: ledger.length },
          { id: "invariant", label: "Order Completion Invariant", icon: "shield" },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {activeTab === "invoices" && (
          <Table
            columns={invoiceColumns}
            data={invoices}
            keyExtractor={(i) => i.id}
            emptyText="No invoices generated."
          />
        )}

        {activeTab === "ledger" && (
          <Table
            columns={ledgerColumns}
            data={ledger}
            keyExtractor={(l) => l.id}
            emptyText="No ledger transactions recorded."
          />
        )}

        {activeTab === "invariant" && (
          <Card title="Tripartite Order Completion Invariant Engine" subtitle="Rules preventing premature order closure">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xs)", fontSize: "12px", lineHeight: 1.6 }}>
                <strong>🔒 Invariant Rule:</strong> An order can only transition to <code>COMPLETED</code> when all 3 assertions pass:
                <ul style={{ marginTop: "6px", marginLeft: "18px" }}>
                  <li>✓ <strong>Workflows Complete:</strong> All DAG step instances across items are marked <code>COMPLETED</code> or <code>SKIPPED</code>.</li>
                  <li>✓ <strong>Dual Verification Packing:</strong> All finished goods are barcode scanned into sealed cartons.</li>
                  <li>✓ <strong>Net Quantity Reconciliation:</strong> Packed units equal or exceed ordered job quantities without unallocated balance.</li>
                </ul>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ padding: "12px", backgroundColor: "var(--status-success-soft)", border: "1px solid var(--status-success-border)", borderRadius: "var(--radius-xs)" }}>
                  <div style={{ fontWeight: 600, color: "var(--status-success)" }}>Order #ORD-2026-0001 Check</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    ✓ Workflows Complete: YES (Press & Lanyard Fitting finished)<br />
                    ✓ Quantities Reconciled: YES (5,000 / 5,000 units good)<br />
                    ✓ Packing Sealed: YES (8 cartons sealed)
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Client Payment"
        subtitle={`Record receipt for ${selectedInvoice?.invoice_number} (${selectedInvoice?.client_name})`}
        width={480}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" icon="check" onClick={handleRecordPayment} loading={loading}>
              Record Receipt (₹{paymentAmount.toLocaleString()})
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Input
            label="Payment Amount (₹)"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            min={1}
            max={selectedInvoice ? selectedInvoice.total - selectedInvoice.paid_amount : undefined}
            required
          />

          <Select
            label="Payment Mode"
            options={[
              { label: "NEFT / RTGS Bank Transfer", value: "NEFT_BANK_TRANSFER" },
              { label: "UPI / QR Code", value: "UPI" },
              { label: "Cheque Deposit", value: "CHEQUE" },
              { label: "Cash on Delivery (COD)", value: "CASH" },
            ]}
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
          />

          <Input
            label="Transaction Reference / Cheque #"
            placeholder="e.g. UTR-994810294"
            value={txnRef}
            onChange={(e) => setTxnRef(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};
