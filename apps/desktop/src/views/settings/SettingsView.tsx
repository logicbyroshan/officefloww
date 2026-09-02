import React, { useState, useEffect } from "react";
import { ACCENT_THEMES, applyAccentTheme } from "../../design-system/tokens/theme";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Card } from "../../design-system/components/Card";
import { Input } from "../../design-system/components/Input";
import { Button } from "../../design-system/components/Button";
import { Badge } from "../../design-system/components/Badge";
import { useToast } from "../../design-system/components/Toast";
import { getApiBaseUrl, setApiBaseUrl } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem("officefloww_accent_theme") || "sapphire");
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [pingLoading, setPingLoading] = useState(false);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    applyAccentTheme(themeId);
    success("Theme Updated", `Switched single accent color to ${themeId}.`);
  };

  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiUrl);
    success("API Endpoint Saved", "The application will route backend requests to this URL.");
  };

  const handlePingBackend = async () => {
    setPingLoading(true);
    setPingStatus(null);
    try {
      const openapiUrl = apiUrl.replace("/api/v1", "/openapi.json");
      const res = await fetch(openapiUrl);
      if (res.ok) {
        const data = await res.json();
        setPingStatus(`Connected: ${data.info.title} v${data.info.version} (${Object.keys(data.paths || {}).length} routes active)`);
        success("Backend Online", "FastAPI modular monolith is responding normally.");
      } else {
        setPingStatus(`Error: HTTP ${res.status}`);
        toastError("Connection Issue", `Server returned status ${res.status}`);
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
        title="Workstation & System Settings"
        subtitle="Manage desktop theme colors, backend connection URLs, and operational environment parameters."
      />

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px", flex: 1, maxWidth: "800px" }}>
        {/* Single Accent Theme Selector */}
        <Card
          title="Single Accent Color Palette"
          subtitle="Configure the application's central accent color token (--accent) while maintaining the structured neutral base"
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
            {ACCENT_THEMES.map((theme) => {
              const isSelected = selectedTheme === theme.id;

              return (
                <div
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border-medium)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--radius-xs)",
                      backgroundColor: theme.accent,
                      boxShadow: isSelected ? `0 0 10px ${theme.accent}` : "none",
                    }}
                  />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", textAlign: "center" }}>
                    {theme.name}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Backend API Configuration */}
        <Card
          title="FastAPI Backend Connection Endpoint"
          subtitle="Configure the REST API server URL and verify connectivity"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <Input
                label="API Base URL"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
              <div style={{ alignSelf: "flex-end" }}>
                <Button variant="secondary" onClick={handleSaveApiUrl}>
                  Save Endpoint
                </Button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
              <Button variant="outline" size="sm" icon="activity" onClick={handlePingBackend} loading={pingLoading}>
                Test Health Ping
              </Button>
              {pingStatus && (
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: pingStatus.startsWith("Connected") ? "var(--status-success)" : "var(--status-error)",
                  }}
                >
                  {pingStatus}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Active Workstation Profile */}
        <Card title="Workstation User Profile" subtitle="Server-side authenticated credentials and RBAC authorization role">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Full Name: </span>
              <strong style={{ color: "var(--text-primary)" }}>{user?.full_name}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Work Email: </span>
              <span style={{ color: "var(--text-secondary)" }}>{user?.email}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Authorized Role: </span>
              <Badge variant="accent">{user?.role || "GUEST"}</Badge>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Account Status: </span>
              <Badge variant="success" dot>Active Workstation</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
