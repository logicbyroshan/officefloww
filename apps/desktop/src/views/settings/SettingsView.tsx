import React, { useState } from "react";
import { ACCENT_THEMES, applyAccentTheme } from "../../design-system/tokens/theme";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Card } from "../../design-system/components/Card";
import { Input } from "../../design-system/components/Input";
import { Button } from "../../design-system/components/Button";
import { Icon, IconName } from "../../design-system/components/Icon";
import { useToast } from "../../design-system/components/Toast";
import { getApiBaseUrl, setApiBaseUrl } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Table } from "../../design-system/components/Table";

type SettingsCategory =
  | "general"
  | "products"
  | "workflows"
  | "machines"
  | "automation"
  | "voice"
  | "audit";

interface CategoryNav {
  id: SettingsCategory;
  label: string;
  icon: IconName;
  desc: string;
}

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("general");
  const [selectedTheme, setSelectedTheme] = useState(
    () => localStorage.getItem("officefloww_accent_theme") || "coral"
  );
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [pingLoading, setPingLoading] = useState(false);

  const categories: CategoryNav[] = [
    { id: "general", label: "General & Branding", icon: "settings", desc: "Workstation theme, brand domain, API host" },
    { id: "products", label: "Products & BOM", icon: "products", desc: "Bill of materials, standard recipes, items" },
    { id: "workflows", label: "Workflow Templates", icon: "layers", desc: "9-stage production routing & approval steps" },
    { id: "machines", label: "Machines & Batches", icon: "production", desc: "Sublimation presses, cutters, card printers" },
    { id: "automation", label: "Automation Rules", icon: "cpu", desc: "Trigger-action rules for inventory & tickets" },
    { id: "voice", label: "Voice & AI Assistant", icon: "mic", desc: "Natural language query engine & speech settings" },
    { id: "audit", label: "System & Audit Trail", icon: "shield", desc: "Immutable cryptographic ledger & telemetry logs" },
  ];

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    applyAccentTheme(themeId);
    success("Theme Updated", `Switched accent theme to ${themeId}.`);
  };

  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiUrl);
    success("API Endpoint Saved", "Workstation will route requests to this address.");
  };

  const handlePingBackend = async () => {
    setPingLoading(true);
    setPingStatus(null);
    try {
      const openapiUrl = apiUrl.replace("/api/v1", "/openapi.json");
      const res = await fetch(openapiUrl);
      if (res.ok) {
        const data = await res.json();
        setPingStatus(`Connected: ${data.info.title} v${data.info.version}`);
        success("Backend Online", "FastAPI modular server connected successfully.");
      } else {
        setPingStatus(`Error: HTTP ${res.status}`);
        toastError("Connection Issue", `Server responded with status ${res.status}`);
      }
    } catch (err: any) {
      setPingStatus(`Unreachable: ${err.message}`);
      toastError("Connection Failed", err.message);
    } finally {
      setPingLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Settings & System Configuration"
        badge={
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--accent-text)",
              backgroundColor: "rgba(255, 138, 115, 0.12)",
              border: "1px solid var(--accent-border)",
              borderRadius: "4px",
              padding: "2px 8px",
            }}
          >
            Adharsh Bhopal OS Core
          </span>
        }
      />

      <div style={{ padding: "16px 24px", display: "flex", gap: "20px", flex: 1 }}>
        {/* Left Column: Category Navigation */}
        <div
          style={{
            width: "240px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            paddingRight: "16px",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", padding: "0 8px 8px 8px" }}>
            Configuration Areas
          </div>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "4px",
                  border: "1px solid " + (isActive ? "var(--accent-border)" : "transparent"),
                  backgroundColor: isActive ? "rgba(255, 138, 115, 0.12)" : "transparent",
                  color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Icon name={cat.icon} size={15} color={isActive ? "var(--accent-text)" : "var(--text-muted)"} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Panel Body */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", maxWidth: "800px" }}>
          {activeCategory === "general" && (
            <>
              {/* Product Theme Accent */}
              <Card title="Product Accent Color" subtitle="Single accent color used across all interactive controls.">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                  {ACCENT_THEMES.map((theme) => {
                    const isSelected = selectedTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleThemeChange(theme.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          borderRadius: "4px",
                          border: isSelected ? `2px solid ${theme.accent}` : "1px solid rgba(255, 255, 255, 0.08)",
                          backgroundColor: isSelected ? "rgba(255, 255, 255, 0.05)" : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: theme.accent }} />
                        <span style={{ fontSize: "12px", color: isSelected ? "#fff" : "var(--text-secondary)", fontWeight: isSelected ? 700 : 500 }}>
                          {theme.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* API Core Address */}
              <Card title="FastAPI Core Server" subtitle="Specify the backend API address for desktop database synchronization.">
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Backend API Base URL"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                    />
                  </div>
                  <Button variant="secondary" size="md" onClick={handleSaveApiUrl}>
                    Save URL
                  </Button>
                  <Button variant="primary" size="md" onClick={handlePingBackend} loading={pingLoading}>
                    Ping Server
                  </Button>
                </div>
                {pingStatus && (
                  <div style={{ marginTop: "10px", fontSize: "12px", fontFamily: "var(--font-mono)", color: pingStatus.startsWith("Error") ? "var(--status-error)" : "#10b981" }}>
                    {pingStatus}
                  </div>
                )}
              </Card>

              {/* Firm Information */}
              <Card title="Firm Identity & Institutional Domain">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Enterprise System:</span>
                    <strong style={{ color: "#fff" }}>PrintFlow — Adharsh Bhopal OS</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Institutional Domain:</span>
                    <strong style={{ color: "var(--accent-text)" }}>@adharshbhopal.in</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Logged In As:</span>
                    <strong style={{ color: "#fff" }}>{user?.email} ({user?.role})</strong>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeCategory === "products" && (
            <Card title="Standard Product Master & Recipes (BOM)">
              <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "var(--text-muted)" }}>
                Bills of Materials define required raw materials automatically reserved for each product order.
              </p>
              <Table
                columns={[
                  { key: "code", header: "Product SKU", render: (p) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>{p.code}</span> },
                  { key: "name", header: "Product Description", render: (p) => <span style={{ fontWeight: 600, color: "#fff" }}>{p.name}</span> },
                  { key: "bom", header: "BOM Components", render: (p) => <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>{p.bom}</span> },
                  { key: "basePrice", header: "Standard Price", align: "right", render: (p) => <span style={{ fontFamily: "var(--font-mono)", color: "#34d399", fontWeight: 700 }}>₹{p.basePrice}</span> },
                ]}
                data={[
                  { id: "1", code: "PRD-LANYARD-20MM", name: "20mm Multicolor Satin Lanyard", bom: "1m White Ribbon + 1 Dog Hook", basePrice: "24.50" },
                  { id: "2", code: "PRD-ID-PVC-GLOSS", name: "0.76mm Gloss Thermal ID Card", bom: "1 PVC Sheet + Overlay Film", basePrice: "35.00" },
                  { id: "3", code: "PRD-BADGE-METAL", name: "Custom Metallic Pin-Back Badge", bom: "Pin Base + Metallic Enamel", basePrice: "48.00" },
                ]}
              />
            </Card>
          )}

          {activeCategory === "workflows" && (
            <Card title="9-Stage Production Lifecycle Sequence">
              <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "var(--text-muted)" }}>
                Standard operational states and transition gates enforced on every manufacturing ticket.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { step: "01", name: "DRAFT / QUOTED", desc: "Commercial quotation approved by customer" },
                  { step: "02", name: "CONFIRMED", desc: "Advance recorded, BOM automatically reserved in stock" },
                  { step: "03", name: "PREPRESS & ARTWORK", desc: "Design rasterization, vector repeat layout created" },
                  { step: "04", name: "PROOF APPROVAL", desc: "Digital signoff by institutional coordinator" },
                  { step: "05", name: "PRINTING / SUBLIMATION", desc: "High-speed sublimation press run on ribbons/sheets" },
                  { step: "06", name: "ASSEMBLY & FITTING", desc: "Hardware dog-hooks, crimping, and card slotting" },
                  { step: "07", name: "QUALITY CONTROL (QC)", desc: "100% inspection pass, defect tolerance check" },
                  { step: "08", name: "PACKING & BUNDLING", desc: "Count verification, barcode labeling on cartons" },
                  { step: "09", name: "DISPATCHED / DELIVERED", desc: "Handed over to courier/hand delivery, invoice finalized" },
                ].map((s) => (
                  <div
                    key={s.step}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "8px 12px",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "4px",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", fontWeight: 700, color: "var(--accent-text)" }}>
                      {s.step}
                    </span>
                    <strong style={{ fontSize: "12.5px", color: "#fff", width: "200px" }}>{s.name}</strong>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.desc}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeCategory === "machines" && (
            <Card title="Floor Machine Assets & Health Telemetry">
              <Table
                columns={[
                  { key: "code", header: "Machine ID", render: (m) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>{m.code}</span> },
                  { key: "name", header: "Equipment Name", render: (m) => <span style={{ fontWeight: 600, color: "#fff" }}>{m.name}</span> },
                  { key: "operator", header: "Assigned Operator", render: (m) => <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{m.operator}</span> },
                  { key: "temp", header: "Operating Temp", render: (m) => <span style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>{m.temp}</span> },
                  { key: "status", header: "Telemetry Status", render: (m) => <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>{m.status}</span> },
                ]}
                data={[
                  { id: "1", code: "MC-SUB-01", name: "Rotary Sublimation Press #1", operator: "Dinesh Kumar", temp: "215°C", status: "OPTIMAL" },
                  { id: "2", code: "MC-FLAT-02", name: "Flatbed Thermal Card Press #2", operator: "Unassigned", temp: "185°C", status: "STANDBY" },
                  { id: "3", code: "MC-CUT-01", name: "High Precision Rotary Blade Unit", operator: "Sunil Yadav", temp: "Ambient", status: "ONLINE" },
                ]}
              />
            </Card>
          )}

          {activeCategory === "automation" && (
            <Card title="Event-Driven Automation Engine">
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { trigger: "Order Confirmed", action: "Auto-reserve required BOM inventory", active: true },
                  { trigger: "Proof Approved by Client", action: "Advance task queue to Sublimation Press", active: true },
                  { trigger: "Stock Reaches Minimum", action: "Notify Purchase Manager and flag in Dashboard", active: true },
                  { trigger: "Task Blocked on Floor", action: "Alert Line Manager via instant operational notification", active: true },
                ].map((rule, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "4px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#fff" }}>
                        WHEN: {rule.trigger}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--accent-text)", marginTop: "2px" }}>
                        THEN: {rule.action}
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>ACTIVE</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeCategory === "voice" && (
            <Card title="Voice & Natural Language AI Assistant">
              <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "var(--text-muted)" }}>
                Enables hands-free telemetry queries and operational navigation from shop-floor terminals.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                  <span style={{ color: "var(--text-muted)" }}>AI Assistant Endpoint:</span>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--accent-text)" }}>POST /api/v1/ai/query</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Supported Languages:</span>
                  <strong style={{ color: "#fff" }}>English (India - en-IN)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Context Synchronization:</span>
                  <strong style={{ color: "#10b981" }}>Active Workspace Synced</strong>
                </div>
              </div>
            </Card>
          )}

          {activeCategory === "audit" && (
            <Card title="Cryptographic System Audit Trail">
              <Table
                columns={[
                  { key: "time", header: "Timestamp", width: "130px", render: (a) => <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}>{a.time}</span> },
                  { key: "user", header: "User Account", render: (a) => <span style={{ fontWeight: 600, color: "#fff" }}>{a.user}</span> },
                  { key: "action", header: "Operational Action", render: (a) => <span style={{ color: "var(--accent-text)", fontWeight: 500 }}>{a.action}</span> },
                  { key: "hash", header: "Record Hash", render: (a) => <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--text-muted)" }}>{a.hash}</span> },
                ]}
                data={[
                  { id: "1", time: "13:30:15", user: "admin@adharshbhopal.in", action: "User authenticated on desktop node", hash: "sha256:7f01c9a..." },
                  { id: "2", time: "12:15:20", user: "manager@adharshbhopal.in", action: "Created task TSK-DES-9CB135", hash: "sha256:3a910bf..." },
                  { id: "3", time: "11:42:00", user: "manager@adharshbhopal.in", action: "Issued 500 Dog Hooks to Ramesh Unit", hash: "sha256:e490fa1..." },
                ]}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
