import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ToastProvider } from "./design-system/components/Toast";
import { initAccentTheme } from "./design-system/tokens/theme";
import { AppShell } from "./layout/AppShell";
import { AppNavSection } from "./auth/permissions";

// Services & Hooks
import {
  OrdersService,
  TasksService,
  ApprovalsService,
  ClientsService,
  ProductsService,
} from "./api/services";
import { useAsync } from "./hooks/useAsync";

// Views
import { LoginView } from "./views/auth/LoginView";
import { DashboardView } from "./views/dashboard/DashboardView";
import { TasksView } from "./views/tasks/TasksView";
import { StaffView } from "./views/staff/StaffView";
import { LabourView } from "./views/labour/LabourView";
import { StockDashboardView } from "./views/stock/StockDashboardView";
import { ClientsView } from "./views/clients/ClientsView";
import { OrderDetailView } from "./views/orders/OrderDetailView";
import { NewOrderModal } from "./views/orders/NewOrderModal";
import { OrdersWorkspaceView } from "./views/orders/OrdersWorkspaceView";
import { NewClientModal } from "./views/clients/NewClientModal";
import { BillingView } from "./views/billing/BillingView";
import { SettingsView } from "./views/settings/SettingsView";
import { GlobalSearchModal } from "./views/search/GlobalSearchModal";
import { LoadingState } from "./design-system/components/FeedbackStates";

const MainApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<AppNavSection>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  // Initialize theme and global search shortcut
  useEffect(() => {
    initAccentTheme();
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener("officefloww:open-search", handleOpenSearch);
    return () => window.removeEventListener("officefloww:open-search", handleOpenSearch);
  }, []);

  // Primary Data Loading
  const {
    data: ordersData,
    loading: ordersLoading,
    error: ordersError,
    execute: refreshOrders,
  } = useAsync(() => OrdersService.list(), [user]);

  const {
    data: tasksData,
    loading: tasksLoading,
    error: tasksError,
    execute: refreshTasks,
  } = useAsync(() => TasksService.list(), [user]);

  const {
    data: approvalsData,
    loading: approvalsLoading,
    error: approvalsError,
    execute: refreshApprovals,
  } = useAsync(() => ApprovalsService.list(), [user]);

  const {
    data: clientsData,
    loading: clientsLoading,
    error: clientsError,
    execute: refreshClients,
  } = useAsync(() => ClientsService.list(), [user]);

  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    execute: refreshProducts,
  } = useAsync(() => ProductsService.list(), [user]);

  const refreshAll = () => {
    refreshOrders();
    refreshTasks();
    refreshApprovals();
    refreshClients();
    refreshProducts();
  };

  if (authLoading) {
    return <LoadingState message="Initializing PrintFlow workstation..." />;
  }

  if (!user) {
    return <LoginView />;
  }

  const orders = ordersData || [];
  const tasks = tasksData || [];
  const approvals = approvalsData || [];
  const clients = clientsData || [];
  const products = productsData || [];

  const pendingApprovalsCount = approvals.filter((a) => a.status === "PENDING").length;
  const urgentTasksCount = tasks.filter((t) => t.status === "BLOCKED").length;

  // View routing for the 7 primary workspaces
  const renderCurrentView = () => {
    // 1. Order Detail View (accessible from Clients or Dashboard)
    if (selectedOrderId) {
      return (
        <OrderDetailView
          orderId={selectedOrderId}
          onBack={() => setSelectedOrderId(null)}
          onOrderUpdated={refreshOrders}
        />
      );
    }

    // 2. Primary Workspaces
    switch (activeSection) {
      case "dashboard":
        return (
          <DashboardView
            orders={orders}
            tasks={tasks}
            approvals={approvals}
            clients={clients}
            loading={ordersLoading}
            error={ordersError}
            onRefresh={refreshAll}
            onSelectOrder={(id) => setSelectedOrderId(id)}
            onSelectTask={() => setActiveSection("tasks")}
            onSelectStock={() => setActiveSection("stock")}
            onNewOrder={() => setIsNewOrderOpen(true)}
            onNewClient={() => setIsNewClientOpen(true)}
            onNavigateSection={(sec) => setActiveSection(sec)}
          />
        );

      case "orders":
        return (
          <OrdersWorkspaceView
            onSelectOrder={(id) => setSelectedOrderId(id)}
          />
        );

      case "tasks":
        return (
          <TasksView
            tasks={tasks}
            loading={tasksLoading}
            error={tasksError}
            onRefresh={refreshTasks}
            onGoToOrder={(id) => setSelectedOrderId(id)}
          />
        );

      case "staff":
        return <StaffView />;

      case "labour":
        return <LabourView />;

      case "stock":
        return <StockDashboardView />;

      case "clients":
        return (
          <ClientsView
            clients={clients}
            orders={orders}
            loading={clientsLoading}
            error={clientsError}
            onRefresh={refreshClients}
            initialClientId={selectedClientId}
            onSelectClient={(id) => setSelectedClientId(id)}
            onSelectOrder={(id) => setSelectedOrderId(id)}
            onNewOrder={() => setIsNewOrderOpen(true)}
          />
        );

      case "billing":
        return <BillingView />;

      case "settings":
        return <SettingsView />;

      default:
        return (
          <DashboardView
            orders={orders}
            tasks={tasks}
            approvals={approvals}
            clients={clients}
            loading={ordersLoading}
            error={ordersError}
            onRefresh={refreshAll}
            onSelectOrder={(id) => setSelectedOrderId(id)}
            onSelectTask={() => setActiveSection("tasks")}
            onSelectStock={() => setActiveSection("stock")}
            onNewOrder={() => setIsNewOrderOpen(true)}
            onNewClient={() => setIsNewClientOpen(true)}
            onNavigateSection={(sec) => setActiveSection(sec)}
          />
        );
    }
  };

  return (
    <AppShell
      activeSection={activeSection}
      onSelectSection={(sec) => {
        setSelectedOrderId(null);
        setSelectedClientId(null);
        setActiveSection(sec);
      }}
      onOpenSearch={() => setIsSearchOpen(true)}
      pendingApprovalsCount={pendingApprovalsCount}
      urgentTasksCount={urgentTasksCount}
    >
      {renderCurrentView()}

      {/* Global Search across 6 entities */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectOrder={(id) => {
          setSelectedOrderId(id);
          setIsSearchOpen(false);
        }}
        onSelectClient={(id) => {
          setSelectedClientId(id);
          setIsSearchOpen(false);
        }}
        onSelectTask={() => {
          setActiveSection("tasks");
          setIsSearchOpen(false);
        }}
        onNavigate={(sec) => {
          setActiveSection(sec);
          setIsSearchOpen(false);
        }}
      />

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        clients={clients}
        products={products}
        onOrderCreated={refreshOrders}
      />

      {/* New Client Modal */}
      <NewClientModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        onClientCreated={refreshClients}
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
