import React from "react";
import { useAuth } from "./AuthContext";
import { UserRole } from "@officefloww/api-types";
import { Permission, AppNavSection } from "./permissions";

export interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { can } = useAuth();
  if (!can(permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};

export interface RoleGateProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { role } = useAuth();
  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};

export interface NavGateProps {
  section: AppNavSection;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const NavGate: React.FC<NavGateProps> = ({
  section,
  children,
  fallback = null,
}) => {
  const { canNav } = useAuth();
  if (!canNav(section)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};
