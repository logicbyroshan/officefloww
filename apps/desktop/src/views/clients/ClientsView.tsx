import React, { useState, useMemo } from "react";
import { Client } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
import { SearchInput } from "../../design-system/components/Input";
import { Button } from "../../design-system/components/Button";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";
import { NewClientModal } from "./NewClientModal";

export interface ClientsViewProps {
  clients: Client[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onSelectClient: (clientId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  loading,
  error,
  onRefresh,
  onSelectClient,
}) => {
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  const filteredClients = useMemo(() => {
    return clients.filter(
      (c) =>
        search === "" ||
        c.organization_name.toLowerCase().includes(search.toLowerCase()) ||
        c.client_code.toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, search]);

  const columns: Column<Client>[] = [
    {
      key: "client_code",
      header: "Client Code",
      width: "140px",
      render: (c) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          {c.client_code}
        </span>
      ),
    },
    {
      key: "organization_name",
      header: "Organization Name",
      render: (c) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.organization_name}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {c.contacts?.length || 0} registered contact(s)
          </div>
        </div>
      ),
    },
    {
      key: "tax_identifier",
      header: "GSTIN Identifier",
      width: "160px",
      render: (c) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: c.tax_identifier ? "var(--text-secondary)" : "var(--text-muted)" }}>
          {c.tax_identifier || "Unregistered"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Onboarded",
      width: "130px",
      render: (c) => (
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {new Date(c.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (loading && clients.length === 0) {
    return <LoadingState message="Loading client directories..." />;
  }

  if (error && clients.length === 0) {
    return <ErrorState message={error.message} onRetry={onRefresh} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Commercial Clients Directory"
        subtitle="Manage institutional accounts, GSTIN tax identifiers, delivery addresses, and contact persons."
        primaryAction={{
          label: "Onboard Client",
          icon: "plus",
          onClick: () => setShowNewModal(true),
        }}
        secondaryActions={
          <Button variant="secondary" icon="refresh" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        <div style={{ width: "320px" }}>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder="Search by client name or code..."
          />
        </div>

        <Table
          columns={columns}
          data={filteredClients}
          keyExtractor={(c) => c.id}
          onRowClick={(c) => onSelectClient(c.id)}
          emptyText="No client accounts found matching the query."
        />
      </div>

      <NewClientModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onClientCreated={onRefresh}
      />
    </div>
  );
};
