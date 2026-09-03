import { apiClient } from "./client";
import { User, TokenResponse, UserRole } from "@officefloww/api-types";

export interface SeedAccount {
  email: string;
  name: string;
  role: UserRole;
  description: string;
  password: string;
}

/** Local in-house accounts that work offline (no backend required) */
export const SEED_ACCOUNTS: SeedAccount[] = [
  {
    email: "admin@adharshbhopal.in",
    name: "Rohan Sharma",
    role: UserRole.ADMIN,
    description: "System administrator – full access",
    password: "Admin@2026",
  },
  {
    email: "operator@adharshbhopal.in",
    name: "Priya Nair",
    role: UserRole.OPERATOR,
    description: "Operations manager – production & scheduling",
    password: "Operator@2026",
  },
  {
    email: "worker@adharshbhopal.in",
    name: "Dinesh Kumar",
    role: UserRole.WORKER,
    description: "Floor worker – press & packing",
    password: "Worker@2026",
  },
  {
    email: "labour@adharshbhopal.in",
    name: "Ramesh Stitching",
    role: UserRole.LABOUR,
    description: "Labour contractor – lanyard assembly",
    password: "Labour@2026",
  },
];

/** Build a fake User object from a seed account (offline mode) */
function buildLocalUser(seed: SeedAccount): User {
  return {
    id: `local-${seed.email.split("@")[0]}`,
    email: seed.email,
    full_name: seed.name,
    phone: null,
    role: seed.role,
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

/** Try to authenticate locally against seed accounts */
function localLogin(email: string, password: string): User | null {
  const match = SEED_ACCOUNTS.find(
    (s) => s.email.toLowerCase() === email.toLowerCase() && s.password === password
  );
  return match ? buildLocalUser(match) : null;
}

export const AuthService = {
  login: async (email: string, password = ""): Promise<TokenResponse> => {
    // 1. Try the real backend first
    try {
      const res = await apiClient.auth.login({ email, password });
      localStorage.setItem("officefloww_access_token", res.access_token);
      localStorage.setItem("officefloww_refresh_token", res.refresh_token);
      localStorage.setItem("officefloww_user", JSON.stringify(res.user));
      localStorage.removeItem("officefloww_offline_mode");
      return res;
    } catch {
      // 2. Backend unavailable — fall back to local seed auth
      const localUser = localLogin(email, password);
      if (!localUser) {
        throw new Error("Invalid credentials. Check your email and password.");
      }
      // Fake token response for offline mode
      const fakeToken = `offline_${btoa(email)}_${Date.now()}`;
      const fakeRes: TokenResponse = {
        access_token: fakeToken,
        refresh_token: fakeToken,
        token_type: "bearer",
        expires_in: 86400,
        user: localUser,
      };
      localStorage.setItem("officefloww_access_token", fakeToken);
      localStorage.setItem("officefloww_refresh_token", fakeToken);
      localStorage.setItem("officefloww_user", JSON.stringify(localUser));
      localStorage.setItem("officefloww_offline_mode", "true");
      return fakeRes;
    }
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem("officefloww_refresh_token") || undefined;
      const isOffline = localStorage.getItem("officefloww_offline_mode") === "true";
      if (!isOffline) {
        await apiClient.auth.logout(refreshToken);
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem("officefloww_access_token");
      localStorage.removeItem("officefloww_refresh_token");
      localStorage.removeItem("officefloww_user");
      localStorage.removeItem("officefloww_offline_mode");
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem("officefloww_access_token");
    if (!token) return null;

    // Offline mode — use stored user directly (no API call)
    const isOffline = localStorage.getItem("officefloww_offline_mode") === "true";
    if (isOffline) {
      return AuthService.getStoredUser();
    }

    // Online mode — validate token with API
    try {
      return await apiClient.auth.getMe();
    } catch {
      // API down but we have a stored user — return it so we don't kick user out
      const stored = AuthService.getStoredUser();
      if (stored) {
        localStorage.setItem("officefloww_offline_mode", "true");
        return stored;
      }
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
