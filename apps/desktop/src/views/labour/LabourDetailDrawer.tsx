import React, { useState } from "react";
import { Labourer, LabourType } from "@officefloww/api-types";
import { LabourService } from "../../api/services";
import { Drawer } from "../../design-system/components/Modal";
import { Button } from "../../design-system/components/Button";
import { Input, Textarea } from "../../design-system/components/Input";
import { Badge } from "../../design-system/components/Badge";
import { useToast } from "../../design-system/components/Toast";

export interface LabourDetailRecord {
  id: string;
  name: string;
  phone: string;
  labour_type: LabourType;
  current_work: string;
  assigned_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  material_held: number;
  material_issued: number;
  material_consumed: number;
  material_returned: number;
  rate_per_unit: number;
  amount_due: number;
}

export interface LabourDetailDrawerProps {
  labourer: LabourDetailRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const LabourDetailDrawer: React.FC<LabourDetailDrawerProps> = ({
  labourer,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { success, error: toastError } = useToast();
  const [issueQty, setIssueQty] = useState<number>(100);
  const [submitGood, setSubmitGood] = useState<number>(0);
  const [submitReject, setSubmitReject] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  if (!labourer) return null;

  const handleIssueMaterial = async () => {
    setLoading(true);
    try {
      await LabourService.issueMaterial({
        labourer_id: labourer.id,
        stock_item_id: "stk-03",
        required_quantity: issueQty,
      });
      success("Material Issued to Wallet", `Issued +${issueQty} hardware fittings to ${labourer.name}.`);
      setIssueQty(100);
      onUpdated();
    } catch (err: any) {
      toastError("Material Issue Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    if (submitGood === 0 && submitReject === 0) {
      toastError("Validation Error", "Please enter output piece counts.");
      return;
    }

    setLoading(true);
    try {
      await LabourService.submitWork({
        labourer_id: labourer.id,
        accepted_quantity: submitGood,
        rejected_quantity: submitReject,
      });
      success("Assembly Work Logged", `Accepted ${submitGood} units, rejected ${submitReject} units.`);
      setSubmitGood(0);
      setSubmitReject(0);
      onUpdated();
    } catch (err: any) {
      toastError("Work Submission Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayout = async () => {
    setLoading(true);
    try {
      await LabourService.generatePayment(labourer.id);
      success("Payout Processed", `Settled ₹${labourer.amount_due.toFixed(2)} payable to ${labourer.name}`);
      onUpdated();
      onClose();
    } catch (err: any) {
      toastError("Payout Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={labourer.name}
      subtitle={`Type: ${labourer.labour_type.replace("_", " ")} • Phone: ${labourer.phone}`}
      width={500}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Close
          </Button>
          {labourer.amount_due > 0 && (
            <Button variant="primary" icon="credit-card" onClick={handleGeneratePayout} loading={loading}>
              Generate Payout (₹{labourer.amount_due.toFixed(2)})
            </Button>
          )}
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Current Work & Compensation */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xs)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Current Assignment:</span>
            <strong style={{ color: "var(--text-primary)" }}>{labourer.current_work}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Piece Rate:</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
              ₹{labourer.rate_per_unit.toFixed(2)} / accepted piece
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Payable Balance:</span>
            <strong style={{ fontFamily: "var(--font-mono)", color: "var(--accent-text)", fontSize: "14px" }}>
              ₹{labourer.amount_due.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* Piece Output Reconciliation */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xs)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
            Piece-Rate Assembly Reconciliation
          </span>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", textAlign: "center" }}>
            <div style={{ backgroundColor: "var(--bg-muted)", padding: "6px", borderRadius: "var(--radius-xs)" }}>
              <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>ASSIGNED</div>
              <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {labourer.assigned_quantity}
              </div>
            </div>
            <div style={{ backgroundColor: "var(--bg-muted)", padding: "6px", borderRadius: "var(--radius-xs)" }}>
              <div style={{ fontSize: "9px", color: "var(--status-success)" }}>ACCEPTED</div>
              <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--status-success)" }}>
                {labourer.accepted_quantity}
              </div>
            </div>
            <div style={{ backgroundColor: "var(--bg-muted)", padding: "6px", borderRadius: "var(--radius-xs)" }}>
              <div style={{ fontSize: "9px", color: "var(--status-error)" }}>REJECTED</div>
              <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--status-error)" }}>
                {labourer.rejected_quantity}
              </div>
            </div>
          </div>
        </div>

        {/* Labour Material Wallet */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--accent-border)",
            borderRadius: "var(--radius-xs)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--accent-text)" }}>
              Material Credit Wallet Balance
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
              {labourer.material_held} pcs held
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", fontSize: "11px", textAlign: "center" }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Issued: </span>
              <strong>{labourer.material_issued}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Consumed: </span>
              <strong>{labourer.material_consumed}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Returned: </span>
              <strong>{labourer.material_returned}</strong>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "8px", display: "flex", gap: "6px" }}>
            <Input
              placeholder="Issue qty..."
              type="number"
              value={issueQty}
              onChange={(e) => setIssueQty(Number(e.target.value))}
              min={1}
            />
            <Button size="sm" variant="outline" onClick={handleIssueMaterial} loading={loading}>
              Issue Hardware
            </Button>
          </div>
        </div>

        {/* Log Piece Submission */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xs)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
            Receive & QC Finished Assembly Output
          </span>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Input
              label="Accepted Good (+)"
              type="number"
              value={submitGood}
              onChange={(e) => setSubmitGood(Number(e.target.value))}
              min={0}
            />
            <Input
              label="Defective / Scrapped (+)"
              type="number"
              value={submitReject}
              onChange={(e) => setSubmitReject(Number(e.target.value))}
              min={0}
            />
          </div>

          <Button size="sm" variant="secondary" onClick={handleSubmitWork} loading={loading}>
            Sign Off QC Pieces
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
