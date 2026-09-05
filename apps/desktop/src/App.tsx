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
import { GlobalSearchModal } from "./views/search/GlobalSearchModal";
import { LoadingState } from "./design-system/components/FeedbackStates";

const MainApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<AppNavSection>("orders");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Initialize theme and global search shortcut
  useEffect(() => {
    initAccentTheme();
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener("officefloww:open-search", handleOpenSearch);
    return () => window.removeEventListener("officefloww:open-search", handleOpenSearch);
  }, []);


  if (authLoading) {
    return <LoadingState message="Initializing PrintFlow workstation..." />;
  }

  if (!user) {
    return <LoginView />;
  }

  const renderCurrentView = () => {
    switch (activeSection) {
      case "orders":
        return <OrdersWorkspaceView mode="ALL_ORDERS" />;

      case "lanyard_orders":
        return <OrdersWorkspaceView mode="LANYARD_ORDERS" />;

      case "card_orders":
        return <IDCardWorkspaceView />;

      case "labour_lanyard":
        return <OrdersWorkspaceView mode="LABOUR_LANYARD" />;

      case "stock":
        return <StockDashboardView />;

      default:
        return <OrdersWorkspaceView mode="ALL_ORDERS" />;
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
        onSelectOrder={(_id) => setIsSearchOpen(false)}
        onSelectClient={(_id) => setIsSearchOpen(false)}
        onSelectTask={() => {
          setActiveSection("orders");
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
