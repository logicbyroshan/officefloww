import React, { useState, useEffect, useRef } from "react";
import { Order, Client, Task, Product } from "@officefloww/api-types";
import { SearchService } from "../../api/services";
import { Icon } from "../../design-system/components/Icon";
import { Badge } from "../../design-system/components/Badge";

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (orderId: string) => void;
  onSelectClient: (clientId: string) => void;
  onSelectProduct: (productId: string) => void;
  onSelectTask: (taskId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
  onSelectClient,
  onSelectProduct,
  onSelectTask,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    orders: Order[];
    clients: Client[];
    tasks: Task[];
    products: Product[];
  }>({ orders: [], clients: [], tasks: [], products: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ orders: [], clients: [], tasks: [], products: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else window.dispatchEvent(new CustomEvent("officefloww:open-search"));
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
      setResults({ orders: [], clients: [], tasks: [], products: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await SearchService.searchAll(query);
        setResults(res);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.orders.length +
    results.clients.length +
    results.tasks.length +
    results.products.length;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 1100,
        paddingTop: "80px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "600px",
          maxWidth: "100%",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
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
            gap: "10px",
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <Icon name="search" size={16} color="var(--accent-text)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search orders, clients, tasks, or products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
            }}
          />
          {loading ? (
            <span
              style={{
                width: 14,
                height: 14,
                border: "2px solid var(--accent)",
                borderRightColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }}
            />
          ) : (
            <kbd
              style={{
                backgroundColor: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-xs)",
                padding: "2px 6px",
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
              }}
            >
              ESC
            </kbd>
          )}
        </div>

        {/* Results Stream */}
        <div style={{ maxHeight: "380px", overflowY: "auto", padding: "8px" }}>
          {!query.trim() ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
              Search across production orders, clients, floor tasks, and catalog items.
            </div>
          ) : totalResults === 0 && !loading ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
              No matches found for "{query}".
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Orders */}
              {results.orders.length > 0 && (
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 8px" }}>
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
                        borderRadius: "var(--radius-xs)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icon name="orders" size={13} color="var(--accent-text)" />
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
                          {o.order_number}
                        </span>
                      </div>
                      <Badge variant="default">{o.status}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Clients */}
              {results.clients.length > 0 && (
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 8px" }}>
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
                        borderRadius: "var(--radius-xs)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icon name="clients" size={13} color="var(--status-info)" />
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {c.organization_name}
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                        {c.client_code}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 8px" }}>
                    Floor Tasks ({results.tasks.length})
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
                        borderRadius: "var(--radius-xs)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icon name="tasks" size={13} color="var(--status-warning)" />
                        <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                          {t.title || t.task_code}
                        </span>
                      </div>
                      <Badge variant="default">{t.status}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Products */}
              {results.products.length > 0 && (
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 8px" }}>
                    Products & BOMs ({results.products.length})
                  </div>
                  {results.products.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProduct(p.id);
                        onClose();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-xs)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icon name="package" size={13} color="var(--accent-text)" />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {p.name}
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                        {p.code}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
