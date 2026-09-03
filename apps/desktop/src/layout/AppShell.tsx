import React, { useState, useEffect } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { AppNavSection } from "../auth/permissions";
import { ConnectionBanner } from "../design-system/components/UserAvatar";
import { useConnection } from "../hooks/useConnection";
import { VoiceAssistantBar } from "../views/voice/VoiceAssistantBar";

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
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Keyboard shortcut Ctrl+Shift+V for voice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "V" || e.key === "v")) {
        e.preventDefault();
        setIsVoiceActive((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#090c13",
        position: "relative",
      }}
    >
      {/* Ambient background mesh matching login screen */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(255, 107, 139, 0.09) 0%, transparent 45%),
            radial-gradient(circle at 85% 25%, rgba(99, 102, 241, 0.10) 0%, transparent 50%),
            radial-gradient(circle at 50% 85%, rgba(56, 189, 248, 0.06) 0%, transparent 45%),
            radial-gradient(circle at 75% 85%, rgba(192, 132, 252, 0.08) 0%, transparent 45%),
            linear-gradient(rgba(255, 255, 255, 0.014) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.014) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 100% 100%, 100% 100%, 100% 100%, 32px 32px, 32px 32px",
          zIndex: 0,
        }}
      />

      {/* Global Voice Assistant Bar */}
      <VoiceAssistantBar
        isOpen={isVoiceActive}
        onClose={() => setIsVoiceActive(false)}
        activeSection={activeSection}
        onNavigate={onSelectSection}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
        }}
      >
        <ConnectionBanner connected={connected} onRetry={checkConnection} />
        <TopBar
          onOpenSearch={onOpenSearch}
          connected={connected}
          onToggleVoice={() => setIsVoiceActive(!isVoiceActive)}
          isVoiceActive={isVoiceActive}
          onNavigate={onSelectSection}
        />

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
              backgroundColor: "transparent",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
