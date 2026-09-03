import { apiClient } from "./client";
import {
  Order,
  OrderCreate,
  OrderItem,
  WorkflowInstance,
  Task,
  TaskStatus,
  TaskPriority,
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
  OrderStatus,
  OrderPriority,
} from "@officefloww/api-types";

const isOffline = () => localStorage.getItem("officefloww_offline_mode") === "true";

// ─── OFFLINE SEED DATA ────────────────────────────────────────────────────────

const OFFLINE_CLIENTS: Client[] = [
  {
    id: "c-1",
    client_code: "CLT-0001",
    organization_name: "St. Xavier's High School",
    tax_identifier: "23AAAAA0000A1Z5",
    billing_address: "12 Mission Compound, Bhopal, MP 462001",
    is_active: true,
    created_at: "2026-01-10T09:00:00Z",
    updated_at: "2026-01-10T09:00:00Z",
    contacts: [],
  },
  {
    id: "c-2",
    client_code: "CLT-0002",
    organization_name: "Govt. Engineering College Bhopal",
    tax_identifier: "23BBBBB1111B2Z6",
    billing_address: "Raisen Road, Bhopal, MP 462004",
    is_active: true,
    created_at: "2026-02-05T09:00:00Z",
    updated_at: "2026-02-05T09:00:00Z",
    contacts: [],
  },
  {
    id: "c-3",
    client_code: "CLT-0003",
    organization_name: "Bharat Heavy Electricals Ltd.",
    tax_identifier: "23CCCCC2222C3Z7",
    billing_address: "BHEL Township, Bhopal, MP 462021",
    is_active: true,
    created_at: "2026-02-20T09:00:00Z",
    updated_at: "2026-02-20T09:00:00Z",
    contacts: [],
  },
  {
    id: "c-4",
    client_code: "CLT-0004",
    organization_name: "MP Police Academy",
    tax_identifier: "23DDDDD3333D4Z8",
    billing_address: "Shyamala Hills, Bhopal, MP 462002",
    is_active: true,
    created_at: "2026-03-01T09:00:00Z",
    updated_at: "2026-03-01T09:00:00Z",
    contacts: [],
  },
];

const OFFLINE_ORDERS: Order[] = [
  {
    id: "o-1",
    order_number: "ORD-2026-0001",
    client_id: "c-1",
    status: OrderStatus.IN_PRODUCTION,
    priority: OrderPriority.HIGH,
    promised_delivery_date: "2026-09-10T00:00:00Z",
    total_amount: 182500,
    notes: "500 Multicolor Lanyards + ID Badges for new academic year",
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-02T11:00:00Z",
    items: [],
  },
  {
    id: "o-2",
    order_number: "ORD-2026-0002",
    client_id: "c-2",
    status: OrderStatus.CONFIRMED,
    priority: OrderPriority.NORMAL,
    promised_delivery_date: "2026-09-20T00:00:00Z",
    total_amount: 95000,
    notes: "1000 PVC ID Cards with RFID chip — batch 1 of 2",
    created_at: "2026-09-02T09:00:00Z",
    updated_at: "2026-09-02T09:00:00Z",
    items: [],
  },
  {
    id: "o-3",
    order_number: "ORD-2026-0003",
    client_id: "c-3",
    status: OrderStatus.DRAFT,
    priority: OrderPriority.URGENT,
    promised_delivery_date: "2026-09-08T00:00:00Z",
    total_amount: 340000,
    notes: "2000 Security Access Cards — urgent replacement",
    created_at: "2026-09-03T08:00:00Z",
    updated_at: "2026-09-03T08:00:00Z",
    items: [],
  },
  {
    id: "o-4",
    order_number: "ORD-2026-0004",
    client_id: "c-4",
    status: OrderStatus.READY_FOR_DISPATCH,
    priority: OrderPriority.NORMAL,
    promised_delivery_date: "2026-09-05T00:00:00Z",
    total_amount: 62000,
    notes: "400 Printed Lanyards — MP Police Academy Training Batch",
    created_at: "2026-08-28T09:00:00Z",
    updated_at: "2026-09-02T16:00:00Z",
    items: [],
  },
];

