import React, { useState, useMemo } from "react";
import { Order, Task, Approval, Client, OrderPriority, TaskStatus, InvoiceStatus } from "@officefloww/api-types";
import { AppNavSection } from "../../auth/permissions";
import { useAuth } from "../../auth/AuthContext";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Card } from "../../design-system/components/Card";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { Drawer } from "../../design-system/components/Modal";
import { Input, Select } from "../../design-system/components/Input";
import { Tabs } from "../../design-system/components/Tabs";
import { useToast } from "../../design-system/components/Toast";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";

export interface InvoiceRecord {
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

export interface LedgerEntry {
  id: string;
  timestamp: string;
  client_name: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
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
  {
    id: "inv-03",
    invoice_number: "INV-2026-0003",
    order_number: "ORD-2026-0003",
    client_name: "BHEL Township Admin",
    subtotal: 42000.0,
    cgst: 3780.0,
    sgst: 3780.0,
    total: 49560.0,
    paid_amount: 0.0,
    status: InvoiceStatus.ISSUED,
    due_date: "2026-09-18",
  },
  {
    id: "inv-04",
    invoice_number: "INV-2026-0004",
    order_number: "ORD-2026-0004",
    client_name: "Northwind Coffee",
    subtotal: 121491.53,
    cgst: 10934.24,
    sgst: 10934.24,
    total: 143360.0,
    paid_amount: 0.0,
    status: InvoiceStatus.ISSUED,
    due_date: "2026-09-20",
  },
];

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
  {
    id: "led-03",
    timestamp: "2026-09-02",
    client_name: "Delhi Public School",
    particulars: "Invoice #INV-2026-0002",
    debit: 253700.0,
    credit: 253700.0,
    balance: 0.0,
  },
];

