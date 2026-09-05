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

// ─── Max Active Capacity Constraint (2,500 Units) ────────────────────────────
export const MAX_ACTIVE_LANYARD_CAPACITY = 2500;

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
      summary: "Dispensed 1,500 Dog Hooks & 8 rolls 16mm Lanyard for Northwind Coffee",
      itemsCount: 2,
    },
  ]);

  // Active view tab: "OPERATIONS" | "HISTORY"
  const [activeTab, setActiveTab] = useState<"OPERATIONS" | "HISTORY">("OPERATIONS");

  // ─── Contractor Assigned Orders ──────────────────────────────────────────────
  const contractorOrders = useMemo(() => {
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

  // Split into Delivered vs Undelivered
  const { deliveredOrders, pendingOrders } = useMemo(() => {
    const delivered: OrderRecord[] = [];
    const pending: OrderRecord[] = [];
    contractorOrders.forEach((o) => {
      if (o.status === "DELIVERED" || o.status === "COMPLETED") {
        delivered.push(o);
      } else {
        pending.push(o);
      }
    });
    return { deliveredOrders: delivered, pendingOrders: pending };
  }, [contractorOrders]);

  // ─── FIFO Capacity Scheduling (Max 2,500 Active Units) ───────────────────────
  const { activeOrders, queuedOrders, activeAllocatedUnits } = useMemo(() => {
    let runningTotal = 0;
    const active: OrderRecord[] = [];
    const queued: OrderRecord[] = [];

    pendingOrders.forEach((order) => {
      const allocatedQty = getContractorAllocatedQty(order);
      if (runningTotal + allocatedQty <= MAX_ACTIVE_LANYARD_CAPACITY) {
        active.push(order);
        runningTotal += allocatedQty;
      } else if (active.length === 0) {
        // Even if a single order is slightly over, first order gets active slot
        active.push(order);
        runningTotal += allocatedQty;
      } else {
        queued.push(order);
      }
    });

    return {
      activeOrders: active,
      queuedOrders: queued,
      activeAllocatedUnits: runningTotal,
    };
  }, [pendingOrders]);

  const availableCapacity = Math.max(0, MAX_ACTIVE_LANYARD_CAPACITY - activeAllocatedUnits);
  const capacityPercent = Math.min(100, Math.round((activeAllocatedUnits / MAX_ACTIVE_LANYARD_CAPACITY) * 100));

  // ─── Aggregated Material Requirements for ACTIVE Jobs ONLY ───────────────────
  // We only require and dispense materials for what's currently in active production
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

    activeOrders.forEach((order) => {
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
  }, [activeOrders]);

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

  // ─── VERIFY GIVEN (Transfers needed stock directly to contractor buffer) ─────
  const handleVerifyGiven = () => {
    const pendingItems = handoverReconciliation.filter((m) => !m.isFullyCovered);
    if (pendingItems.length === 0) {
      success(
        "Already Fully Supplied",
        `All materials for active orders are 100% held by ${contractor.name}. No additional warehouse issue needed.`
      );
      return;
    }

    const todayStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // Transfer the net needed amounts directly to bufferHoldings
    setBufferHoldings((prev) => {
      const updated = [...prev];
      pendingItems.forEach((p) => {
        const norm = p.name.toLowerCase().trim();
        const existingIdx = updated.findIndex((h) => {
          const hNorm = h.item.toLowerCase().trim();
          return hNorm === norm || hNorm.includes(norm) || norm.includes(hNorm);
        });

        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            qtyOnHand: updated[existingIdx].qtyOnHand + p.netPacksToIssue,
            details: `Verified & issued on ${todayStr} (Order handover)`,
          };
        } else {
          updated.push({
            item: p.name,
            qtyOnHand: p.netPacksToIssue,
            unit: p.unitDisplay,
            details: `Verified & issued on ${todayStr} (Order handover)`,
          });
        }
      });
      return updated;
    });

    const summaryStr = pendingItems
      .map((m) => `${m.netPacksToIssue.toLocaleString()} ${m.unitDisplay} ${m.name}`)
      .join(", ");

    setHandoverLogs((prev) => [
      {
        date: "Today, Just Now",
        summary: `Verified Handover: ${summaryStr}`,
        itemsCount: pendingItems.length,
      },
      ...prev,
    ]);

    success(
      "Materials Verified & Handed Over",
      `Verified and transferred to ${contractor.name}: ${summaryStr}. Contractor buffer updated.`
    );
  };

  // ─── MARK ORDER DELIVERED / COMPLETED ─────────────────────────────────────────
  const handleMarkDelivered = (orderId: string, clientName: string, qty: number) => {
    setSharedOrders((prev) =>
      prev.map((o) =>
        o.internalId === orderId
          ? {
              ...o,
              status: "DELIVERED",
              deliveryDate: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            }
          : o
      )
    );

    success(
      "Order Marked Delivered",
      `${qty.toLocaleString()} units for ${clientName} delivered by ${contractor.name}. Moved to Completed History; next queued orders advanced.`
    );
  };

  // ─── REOPEN / UNDO DELIVERY ──────────────────────────────────────────────────
  const handleReopenOrder = (orderId: string) => {
    setSharedOrders((prev) =>
      prev.map((o) => (o.internalId === orderId ? { ...o, status: "IN_PROGRESS" } : o))
    );
    success("Order Reopened", `Order ${orderId} moved back to active queue.`);
  };

  // ─── ADD / ADJUST BUFFER STOCK SUBMISSION ────────────────────────────────────
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

  // Combine historical batches with reactive delivered orders for full history
  const allCompletedRecords = useMemo(() => {
    const list: { id: string; client: string; qty: number; date: string; product: string; source: string }[] = [];

    // Reactive delivered orders
    deliveredOrders.forEach((o) => {
      list.push({
        id: o.internalId,
        client: o.client,
        qty: getContractorAllocatedQty(o),
        date: o.deliveryDate || "Completed",
        product: o.product,
        source: "Orders Workspace",
      });
    });

    // Historical batches attached to contractor
    if (contractor.batches) {
      contractor.batches
        .filter((b) => b.status === "COMPLETED")
        .forEach((b, idx) => {
          list.push({
            id: b.batchNumber || `hist-${idx}`,
            client: b.clientName,
            qty: b.quantityReturned || b.quantityGiven,
            date: "Historical Batch",
            product: "Custom Satin Lanyards Assembly",
            source: "Archive",
          });
        });
    }

    return list;
  }, [deliveredOrders, contractor]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", backgroundColor: "var(--bg-main)" }}>

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

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>
              {contractor.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "3px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#cbd5e1",
              }}
            >
              {contractor.workstation}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Tab Switcher */}
          <div
            style={{
              display: "flex",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              borderRadius: "4px",
              padding: "2px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("OPERATIONS")}
              style={{
                padding: "5px 12px",
                fontSize: "11px",
                fontWeight: 700,
                borderRadius: "3px",
                border: "none",
                cursor: "pointer",
                backgroundColor: activeTab === "OPERATIONS" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                color: activeTab === "OPERATIONS" ? "#fff" : "var(--text-muted)",
              }}
            >
              Active Work & Staging
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("HISTORY")}
              style={{
                padding: "5px 12px",
                fontSize: "11px",
                fontWeight: 700,
                borderRadius: "3px",
                border: "none",
                cursor: "pointer",
                backgroundColor: activeTab === "HISTORY" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                color: activeTab === "HISTORY" ? "#fff" : "var(--text-muted)",
              }}
            >
              Delivered History ({allCompletedRecords.length})
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            style={{ borderRadius: "3px" }}
            onClick={() => setShowEditContractModal(true)}
          >
            Edit Workstation
          </Button>
          <Button
            variant="secondary"
            size="sm"
            style={{ borderRadius: "3px", backgroundColor: "rgba(255, 255, 255, 0.06)" }}
            onClick={() => setShowAddBufferModal(true)}
          >
            + Add Buffer Stock
          </Button>
        </div>
      </div>

      {/* ─── CAPACITY & DOSSIER HERO BANNER (NO MONEY / PURE OPERATIONAL STATS) ─── */}
      <div
        style={{
          margin: "16px 24px 0 24px",
          padding: "16px 20px",
          backgroundColor: "rgba(19, 23, 34, 0.85)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "6px",
          display: "grid",
          gridTemplateColumns: "1.2fr 2fr 1fr",
          gap: "24px",
          alignItems: "center",
        }}
      >
        {/* Contractor Details */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 800,
              color: "#e2e8f0",
              fontFamily: "var(--font-mono)",
            }}
          >
            {contractor.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#fff" }}>
              {contractor.name}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              {matchedDefault?.specialty || "Lanyard Stitching & Assembly"} • {contractor.phone || matchedDefault?.phone || "+91 98200 44551"}
            </div>
          </div>
        </div>

        {/* 2,500 Lanyard Active Capacity Meter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Active Production Workload
              </span>
              <span
                style={{
                  fontSize: "9.5px",
                  padding: "1px 6px",
                  borderRadius: "2px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "var(--text-muted)",
                }}
              >
                Limit: 2,500 units max
              </span>
            </div>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>
              {activeAllocatedUnits.toLocaleString()} / {MAX_ACTIVE_LANYARD_CAPACITY.toLocaleString()} units
            </div>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              height: "8px",
              width: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${capacityPercent}%`,
                backgroundColor: capacityPercent >= 100 ? "#f97316" : "#0ea5e9",
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--text-muted)" }}>
            <span>
              {availableCapacity > 0 ? (
                <span>{availableCapacity.toLocaleString()} units available capacity</span>
              ) : (
                <span style={{ color: "#fb923c" }}>Maximum workload reached (2,500 units)</span>
              )}
            </span>
            {queuedOrders.length > 0 && (
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                {queuedOrders.length} order(s) waiting in queue
              </span>
            )}
          </div>
        </div>

        {/* Operational Counts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "16px" }}>
          <div>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Active Jobs
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)", lineHeight: 1.2 }}>
              {activeOrders.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Delivered
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#10b981", fontFamily: "var(--font-mono)", lineHeight: 1.2 }}>
              {allCompletedRecords.length}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN BODY: TAB 1 (OPERATIONS & STAGING) OR TAB 2 (HISTORY)
          ========================================================================= */}
      {activeTab === "OPERATIONS" ? (
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ───────────────────────────────────────────────────────────────────
              SECTION 1: SIDE-BY-SIDE MATERIAL BALANCE
              Left: What He Has  |  Right: What To Give (with Verify Given btn)
              ─────────────────────────────────────────────────────────────────── */}
          <div
            style={{
              backgroundColor: "rgba(19, 23, 34, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "6px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Workbench Stock Balance & Staging
                </span>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                  Side-by-side reconciliation between contractor buffer and active orders
                </div>
              </div>

              {/* Verify Given Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleVerifyGiven}
                style={{
                  backgroundColor: "#0284c7",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "11.5px",
                  borderRadius: "3px",
                  boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
                }}
              >
                ✓ Verify & Issue Materials
              </Button>
            </div>

            {/* 2 Equal Columns: Left (Holdings) | Right (To Give) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

              {/* ── LEFT COLUMN: Things Contractor Has ── */}
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "5px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#cbd5e1", textTransform: "uppercase" }}>
                      Things Contractor Has (Buffer On Hand)
                    </span>
                    <span
                      style={{
                        fontSize: "9.5px",
                        padding: "1px 5px",
                        borderRadius: "2px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {bufferHoldings.length} items
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddBufferModal(true)}
                    style={{
                      fontSize: "10px",
                      padding: "2px 7px",
                      borderRadius: "2px",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      backgroundColor: "transparent",
                      color: "#94a3b8",
                      cursor: "pointer",
                    }}
                  >
                    + Add Buffer
                  </button>
                </div>

                {bufferHoldings.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>
                    0 buffer stock held with contractor.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {bufferHoldings.map((h, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: "rgba(10, 14, 23, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          borderRadius: "4px",
                          padding: "8px 12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#f1f5f9" }}>
                            {h.item}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>
                            {h.details || "Staged at contractor workstation"}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "13px", fontWeight: 800, color: "#e2e8f0", fontFamily: "var(--font-mono)" }}>
                            {h.qtyOnHand.toLocaleString()}
                          </span>{" "}
                          <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{h.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── RIGHT COLUMN: Things To Give (Handover for Active Jobs) ── */}
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "5px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#cbd5e1", textTransform: "uppercase" }}>
                      Things To Give (Required Handover)
                    </span>
                    <span
                      style={{
                        fontSize: "9.5px",
                        padding: "1px 5px",
                        borderRadius: "2px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Active Jobs
                    </span>
                  </div>

                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    Deducts contractor buffer
                  </span>
                </div>

                {handoverReconciliation.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>
                    No active orders requiring stock issue.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {handoverReconciliation.map((mat, idx) => {
                      const isCovered = mat.isFullyCovered;
                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: "rgba(10, 14, 23, 0.8)",
                            border: isCovered
                              ? "1px solid rgba(255, 255, 255, 0.06)"
                              : "1px solid rgba(2, 132, 199, 0.3)",
                            borderRadius: "4px",
                            padding: "8px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#f1f5f9" }}>
                                {mat.icon} {mat.name}
                              </span>
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>
                              {isCovered ? (
                                <span style={{ color: "#94a3b8" }}>Covered by contractor buffer</span>
                              ) : mat.heldPacks > 0 ? (
                                <span>
                                  Needs {mat.requiredPacks} {mat.unitDisplay} — holds {mat.heldPacks} = Issue{" "}
                                  <strong style={{ color: "#38bdf8" }}>{mat.netPacksToIssue} {mat.unitDisplay}</strong>
                                </span>
                              ) : (
                                <span>
                                  Needs <strong style={{ color: "#38bdf8" }}>{mat.netPacksToIssue} {mat.unitDisplay}</strong> fresh issue
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            {isCovered ? (
                              <span
                                style={{
                                  fontSize: "9.5px",
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: "2px",
                                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                                  color: "#94a3b8",
                                }}
                              >
                                0 Needed ✓
                              </span>
                            ) : (
                              <div>
                                <span style={{ fontSize: "13px", fontWeight: 800, color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
                                  {mat.netPacksToIssue.toLocaleString()}
                                </span>{" "}
                                <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{mat.unitDisplay}</span>
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

            {/* Handover Log Strip */}
            {handoverLogs.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  paddingTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                }}
              >
                <span>Latest Handover: <strong style={{ color: "#e2e8f0" }}>{handoverLogs[0].summary}</strong></span>
                <span style={{ fontSize: "10px" }}>{handoverLogs[0].date}</span>
              </div>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────────────────
              SECTION 2: ACTIVE ORDERS (IN PRODUCTION UNDER 2,500 LIMIT)
              ─────────────────────────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Active Orders ({activeOrders.length})
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  In production (Capacity: {activeAllocatedUnits.toLocaleString()} / 2,500 units)
                </span>
              </div>
            </div>

            {activeOrders.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  backgroundColor: "rgba(19, 23, 34, 0.7)",
                  border: "1px dashed rgba(255, 255, 255, 0.12)",
                  borderRadius: "4px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                }}
              >
                No active orders currently assigned to {contractor.name}.
              </div>
            ) : (
              activeOrders.map((order) => {
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
                      borderRadius: "5px",
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
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "2px",
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              color: "#cbd5e1",
                            }}
                          >
                            Divided Order
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          Delivery Due: <span style={{ color: "#e2e8f0" }}>{order.deliveryDate}</span>
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

                        {/* Mark Delivered Action */}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleMarkDelivered(order.internalId, order.client, allocatedQty)}
                          style={{
                            backgroundColor: "#059669",
                            border: "none",
                            fontWeight: 700,
                            fontSize: "11px",
                            borderRadius: "3px",
                            padding: "4px 10px",
                          }}
                        >
                          ✓ Mark Delivered
                        </Button>
                      </div>
                    </div>

                    {/* Job Details & Recognized Badges */}
                    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "12.5px", color: "#cbd5e1" }}>{order.product}</div>

                      {itemsDetected.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "9.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                            Stock Needed:
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
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                color: "#e2e8f0",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
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

          {/* ───────────────────────────────────────────────────────────────────
              SECTION 3: QUEUED ORDERS (NEXT IN LINE BEYOND 2,500 LIMIT)
              ─────────────────────────────────────────────────────────────────── */}
          {queuedOrders.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ⏳ Queued Orders — Next in Line ({queuedOrders.length})
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Holding in queue until current 2,500 active capacity is delivered
                </span>
              </div>

              {queuedOrders.map((order) => {
                const allocatedQty = getContractorAllocatedQty(order);
                return (
                  <div
                    key={order.internalId}
                    style={{
                      backgroundColor: "rgba(19, 23, 34, 0.55)",
                      border: "1px dashed rgba(245, 158, 11, 0.3)",
                      borderRadius: "5px",
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "13px", color: "#f1f5f9" }}>{order.client}</strong>
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: "2px",
                            backgroundColor: "rgba(245, 158, 11, 0.15)",
                            color: "#fbbf24",
                          }}
                        >
                          Queued Next
                        </span>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {order.product}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>
                        {allocatedQty.toLocaleString()} units
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        Delivery Due: {order.deliveryDate}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ───────────────────────────────────────────────────────────────────
            TAB 2: DELIVERED ORDER HISTORY
            ─────────────────────────────────────────────────────────────────── */
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Delivered Orders & Completed Batches
              </span>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                Historical log of finished production runs delivered by {contractor.name}
              </div>
            </div>

            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Total Finished: <strong style={{ color: "#10b981" }}>{allCompletedRecords.length} runs</strong>
            </span>
          </div>

          {allCompletedRecords.length === 0 ? (
            <div
              style={{
                padding: "32px",
                backgroundColor: "rgba(19, 23, 34, 0.7)",
                border: "1px dashed rgba(255, 255, 255, 0.12)",
                borderRadius: "4px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "12px",
              }}
            >
              No finished orders recorded yet. Mark active orders as delivered to view history here.
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "rgba(19, 23, 34, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 700 }}>Client</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 700 }}>Description</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 700 }}>Quantity</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 700 }}>Delivered Date</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 700 }}>Status</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-muted)", fontWeight: 700, textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allCompletedRecords.map((rec, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      }}
                    >
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "#fff" }}>
                        {rec.client}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>
                        {rec.product}
                      </td>
                      <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#fff" }}>
                        {rec.qty.toLocaleString()} units
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>
                        {rec.date}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: "2px",
                            backgroundColor: "rgba(16, 185, 129, 0.12)",
                            color: "#34d399",
                          }}
                        >
                          DELIVERED ✓
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        {rec.source === "Orders Workspace" && (
                          <button
                            type="button"
                            onClick={() => handleReopenOrder(rec.id)}
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "2px",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              backgroundColor: "transparent",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                            }}
                          >
                            Reopen
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
