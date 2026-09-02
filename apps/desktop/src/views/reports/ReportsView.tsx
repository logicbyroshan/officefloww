import React, { useState } from "react";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Tabs } from "../../design-system/components/Tabs";
import { Card, StatBox } from "../../design-system/components/Card";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";

interface OrderPerfRow {
  order_number: string;
  client_name: string;
  promised_date: string;
  delivered_date: string;
  on_time: boolean;
  planned_units: number;
  actual_good_units: number;
  scrap_rate: number;
  revenue: number;
}

const SEED_ORDER_PERF: OrderPerfRow[] = [
  {
    order_number: "ORD-2026-0001",
    client_name: "St. Xavier's High School",
    promised_date: "2026-09-05",
    delivered_date: "2026-09-02",
    on_time: true,
    planned_units: 5000,
    actual_good_units: 5000,
    scrap_rate: 2.1,
    revenue: 182500.0,
  },
  {
    order_number: "ORD-2026-0002",
    client_name: "Delhi Public School",
    promised_date: "2026-09-08",
    delivered_date: "In Progress",
    on_time: true,
    planned_units: 5000,
    actual_good_units: 3200,
    scrap_rate: 1.8,
    revenue: 253700.0,
  },
];

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"orders" | "production" | "scrap" | "labour" | "finance">("orders");

  const orderPerfColumns: Column<OrderPerfRow>[] = [
    {
      key: "order_number",
      header: "Order #",
      width: "140px",
      render: (r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          {r.order_number}
        </span>
      ),
    },
    {
      key: "client_name",
      header: "Client Account",
      render: (r) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.client_name}</span>,
    },
    {
      key: "on_time",
      header: "SLA Adherence",
      width: "140px",
      render: (r) => (
        <Badge variant={r.on_time ? "success" : "error"} dot>
          {r.on_time ? "On-Time (Early)" : "Delayed"}
        </Badge>
      ),
    },
    {
      key: "scrap_rate",
      header: "Scrap Rate",
      align: "right",
      width: "120px",
      render: (r) => (
        <span style={{ fontFamily: "var(--font-mono)", color: r.scrap_rate > 3 ? "var(--status-error)" : "var(--status-success)" }}>
          {r.scrap_rate.toFixed(1)}%
        </span>
      ),
    },
    {
      key: "revenue",
      header: "Net Revenue",
      align: "right",
      width: "140px",
      render: (r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
          ₹{r.revenue.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Operational Analytics & Factory Reports"
        subtitle="Cross-domain performance reports across order delivery SLAs, machine throughput, material scrap, and financial collections."
      />

      <div style={{ padding: "16px 24px 0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
          <StatBox label="On-Time Delivery Rate" value="100%" subValue="Target: >98%" icon="clock" status="success" />
          <StatBox label="Average Factory Scrap Rate" value="1.95%" subValue="Below 3.0% Benchmark" icon="activity" status="success" />
          <StatBox label="Total Factory Output YTD" value="150,000 Units" subValue="Printed & Fitted" icon="package" />
          <StatBox label="Operating Margin" value="38.2%" subValue="Gross Margin YTD" icon="trending-up" status="success" />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "orders", label: "Order SLA Performance", icon: "orders" },
          { id: "production", label: "Machine Press Output", icon: "production" },
          { id: "scrap", label: "Material Waste & Scrap", icon: "alert-triangle" },
          { id: "labour", label: "Labour Quality Ranking", icon: "labour" },
          { id: "finance", label: "Revenue & Billing", icon: "billing" },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {activeTab === "orders" && (
          <Card title="Production Order Lifecycle Performance" subtitle="Job delivery speed, SLA compliance, and scrap rate per order">
            <Table
              columns={orderPerfColumns}
              data={SEED_ORDER_PERF}
              keyExtractor={(r) => r.order_number}
              emptyText="No historical orders found."
            />
          </Card>
        )}

        {activeTab === "production" && (
          <Card title="Machine Equipment Productivity & Utilization" subtitle="Throughput metrics for digital presses, sublimation heat calendars, and ultrasonic cutters">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div style={{ padding: "12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Konica Minolta AccurioPress</div>
                <div style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-text)", marginTop: "4px" }}>92.4% OEE</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>18,200 sheets run this week</div>
              </div>

              <div style={{ padding: "12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Rotary Sublimation Press</div>
                <div style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--status-success)", marginTop: "4px" }}>88.1% OEE</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>8,500 meters transferred</div>
              </div>

              <div style={{ padding: "12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Ultrasonic Cutter & Sealer</div>
                <div style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)", marginTop: "4px" }}>95.0% OEE</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>12,000 cuts completed</div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "scrap" && (
          <Card title="Factory Scrap & Trim Defect Analysis">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)" }}>
                <strong>PVC Card Core:</strong> 1.2% Trim Scrap Rate (Below 2.5% Allowance)
              </div>
              <div style={{ padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)" }}>
                <strong>Satin Lanyard Ribbons:</strong> 2.4% Heat Calibration Scrap Rate (Within 3.0% Buffer)
              </div>
              <div style={{ padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)" }}>
                <strong>Dog Hook Fittings:</strong> 0.1% Hardware Breakage Rate (Strict Quality Verified)
              </div>
            </div>
          </Card>
        )}

        {activeTab === "labour" && (
          <Card title="Piece-Rate Contractor Quality & Defect Ranking">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ padding: "12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Ramesh Lanyard Stitching Unit</div>
                <div style={{ fontSize: "11px", color: "var(--status-success)", marginTop: "2px" }}>98.8% Accepted QC Pass Rate (Rank #1)</div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-xs)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Suresh Badge Assembly Workshop</div>
                <div style={{ fontSize: "11px", color: "var(--status-success)", marginTop: "2px" }}>97.5% Accepted QC Pass Rate (Rank #2)</div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "finance" && (
          <Card title="Financial Collections & Realized Revenue">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div><strong>Gross Billed Revenue YTD:</strong> ₹436,200.00</div>
              <div><strong>Collected in Bank Account:</strong> ₹353,700.00</div>
              <div><strong>Outstanding Balance (Active Accounts):</strong> ₹82,500.00</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
