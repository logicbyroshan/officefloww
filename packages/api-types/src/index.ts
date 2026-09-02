/**
 * OfficeFloww API Contract Definitions
 * Shared between Backend and Frontend Applications (Desktop Electron, React Native Workers)
 */

// ----------------------------------------------------
// 1. Core API Envelopes
// ----------------------------------------------------

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
  type?: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

// ----------------------------------------------------
// 2. Authentication & Users
// ----------------------------------------------------

export enum UserRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  SALES = "SALES",
  DESIGNER = "DESIGNER",
  DATA_OPERATOR = "DATA_OPERATOR",
  PRODUCTION_MANAGER = "PRODUCTION_MANAGER",
  MACHINE_OPERATOR = "MACHINE_OPERATOR",
  PACKING_OPERATOR = "PACKING_OPERATOR",
  ACCOUNTS = "ACCOUNTS",
  LABOUR = "LABOUR",
  DELIVERY_PARTNER = "DELIVERY_PARTNER",
  DISPATCH_OPERATOR = "DISPATCH_OPERATOR",
  PURCHASE_MANAGER = "PURCHASE_MANAGER",
  STOCK_MANAGER = "STOCK_MANAGER",
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  device_info?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// ----------------------------------------------------
// 3. Clients & Contacts
// ----------------------------------------------------

export interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  designation?: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  client_code: string;
  organization_name: string;
  is_active: boolean;
  notes?: string | null;
  billing_address?: string | null;
  delivery_address?: string | null;
  tax_identifier?: string | null;
  created_at: string;
  updated_at: string;
  contacts: ClientContact[];
}

export interface ClientCreate {
  client_code: string;
  organization_name: string;
  is_active?: boolean;
  notes?: string;
  billing_address?: string;
  delivery_address?: string;
  tax_identifier?: string;
  contacts?: Array<{
    name: string;
    phone?: string;
    email?: string;
    designation?: string;
    is_primary?: boolean;
    is_active?: boolean;
  }>;
}

// ----------------------------------------------------
// 4. Products & BOM
// ----------------------------------------------------

export interface BOMItem {
  id: string;
  bom_id: string;
  component_name: string;
  quantity_per_unit: number;
  unit: string;
  wastage_percentage: number;
  is_mandatory: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillOfMaterials {
  id: string;
  product_id: string;
  version: number;
  effective_date: string;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items: BOMItem[];
}

export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category_id?: string | null;
  description?: string | null;
  unit: string;
  is_active: boolean;
  metadata_json?: Record<string, any> | null;
  default_workflow_template_id?: string | null;
  created_at: string;
  updated_at: string;
  category?: ProductCategory | null;
  boms: BillOfMaterials[];
}

// ----------------------------------------------------
// 5. Orders & Order Items
// ----------------------------------------------------

export enum OrderStatus {
  DRAFT = "DRAFT",
  CONFIRMED = "CONFIRMED",
  IN_PRODUCTION = "IN_PRODUCTION",
  READY_FOR_DISPATCH = "READY_FOR_DISPATCH",
  DISPATCHED = "DISPATCHED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum OrderPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum OrderItemStatus {
  PENDING = "PENDING",
  IN_PRODUCTION = "IN_PRODUCTION",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  specifications_json?: Record<string, any> | null;
  status: OrderItemStatus;
  workflow_instance_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  status: OrderStatus;
  priority: OrderPriority;
  promised_delivery_date?: string | null;
  billing_address?: string | null;
  delivery_address?: string | null;
  total_amount: number;
  notes?: string | null;
  created_by_id?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderCreate {
  order_number?: string;
  client_id: string;
  priority?: OrderPriority;
  promised_delivery_date?: string;
  billing_address?: string;
  delivery_address?: string;
  notes?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price?: number;
    specifications_json?: Record<string, any>;
  }>;
}

// ----------------------------------------------------
// 6. Workflow Engine
// ----------------------------------------------------