export interface DashboardViewProps {
  orders: Order[];
  tasks: Task[];
  approvals: Approval[];
  clients: Client[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onSelectOrder: (orderId: string) => void;
  onSelectTask: (taskId: string) => void;
  onSelectStock?: (stockId: string) => void;
  onNewOrder: () => void;
  onNewTask?: () => void;
  onNewClient: () => void;
  onNewQuotation?: () => void;
  onStockEntry?: () => void;
  onRecordPayment?: () => void;
  onNavigateSection?: (section: AppNavSection) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  tasks,
  approvals,
  clients,
  loading,
  error,
  onRefresh,
  onSelectOrder,
  onSelectTask,
  onSelectStock,
  onNewOrder,
  onNewTask,
  onNewClient,
  onNewQuotation,
  onStockEntry,
  onRecordPayment,
  onNavigateSection,
}) => {
  const { hasPerm } = useAuth();
  const { success, error: toastError } = useToast();

  // Invoices & Billing state merged into Dashboard
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(SEED_INVOICES);
  const [ledger, setLedger] = useState<LedgerEntry[]>(SEED_LEDGER);
  const [invoiceFilter, setInvoiceFilter] = useState<"all" | "outstanding" | "paid">("all");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [activeFinanceTab, setActiveFinanceTab] = useState<"invoices" | "ledger">("invoices");

  // Drawers state
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [isDraftInvoiceDrawerOpen, setIsDraftInvoiceDrawerOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState("NEFT_BANK_TRANSFER");
  const [txnRef, setTxnRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Draft invoice state
  const [draftClientId, setDraftClientId] = useState<string>(clients[0]?.id || "");
  const [draftOrderNum, setDraftOrderNum] = useState<string>("");
  const [draftSubtotal, setDraftSubtotal] = useState<number>(25000);
  const [draftDueDate, setDraftDueDate] = useState<string>("2026-09-30");
  const [draftDesc, setDraftDesc] = useState<string>("Custom Thermal Lanyards & RFID Badge Printing");

  // Calculations for financial metrics
  const totalBilled = useMemo(() => invoices.reduce((sum, i) => sum + i.total, 0), [invoices]);
  const totalCollected = useMemo(() => invoices.reduce((sum, i) => sum + i.paid_amount, 0), [invoices]);
  const totalOutstanding = useMemo(() => invoices.reduce((sum, i) => sum + (i.total - i.paid_amount), 0), [invoices]);
  const activeInvoicesCount = useMemo(() => invoices.filter((i) => i.total > i.paid_amount).length, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoice_number.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.client_name.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.order_number.toLowerCase().includes(invoiceSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (invoiceFilter === "outstanding") {
        return inv.total > inv.paid_amount;
      }
      if (invoiceFilter === "paid") {
        return inv.status === InvoiceStatus.PAID;
      }
      return true;
    });
  }, [invoices, invoiceFilter, invoiceSearch]);

  const handleOpenPaymentDrawer = (inv?: InvoiceRecord) => {
    const target = inv || invoices.find((i) => i.total > i.paid_amount) || invoices[0];
    if (target) {
      setSelectedInvoiceForPayment(target);
      setPaymentAmount(Math.max(0, target.total - target.paid_amount));
    }
    setIsPaymentDrawerOpen(true);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    if (paymentAmount <= 0) {
      toastError("Invalid Amount", "Please specify a positive payment collection amount.");
      return;
    }

    setSubmittingPayment(true);
    try {
      const amount = Number(paymentAmount);
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== selectedInvoiceForPayment.id) return inv;
          const newPaid = Math.min(inv.total, inv.paid_amount + amount);
          return {
            ...inv,
            paid_amount: newPaid,
            status: newPaid >= inv.total ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
          };
        })
      );

      const newLedgerEntry: LedgerEntry = {
        id: `led-${Date.now()}`,
        timestamp: new Date().toISOString().split("T")[0],
        client_name: selectedInvoiceForPayment.client_name,
        particulars: `Payment Received via ${paymentMode.replace(/_/g, " ")} (${txnRef || "NEFT"})`,
        debit: 0,
        credit: amount,
        balance: Math.max(0, selectedInvoiceForPayment.total - selectedInvoiceForPayment.paid_amount - amount),
      };

      setLedger((prev) => [newLedgerEntry, ...prev]);
      success(
        "Payment Recorded",
        `Credited ₹${amount.toLocaleString("en-IN")} from ${selectedInvoiceForPayment.client_name} towards ${selectedInvoiceForPayment.invoice_number}.`
      );
      setIsPaymentDrawerOpen(false);
      setTxnRef("");
    } catch (err: any) {
      toastError("Payment Failed", err.message || "Failed to record payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDraftInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === draftClientId) || {
      organization_name: "Commercial Client",
    };

    const sub = Number(draftSubtotal) || 10000;
    const cgst = +(sub * 0.09).toFixed(2);
    const sgst = +(sub * 0.09).toFixed(2);
    const total = +(sub + cgst + sgst).toFixed(2);
    const invNum = `INV-2026-000${invoices.length + 1}`;
    const ordNum = draftOrderNum || `ORD-2026-000${orders.length + 1}`;

    const newInv: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoice_number: invNum,
      order_number: ordNum,
      client_name: client.organization_name,
      subtotal: sub,
      cgst,
      sgst,
      total,
      paid_amount: 0,
      status: InvoiceStatus.ISSUED,
      due_date: draftDueDate || "2026-10-05",
    };

    setInvoices((prev) => [newInv, ...prev]);

    const newLedger: LedgerEntry = {
      id: `led-${Date.now()}`,
      timestamp: new Date().toISOString().split("T")[0],
      client_name: client.organization_name,
      particulars: `Tax Invoice #${invNum} (Order ${ordNum}) - 18% GST`,
      debit: total,
      credit: 0,
      balance: total,
    };
    setLedger((prev) => [newLedger, ...prev]);

    success("Tax Invoice Issued", `Created ${invNum} for ${client.organization_name} — ₹${total.toLocaleString("en-IN")}`);
    setIsDraftInvoiceDrawerOpen(false);
  };

  if (loading && orders.length === 0) {
    return <LoadingState message="Connecting to production floor telemetry..." />;
  }

  if (error && orders.length === 0) {
    return <ErrorState message={error.message} onRetry={onRefresh} />;
  }

  // Calculate compact metrics
  const activeOrders = orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED");
  const atRiskOrders = activeOrders.filter(
    (o) => o.priority === OrderPriority.HIGH || o.priority === OrderPriority.URGENT
  );
  const activeTasks = tasks.filter((t) => t.status !== TaskStatus.DONE);
  const overdueTasks = tasks.filter(
    (t) => t.status === TaskStatus.BLOCKED || (t.due_date && new Date(t.due_date) < new Date())
  );
  const pendingApprovals = approvals.filter((a) => a.status === "PENDING");

  // Needs Attention items
  const needsAttentionList = [
    ...(atRiskOrders.length > 0
      ? atRiskOrders.map((o) => {
          const client = clients.find((c) => c.id === o.client_id);
          return {
            id: `order-${o.id}`,
            type: "order" as const,
            title: `Order ${o.order_number}`,
            subtitle: `${client?.organization_name || "Client Order"} — High Urgency Priority`,
            targetId: o.id,
            urgent: true,
          };
        })
      : [
          {
            id: "sample-ord",
            type: "order" as const,
            title: "Order #ORD-2026-0001",
            subtitle: "St. Xavier's High School — Prepress Artwork awaiting signoff",
            targetId: orders[0]?.id || "order-1",
            urgent: true,
          },
        ]),
    ...(overdueTasks.length > 0
      ? overdueTasks.map((t) => ({
          id: `task-${t.id}`,
          type: "task" as const,
          title: `Task ${t.task_code || t.title}`,
          subtitle: `${t.title} — Requires line operator action`,
          targetId: t.id,
          urgent: t.status === TaskStatus.BLOCKED,
        }))
      : [
          {
            id: "sample-task",
            type: "task" as const,
            title: "Task TSK-DES-9CB135",
            subtitle: "Lanyard Artwork & Repeat Setup — Due today for sublimation run",
            targetId: tasks[0]?.id || "task-1",
            urgent: false,
          },
        ]),
    {
      id: "stock-alert-1",
      type: "stock" as const,
      title: "PVC Sheet Stock Alert",
      subtitle: "Physical: 1,200 | Reserved: 300 | Available: 900 (Safety Min: 1,000)",
      targetId: "pvc-sheet",
      urgent: true,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Header with live operational status */}
      <PageHeader
        title="Home"
        badge={
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              color: "var(--accent-text)",
              backgroundColor: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
              borderRadius: "4px",
              padding: "3px 8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--accent)",
              }}
            />
            Factory Workstation Live
          </span>
        }
        secondaryActions={
          <Button variant="secondary" icon="refresh" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />

      <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Compact Quick Actions Bar */}
        <div
          style={{
            backgroundColor: "rgba(19, 23, 34, 0.8)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "4px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "var(--text-muted)",
                marginRight: "4px",
              }}
            >
              Quick Actions
            </span>

            {hasPerm("orders:create") && (
              <Button
                variant="primary"
                size="sm"
                icon="plus"
                onClick={onNewOrder}
              >
                New Order
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              icon="tasks"
              onClick={onNewTask ? onNewTask : () => onNavigateSection?.("tasks")}
            >
              New Task
            </Button>

            {hasPerm("clients:create") && (
              <Button
                variant="secondary"
                size="sm"
                icon="clients"
                onClick={onNewClient}
              >
                New Client
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              icon="quotations"
              onClick={onNewQuotation ? onNewQuotation : () => onNavigateSection?.("clients")}
            >
              New Quotation
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon="stock"
              onClick={onStockEntry ? onStockEntry : () => onNavigateSection?.("stock")}
            >
              Stock Entry
            </Button>

            {/* Record Payment directly opens slide-in Drawer */}
            <Button
              variant="secondary"
              size="sm"
              icon="billing"
              onClick={() => handleOpenPaymentDrawer()}
              style={{
                backgroundColor: "var(--accent-soft)",
                borderColor: "var(--accent-border)",
                color: "var(--accent-text)",
              }}
            >
              Record Payment
            </Button>

            {/* Draft Tax Invoice directly opens slide-in Drawer */}
            <Button
              variant="secondary"
              size="sm"
              icon="document"
              onClick={() => setIsDraftInvoiceDrawerOpen(true)}
              style={{
                backgroundColor: "var(--accent-soft)",
                borderColor: "var(--accent-border)",
                color: "var(--accent-text)",
              }}
            >
              Draft Invoice
            </Button>
          </div>
        </div>

        {/* TODAY: Compact Operational Digest */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {/* Tasks block */}
          <div
            onClick={() => onNavigateSection?.("tasks")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.78)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderLeft: "3px solid var(--accent)",
              borderRadius: "4px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
          >
            <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Tasks
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                {activeTasks.length}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>active</span>
            </div>
            <div style={{ fontSize: "10.5px", color: overdueTasks.length > 0 ? "var(--status-error)" : "var(--text-muted)" }}>
              {overdueTasks.length} overdue
            </div>
          </div>

          {/* Orders block */}
          <div
            onClick={() => onNavigateSection?.("orders")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.78)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
          >
            <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Orders
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                {activeOrders.length}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>active</span>
            </div>
            <div style={{ fontSize: "10.5px", color: atRiskOrders.length > 0 ? "var(--status-warning)" : "var(--text-muted)" }}>
              {atRiskOrders.length} at risk
            </div>
          </div>

          {/* Approvals block */}
          <div
            onClick={() => onNavigateSection?.("tasks")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.78)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
          >
            <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Approvals
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                {pendingApprovals.length}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>waiting</span>
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
              Proofs & signoffs
            </div>
          </div>

          {/* Stock block */}
          <div
            onClick={() => onNavigateSection?.("stock")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.78)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
          >
            <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Stock
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                1
              </span>
              <span style={{ fontSize: "11px", color: "var(--status-warning)" }}>low item</span>
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
              PVC Sheet threshold
            </div>
          </div>

          {/* Dispatch block */}
          <div
            onClick={() => onNavigateSection?.("tasks")}
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.78)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
          >
            <span style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Dispatch
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                5
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>today</span>
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
              Tracked consignments
            </div>
          </div>
        </div>

        {/* 2-Column Core: Needs Attention & Recent Work */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Needs Attention Feed */}
          <Card
            title="Needs Attention"
            headerAction={
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: "rgba(255, 138, 115, 0.12)",
                  color: "var(--accent-text)",
                  border: "1px solid var(--accent-border)",
                  padding: "2px 7px",
                  borderRadius: "3px",
                }}
              >
                {needsAttentionList.length} Items
              </span>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {needsAttentionList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.type === "order") onSelectOrder(item.targetId);
                    else if (item.type === "task") onSelectTask(item.targetId);
                    else if (item.type === "stock") onSelectStock ? onSelectStock(item.targetId) : onNavigateSection?.("stock");
                  }}
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "rgba(14, 18, 26, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-border)";
                    e.currentTarget.style.backgroundColor = "rgba(25, 32, 47, 0.85)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
                    e.currentTarget.style.backgroundColor = "rgba(14, 18, 26, 0.7)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: item.urgent ? "var(--status-error)" : "var(--status-warning)",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <Icon name="chevron-right" size={13} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </Card>

          {/* Active Operations / Today's Orders */}
          <Card
            title="Active Factory Orders"
            headerAction={
              <button
                type="button"
                onClick={() => onNavigateSection?.("orders")}
                style={{
                  fontSize: "11px",
                  color: "var(--accent-text)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                View all in Orders →
              </button>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {activeOrders.length === 0 ? (
                <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: "12px", textAlign: "center" }}>
                  All orders complete and dispatched.
                </div>
              ) : (
                activeOrders.slice(0, 4).map((order) => {
                  const client = clients.find((c) => c.id === order.client_id);
                  const deliveryDate = order.promised_delivery_date
                    ? new Date(order.promised_delivery_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                    : "Flexible";

                  return (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder(order.id)}
                      style={{
                        padding: "10px 12px",
                        backgroundColor: "rgba(14, 18, 26, 0.7)",
                        border: "1px solid rgba(255, 255, 255, 0.07)",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent-border)";
                        e.currentTarget.style.backgroundColor = "rgba(25, 32, 47, 0.85)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
                        e.currentTarget.style.backgroundColor = "rgba(14, 18, 26, 0.7)";
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color: "var(--accent-text)" }}>
                            {order.order_number}
                          </span>
                          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                            {client?.organization_name || "Client Order"}
                          </span>
                        </div>
                        <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                          Due: {deliveryDate} • ₹{Number(order.total_amount || 0).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontFamily: "var(--font-mono)",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            backgroundColor: "rgba(255, 255, 255, 0.04)",
                            color: "var(--text-secondary)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          {order.status}
                        </span>
                        <Icon name="chevron-right" size={13} color="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* ─── MERGED INVOICES & BILLING HUB SECTION ─────────────────────────── */}
        <div
          style={{
            backgroundColor: "rgba(19, 23, 34, 0.78)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "6px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* Invoices Header Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
              paddingBottom: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 138, 115, 0.12)",
                  border: "1px solid var(--accent-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-text)",
                }}
              >
                <Icon name="billing" size={18} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#fff" }}>
                    Invoices & Financial Ledger
                  </h3>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--accent-text)",
                      backgroundColor: "rgba(255, 138, 115, 0.12)",
                      border: "1px solid var(--accent-border)",
                      padding: "2px 7px",
                      borderRadius: "3px",
                    }}
                  >
                    GST Compliant
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                  Centralized tax invoicing, customer payments, and audited receivables ledger
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Toggle Tab */}
              <Tabs
                variant="pill"
                size="sm"
                activeTab={activeFinanceTab}
                onChange={(id) => setActiveFinanceTab(id as any)}
                tabs={[
                  { id: "invoices", label: "Tax Invoices", badge: invoices.length },
                  { id: "ledger", label: "Audit Ledger", badge: ledger.length },
                ]}
              />

              <Button
                variant="secondary"
                size="sm"
                icon="plus"
                onClick={() => setIsDraftInvoiceDrawerOpen(true)}
              >
                Draft Invoice
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon="billing"
                onClick={() => handleOpenPaymentDrawer()}
              >
                Record Payment
              </Button>
            </div>
          </div>

          {/* Financial Metrics Strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            <div
              style={{
                padding: "12px 14px",
                backgroundColor: "rgba(14, 18, 26, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                Total Invoiced
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff", marginTop: "3px" }}>
                ₹{totalBilled.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {invoices.length} billing cycles
              </div>
            </div>

            <div
              style={{
                padding: "12px 14px",
                backgroundColor: "rgba(14, 18, 26, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "#10b981" }}>
                Collected to Date
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#10b981", marginTop: "3px" }}>
                ₹{totalCollected.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {Math.round((totalCollected / (totalBilled || 1)) * 100)}% realization rate
              </div>
            </div>

            <div
              style={{
                padding: "12px 14px",
                backgroundColor: "rgba(14, 18, 26, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--accent-text)" }}>
                Outstanding Receivables
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-text)", marginTop: "3px" }}>
                ₹{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {activeInvoicesCount} invoices pending
              </div>
            </div>

            <div
              style={{
                padding: "12px 14px",
                backgroundColor: "rgba(14, 18, 26, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                Payment Status
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff", marginTop: "3px" }}>
                {invoices.filter((i) => i.status === InvoiceStatus.PAID).length} / {invoices.length}
              </div>
              <div style={{ fontSize: "10.5px", color: "#10b981", marginTop: "2px" }}>
                Fully settled accounts
              </div>
            </div>
          </div>

          {/* Subview 1: Tax Invoices */}
          {activeFinanceTab === "invoices" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Filter & Search Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <Tabs
                  variant="pill"
                  size="sm"
                  activeTab={invoiceFilter}
                  onChange={(f) => setInvoiceFilter(f as any)}
                  tabs={[
                    { id: "all", label: "All", badge: invoices.length },
                    { id: "outstanding", label: "Outstanding Due", badge: activeInvoicesCount },
                    { id: "paid", label: "Fully Paid", badge: invoices.filter((i) => i.status === InvoiceStatus.PAID).length },
                  ]}
                />

                <div style={{ position: "relative", width: "240px" }}>
                  <input
                    type="text"
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    placeholder="Search invoices, clients..."
                    style={{
                      width: "100%",
                      padding: "6px 10px 6px 28px",
                      fontSize: "12px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(10, 13, 19, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                  <div style={{ position: "absolute", left: "8px", top: "7px", color: "var(--text-muted)" }}>
                    <Icon name="search" size={13} />
                  </div>
                </div>
              </div>

              {/* Invoices Table */}
              <div
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  backgroundColor: "rgba(12, 15, 23, 0.6)",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                        color: "var(--text-muted)",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      <th style={{ padding: "10px 14px" }}>Invoice #</th>
                      <th style={{ padding: "10px 14px" }}>Client Account</th>
                      <th style={{ padding: "10px 14px" }}>Due Date</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Total</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Paid</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Balance Due</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                          No tax invoices found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => {
                        const bal = inv.total - inv.paid_amount;
                        const isPaid = inv.status === InvoiceStatus.PAID;

                        return (
                          <tr
                            key={inv.id}
                            style={{
                              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                              transition: "background-color 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <td style={{ padding: "11px 14px" }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
                                {inv.invoice_number}
                              </span>
                            </td>

                            <td style={{ padding: "11px 14px" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{inv.client_name}</span>
                                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                                  Order {inv.order_number}
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: "11px 14px", color: "var(--text-secondary)" }}>
                              {inv.due_date}
                            </td>

                            <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                              ₹{inv.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>

                            <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 600 }}>
                              ₹{inv.paid_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>

                            <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: bal > 0 ? "var(--accent-text)" : "var(--text-muted)" }}>
                              ₹{bal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>

                            <td style={{ padding: "11px 14px", textAlign: "center" }}>
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  padding: "2px 7px",
                                  borderRadius: "3px",
                                  backgroundColor: isPaid ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 138, 115, 0.15)",
                                  color: isPaid ? "#10b981" : "var(--accent-text)",
                                  border: isPaid ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--accent-border)",
                                }}
                              >
                                {inv.status}
                              </span>
                            </td>

                            <td style={{ padding: "11px 14px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                {bal > 0 && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleOpenPaymentDrawer(inv)}
                                    style={{
                                      height: "26px",
                                      padding: "0 8px",
                                      fontSize: "11px",
                                      backgroundColor: "var(--accent-soft)",
                                      color: "var(--accent-text)",
                                      borderColor: "var(--accent-border)",
                                    }}
                                  >
                                    Record Payment
                                  </Button>
                                )}
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => success("PDF Downloaded", `Tax Invoice ${inv.invoice_number} saved to Downloads.`)}
                                  style={{ height: "26px", padding: "0 8px", fontSize: "11px" }}
                                >
                                  PDF
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subview 2: Double-entry Audit Ledger */}
          {activeFinanceTab === "ledger" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                Append-only financial transaction ledger. Every invoice debit and customer credit is timestamped.
              </div>

              <div
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  backgroundColor: "rgba(12, 15, 23, 0.6)",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                        color: "var(--text-muted)",
                        fontSize: "11px",
                        textTransform: "uppercase",
                      }}
                    >
                      <th style={{ padding: "10px 14px" }}>Date</th>
                      <th style={{ padding: "10px 14px" }}>Client</th>
                      <th style={{ padding: "10px 14px" }}>Particulars & Reference</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Debit (₹)</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Credit (₹)</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((entry) => (
                      <tr
                        key={entry.id}
                        style={{
                          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        <td style={{ padding: "10px 14px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                          {entry.timestamp}
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {entry.client_name}
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>
                          {entry.particulars}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: entry.debit > 0 ? "var(--accent-text)" : "var(--text-muted)" }}>
                          {entry.debit > 0 ? `₹${entry.debit.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: entry.credit > 0 ? "#10b981" : "var(--text-muted)" }}>
                          {entry.credit > 0 ? `₹${entry.credit.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                          ₹{entry.balance.toLocaleString("en-IN")}
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

      {/* ─── 1. RECORD PAYMENT DRAWER (SLIDE-OVER FROM RIGHT) ───────────────── */}
      <Drawer
        isOpen={isPaymentDrawerOpen}
        onClose={() => setIsPaymentDrawerOpen(false)}
        title="Record Invoice Payment"
        subtitle="Post client collection credit to financial audit ledger"
        width={500}
      >
        {selectedInvoiceForPayment && (
          <form onSubmit={handleRecordPaymentSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Target invoice selection */}
            <Select
              label="Select Invoice / Account"
              value={selectedInvoiceForPayment.id}
              onChange={(val) => {
                const found = invoices.find((i) => i.id === val);
                if (found) {
                  setSelectedInvoiceForPayment(found);
                  setPaymentAmount(Math.max(0, found.total - found.paid_amount));
                }
              }}
              options={invoices.map((i) => ({
                value: i.id,
                label: `${i.invoice_number} • ${i.client_name} (Due: ₹${(i.total - i.paid_amount).toLocaleString("en-IN")})`,
              }))}
            />

            {/* Current Financial State Card */}
            <div
              style={{
                padding: "12px 14px",
                backgroundColor: "rgba(10, 13, 19, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Total Invoice Amount:</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                  ₹{selectedInvoiceForPayment.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Previously Paid:</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 600 }}>
                  ₹{selectedInvoiceForPayment.paid_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  paddingTop: "6px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--accent-text)" }}>Outstanding Receivable:</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent-text)" }}>
                  ₹{(selectedInvoiceForPayment.total - selectedInvoiceForPayment.paid_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <Input
              label="Collection Amount (₹)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              placeholder="Enter amount received"
              required
            />

            <Select
              label="Payment Channel / Instrument"
              value={paymentMode}
              onChange={(val) => setPaymentMode(val)}
              options={[
                { value: "NEFT_BANK_TRANSFER", label: "NEFT / RTGS Bank Direct" },
                { value: "INSTANT_UPI", label: "Instant UPI (BHIM / PhonePe / GPay)" },
                { value: "CHEQUE_CLEARANCE", label: "Account Payee Cheque" },
                { value: "PLANT_CASH_VOUCHER", label: "Plant Cash Receipt Voucher" },
              ]}
            />

            <Input
              label="Bank UTR / Transaction Reference"
              type="text"
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
              placeholder="e.g. UTR2901849182 / UPI Ref"
            />

            {/* Projected Remaining Balance */}
            <div
              style={{
                padding: "10px 12px",
                backgroundColor: "rgba(255, 138, 115, 0.08)",
                border: "1px solid var(--accent-border)",
                borderRadius: "4px",
                fontSize: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--text-primary)" }}>Balance After This Payment:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent-text)" }}>
                ₹{Math.max(0, (selectedInvoiceForPayment.total - selectedInvoiceForPayment.paid_amount) - paymentAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <Button type="button" variant="secondary" onClick={() => setIsPaymentDrawerOpen(false)} fullWidth>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submittingPayment} fullWidth>
                Post Payment & Settle
              </Button>
            </div>
          </form>
        )}
      </Drawer>

      {/* ─── 2. DRAFT TAX INVOICE DRAWER (SLIDE-OVER FROM RIGHT) ─────────────── */}
      <Drawer
        isOpen={isDraftInvoiceDrawerOpen}
        onClose={() => setIsDraftInvoiceDrawerOpen(false)}
        title="Draft Tax Invoice"
        subtitle="Generate GST compliant tax invoice and register in audit ledger"
        width={540}
      >
        <form onSubmit={handleDraftInvoiceSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Select
            label="Client Account"
            value={draftClientId}
            onChange={(val) => setDraftClientId(val)}
            options={clients.map((c) => ({
              value: c.id,
              label: c.organization_name,
            }))}
            required
          />

          <Input
            label="Order Number / Reference"
            value={draftOrderNum}
            onChange={(e) => setDraftOrderNum(e.target.value)}
            placeholder="e.g. ORD-2026-0005"
          />

          <Input
            label="Line Items Description"
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
            placeholder="e.g. 2,000 Custom Satin Lanyards + ID Card Holders"
            required
          />

          <Input
            label="Subtotal / Taxable Value (₹)"
            type="number"
            value={draftSubtotal}
            onChange={(e) => setDraftSubtotal(Number(e.target.value))}
            placeholder="Enter taxable amount"
            required
          />

          <Input
            label="Payment Due Date"
            type="date"
            value={draftDueDate}
            onChange={(e) => setDraftDueDate(e.target.value)}
            required
          />

          {/* GST Calculation Preview */}
          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "rgba(10, 13, 19, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
              <span>Taxable Subtotal:</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>
                ₹{Number(draftSubtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
              <span>CGST (9.0%):</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>
                ₹{(Number(draftSubtotal) * 0.09).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
              <span>SGST (9.0%):</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>
                ₹{(Number(draftSubtotal) * 0.09).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "6px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                fontWeight: 700,
                fontSize: "13px",
                color: "var(--accent-text)",
              }}
            >
              <span>Total Invoice Payable (18% GST):</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>
                ₹{(Number(draftSubtotal) * 1.18).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <Button type="button" variant="secondary" onClick={() => setIsDraftInvoiceDrawerOpen(false)} fullWidth>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Issue Tax Invoice
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
