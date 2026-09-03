import React, { useState } from "react";
import { InvoiceStatus } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
import { Button } from "../../design-system/components/Button";
import { Icon } from "../../design-system/components/Icon";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";

// ─── 1. Tax Invoices Types & Data ─────────────────────────────────────────────
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
];

// ─── 2. Client Ledger Types & Data ────────────────────────────────────────────
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

// ─── 3. Staff Payroll Types & Data ────────────────────────────────────────────
interface StaffPayrollMember {
  id: string;
  name: string;
  role: string;
  department: string;
  baseSalary: number;
  standardHours: number;
  hourlyRate: number;
  idleHours: number;
  idleDeduction: number;
  allowances: number;
  statutoryDeduction: number;
  netPayable: number;
  status: "DUE" | "PAID";
  lastPaidDate?: string;
  bankAccount: string;
}

const SEED_STAFF_PAYROLL: StaffPayrollMember[] = [
  {
    id: "emp-1",
    name: "Priya Sharma",
    role: "Production Lead",
    department: "Floor Operations",
    baseSalary: 28000,
    standardHours: 160,
    hourlyRate: 175,
    idleHours: 18.5,
    idleDeduction: 3238,
    allowances: 7500, // production + overtime + attendance
    statutoryDeduction: 2220, // PF + ESIC
    netPayable: 30042,
    status: "DUE",
    bankAccount: "HDFC •••• 9812",
  },
  {
    id: "emp-2",
    name: "Rahul Verma",
    role: "Graphic Designer",
    department: "Pre-Press & Art Studio",
    baseSalary: 35000,
    standardHours: 160,
    hourlyRate: 219,
    idleHours: 8.0,
    idleDeduction: 1750,
    allowances: 4000,
    statutoryDeduction: 2400,
    netPayable: 34850,
    status: "DUE",
    bankAccount: "SBI •••• 4421",
  },
  {
    id: "emp-3",
    name: "Amit Patel",
    role: "Plant Admin",
    department: "Operations Admin",
    baseSalary: 45000,
    standardHours: 160,
    hourlyRate: 281,
    idleHours: 5.5,
    idleDeduction: 1547,
    allowances: 5000,
    statutoryDeduction: 3200,
    netPayable: 45253,
    status: "DUE",
    bankAccount: "ICICI •••• 1109",
  },
  {
    id: "emp-4",
    name: "Sneha Kulkarni",
    role: "QC Specialist",
    department: "Quality Assurance",
    baseSalary: 26000,
    standardHours: 160,
    hourlyRate: 163,
    idleHours: 12.0,
    idleDeduction: 1950,
    allowances: 3200,
    statutoryDeduction: 2100,
    netPayable: 25150,
    status: "PAID",
    lastPaidDate: "01 Sep 2026",
    bankAccount: "Axis •••• 7731",
  },
  {
    id: "emp-5",
    name: "Vikram Singh",
    role: "Machine Master",
    department: "Thermal & Offset Line",
    baseSalary: 22000,
    standardHours: 160,
    hourlyRate: 138,
    idleHours: 6.0,
    idleDeduction: 825,
    allowances: 6500,
    statutoryDeduction: 1800,
    netPayable: 25875,
    status: "DUE",
    bankAccount: "PNB •••• 5530",
  },
];

interface StaffPayStubHistory {
  id: string;
  month: string;
  employeeName: string;
  gross: number;
  idleDeduction: number;
  allowances: number;
  netPaid: number;
  paidAt: string;
  mode: string;
  status: "PAID";
}

const SEED_STAFF_PAY_HISTORY: StaffPayStubHistory[] = [
  { id: "sph-1", month: "August 2026", employeeName: "Priya Sharma", gross: 28000, idleDeduction: 2100, allowances: 6500, netPaid: 30180, paidAt: "31 Aug 2026", mode: "Direct NEFT", status: "PAID" },
  { id: "sph-2", month: "August 2026", employeeName: "Rahul Verma", gross: 35000, idleDeduction: 1314, allowances: 4000, netPaid: 35286, paidAt: "31 Aug 2026", mode: "Direct NEFT", status: "PAID" },
  { id: "sph-3", month: "July 2026", employeeName: "Priya Sharma", gross: 28000, idleDeduction: 1400, allowances: 7200, netPaid: 31580, paidAt: "31 Jul 2026", mode: "Direct NEFT", status: "PAID" },
  { id: "sph-4", month: "July 2026", employeeName: "Amit Patel", gross: 45000, idleDeduction: 843, allowances: 5000, netPaid: 45957, paidAt: "31 Jul 2026", mode: "Direct NEFT", status: "PAID" },
];

