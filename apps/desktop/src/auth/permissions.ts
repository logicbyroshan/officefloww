import { UserRole } from "@officefloww/api-types";

export type AppNavSection =
  | "dashboard"
  | "orders"
  | "lanyard_orders"
  | "card_orders"
  | "labour_lanyard"
  | "tasks"
  | "staff"
  | "labour"
  | "stock"
  | "clients"
  | "billing"
  | "settings";

export type Permission =
  | "orders:create"
  | "orders:edit"
  | "orders:cancel"
  | "clients:create"
  | "clients:edit"
  | "quotations:create"
  | "products:create"
  | "approvals:approve"
  | "approvals:reject"
  | "tasks:advance"
  | "tasks:block"
  | "stock:reserve"
  | "purchasing:manage"
  | "labour:allocate"
  | "billing:invoice"
  | "reports:view"
  | "audit:view"
  | "automation:manage"
  | "settings:manage";

const ROLE_MAP: Record<string, string> = {
  OWNER: "ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "ADMIN",
  ACCOUNTS: "ADMIN",
  SALES: "OPERATOR",
  DESIGNER: "OPERATOR",
  DATA_OPERATOR: "OPERATOR",
  PRODUCTION_MANAGER: "OPERATOR",
  PURCHASE_MANAGER: "OPERATOR",
  STOCK_MANAGER: "OPERATOR",
  OPERATOR: "OPERATOR",
  MACHINE_OPERATOR: "WORKER",
  PACKING_OPERATOR: "WORKER",
  DISPATCH_OPERATOR: "WORKER",
  DELIVERY_PARTNER: "WORKER",
  WORKER: "WORKER",
  LABOUR: "LABOUR",
};

export function normalizeRole(role: string | UserRole): string {
  if (!role) return "WORKER";
  const str = String(role).toUpperCase();
  return ROLE_MAP[str] || str;
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    "orders:create",
    "orders:edit",
    "orders:cancel",
    "clients:create",
    "clients:edit",
    "quotations:create",
    "products:create",
    "approvals:approve",
    "approvals:reject",
    "tasks:advance",
    "tasks:block",
    "stock:reserve",
    "purchasing:manage",
    "labour:allocate",
    "billing:invoice",
    "reports:view",
    "audit:view",
    "automation:manage",
    "settings:manage",
  ],
  OPERATOR: [
    "orders:create",
    "orders:edit",
    "orders:cancel",
    "clients:create",
    "clients:edit",
    "quotations:create",
    "products:create",
    "approvals:approve",
    "approvals:reject",
    "tasks:advance",
    "tasks:block",
    "stock:reserve",
    "purchasing:manage",
    "labour:allocate",
    "billing:invoice",
    "reports:view",
    "settings:manage",
  ],
  WORKER: [
    "tasks:advance",
    "tasks:block",
    "orders:edit",
    "stock:reserve",
    "reports:view",
  ],
  LABOUR: [
    "tasks:advance",
  ],
};

const ROLE_NAV_SECTIONS: Record<string, AppNavSection[]> = {
  ADMIN: [
    "dashboard",
    "orders",
    "lanyard_orders",
    "card_orders",
    "labour_lanyard",
    "tasks",
    "staff",
    "labour",
    "stock",
    "clients",
    "billing",
    "settings",
  ],
  OPERATOR: [
    "dashboard",
    "orders",
    "lanyard_orders",
    "card_orders",
    "labour_lanyard",
    "tasks",
    "staff",
    "labour",
    "stock",
    "clients",
    "billing",
    "settings",
  ],
  WORKER: [
    "dashboard",
    "orders",
    "lanyard_orders",
    "card_orders",
    "labour_lanyard",
    "tasks",
    "stock",
    "settings",
  ],
  LABOUR: [
    "dashboard",
    "labour_lanyard",
    "tasks",
  ],
};

export function canAccessNav(role: string | UserRole, section: AppNavSection): boolean {
  if (!role) return false;
  const direct = ROLE_NAV_SECTIONS[role];
  if (direct) return direct.includes(section);

  const canonical = normalizeRole(role);
  const allowed = ROLE_NAV_SECTIONS[canonical] || [
    "dashboard",
    "lanyard_orders",
    "card_orders",
    "labour_lanyard",
    "stock",
  ];
  return allowed.includes(section);
}

export function hasPermission(role: string | UserRole, permission: Permission): boolean {
  if (!role) return false;
  const direct = ROLE_PERMISSIONS[role];
  if (direct && direct.includes(permission)) return true;

  const canonical = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[canonical] || [];
  return permissions.includes(permission);
}

