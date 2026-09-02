import {
  ApiResponse,
  ApiErrorResponse,
  PaginatedResponse,
  User,
  LoginRequest,
  TokenResponse,
  Client,
  ClientCreate,
  ClientContact,
  Product,
  Order,
  OrderCreate,
  OrderItem,
  WorkflowInstance,
  Task,
  TaskStatus,
  TaskBlocker,
  TaskComment,
  FileRecord,
  FileVersion,
  FileFolder,
  Approval,
  ApprovalStatus,
  QuantityTransaction,
  QuantityTransactionType,
  QuantitySummary,
  AuditLog,
} from "@officefloww/api-types";

export class ApiError extends Error {
  code: string;
  details?: any[];
  status: number;

  constructor(message: string, code: string = "API_ERROR", status: number = 500, details?: any[]) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface ClientConfig {
  baseUrl?: string;
  accessToken?: string;
  onTokenExpired?: () => void;
}

export class OfficeFlowwClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private onTokenExpired?: () => void;

  constructor(config?: ClientConfig) {
    this.baseUrl = config?.baseUrl || "http://localhost:8000/api/v1";
    this.accessToken = config?.accessToken || null;
    this.onTokenExpired = config?.onTokenExpired;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers || {});

    if (this.accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (response.status === 401 && this.onTokenExpired) {
        this.onTokenExpired();
      }
      const err = (data as ApiErrorResponse).error || {
        code: `HTTP_${response.status}`,
        message: response.statusText || "Request failed",
        details: [],
      };
      throw new ApiError(err.message, err.code, response.status, err.details);
    }

