import React, { useState } from "react";
import { Quotation, QuotationStatus, Client, Product, FeasibilityStatus } from "@officefloww/api-types";
import { QuotationsService } from "../../api/services";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Tabs } from "../../design-system/components/Tabs";
import { Card, StatBox } from "../../design-system/components/Card";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { CreateQuotationModal } from "./CreateQuotationModal";
import { useToast } from "../../design-system/components/Toast";
import { Icon } from "../../design-system/components/Icon";

export interface QuotationsViewProps {
  clients: Client[];
  products: Product[];
  onOrderConverted?: (orderId: string) => void;
}

interface MockQuotationViewItem {
  id: string;
  quotation_number: string;
  client_id: string;
  client_name: string;
  item_summary: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: QuotationStatus;
  version: number;
  margin_pct: number;
  feasibility: FeasibilityStatus;
  eta_days: number;
  created_at: string;
}

const SEED_QUOTES: MockQuotationViewItem[] = [
  {
    id: "quo-01",
    quotation_number: "QUO-2026-0001",
    client_id: "cli-01",
    client_name: "St. Xavier's High School",
    item_summary: "2,500 Fused PVC ID Cards + 2,500 Satin Lanyards",
    subtotal: 154661.02,
    tax_amount: 27838.98,
    total_amount: 182500.0,
    status: QuotationStatus.CONVERTED_TO_ORDER,
    version: 1,
    margin_pct: 34.5,
    feasibility: FeasibilityStatus.GREEN,
    eta_days: 7,
    created_at: "2026-08-28",
  },
  {
    id: "quo-02",
    quotation_number: "QUO-2026-0002",
    client_id: "cli-02",
    client_name: "Delhi Public School",
    item_summary: "5,000 Custom Student Badges + Lanyards",
    subtotal: 215000.0,
    tax_amount: 38700.0,
    total_amount: 253700.0,
    status: QuotationStatus.SENT_TO_CLIENT,
    version: 2,
    margin_pct: 38.0,
    feasibility: FeasibilityStatus.GREEN,
    eta_days: 10,
    created_at: "2026-09-01",
  },
  {
    id: "quo-03",
    quotation_number: "QUO-2026-0003",
    client_id: "cli-03",
    client_name: "Tech Mahindra Corporate Campus",
    item_summary: "10,000 Dual-Frequency RFID Smart Cards",
    subtotal: 450000.0,
    tax_amount: 81000.0,
    total_amount: 531000.0,
    status: QuotationStatus.DRAFT,
    version: 1,
    margin_pct: 42.0,
    feasibility: FeasibilityStatus.YELLOW,
    eta_days: 14,
    created_at: "2026-09-02",
  },
];

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  clients,
  products,
  onOrderConverted,
}) => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "converted">("all");
  const [quotes, setQuotes] = useState<MockQuotationViewItem[]>(SEED_QUOTES);
  const [selectedQuote, setSelectedQuote] = useState<MockQuotationViewItem | null>(SEED_QUOTES[1]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);

  const filteredQuotes = quotes.filter((q) => {
    if (activeTab === "active") return q.status === QuotationStatus.SENT_TO_CLIENT || q.status === QuotationStatus.DRAFT;
    if (activeTab === "converted") return q.status === QuotationStatus.CONVERTED_TO_ORDER;
    return true;
  });

  const handleConvertToOrder = async (quote: MockQuotationViewItem) => {
    setConvertLoading(true);
    try {
      setQuotes((prev) =>
        prev.map((q) => (q.id === quote.id ? { ...q, status: QuotationStatus.CONVERTED_TO_ORDER } : q))
      );
      success("Order Instantiated", `Quotation ${quote.quotation_number} converted into active production order ORD-2026-000${quotes.length + 1}!`);
      if (onOrderConverted) {
        onOrderConverted("ord-01");
      }
    } catch (err: any) {
      toastError("Conversion Failed", err.message);
    } finally {
      setConvertLoading(false);
    }
  };

  const columns: Column<MockQuotationViewItem>[] = [
    {
      key: "quotation_number",
      header: "Quotation #",
      width: "150px",
      render: (q) => (
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
            {q.quotation_number}
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "4px" }}>
            v{q.version}
          </span>
        </div>
      ),
    },
    {
      key: "client_name",
      header: "Client & Specifications",
      render: (q) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{q.client_name}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{q.item_summary}</div>
        </div>
      ),
    },
    {
      key: "total_amount",
      header: "Grand Total (GST Inc)",
      align: "right",
      width: "150px",
      render: (q) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
          ₹{q.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "margin",
      header: "Est. Margin",
      align: "right",
      width: "110px",
      render: (q) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--status-success)" }}>
          {q.margin_pct}%
        </span>
      ),
    },
    {
      key: "status",
      header: "Quotation Status",
      width: "150px",
      render: (q) => {
        let variant: "default" | "accent" | "success" | "warning" | "error" = "default";
        if (q.status === QuotationStatus.CONVERTED_TO_ORDER) variant = "success";
        if (q.status === QuotationStatus.SENT_TO_CLIENT) variant = "accent";
        if (q.status === QuotationStatus.DRAFT) variant = "default";
        return <Badge variant={variant} dot>{q.status.replace(/_/g, " ")}</Badge>;
      },
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Commercial Quotations & Costing Engine"
        subtitle="Transparent cost breakdown (BOM materials, labour, machine depreciation, overhead, margin) with dynamic machine feasibility checks."
        primaryAction={{
          label: "New Quotation",
          icon: "plus",
          onClick: () => setIsCreateModalOpen(true),
        }}
      />

      <div style={{ padding: "16px 24px 0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
          <StatBox label="Total Quotes Prepared" value={quotes.length} subValue="Institutional Accounts" icon="quotations" />
          <StatBox label="Active Pipeline Value" value="₹784,700.00" subValue="Pending Conversion" icon="credit-card" status="warning" />
          <StatBox label="Conversion Rate" value="67.5%" subValue="Converted to Production" icon="check-circle" status="success" />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "all", label: "All Quotations", icon: "quotations", badge: quotes.length },
          { id: "active", label: "Active Pipeline", icon: "activity", badge: quotes.filter((q) => q.status !== QuotationStatus.CONVERTED_TO_ORDER).length },
          { id: "converted", label: "Converted Orders", icon: "check-circle", badge: quotes.filter((q) => q.status === QuotationStatus.CONVERTED_TO_ORDER).length },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: selectedQuote ? "1.2fr 1fr" : "1fr", gap: "16px", flex: 1 }}>
        <Table
          columns={columns}
          data={filteredQuotes}
          keyExtractor={(q) => q.id}
          onRowClick={(q) => setSelectedQuote(q)}
          emptyText="No quotations found in this filter."
        />

        {/* Quote Detail / Cost Breakdown Pane */}
        {selectedQuote && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Card
              title={`Cost & Feasibility Analysis — ${selectedQuote.quotation_number}`}
              subtitle={`Client: ${selectedQuote.client_name} • Version v${selectedQuote.version}`}
              headerAction={
                selectedQuote.status !== QuotationStatus.CONVERTED_TO_ORDER && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon="check"
                    onClick={() => handleConvertToOrder(selectedQuote)}
                    loading={convertLoading}
                  >
                    Convert to Order
                  </Button>
                )
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Cost Stack Breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Automated Cost Breakdown
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>1. Raw Materials Cost (BOM Core + Ribbon + Hardware):</span>
                    <strong style={{ fontFamily: "var(--font-mono)" }}>₹{(selectedQuote.subtotal * 0.42).toFixed(2)}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>2. Material Scrap Markup (+3.5% Buffer):</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--status-warning)" }}>+₹{(selectedQuote.subtotal * 0.035).toFixed(2)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>3. Floor Labour (Press Ops & Stitching Fitting):</span>
                    <strong style={{ fontFamily: "var(--font-mono)" }}>₹{(selectedQuote.subtotal * 0.12).toFixed(2)}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>4. Machine Power & Consumable Inks:</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>₹{(selectedQuote.subtotal * 0.08).toFixed(2)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>5. Factory Overheads (8%):</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>₹{(selectedQuote.subtotal * 0.08).toFixed(2)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)" }}>
                    <span style={{ color: "var(--status-success)", fontWeight: 700 }}>Gross Profit Margin ({selectedQuote.margin_pct}%):</span>
                    <strong style={{ fontFamily: "var(--font-mono)", color: "var(--status-success)" }}>
                      ₹{(selectedQuote.subtotal * (selectedQuote.margin_pct / 100)).toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* Feasibility & ETA Engine */}
                <div
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-xs)",
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Dynamic Feasibility & Lead Time
                    </span>
                    <Badge variant="success">FEASIBLE (100%)</Badge>
                  </div>

                  <div style={{ color: "var(--text-secondary)" }}>
                    ✓ Raw stock in warehouse is sufficient for immediate reservation.
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    ✓ Konica AccurioPress capacity available (predicted run time: 4.5 hrs).
                  </div>
                  <div style={{ color: "var(--accent-text)", fontWeight: 600, marginTop: "2px" }}>
                    ⏱ Predicted Turnaround: {selectedQuote.eta_days} Days (Earliest Delivery: Sep 09, 2026)
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <CreateQuotationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        clients={clients}
        products={products}
        onQuotationCreated={(q) => {
          setQuotes((prev) => [
            {
              id: q.id || `quo-0${quotes.length + 1}`,
              quotation_number: q.quotation_number || `QUO-2026-000${quotes.length + 1}`,
              client_id: q.client_id,
              client_name: clients.find((c) => c.id === q.client_id)?.organization_name || "Client",
              item_summary: "Custom Commercial Print Order",
              subtotal: q.subtotal || 50000,
              tax_amount: q.tax_amount || 9000,
              total_amount: q.total_amount || 59000,
              status: QuotationStatus.DRAFT,
              version: 1,
              margin_pct: 35.0,
              feasibility: FeasibilityStatus.GREEN,
              eta_days: 7,
              created_at: new Date().toISOString().split("T")[0],
            },
            ...prev,
          ]);
        }}
      />
    </div>
  );
};
