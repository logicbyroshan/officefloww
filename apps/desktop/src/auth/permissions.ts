import { UserRole } from "@officefloww/api-types";

export type AppNavSection =
  | "dashboard"
  | "clients"
  | "quotations"
  | "orders"
  | "tasks"
  | "approvals"
  | "products"
  | "production"
  | "stock"
  | "purchasing"
  | "labour"
  | "packing"
  | "dispatch"
  | "billing"
  | "reports"
  | "audit"
  | "automation"
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

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
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
  [UserRole.ADMIN]: [
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
  [UserRole.MANAGER]: [
    "orders:create",
    "orders:edit",
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
  ],
  [UserRole.SALES]: [
    "orders:create",
    "clients:create",
    "clients:edit",
    "quotations:create",
    "approvals:approve",
    "reports:view",
  ],
  [UserRole.DESIGNER]: [
    "tasks:advance",
    "tasks:block",
  ],
  [UserRole.DATA_OPERATOR]: [
    "tasks:advance",
    "tasks:block",
  ],
  [UserRole.PRODUCTION_MANAGER]: [
    "orders:edit",
    "tasks:advance",
    "tasks:block",
    "stock:reserve",
    "labour:allocate",
    "reports:view",
  ],
  [UserRole.MACHINE_OPERATOR]: [
    "tasks:advance",
    "tasks:block",
  ],
  [UserRole.PACKING_OPERATOR]: [
    "tasks:advance",
    "tasks:block",
  ],
  [UserRole.ACCOUNTS]: [
    "clients:create",
    "billing:invoice",
    "reports:view",
  ],
  [UserRole.LABOUR]: [],
  [UserRole.DELIVERY_PARTNER]: [],
  [UserRole.DISPATCH_OPERATOR]: ["tasks:advance"],
  [UserRole.PURCHASE_MANAGER]: ["stock:reserve", "purchasing:manage"],
  [UserRole.STOCK_MANAGER]: ["stock:reserve"],
};

const ROLE_NAV_SECTIONS: Record<UserRole, AppNavSection[]> = {
  [UserRole.OWNER]: [
    "dashboard",
    "quotations",
    "orders",
    "tasks",
    "approvals",
    "clients",
    "products",
    "production",
    "stock",
    "purchasing",
    "labour",
    "packing",
    "dispatch",
    "billing",
    "reports",
    "audit",
    "automation",
    "settings",
  ],
  [UserRole.ADMIN]: [
    "dashboard",
    "quotations",
    "orders",
    "tasks",
    "approvals",
    "clients",
    "products",
    "production",
    "stock",
    "purchasing",
    "labour",
    "packing",
    "dispatch",
    "billing",
    "reports",
    "audit",
    "automation",
    "settings",
  ],
  [UserRole.MANAGER]: [
    "dashboard",
    "quotations",
    "orders",
    "tasks",
    "approvals",
    "clients",
    "products",
    "production",
    "stock",
    "purchasing",
    "labour",
    "packing",
    "dispatch",
    "billing",
    "reports",
    "settings",
  ],
  [UserRole.SALES]: [
    "dashboard",
    "quotations",
    "orders",
    "clients",
    "products",
    "approvals",
    "reports",
    "settings",
  ],
  [UserRole.DESIGNER]: [
    "dashboard",
    "tasks",
    "orders",
    "approvals",
    "settings",
  ],
  [UserRole.DATA_OPERATOR]: [
    "dashboard",
    "tasks",
    "orders",
    "settings",
  ],
  [UserRole.PRODUCTION_MANAGER]: [
    "dashboard",
    "orders",
    "tasks",
    "production",
    "stock",
    "labour",
    "packing",
    "reports",
    "settings",
  ],
  [UserRole.MACHINE_OPERATOR]: [
    "dashboard",
    "tasks",
    "production",
    "stock",
    "settings",
  ],
  [UserRole.PACKING_OPERATOR]: [
    "dashboard",
    "tasks",
    "packing",
    "dispatch",
    "settings",
  ],
  [UserRole.ACCOUNTS]: [
    "dashboard",
    "billing",
    "clients",
    "orders",
    "reports",
    "settings",
  ],
  [UserRole.LABOUR]: ["dashboard", "tasks"],
  [UserRole.DELIVERY_PARTNER]: ["dashboard", "dispatch"],
  [UserRole.DISPATCH_OPERATOR]: ["dashboard", "packing", "dispatch", "tasks"],
  [UserRole.PURCHASE_MANAGER]: ["dashboard", "stock", "purchasing", "orders"],
  [UserRole.STOCK_MANAGER]: ["dashboard", "stock", "purchasing", "orders"],
};

export function canAccessNav(role: UserRole, section: AppNavSection): boolean {
  const allowed = ROLE_NAV_SECTIONS[role] || ["dashboard"];
  return allowed.includes(section);
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