    return (data as ApiResponse<T>).data;
  }

  // --------------------------------------------------
  // Auth Module
  // --------------------------------------------------
  auth = {
    login: async (credentials: LoginRequest): Promise<TokenResponse> => {
      const res = await this.request<TokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      this.setAccessToken(res.access_token);
      return res;
    },
    refresh: async (refreshToken: string): Promise<TokenResponse> => {
      const res = await this.request<TokenResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      this.setAccessToken(res.access_token);
      return res;
    },
    logout: async (refreshToken?: string): Promise<void> => {
      await this.request<{ message: string }>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      this.setAccessToken(null);
    },
    getMe: (): Promise<User> => {
      return this.request<User>("/auth/me");
    },
  };

  // --------------------------------------------------
  // Clients Module
  // --------------------------------------------------
  clients = {
    list: (params?: { page?: number; page_size?: number; search?: string }): Promise<Client[]> => {
      const query = new URLSearchParams(params as any).toString();
      return this.request<Client[]>(`/clients${query ? `?${query}` : ""}`);
    },
    get: (id: string): Promise<Client> => {
      return this.request<Client>(`/clients/${id}`);
    },
    create: (data: ClientCreate): Promise<Client> => {
      return this.request<Client>("/clients", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    addContact: (clientId: string, contact: any): Promise<ClientContact> => {
      return this.request<ClientContact>(`/clients/${clientId}/contacts`, {
        method: "POST",
        body: JSON.stringify(contact),
      });
    },
  };

  // --------------------------------------------------
  // Products Module
  // --------------------------------------------------
  products = {
    list: (params?: { page?: number; page_size?: number; search?: string }): Promise<Product[]> => {
      const query = new URLSearchParams(params as any).toString();
      return this.request<Product[]>(`/products${query ? `?${query}` : ""}`);
    },
    get: (id: string): Promise<Product> => {
      return this.request<Product>(`/products/${id}`);
    },
    create: (data: any): Promise<Product> => {
      return this.request<Product>("/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    addBOM: (productId: string, bomData: any): Promise<any> => {
      return this.request<any>(`/products/${productId}/boms`, {
        method: "POST",
        body: JSON.stringify(bomData),
      });
    },
  };

  // --------------------------------------------------
  // Orders Module
  // --------------------------------------------------
  orders = {
    list: (params?: { page?: number; page_size?: number; client_id?: string; status?: string }): Promise<Order[]> => {
      const query = new URLSearchParams(params as any).toString();
      return this.request<Order[]>(`/orders${query ? `?${query}` : ""}`);
    },
    get: (id: string): Promise<Order> => {
      return this.request<Order>(`/orders/${id}`);
    },
    create: (data: OrderCreate): Promise<Order> => {
      return this.request<Order>("/orders", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getItems: (orderId: string): Promise<OrderItem[]> => {
      return this.request<OrderItem[]>(`/orders/${orderId}/items`);
    },
    getWorkflow: (orderId: string): Promise<WorkflowInstance[]> => {
      return this.request<WorkflowInstance[]>(`/orders/${orderId}/workflow`);
    },
    getTasks: (orderId: string): Promise<Task[]> => {
      return this.request<Task[]>(`/orders/${orderId}/tasks`);
    },
  };

  // --------------------------------------------------
  // Tasks Module
  // --------------------------------------------------
  tasks = {
    list: (params?: { page?: number; page_size?: number; order_id?: string; status?: TaskStatus }): Promise<Task[]> => {
      const query = new URLSearchParams(params as any).toString();
      return this.request<Task[]>(`/tasks${query ? `?${query}` : ""}`);
    },
    get: (id: string): Promise<Task> => {
      return this.request<Task>(`/tasks/${id}`);
    },
    complete: (id: string, notes?: string): Promise<Task> => {
      return this.request<Task>(`/tasks/${id}/complete`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      });
    },
    addBlocker: (id: string, reason: string): Promise<TaskBlocker> => {
      return this.request<TaskBlocker>(`/tasks/${id}/blockers`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },
    resolveBlocker: (blockerId: string): Promise<TaskBlocker> => {
      return this.request<TaskBlocker>(`/tasks/blockers/${blockerId}/resolve`, {
        method: "POST",
      });
    },
    addComment: (id: string, message: string): Promise<TaskComment> => {
      return this.request<TaskComment>(`/tasks/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
    },
  };

  // --------------------------------------------------
  // Files Module
  // --------------------------------------------------
  files = {
    upload: (formData: FormData): Promise<FileRecord> => {
      return this.request<FileRecord>("/files/upload", {
        method: "POST",
        body: formData,
      });
    },
    get: (fileId: string): Promise<FileRecord> => {
      return this.request<FileRecord>(`/files/${fileId}`);
    },
    getVersions: (fileId: string): Promise<FileVersion[]> => {
      return this.request<FileVersion[]>(`/files/${fileId}/versions`);
    },
    getOrderFiles: (orderId: string): Promise<FileRecord[]> => {
      return this.request<FileRecord[]>(`/files/order/${orderId}`);
    },
    getOrderWorkspace: (orderId: string): Promise<FileFolder[]> => {
      return this.request<FileFolder[]>(`/files/order/${orderId}/workspace`);
    },
  };

  // --------------------------------------------------
  // Approvals Module
  // --------------------------------------------------
  approvals = {
    request: (data: { order_id: string; file_version_id?: string; comments?: string }): Promise<Approval> => {
      return this.request<Approval>("/approvals", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    list: (params?: { order_id?: string; status?: ApprovalStatus }): Promise<Approval[]> => {
      const query = new URLSearchParams(params as any).toString();
      return this.request<Approval[]>(`/approvals${query ? `?${query}` : ""}`);
    },
    approve: (id: string, comments?: string): Promise<Approval> => {
      return this.request<Approval>(`/approvals/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ comments }),
      });
    },
    reject: (id: string, comments?: string): Promise<Approval> => {
      return this.request<Approval>(`/approvals/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ comments }),
      });
    },
  };

  // --------------------------------------------------
  // Quantity Ledger Module
  // --------------------------------------------------
  quantities = {
    record: (data: {
      order_id: string;
      order_item_id: string;
      transaction_type: QuantityTransactionType;
      quantity: number;
      batch_reference?: string;
      reason?: string;
    }): Promise<QuantityTransaction> => {
      return this.request<QuantityTransaction>("/quantities/transactions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getSummary: (orderItemId: string): Promise<QuantitySummary> => {
      return this.request<QuantitySummary>(`/quantities/orders/${orderItemId}/summary`);
    },
    list: (params?: { order_id?: string; order_item_id?: string }): Promise<QuantityTransaction[]> => {
      const query = new URLSearchParams(params as any).toString();
      return this.request<QuantityTransaction[]>(`/quantities/transactions${query ? `?${query}` : ""}`);
    },
  };

  // --------------------------------------------------
  // Audit Module
  // --------------------------------------------------
  audit = {
    list: (params?: { page?: number; entity?: string; entity_id?: string }): Promise<AuditLog[]> => {
      const query = new URLSearchParams(params as any).toString();
      return this.request<AuditLog[]>(`/audit${query ? `?${query}` : ""}`);
    },
  };

  // --------------------------------------------------
  // Phase 2: Stock Engine
  // --------------------------------------------------
  stock = {
    getBalance: (stockItemId: string) => {
      return this.request<any>(`/stock/items/${stockItemId}/balance`);
    },
    recordMovement: (data: any) => {
      return this.request<any>("/stock/movements", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    calculateBomAndReserve: (orderId: string, orderItemId: string) => {
      return this.request<any>(`/stock/orders/${orderId}/items/${orderItemId}/reserve-bom`, {
        method: "POST",
      });
    },
  };

  // --------------------------------------------------
  // Phase 2: Purchasing & Price History
  // --------------------------------------------------
  purchasing = {
    createSupplier: (data: any) => {
      return this.request<any>("/purchasing/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    createPO: (data: any) => {
      return this.request<any>("/purchasing/orders", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    approvePO: (poId: string) => {
      return this.request<any>(`/purchasing/orders/${poId}/approve`, {
        method: "POST",
      });
    },
    receiveGoods: (data: any) => {
      return this.request<any>("/purchasing/goods-receipts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getPriceTrends: (stockItemId: string) => {
      return this.request<any>(`/purchasing/items/${stockItemId}/price-trends`);
    },
  };

  // --------------------------------------------------
  // Phase 2: Production Engine & Batches
  // --------------------------------------------------
  production = {
    createBatch: (data: any) => {
      return this.request<any>("/production/batches", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    logProductionRecord: (batchId: string, data: any) => {
      return this.request<any>(`/production/batches/${batchId}/records`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    reconcileOrderItem: (orderItemId: string) => {
      return this.request<any>(`/production/order-items/${orderItemId}/reconciliation`);
    },
  };

  // --------------------------------------------------
  // Phase 2: Labour & Material Credit Ledger
  // --------------------------------------------------
  labour = {
    createLabourer: (data: any) => {
      return this.request<any>("/labour/labourers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    allocateBatch: (data: any) => {
      return this.request<any>("/labour/batches", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    issueMaterialWithCredit: (data: any) => {
      return this.request<any>("/labour/material-issues", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    submitWork: (data: any) => {
      return this.request<any>("/labour/submissions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    transferMaterial: (data: any) => {
      return this.request<any>("/labour/transfers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    generatePayment: (labourerId: string) => {
      return this.request<any>(`/labour/labourers/${labourerId}/generate-payment`, {
        method: "POST",
      });
    },
  };

  // --------------------------------------------------
  // Phase 2: Tools & Assets
  // --------------------------------------------------
  assets = {
    create: (data: any) => {
      return this.request<any>("/assets", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    assign: (data: any) => {
      return this.request<any>("/assets/assignments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    return: (assetId: string, data: any) => {
      return this.request<any>(`/assets/${assetId}/return`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  };

  // --------------------------------------------------
  // Phase 2: Packing
  // --------------------------------------------------
  packing = {
    createTask: (data: any) => {
      return this.request<any>("/packing/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    addPackage: (taskId: string, data: any) => {
      return this.request<any>(`/packing/tasks/${taskId}/packages`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  };

  // --------------------------------------------------
  // Phase 2: Dispatch & Delivery
  // --------------------------------------------------
  dispatch = {
    createDelivery: (data: any) => {
      return this.request<any>("/dispatch/deliveries", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    bookDelivery: (deliveryId: string, data: any) => {
      return this.request<any>(`/dispatch/deliveries/${deliveryId}/bookings`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    recordExpense: (data: any) => {
      return this.request<any>("/dispatch/expenses", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    logException: (deliveryId: string, data: any) => {
      return this.request<any>(`/dispatch/deliveries/${deliveryId}/exceptions`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  };

  // --------------------------------------------------
  // Phase 2: Billing & Order Completion
  // --------------------------------------------------
  billing = {
    createInvoice: (data: any) => {
      return this.request<any>("/billing/invoices", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    recordPayment: (data: any) => {
      return this.request<any>("/billing/payments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    checkCompletion: (orderId: string) => {
      return this.request<any>(`/billing/orders/${orderId}/completion-check`);
    },
    completeOrder: (orderId: string) => {
      return this.request<any>(`/billing/orders/${orderId}/complete`, {
        method: "POST",
      });
    },
  };

  // --------------------------------------------------
  // Phase 2: Worker Mobile Operations
  // --------------------------------------------------
  worker = {
    getAssignedTasks: () => {
      return this.request<any[]>("/worker/tasks");
    },
    startTask: (taskId: string) => {
      return this.request<any>(`/worker/tasks/${taskId}/start`, {
        method: "POST",
      });
    },
    submitQuantities: (taskId: string, data: any) => {
      return this.request<any>(`/worker/tasks/${taskId}/quantities`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    completeTask: (taskId: string, notes?: string) => {
      return this.request<any>(`/worker/tasks/${taskId}/complete${notes ? `?notes=${encodeURIComponent(notes)}` : ""}`, {
        method: "POST",
      });
    },
  };

  // --------------------------------------------------
  // Phase 3: Quotations & Tiered Costing
  // --------------------------------------------------
  quotations = {
    createPricingRule: (data: any) => {
      return this.request<any>("/quotations/pricing-rules", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    calculateCost: (data: any) => {
      return this.request<any>("/quotations/calculate-cost", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    createQuotation: (data: any) => {
      return this.request<any>("/quotations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getFeasibility: (id: string) => {
      return this.request<any>(`/quotations/${id}/feasibility`);
    },
    convertToOrder: (id: string) => {
      return this.request<any>(`/quotations/${id}/convert-to-order`, {
        method: "POST",
      });
    },
  };

  // --------------------------------------------------
  // Phase 3: Capacity & Absence Handover
  // --------------------------------------------------
  capacity = {
    getMachines: () => {
      return this.request<any[]>("/capacity/machines");
    },
    getEmployees: () => {
      return this.request<any[]>("/capacity/employees");
    },
    planAbsenceHandover: (data: any) => {
      return this.request<any>("/capacity/absence/plan-handover", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    executeAbsenceHandover: (absenceId: string) => {
      return this.request<any>(`/capacity/absence/${absenceId}/execute-handover`, {
        method: "POST",
      });
    },
  };

  // --------------------------------------------------
  // Phase 3: Dynamic ETA Engine
  // --------------------------------------------------
  eta = {
    getOrderETA: (orderId: string) => {
      return this.request<any>(`/eta/orders/${orderId}`);
    },
    getOrderETAHistory: (orderId: string) => {
      return this.request<any[]>(`/eta/orders/${orderId}/history`);
    },
  };

  // --------------------------------------------------
  // Phase 3: Automation Rules & Triggers
  // --------------------------------------------------
  automation = {
    listRules: () => {
      return this.request<any[]>("/automation/rules");
    },
    createRule: (data: any) => {
      return this.request<any>("/automation/rules", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    listLogs: () => {
      return this.request<any[]>("/automation/logs");
    },
    triggerEvent: (data: any) => {
      return this.request<any>("/automation/trigger", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  };

  // --------------------------------------------------
  // Phase 3: Notifications & Client Proof Portal
  // --------------------------------------------------
  notifications = {
    send: (data: any) => {
      return this.request<any>("/notifications/send", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    generateProofLink: (data: any) => {
      return this.request<any>("/notifications/proofs/generate-link", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    respondToProof: (token: string, data: any) => {
      return this.request<any>(`/notifications/proofs/${token}/respond`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  };

  // --------------------------------------------------
  // Phase 3: Integrations & Migrations
  // --------------------------------------------------
  integrations = {
    importGoogleSheets: (data: any) => {
      return this.request<any>("/integrations/google-sheets/import", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    migrateTrello: (data: any) => {
      return this.request<any>("/integrations/trello/migrate", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  };

  // --------------------------------------------------
  // Phase 3: Management AI
  // --------------------------------------------------
  ai = {
    query: (query: string) => {
      return this.request<any>("/ai/query", {
        method: "POST",
        body: JSON.stringify({ query }),
      });
    },
    getDailyBriefing: () => {
      return this.request<any>("/ai/daily-briefing");
    },
  };

  // --------------------------------------------------
  // Phase 3: Management Analytics
  // --------------------------------------------------
  analytics = {
    getDashboard: () => {
      return this.request<any>("/analytics/dashboard");
    },
    getResponsibilityTrail: () => {
      return this.request<any[]>("/analytics/responsibility-trail");
    },
  };
}
