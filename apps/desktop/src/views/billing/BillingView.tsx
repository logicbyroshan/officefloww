import React, { useState } from "react";
import { Invoice, InvoiceStatus } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
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

interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paid_to: string;
  payment_mode: string;
}

const SEED_EXPENSES: ExpenseRecord[] = [
  {
    id: "exp-01",
    date: "01 Sep 2026",
    category: "RAW_MATERIALS",
    description: "Advance for PVC sheets shipment",
    amount: 25000.0,
    paid_to: "Apex Polymers Ltd.",
    payment_mode: "RTGS",
  },
  {
    id: "exp-02",
    date: "02 Sep 2026",
    category: "LABOUR_PAYOUT",
    description: "Lanyard clip stitching batch payout",
    amount: 3000.0,
    paid_to: "Ramesh Labour Unit",
    payment_mode: "UPI",
  },
];

export const BillingView: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"invoices" | "payments" | "ledger" | "expenses" | "reports">("invoices");
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(SEED_INVOICES);
  const [ledger, setLedger] = useState<LedgerEntry[]>(SEED_LEDGER);
  const [search, setSearch] = useState("");

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
        balance: Math.max(0, selectedInvoice.total - selectedInvoice.paid_amount - amount),
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
      header: "Invoice #",
      width: "140px",
      render: (inv) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)", fontSize: "12.5px" }}>
          {inv.invoice_number}
        </span>
      ),
    },
    {
      key: "client_name",
      header: "Client Account",
      render: (inv) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px" }}>{inv.client_name}</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Order {inv.order_number}
          </span>
        </div>
      ),
    },
    {
      key: "due_date",
      header: "Due Date",
      render: (inv) => <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{inv.due_date}</span>,
    },
    {
      key: "total",
      header: "Invoice Total",
      align: "right",
      render: (inv) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff", fontSize: "13px" }}>
          ₹{inv.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "paid_amount",
      header: "Paid Amount",
      align: "right",
      render: (inv) => (
        <span style={{ fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 600, fontSize: "12.5px" }}>
          ₹{inv.paid_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance Due",
      align: "right",
      render: (inv) => {
        const bal = inv.total - inv.paid_amount;
        return (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: bal > 0 ? "var(--accent-text)" : "var(--text-muted)",
              fontSize: "13px",
            }}
          >
            ₹{bal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (inv) => {
        const isPaid = inv.status === InvoiceStatus.PAID;
        return (
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: "3px",
              backgroundColor: isPaid ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 138, 115, 0.15)",
              color: isPaid ? "#10b981" : "var(--accent-text)",
            }}
          >
            {inv.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: "120px",
      render: (inv) => (
        <div style={{ display: "flex", gap: "6px" }}>
          {inv.total > inv.paid_amount && (
            <button
              type="button"
              onClick={() => {
                setSelectedInvoice(inv);
                setPaymentAmount(inv.total - inv.paid_amount);
                setIsPaymentModalOpen(true);
              }}
              style={{
                padding: "3px 8px",
                borderRadius: "3px",
                backgroundColor: "rgba(255, 138, 115, 0.15)",
                border: "1px solid var(--accent-border)",
                color: "var(--accent-text)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Collect
            </button>
          )}
          <button
            type="button"
            onClick={() => success("PDF Generated", `Invoice ${inv.invoice_number} downloaded.`)}
            style={{
              padding: "3px 6px",
              borderRadius: "3px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "var(--text-secondary)",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            PDF
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Billing & Financial Ledger"
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
            GST Compliance Engine
          </span>
        }
        primaryAction={{
          label: "Create Invoice",
          icon: "plus",
          onClick: () => success("Drafting Invoice", "Creating new tax invoice."),
        }}
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* KPI Balance Tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(19, 23, 34, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Total Outstanding Receivables
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-text)", marginTop: "4px" }}>
              ₹{totalReceivables.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(19, 23, 34, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Total Collected (Month to Date)
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#10b981", marginTop: "4px" }}>
              ₹{totalCollections.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(19, 23, 34, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Invoices Awaiting Payment
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff", marginTop: "4px" }}>
              {invoices.filter((i) => i.status !== InvoiceStatus.PAID).length} Active
            </div>
          </div>
        </div>

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
              { id: "invoices" as const, label: "Tax Invoices" },
              { id: "payments" as const, label: "Payments Received" },
              { id: "ledger" as const, label: "Client Ledger" },
              { id: "expenses" as const, label: "Expenses & Disbursements" },
              { id: "reports" as const, label: "Tax & Financial Reports" },
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
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "4px 10px",
            }}
          >
            <Icon name="search" size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search invoices, clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "12px",
                outline: "none",
                width: "160px",
              }}
            />
          </div>
        </div>

        {/* Tab View Contents */}
        {activeTab === "ledger" ? (
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
              columns={[
                { key: "timestamp", header: "Date", width: "120px", render: (l) => <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)" }}>{l.timestamp}</span> },
                { key: "client_name", header: "Client Account", render: (l) => <span style={{ fontWeight: 600, color: "#fff" }}>{l.client_name}</span> },
                { key: "particulars", header: "Transaction Particulars", render: (l) => <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{l.particulars}</span> },
                { key: "debit", header: "Debit (Charge)", align: "right", render: (l) => <span style={{ fontFamily: "var(--font-mono)", color: l.debit > 0 ? "var(--status-error)" : "var(--text-muted)" }}>{l.debit > 0 ? `₹${l.debit.toLocaleString()}` : "—"}</span> },
                { key: "credit", header: "Credit (Payment)", align: "right", render: (l) => <span style={{ fontFamily: "var(--font-mono)", color: l.credit > 0 ? "#10b981" : "var(--text-muted)" }}>{l.credit > 0 ? `₹${l.credit.toLocaleString()}` : "—"}</span> },
                { key: "balance", header: "Running Balance", align: "right", render: (l) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>₹{l.balance.toLocaleString()}</span> },
              ]}
              data={ledger}
              emptyText="No ledger entries."
            />
          </div>
        ) : activeTab === "expenses" ? (
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
              columns={[
                { key: "date", header: "Date", width: "120px", render: (e) => <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)" }}>{e.date}</span> },
                { key: "category", header: "Category", render: (e) => <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.04)", color: "var(--text-secondary)" }}>{e.category}</span> },
                { key: "description", header: "Description / Purpose", render: (e) => <span style={{ fontSize: "12.5px", color: "#fff" }}>{e.description}</span> },
                { key: "paid_to", header: "Paid To", render: (e) => <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{e.paid_to}</span> },
                { key: "amount", header: "Amount", align: "right", render: (e) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>₹{e.amount.toLocaleString()}</span> },
              ]}
              data={SEED_EXPENSES}
              emptyText="No expenses logged."
            />
          </div>
        ) : (
          /* Main Invoices Table */
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
              columns={invoiceColumns}
              data={invoices}
              emptyText="No invoices found."
            />
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title={`Record Payment for ${selectedInvoice.invoice_number}`}
        >
          <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "10px", backgroundColor: "rgba(255, 255, 255, 0.03)", borderRadius: "4px" }}>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Client: {selectedInvoice.client_name}</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginTop: "2px" }}>
                Balance Due: ₹{(selectedInvoice.total - selectedInvoice.paid_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <Input
              label="Amount Received (₹)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              required
            />

            <Select
              label="Payment Mode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              options={[
                { value: "NEFT_BANK_TRANSFER", label: "NEFT / RTGS Bank Transfer" },
                { value: "UPI_SCANNER", label: "UPI Corporate QR" },
                { value: "CHEQUE", label: "Account Payee Cheque" },
                { value: "CASH", label: "Cash Receipt" },
              ]}
            />

            <Input
              label="Bank Reference / Txn UTR #"
              placeholder="e.g. UTR994827104"
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={loading}>
                Confirm & Credit Ledger
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
