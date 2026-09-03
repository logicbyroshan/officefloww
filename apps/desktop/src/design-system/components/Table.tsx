import React from "react";
import { Icon } from "./Icon";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  selectedId?: string;
  emptyText?: string;
  loading?: boolean;
  compact?: boolean;
  style?: React.CSSProperties;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedId,
  emptyText = "No records found",
  loading = false,
  compact = false,
  style,
}: TableProps<T>) {
  const padding = compact ? "8px 12px" : "12px 16px";

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--bg-card)",
        boxShadow: "var(--shadow-sm)",
        ...style,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr
            style={{
              backgroundColor: "var(--bg-muted)",
              borderBottom: "1px solid var(--border-medium)",
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding,
                  width: col.width,
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  color: "var(--text-secondary)",
                  textAlign: col.align || "left",
                  whiteSpace: "nowrap",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      border: "2px solid var(--accent)",
                      borderRightColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  <span>Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "48px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const rowKey = keyExtractor
                ? keyExtractor(row, idx)
                : (row as any)?.id || (row as any)?.code || (row as any)?.key || String(idx);
              const isSelected = selectedId === rowKey;

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row, idx)}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    backgroundColor: isSelected
                      ? "var(--accent-soft)"
                      : idx % 2 === 1
                      ? "rgba(255, 255, 255, 0.02)"
                      : "transparent",
                    cursor: onRowClick ? "pointer" : "default",
                    transition: "background-color 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick && !isSelected) {
                      e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (onRowClick && !isSelected) {
                      e.currentTarget.style.backgroundColor =
                        idx % 2 === 1 ? "rgba(255, 255, 255, 0.02)" : "transparent";
                    }
                  }}
                >
                  {columns.map((col) => {
                    const content = col.render
                      ? col.render(row, idx)
                      : (row as any)[col.key] !== undefined
                      ? String((row as any)[col.key])
                      : "—";

                    return (
                      <td
                        key={col.key}
                        style={{
                          padding,
                          fontSize: "13.5px",
                          color: "var(--text-primary)",
                          textAlign: col.align || "left",
                          verticalAlign: "middle",
                          lineHeight: "1.45",
                        }}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        fontSize: "13px",
        color: "var(--text-muted)",
        borderTop: "1px solid var(--border-subtle)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <div>
        {totalItems !== undefined && (
          <span>
            Total: <strong style={{ color: "var(--text-primary)" }}>{totalItems}</strong> entries
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            padding: "5px 10px",
            backgroundColor: "var(--bg-muted)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-xs)",
            color: "var(--text-primary)",
            fontSize: "12px",
            cursor: currentPage <= 1 ? "not-allowed" : "pointer",
            opacity: currentPage <= 1 ? 0.4 : 1,
          }}
        >
          Previous
        </button>

        <span style={{ padding: "0 8px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            padding: "5px 10px",
            backgroundColor: "var(--bg-muted)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-xs)",
            color: "var(--text-primary)",
            fontSize: "12px",
            cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
            opacity: currentPage >= totalPages ? 0.4 : 1,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};
