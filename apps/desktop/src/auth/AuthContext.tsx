import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, UserRole } from "@officefloww/api-types";
import { AuthService } from "../api/auth.service";
import { hasPermission, canAccessNav, Permission, AppNavSection } from "./permissions";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (email: string) => Promise<void>;
  can: (permission: Permission) => boolean;
  canNav: (section: AppNavSection) => boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => AuthService.getStoredUser());
  const [loading, setLoading] = useState<boolean>(true);

  const checkCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      const u = await AuthService.getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkCurrentUser();

    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener("officefloww:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("officefloww:auth-expired", handleAuthExpired);
  }, [checkCurrentUser]);

  const login = async (email: string, password = "OfficeFloww@2026") => {
    setLoading(true);
    try {
      const res = await AuthService.login(email, password);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const switchUser = async (email: string) => {
    await login(email);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const can = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const canNav = (section: AppNavSection): boolean => {
    if (!user) return false;
    return canAccessNav(user.role, section);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchUser,
        can,
        canNav,
        role: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
