import { UserRole } from "@officefloww/api-types";

export type AppNavSection =
  | "dashboard"
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
  [UserRole.OPERATOR]: [
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
  [UserRole.WORKER]: [
    "tasks:advance",
    "tasks:block",
    "orders:edit",
  ],
  [UserRole.MANAGER]: [
    "orders:create",
    "orders:edit",
    "clients:create",
    "clients:edit",
    "quotations:create",
    "approvals:approve",
    "approvals:reject",
    "tasks:advance",
    "tasks:block",
    "stock:reserve",
    "purchasing:manage",
    "labour:allocate",
    "reports:view",
    "settings:manage",
  ],
  [UserRole.SALES]: [
    "orders:create",
    "orders:edit",
    "clients:create",
    "clients:edit",
    "quotations:create",
    "reports:view",
  ],
  [UserRole.DESIGNER]: [
    "approvals:approve",
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
    "billing:invoice",
    "reports:view",
  ],
  [UserRole.LABOUR]: [
    "tasks:advance",
  ],
  [UserRole.DELIVERY_PARTNER]: [
    "tasks:advance",
  ],
  [UserRole.DISPATCH_OPERATOR]: [
    "tasks:advance",
  ],
  [UserRole.PURCHASE_MANAGER]: [
    "purchasing:manage",
    "stock:reserve",
  ],
  [UserRole.STOCK_MANAGER]: [
    "stock:reserve",
    "purchasing:manage",
  ],
};

const ROLE_NAV_SECTIONS: Record<UserRole, AppNavSection[]> = {
  [UserRole.OWNER]: [
    "dashboard",
    "tasks",
    "staff",
    "labour",
    "stock",
    "clients",
    "billing",
    "settings",
  ],
  [UserRole.ADMIN]: [
    "dashboard",
    "tasks",
    "staff",
    "labour",
    "stock",
    "clients",
    "billing",
    "settings",
  ],
  [UserRole.OPERATOR]: [
    "dashboard",
    "tasks",
    "staff",
    "labour",
    "stock",
    "clients",
    "billing",
    "settings",
  ],
  [UserRole.WORKER]: [
    "dashboard",
    "tasks",
    "stock",
    "settings",
  ],
  [UserRole.MANAGER]: [
    "dashboard",
    "tasks",
    "staff",
    "labour",
    "stock",
    "clients",
    "billing",
    "settings",
  ],
  [UserRole.SALES]: [
    "dashboard",
    "tasks",
    "clients",
    "settings",
  ],
  [UserRole.DESIGNER]: [
    "dashboard",
    "tasks",
    "clients",
    "settings",
  ],
  [UserRole.DATA_OPERATOR]: [
    "dashboard",
    "tasks",
    "clients",
    "settings",
  ],
  [UserRole.PRODUCTION_MANAGER]: [
    "dashboard",
    "tasks",
    "staff",
    "stock",
    "clients",
    "settings",
  ],
  [UserRole.MACHINE_OPERATOR]: [
    "dashboard",
    "tasks",
    "stock",
    "settings",
  ],
  [UserRole.PACKING_OPERATOR]: [
    "dashboard",
    "tasks",
    "settings",
  ],
  [UserRole.ACCOUNTS]: [
    "dashboard",
    "tasks",
    "clients",
    "billing",
    "settings",
  ],
  [UserRole.LABOUR]: [
    "dashboard",
    "tasks",
  ],
  [UserRole.DELIVERY_PARTNER]: [
    "dashboard",
    "tasks",
  ],
  [UserRole.DISPATCH_OPERATOR]: [
    "dashboard",
    "tasks",
  ],
  [UserRole.PURCHASE_MANAGER]: [
    "dashboard",
    "tasks",
    "stock",
    "settings",
  ],
  [UserRole.STOCK_MANAGER]: [
    "dashboard",
    "tasks",
    "stock",
    "settings",
  ],
};

export function canAccessNav(role: UserRole, section: AppNavSection): boolean {
  const allowed = ROLE_NAV_SECTIONS[role] || ["dashboard"];
  return allowed.includes(section);
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
