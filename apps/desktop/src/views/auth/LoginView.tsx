import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { SEED_ACCOUNTS } from "../../api/auth.service";
import { Button } from "../../design-system/components/Button";
import { Input } from "../../design-system/components/Input";
import { RoleBadge } from "../../design-system/components/Badge";

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@officefloww.com");
  const [password, setPassword] = useState("OfficeFloww@2026");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (accountEmail: string) => {
    setEmail(accountEmail);
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(accountEmail, "OfficeFloww@2026");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        backgroundColor: "var(--bg-app)",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "820px",
          maxWidth: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
        }}
      >
        {/* Left Side: Standard Login Form */}
        <div style={{ padding: "32px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: "var(--accent)",
                  borderRadius: "var(--radius-xs)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "14px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                OF
              </div>
              <div>
                <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                  OfficeFloww
                </h1>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Industrial Production OS
                </p>
              </div>
            </div>

            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Log in to your factory workstation account to access orders, tasks, and machine queues.
            </p>

            {errorMsg && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "var(--status-error-soft)",
                  border: "1px solid var(--status-error-border)",
                  borderRadius: "var(--radius-xs)",
                  color: "var(--status-error)",
                  fontSize: "11px",
                  marginBottom: "16px",
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Input
                label="Work Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                icon="users"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                icon="lock"
              />
              <div style={{ marginTop: "6px" }}>
                <Button variant="primary" type="submit" loading={loading} style={{ width: "100%" }}>
                  Authenticate Workstation
                </Button>
              </div>
            </form>
          </div>

          <div style={{ marginTop: "24px", fontSize: "11px", color: "var(--text-muted)" }}>
            OfficeFloww v3.0.0 • Connected to Live FastAPI Engine
          </div>
        </div>

        {/* Right Side: Quick Seed Role Switcher for Testing */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            borderLeft: "1px solid var(--border-subtle)",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <h3 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              Quick Role Switcher (Seed Accounts)
            </h3>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              One-click access to test role-based permissions and floor workflows:
            </p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", paddingRight: "4px" }}>
            {SEED_ACCOUNTS.map((acc) => (
              <div
                key={acc.email}
                onClick={() => handleQuickLogin(acc.email)}
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xs)",
                  padding: "8px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "border-color 0.15s ease, background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.backgroundColor = "var(--bg-card)";
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {acc.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {acc.description}
                  </div>
                </div>
                <div>
                  <RoleBadge role={acc.role} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
