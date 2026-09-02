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
import { ManagementDashboardView } from "./views/dashboard/ManagementDashboardView";
import { QuotationsView } from "./views/quotations/QuotationsView";
import { OrdersView } from "./views/orders/OrdersView";
import { OrderDetailView } from "./views/orders/OrderDetailView";
import { NewOrderModal } from "./views/orders/NewOrderModal";
import { TasksView } from "./views/tasks/TasksView";
import { ApprovalsView } from "./views/approvals/ApprovalsView";
import { ClientsView } from "./views/clients/ClientsView";
import { ClientDetailView } from "./views/clients/ClientDetailView";
import { NewClientModal } from "./views/clients/NewClientModal";
import { ProductsView } from "./views/products/ProductsView";
import { ProductDetailView } from "./views/products/ProductDetailView";
import { StockDashboardView } from "./views/stock/StockDashboardView";
import { PurchasingView } from "./views/purchasing/PurchasingView";
import { ProductionView } from "./views/production/ProductionView";
import { LabourView } from "./views/labour/LabourView";
import { PackingDispatchView } from "./views/packing/PackingDispatchView";
import { BillingView } from "./views/billing/BillingView";
import { ReportsView } from "./views/reports/ReportsView";
import { AuditView } from "./views/audit/AuditView";
import { AutomationView } from "./views/automation/AutomationView";
import { SettingsView } from "./views/settings/SettingsView";
import { GlobalSearchModal } from "./views/search/GlobalSearchModal";
import { LoadingState } from "./design-system/components/FeedbackStates";

const MainApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<AppNavSection>("dashboard");
  const [isManagementDashboard, setIsManagementDashboard] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  // Listen for search shortcut
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
    return <LoadingState message="Restoring workstation session..." />;
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
  const urgentTasksCount = tasks.filter((t) => t.status === "BLOCKED" || t.status === "IN_PROGRESS").length;

  // View Routing
  const renderCurrentView = () => {
    if (selectedOrderId) {
      return (
        <OrderDetailView
          orderId={selectedOrderId}
          clients={clients}
          onBack={() => setSelectedOrderId(null)}
          onSelectTask={(taskId) => {
            setActiveSection("tasks");
          }}
        />
      );
    }

    if (selectedClientId) {
      return (
        <ClientDetailView
          clientId={selectedClientId}
          onBack={() => setSelectedClientId(null)}
          onSelectOrder={(orderId) => setSelectedOrderId(orderId)}
        />
      );
    }

    if (selectedProductId) {
      return (
        <ProductDetailView
          productId={selectedProductId}
          onBack={() => setSelectedProductId(null)}
        />
      );
    }

    switch (activeSection) {
      case "dashboard":
        if (isManagementDashboard || user.role === "OWNER" || user.role === "MANAGER") {
          return (
            <ManagementDashboardView
              orders={orders}
              tasks={tasks}
              approvals={approvals}
              clients={clients}
              onSelectOrder={(id) => setSelectedOrderId(id)}
              onSelectTask={(id) => setActiveSection("tasks")}
              onSwitchToFloorView={() => setIsManagementDashboard(false)}
            />
          );
        }
        return (
          <DashboardView
            orders={orders}
            tasks={tasks}
            approvals={approvals}
            clients={clients}
            loading={ordersLoading || tasksLoading}
            error={ordersError || tasksError}
            onRefresh={refreshAll}
            onSelectOrder={(id) => setSelectedOrderId(id)}
            onSelectTask={(id) => setActiveSection("tasks")}
            onNewOrder={() => setIsNewOrderOpen(true)}
            onNewClient={() => setIsNewClientOpen(true)}
          />
        );
      case "quotations":
        return (
          <QuotationsView
            clients={clients}
            products={products}
            onOrderConverted={(orderId) => {
              refreshOrders();
              setActiveSection("orders");
            }}
          />
        );
      case "orders":
        return (
          <OrdersView
            orders={orders}
            clients={clients}
            loading={ordersLoading}
            error={ordersError}
            onRefresh={refreshOrders}
            onSelectOrder={(id) => setSelectedOrderId(id)}
            onNewOrder={() => setIsNewOrderOpen(true)}
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
      case "approvals":
        return (
          <ApprovalsView
            approvals={approvals}
            loading={approvalsLoading}
            error={approvalsError}
            onRefresh={refreshApprovals}
          />
        );
      case "clients":
        return (
          <ClientsView
            clients={clients}
            loading={clientsLoading}
            error={clientsError}
            onRefresh={refreshClients}
            onSelectClient={(id) => setSelectedClientId(id)}
          />
        );
      case "products":
        return (
          <ProductsView
            products={products}
            loading={productsLoading}
            error={productsError}
            onRefresh={refreshProducts}
            onSelectProduct={(id) => setSelectedProductId(id)}
          />
        );
      case "production":
        return <ProductionView />;
      case "stock":
        return <StockDashboardView />;
      case "purchasing":
        return <PurchasingView />;
      case "labour":
        return <LabourView />;
      case "packing":
      case "dispatch":
        return <PackingDispatchView />;
      case "billing":
        return <BillingView />;
      case "reports":
        return <ReportsView />;
      case "audit":
        return <AuditView />;
      case "automation":
        return <AutomationView />;
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
            onSelectTask={(id) => setActiveSection("tasks")}
            onNewOrder={() => setIsNewOrderOpen(true)}
            onNewClient={() => setIsNewClientOpen(true)}
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
        setSelectedProductId(null);
        setActiveSection(sec);
      }}
      onOpenSearch={() => setIsSearchOpen(true)}
      pendingApprovalsCount={pendingApprovalsCount}
      urgentTasksCount={urgentTasksCount}
    >
      {renderCurrentView()}

      {/* Global Modals */}
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
        onSelectProduct={(id) => {
          setSelectedProductId(id);
          setIsSearchOpen(false);
        }}
        onSelectTask={(id) => {
          setActiveSection("tasks");
          setIsSearchOpen(false);
        }}
      />

      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        clients={clients}
        products={products}
        onOrderCreated={refreshOrders}
      />

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
