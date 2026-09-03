import { apiClient } from "./client";
import { User, TokenResponse, UserRole } from "@officefloww/api-types";

export interface SeedAccount {
  email: string;
  name: string;
  role: UserRole;
  description: string;
}

export const SEED_ACCOUNTS: SeedAccount[] = [
  { email: "owner@adharshbhopal.in", name: "Vikram Malhotra", role: UserRole.OWNER, description: "Full enterprise ownership & financials" },
  { email: "admin@adharshbhopal.in", name: "Rohan Sharma", role: UserRole.ADMIN, description: "System administrator & security" },
  { email: "manager@adharshbhopal.in", name: "Priya Nair", role: UserRole.MANAGER, description: "Production scheduling & proof approvals" },
  { email: "sales@adharshbhopal.in", name: "Arjun Kapoor", role: UserRole.SALES, description: "Client onboarding & orders intake" },
  { email: "designer@adharshbhopal.in", name: "Sneha Roy", role: UserRole.DESIGNER, description: "Artwork proofing & file submissions" },
  { email: "dataop@adharshbhopal.in", name: "Amit Verma", role: UserRole.DATA_OPERATOR, description: "Data roster entry & verification" },
  { email: "prodmgr@adharshbhopal.in", name: "Rajesh Gupta", role: UserRole.PRODUCTION_MANAGER, description: "Machine dispatch & batch allocations" },
  { email: "machineop@adharshbhopal.in", name: "Dinesh Kumar", role: UserRole.MACHINE_OPERATOR, description: "Press floor & defect logging" },
  { email: "packingop@adharshbhopal.in", name: "Sunil Yadav", role: UserRole.PACKING_OPERATOR, description: "Box verification & QC weighing" },
  { email: "accounts@adharshbhopal.in", name: "Ananya Deshmukh", role: UserRole.ACCOUNTS, description: "GST billing & financial ledgers" },
];

export const AuthService = {
  login: async (email: string, password = "OfficeFloww@2026"): Promise<TokenResponse> => {
    const res = await apiClient.auth.login({ email, password });
    localStorage.setItem("officefloww_access_token", res.access_token);
    localStorage.setItem("officefloww_refresh_token", res.refresh_token);
    localStorage.setItem("officefloww_user", JSON.stringify(res.user));
    return res;
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem("officefloww_refresh_token") || undefined;
      await apiClient.auth.logout(refreshToken);
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem("officefloww_access_token");
      localStorage.removeItem("officefloww_refresh_token");
      localStorage.removeItem("officefloww_user");
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem("officefloww_access_token");
    if (!token) return null;
    try {
      return await apiClient.auth.getMe();
    } catch {
      return null;
    }
  },

  getStoredUser: (): User | null => {
    const stored = localStorage.getItem("officefloww_user");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },
};
