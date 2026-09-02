import { apiClient } from "./client";
import {
  Order,
  OrderCreate,
  OrderItem,
  WorkflowInstance,
  Task,
  TaskStatus,
  Client,
  ClientCreate,
  Product,
  FileRecord,
  FileFolder,
  Approval,
  ApprovalStatus,
  QuantitySummary,
  QuantityTransaction,
  QuantityTransactionType,
  AuditLog,
  StockBalance,
  StockItem,
  StockLocation,
  StockMovement,
  Supplier,
  PurchaseOrder,
  PriceTrends,
  Machine,
  ProductionBatch,
  Labourer,
  LabourBatch,
  LabourPayment,
  Asset,
  PackingTask,
  Delivery,
  Invoice,
  OrderCompletionCheck,
  Quotation,
  CostCalculationBreakdown,
  QuotationFeasibilityReport,
  ETACalculationResponse,
  CapacityMetrics,
  AutomationRule,
  AutomationLog,
  ExecutiveDashboardSummary,
  DailyBriefingResponse,
  AIQueryResponse,
} from "@officefloww/api-types";

export const OrdersService = {
  list: (params?: { client_id?: string; status?: string }): Promise<Order[]> =>
    apiClient.orders.list(params),
  get: (id: string): Promise<Order> => apiClient.orders.get(id),
  create: (data: OrderCreate): Promise<Order> => apiClient.orders.create(data),
  getItems: (orderId: string): Promise<OrderItem[]> => apiClient.orders.getItems(orderId),
  getWorkflow: (orderId: string): Promise<WorkflowInstance[]> => apiClient.orders.getWorkflow(orderId),
  getTasks: (orderId: string): Promise<Task[]> => apiClient.orders.getTasks(orderId),
};

export const TasksService = {
  list: (params?: { order_id?: string; status?: TaskStatus }): Promise<Task[]> =>
    apiClient.tasks.list(params),
  get: (id: string): Promise<Task> => apiClient.tasks.get(id),
  complete: (id: string, notes?: string): Promise<Task> => apiClient.tasks.complete(id, notes),
  addBlocker: (id: string, reason: string) => apiClient.tasks.addBlocker(id, reason),
  resolveBlocker: (blockerId: string) => apiClient.tasks.resolveBlocker(blockerId),
  addComment: (id: string, message: string) => apiClient.tasks.addComment(id, message),
};

export const ClientsService = {
  list: (params?: { search?: string }): Promise<Client[]> => apiClient.clients.list(params),
  get: (id: string): Promise<Client> => apiClient.clients.get(id),
  create: (data: ClientCreate): Promise<Client> => apiClient.clients.create(data),
  addContact: (clientId: string, contact: any) => apiClient.clients.addContact(clientId, contact),
};

export const ProductsService = {
  list: (params?: { search?: string }): Promise<Product[]> => apiClient.products.list(params),
  get: (id: string): Promise<Product> => apiClient.products.get(id),
  create: (data: any): Promise<Product> => apiClient.products.create(data),
  addBOM: (productId: string, bomData: any) => apiClient.products.addBOM(productId, bomData),
};

export const FilesService = {
  getOrderFiles: (orderId: string): Promise<FileRecord[]> => apiClient.files.getOrderFiles(orderId),
  getOrderWorkspace: (orderId: string): Promise<FileFolder[]> => apiClient.files.getOrderWorkspace(orderId),
  getVersions: (fileId: string) => apiClient.files.getVersions(fileId),
};

export const ApprovalsService = {
  list: (params?: { order_id?: string; status?: ApprovalStatus }): Promise<Approval[]> =>
    apiClient.approvals.list(params),
  approve: (id: string, comments?: string): Promise<Approval> => apiClient.approvals.approve(id, comments),
  reject: (id: string, comments?: string): Promise<Approval> => apiClient.approvals.reject(id, comments),
  request: (data: { order_id: string; file_version_id?: string; comments?: string }): Promise<Approval> =>
    apiClient.approvals.request(data),
};

export const QuantitiesService = {
  getSummary: (orderItemId: string): Promise<QuantitySummary> => apiClient.quantities.getSummary(orderItemId),
  record: (data: {
    order_id: string;
    order_item_id: string;
    transaction_type: QuantityTransactionType;
    quantity: number;
    reason?: string;
  }): Promise<QuantityTransaction> => apiClient.quantities.record(data),
};

// ==========================================
// Phase 2 Services
// ==========================================

export const StockService = {
  getBalance: (stockItemId: string): Promise<StockBalance> => apiClient.stock.getBalance(stockItemId),
  recordMovement: (data: {
    stock_item_id: string;
    movement_type: string;
    quantity: number;
    from_location_id?: string;
    to_location_id?: string;
    order_id?: string;
    reason?: string;
  }): Promise<StockMovement> => apiClient.stock.recordMovement(data),
  reserveBOM: (orderId: string, orderItemId: string) =>
    apiClient.stock.calculateBomAndReserve(orderId, orderItemId),
};

export const PurchasingService = {
  createSupplier: (data: any): Promise<Supplier> => apiClient.purchasing.createSupplier(data),
  createPO: (data: any): Promise<PurchaseOrder> => apiClient.purchasing.createPO(data),
  approvePO: (poId: string): Promise<PurchaseOrder> => apiClient.purchasing.approvePO(poId),
  receiveGoods: (data: any) => apiClient.purchasing.receiveGoods(data),
  getPriceTrends: (stockItemId: string): Promise<PriceTrends> =>
    apiClient.purchasing.getPriceTrends(stockItemId),
};

