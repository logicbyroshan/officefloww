import React, { useState, useMemo, useEffect } from "react";
import { Icon } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";
import {
  useLanyardStore,
  LabourFittingVoucher,
  LabourSentItem,
  FittingContractorProfile,
} from "./lanyardOrdersStore";
import { useStockStore } from "../stock/stockStore";

/** Format school and company names into clean Title Case and preserve known acronyms */
function formatClientTitle(raw: string): string {
  if (!raw) return "—";
  const acronyms = ["DPS", "SVM", "VPS", "TSVS", "BCM", "BHEL", "AIIMS", "NIT", "MPL", "PH", "HQ", "DAV"];
  return raw
    .split(/\s+/)
    .map((word) => {
      const clean = word.replace(/[^a-zA-Z0-9]/g, "");
      const upper = clean.toUpperCase();
      if (acronyms.includes(upper)) {
        return word.replace(clean, upper);
      }
      if (word.length <= 2 && !word.match(/\d/)) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export const LabourLanyardWorkspaceView: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const {
    contractors,
    vouchersMap,
    sentMap,
    selectedContractorId,
    setSelectedContractorId,
    addFittingVoucher,
    addSentItem,
    markVoucherComplete,
  } = useLanyardStore();

  const { items: centralStockItems, issueHardwareToLabour } = useStockStore();

  const [searchQuery, setSearchQuery] = useState("");
  // Default to "IN_FITTING" so completed vouchers are hidden by default
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_FITTING" | "READY">("IN_FITTING");

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [newSentMaterial, setNewSentMaterial] = useState("dst-v");
  const [newSentQty, setNewSentQty] = useState("1000");
  const [newSentVoucher, setNewSentVoucher] = useState("18");

  const [showAddVoucherModal, setShowAddVoucherModal] = useState(false);
  const [newVoucherNo, setNewVoucherNo] = useState("18");
  const [newVoucherParticulars, setNewVoucherParticulars] = useState("");
  const [newVoucherSize, setNewVoucherSize] = useState<"12mm" | "16mm" | "20mm">("16mm");
  const [newVoucherQty, setNewVoucherQty] = useState("500");
  const [newVoucherItem1, setNewVoucherItem1] = useState("dst-v");
  const [newVoucherItem2, setNewVoucherItem2] = useState("16mm-j");

  // Listen for navigation events with contractorId
  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail?.contractorId) {
        const found = contractors.find((c) => c.id === e.detail.contractorId);
        if (found) {
          setSelectedContractorId(found.id);
        }
      }
    };
    window.addEventListener("officefloww:navigate", handleNav as EventListener);
    return () => {
      window.removeEventListener("officefloww:navigate", handleNav as EventListener);
    };
  }, [contractors, setSelectedContractorId]);

  // Active Contractor Profile
  const activeContractor = useMemo(() => {
    return contractors.find((c) => c.id === selectedContractorId) || contractors[0];
  }, [contractors, selectedContractorId]);

  // Vouchers for Active Contractor
  const rawVouchers = useMemo(() => {
    return vouchersMap[activeContractor.id] || [];
  }, [vouchersMap, activeContractor.id]);

  // Sent Items for Active Contractor
  const rawSentItems = useMemo(() => {
    return sentMap[activeContractor.id] || [];
  }, [sentMap, activeContractor.id]);

  // Filtered Vouchers (Latest on Top!)
  const filteredVouchers = useMemo(() => {
    return rawVouchers
      .filter((v) => {
        if (statusFilter === "IN_FITTING" && v.status !== "in_fitting") return false;
        if (statusFilter === "READY" && v.status !== "ready") return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            v.particulars.toLowerCase().includes(q) ||
            String(v.voucherNo).includes(q) ||
            v.fittingItem1.toLowerCase().includes(q) ||
            (v.fittingItem2 && v.fittingItem2.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => (b.voucherNo || 0) - (a.voucherNo || 0)); // LATEST ON TOP!
  }, [rawVouchers, statusFilter, searchQuery]);

  // Real-Time Material Balance & Reconciliation (Sent - Used = Balance Items)
  const materialBalances = useMemo(() => {
    const sentTotals: Record<string, number> = {};
    const usedTotals: Record<string, number> = {};

    // Aggregate Sent
    rawSentItems.forEach((s) => {
      const code = s.materialCode.trim().toLowerCase();
      sentTotals[code] = (sentTotals[code] || 0) + (s.qty || 0);
    });

    // Aggregate Used from Vouchers
    rawVouchers.forEach((v) => {
      if (v.fittingItem1 && v.fittingItem1 !== "none") {
        const code1 = v.fittingItem1.trim().toLowerCase();
        usedTotals[code1] = (usedTotals[code1] || 0) + (v.qty1 || 0);
      }
      if (v.fittingItem2 && v.fittingItem2 !== "none") {
        const code2 = v.fittingItem2.trim().toLowerCase();
        usedTotals[code2] = (usedTotals[code2] || 0) + (v.qty2 || 0);
      }
    });

    // Combine all unique material codes
    const allCodes = Array.from(
      new Set([...Object.keys(sentTotals), ...Object.keys(usedTotals)])
    ).filter(Boolean);

    // Sort logically: jointers first, then hooks, then clips
    return allCodes
      .map((code) => {
        const sent = sentTotals[code] || 0;
        const used = usedTotals[code] || 0;
        const balance = sent - used;
        return {
          code,
          sent,
          used,
          balance,
        };
      })
      .sort((a, b) => b.sent - a.sent);
  }, [rawSentItems, rawVouchers]);

  // Ledger Summary Totals
  const totals = useMemo(() => {
    const totalLanyardsFitted = rawVouchers.reduce((sum, v) => sum + (v.qty || 0), 0);
    const totalHardwareSent = rawSentItems.reduce((sum, s) => sum + (s.qty || 0), 0);
    const totalHardwareUsed = rawVouchers.reduce(
      (sum, v) => sum + (v.qty1 || 0) + (v.qty2 || 0),
      0
    );
    const netBalancePieces = totalHardwareSent - totalHardwareUsed;
    const earnedPayout = rawVouchers
      .filter((v) => v.status === "ready")
      .reduce((sum, v) => sum + (v.qty || 0) * activeContractor.pieceRate, 0);

    const inFittingCount = rawVouchers.filter((v) => v.status === "in_fitting").length;
    const readyCount = rawVouchers.filter((v) => v.status === "ready").length;

    return {
      totalLanyardsFitted,
      totalHardwareSent,
      totalHardwareUsed,
      netBalancePieces,
      earnedPayout,
      inFittingCount,
      readyCount,
    };
  }, [rawVouchers, rawSentItems, activeContractor.pieceRate]);

  // Issue Material Handler
  const handleConfirmIssue = () => {
    const qty = parseInt(newSentQty, 10);
    const vNo = parseInt(newSentVoucher, 10) || 1;
    if (isNaN(qty) || qty <= 0) {
      toastError("Invalid Quantity", "Please enter a valid piece count.");
      return;
    }

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, "0")}.${String(
      today.getMonth() + 1
    ).padStart(2, "0")}.${String(today.getFullYear()).slice(-2)}`;

    // 1. Add to contractor's sent items
    addSentItem(activeContractor.id, {
      voucherNo: vNo,
      date: dateStr,
      materialCode: newSentMaterial,
      qty,
    });

    // 2. Automatically deduct from Central Stock!
    issueHardwareToLabour(activeContractor.name, newSentMaterial, qty);

    toastSuccess(
      "Material Issued",
      `Dispatched ${qty.toLocaleString()} pcs of ${newSentMaterial} to ${activeContractor.name} (deducted from Central Stock).`
    );
    setShowIssueModal(false);
  };

  // Add Voucher Handler
  const handleConfirmAddVoucher = () => {
    const qty = parseInt(newVoucherQty, 10);
    const vNo = parseInt(newVoucherNo, 10) || 1;
    if (!newVoucherParticulars.trim()) {
      toastError("Required Field", "Please enter client / order particulars.");
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      toastError("Invalid Quantity", "Please enter a valid piece count.");
      return;
    }

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, "0")}.${String(
      today.getMonth() + 1
    ).padStart(2, "0")}.${String(today.getFullYear()).slice(-2)}`;

    addFittingVoucher(activeContractor.id, {
      voucherNo: vNo,
      date: dateStr,
      particulars: newVoucherParticulars.trim(),
      mplSize: newVoucherSize,
      qty,
      fittingItem1: newVoucherItem1,
      qty1: qty,
      fittingItem2: newVoucherItem2,
      qty2: qty,
      status: "in_fitting",
    });

    toastSuccess(
      "Voucher Added",
      `Created Voucher #${vNo} for ${newVoucherParticulars} (${qty} pcs)`
    );
    setShowAddVoucherModal(false);
    setNewVoucherParticulars("");
  };

  // Live Central Stock helper for the issue modal
  const centralStockForSelected = useMemo(() => {
    const code = newSentMaterial.toLowerCase();
    const item = centralStockItems.find(
      (it) => it.code?.toLowerCase() === code || it.name.toLowerCase().includes(code)
    );
    return item ? item.availableStock : 8500;
  }, [centralStockItems, newSentMaterial]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px 20px",
        backgroundColor: "#080b12",
        minHeight: "100vh",
        color: "#f8fafc",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 1. RESTRAINED CONTRACTOR SELECTOR & HARDWARE DISPATCH                      */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          padding: "8px 12px",
          borderRadius: "6px",
          backgroundColor: "#0e131f",
          border: "1px solid rgba(255, 255, 255, 0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginRight: "4px",
            }}
          >
            Contractor:
          </span>

          {contractors
            .filter((c) => c.id !== "wof")
            .map((c) => {
              const isSelected = selectedContractorId === c.id;
              const vList = vouchersMap[c.id] || [];

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedContractorId(c.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 11px",
                    borderRadius: "5px",
                    backgroundColor: isSelected ? "rgba(255, 255, 255, 0.08)" : "transparent",
                    border: `1px solid ${isSelected ? "rgba(255, 255, 255, 0.16)" : "transparent"}`,
                    color: isSelected ? "#f8fafc" : "#94a3b8",
                    fontSize: "12px",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: isSelected ? "#38bdf8" : "#64748b",
                    }}
                  />
                  <span>{c.displayName}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "1px 5px",
                      borderRadius: "3px",
                      backgroundColor: isSelected ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.05)",
                      color: isSelected ? "#38bdf8" : "#64748b",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                    }}
                  >
                    {vList.length}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Selected Contractor Details Tag & Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontSize: "11px",
              color: "#94a3b8",
            }}
          >
            {activeContractor.location} • {activeContractor.workstation} •{" "}
            <span style={{ color: "#f59e0b", fontWeight: 700 }}>
              {activeContractor.pieceRate > 0
                ? `₹${activeContractor.pieceRate.toFixed(2)}/pc`
                : "In-House Desk"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddVoucherModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 9px",
              borderRadius: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#f8fafc",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Icon name="plus" size={12} color="#f8fafc" />
            <span>Add Voucher</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIssueModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              borderRadius: "4px",
              backgroundColor: "#f97316",
              border: "none",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Icon name="truck" size={12} color="#fff" />
            <span>Issue Hardware (Sent)</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 3. EXECUTIVE LEDGER SUMMARY CARDS (MATCHING LANYARD STYLE)                 */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Card 1: Lanyards Fitted */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Lanyards Fitted
            </span>
            <Icon name="tool" size={14} color="#f472b6" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#f8fafc",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {totals.totalLanyardsFitted.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>pcs</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            Across {rawVouchers.length} production vouchers
          </div>
        </div>

        {/* Card 2: Materials Sent */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Materials Dispatched
            </span>
            <Icon name="truck" size={14} color="#38bdf8" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#38bdf8",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {totals.totalHardwareSent.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "rgba(56, 189, 248, 0.7)", fontWeight: 500 }}>
              pcs
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            Issued from Central Stock to this table
          </div>
        </div>

        {/* Card 3: Materials Consumed */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Materials Consumed
            </span>
            <Icon name="check-circle" size={14} color="#22c55e" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#22c55e",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {totals.totalHardwareUsed.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "rgba(34, 197, 94, 0.7)", fontWeight: 500 }}>
              pcs
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            Fitted into completed lanyard batches
          </div>
        </div>

        {/* Card 4: Net Surplus Buffer Balance */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Surplus Buffer on Table
            </span>
            <Icon name="package" size={14} color="#f59e0b" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#f59e0b",
              fontFamily: "var(--font-mono)",
              marginTop: "4px",
            }}
          >
            {totals.netBalancePieces.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", color: "rgba(245, 158, 11, 0.7)", fontWeight: 500 }}>
              pcs
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
            Active buffer hardware held on table
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 4. THREE-SECTION WORKSPACE: VOUCHERS | SENT ITEMS | RECONCILIATION        */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 1fr 1fr",
          gap: "14px",
          alignItems: "start",
        }}
      >
        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* COLUMN 1: FITTING VOUCHERS (USED MATERIAL)                                */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Fitting Vouchers</span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "3px",
                    backgroundColor: "rgba(244, 114, 182, 0.12)",
                    color: "#f472b6",
                  }}
                >
                  {filteredVouchers.length}
                </span>
              </div>
            </div>

            {/* Filter controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  height: "26px",
                  padding: "0 8px",
                  fontSize: "11px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "4px",
                  color: "#f8fafc",
                  outline: "none",
                  width: "110px",
                }}
              />

              {/* Segmented Status Tabs */}
              <div
                style={{
                  display: "inline-flex",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  padding: "2px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setStatusFilter("IN_FITTING")}
                  style={{
                    height: "22px",
                    padding: "0 6px",
                    fontSize: "10.5px",
                    fontWeight: statusFilter === "IN_FITTING" ? 700 : 500,
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor:
                      statusFilter === "IN_FITTING" ? "rgba(245, 158, 11, 0.2)" : "transparent",
                    color: statusFilter === "IN_FITTING" ? "#f59e0b" : "#64748b",
                    cursor: "pointer",
                  }}
                >
                  Active ({totals.inFittingCount})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("READY")}
                  style={{
                    height: "22px",
                    padding: "0 6px",
                    fontSize: "10.5px",
                    fontWeight: statusFilter === "READY" ? 700 : 500,
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor:
                      statusFilter === "READY" ? "rgba(34, 197, 94, 0.2)" : "transparent",
                    color: statusFilter === "READY" ? "#22c55e" : "#64748b",
                    cursor: "pointer",
                  }}
                >
                  Ready ({totals.readyCount})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  style={{
                    height: "22px",
                    padding: "0 6px",
                    fontSize: "10.5px",
                    fontWeight: statusFilter === "ALL" ? 700 : 500,
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor:
                      statusFilter === "ALL" ? "rgba(255, 255, 255, 0.08)" : "transparent",
                    color: statusFilter === "ALL" ? "#f8fafc" : "#64748b",
                    cursor: "pointer",
                  }}
                >
                  All ({rawVouchers.length})
                </button>
              </div>
            </div>
          </div>

          {/* Vouchers Table */}
          <div style={{ maxHeight: "580px", overflowY: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12.5px",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    color: "#94a3b8",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <th style={{ padding: "9px 10px", textAlign: "left", width: "42px" }}>V#</th>
                  <th style={{ padding: "9px 8px", textAlign: "left", width: "70px" }}>Date</th>
                  <th style={{ padding: "9px 10px", textAlign: "left" }}>Particulars</th>
                  <th style={{ padding: "9px 6px", textAlign: "center", width: "52px" }}>Size</th>
                  <th style={{ padding: "9px 8px", textAlign: "right", width: "65px" }}>Qty</th>
                  <th style={{ padding: "9px 8px", textAlign: "left", width: "105px" }}>Hardware 1</th>
                  <th style={{ padding: "9px 8px", textAlign: "left", width: "95px" }}>Jointer</th>
                  <th style={{ padding: "9px 8px", textAlign: "center", width: "80px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "36px 0",
                        textAlign: "center",
                        color: "#64748b",
                        fontSize: "12.5px",
                      }}
                    >
                      No fitting vouchers found.
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((v, idx) => {
                    const isReady = v.status === "ready";
                    return (
                      <tr
                        key={v.id}
                        style={{
                          height: "42px",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                          backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.012)",
                          transition: "background 0.12s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.04)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.012)")
                        }
                      >
                        <td
                          style={{
                            padding: "8px 10px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            fontSize: "12px",
                            color: "#f472b6",
                          }}
                        >
                          #{v.voucherNo}
                        </td>
                        <td
                          style={{
                            padding: "8px 8px",
                            color: "#94a3b8",
                            fontSize: "11.5px",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {v.date}
                        </td>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: "#f8fafc", fontSize: "13px" }}>
                          {formatClientTitle(v.particulars)}
                        </td>
                        <td style={{ padding: "8px 6px", textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: "10.5px",
                              fontFamily: "var(--font-mono)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor:
                                v.mplSize === "12mm"
                                  ? "rgba(56, 189, 248, 0.12)"
                                  : "rgba(245, 158, 11, 0.12)",
                              color: v.mplSize === "12mm" ? "#38bdf8" : "#f59e0b",
                              border:
                                v.mplSize === "12mm"
                                  ? "1px solid rgba(56, 189, 248, 0.25)"
                                  : "1px solid rgba(245, 158, 11, 0.25)",
                              fontWeight: 700,
                            }}
                          >
                            {v.mplSize}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "8px 8px",
                            textAlign: "right",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            fontSize: "13.5px",
                            color: "#ffffff",
                          }}
                        >
                          {v.qty > 0 ? v.qty.toLocaleString() : "—"}
                        </td>
                        <td style={{ padding: "8px 8px" }}>
                          {v.fittingItem1 && v.fittingItem1 !== "none" ? (
                            <span
                              style={{
                                fontSize: "11px",
                                fontFamily: "var(--font-mono)",
                                color: "#38bdf8",
                                backgroundColor: "rgba(56, 189, 248, 0.1)",
                                border: "1px solid rgba(56, 189, 248, 0.25)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {v.fittingItem1} ({v.qty1})
                            </span>
                          ) : (
                            <span style={{ color: "#64748b" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "8px 8px" }}>
                          {v.fittingItem2 && v.fittingItem2 !== "none" ? (
                            <span
                              style={{
                                fontSize: "11px",
                                fontFamily: "var(--font-mono)",
                                color: "#fbbf24",
                                backgroundColor: "rgba(245, 158, 11, 0.1)",
                                border: "1px solid rgba(245, 158, 11, 0.25)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {v.fittingItem2} ({v.qty2})
                            </span>
                          ) : (
                            <span style={{ color: "#64748b" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "8px 8px", textAlign: "center" }}>
                          {isReady ? (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#4ade80",
                                backgroundColor: "rgba(34, 197, 94, 0.15)",
                                border: "1px solid rgba(34, 197, 94, 0.3)",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              Ready ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                markVoucherComplete(activeContractor.id, v.id);
                                toastSuccess("Voucher Completed", `Voucher #${v.voucherNo} marked Ready.`);
                              }}
                              title="Click to mark fitting completed"
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#fbbf24",
                                backgroundColor: "rgba(245, 158, 11, 0.15)",
                                border: "1px solid rgba(245, 158, 11, 0.35)",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#fbbf24" }} />
                              <span>In Fitting</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* COLUMN 2: HARDWARE SENT LOG (DISPATCHED FROM CENTRAL STOCK)              */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Dispatched Hardware</span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "3px",
                    backgroundColor: "rgba(56, 189, 248, 0.12)",
                    color: "#38bdf8",
                  }}
                >
                  {rawSentItems.length}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIssueModal(true)}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#f97316",
                backgroundColor: "rgba(249, 115, 22, 0.1)",
                border: "1px solid rgba(249, 115, 22, 0.2)",
                padding: "3px 8px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              + Issue
            </button>
          </div>

          <div style={{ maxHeight: "580px", overflowY: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12.5px",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    color: "#94a3b8",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <th style={{ padding: "9px 10px", textAlign: "left", width: "45px" }}>V#</th>
                  <th style={{ padding: "9px 8px", textAlign: "left", width: "70px" }}>Date</th>
                  <th style={{ padding: "9px 10px", textAlign: "left" }}>Material Code</th>
                  <th style={{ padding: "9px 10px", textAlign: "right", width: "80px" }}>Sent Qty</th>
                </tr>
              </thead>
              <tbody>
                {rawSentItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "36px 0",
                        textAlign: "center",
                        color: "#64748b",
                        fontSize: "12.5px",
                      }}
                    >
                      No dispatched items logged.
                    </td>
                  </tr>
                ) : (
                  rawSentItems.map((s, idx) => (
                    <tr
                      key={s.id}
                      style={{
                        height: "40px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.012)",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.04)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.012)")
                      }
                    >
                      <td
                        style={{
                          padding: "8px 10px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#f472b6",
                        }}
                      >
                        #{s.voucherNo}
                      </td>
                      <td
                        style={{
                          padding: "8px 8px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11.5px",
                          color: "#94a3b8",
                        }}
                      >
                        {s.date}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#38bdf8",
                        }}
                      >
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(56, 189, 248, 0.1)",
                            border: "1px solid rgba(56, 189, 248, 0.25)",
                          }}
                        >
                          {s.materialCode}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          fontSize: "13.5px",
                          fontWeight: 700,
                          color: "#ffffff",
                        }}
                      >
                        {s.qty.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* COLUMN 3: LIVE BUFFER RECONCILIATION (SENT - USED = TABLE BUFFER)        */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Live Table Buffer</span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "3px",
                    backgroundColor: "rgba(245, 158, 11, 0.12)",
                    color: "#f59e0b",
                  }}
                >
                  {materialBalances.length} items
                </span>
              </div>
            </div>
            <span style={{ fontSize: "11px", color: "#64748b" }}>Sent - Used</span>
          </div>

          <div style={{ maxHeight: "580px", overflowY: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12.5px",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    color: "#94a3b8",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <th style={{ padding: "9px 10px", textAlign: "left" }}>Material Code</th>
                  <th style={{ padding: "9px 8px", textAlign: "right", width: "65px" }}>Sent</th>
                  <th style={{ padding: "9px 8px", textAlign: "right", width: "65px" }}>Used</th>
                  <th style={{ padding: "9px 10px", textAlign: "right", width: "75px" }}>Buffer</th>
                </tr>
              </thead>
              <tbody>
                {materialBalances.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "36px 0",
                        textAlign: "center",
                        color: "#64748b",
                        fontSize: "12.5px",
                      }}
                    >
                      No buffer data available.
                    </td>
                  </tr>
                ) : (
                  materialBalances.map((m, idx) => {
                    const isPositive = m.balance > 0;
                    return (
                      <tr
                        key={m.code}
                        style={{
                          height: "40px",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                          backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.012)",
                          transition: "background 0.12s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.04)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.012)")
                        }
                      >
                        <td
                          style={{
                            padding: "8px 10px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#38bdf8",
                          }}
                        >
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(56, 189, 248, 0.1)",
                              border: "1px solid rgba(56, 189, 248, 0.25)",
                            }}
                          >
                            {m.code}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "8px 8px",
                            textAlign: "right",
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                            color: "#94a3b8",
                          }}
                        >
                          {m.sent.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "8px 8px",
                            textAlign: "right",
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          {m.used.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            textAlign: "right",
                            fontFamily: "var(--font-mono)",
                            fontSize: "13.5px",
                            fontWeight: 700,
                            color: isPositive ? "#4ade80" : "#fbbf24",
                          }}
                        >
                          {m.balance.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 5. MODAL: ISSUE MATERIAL (SENT ITEM) LINKED TO CENTRAL STOCK              */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {showIssueModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowIssueModal(false)}
        >
          <div
            style={{
              backgroundColor: "#0e131f",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "440px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon name="truck" size={16} color="#f97316" />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                  Issue Hardware &rarr; {activeContractor.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <Icon name="x" size={15} color="#64748b" />
              </button>
            </div>

            {/* Central Stock Availability Banner */}
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "5px",
                backgroundColor: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                fontSize: "11.5px",
                color: "#38bdf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Central Stock Availability:</span>
              <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {centralStockForSelected.toLocaleString()} pcs in warehouse
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                  Voucher / Gate Pass #:
                </label>
                <input
                  type="number"
                  value={newSentVoucher}
                  onChange={(e) => setNewSentVoucher(e.target.value)}
                  style={{
                    width: "100%",
                    height: "32px",
                    padding: "0 8px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#f8fafc",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                  Quantity (pcs):
                </label>
                <input
                  type="number"
                  value={newSentQty}
                  onChange={(e) => setNewSentQty(e.target.value)}
                  style={{
                    width: "100%",
                    height: "32px",
                    padding: "0 8px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#38bdf8",
                    fontSize: "13px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                Select Material / Hardware:
              </label>
              <select
                value={newSentMaterial}
                onChange={(e) => setNewSentMaterial(e.target.value)}
                style={{
                  width: "100%",
                  height: "32px",
                  padding: "0 8px",
                  borderRadius: "4px",
                  backgroundColor: "#080b12",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#f8fafc",
                  fontSize: "12px",
                  outline: "none",
                }}
              >
                <option value="dst-v">dst-v (Dog Hook Vertical - 8,500 pcs in central stock)</option>
                <option value="16mm-j">16mm-j (16mm Safety Jointer)</option>
                <option value="12mm-j">12mm-j (12mm Safety Jointer)</option>
                <option value="ph">ph (Plastic Holder Horizontal - 8,200 pcs in central stock)</option>
                <option value="pv">pv (Plastic Holder Vertical - 9,500 pcs in central stock)</option>
                <option value="12mm-eh">12mm-eh (12mm England Hook - 6,200 pcs in central stock)</option>
                <option value="16mm-eh">16mm-eh (16mm England Hook)</option>
                <option value="dst-h">dst-h (Dog Hook Horizontal - 3,800 pcs in central stock)</option>
                <option value="cch-v">cch-v (Crystal Holder Vertical - 5,200 pcs in central stock)</option>
                <option value="clips">clips (Packets of 1000 - 18 pkts in central stock)</option>
                <option value="rings">rings (Metal Rings - 14,500 pcs in central stock)</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  fontSize: "11.5px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmIssue}
                style={{
                  padding: "6px 14px",
                  borderRadius: "4px",
                  backgroundColor: "#f97316",
                  border: "none",
                  color: "#fff",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 6. MODAL: ADD FITTING VOUCHER                                              */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {showAddVoucherModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowAddVoucherModal(false)}
        >
          <div
            style={{
              backgroundColor: "#0e131f",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "460px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon name="tool" size={16} color="#f472b6" />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                  Add Fitting Voucher ({activeContractor.name})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVoucherModal(false)}
                style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <Icon name="x" size={15} color="#64748b" />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                  Voucher #:
                </label>
                <input
                  type="number"
                  value={newVoucherNo}
                  onChange={(e) => setNewVoucherNo(e.target.value)}
                  style={{
                    width: "100%",
                    height: "32px",
                    padding: "0 8px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#f8fafc",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                  MPL Size:
                </label>
                <select
                  value={newVoucherSize}
                  onChange={(e) => setNewVoucherSize(e.target.value as any)}
                  style={{
                    width: "100%",
                    height: "32px",
                    padding: "0 8px",
                    borderRadius: "4px",
                    backgroundColor: "#080b12",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#f8fafc",
                    fontSize: "12px",
                    outline: "none",
                  }}
                >
                  <option value="12mm">12mm</option>
                  <option value="16mm">16mm</option>
                  <option value="20mm">20mm</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                Particulars (Client / Order Name):
              </label>
              <input
                type="text"
                placeholder="e.g. st. xavier, bachpan, vardhama..."
                value={newVoucherParticulars}
                onChange={(e) => setNewVoucherParticulars(e.target.value)}
                style={{
                  width: "100%",
                  height: "32px",
                  padding: "0 8px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#f8fafc",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                Order Quantity (pcs):
              </label>
              <input
                type="number"
                value={newVoucherQty}
                onChange={(e) => setNewVoucherQty(e.target.value)}
                style={{
                  width: "100%",
                  height: "32px",
                  padding: "0 8px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#38bdf8",
                  fontSize: "13px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                  Used Material 1:
                </label>
                <select
                  value={newVoucherItem1}
                  onChange={(e) => setNewVoucherItem1(e.target.value)}
                  style={{
                    width: "100%",
                    height: "32px",
                    padding: "0 8px",
                    borderRadius: "4px",
                    backgroundColor: "#080b12",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#38bdf8",
                    fontSize: "12px",
                    outline: "none",
                  }}
                >
                  <option value="dst-v">dst-v</option>
                  <option value="ph">ph</option>
                  <option value="pv">pv</option>
                  <option value="12mm-eh">12mm-eh</option>
                  <option value="16mm-eh">16mm-eh</option>
                  <option value="dst-h">dst-h</option>
                  <option value="cch-v">cch-v</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                  Used Material 2 (Jointer):
                </label>
                <select
                  value={newVoucherItem2}
                  onChange={(e) => setNewVoucherItem2(e.target.value)}
                  style={{
                    width: "100%",
                    height: "32px",
                    padding: "0 8px",
                    borderRadius: "4px",
                    backgroundColor: "#080b12",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#f59e0b",
                    fontSize: "12px",
                    outline: "none",
                  }}
                >
                  <option value="16mm-j">16mm-j</option>
                  <option value="12mm-j">12mm-j</option>
                  <option value="20mm-j">20mm-j</option>
                  <option value="none">none</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => setShowAddVoucherModal(false)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  fontSize: "11.5px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddVoucher}
                style={{
                  padding: "6px 14px",
                  borderRadius: "4px",
                  backgroundColor: "#f472b6",
                  border: "none",
                  color: "#080b12",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Record Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
