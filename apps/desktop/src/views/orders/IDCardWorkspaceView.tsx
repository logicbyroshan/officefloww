import React, { useState, useMemo } from "react";
import { useToast } from "../../design-system/components/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IDCardEntry {
  id: string;
  date: string;
  details: string;
  qty: number;
  goneForPrint: boolean;
  isPrinted: boolean;
  goneForFitting: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

let _idCounter = Date.now();
function generateId(): string {
  return `card-${_idCounter++}`;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: IDCardEntry[] = [
  {
    id: generateId(),
    date: "2026-08-28",
    details: "AIIMS Bhopal — Student ID Cards, Vertical PVC, RFID chip, laminated",
    qty: 450,
    goneForPrint: true,
    isPrinted: true,
    goneForFitting: false,
  },
  {
    id: generateId(),
    date: "2026-09-01",
    details: "Delhi Public School — Staff ID Cards, Horizontal PVC, no RFID",
    qty: 120,
    goneForPrint: true,
    isPrinted: false,
    goneForFitting: false,
  },
  {
    id: generateId(),
    date: "2026-09-03",
    details: "MP Secretariat — Govt Employee IDs, Smart Card, Hologram sticker",
    qty: 80,
    goneForPrint: false,
    isPrinted: false,
    goneForFitting: false,
  },
];

// ─── CheckCell ────────────────────────────────────────────────────────────────

interface CheckCellProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  colorOn: string;
}