export enum StepType {
  DATA = "DATA",
  PHOTOGRAPHY = "PHOTOGRAPHY",
  DESIGN = "DESIGN",
  APPROVAL = "APPROVAL",
  PRINTING = "PRINTING",
  PRODUCTION = "PRODUCTION",
  FITTING = "FITTING",
  PACKING = "PACKING",
  DISPATCH = "DISPATCH",
  BILLING = "BILLING",
  PAYMENT = "PAYMENT",
  CUSTOM = "CUSTOM",
}

export enum WorkflowStatus {
  PENDING = "PENDING",
  READY = "READY",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum StepStatus {
  PENDING = "PENDING",
  READY = "READY",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  WAITING = "WAITING",
  BLOCKED = "BLOCKED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  SKIPPED = "SKIPPED",
}

export interface WorkflowStepInstance {
  id: string;
  workflow_instance_id: string;
  step_template_id?: string | null;
  step_type: StepType;
  name: string;
  sequence_order: number;
  status: StepStatus;
  required_role?: UserRole | null;
  assigned_user_id?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  notes?: string | null;
}

export interface WorkflowInstance {
  id: string;
  order_item_id: string;
  template_id: string;
  status: WorkflowStatus;
  started_at?: string | null;
  completed_at?: string | null;
  step_instances: WorkflowStepInstance[];
}

// ----------------------------------------------------
// 7. Task Engine
// ----------------------------------------------------

export enum TaskPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TaskStatus {
  PENDING = "PENDING",
  READY = "READY",
  IN_PROGRESS = "IN_PROGRESS",
  BLOCKED = "BLOCKED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface TaskBlocker {
  id: string;
  task_id: string;
  reason: string;
  blocked_by_user_id?: string | null;
  created_at: string;
  resolved_at?: string | null;
  resolved_by_user_id?: string | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface Task {
  id: string;
  task_code: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  order_id: string;
  order_item_id: string;
  workflow_instance_id: string;
  workflow_step_instance_id: string;
  assigned_user_id?: string | null;
  assigned_role?: UserRole | null;
  priority: TaskPriority;
  priority_score: number;
  status: TaskStatus;
  due_date?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_by_id?: string | null;
  completed_by_id?: string | null;
  created_at: string;
  updated_at: string;
  blockers: TaskBlocker[];
  comments: TaskComment[];
}

// ----------------------------------------------------
// 8. File Management & Workspace
// ----------------------------------------------------

export enum FileApprovalStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface FileVersion {
  id: string;
  file_id: string;
  version_number: number;
  storage_key: string;
  checksum: string;
  mime_type: string;
  file_size: number;
  uploaded_by_id?: string | null;
  approval_state: FileApprovalStatus;
  notes?: string | null;
  created_at: string;
}

export interface FileRecord {
  id: string;
  folder_id?: string | null;
  order_id?: string | null;
  order_item_id?: string | null;
  workflow_step_id?: string | null;
  task_id?: string | null;
  filename: string;
  logical_path: string;
  current_version_number: number;
  is_active: boolean;
  created_at: string;
  versions: FileVersion[];
}

export interface FileFolder {
  id: string;
  order_id: string;
  name: string;
  path: string;
  files: FileRecord[];
}

// ----------------------------------------------------
// 9. Approvals
// ----------------------------------------------------

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
}

export interface Approval {
  id: string;
  order_id: string;
  order_item_id?: string | null;
  workflow_step_instance_id?: string | null;
  file_version_id?: string | null;
  requested_by_id: string;
  approved_by_id?: string | null;
  status: ApprovalStatus;
  requested_at: string;
  responded_at?: string | null;
  comments?: string | null;
}

// ----------------------------------------------------
// 10. Quantity Ledger
// ----------------------------------------------------

export enum QuantityTransactionType {
  ORDERED = "ORDERED",
  PRODUCED = "PRODUCED",
  REJECTED = "REJECTED",
  WASTED = "WASTED",
  ASSIGNED = "ASSIGNED",
  COMPLETED = "COMPLETED",
  DEFECTIVE = "DEFECTIVE",
  RETURNED = "RETURNED",
  PACKED = "PACKED",
  DISPATCHED = "DISPATCHED",
}

export interface QuantityTransaction {
  id: string;
  order_id: string;
  order_item_id: string;
  transaction_type: QuantityTransactionType;
  quantity: number;
  batch_reference?: string | null;
  actor_id: string;
  timestamp: string;
  reason?: string | null;
}

export interface QuantitySummary {
  order_item_id: string;
  ordered: number;
  produced: number;
  completed: number;
  rejected: number;
  wasted: number;
  defective: number;
  packed: number;
  dispatched: number;
  net_good_units: number;
  scrap_rate_percentage: number;
  raw_breakdown: Record<QuantityTransactionType, number>;
}

// ----------------------------------------------------
// 11. Audit Logs
// ----------------------------------------------------

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  entity: string;
  entity_id: string;
  old_values_json?: Record<string, any> | null;
  new_values_json?: Record<string, any> | null;
  correlation_id?: string | null;
  reason?: string | null;
  timestamp: string;
}

