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
  // Default to "IN_FITTING" so active vouchers are prominent
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_FITTING" | "READY">("IN_FITTING");
  const [sendItemViewMode, setSendItemViewMode] = useState<"by_item" | "logs">("by_item");

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
      .sort((a, b) => (b.voucherNo || 0) - (a.voucherNo || 0)); // Latest on top
  }, [rawVouchers, statusFilter, searchQuery]);

  // Send Items Aggregated By Item Name (One side Item Name, Another side Qty)
  const sentItemsByItem = useMemo(() => {
    const map: Record<string, number> = {};
    rawSentItems.forEach((s) => {
      const code = s.materialCode.trim().toLowerCase();
      map[code] = (map[code] || 0) + (s.qty || 0);
    });
    return Object.entries(map)
      .map(([code, qty]) => ({ code, qty }))
      .sort((a, b) => b.qty - a.qty);
  }, [rawSentItems]);

  // Real-Time Material Balance & Reconciliation (Sent - Used = Balance)
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

    const allCodes = Array.from(
      new Set([...Object.keys(sentTotals), ...Object.keys(usedTotals)])
    ).filter(Boolean);

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

    // 2. Automatically deduct from Central Stock
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
      {/* 1. CONTRACTOR BAR WITH ACTION BUTTONS                                      */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          padding: "10px 16px",
          borderRadius: "8px",
          backgroundColor: "#0e131f",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
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
                    gap: "7px",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    backgroundColor: isSelected ? "rgba(56, 189, 248, 0.14)" : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${isSelected ? "rgba(56, 189, 248, 0.35)" : "rgba(255, 255, 255, 0.07)"}`,
                    color: isSelected ? "#ffffff" : "#94a3b8",
                    fontSize: "12.5px",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                      e.currentTarget.style.color = "#f1f5f9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
                      e.currentTarget.style.color = "#94a3b8";
                    }
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: isSelected ? "#38bdf8" : "#64748b",
                      boxShadow: isSelected ? "0 0 6px rgba(56, 189, 248, 0.6)" : "none",
                    }}
                  />
                  <span>{c.displayName}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      backgroundColor: isSelected ? "rgba(56, 189, 248, 0.22)" : "rgba(255, 255, 255, 0.05)",
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

        {/* Workstation Badge & Primary Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              padding: "5px 11px",
              borderRadius: "5px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            {activeContractor.location} • {activeContractor.workstation} •{" "}
            <span style={{ color: "#fbbf24", fontWeight: 700 }}>
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
              gap: "6px",
              padding: "6px 13px",
              borderRadius: "5px",
              backgroundColor: "rgba(244, 114, 182, 0.12)",
              border: "1px solid rgba(244, 114, 182, 0.3)",
              color: "#f472b6",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(244, 114, 182, 0.22)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(244, 114, 182, 0.12)";
            }}
          >
            <Icon name="plus" size={12} color="#f472b6" />
            <span>Add Voucher</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIssueModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "5px",
              backgroundColor: "#ea580c",
              border: "none",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(234, 88, 12, 0.35)",
              transition: "all 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#c2410c";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ea580c";
            }}
          >
            <Icon name="truck" size={13} color="#ffffff" />
            <span>Issue Hardware (Sent)</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 2. UNIFIED HORIZONTAL GRID: VOUCHERS | SEND ITEM | BALANCE (NOT STACKED) */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 200px 200px",
          gap: "12px",
          alignItems: "stretch",
          width: "100%",
        }}
      >
        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* TABLE 1: FITTING VOUCHERS                                                */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
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
                  fontSize: "13.5px",
                  fontWeight: 700,
                  color: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <span>Fitting Vouchers</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(244, 114, 182, 0.15)",
                    color: "#f472b6",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {filteredVouchers.length}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                Production batches • {activeContractor.displayName}
              </div>
            </div>

            {/* Filter controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    opacity: 0.6,
                  }}
                >
                  <Icon name="search" size={11} color="#94a3b8" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    height: "32px",
                    padding: "0 8px 0 24px",
                    fontSize: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "4px",
                    color: "#f8fafc",
                    outline: "none",
                    width: "140px",
                  }}
                />
              </div>

              {/* Segmented Status Tabs */}
              <div
                style={{
                  display: "inline-flex",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  padding: "2px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setStatusFilter("IN_FITTING")}
                  style={{
                    height: "24px",
                    padding: "0 9px",
                    fontSize: "11px",
                    fontWeight: statusFilter === "IN_FITTING" ? 700 : 500,
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor:
                      statusFilter === "IN_FITTING" ? "rgba(245, 158, 11, 0.22)" : "transparent",
                    color: statusFilter === "IN_FITTING" ? "#f59e0b" : "#94a3b8",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  Active ({totals.inFittingCount})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("READY")}
                  style={{
                    height: "24px",
                    padding: "0 9px",
                    fontSize: "11px",
                    fontWeight: statusFilter === "READY" ? 700 : 500,
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor:
                      statusFilter === "READY" ? "rgba(34, 197, 94, 0.22)" : "transparent",
                    color: statusFilter === "READY" ? "#22c55e" : "#94a3b8",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  Ready ({totals.readyCount})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  style={{
                    height: "24px",
                    padding: "0 9px",
                    fontSize: "11px",
                    fontWeight: statusFilter === "ALL" ? 700 : 500,
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor:
                      statusFilter === "ALL" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                    color: statusFilter === "ALL" ? "#f8fafc" : "#94a3b8",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  All ({rawVouchers.length})
                </button>
              </div>
            </div>
          </div>

          {/* Table Header: 7 clean columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "48px 74px 1fr 58px 70px 135px 105px",
              gap: "10px",
              padding: "10px 14px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              alignItems: "center",
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              userSelect: "none",
            }}
          >
            <div>V#</div>
            <div>Date</div>
            <div>Particulars</div>
            <div style={{ textAlign: "center" }}>Size</div>
            <div style={{ textAlign: "right" }}>Qty</div>
            <div>Hardware</div>
            <div style={{ textAlign: "center" }}>Status</div>
          </div>

          {/* Scrollable Rows Container */}
          <div style={{ maxHeight: "560px", overflowY: "auto" }}>
            {filteredVouchers.length === 0 ? (
              <div
                style={{
                  padding: "48px 16px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                No vouchers found matching filter.
              </div>
            ) : (
              filteredVouchers.map((v, idx) => {
                const isReady = v.status === "ready";
                return (
                  <div
                    key={v.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "48px 74px 1fr 58px 70px 135px 105px",
                      gap: "10px",
                      padding: "10px 14px",
                      minHeight: "46px",
                      alignItems: "center",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
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
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "#f472b6",
                      }}
                    >
                      #{v.voucherNo}
                    </div>
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: "11.5px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {v.date}
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#f1f5f9",
                        fontSize: "13px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={v.particulars}
                    >
                      {formatClientTitle(v.particulars)}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontFamily: "var(--font-mono)",
                          padding: "2px 6px",
                          borderRadius: "3px",
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
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        fontSize: "13.5px",
                        color: "#ffffff",
                      }}
                    >
                      {v.qty > 0 ? v.qty.toLocaleString() : "—"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                      {v.fittingItem1 && v.fittingItem1 !== "none" && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            color: "#38bdf8",
                            backgroundColor: "rgba(56, 189, 248, 0.1)",
                            border: "1px solid rgba(56, 189, 248, 0.22)",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {v.fittingItem1}
                        </span>
                      )}
                      {v.fittingItem2 && v.fittingItem2 !== "none" && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            color: "#fbbf24",
                            backgroundColor: "rgba(245, 158, 11, 0.1)",
                            border: "1px solid rgba(245, 158, 11, 0.22)",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {v.fittingItem2}
                        </span>
                      )}
                      {(!v.fittingItem1 || v.fittingItem1 === "none") &&
                        (!v.fittingItem2 || v.fittingItem2 === "none") && (
                          <span style={{ color: "#64748b", fontSize: "11px" }}>—</span>
                        )}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      {isReady ? (
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 700,
                            color: "#4ade80",
                            backgroundColor: "rgba(34, 197, 94, 0.12)",
                            border: "1px solid rgba(34, 197, 94, 0.3)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Icon name="check" size={10} color="#22c55e" />
                          <span>Ready ✓</span>
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
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: "#fbbf24",
                            backgroundColor: "rgba(245, 158, 11, 0.12)",
                            border: "1px solid rgba(245, 158, 11, 0.35)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                            transition: "all 0.12s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.22)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.12)";
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: "#fbbf24",
                            }}
                          />
                          <span>In Fitting</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Table Footer */}
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderTop: "1px solid rgba(255, 255, 255, 0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11.5px",
              color: "#94a3b8",
            }}
          >
            <span>
              Showing {filteredVouchers.length} of {rawVouchers.length} vouchers
            </span>
            <span style={{ color: "#fbbf24", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              Earned: ₹{totals.earnedPayout.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* TABLE 2: SEND ITEM (COMPACT 200px WIDTH, 2 COLUMNS)                      */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: "9px 12px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>
                  Send Item
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: "3px",
                    backgroundColor: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {sendItemViewMode === "by_item" ? sentItemsByItem.length : rawSentItems.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowIssueModal(true)}
                title="Issue Hardware to contractor"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: "#f97316",
                  backgroundColor: "rgba(249, 115, 22, 0.14)",
                  border: "1px solid rgba(249, 115, 22, 0.3)",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(249, 115, 22, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(249, 115, 22, 0.14)";
                }}
              >
                <Icon name="plus" size={10} color="#f97316" />
                <span>Issue</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "10.5px", color: "#64748b" }}>
                Dispatched
              </span>

              {/* By Item / Logs Switcher */}
              <div
                style={{
                  display: "inline-flex",
                  backgroundColor: "#07090e",
                  padding: "1px",
                  borderRadius: "3px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSendItemViewMode("by_item")}
                  style={{
                    height: "18px",
                    padding: "0 6px",
                    fontSize: "10px",
                    fontWeight: sendItemViewMode === "by_item" ? 700 : 500,
                    borderRadius: "2px",
                    border: "none",
                    backgroundColor:
                      sendItemViewMode === "by_item" ? "rgba(56, 189, 248, 0.2)" : "transparent",
                    color: sendItemViewMode === "by_item" ? "#38bdf8" : "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  By Item
                </button>
                <button
                  type="button"
                  onClick={() => setSendItemViewMode("logs")}
                  style={{
                    height: "18px",
                    padding: "0 6px",
                    fontSize: "10px",
                    fontWeight: sendItemViewMode === "logs" ? 700 : 500,
                    borderRadius: "2px",
                    border: "none",
                    backgroundColor:
                      sendItemViewMode === "logs" ? "rgba(56, 189, 248, 0.2)" : "transparent",
                    color: sendItemViewMode === "logs" ? "#38bdf8" : "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  Logs
                </button>
              </div>
            </div>
          </div>

          {/* Table Header: Exactly 2 columns */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              userSelect: "none",
            }}
          >
            <div>Item Name</div>
            <div>Qty</div>
          </div>

          {/* Scrollable Rows Container */}
          <div style={{ maxHeight: "560px", overflowY: "auto" }}>
            {sendItemViewMode === "by_item" ? (
              sentItemsByItem.length === 0 ? (
                <div
                  style={{
                    padding: "36px 12px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  No items dispatched.
                </div>
              ) : (
                sentItemsByItem.map((item, idx) => (
                  <div
                    key={item.code}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      minHeight: "42px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
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
                    <div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#38bdf8",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(56, 189, 248, 0.1)",
                          border: "1px solid rgba(56, 189, 248, 0.22)",
                          display: "inline-block",
                        }}
                      >
                        {item.code}
                      </span>
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        color: "#ffffff",
                      }}
                    >
                      {item.qty.toLocaleString()} <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 500 }}>pcs</span>
                    </div>
                  </div>
                ))
              )
            ) : rawSentItems.length === 0 ? (
              <div
                style={{
                  padding: "36px 12px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                No dispatched items logged.
              </div>
            ) : (
              rawSentItems.map((s, idx) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    minHeight: "42px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
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
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "#f472b6",
                      }}
                    >
                      #{s.voucherNo}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "#38bdf8",
                        padding: "1px 5px",
                        borderRadius: "3px",
                        backgroundColor: "rgba(56, 189, 248, 0.1)",
                        border: "1px solid rgba(56, 189, 248, 0.2)",
                      }}
                    >
                      {s.materialCode}
                    </span>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    {s.qty.toLocaleString()} <span style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 500 }}>pcs</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Table Footer */}
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderTop: "1px solid rgba(255, 255, 255, 0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
            }}
          >
            <span style={{ color: "#94a3b8" }}>Total Sent</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: "#38bdf8",
                fontSize: "12px",
              }}
            >
              {totals.totalHardwareSent.toLocaleString()} pcs
            </span>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* TABLE 3: BALANCE (COMPACT 200px WIDTH, 2 COLUMNS)                        */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: "8px",
            backgroundColor: "#0e131f",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: "9px 12px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>
                  Balance
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: "3px",
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {materialBalances.length}
                </span>
              </div>

              <span
                style={{
                  fontSize: "10px",
                  color: "#94a3b8",
                  fontFamily: "var(--font-mono)",
                  padding: "1px 6px",
                  borderRadius: "3px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                Sent - Used
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "10.5px", color: "#64748b" }}>
                Live Buffer
              </span>
              <span
                style={{
                  fontSize: "10.5px",
                  color: totals.netBalancePieces >= 0 ? "#4ade80" : "#f87171",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                }}
              >
                {totals.netBalancePieces > 0 ? "+" : ""}{totals.netBalancePieces.toLocaleString()} pcs
              </span>
            </div>
          </div>

          {/* Table Header: Exactly 2 columns */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              userSelect: "none",
            }}
          >
            <div>Item Name</div>
            <div>Qty</div>
          </div>

          {/* Scrollable Rows Container */}
          <div style={{ maxHeight: "560px", overflowY: "auto" }}>
            {materialBalances.length === 0 ? (
              <div
                style={{
                  padding: "36px 12px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                No buffer records.
              </div>
            ) : (
              materialBalances.map((m, idx) => {
                const isPositive = m.balance > 0;
                return (
                  <div
                    key={m.code}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      minHeight: "42px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
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
                    <div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#f59e0b",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(245, 158, 11, 0.1)",
                          border: "1px solid rgba(245, 158, 11, 0.22)",
                          display: "inline-block",
                        }}
                      >
                        {m.code}
                      </span>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {m.balance === 0 ? (
                        <span style={{ color: "#94a3b8" }}>0 pcs</span>
                      ) : isPositive ? (
                        <span
                          style={{
                            color: "#4ade80",
                            backgroundColor: "rgba(34, 197, 94, 0.12)",
                            border: "1px solid rgba(34, 197, 94, 0.25)",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            display: "inline-block",
                          }}
                        >
                          +{m.balance.toLocaleString()} pcs
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "#f87171",
                            backgroundColor: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            display: "inline-block",
                          }}
                        >
                          {m.balance.toLocaleString()} pcs
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Table Footer */}
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderTop: "1px solid rgba(255, 255, 255, 0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
            }}
          >
            <span style={{ color: "#94a3b8" }}>Net Buffer</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "12px",
                color: totals.netBalancePieces >= 0 ? "#4ade80" : "#f87171",
              }}
            >
              {totals.netBalancePieces > 0 ? "+" : ""}
              {totals.netBalancePieces.toLocaleString()} pcs
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* 4. MODAL: ISSUE HARDWARE TO CONTRACTOR                                    */}
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
              maxWidth: "460px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon name="truck" size={16} color="#f97316" />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                  Issue Hardware to {activeContractor.name}
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                  Voucher / Issue #:
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
                  Quantity to Dispatch:
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
                    color: "#f97316",
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
      {/* 5. MODAL: ADD FITTING VOUCHER                                              */}
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
