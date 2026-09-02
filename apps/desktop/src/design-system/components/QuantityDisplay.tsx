import React from "react";
import { QuantitySummary } from "@officefloww/api-types";

export interface ProgressBarProps {
  value: number;
  max?: number;
  height?: number;
  color?: string;
  showPercent?: boolean;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  height = 6,
  color = "var(--accent)",
  showPercent = false,
  style,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", ...style }}>
      <div
        style={{
          flex: 1,
          height,
          backgroundColor: "var(--bg-muted)",
          borderRadius: "var(--radius-xs)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percentage}%`,
            backgroundColor: color,
            borderRadius: "var(--radius-xs)",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      {showPercent && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            color: "var(--text-secondary)",
            minWidth: "32px",
            textAlign: "right",
          }}
        >
          {percentage}%
        </span>
      )}
    </div>
  );
};

export interface QuantityDisplayProps {
  summary?: QuantitySummary | null;
  ordered?: number;
  produced?: number;
  defective?: number;
  waste?: number;
  packed?: number;
  compact?: boolean;
  style?: React.CSSProperties;
}

export const QuantityDisplay: React.FC<QuantityDisplayProps> = ({
  summary,
  ordered = 0,
  produced = 0,
  defective = 0,
  waste = 0,
  packed = 0,
  compact = false,
  style,
}) => {
  const ord = summary ? summary.ordered : ordered;
  const prod = summary ? summary.produced : produced;
  const def = summary ? summary.defective : defective;
  const wst = summary ? summary.wasted : waste;
  const pck = summary ? summary.packed : packed;
  const good = summary ? summary.net_good_units : prod - def;
  const scrapRate = summary ? summary.scrap_rate_percentage : ord > 0 ? ((def + wst) / ord) * 100 : 0;

  if (compact) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", ...style }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {good.toLocaleString()} / {ord.toLocaleString()}
        </span>
        {def + wst > 0 && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--status-error)",
              padding: "1px 4px",
              backgroundColor: "var(--status-error-soft)",
              borderRadius: "var(--radius-xs)",
            }}
          >
            +{def + wst} scrap
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--text-muted)",
          }}
        >
          Authoritative Quantity Breakdown
        </span>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: scrapRate > 5 ? "var(--status-error)" : "var(--text-secondary)",
          }}
        >
          Scrap Rate: <strong>{Number(scrapRate).toFixed(1)}%</strong>
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "8px",
          textAlign: "center",
        }}
      >
        <div style={{ backgroundColor: "var(--bg-muted)", padding: "6px 8px", borderRadius: "var(--radius-xs)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Ordered</div>
          <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)", marginTop: "2px" }}>
            {ord.toLocaleString()}
          </div>
        </div>

        <div style={{ backgroundColor: "var(--bg-muted)", padding: "6px 8px", borderRadius: "var(--radius-xs)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Good / Accepted</div>
          <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--status-success)", marginTop: "2px" }}>
            {good.toLocaleString()}
          </div>
        </div>

        <div style={{ backgroundColor: "var(--bg-muted)", padding: "6px 8px", borderRadius: "var(--radius-xs)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Defective</div>
          <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: def > 0 ? "var(--status-error)" : "var(--text-muted)", marginTop: "2px" }}>
            {def.toLocaleString()}
          </div>
        </div>

        <div style={{ backgroundColor: "var(--bg-muted)", padding: "6px 8px", borderRadius: "var(--radius-xs)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Material Waste</div>
          <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: wst > 0 ? "var(--status-warning)" : "var(--text-muted)", marginTop: "2px" }}>
            {wst.toLocaleString()}
          </div>
        </div>

        <div style={{ backgroundColor: "var(--bg-muted)", padding: "6px 8px", borderRadius: "var(--radius-xs)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Packed</div>
          <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-text)", marginTop: "2px" }}>
            {pck.toLocaleString()}
          </div>
        </div>
      </div>

      <ProgressBar value={good} max={ord || 1} height={6} showPercent />
    </div>
  );
};
