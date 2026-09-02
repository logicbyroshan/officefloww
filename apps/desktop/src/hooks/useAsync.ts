import { useState, useEffect, useCallback } from "react";
import { getApiBaseUrl } from "../api/client";

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  deps: any[] = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<T | null>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, execute, setData };
}

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
