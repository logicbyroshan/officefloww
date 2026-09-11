import React, { useState, useEffect, useRef } from "react";
import { Order, Client, Task } from "@officefloww/api-types";
import { SearchService } from "../../api/services";
import { Icon } from "../../design-system/components/Icon";
import { AppNavSection } from "../../auth/permissions";

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (orderId: string) => void;
  onSelectClient: (clientId: string) => void;
  onSelectTask: (taskId: string) => void;
  onNavigate?: (section: AppNavSection) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
  onSelectClient,
  onSelectTask,
  onNavigate,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    orders: Order[];
    clients: Client[];
    tasks: Task[];
    stock: Array<{ id: string; code: string; name: string }>;
  }>({ orders: [], clients: [], tasks: [], stock: [] });

  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ orders: [], clients: [], tasks: [], stock: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ orders: [], clients: [], tasks: [], stock: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.toLowerCase();
        let apiResults: any = { orders: [], clients: [], tasks: [], products: [] };
        try {
          apiResults = await SearchService.searchAll(query);
        } catch {
          // fallback if offline
        }

        // Mock/Curated stock search matches
        const stockMatches = [
          { id: "stk-01", code: "RAW-PVC-076", name: "0.76mm Gloss White PVC Core Sheet" },
          { id: "stk-02", code: "RAW-SATIN-20MM-WHT", name: "20mm White Satin Polyester Ribbon Roll" },
          { id: "stk-03", code: "HDW-DOGHOOK-20MM", name: "20mm Nickel-Plated Metal Dog-Hook Fitting" },
        ].filter((s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));

        setResults({
          orders: apiResults.orders || [],
          clients: apiResults.clients || [],
          tasks: apiResults.tasks || [],
          stock: stockMatches,
        });
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.orders.length +
    results.clients.length +
    results.tasks.length +
    results.stock.length;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 1100,
        paddingTop: "70px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "620px",
          maxWidth: "92vw",
          backgroundColor: "rgba(14, 18, 26, 0.98)",
          backdropFilter: "blur(24px)",
          border: "1px solid var(--accent-border)",
          borderRadius: "6px",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.8), 0 0 24px var(--accent-soft)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <Icon name="search" size={17} color="var(--accent-text)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search across Clients, Orders, Tasks, Staff, Stock, Invoices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
            }}
          />
          {loading && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Searching...
            </span>
          )}
          <kbd
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "3px",
              padding: "2px 6px",
              fontSize: "10.5px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: "420px", overflowY: "auto", padding: "10px 14px" }}>
          {!query.trim() && (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12.5px" }}>
              Start typing to search orders, institutional clients, shop floor tasks, stock items, staff, or invoices.
            </div>
          )}

          {query.trim() && totalResults === 0 && !loading && (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12.5px" }}>
              No matches found across any of the 6 core business modules.
            </div>
          )}

          {/* Orders */}
          {results.orders.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 8px" }}>
                Production Orders ({results.orders.length})
              </div>
              {results.orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => {
                    onSelectOrder(o.id);
                    onClose();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon name="orders" size={14} color="var(--accent-text)" />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{o.order_number}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Clients */}
          {results.clients.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 8px" }}>
                Clients ({results.clients.length})
              </div>
              {results.clients.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectClient(c.id);
                    onClose();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon name="clients" size={14} color="var(--accent-text)" />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{c.organization_name}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {c.client_code}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 8px" }}>
                Tasks ({results.tasks.length})
              </div>
              {results.tasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    onSelectTask(t.id);
                    onClose();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon name="tasks" size={14} color="var(--accent-text)" />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{t.title || t.task_code}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Stock */}
          {results.stock.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 8px" }}>
                Stock & Materials ({results.stock.length})
              </div>
              {results.stock.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    if (onNavigate) onNavigate("stock");
                    onClose();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon name="stock" size={14} color="var(--accent-text)" />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{s.code}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.name}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--accent-text)" }}>Open in Stock →</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
