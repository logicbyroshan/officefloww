import { useState, useEffect, useCallback } from "react";
import { getApiBaseUrl } from "../api/client";

export function useConnection(intervalMs = 15000): {
  connected: boolean;
  checking: boolean;
  checkConnection: () => Promise<boolean>;
} {
  const [connected, setConnected] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setChecking(true);
    try {
      const url = getApiBaseUrl().replace("/api/v1", "/openapi.json");
      const res = await fetch(url, { method: "HEAD", mode: "cors" });
      const isOk = res.ok;
      setConnected(isOk);
      return isOk;
    } catch {
      setConnected(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const timer = setInterval(checkConnection, intervalMs);
    return () => clearInterval(timer);
  }, [checkConnection, intervalMs]);

  return { connected, checking, checkConnection };
}
