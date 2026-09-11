import { UserRole } from "@officefloww/api-types";

export type AppNavSection =
  | "orders"
  | "lanyard_orders"
  | "card_orders"
  | "labour_lanyard"
  | "stock";

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

const CORE_SECTIONS: AppNavSection[] = [
  "orders",
  "lanyard_orders",
  "card_orders",
  "labour_lanyard",
  "stock",
];

export function canAccessNav(_role?: string | UserRole | null, _section?: AppNavSection): boolean {
  return true;
}

export function hasPermission(_role?: string | UserRole | null, _permission?: Permission): boolean {
  return true;
}

