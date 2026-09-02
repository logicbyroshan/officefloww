import React, { useState } from "react";
import { ProductionBatch, BatchStatus } from "@officefloww/api-types";
import { ProductionService } from "../../api/services";
import { Drawer } from "../../design-system/components/Modal";
import { Button } from "../../design-system/components/Button";
import { Input } from "../../design-system/components/Input";
import { Badge } from "../../design-system/components/Badge";
import { useToast } from "../../design-system/components/Toast";
import { ProgressBar } from "../../design-system/components/QuantityDisplay";

export interface BatchDetailDrawerProps {
  batch: ProductionBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const BatchDetailDrawer: React.FC<BatchDetailDrawerProps> = ({
  batch,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { success, error: toastError } = useToast();
  const [outputGood, setOutputGood] = useState<number>(0);
  const [rejectQty, setRejectQty] = useState<number>(0);
  const [wasteQty, setWasteQty] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  if (!batch) return null;

  const totalInput = batch.input_quantity;
  const currentOutput = batch.output_quantity + outputGood;
  const currentReject = batch.reject_quantity + rejectQty;
  const currentWaste = batch.waste_quantity + wasteQty;
  const totalAccounted = currentOutput + currentReject + currentWaste;
  const scrapRate = totalAccounted > 0 ? ((currentReject + currentWaste) / totalAccounted) * 100 : 0;

  const handleLogRecord = async () => {
    if (outputGood === 0 && rejectQty === 0 && wasteQty === 0) {
      toastError("Validation Error", "Please enter output or defect quantities.");
      return;
    }

    setLoading(true);
    try {
      await ProductionService.logRecord(batch.id, {
        output_quantity: outputGood,
        reject_quantity: rejectQty,
        waste_quantity: wasteQty,
      });

      success("Batch Logged", `Recorded +${outputGood} good, +${rejectQty} defective units.`);
      setOutputGood(0);
      setRejectQty(0);
      setWasteQty(0);
      onUpdated();
      onClose();
    } catch (err: any) {
      toastError("Failed to Log Run", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Batch Run ${batch.batch_number}`}
      subtitle={`Order Item ID: ${batch.order_item_id.slice(0, 14)}...`}
      width={480}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Close
          </Button>
          {batch.status !== BatchStatus.COMPLETED && (
            <Button variant="primary" icon="check" onClick={handleLogRecord} loading={loading}>
              Save Press Run
            </Button>
          )}
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Run Details Box */}
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
            <span style={{ color: "var(--text-muted)" }}>Batch State:</span>
            <Badge variant={batch.status === BatchStatus.COMPLETED ? "success" : "accent"}>{batch.status}</Badge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Machine Reference:</span>
            <strong style={{ color: "var(--text-primary)" }}>{batch.machine_id}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Operator:</span>
            <span style={{ color: "var(--text-secondary)" }}>{batch.operator_id}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Approved Artwork Proof:</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--status-success)" }}>
              🔒 {batch.approved_file_version_id.slice(0, 12)} (Locked)
            </span>
          </div>
        </div>

        {/* Quantities Ledger */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xs)",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
            <span>Batch Quantity Reconciliation</span>
            <span style={{ color: scrapRate > 5 ? "var(--status-error)" : "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              Scrap: {scrapRate.toFixed(1)}%
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", textAlign: "center" }}>
            <div style={{ backgroundColor: "var(--bg-muted)", padding: "6px", borderRadius: "var(--radius-xs)" }}>
              <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>INPUT</div>
              <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{totalInput}</div>
            </div>
            <div style={{ backgroundColor: "var(--bg-muted)", padding: "6px", borderRadius: "var(--radius-xs)" }}>
              <div style={{ fontSize: "9px", color: "var(--status-success)" }}>OUTPUT</div>
              <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--status-success)" }}>{currentOutput}</div>
            </div>
            <div style={{ backgroundColor: "var(--bg-muted)", padding: "6px", borderRadius: "var(--radius-xs)" }}>
              <div style={{ fontSize: "9px", color: "var(--status-error)" }}>REJECT</div>
              <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--status-error)" }}>{currentReject}</div>
            </div>
            <div style={{ backgroundColor: "var(--bg-muted)", padding: "6px", borderRadius: "var(--radius-xs)" }}>
              <div style={{ fontSize: "9px", color: "var(--status-warning)" }}>WASTE</div>
              <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--status-warning)" }}>{currentWaste}</div>
            </div>
          </div>

          <ProgressBar value={currentOutput} max={totalInput || 1} height={6} showPercent />
        </div>

        {/* Log Incremental Machine Run */}
        {batch.status !== BatchStatus.COMPLETED && (
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-xs)",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Log Incremental Press Run Output
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <Input
                label="Good Units (+)"
                type="number"
                value={outputGood}
                onChange={(e) => setOutputGood(Number(e.target.value))}
                min={0}
              />
              <Input
                label="Rejected (+)"
                type="number"
                value={rejectQty}
                onChange={(e) => setRejectQty(Number(e.target.value))}
                min={0}
              />
              <Input
                label="Waste (+)"
                type="number"
                value={wasteQty}
                onChange={(e) => setWasteQty(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