// ----------------------------------------------------
// 12. Phase 2: Stock Engine
// ----------------------------------------------------

export enum StockLocationType {
  MAIN_STORE = "MAIN_STORE",
  PRODUCTION = "PRODUCTION",
  MACHINE = "MACHINE",
  IN_HOUSE_WORKER = "IN_HOUSE_WORKER",
  OUTSIDE_LABOUR = "OUTSIDE_LABOUR",
}

export enum StockMovementType {
  RECEIPT = "RECEIPT",
  RESERVATION = "RESERVATION",
  RELEASE_RESERVATION = "RELEASE_RESERVATION",
  ISSUE = "ISSUE",
  CONSUMPTION = "CONSUMPTION",
  RETURN = "RETURN",
  WASTE = "WASTE",
  ADJUSTMENT = "ADJUSTMENT",
  TRANSFER = "TRANSFER",
}

export interface StockLocation {
  id: string;
  code: string;
  name: string;
  location_type: StockLocationType;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StockItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category: string;
  unit: string;
  min_stock_level: number;
  cost_price: number;
  is_active: boolean;
  created_at: string;
}

export interface StockBalance {
  stock_item_id: string;
  code: string;
  name: string;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
}

export interface StockMovement {
  id: string;
  stock_item_id: string;
  lot_id?: string | null;
  movement_type: StockMovementType;
  quantity: number;
  from_location_id?: string | null;
  to_location_id?: string | null;
  order_id?: string | null;
  reason?: string | null;
  timestamp: string;
}

// ----------------------------------------------------
// 13. Phase 2: Purchasing & Price History
// ----------------------------------------------------

export enum POStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ORDERED = "ORDERED",
  PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
  RECEIVED = "RECEIVED",
  CANCELLED = "CANCELLED",
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  tax_identifier?: string | null;
  billing_address?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  stock_item_id: string;
  quantity: number;
  unit_price: number;
  received_quantity: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: POStatus;
  total_amount: number;
  items: PurchaseOrderItem[];
  created_at: string;
}

export interface PriceTrends {
  stock_item_id: string;
  current_price: number;
  previous_price: number;
  absolute_increase: number;
  percentage_increase: number;
  recent_average_price: number;
}

// ----------------------------------------------------
// 14. Phase 2: Production Engine & Batches
// ----------------------------------------------------

export enum BatchStatus {
  PLANNED = "PLANNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface Machine {
  id: string;
  code: string;
  name: string;
  machine_type: string;
  status: string;
  is_active: boolean;
}

export interface ProductionBatch {
  id: string;
  batch_number: string;
  order_id: string;
  order_item_id: string;
  product_id: string;
  machine_id: string;
  operator_id: string;
  approved_file_version_id: string;
  status: BatchStatus;
  input_quantity: number;
  output_quantity: number;
  reject_quantity: number;
  waste_quantity: number;
  created_at: string;
}

export interface QuantityReconciliationReport {
  order_item_id: string;
  order_item_quantity: number;
  total_allocated: number;
  unallocated_quantity: number;
  over_allocated_quantity: number;
  is_valid: boolean;
  is_over_allocated: boolean;
}

