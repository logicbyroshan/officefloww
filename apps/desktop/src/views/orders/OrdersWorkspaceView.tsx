import React, { useState, useMemo } from "react";
import { Icon } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";
import { useLanyardStore, LanyardOrderEntry } from "./lanyardOrdersStore";
import { useIDCardStore, IDCardCategory } from "./idCardOrdersStore";

export type OrderScope = "full_set" | "lanyard_only" | "idcard_only";

function getFormattedDateToday(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

function parseQtyFromDescription(desc: string): number {
  const match = desc.match(/\b(\d[\d,]*)\b/);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ""), 10) || 0;
}

const SCOPE_OPTIONS: { id: OrderScope; label: string; color: string; accent: string; btnColor: string }[] = [
  { id: "full_set", label: "Full Set", color: "#4ade80", accent: "rgba(34, 197, 94, 0.15)", btnColor: "#16a34a" },
  { id: "lanyard_only", label: "Lanyard Only", color: "#38bdf8", accent: "rgba(56, 189, 248, 0.15)", btnColor: "#0284c7" },
  { id: "idcard_only", label: "ID Card Only", color: "#c084fc", accent: "rgba(192, 132, 252, 0.15)", btnColor: "#7c3aed" },
];

export const OrdersWorkspaceView: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { orders: lanyardOrders, addOrder: addLanyardOrder } = useLanyardStore();
  const { orders: idCardOrders, addOrder: addIDCardOrder } = useIDCardStore();

  const [orderScope, setOrderScope] = useState<OrderScope>("full_set");
  const [description, setDescription] = useState<string>("");

  const includeLanyard = orderScope === "full_set" || orderScope === "lanyard_only";
  const includeIDCard = orderScope === "full_set" || orderScope === "idcard_only";

  const today = getFormattedDateToday();
  const parsedQty = useMemo(() => parseQtyFromDescription(description), [description]);
  const scopeActive = SCOPE_OPTIONS.find((s) => s.id === orderScope)!;
  const hasDesc = description.trim().length > 0;

  const handleCreateOrder = () => {
    const desc = description.trim();
    if (!desc) {
      toastError("Description Required", "Please describe the order before creating it.");
      return;
    }

    const qty = parsedQty || 100;
    const nextLanyardSN = (lanyardOrders[0]?.sn || 1280) + 1;
    const nextIdcSN = (idCardOrders[0]?.sn || 1500) + 1;

    if (includeLanyard) {
      const newEntry: LanyardOrderEntry = {
        id: `lan_hub_${Date.now()}`,
        sn: nextLanyardSN,
        date: today,
        mplName: desc,
        size: "16mm",
        qty,
        designDone: false,
        goneForPrint: false,
        isPrinted: false,
        goneForFitting: false,
        fittingStatus: "pending_assignment",
        fittingItem: "DST-V",
        hookType: "Dog Hook",
        jointerType: "None",
        fittingHardware: "Standard",
      };
      addLanyardOrder(newEntry);
    }

    if (includeIDCard) {
      addIDCardOrder({
        sn: nextIdcSN,
        date: today,
        client: desc,
        cardCategory: "Student" as IDCardCategory,
        workQtyDisplay: `${qty} students`,
        totalQty: qty,
        designDone: false,
        sentForPrint: false,
        printOperator: "Kamal Sir",
        fileLocation: "excel",
        status: "kamal",
        holderName: "DST-V",
      });
    }

    toastSuccess(
      "Order Created",
      includeLanyard && includeIDCard
        ? `Full set (${qty} pcs) ingested into Lanyard & ID Card ledgers.`
        : includeLanyard
        ? `Lanyard order (${qty} pcs) added.`
        : `ID Card order (${qty} cards) added.`
    );

    setDescription("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "20px 24px",
        backgroundColor: "#080b12",
        minHeight: "100vh",
        color: "#f8fafc",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      <div
        style={{
          borderRadius: "10px",
          backgroundColor: "#0e131f",
          border: `1.5px solid ${hasDesc ? scopeActive.color + "40" : "rgba(255, 255, 255, 0.07)"}`,
          boxShadow: hasDesc ? `0 0 24px ${scopeActive.color}12` : "0 4px 20px rgba(0,0,0,0.3)",
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "#94a3b8",
                letterSpacing: "0.5px",
              }}
            >
              {today}
            </span>
            {parsedQty > 0 && hasDesc && (
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "4px",
                  backgroundColor: scopeActive.accent,
                  border: `1px solid ${scopeActive.color}40`,
                  fontSize: "12px",
                  fontWeight: 700,
                  color: scopeActive.color,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {parsedQty.toLocaleString()} pcs detected
              </span>
            )}
          </div>

          <div
            style={{
              display: "inline-flex",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              padding: "3px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              gap: "2px",
            }}
          >
            {SCOPE_OPTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setOrderScope(s.id)}
                style={{
                  height: "30px",
                  padding: "0 14px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: orderScope === s.id ? s.accent : "transparent",
                  color: orderScope === s.id ? s.color : "#64748b",
                  fontSize: "12px",
                  fontWeight: orderScope === s.id ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                  outline: orderScope === s.id ? `1px solid ${s.color}40` : "none",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <label
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
            }}
          >
            Order Description
          </label>
          <textarea
            id="order-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleCreateOrder();
              }
            }}
            placeholder={
              orderScope === "full_set"
                ? "DPS Bhopal — 985 students, 16mm lanyards, Red + Blue colors, Dog Hook, DST-V holder, Student ID cards (Excel format)..."
                : orderScope === "lanyard_only"
                ? "Green Valley School — 500 pcs, 20mm lanyards, Maroon color, Crocodile Clip, Without fitting..."
                : "St. Joseph Convent — 750 staff ID cards, A4 sheet, DOC format, CCH holder..."
            }
            rows={5}
            style={{
              width: "100%",
              resize: "vertical",
              minHeight: "130px",
              padding: "14px 16px",
              backgroundColor: "rgba(255, 255, 255, 0.025)",
              border: `1.5px solid ${hasDesc ? scopeActive.color + "4a" : "rgba(255, 255, 255, 0.08)"}`,
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "15px",
              lineHeight: "1.75",
              fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s ease",
            }}
          />
          <div style={{ fontSize: "11px", color: "#334155", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <span>Include: client name · qty · size (12/16/20mm) · colors · hook · holder · card format</span>
            <span style={{ marginLeft: "auto", color: "#1e293b" }}>Ctrl+Enter to submit</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
          {hasDesc && (
            <span style={{ fontSize: "12px", color: "#475569" }}>
              {"Ingest into: "}
              {includeLanyard && <span style={{ color: "#38bdf8", fontWeight: 600 }}>Lanyard Ledger</span>}
              {includeLanyard && includeIDCard && " + "}
              {includeIDCard && <span style={{ color: "#c084fc", fontWeight: 600 }}>ID Card Ledger</span>}
            </span>
          )}
          <button
            type="button"
            disabled={!hasDesc}
            onClick={handleCreateOrder}
            style={{
              height: "40px",
              padding: "0 26px",
              borderRadius: "6px",
              backgroundColor: hasDesc ? scopeActive.btnColor : "#1e293b",
              border: "none",
              color: hasDesc ? "#fff" : "#475569",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: hasDesc ? "pointer" : "not-allowed",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: hasDesc ? "0 2px 12px rgba(0,0,0,0.3)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <Icon name="plus" size={14} />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      <div
        style={{
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "#0e131f",
          overflow: "hidden",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9" }}>Recent Orders</span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {lanyardOrders.length} Lanyard &bull; {idCardOrders.length} ID Card
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                <th style={{ padding: "10px 14px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", width: "70px" }}>SN</th>
                <th style={{ padding: "10px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", width: "80px" }}>Date</th>
                <th style={{ padding: "10px 14px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Description / Client</th>
                <th style={{ padding: "10px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", width: "120px" }}>Scope</th>
                <th style={{ padding: "10px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", width: "90px" }}>Qty</th>
                <th style={{ padding: "10px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", width: "140px" }}>Lanyard</th>
                <th style={{ padding: "10px 12px", color: "#94a3b8", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", width: "140px" }}>ID Card</th>
              </tr>
            </thead>
            <tbody>
              {lanyardOrders.length === 0 && idCardOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 14px", textAlign: "center", color: "#475569", fontSize: "12.5px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "7px" }}>
                      <Icon name="package" size={28} color="#1e293b" />
                      <span>No orders yet — describe an order above and click Create</span>
                    </div>
                  </td>
                </tr>
              ) : (
                lanyardOrders.slice(0, 20).map((lo) => {
                  const linkedIdc = idCardOrders.find(
                    (io) => io.client.toLowerCase() === lo.mplName.toLowerCase() || io.date === lo.date
                  );
                  return (
                    <tr
                      key={lo.id}
                      style={{ height: "48px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", transition: "background-color 0.12s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.025)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "#38bdf8", fontWeight: 700, fontSize: "12.5px" }}>#{lo.sn}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "#94a3b8", fontSize: "12px" }}>{lo.date}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 500, color: "#e2e8f0", fontSize: "13px", maxWidth: "380px" }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lo.mplName}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          <span style={{ padding: "2px 7px", borderRadius: "3px", backgroundColor: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", fontSize: "10.5px", fontWeight: 700 }}>LANYARD</span>
                          {linkedIdc && <span style={{ padding: "2px 7px", borderRadius: "3px", backgroundColor: "rgba(168, 85, 247, 0.12)", color: "#c084fc", fontSize: "10.5px", fontWeight: 700 }}>ID CARD</span>}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff", fontSize: "13px" }}>{lo.qty.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            backgroundColor: lo.orderReady ? "rgba(34, 197, 94, 0.15)" : lo.goneForFitting ? "rgba(234, 179, 8, 0.15)" : "rgba(255, 255, 255, 0.05)",
                            color: lo.orderReady ? "#4ade80" : lo.goneForFitting ? "#facc15" : lo.isPrinted ? "#38bdf8" : "#94a3b8",
                            fontSize: "11.5px",
                            fontWeight: 600,
                          }}
                        >
                          {lo.orderReady ? "Ready" : lo.goneForFitting ? "In Fitting" : lo.isPrinted ? "Printed" : lo.goneForPrint ? "In Print" : "Design"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {linkedIdc ? (
                          <span style={{ padding: "3px 8px", borderRadius: "4px", backgroundColor: "rgba(168, 85, 247, 0.12)", color: "#c084fc", fontSize: "11.5px", fontWeight: 600 }}>
                            #{linkedIdc.sn}: {linkedIdc.status}
                          </span>
                        ) : (
                          <span style={{ color: "#334155", fontSize: "12px" }}>-</span>
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
    </div>
  );
};