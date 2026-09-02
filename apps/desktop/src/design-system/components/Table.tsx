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
  keyExtractor: (row: T, index: number) => string;
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
  const padding = compact ? "6px 10px" : "10px 12px";

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        backgroundColor: "var(--bg-card)",
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
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
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
                style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid var(--accent)",
                      borderRightColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  <span>Loading table data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "36px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const rowKey = keyExtractor(row, idx);
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
                      ? "rgba(255, 255, 255, 0.015)"
                      : "transparent",
                    cursor: onRowClick ? "pointer" : "default",
                    transition: "background-color 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick && !isSelected) {
                      e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (onRowClick && !isSelected) {
                      e.currentTarget.style.backgroundColor =
                        idx % 2 === 1 ? "rgba(255, 255, 255, 0.015)" : "transparent";
                    }
                  }}
                >
                  {columns.map((col) => {
                    const content = col.render
                      ? col.render(row, idx)
                      : (row as any)[col.key] !== undefined
                      ? String((row as any)[col.key])
                      : "-";

                    return (
                      <td
                        key={col.key}
                        style={{
                          padding,
                          fontSize: "12px",
                          color: "var(--text-primary)",
                          textAlign: col.align || "left",
                          verticalAlign: "middle",
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
        padding: "10px 12px",
        fontSize: "12px",
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

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            padding: "4px 8px",
            backgroundColor: "var(--bg-muted)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-xs)",
            color: "var(--text-primary)",
            fontSize: "11px",
            cursor: currentPage <= 1 ? "not-allowed" : "pointer",
            opacity: currentPage <= 1 ? 0.4 : 1,
          }}
        >
          Previous
        </button>

        <span style={{ padding: "0 6px", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            padding: "4px 8px",
            backgroundColor: "var(--bg-muted)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-xs)",
            color: "var(--text-primary)",
            fontSize: "11px",
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