// ----------------------------------------------------
// 15. Phase 2: Labour & Material Credit Ledger
// ----------------------------------------------------

export enum LabourType {
  IN_HOUSE_WORKER = "IN_HOUSE_WORKER",
  OUTSIDE_CONTRACT = "OUTSIDE_CONTRACT",
}

export interface Labourer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string | null;
  labour_type: LabourType;
  is_active: boolean;
  created_at: string;
}

export interface LabourBatch {
  id: string;
  batch_code: string;
  order_id: string;
  order_item_id: string;
  labourer_id: string;
  operation_name: string;
  allocated_quantity: number;
  completed_quantity: number;
  defective_quantity: number;
  rate_per_unit: number;
  status: string;
  created_at: string;
}

export interface LabourMaterialIssueResponse {
  labourer_id: string;
  stock_item_id: string;
  required_quantity: number;
  existing_balance_used: number;
  newly_issued_quantity: number;
  updated_labour_balance: number;
}

export interface LabourPayment {
  id: string;
  payment_number: string;
  labourer_id: string;
  total_accepted_quantity: number;
  total_payable_amount: number;
  status: string;
  paid_at?: string | null;
}

// ----------------------------------------------------
// 16. Phase 2: Tools & Assets
// ----------------------------------------------------

export enum AssetCondition {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  FAIR = "FAIR",
  DAMAGED = "DAMAGED",
  LOST = "LOST",
}

export interface Asset {
  id: string;
  asset_code: string;
  name: string;
  condition: AssetCondition;
  current_holder_id?: string | null;
  is_active: boolean;
}

// ----------------------------------------------------
// 17. Phase 2: Packing & Logistics
// ----------------------------------------------------

export enum PackageType {
  BOX = "BOX",
  BUNDLE = "BUNDLE",
  CARTON = "CARTON",
  PALLET = "PALLET",
  ENVELOPE = "ENVELOPE",
}

export interface Package {
  id: string;
  package_number: string;
  package_type: PackageType;
  quantity: number;
  weight_kg: number;
}

export interface PackingTask {
  id: string;
  order_id: string;
  order_item_id: string;
  target_quantity: number;
  packed_quantity: number;
  status: string;
  packages: Package[];
}

export enum TransportType {
  BUS = "BUS",
  DTDC = "DTDC",
  PORTER = "PORTER",
  COURIER = "COURIER",
  OTHER = "OTHER",
}

export interface Delivery {
  id: string;
  delivery_number: string;
  order_id: string;
  transport_type: TransportType;
  destination_city: string;
  total_packages: number;
  status: string;
  created_at: string;
}

// ----------------------------------------------------
// 18. Phase 2: Billing & Order Completion
// ----------------------------------------------------

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  ISSUED = "ISSUED",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  client_id: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  items: InvoiceItem[];
  created_at: string;
}

export interface OrderCompletionCheck {
  order_id: string;
  can_complete: boolean;
  reasons: string[];
  workflows_completed: boolean;
  quantities_reconciled: boolean;
  packing_completed: boolean;
}

// ----------------------------------------------------
// 19. Phase 3: Quotations & Tiered Pricing
// ----------------------------------------------------

export enum QuotationStatus {
  DRAFT = "DRAFT",
  SENT_TO_CLIENT = "SENT_TO_CLIENT",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
  CONVERTED_TO_ORDER = "CONVERTED_TO_ORDER",
}

export enum FeasibilityStatus {
  GREEN = "GREEN",
  YELLOW = "YELLOW",
  RED = "RED",
}

export interface PricingTier {
  id: string;
  pricing_rule_id: string;
  min_quantity: number;
  max_quantity?: number | null;
  base_unit_price: number;
  discount_percentage: number;
}

export interface PricingRule {
  id: string;
  product_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  tiers: PricingTier[];
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  specifications_json?: Record<string, any> | null;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  client_id: string;
  status: QuotationStatus;
  current_version_number: number;
  valid_until?: string | null;
  notes?: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  converted_order_id?: string | null;
  items: QuotationItem[];
  created_at: string;
  updated_at: string;
}

