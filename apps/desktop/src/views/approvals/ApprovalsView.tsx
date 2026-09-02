import React, { useState } from "react";
import { Approval, ApprovalStatus } from "@officefloww/api-types";
import { ApprovalsService } from "../../api/services";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Modal } from "../../design-system/components/Modal";
import { Textarea } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";

export interface ApprovalsViewProps {
  approvals: Approval[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  approvals,
  loading,
  error,
  onRefresh,
}) => {
  const { success, error: toastError } = useToast();
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [comments, setComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleApprove = async (approval: Approval) => {
    setActionLoading(true);
    try {
      await ApprovalsService.approve(approval.id, comments || "Approved via desktop interface");
      success("Artwork Proof Approved", "The file version is locked and production batching is unlocked.");
      setSelectedApproval(null);
      setComments("");
      onRefresh();
    } catch (err: any) {
      toastError("Failed to Approve Proof", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (approval: Approval) => {
    if (!comments.trim()) {
      toastError("Feedback Required", "Please provide reasons/instructions for artwork revision.");
      return;
    }
    setActionLoading(true);
    try {
      await ApprovalsService.reject(approval.id, comments);
      success("Revision Requested", "Designer has been notified to upload a revised file version.");
      setSelectedApproval(null);
      setComments("");
      onRefresh();
    } catch (err: any) {
      toastError("Failed to Request Revision", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Approval>[] = [
    {
      key: "id",
      header: "Approval Request",
      width: "160px",
      render: (a) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          {a.id.slice(0, 13)}...
        </span>
      ),
    },
    {
      key: "order_id",
      header: "Order Context",
      render: (a) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            Order ID: {a.order_id.slice(0, 14)}...
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            File Version: {a.file_version_id ? a.file_version_id.slice(0, 10) : "Latest Draft"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Approval State",
      width: "140px",
      render: (a) => {
        if (a.status === ApprovalStatus.APPROVED) return <Badge variant="success" dot>Approved</Badge>;
        if (a.status === ApprovalStatus.REJECTED) return <Badge variant="error" dot>Changes Requested</Badge>;
        return <Badge variant="warning" dot>Pending Review</Badge>;
      },
    },
    {
      key: "requested_at",
      header: "Submitted Date",
      width: "140px",
      render: (a) => (
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {new Date(a.requested_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      width: "180px",
      render: (a) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
          <Button size="sm" variant="outline" onClick={() => setSelectedApproval(a)}>
            Review Proof
          </Button>
        </div>
      ),
    },
  ];

  if (loading && approvals.length === 0) {
    return <LoadingState message="Loading approval queue..." />;
  }

  if (error && approvals.length === 0) {
    return <ErrorState message={error.message} onRetry={onRefresh} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Artwork & Client Proof Approvals"
        subtitle="Formal approval gate enforcing the Production File Lock before press batching."
        secondaryActions={
          <Button variant="secondary" icon="refresh" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        <Table
          columns={columns}
          data={approvals}
          keyExtractor={(a) => a.id}
          onRowClick={(a) => setSelectedApproval(a)}
          emptyText="No pending approval requests. All artwork versions are up to date."
        />
      </div>

      {/* Review Proof Modal */}
      {selectedApproval && (
        <Modal
          isOpen={Boolean(selectedApproval)}
          onClose={() => setSelectedApproval(null)}
          title="Artwork Proof Review & Version Lock"
          subtitle={`Approval ID: ${selectedApproval.id}`}
          width={520}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <Button variant="secondary" onClick={() => setSelectedApproval(null)} disabled={actionLoading}>
                Cancel
              </Button>
              {selectedApproval.status === ApprovalStatus.PENDING && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button
                    variant="danger"
                    onClick={() => handleReject(selectedApproval)}
                    loading={actionLoading}
                  >
                    Request Changes
                  </Button>
                  <Button
                    variant="primary"
                    icon="check"
                    onClick={() => handleApprove(selectedApproval)}
                    loading={actionLoading}
                  >
                    Approve & Lock
                  </Button>
                </div>
              )}
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-xs)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "12px",
              }}
            >
              <div>
                <span style={{ color: "var(--text-muted)" }}>Order ID: </span>
                <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {selectedApproval.order_id}
                </strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Submitted On: </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {new Date(selectedApproval.requested_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Current Status: </span>
                <Badge variant={selectedApproval.status === ApprovalStatus.APPROVED ? "success" : "warning"}>
                  {selectedApproval.status}
                </Badge>
              </div>
            </div>

            <Textarea
              label="Manager / Client Feedback Notes"
              placeholder="Enter approval confirmation or detailed change requests..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