// ─── 4. Labour Payouts Types & Data ───────────────────────────────────────────
interface LabourContractorPayout {
  id: string;
  contractorName: string;
  station: string;
  activeBatch: string;
  client: string;
  pieceRate: number;
  unitsGiven: number;
  unitsDone: number;
  unitsPending: number;
  amountDue: number;
  phone: string;
  status: "DUE" | "SETTLED";
}

const SEED_LABOUR_PAYOUTS: LabourContractorPayout[] = [
  {
    id: "lp-1",
    contractorName: "Ramesh Lanyard Stitching Unit",
    station: "Table 02 (Plant South)",
    activeBatch: "Batch #LN-401 (12mm Double Color)",
    client: "Northwind Coffee",
    pieceRate: 1.5,
    unitsGiven: 2500,
    unitsDone: 2000,
    unitsPending: 500,
    amountDue: 3000.0,
    phone: "+91 98200 44551",
    status: "DUE",
  },
  {
    id: "lp-2",
    contractorName: "Suresh Badge Assembly Workshop",
    station: "Pin Press Table 01",
    activeBatch: "Batch #BD-204 (PVC Round Badges)",
    client: "Govt Engineering College",
    pieceRate: 1.2,
    unitsGiven: 1200,
    unitsDone: 1200,
    unitsPending: 0,
    amountDue: 1440.0,
    phone: "+91 98200 44552",
    status: "DUE",
  },
  {
    id: "lp-3",
    contractorName: "Kailash Hook & Ribbon Crimping",
    station: "Assembly Bay 03",
    activeBatch: "Batch #CR-109 (Dog Hook Crimps)",
    client: "BHEL Township",
    pieceRate: 1.8,
    unitsGiven: 1000,
    unitsDone: 600,
    unitsPending: 400,
    amountDue: 1080.0,
    phone: "+91 98200 44553",
    status: "DUE",
  },
  {
    id: "lp-4",
    contractorName: "Geeta Lanyard Packaging Team",
    station: "Packaging Table 04",
    activeBatch: "Batch #PK-302 (Bundle Strapping)",
    client: "Reliance Retail - Bhopal",
    pieceRate: 0.9,
    unitsGiven: 3000,
    unitsDone: 2800,
    unitsPending: 200,
    amountDue: 2520.0,
    phone: "+91 98200 44554",
    status: "SETTLED",
  },
];

interface LabourSettlementHistory {
  id: string;
  contractorName: string;
  batchOrSchool: string;
  mplType: string;
  qtyPaid: number;
  rate: number;
  amount: number;
  date: string;
  mode: string;
  voucherStatus: "SETTLED";
}

const SEED_LABOUR_SETTLEMENT_HISTORY: LabourSettlementHistory[] = [
  { id: "lsh-1", contractorName: "Ramesh Lanyard Stitching Unit", batchOrSchool: "Northwind Coffee", mplType: "12mm Double Color", qtyPaid: 1500, rate: 1.5, amount: 2250, date: "02 Sep 2026", mode: "Plant Cash Voucher", voucherStatus: "SETTLED" },
  { id: "lsh-2", contractorName: "Ramesh Lanyard Stitching Unit", batchOrSchool: "Govt Engg College", mplType: "15mm Triple Color", qtyPaid: 1000, rate: 1.5, amount: 1500, date: "28 Aug 2026", mode: "Instant UPI", voucherStatus: "SETTLED" },
  { id: "lsh-3", contractorName: "Suresh Badge Assembly Workshop", batchOrSchool: "AIIMS Bhopal", mplType: "10mm Single Color", qtyPaid: 800, rate: 1.2, amount: 960, date: "24 Aug 2026", mode: "Plant Cash Voucher", voucherStatus: "SETTLED" },
  { id: "lsh-4", contractorName: "Geeta Lanyard Packaging Team", batchOrSchool: "Reliance Retail", mplType: "Standard 15mm", qtyPaid: 2800, rate: 0.9, amount: 2520, date: "01 Sep 2026", mode: "Bank NEFT", voucherStatus: "SETTLED" },
];