const OFFLINE_TASKS: Task[] = [
  {
    id: "t-1",
    task_code: "TSK-2026-0001",
    order_id: "o-1",
    title: "Sublimation Press — Lanyard Colour Run",
    description: "Run all 500 lanyard panels through sublimation press #1. Monitor colour accuracy.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    assigned_to: null,
    due_date: "2026-09-04T18:00:00Z",
    created_at: "2026-09-02T09:00:00Z",
    updated_at: "2026-09-03T10:00:00Z",
  },
  {
    id: "t-2",
    task_code: "TSK-2026-0002",
    order_id: "o-1",
    title: "Lanyard Stitching & Hardware Crimping",
    description: "Issue to Ramesh workshop. 500 units. Verify dog-hook attachment on all pieces.",
    status: TaskStatus.PENDING,
    priority: TaskPriority.HIGH,
    assigned_to: null,
    due_date: "2026-09-05T18:00:00Z",
    created_at: "2026-09-02T10:00:00Z",
    updated_at: "2026-09-02T10:00:00Z",
  },
  {
    id: "t-3",
    task_code: "TSK-2026-0003",
    order_id: "o-2",
    title: "PVC Card Thermal Print Setup",
    description: "Load card printer with 0.76mm PVC sheets. Run test batch of 20 before main run.",
    status: TaskStatus.BLOCKED,
    priority: TaskPriority.NORMAL,
    assigned_to: null,
    due_date: "2026-09-06T18:00:00Z",
    created_at: "2026-09-03T08:30:00Z",
    updated_at: "2026-09-03T08:30:00Z",
  },
  {
    id: "t-4",
    task_code: "TSK-2026-0004",
    order_id: "o-4",
    title: "QC Weighing & Box Packing",
    description: "Weigh and pack 400 lanyards into dispatch boxes. Label each box correctly.",
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.NORMAL,
    assigned_to: null,
    due_date: "2026-09-03T17:00:00Z",
    created_at: "2026-08-30T09:00:00Z",
    updated_at: "2026-09-02T17:30:00Z",
  },
];

const OFFLINE_APPROVALS: Approval[] = [
  {
    id: "ap-1",
    order_id: "o-1",
    status: ApprovalStatus.PENDING,
    created_at: "2026-09-02T14:00:00Z",
    updated_at: "2026-09-02T14:00:00Z",
    comments: "Client proof ready for St. Xavier's — lanyard repeat design",
  },
];

const OFFLINE_PRODUCTS: Product[] = [
  {
    id: "p-1",
    code: "PRD-LANYARD-20MM",
    name: "20mm Multicolor Satin Lanyard",
    description: "Full sublimation print, dog-hook + card holder",
    unit: "pcs",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    boms: [],
  },
  {
    id: "p-2",
    code: "PRD-ID-PVC-GLOSS",
    name: "0.76mm Gloss Thermal ID Card",
    description: "PVC thermal print, glossy overlay, CR80 standard size",
    unit: "pcs",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    boms: [],
  },
  {
    id: "p-3",
    code: "PRD-RFID-CARD",
    name: "RFID Access Card (125kHz)",
    description: "Proximity card with printed overlay, 125kHz EM4100",
    unit: "pcs",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    boms: [],
  },
  {
    id: "p-4",
    code: "PRD-BADGE-ACRYLIC",
    name: "Acrylic Name Badge 90x55mm",
    description: "UV printed acrylic badge with magnetic pin back",
    unit: "pcs",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    boms: [],
  },
];

// ─── SERVICE WRAPPER ──────────────────────────────────────────────────────────

async function withOfflineFallback<T>(apiFn: () => Promise<T>, fallback: T): Promise<T> {
  if (isOffline()) return fallback;
  try {
    return await apiFn();
  } catch {
    return fallback;
  }
}

// ─── SERVICES ─────────────────────────────────────────────────────────────────

export const OrdersService = {
  list: (params?: { client_id?: string; status?: string }): Promise<Order[]> =>
    withOfflineFallback(
      () => apiClient.orders.list(params),
      params?.client_id
        ? OFFLINE_ORDERS.filter((o) => o.client_id === params.client_id)
        : params?.status
        ? OFFLINE_ORDERS.filter((o) => o.status === params.status)
        : OFFLINE_ORDERS
    ),
  get: (id: string): Promise<Order> =>
    withOfflineFallback(
      () => apiClient.orders.get(id),
      OFFLINE_ORDERS.find((o) => o.id === id) || OFFLINE_ORDERS[0]
    ),
  create: (data: OrderCreate): Promise<Order> => apiClient.orders.create(data),
  getItems: (orderId: string): Promise<OrderItem[]> =>
    withOfflineFallback(() => apiClient.orders.getItems(orderId), []),
  getWorkflow: (orderId: string): Promise<WorkflowInstance[]> =>
    withOfflineFallback(() => apiClient.orders.getWorkflow(orderId), []),
  getTasks: (orderId: string): Promise<Task[]> =>
    withOfflineFallback(
      () => apiClient.orders.getTasks(orderId),
      OFFLINE_TASKS.filter((t) => t.order_id === orderId)
    ),
};

export const TasksService = {
  list: (params?: { order_id?: string; status?: TaskStatus }): Promise<Task[]> =>
    withOfflineFallback(
      () => apiClient.tasks.list(params),
      params?.order_id
        ? OFFLINE_TASKS.filter((t) => t.order_id === params.order_id)
        : params?.status
        ? OFFLINE_TASKS.filter((t) => t.status === params.status)
        : OFFLINE_TASKS
    ),
  get: (id: string): Promise<Task> =>
    withOfflineFallback(
      () => apiClient.tasks.get(id),
      OFFLINE_TASKS.find((t) => t.id === id) || OFFLINE_TASKS[0]
    ),
  complete: (id: string, notes?: string): Promise<Task> => apiClient.tasks.complete(id, notes),
  addBlocker: (id: string, reason: string) => apiClient.tasks.addBlocker(id, reason),
  resolveBlocker: (blockerId: string) => apiClient.tasks.resolveBlocker(blockerId),
  addComment: (id: string, message: string) => apiClient.tasks.addComment(id, message),
};