export const ProductionService = {
  createBatch: (data: any): Promise<ProductionBatch> => apiClient.production.createBatch(data),
  logRecord: (batchId: string, data: any) => apiClient.production.logProductionRecord(batchId, data),
  reconcile: (orderItemId: string) => apiClient.production.reconcileOrderItem(orderItemId),
};

export const LabourService = {
  createLabourer: (data: any): Promise<Labourer> => apiClient.labour.createLabourer(data),
  allocateBatch: (data: any): Promise<LabourBatch> => apiClient.labour.allocateBatch(data),
  issueMaterial: (data: any) => apiClient.labour.issueMaterialWithCredit(data),
  submitWork: (data: any) => apiClient.labour.submitWork(data),
  transferMaterial: (data: any) => apiClient.labour.transferMaterial(data),
  generatePayment: (labourerId: string): Promise<LabourPayment> =>
    apiClient.labour.generatePayment(labourerId),
};

export const AssetsService = {
  create: (data: any): Promise<Asset> => apiClient.assets.create(data),
  assign: (data: any) => apiClient.assets.assign(data),
  return: (assetId: string, data: any) => apiClient.assets.return(assetId, data),
};

export const PackingService = {
  createTask: (data: any): Promise<PackingTask> => apiClient.packing.createTask(data),
  addPackage: (taskId: string, data: any) => apiClient.packing.addPackage(taskId, data),
};

export const DispatchService = {
  createDelivery: (data: any): Promise<Delivery> => apiClient.dispatch.createDelivery(data),
  bookDelivery: (deliveryId: string, data: any) => apiClient.dispatch.bookDelivery(deliveryId, data),
  recordExpense: (data: any) => apiClient.dispatch.recordExpense(data),
  logException: (deliveryId: string, data: any) => apiClient.dispatch.logException(deliveryId, data),
};

export const BillingService = {
  createInvoice: (data: any): Promise<Invoice> => apiClient.billing.createInvoice(data),
  recordPayment: (data: any) => apiClient.billing.recordPayment(data),
  checkCompletion: (orderId: string): Promise<OrderCompletionCheck> =>
    apiClient.billing.checkCompletion(orderId),
  completeOrder: (orderId: string) => apiClient.billing.completeOrder(orderId),
};

export const QuotationsService = {
  calculateCost: (data: any): Promise<CostCalculationBreakdown> =>
    apiClient.quotations.calculateCost(data),
  createQuotation: (data: any): Promise<Quotation> =>
    apiClient.quotations.createQuotation(data),
  getFeasibility: (id: string): Promise<QuotationFeasibilityReport> =>
    apiClient.quotations.getFeasibility(id),
  convertToOrder: (id: string): Promise<{ order_id: string; order_number: string }> =>
    apiClient.quotations.convertToOrder(id),
};

export const CapacityService = {
  getMachines: (): Promise<CapacityMetrics[]> => apiClient.capacity.getMachines(),
  getEmployees: (): Promise<CapacityMetrics[]> => apiClient.capacity.getEmployees(),
};

export const ETAService = {
  getOrderETA: (orderId: string): Promise<ETACalculationResponse> =>
    apiClient.eta.getOrderETA(orderId),
};

export const AutomationService = {
  listRules: (): Promise<AutomationRule[]> => apiClient.automation.listRules(),
  createRule: (data: any): Promise<AutomationRule> => apiClient.automation.createRule(data),
  listLogs: (): Promise<AutomationLog[]> => apiClient.automation.listLogs(),
};

export const AnalyticsService = {
  getDashboard: (): Promise<ExecutiveDashboardSummary> => apiClient.analytics.getDashboard(),
  getDailyBriefing: (): Promise<DailyBriefingResponse> => apiClient.ai.getDailyBriefing(),
  queryAI: (query: string): Promise<AIQueryResponse> => apiClient.ai.query(query),
};

export const AuditService = {
  list: (params?: { entity?: string; entity_id?: string }): Promise<AuditLog[]> =>
    apiClient.audit.list(params),
};

export const SearchService = {
  searchAll: async (query: string): Promise<{
    orders: Order[];
    clients: Client[];
    tasks: Task[];
    products: Product[];
  }> => {
    if (!query.trim()) {
      return { orders: [], clients: [], tasks: [], products: [] };
    }

    try {
      const [orders, clients, tasks, products] = await Promise.all([
        apiClient.orders.list().catch(() => []),
        apiClient.clients.list({ search: query }).catch(() => []),
        apiClient.tasks.list().catch(() => []),
        apiClient.products.list({ search: query }).catch(() => []),
      ]);

      const q = query.toLowerCase();
      const filteredOrders = orders.filter((o) => o.order_number.toLowerCase().includes(q));
      const filteredTasks = tasks.filter(
        (t) => t.title?.toLowerCase().includes(q) || t.task_code?.toLowerCase().includes(q)
      );

      return {
        orders: filteredOrders.slice(0, 5),
        clients: clients.slice(0, 5),
        tasks: filteredTasks.slice(0, 5),
        products: products.slice(0, 5),
      };
    } catch {
      return { orders: [], clients: [], tasks: [], products: [] };
    }
  },
};
