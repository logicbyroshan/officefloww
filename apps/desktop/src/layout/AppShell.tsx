import React, { useState } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { AppNavSection } from "../auth/permissions";
import { ConnectionBanner } from "../design-system/components/UserAvatar";
import { useConnection } from "../hooks/useConnection";

export interface AppShellProps {
  activeSection: AppNavSection;
  onSelectSection: (section: AppNavSection) => void;
  onOpenSearch: () => void;
  pendingApprovalsCount?: number;
  urgentTasksCount?: number;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeSection,
  onSelectSection,
  onOpenSearch,
  pendingApprovalsCount = 0,
  urgentTasksCount = 0,
  children,
}) => {
  const { connected, checkConnection } = useConnection();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--bg-app)",
      }}
    >
      <ConnectionBanner connected={connected} onRetry={checkConnection} />
      <TopBar onOpenSearch={onOpenSearch} connected={connected} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
          activeSection={activeSection}
          onSelectSection={onSelectSection}
          pendingApprovalsCount={pendingApprovalsCount}
          urgentTasksCount={urgentTasksCount}
        />
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            backgroundColor: "var(--bg-app)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
