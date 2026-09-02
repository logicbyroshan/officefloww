import React, { useState } from "react";
import { AutomationRule, AutomationLog } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Tabs } from "../../design-system/components/Tabs";
import { Card, StatBox } from "../../design-system/components/Card";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";

const SEED_RULES: AutomationRule[] = [
  {
    id: "rul-01",
    name: "Auto-Reserve Stock on Order Confirmation",
    description: "Automatically reserves BOM components in warehouse stock when an order is confirmed",
    trigger_event: "order.confirmed",
    is_active: true,
    execution_count: 24,
    created_at: "2026-08-15",
  },
  {
    id: "rul-02",
    name: "Lock Artwork on Proof Approval",
    description: "Cryptographically freezes file version checksum when client approval is recorded",
    trigger_event: "approval.approved",
    is_active: true,
    execution_count: 18,
    created_at: "2026-08-18",
  },
  {
    id: "rul-03",
    name: "Notify Production Manager on Step Blocker",
    description: "Sends immediate floor notification when a machine operator flags a material blocker",
    trigger_event: "task.blocked",
    is_active: true,
    execution_count: 5,
    created_at: "2026-08-20",
  },
];

const SEED_LOGS: AutomationLog[] = [
  {
    id: "log-01",
    rule_id: "rul-01",
    event_name: "order.confirmed",
    idempotency_key: "idem-ord-01-conf",
    status: "SUCCESS",
    created_at: "2026-09-02T09:30:05Z",
  },
  {
    id: "log-02",
    rule_id: "rul-02",
    event_name: "approval.approved",
    idempotency_key: "idem-app-01-lock",
    status: "SUCCESS",
    created_at: "2026-09-02T10:15:02Z",
  },
];

export const AutomationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"rules" | "logs">("rules");
  const [rules] = useState<AutomationRule[]>(SEED_RULES);
  const [logs] = useState<AutomationLog[]>(SEED_LOGS);

  const ruleColumns: Column<AutomationRule>[] = [
    {
      key: "name",
      header: "Automation Rule Name & Description",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.name}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            {r.description}
          </div>
        </div>
      ),
    },
    {
      key: "trigger_event",
      header: "Trigger Event",
      width: "180px",
      render: (r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-text)" }}>
          {r.trigger_event}
        </span>
      ),
    },
    {
      key: "execution_count",
      header: "Executions",
      align: "right",
      width: "120px",
      render: (r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
          {r.execution_count} runs
        </span>
      ),
    },
    {
      key: "is_active",
      header: "State",
      width: "120px",
      render: (r) => (
        <Badge variant={r.is_active ? "success" : "muted"} dot>
          {r.is_active ? "Active" : "Disabled"}
        </Badge>
      ),
    },
  ];

  const logColumns: Column<AutomationLog>[] = [
    {
      key: "created_at",
      header: "Timestamp",
      width: "140px",
      render: (l) => (
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {new Date(l.created_at).toLocaleTimeString()}
        </span>
      ),
    },
    {
      key: "event_name",
      header: "Event Name",
      width: "180px",
      render: (l) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-text)" }}>
          {l.event_name}
        </span>
      ),
    },
    {
      key: "idempotency_key",
      header: "Idempotency Key (Deduplication)",
      render: (l) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
          {l.idempotency_key || "None"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      render: (l) => <Badge variant={l.status === "SUCCESS" ? "success" : "error"} dot>{l.status}</Badge>,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Automation Rules & Event Triggers"
        subtitle="Idempotent automated workflows, BOM reservations, artwork proof locking, and notification webhooks."
      />

      <div style={{ padding: "16px 24px 0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
          <StatBox label="Active Rules" value={rules.filter((r) => r.is_active).length} subValue="Automated Triggers" icon="automation" />
          <StatBox label="Executions Today" value="47 Runs" subValue="100% Idempotent" icon="activity" status="success" />
          <StatBox label="Failed Triggers" value="0" subValue="Zero Dropped Webhooks" icon="check-circle" status="success" />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "rules", label: "Active Automation Rules", icon: "automation", badge: rules.length },
          { id: "logs", label: "Execution Audit Logs", icon: "activity", badge: logs.length },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {activeTab === "rules" && (
          <Table
            columns={ruleColumns}
            data={rules}
            keyExtractor={(r) => r.id}
            emptyText="No automation rules configured."
          />
        )}

        {activeTab === "logs" && (
          <Table
            columns={logColumns}
            data={logs}
            keyExtractor={(l) => l.id}
            emptyText="No automation logs recorded."
          />
        )}
      </div>
    </div>
  );
};
