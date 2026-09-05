import React, { useState, useMemo } from "react";
import { Icon } from "../../design-system/components/Icon";
import { Button } from "../../design-system/components/Button";
import { Modal } from "../../design-system/components/Modal";
import { Input } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";
import { LabourContractor } from "./LabourView";
import {
  useSharedOrders,
  parseSupportingItemsFromDescription,
  LABOUR_CONTRACTORS,
  MaterialHolding,
  OrderRecord,
} from "../orders/OrdersWorkspaceView";

export interface LabourDetailProfileViewProps {
  contractor: LabourContractor;
  onBack: () => void;
}

// ─── Small stat tile ──────────────────────────────────────────────────────────
const StatTile: React.FC<{ label: string; value: string; sub?: string; color?: string }> = ({
  label,
  value,
  sub,
  color = "#fff",
}) => (
  <div
    style={{
      backgroundColor: "rgba(19, 23, 34, 0.85)",
      backdropFilter: "blur(14px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "4px",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: "3px",
    }}
  >
    <span style={{ fontSize: "9.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {label}
    </span>
    <strong style={{ fontSize: "20px", fontWeight: 800, color, fontFamily: "var(--font-mono)", lineHeight: 1 }}>
      {value}
    </strong>
    {sub && <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{sub}</span>}
  </div>
);

export const LabourDetailProfileView: React.FC<LabourDetailProfileViewProps> = ({
  contractor,
  onBack,
}) => {
  const { success } = useToast();
  const [sharedOrders, setSharedOrders] = useSharedOrders();

  // Match initial contractor buffer holdings from workspace defaults or contractor prop
  const matchedDefault = useMemo(() => {
    return LABOUR_CONTRACTORS.find(
      (c) =>
        c.name.toLowerCase().includes(contractor.name.toLowerCase()) ||
        contractor.name.toLowerCase().includes(c.name.toLowerCase()) ||
        c.id === contractor.id
    );
  }, [contractor]);

  const defaultHoldings: MaterialHolding[] = useMemo(() => {
    if (contractor.materialHoldings && contractor.materialHoldings.length > 0) {
      return contractor.materialHoldings;
    }
    if (matchedDefault?.materialHoldings && matchedDefault.materialHoldings.length > 0) {
      return matchedDefault.materialHoldings;
    }
    return [
      { item: "Dog Hook", qtyOnHand: 500, unit: "pieces", details: "Standard nickel hooks on workbench" },
      { item: "16mm Lanyard Rolls", qtyOnHand: 2, unit: "rolls", details: "Satin ribbon rolls in table drawer" },
      { item: "Clips", qtyOnHand: 1, unit: "packets of 1000", details: "1 packet of 1000 badge clips on workbench" },
      { item: "Safety Jointer Buckles", qtyOnHand: 1, unit: "packets of 1000", details: "1 packet of 1000 breakaway jointers on workbench" },
    ];
  }, [contractor, matchedDefault]);

  // Mutable state for Contractor Stock Buffer ("Things Already With Contractor")
  const [bufferHoldings, setBufferHoldings] = useState<MaterialHolding[]>(defaultHoldings);

  // Modals
  const [showAddBufferModal, setShowAddBufferModal] = useState(false);
  const [showEditContractModal, setShowEditContractModal] = useState(false);
  const [editStation, setEditStation] = useState(contractor.workstation);

  // New Buffer Stock form states
  const [newBufferItem, setNewBufferItem] = useState("Dog Hook");
  const [newBufferQty, setNewBufferQty] = useState("200");
  const [newBufferUnit, setNewBufferUnit] = useState<"pieces" | "packets of 1000" | "rolls">("pieces");
  const [newBufferDetails, setNewBufferDetails] = useState("Buffer lot staged at workbench");

  // Handover confirmation log
  const [handoverLogs, setHandoverLogs] = useState<
    { date: string; summary: string; itemsCount: number }[]
  >([
    {
      date: "01 Sep 2026",
      summary: "Dispensed 1,500 Dog Hooks & 8 rolls 16mm Ribbon for Northwind Coffee",
      itemsCount: 2,
    },
  ]);

  // ─── Active Assigned Orders for this Contractor ──────────────────────────────
  const assignedJobs = useMemo(() => {
    return sharedOrders.filter((o) =>
      o.assignedTo?.some(
        (w) =>
          w.name.toLowerCase().includes(contractor.name.toLowerCase()) ||
          contractor.name.toLowerCase().includes(w.name.toLowerCase()) ||
          w.contractorId === contractor.id ||
          w.id === contractor.id
      )
    );
  }, [sharedOrders, contractor]);

  // Get specific allocated quantity for this contractor on an order
  const getContractorAllocatedQty = (order: OrderRecord) => {
    const match = order.assignedTo?.find(
      (w) =>
        w.name.toLowerCase().includes(contractor.name.toLowerCase()) ||
        contractor.name.toLowerCase().includes(w.name.toLowerCase())
    );
    return match?.allocatedQty ?? order.qty;
  };

  // Total units allocated across active orders
  const totalAllocatedUnits = useMemo(() => {
    return assignedJobs.reduce((sum, order) => sum + getContractorAllocatedQty(order), 0);
  }, [assignedJobs]);

  // ─── Aggregated Material Requirements for Assigned Jobs ─────────────────────
  // For each job, parse supporting items with the allocated quantity and aggregate
  const aggregatedRequirements = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        category: string;
        canonicalUnit: string;
        packSize: number;
        unitDisplay: string;
        icon: string;
        badgeBg: string;
        badgeColor: string;
        badgeBorder: string;
        totalPieces: number;
        requiredPacks: number;
        orderCount: number;
      }
    >();

    assignedJobs.forEach((order) => {
      const allocatedQty = getContractorAllocatedQty(order);
      const items = parseSupportingItemsFromDescription(
        order.product,
        order.itemOrdered || "Lanyard",
        allocatedQty
      );

      items.forEach((item) => {
        const key = item.name.toLowerCase().trim();
        const existing = map.get(key);
        if (existing) {
          existing.totalPieces += item.totalPieces;
          existing.requiredPacks += item.requiredPacks;
          existing.orderCount += 1;
        } else {
          map.set(key, {
            name: item.name,
            category: item.category,
            canonicalUnit: item.canonicalUnit,
            packSize: item.packSize,
            unitDisplay: item.unitDisplay,
            icon: item.icon,
            badgeBg: item.badgeBg,
            badgeColor: item.badgeColor,
            badgeBorder: item.badgeBorder,
            totalPieces: item.totalPieces,
            requiredPacks: item.requiredPacks,
            orderCount: 1,
          });
        }
      });
    });

    return Array.from(map.values());
  }, [assignedJobs]);

  // ─── Live Handover Reconciliation (Requirements vs Contractor Buffer) ────────
  const handoverReconciliation = useMemo(() => {
    return aggregatedRequirements.map((req) => {
      const norm = req.name.toLowerCase().trim();
      const matchedHolding = bufferHoldings.find((h) => {
        const hNorm = h.item.toLowerCase().trim();
        if (hNorm === norm) return true;
        if (hNorm.includes(norm) || norm.includes(hNorm)) return true;
        if (req.category === "HOOKS" && hNorm.includes("hook")) return true;
        if (req.category === "LANYARDS" && hNorm.includes("roll")) return true;
        if (req.category === "HOLDERS" && (hNorm.includes("holder") || hNorm.includes("pouch") || hNorm.includes("dst") || hNorm.includes("crystal"))) return true;
        if (req.category === "OTHERS" && req.name.includes("Clip") && hNorm.includes("clip")) return true;
        if (req.category === "OTHERS" && (req.name.includes("Jointer") || req.name.includes("Buckle")) && (hNorm.includes("jointer") || hNorm.includes("buckle"))) return true;
        return false;
      });

      let heldPacks = 0;
      let heldPieces = 0;

      if (matchedHolding) {
        if (req.packSize === 1000) {
          if (matchedHolding.unit.includes("packet") || matchedHolding.unit.includes("1000")) {
            heldPacks = matchedHolding.qtyOnHand;
            heldPieces = heldPacks * 1000;
          } else {
            heldPieces = matchedHolding.qtyOnHand;
            heldPacks = Math.floor(heldPieces / 1000);
          }
        } else if (req.packSize === 200) {
          heldPacks = matchedHolding.qtyOnHand;
          heldPieces = heldPacks * 200;
        } else {
          heldPacks = matchedHolding.qtyOnHand;
          heldPieces = matchedHolding.qtyOnHand;
        }
      }

      const netPacksToIssue = Math.max(0, req.requiredPacks - heldPacks);
      const netPiecesToIssue = Math.max(0, req.totalPieces - heldPieces);
      const isFullyCovered = netPacksToIssue === 0;

      return {
        ...req,
        heldPacks,
        heldPieces,
        heldUnitDisplay: matchedHolding ? matchedHolding.unit : req.canonicalUnit,
        netPacksToIssue,
        netPiecesToIssue,
        isFullyCovered,
        matchedHolding,
      };
    });
  }, [aggregatedRequirements, bufferHoldings]);

  // Handover action
  const handleDispenseMaterials = () => {
    const pendingItems = handoverReconciliation.filter((m) => !m.isFullyCovered);
    if (pendingItems.length === 0) {
      success(
        "Buffer Covers All Materials",
        `All required materials for ${contractor.name} are 100% covered by their table buffer. 0 factory stock issue required.`
      );
      return;
    }

    const summaryStr = pendingItems
      .map((m) => `${m.netPacksToIssue.toLocaleString()} ${m.unitDisplay} ${m.name}`)
      .join(", ");

    setHandoverLogs((prev) => [
      {
        date: "Today, Just Now",
        summary: `Dispensed: ${summaryStr}`,
        itemsCount: pendingItems.length,
      },
      ...prev,
    ]);

    success(
      "Warehouse Stock Handover Recorded",
      `Dispensed and handed over to ${contractor.name}: ${summaryStr}. Factory inventory updated.`
    );
  };

  // Add / Adjust Buffer stock handler
  const handleAddBufferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(newBufferQty, 10) || 100;
    if (qty <= 0) return;

    setBufferHoldings((prev) => {
      const existingIdx = prev.findIndex(
        (h) => h.item.toLowerCase() === newBufferItem.toLowerCase()
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qtyOnHand: updated[existingIdx].qtyOnHand + qty,
          details: newBufferDetails || updated[existingIdx].details,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            item: newBufferItem,
            qtyOnHand: qty,
            unit: newBufferUnit,
            details: newBufferDetails,
          },
        ];
      }
    });

    setShowAddBufferModal(false);
    success(
      "Buffer Stock Updated",
      `Added ${qty.toLocaleString()} ${newBufferUnit} of ${newBufferItem} to ${contractor.name}'s buffer holding.`
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>

      {/* ─── HEADER BAR ──────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "12px 24px",
          backgroundColor: "rgba(14, 18, 26, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Button
            variant="secondary"
            size="sm"
            icon="chevron-left"
            onClick={onBack}
          >
            Back to Contract Labour
          </Button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>
              {contractor.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "2px",
                backgroundColor: "rgba(249, 115, 22, 0.15)",
                color: "#fb923c",
              }}
            >
              Labour Profile & Stock Buffer
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            variant="secondary"
            size="sm"
            style={{ borderRadius: "3px" }}
            onClick={() => setShowEditContractModal(true)}
          >
            Edit Workstation
          </Button>
          <Button
            variant="primary"
            size="sm"
            style={{ borderRadius: "3px", backgroundColor: "var(--accent)", border: "none" }}
            onClick={() => setShowAddBufferModal(true)}
          >
            + Add Buffer Stock
          </Button>
        </div>
      </div>

      {/* =========================================================================
          MAIN WORKSPACE LAYOUT (3-COLUMN DOSSIER / JOBS / BUFFER & HANDOVER)
          ========================================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "250px 1fr 340px",
          gap: "20px",
          padding: "20px 24px",
          alignItems: "start",
        }}
      >
        {/* ── COL 1: Contractor Dossier ── */}
        <div
          style={{
            backgroundColor: "rgba(19, 23, 34, 0.85)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "4px",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "4px",
              background: "linear-gradient(135deg, rgba(249,115,22,0.3) 0%, rgba(194,65,12,0.2) 100%)",
              border: "1px solid rgba(249,115,22,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 800,
              color: "#fb923c",
              fontFamily: "var(--font-mono)",
            }}
          >
            {contractor.name.slice(0, 1).toUpperCase()}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#fff", margin: 0 }}>
              {contractor.name}
            </h2>
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
              {matchedDefault?.specialty || "Lanyard Stitching & Assembly"}
            </span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "3px 7px",
                borderRadius: "2px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {contractor.id.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "3px 7px",
                borderRadius: "2px",
                backgroundColor: "rgba(16,185,129,0.15)",
                color: "#10b981",
              }}
            >
              ● On Run
            </span>
          </div>

          {/* Details list */}
          <div
            style={{
              width: "100%",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              textAlign: "left",
            }}
          >
            {[
              { label: "Workstation", val: contractor.workstation, color: "#fb923c" },
              { label: "Rate / Pc", val: `₹${(matchedDefault?.ratePerPiece || contractor.pieceRate || 1.5).toFixed(2)}`, color: "#10b981", mono: true },
              { label: "Phone", val: contractor.phone || matchedDefault?.phone || "+91 98260 11420", mono: true },
              { label: "Active Jobs", val: `${assignedJobs.length} orders`, color: "#fff" },
              { label: "Total Volume", val: `${totalAllocatedUnits.toLocaleString()} units`, color: "#fff", mono: true },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px" }}>
                <span style={{ color: "var(--text-muted)" }}>{r.label}:</span>
                <strong style={{ color: r.color || "#fff", fontFamily: r.mono ? "var(--font-mono)" : undefined }}>
                  {r.val}
                </strong>
              </div>
            ))}
          </div>

          {/* Compensation summary */}
          <div
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "10px 12px",
              borderRadius: "4px",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: "9.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Estimated Labour Payable
            </div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#34d399", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
              ₹{(totalAllocatedUnits * (matchedDefault?.ratePerPiece || contractor.pieceRate || 1.5)).toFixed(2)}
            </div>
            <div style={{ fontSize: "9.5px", color: "var(--text-muted)", marginTop: "2px" }}>
              Strictly Q_accepted @ piece-rate (material scrap mathematically excluded)
            </div>
          </div>
        </div>

        {/* ── COL 2: Active Assigned Jobs + Warehouse Handover Calculator ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* SECTION 1: Active Assigned Production Jobs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px" }}>📋</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>
                  Active Assigned Jobs ({assignedJobs.length})
                </span>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                  (Synced reactively from Orders Workspace)
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "#fb923c", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {totalAllocatedUnits.toLocaleString()} units allocated
              </span>
            </div>

            {assignedJobs.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  backgroundColor: "rgba(19, 23, 34, 0.7)",
                  border: "1px dashed rgba(255, 255, 255, 0.12)",
                  borderRadius: "4px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "12.5px",
                }}
              >
                No active orders currently assigned to {contractor.name}. Assign orders from the Orders workspace to view requirements here.
              </div>
            ) : (
              assignedJobs.map((order) => {
                const allocatedQty = getContractorAllocatedQty(order);
                const isDivided = order.assignedTo && order.assignedTo.length > 1;
                const itemsDetected = parseSupportingItemsFromDescription(
                  order.product,
                  order.itemOrdered || "Lanyard",
                  allocatedQty
                );

                return (
                  <div
                    key={order.internalId}
                    style={{
                      backgroundColor: "rgba(19, 23, 34, 0.9)",
                      backdropFilter: "blur(14px)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    {/* Job Strip Header */}
                    <div
                      style={{
                        padding: "10px 16px",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <strong style={{ fontSize: "13.5px", color: "#fff" }}>{order.client}</strong>
                        {isDivided && (
                          <span
                            style={{
                              fontSize: "9.5px",
                              fontWeight: 800,
                              padding: "1px 6px",
                              borderRadius: "2px",
                              backgroundColor: "rgba(168, 85, 247, 0.2)",
                              color: "#c084fc",
                            }}
                          >
                            🔀 Divided Order
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          Target Due: <strong style={{ color: "#f59e0b" }}>{order.deliveryDate}</strong>
                        </span>
                        <span
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 800,
                            color: "#fff",
                            fontFamily: "var(--font-mono)",
                            padding: "2px 8px",
                            borderRadius: "3px",
                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                          }}
                        >
                          {allocatedQty.toLocaleString()} units
                          {isDivided && (
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "4px" }}>
                              (of {order.qty.toLocaleString()})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Job Details & Recognized Badges */}
                    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "12.5px", color: "#e2e8f0" }}>{order.product}</div>

                      {itemsDetected.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                          <span style={{ fontSize: "9.5px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                            Req. Stock:
                          </span>
                          {itemsDetected.map((item, idx) => (
                            <span
                              key={idx}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 7px",
                                borderRadius: "3px",
                                fontSize: "10.5px",
                                fontWeight: 700,
                                backgroundColor: item.badgeBg,
                                color: item.badgeColor,
                                border: `1px solid ${item.badgeBorder}`,
                              }}
                            >
                              <span>{item.icon}</span>
                              <span>{item.badgeLabel}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* SECTION 2: 🟢 LIVE WAREHOUSE STOCK HANDOVER CALCULATOR */}
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.05)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "6px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>🟢</span>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Things We Need To Give Them (Warehouse Stock Handover)
                  </div>
                  <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "1px" }}>
                    Calculates required stock for active jobs minus contractor's buffer holding
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleDispenseMaterials}
                style={{
                  backgroundColor: "#059669",
                  border: "none",
                  fontWeight: 700,
                  borderRadius: "3px",
                  fontSize: "11.5px",
                }}
              >
                📦 Dispense & Record Handover
              </Button>
            </div>

            {/* Handover List */}
            {handoverReconciliation.length === 0 ? (
              <div style={{ padding: "12px", color: "var(--text-muted)", fontSize: "11.5px", textAlign: "center" }}>
                No active requirements to calculate.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {handoverReconciliation.map((mat, idx) => {
                  const isFullyCovered = mat.isFullyCovered;
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "rgba(10, 14, 23, 0.85)",
                        border: isFullyCovered ? "1px solid rgba(52, 211, 153, 0.25)" : "1px solid rgba(16, 185, 129, 0.4)",
                        borderRadius: "5px",
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                            {mat.icon} {mat.name}
                          </span>
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "2px",
                              backgroundColor: mat.badgeBg,
                              color: mat.badgeColor,
                              border: `1px solid ${mat.badgeBorder}`,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            {mat.canonicalUnit}
                          </span>
                        </div>

                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {isFullyCovered ? (
                            <span style={{ color: "#34d399", fontWeight: 600 }}>
                              Contractor holds {mat.heldPacks.toLocaleString()} {mat.unitDisplay} in table buffer ({mat.heldPieces.toLocaleString()} pcs). 0 needed from warehouse.
                            </span>
                          ) : mat.heldPacks > 0 ? (
                            <span>
                              Active orders need {mat.requiredPacks.toLocaleString()} {mat.unitDisplay} ({mat.totalPieces.toLocaleString()} pcs) — Table buffer holds {mat.heldPacks.toLocaleString()} {mat.unitDisplay} = Issue remaining <strong style={{ color: "#34d399" }}>{mat.netPacksToIssue.toLocaleString()} {mat.unitDisplay} ({mat.netPiecesToIssue.toLocaleString()} pcs)</strong>
                            </span>
                          ) : (
                            <span>
                              Active orders need {mat.requiredPacks.toLocaleString()} {mat.unitDisplay} ({mat.totalPieces.toLocaleString()} pcs fresh factory issue)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Handover Badge */}
                      <div
                        style={{
                          padding: "6px 14px",
                          borderRadius: "4px",
                          backgroundColor: isFullyCovered ? "rgba(52, 211, 153, 0.12)" : "rgba(16, 185, 129, 0.2)",
                          border: isFullyCovered ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid rgba(52, 211, 153, 0.55)",
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ fontSize: "8.5px", fontWeight: 800, textTransform: "uppercase", color: isFullyCovered ? "#34d399" : "#86efac" }}>
                          {isFullyCovered ? "BUFFER COVERS ✅" : "HANDOVER TO LABOUR"}
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: 900, fontFamily: "var(--font-mono)", color: isFullyCovered ? "#34d399" : "#4ade80" }}>
                          {isFullyCovered ? "0" : mat.netPacksToIssue.toLocaleString()} <span style={{ fontSize: "10.5px", fontWeight: 600 }}>{mat.unitDisplay}</span>
                        </div>
                        {!isFullyCovered && mat.packSize > 1 && (
                          <div style={{ fontSize: "10px", color: "#86efac", fontFamily: "var(--font-mono)" }}>
                            ({mat.netPiecesToIssue.toLocaleString()} pcs)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── COL 3: Contractor Stock Buffer ("Things Already With Contractor") + Activity Log ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Quick Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <StatTile label="Allocated" value={totalAllocatedUnits.toLocaleString()} sub="Units across orders" color="#fff" />
            <StatTile label="Buffer Items" value={`${bufferHoldings.length}`} sub="Material categories" color="#fb923c" />
          </div>

          {/* SECTION 3: 🟠 Things Already With Contractor (Current Buffer) */}
          <div
            style={{
              backgroundColor: "rgba(249, 115, 22, 0.05)",
              border: "1px solid rgba(249, 115, 22, 0.28)",
              borderRadius: "6px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>🟠</span>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#fb923c", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Things They Already Have
                  </span>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    Contractor Table Buffer Holdings
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddBufferModal(true)}
                style={{ fontSize: "10.5px", padding: "2px 8px" }}
              >
                + Add
              </Button>
            </div>

            {bufferHoldings.length === 0 ? (
              <div style={{ padding: "14px", textAlign: "center", color: "var(--text-muted)", fontSize: "11.5px" }}>
                Contractor has 0 buffer holdings on hand.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {bufferHoldings.map((h, hIdx) => {
                  const isDeductedInHandover = handoverReconciliation.some(
                    (m) => m.name.toLowerCase().includes(h.item.toLowerCase()) || h.item.toLowerCase().includes(m.name.toLowerCase())
                  );

                  return (
                    <div
                      key={hIdx}
                      style={{
                        backgroundColor: "rgba(10, 14, 23, 0.8)",
                        border: isDeductedInHandover ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(255, 255, 255, 0.06)",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#f1f5f9" }}>{h.item}</span>
                          {isDeductedInHandover && (
                            <span
                              style={{
                                fontSize: "8.5px",
                                fontWeight: 800,
                                padding: "1px 5px",
                                borderRadius: "2px",
                                backgroundColor: "rgba(16, 185, 129, 0.2)",
                                color: "#34d399",
                              }}
                            >
                              DEDUCTED ✅
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {h.details || "Staged at contractor workstation"}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#fb923c", fontFamily: "var(--font-mono)" }}>
                          {h.qtyOnHand.toLocaleString()}{" "}
                          <span style={{ fontSize: "10px", color: "#fdba74" }}>{h.unit}</span>
                        </div>
                        <div style={{ fontSize: "8px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                          BUFFER ON HAND
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Handover Activity Log */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "6px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#fff" }}>
                Recent Handover Log
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                Factory → Workbench
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {handoverLogs.map((log, lIdx) => (
                <div
                  key={lIdx}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    borderRadius: "3px",
                    padding: "6px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "9.5px", color: "#60a5fa", fontWeight: 700 }}>{log.date}</span>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{log.itemsCount} items</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#e2e8f0" }}>{log.summary}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── ADD / ADJUST BUFFER STOCK MODAL ─────────────────────────────────── */}
      {showAddBufferModal && (
        <Modal
          isOpen={showAddBufferModal}
          onClose={() => setShowAddBufferModal(false)}
          title={`Add / Adjust Table Buffer: ${contractor.name}`}
        >
          <form onSubmit={handleAddBufferSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Stock Material Item</label>
              <select
                value={newBufferItem}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewBufferItem(val);
                  if (val.includes("Clip") || val.includes("Jointer")) {
                    setNewBufferUnit("packets of 1000");
                    setNewBufferQty("1");
                  } else if (val.includes("Roll")) {
                    setNewBufferUnit("rolls");
                    setNewBufferQty("2");
                  } else {
                    setNewBufferUnit("pieces");
                    setNewBufferQty("200");
                  }
                }}
                style={{
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "3px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                  fontSize: "13px",
                }}
              >
                <option value="Dog Hook" style={{ backgroundColor: "#131722" }}>Dog Hook (pieces)</option>
                <option value="16mm Lanyard Rolls" style={{ backgroundColor: "#131722" }}>16mm Lanyard Rolls (rolls)</option>
                <option value="12mm Lanyard Rolls" style={{ backgroundColor: "#131722" }}>12mm Lanyard Rolls (rolls)</option>
                <option value="20mm Lanyard Rolls" style={{ backgroundColor: "#131722" }}>20mm Lanyard Rolls (rolls)</option>
                <option value="Clips" style={{ backgroundColor: "#131722" }}>Clips (packets of 1000)</option>
                <option value="Safety Jointer Buckles" style={{ backgroundColor: "#131722" }}>Safety Jointer Buckles (packets of 1000)</option>
                <option value="Plastic Holder-V" style={{ backgroundColor: "#131722" }}>Plastic Holder-V (pieces)</option>
                <option value="Plastic Holder-H" style={{ backgroundColor: "#131722" }}>Plastic Holder-H (pieces)</option>
                <option value="Plastic Hook" style={{ backgroundColor: "#131722" }}>Plastic Hook (pieces)</option>
                <option value="England Hook" style={{ backgroundColor: "#131722" }}>England Hook (pieces)</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Input
                label="Quantity to Add"
                type="number"
                min={1}
                value={newBufferQty}
                onChange={(e) => setNewBufferQty(e.target.value)}
                required
              />

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Unit</label>
                <input
                  type="text"
                  value={newBufferUnit}
                  readOnly
                  style={{
                    height: "38px",
                    padding: "0 10px",
                    borderRadius: "3px",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94a3b8",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            <Input
              label="Details / Source Credit"
              placeholder="e.g. Leftover buffer from previous batch #LN-401"
              value={newBufferDetails}
              onChange={(e) => setNewBufferDetails(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <Button variant="secondary" size="md" onClick={() => setShowAddBufferModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit">
                Add to Buffer
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── EDIT WORKSTATION MODAL ────────────────────────────────────────── */}
      {showEditContractModal && (
        <Modal
          isOpen={showEditContractModal}
          onClose={() => setShowEditContractModal(false)}
          title={`Edit Workstation: ${contractor.name}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowEditContractModal(false);
              success("Workstation Updated", `Workstation set to ${editStation}`);
            }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <Input
              label="Assigned Table / Location"
              value={editStation}
              onChange={(e) => setEditStation(e.target.value)}
              required
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <Button variant="secondary" size="md" onClick={() => setShowEditContractModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