const CheckCell: React.FC<CheckCellProps> = ({ checked, onChange, label, colorOn }) => (
  <td style={{ padding: "10px 14px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
    <button
      type="button"
      title={label}
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "none",
        border: `1.5px solid ${checked ? colorOn : "rgba(255,255,255,0.18)"}`,
        borderRadius: "4px",
        padding: "4px 10px",
        cursor: "pointer",
        color: checked ? colorOn : "rgba(255,255,255,0.35)",
        fontSize: "11.5px",
        fontWeight: checked ? 700 : 400,
        fontFamily: "inherit",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        backgroundColor: checked ? `${colorOn}18` : "transparent",
      }}
    >
      <span style={{ fontSize: "13px" }}>{checked ? "☑" : "☐"}</span>
      <span>{label}</span>
    </button>
  </td>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export const IDCardWorkspaceView: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [entries, setEntries] = useState<IDCardEntry[]>(SEED);
  const [searchQuery, setSearchQuery] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newQty, setNewQty] = useState<number | "">("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) => e.details.toLowerCase().includes(q) || formatDate(e.date).toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  const handleAdd = () => {
    if (!newDetails.trim() || !newQty || Number(newQty) < 1) {
      toastError("Enter order details and a valid quantity.");
      return;
    }
    const entry: IDCardEntry = {
      id: generateId(),
      date: todayISO(),
      details: newDetails.trim(),
      qty: Number(newQty),
      goneForPrint: false,
      isPrinted: false,
      goneForFitting: false,
    };
    setEntries((prev) => [entry, ...prev]);
    setNewDetails("");
    setNewQty("");
    toastSuccess("ID Card order added.");
  };

  const handleCheckChange = (id: string, field: keyof IDCardEntry, value: boolean) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toastSuccess("Entry removed.");
  };

  const handleQtyChange = (id: string, val: number) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, qty: Math.max(1, val) } : e)));
  };

  const totalQty = filtered.reduce((s, e) => s + e.qty, 0);
  const pendingPrint = filtered.filter((e) => !e.goneForPrint).length;
  const printing = filtered.filter((e) => e.goneForPrint && !e.isPrinted).length;
  const pendingFitting = filtered.filter((e) => e.isPrinted && !e.goneForFitting).length;
  const done = filtered.filter((e) => e.goneForFitting).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px", gap: "16px", fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)", color: "var(--text-primary, #e2e8f0)", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>🪪</span>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#e2e8f0" }}>
              ID Card Order
            </h1>
          </div>
          <p style={{ margin: "2px 0 0 28px", fontSize: "12px", color: "var(--text-muted, #64748b)" }}>
            {filtered.length} entries · {totalQty.toLocaleString()} total cards
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {[
            { label: "Pending Print", count: pendingPrint, color: "#94a3b8" },
            { label: "At Printer", count: printing, color: "#f59e0b" },
            { label: "Ready for Fitting", count: pendingFitting, color: "#60a5fa" },
            { label: "Done", count: done, color: "#34d399" },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", fontWeight: 600, color }}>
              <span style={{ fontWeight: 800 }}>{count}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Entry Bar */}
      <div style={{ display: "flex", gap: "10px", padding: "12px 16px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Order details — e.g. AIIMS Bhopal, Vertical PVC, RFID…"
          value={newDetails}
          onChange={(e) => setNewDetails(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          style={{ flex: 1, minWidth: "260px", height: "36px", padding: "0 12px", backgroundColor: "rgba(9,12,19,0.95)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "4px", color: "#e2e8f0", fontSize: "13px", outline: "none", fontFamily: "inherit" }}
        />
        <input
          type="number"
          placeholder="Qty"
          min={1}
          value={newQty}
          onChange={(e) => setNewQty(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          style={{ width: "90px", height: "36px", padding: "0 10px", backgroundColor: "rgba(9,12,19,0.95)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "4px", color: "#e2e8f0", fontSize: "13px", fontWeight: 700, outline: "none", fontFamily: "inherit" }}
        />
        <button
          type="button"
          onClick={handleAdd}
          style={{ height: "36px", padding: "0 18px", borderRadius: "4px", backgroundColor: "#0284c7", border: "none", color: "#fff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0369a1")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0284c7")}
        >
          + Add Entry
        </button>
        <div style={{ marginLeft: "auto" }}>
          <input
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ height: "36px", padding: "0 12px", width: "180px", backgroundColor: "rgba(9,12,19,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", color: "#e2e8f0", fontSize: "12.5px", outline: "none", fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "rgba(16,21,32,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "6px", overflow: "hidden", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
              {[
                { label: "Date", w: "110px", align: "left" as const },
                { label: "Order Details", w: "auto", align: "left" as const },
                { label: "Qty", w: "80px", align: "right" as const },
                { label: "Gone for Print", w: "150px", align: "center" as const },
                { label: "Is Printed", w: "130px", align: "center" as const },
                { label: "Gone for Fitting", w: "160px", align: "center" as const },
                { label: "", w: "40px", align: "center" as const },
              ].map(({ label, w, align }) => (
                <th key={label} style={{ padding: "9px 14px", textAlign: align, fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", width: w, borderBottom: "1px solid rgba(255,255,255,0.09)", whiteSpace: "nowrap" }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "13px", fontStyle: "italic" }}>
                  No ID Card entries yet. Add one above.
                </td>
              </tr>
            ) : (
              filtered.map((entry, idx) => {
                const rowBg = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)";
                return (
                  <tr key={entry.id} style={{ backgroundColor: rowBg }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}>
                    {/* Date */}
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.04)", whiteSpace: "nowrap", fontSize: "12px", color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-mono, monospace)" }}>
                      {formatDate(entry.date)}
                    </td>
                    {/* Details */}
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                      <input
                        type="text"
                        value={entry.details}
                        onChange={(ev) => setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, details: ev.target.value } : e)))}
                        style={{ background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: "13px", fontFamily: "inherit", width: "100%", cursor: "text", padding: 0 }}
                      />
                    </td>
                    {/* Qty */}
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.04)", textAlign: "right" }}>
                      <input
                        type="number"
                        min={1}
                        value={entry.qty}
                        onChange={(ev) => handleQtyChange(entry.id, parseInt(ev.target.value, 10) || 1)}
                        style={{ background: "none", border: "none", outline: "none", color: "#f8fafc", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono, monospace)", width: "56px", textAlign: "right", cursor: "text", padding: 0 }}
                      />
                    </td>
                    {/* Checkboxes */}
                    <CheckCell checked={entry.goneForPrint} onChange={(v) => handleCheckChange(entry.id, "goneForPrint", v)} label="Gone for Print" colorOn="#f59e0b" />
                    <CheckCell checked={entry.isPrinted} onChange={(v) => handleCheckChange(entry.id, "isPrinted", v)} label="Is Printed" colorOn="#60a5fa" />
                    <CheckCell checked={entry.goneForFitting} onChange={(v) => handleCheckChange(entry.id, "goneForFitting", v)} label="Gone for Fitting" colorOn="#34d399" />
                    {/* Delete */}
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        title="Remove entry"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", fontSize: "16px", lineHeight: 1, padding: "2px 4px", borderRadius: "3px", fontFamily: "inherit" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
