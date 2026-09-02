import { OfficeFlowwClient } from "@officefloww/api-client";

const API_BASE_URL = localStorage.getItem("officefloww_api_url") || "http://localhost:8000/api/v1";

export const apiClient = new OfficeFlowwClient({
  baseUrl: API_BASE_URL,
  accessToken: localStorage.getItem("officefloww_access_token") || undefined,
  onTokenExpired: () => {
    localStorage.removeItem("officefloww_access_token");
    window.dispatchEvent(new CustomEvent("officefloww:auth-expired"));
  },
});

export function setApiBaseUrl(newUrl: string) {
  localStorage.setItem("officefloww_api_url", newUrl);
  (apiClient as any).baseUrl = newUrl;
}

export function getApiBaseUrl(): string {
  return localStorage.getItem("officefloww_api_url") || "http://localhost:8000/api/v1";
}
