import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ToastProvider } from "./design-system/components/Toast";
import { initAccentTheme } from "./design-system/tokens/theme";
import { AppShell } from "./layout/AppShell";
import { AppNavSection } from "./auth/permissions";


// Views
import { LoginView } from "./views/auth/LoginView";
import { StockDashboardView } from "./views/stock/StockDashboardView";
import { OrdersWorkspaceView } from "./views/orders/OrdersWorkspaceView";
import { IDCardWorkspaceView } from "./views/orders/IDCardWorkspaceView";
import { LanyardWorkspaceView } from "./views/orders/LanyardWorkspaceView";
import { LabourLanyardWorkspaceView } from "./views/orders/LabourLanyardWorkspaceView";
import { GlobalSearchModal } from "./views/search/GlobalSearchModal";
import { LoadingState } from "./design-system/components/FeedbackStates";

const MainApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<AppNavSection>("orders");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Initialize theme, global search shortcut, and cross-workspace navigation
  useEffect(() => {
    initAccentTheme();
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener("officefloww:open-search", handleOpenSearch);

    const handleNavigate = (e: any) => {
      if (e.detail?.section) {
        setActiveSection(e.detail.section);
      }
    };
    window.addEventListener("officefloww:navigate", handleNavigate as EventListener);

    return () => {
      window.removeEventListener("officefloww:open-search", handleOpenSearch);
      window.removeEventListener("officefloww:navigate", handleNavigate as EventListener);
    };
  }, []);


  if (authLoading) {
    return <LoadingState message="Initializing OfficeFloww workstation..." />;
  }

  if (!user) {
    return <LoginView />;
  }

  const renderCurrentView = () => {
    switch (activeSection) {
      case "orders":
        return <OrdersWorkspaceView />;

      case "lanyard_orders":
        return <LanyardWorkspaceView />;

      case "card_orders":
        return <IDCardWorkspaceView />;

      case "labour_lanyard":
        return <LabourLanyardWorkspaceView />;

      case "stock":
        return <StockDashboardView />;

      default:
        return <OrdersWorkspaceView />;
    }
  };

  return (
    <AppShell
      activeSection={activeSection}
      onSelectSection={(sec) => setActiveSection(sec)}
      onOpenSearch={() => setIsSearchOpen(true)}
    >
      {renderCurrentView()}

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectOrder={(_id) => {
          setActiveSection("orders");
          setIsSearchOpen(false);
        }}
        onSelectClient={(_id) => {
          setActiveSection("orders");
          setIsSearchOpen(false);
        }}
        onSelectTask={() => {
          setActiveSection("lanyard_orders");
          setIsSearchOpen(false);
        }}
        onNavigate={(sec) => {
          setActiveSection(sec);
          setIsSearchOpen(false);
        }}
      />
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
};