export interface CostCalculationBreakdown {
  product_id: string;
  quantity: number;
  material_cost: number;
  wastage_cost: number;
  labour_cost: number;
  machine_cost: number;
  packing_cost: number;
  delivery_cost_estimate: number;
  overhead_cost: number;
  margin_amount: number;
  total_cost: number;
  suggested_unit_price: number;
  breakdown_details: Record<string, any>;
}

export interface QuotationFeasibilityReport {
  quotation_id?: string | null;
  status: FeasibilityStatus;
  stock_feasible: boolean;
  machine_capacity_feasible: boolean;
  labour_capacity_feasible: boolean;
  estimated_production_hours: number;
  reasons: string[];
  recommendations: string[];
  missing_stock_items: Record<string, any>[];
}

// ----------------------------------------------------
// 20. Phase 3: Capacity & Absence Handover
// ----------------------------------------------------

export interface CapacityMetrics {
  resource_type: string;
  resource_id: string;
  resource_name: string;
  total_capacity_hours: number;
  allocated_hours: number;
  available_hours: number;
  utilization_percentage: number;
  status: string;
}

export interface HandoverTaskItem {
  task_id: string;
  task_code: string;
  title: string;
  current_assignee_id: string;
  recommended_assignee_id: string;
  recommended_assignee_name: string;
  priority: string;
  due_date?: string | null;
  reason: string;
}

export interface HandoverPlan {
  absence_id: string;
  absent_user_id: string;
  absent_user_name: string;
  active_tasks_count: number;
  tasks_to_handover: HandoverTaskItem[];
}

// ----------------------------------------------------
// 21. Phase 3: Dynamic ETA Engine
// ----------------------------------------------------

export interface ETACalculationResponse {
  order_id: string;
  estimated_delivery_date: string;
  critical_path_hours: number;
  confidence_level: string;
  factors: string[];
  breakdown: Record<string, number>;
}

// ----------------------------------------------------
// 22. Phase 3: Automation Rules & Idempotency
// ----------------------------------------------------

export interface AutomationRule {
  id: string;
  name: string;
  description?: string | null;
  trigger_event: string;
  conditions_json?: Record<string, any> | null;
  actions_json?: Record<string, any> | null;
  is_active: boolean;
  execution_count: number;
  created_at: string;
}

export interface AutomationLog {
  id: string;
  rule_id?: string | null;
  event_name: string;
  idempotency_key?: string | null;
  status: string;
  payload_json?: Record<string, any> | null;
  actions_executed_json?: Record<string, any> | null;
  error_message?: string | null;
  created_at: string;
}

// ----------------------------------------------------
// 23. Phase 3: Notifications & Client Proof Portal
// ----------------------------------------------------

export interface ProofLinkRead {
  token: string;
  proof_url: string;
  file_version_id: string;
  client_id: string;
  status: string;
  expires_at: string;
}

export interface ProofClientResponse {
  decision: "APPROVED" | "CHANGES_REQUESTED";
  feedback_notes?: string | null;
}

// ----------------------------------------------------
// 24. Phase 3: Management AI & Executive Analytics
// ----------------------------------------------------

export interface AIQueryResponse {
  query: string;
  intent_detected: string;
  answer: string;
  data_evidence: Record<string, any>;
  recommendations: string[];
}

export interface DailyBriefingResponse {
  date: string;
  summary: string;
  orders_at_risk: Record<string, any>[];
  low_stock_alerts: Record<string, any>[];
  overloaded_employees: Record<string, any>[];
  pending_receivables_inr: number;
  action_items: string[];
}

export interface ExecutiveDashboardSummary {
  total_orders_count: number;
  active_production_orders: number;
  completed_orders_count: number;
  total_revenue_inr: number;
  total_outstanding_inr: number;
  avg_scrap_rate_percentage: number;
  top_selling_products: Record<string, any>[];
  contractor_quality_ranking: Record<string, any>[];
}

export interface ResponsibilityAuditItem {
  operation_name: string;
  order_number?: string | null;
  actor_name: string;
  actor_role: string;
  timestamp: string;
  verified_evidence: Record<string, any>;
}