export const ClientsService = {
  list: (params?: { search?: string }): Promise<Client[]> =>
    withOfflineFallback(
      () => apiClient.clients.list(params),
      params?.search
        ? OFFLINE_CLIENTS.filter((c) =>
            c.organization_name.toLowerCase().includes(params.search!.toLowerCase())
          )
        : OFFLINE_CLIENTS
    ),
  get: (id: string): Promise<Client> =>
    withOfflineFallback(
      () => apiClient.clients.get(id),
      OFFLINE_CLIENTS.find((c) => c.id === id) || OFFLINE_CLIENTS[0]
    ),
  create: (data: ClientCreate): Promise<Client> => apiClient.clients.create(data),
  addContact: (clientId: string, contact: any) =>
    apiClient.clients.addContact(clientId, contact),
};

export const ProductsService = {
  list: (params?: { search?: string }): Promise<Product[]> =>
    withOfflineFallback(
      () => apiClient.products.list(params),
      params?.search
        ? OFFLINE_PRODUCTS.filter((p) =>
            p.name.toLowerCase().includes(params.search!.toLowerCase())
          )
        : OFFLINE_PRODUCTS
    ),
  get: (id: string): Promise<Product> =>
    withOfflineFallback(
      () => apiClient.products.get(id),
      OFFLINE_PRODUCTS.find((p) => p.id === id) || OFFLINE_PRODUCTS[0]
    ),
  create: (data: any): Promise<Product> => apiClient.products.create(data),
  addBOM: (productId: string, bomData: any) =>
    apiClient.products.addBOM(productId, bomData),
};

export const FilesService = {
  getOrderFiles: (orderId: string): Promise<FileRecord[]> =>
    withOfflineFallback(() => apiClient.files.getOrderFiles(orderId), []),
  getOrderWorkspace: (orderId: string): Promise<FileFolder[]> =>
    withOfflineFallback(() => apiClient.files.getOrderWorkspace(orderId), []),
  getVersions: (fileId: string) =>
    withOfflineFallback(() => apiClient.files.getVersions(fileId), []),
};

export const ApprovalsService = {
  list: (params?: { order_id?: string; status?: ApprovalStatus }): Promise<Approval[]> =>
    withOfflineFallback(() => apiClient.approvals.list(params), OFFLINE_APPROVALS),
  approve: (id: string, comments?: string): Promise<Approval> =>
    apiClient.approvals.approve(id, comments),
  reject: (id: string, comments?: string): Promise<Approval> =>
    apiClient.approvals.reject(id, comments),
  request: (data: {
    order_id: string;
    file_version_id?: string;
    comments?: string;
  }): Promise<Approval> => apiClient.approvals.request(data),
};

export const QuantitiesService = {
  getSummary: (orderItemId: string): Promise<QuantitySummary> =>
    apiClient.quantities.getSummary(orderItemId),
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
  getBalance: (stockItemId: string): Promise<StockBalance> =>
    apiClient.stock.getBalance(stockItemId),
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
  logRecord: (batchId: string, data: any) =>
    apiClient.production.logProductionRecord(batchId, data),
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
  bookDelivery: (deliveryId: string, data: any) =>
    apiClient.dispatch.bookDelivery(deliveryId, data),
  recordExpense: (data: any) => apiClient.dispatch.recordExpense(data),
  logException: (deliveryId: string, data: any) =>
    apiClient.dispatch.logException(deliveryId, data),
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
    withOfflineFallback(() => apiClient.audit.list(params), []),
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

    if (isOffline()) {
      const q = query.toLowerCase();
      return {
        orders: OFFLINE_ORDERS.filter((o) =>
          o.order_number.toLowerCase().includes(q)
        ).slice(0, 5),
        clients: OFFLINE_CLIENTS.filter((c) =>
          c.organization_name.toLowerCase().includes(q)
        ).slice(0, 5),
        tasks: OFFLINE_TASKS.filter(
          (t) => t.title?.toLowerCase().includes(q) || t.task_code?.toLowerCase().includes(q)
        ).slice(0, 5),
        products: OFFLINE_PRODUCTS.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5),
      };
    }

    try {
      const [orders, clients, tasks, products] = await Promise.all([
        apiClient.orders.list().catch(() => OFFLINE_ORDERS),
        apiClient.clients.list({ search: query }).catch(() => OFFLINE_CLIENTS),
        apiClient.tasks.list().catch(() => OFFLINE_TASKS),
        apiClient.products.list({ search: query }).catch(() => OFFLINE_PRODUCTS),
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