// ─── 5. General Expenses Data ─────────────────────────────────────────────────
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
    category: "MACHINE_MAINTENANCE",
    description: "Heat press silicone pad replacements",
    amount: 4500.0,
    paid_to: "Bhopal Industrial Spares",
    payment_mode: "UPI",
  },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const BillingView: React.FC = () => {
  const { success, error: toastError } = useToast();

  // Tabs: Invoices, Client Ledger, Staff Payroll, Labour Payouts, Expenses
  const [activeTab, setActiveTab] = useState<"invoices" | "ledger" | "staff_payroll" | "labour_payouts" | "expenses">("invoices");

  // Invoices & Client Ledger states
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(SEED_INVOICES);
  const [ledger, setLedger] = useState<LedgerEntry[]>(SEED_LEDGER);
  const [search, setSearch] = useState("");

  // Record Invoice Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(82500);
  const [paymentMode, setPaymentMode] = useState("NEFT_BANK_TRANSFER");
  const [txnRef, setTxnRef] = useState("");
  const [loading, setLoading] = useState(false);

  // Staff Payroll States
  const [staffPayroll, setStaffPayroll] = useState<StaffPayrollMember[]>(SEED_STAFF_PAYROLL);
  const [staffPayHistory, setStaffPayHistory] = useState<StaffPayStubHistory[]>(SEED_STAFF_PAY_HISTORY);
  const [selectedStaffForPay, setSelectedStaffForPay] = useState<StaffPayrollMember | null>(null);
  const [isStaffPayModalOpen, setIsStaffPayModalOpen] = useState(false);
  const [staffDisburseMethod, setStaffDisburseMethod] = useState<"neft" | "upi" | "cash">("neft");

  // Labour Payouts States
  const [labourPayouts, setLabourPayouts] = useState<LabourContractorPayout[]>(SEED_LABOUR_PAYOUTS);
  const [labourHistory, setLabourHistory] = useState<LabourSettlementHistory[]>(SEED_LABOUR_SETTLEMENT_HISTORY);
  const [selectedLabourForPay, setSelectedLabourForPay] = useState<LabourContractorPayout | null>(null);
  const [isLabourPayModalOpen, setIsLabourPayModalOpen] = useState(false);
  const [labourDisburseMethod, setLabourDisburseMethod] = useState<"cash" | "upi" | "neft">("cash");

  // ─── Calculations ──────────────────────────────────────────────────────────
  const totalReceivables = invoices.reduce((sum, inv) => sum + (inv.total - inv.paid_amount), 0);
  const totalCollections = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);

  const totalStaffPayrollDue = staffPayroll.filter(s => s.status === "DUE").reduce((sum, s) => sum + s.netPayable, 0);
  const totalStaffIdleDeductions = staffPayroll.reduce((sum, s) => sum + s.idleDeduction, 0);
  const staffPaidCount = staffPayroll.filter(s => s.status === "PAID").length;

  const totalLabourDue = labourPayouts.filter(l => l.status === "DUE").reduce((sum, l) => sum + l.amountDue, 0);
  const totalLabourUnitsDone = labourPayouts.reduce((sum, l) => sum + l.unitsDone, 0);
  const labourSettledCount = labourPayouts.filter(l => l.status === "SETTLED").length;

  // ─── Handlers ──────────────────────────────────────────────────────────────
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

  const handleDisburseStaffPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForPay) return;
    const s = selectedStaffForPay;
    setStaffPayroll(prev => prev.map(item => item.id === s.id ? { ...item, status: "PAID", lastPaidDate: "Today" } : item));
    const newStub: StaffPayStubHistory = {
      id: `sph-${Date.now()}`,
      month: "September 2026",
      employeeName: s.name,
      gross: s.baseSalary,
      idleDeduction: s.idleDeduction,
      allowances: s.allowances,
      netPaid: s.netPayable,
      paidAt: "Today (Instant)",
      mode: staffDisburseMethod === "neft" ? "Direct NEFT" : staffDisburseMethod === "upi" ? "Instant UPI" : "Plant Cash Voucher",
      status: "PAID",
    };
    setStaffPayHistory([newStub, ...staffPayHistory]);
    setIsStaffPayModalOpen(false);
    success("Salary Disbursed", `Transferred ₹${s.netPayable.toLocaleString()} to ${s.name} (${s.bankAccount})`);
  };

  const handleDisburseLabourPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabourForPay) return;
    const l = selectedLabourForPay;
    setLabourPayouts(prev => prev.map(item => item.id === l.id ? { ...item, status: "SETTLED" } : item));
    const newRecord: LabourSettlementHistory = {
      id: `lsh-${Date.now()}`,
      contractorName: l.contractorName,
      batchOrSchool: l.client,
      mplType: l.activeBatch,
      qtyPaid: l.unitsDone,
      rate: l.pieceRate,
      amount: l.amountDue,
      date: "Today",
      mode: labourDisburseMethod === "cash" ? "Plant Cash Voucher" : labourDisburseMethod === "upi" ? "Instant UPI" : "Bank NEFT",
      voucherStatus: "SETTLED",
    };
    setLabourHistory([newRecord, ...labourHistory]);
    setIsLabourPayModalOpen(false);
    success("Labour Settlement Cleared", `Paid ₹${l.amountDue.toLocaleString()} to ${l.contractorName}`);
  };

  // ─── Columns ───────────────────────────────────────────────────────────────
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
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          {inv.total > inv.paid_amount && (
            <button
              type="button"
              onClick={() => {
                setSelectedInvoice(inv);
                setPaymentAmount(inv.total - inv.paid_amount);
                setIsPaymentModalOpen(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px 8px",
                borderRadius: "3px",
                backgroundColor: "rgba(255, 138, 115, 0.15)",
                border: "1px solid var(--accent-border)",
                color: "var(--accent-text)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              Collect
            </button>
          )}
          <button
            type="button"
            onClick={() => success("PDF Generated", `Invoice ${inv.invoice_number} downloaded.`)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px 8px",
              borderRadius: "3px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "var(--text-secondary)",
              fontSize: "11px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              lineHeight: 1,
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
            GST & Centralized Workforce Payroll
          </span>
        }
        primaryAction={
          activeTab === "invoices"
            ? {
                label: "Create Invoice",
                icon: "plus",
                onClick: () => success("Drafting Invoice", "Creating new tax invoice."),
              }
            : activeTab === "staff_payroll"
            ? {
                label: "Disburse All Staff Due",
                icon: "credit-card",
                onClick: () => success("Batch Payroll", `Batch disbursing ₹${totalStaffPayrollDue.toLocaleString()} to employees.`),
              }
            : activeTab === "labour_payouts"
            ? {
                label: "Disburse All Labour Accruals",
                icon: "credit-card",
                onClick: () => success("Labour Settlement", `Disbursing ₹${totalLabourDue.toLocaleString()} in piece-rate vouchers.`),
              }
            : undefined
        }
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* ─── KPI Balance Tiles (Dynamically change based on active Tab) ──────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {activeTab === "staff_payroll" ? (
            <>
              <div style={{ padding: "12px 16px", backgroundColor: "rgba(19, 23, 34, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Pending Staff Payroll Due
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-text)", marginTop: "4px" }}>
                  ₹{totalStaffPayrollDue.toLocaleString()}
                </div>
              </div>

              <div style={{ padding: "12px 16px", backgroundColor: "rgba(19, 23, 34, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#f87171" }}>
                  Telemetry Inactivity Deductions
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#f87171", marginTop: "4px" }}>
                  -₹{totalStaffIdleDeductions.toLocaleString()}
                </div>
              </div>

              <div style={{ padding: "12px 16px", backgroundColor: "rgba(19, 23, 34, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#34d399" }}>
                  Staff Members Disbursed
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff", marginTop: "4px" }}>
                  {staffPaidCount} of {staffPayroll.length} Paid
                </div>
              </div>
            </>
          ) : activeTab === "labour_payouts" ? (
            <>
              <div style={{ padding: "12px 16px", backgroundColor: "rgba(19, 23, 34, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#c084fc" }}>
                  Pending Piece-Rate Payouts
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#c084fc", marginTop: "4px" }}>
                  ₹{totalLabourDue.toLocaleString()}
                </div>
              </div>

              <div style={{ padding: "12px 16px", backgroundColor: "rgba(19, 23, 34, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Total Lanyards / Badges Assembled
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#34d399", marginTop: "4px" }}>
                  {totalLabourUnitsDone.toLocaleString()} Units
                </div>
              </div>

              <div style={{ padding: "12px 16px", backgroundColor: "rgba(19, 23, 34, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Contractors Settled
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff", marginTop: "4px" }}>
                  {labourSettledCount} of {labourPayouts.length} Settled
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: "12px 16px", backgroundColor: "rgba(19, 23, 34, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Total Outstanding Receivables
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-text)", marginTop: "4px" }}>
                  ₹{totalReceivables.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ padding: "12px 16px", backgroundColor: "rgba(19, 23, 34, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Total Collected (Month to Date)
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#10b981", marginTop: "4px" }}>
                  ₹{totalCollections.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ padding: "12px 16px", backgroundColor: "rgba(19, 23, 34, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Invoices Awaiting Payment
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff", marginTop: "4px" }}>
                  {invoices.filter((i) => i.status !== InvoiceStatus.PAID).length} Active
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── Navigation Tabs Bar ────────────────────────────────────────────── */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {[
              { id: "invoices" as const, label: "Tax Invoices", icon: "billing" as const },
              { id: "ledger" as const, label: "Client Ledger", icon: "file-text" as const },
              { id: "staff_payroll" as const, label: "Staff Payroll", icon: "users" as const, badge: totalStaffPayrollDue > 0 ? `₹${(totalStaffPayrollDue / 1000).toFixed(0)}k Due` : undefined },
              { id: "labour_payouts" as const, label: "Labour Payouts", icon: "package" as const, badge: totalLabourDue > 0 ? `₹${(totalLabourDue / 1000).toFixed(1)}k Due` : undefined },
              { id: "expenses" as const, label: "Expenses & Outflow", icon: "trending-up" as const },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "3px",
                  border: "none",
                  backgroundColor:
                    activeTab === tab.id ? "rgba(255, 138, 115, 0.14)" : "transparent",
                  color: activeTab === tab.id ? "var(--accent-text)" : "var(--text-secondary)",
                  fontSize: "12.5px",
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                <Icon name={tab.icon} size={14} color={activeTab === tab.id ? "var(--accent-text)" : "currentColor"} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "2px",
                      backgroundColor: "rgba(255, 138, 115, 0.2)",
                      color: "var(--accent-text)",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
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
              placeholder={
                activeTab === "staff_payroll"
                  ? "Search employee, role..."
                  : activeTab === "labour_payouts"
                  ? "Search contractor, batch..."
                  : "Search invoices, clients..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "12.5px",
                outline: "none",
                width: "210px",
              }}
            />
          </div>
        </div>

        {/* ─── TAB 1: CLIENT LEDGER ───────────────────────────────────────────── */}
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
        ) : activeTab === "staff_payroll" ? (
          /* ─── TAB 2: STAFF PAYROLL (Hourly & Inactivity Engine) ─────────────── */
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Live Staff Payroll Table */}
            <div
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "#fff" }}>Monthly Employee Compensation & Inactivity Deductions</strong>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    Calculates live salary on an hourly basis: gross earnings minus non-active desktop telemetry time.
                  </div>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Cycle: September 2026</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.25)", color: "var(--text-muted)", fontSize: "10.5px", textTransform: "uppercase" }}>
                    <th style={{ padding: "10px 16px" }}>Personnel</th>
                    <th style={{ padding: "10px 14px" }}>Base Salary</th>
                    <th style={{ padding: "10px 14px", textAlign: "center" }}>Hourly Benchmark</th>
                    <th style={{ padding: "10px 14px", color: "#f87171" }}>Idle Deductions</th>
                    <th style={{ padding: "10px 14px", color: "#34d399" }}>Allowances</th>
                    <th style={{ padding: "10px 14px", color: "#f87171" }}>PF & ESIC</th>
                    <th style={{ padding: "10px 16px", textAlign: "right" }}>Net Disbursable</th>
                    <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "10px 16px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPayroll.map((emp) => (
                    <tr key={emp.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <strong style={{ color: "#fff", fontSize: "13px" }}>{emp.name}</strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{emp.role} • {emp.department}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", color: "#fff" }}>
                        ₹{emp.baseSalary.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        ₹{emp.hourlyRate}/hr
                      </td>
                      <td style={{ padding: "12px 14px", color: "#f87171", fontFamily: "var(--font-mono)" }}>
                        -₹{emp.idleDeduction.toLocaleString()}
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{emp.idleHours}h idle</div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#34d399", fontFamily: "var(--font-mono)" }}>
                        +₹{emp.allowances.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#f87171", fontFamily: "var(--font-mono)" }}>
                        -₹{emp.statutoryDeduction.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "14px", color: "#34d399" }}>
                        ₹{emp.netPayable.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: "2px",
                            backgroundColor: emp.status === "PAID" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                            color: emp.status === "PAID" ? "#10b981" : "#f59e0b",
                          }}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {emp.status === "DUE" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaffForPay(emp);
                              setIsStaffPayModalOpen(true);
                            }}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "2px",
                              backgroundColor: "#2563eb",
                              border: "none",
                              color: "#fff",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Pay Salary →
                          </button>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Paid ({emp.lastPaidDate})</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Historical Disbursed Pay Stubs */}
            <div
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <strong style={{ fontSize: "13.5px", color: "#fff" }}>Historical Disbursed Pay Stubs</strong>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "var(--text-muted)", fontSize: "10.5px", textTransform: "uppercase" }}>
                    <th style={{ padding: "10px 16px" }}>Period</th>
                    <th style={{ padding: "10px 16px" }}>Employee</th>
                    <th style={{ padding: "10px 14px" }}>Gross Base</th>
                    <th style={{ padding: "10px 14px", color: "#f87171" }}>Idle Deductions</th>
                    <th style={{ padding: "10px 14px", color: "#34d399" }}>Allowances</th>
                    <th style={{ padding: "10px 16px", textAlign: "right" }}>Net Disbursed</th>
                    <th style={{ padding: "10px 14px" }}>Disbursement Date</th>
                    <th style={{ padding: "10px 14px" }}>Mode</th>
                    <th style={{ padding: "10px 14px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPayHistory.map((rec) => (
                    <tr key={rec.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "11px 16px", fontWeight: 700, color: "#fff" }}>{rec.month}</td>
                      <td style={{ padding: "11px 16px", color: "var(--text-secondary)" }}>{rec.employeeName}</td>
                      <td style={{ padding: "11px 14px", fontFamily: "var(--font-mono)" }}>₹{rec.gross.toLocaleString()}</td>
                      <td style={{ padding: "11px 14px", color: "#f87171", fontFamily: "var(--font-mono)" }}>-₹{rec.idleDeduction.toLocaleString()}</td>
                      <td style={{ padding: "11px 14px", color: "#34d399", fontFamily: "var(--font-mono)" }}>+₹{rec.allowances.toLocaleString()}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#34d399" }}>
                        ₹{rec.netPaid.toLocaleString()}
                      </td>
                      <td style={{ padding: "11px 14px", color: "var(--text-secondary)" }}>{rec.paidAt}</td>
                      <td style={{ padding: "11px 14px", color: "var(--text-secondary)" }}>{rec.mode}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "2px", backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "labour_payouts" ? (
          /* ─── TAB 3: LABOUR PAYOUTS (Piece-Rate Payouts & Settlements) ─────── */
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Live Labour Accruals Table */}
            <div
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "#fff" }}>Contract Labour Piece-Rate Payouts & Settlements</strong>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    Calculates per-unit payout for assembled multicolor lanyards, holders, hooks, and pin badges.
                  </div>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Current Queue Settlement</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.25)", color: "var(--text-muted)", fontSize: "10.5px", textTransform: "uppercase" }}>
                    <th style={{ padding: "10px 16px" }}>Contractor Unit</th>
                    <th style={{ padding: "10px 14px" }}>Batch / Order</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Rate / Unit</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Given Units</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Assembled</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Pending</th>
                    <th style={{ padding: "10px 16px", textAlign: "right" }}>Total Accrual</th>
                    <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "10px 16px", textAlign: "right" }}>Disbursement</th>
                  </tr>
                </thead>
                <tbody>
                  {labourPayouts.map((lab) => (
                    <tr key={lab.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <strong style={{ color: "#fff", fontSize: "13px" }}>{lab.contractorName}</strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{lab.station} • {lab.phone}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{lab.client}</span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{lab.activeBatch}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "center", fontFamily: "var(--font-mono)", color: "#a78bfa" }}>
                        ₹{lab.pieceRate.toFixed(2)}
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "center", fontFamily: "var(--font-mono)", color: "#fff" }}>
                        {lab.unitsGiven.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#10b981" }}>
                        {lab.unitsDone.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "center", fontFamily: "var(--font-mono)", color: lab.unitsPending > 0 ? "#f59e0b" : "#10b981" }}>
                        {lab.unitsPending.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "14px", color: "#34d399" }}>
                        ₹{lab.amountDue.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: "2px",
                            backgroundColor: lab.status === "SETTLED" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                            color: lab.status === "SETTLED" ? "#10b981" : "#f59e0b",
                          }}
                        >
                          {lab.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {lab.status === "DUE" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLabourForPay(lab);
                              setIsLabourPayModalOpen(true);
                            }}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "2px",
                              backgroundColor: "#a855f7",
                              backgroundImage: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                              border: "none",
                              color: "#fff",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Pay Payout →
                          </button>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Historical Labour Settlement Ledger */}
            <div
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <strong style={{ fontSize: "13.5px", color: "#fff" }}>Historical Labour Settlement Ledger</strong>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "var(--text-muted)", fontSize: "10.5px", textTransform: "uppercase" }}>
                    <th style={{ padding: "10px 16px" }}>Contractor</th>
                    <th style={{ padding: "10px 16px" }}>Client / Order</th>
                    <th style={{ padding: "10px 14px" }}>Item Specification</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Qty Settled</th>
                    <th style={{ padding: "10px 16px", textAlign: "right" }}>Settlement Amount</th>
                    <th style={{ padding: "10px 14px" }}>Date</th>
                    <th style={{ padding: "10px 14px" }}>Mode</th>
                    <th style={{ padding: "10px 14px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {labourHistory.map((lh) => (
                    <tr key={lh.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "11px 16px", fontWeight: 700, color: "#fff" }}>{lh.contractorName}</td>
                      <td style={{ padding: "11px 16px", color: "var(--text-secondary)" }}>{lh.batchOrSchool}</td>
                      <td style={{ padding: "11px 14px", color: "var(--text-secondary)", fontSize: "11.5px" }}>{lh.mplType}</td>
                      <td style={{ padding: "11px 12px", textAlign: "center", fontFamily: "var(--font-mono)" }}>{lh.qtyPaid.toLocaleString()} pcs</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#34d399" }}>
                        ₹{lh.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: "11px 14px", color: "var(--text-secondary)" }}>{lh.date}</td>
                      <td style={{ padding: "11px 14px", color: "var(--text-secondary)" }}>{lh.mode}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "2px", backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                          {lh.voucherStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "expenses" ? (
          /* ─── TAB 4: EXPENSES & DISBURSEMENTS ──────────────────────────────── */
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
          /* ─── TAB 5: MAIN INVOICES TABLE ───────────────────────────────────── */
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

      {/* ─── MODAL 1: RECORD INVOICE PAYMENT ─────────────────────────────────── */}
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

      {/* ─── MODAL 2: DISBURSE STAFF SALARY ──────────────────────────────────── */}
      {isStaffPayModalOpen && selectedStaffForPay && (
        <Modal
          isOpen={isStaffPayModalOpen}
          onClose={() => setIsStaffPayModalOpen(false)}
          title={`Disburse Staff Salary: ${selectedStaffForPay.name}`}
        >
          <form onSubmit={handleDisburseStaffPay} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Employee:</span>
                <strong style={{ color: "#fff" }}>{selectedStaffForPay.name} ({selectedStaffForPay.role})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Bank Account:</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{selectedStaffForPay.bankAccount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Base Gross:</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>₹{selectedStaffForPay.baseSalary.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#f87171" }}>
                <span>Inactivity ({selectedStaffForPay.idleHours}h @ ₹{selectedStaffForPay.hourlyRate}/hr):</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>-₹{selectedStaffForPay.idleDeduction.toLocaleString()}</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#fff" }}>Net Payout:</span>
                <strong style={{ fontSize: "20px", color: "#34d399", fontFamily: "var(--font-mono)" }}>
                  ₹{selectedStaffForPay.netPayable.toLocaleString()}
                </strong>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Disbursement Channel</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {[
                  { id: "neft" as const, label: "Direct NEFT / RTGS" },
                  { id: "upi" as const, label: "Instant UPI Payout" },
                  { id: "cash" as const, label: "Plant Cash Voucher" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setStaffDisburseMethod(m.id)}
                    style={{
                      padding: "8px",
                      borderRadius: "2px",
                      border: "1px solid " + (staffDisburseMethod === m.id ? "var(--accent-border)" : "rgba(255,255,255,0.1)"),
                      backgroundColor: staffDisburseMethod === m.id ? "rgba(255, 138, 115, 0.15)" : "transparent",
                      color: staffDisburseMethod === m.id ? "var(--accent-text)" : "var(--text-secondary)",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <Button variant="secondary" size="md" style={{ borderRadius: "2px" }} onClick={() => setIsStaffPayModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" style={{ borderRadius: "2px" }}>
                Confirm & Disburse ₹{selectedStaffForPay.netPayable.toLocaleString()}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL 3: DISBURSE LABOUR PIECE-RATE PAYOUT ───────────────────────── */}
      {isLabourPayModalOpen && selectedLabourForPay && (
        <Modal
          isOpen={isLabourPayModalOpen}
          onClose={() => setIsLabourPayModalOpen(false)}
          title={`Disburse Labour Settlement: ${selectedLabourForPay.contractorName}`}
        >
          <form onSubmit={handleDisburseLabourPay} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Contractor Unit:</span>
                <strong style={{ color: "#fff" }}>{selectedLabourForPay.contractorName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Batch:</span>
                <span style={{ color: "var(--text-secondary)" }}>{selectedLabourForPay.activeBatch}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Units Done:</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "#10b981" }}>{selectedLabourForPay.unitsDone.toLocaleString()} pcs × ₹{selectedLabourForPay.pieceRate.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#fff" }}>Settlement Amount:</span>
                <strong style={{ fontSize: "20px", color: "#34d399", fontFamily: "var(--font-mono)" }}>
                  ₹{selectedLabourForPay.amountDue.toLocaleString()}
                </strong>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Disbursement Method</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {[
                  { id: "cash" as const, label: "Plant Cash Voucher" },
                  { id: "upi" as const, label: "Instant UPI Payout" },
                  { id: "neft" as const, label: "Bank NEFT Transfer" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setLabourDisburseMethod(m.id)}
                    style={{
                      padding: "8px",
                      borderRadius: "2px",
                      border: "1px solid " + (labourDisburseMethod === m.id ? "var(--accent-border)" : "rgba(255,255,255,0.1)"),
                      backgroundColor: labourDisburseMethod === m.id ? "rgba(255, 138, 115, 0.15)" : "transparent",
                      color: labourDisburseMethod === m.id ? "var(--accent-text)" : "var(--text-secondary)",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <Button variant="secondary" size="md" style={{ borderRadius: "2px" }} onClick={() => setIsLabourPayModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" style={{ borderRadius: "2px" }}>
                Confirm & Settle ₹{selectedLabourForPay.amountDue.toLocaleString()}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
