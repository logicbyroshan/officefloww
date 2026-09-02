import React, { useState } from "react";
import { AuditLog } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { SearchInput } from "../../design-system/components/Input";
import { Card } from "../../design-system/components/Card";
import { Modal } from "../../design-system/components/Modal";
import { Button } from "../../design-system/components/Button";

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: "aud-01",
    actor_id: "user-owner",
    actor_email: "owner@officefloww.com",
    action: "ORDER_CREATED",
    entity: "Order",
    entity_id: "ord-01",
    old_values_json: null,
    new_values_json: { order_number: "ORD-2026-0001", client_id: "cli-01", total_amount: 182500 },
    correlation_id: "corr-101",
    reason: "Client confirmed quotation via email signoff",
    timestamp: "2026-09-02T09:30:00Z",
  },
  {
    id: "aud-02",
    actor_id: "user-manager",
    actor_email: "manager@officefloww.com",
    action: "PROOF_APPROVED_AND_LOCKED",
    entity: "Approval",
    entity_id: "app-01",
    old_values_json: { status: "PENDING", is_locked: false },
    new_values_json: { status: "APPROVED", is_locked: true, version_number: 1 },
    correlation_id: "corr-102",
    reason: "Principal approved color proof v1 via WhatsApp signoff",
    timestamp: "2026-09-02T10:15:00Z",
  },
  {
    id: "aud-03",
    actor_id: "user-machineop",
    actor_email: "machineop@officefloww.com",
    action: "BATCH_RUN_COMPLETED",
    entity: "ProductionBatch",
    entity_id: "bat-01",
    old_values_json: { output_quantity: 0, status: "IN_PROGRESS" },
    new_values_json: { output_quantity: 2500, status: "COMPLETED", scrap_rate_pct: 2.1 },
    correlation_id: "corr-103",
    reason: "Digital press run finished with zero registration drift",
    timestamp: "2026-09-02T11:45:00Z",
  },
  {
    id: "aud-04",
    actor_id: "user-accounts",
    actor_email: "accounts@officefloww.com",
    action: "PAYMENT_RECORDED",
    entity: "Invoice",
    entity_id: "inv-01",
    old_values_json: { paid_amount: 0, status: "ISSUED" },
    new_values_json: { paid_amount: 100000, status: "PARTIALLY_PAID" },
    correlation_id: "corr-104",
    reason: "NEFT deposit received in HDFC Current Account",
    timestamp: "2026-09-02T12:30:00Z",
  },
];

export const AuditView: React.FC = () => {
  const [logs] = useState<AuditLog[]>(SEED_AUDIT_LOGS);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(
    (l) =>
      search === "" ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.actor_email || "").toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<AuditLog>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      width: "140px",
      render: (l) => (
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {new Date(l.timestamp).toLocaleTimeString()}
        </span>
      ),
    },
    {
      key: "actor",
      header: "Actor (Who)",
      width: "180px",
      render: (l) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "12px" }}>
            {l.actor_email?.split("@")[0] || "System"}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{l.actor_email}</div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action (What)",
      width: "200px",
      render: (l) => <Badge variant="accent">{l.action}</Badge>,
    },
    {
      key: "entity",
      header: "Target Entity & ID",
      render: (l) => (
        <div>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{l.entity}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginLeft: "6px" }}>
            ({l.entity_id})
          </span>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Operational Reason / Justification",
      render: (l) => <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{l.reason || "—"}</span>,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Audit Logs & Responsibility Trail"
        subtitle="Cryptographically immutable record of Who, What, When, Before, After, and Reason for all factory and financial transactions."
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        <div style={{ width: "320px" }}>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder="Search by action, actor email, or entity..."
          />
        </div>

        <Table
          columns={columns}
          data={filteredLogs}
          keyExtractor={(l) => l.id}
          onRowClick={(l) => setSelectedLog(l)}
          emptyText="No audit entries match the query."
        />
      </div>

      {/* Inspect Audit Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title="Audit Trail Inspection"
          subtitle={`Event ID: ${selectedLog.id} • Action: ${selectedLog.action}`}
          width={540}
          footer={
            <Button variant="secondary" onClick={() => setSelectedLog(null)}>
              Close
            </Button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Actor: </span>
              <strong>{selectedLog.actor_email}</strong> ({selectedLog.actor_id})
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>When: </span>
              <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Operational Reason: </span>
              <em>{selectedLog.reason}</em>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "6px" }}>
              <div style={{ backgroundColor: "var(--bg-surface)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Before State</div>
                <pre style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(selectedLog.old_values_json || "None (Initial Creation)", null, 2)}
                </pre>
              </div>

              <div style={{ backgroundColor: "var(--bg-surface)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--accent-text)", marginBottom: "4px" }}>After State</div>
                <pre style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(selectedLog.new_values_json || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
