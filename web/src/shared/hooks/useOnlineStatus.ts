import * as React from "react";
import { env } from "@/shared/config/env";

export type ServiceReachability = "checking" | "reachable" | "unreachable";

export function useOnlineStatus(): boolean {
  const [online, setOnline] = React.useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  React.useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}

export function useServiceReachability(
  online: boolean,
  options: { intervalMs?: number; timeoutMs?: number } = {},
): ServiceReachability {
  const { intervalMs = 30_000, timeoutMs = 5_000 } = options;
  const [status, setStatus] = React.useState<ServiceReachability>(
    online ? "checking" : "unreachable",
  );

  React.useEffect(() => {
    if (!online) {
      setStatus("unreachable");
      return;
    }

    let active = true;
    const check = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(`${env.VITE_API_BASE_URL}/health`, {
          cache: "no-store",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (active) setStatus(response.ok ? "reachable" : "unreachable");
      } catch {
        if (active) setStatus("unreachable");
      } finally {
        window.clearTimeout(timeout);
      }
    };

    setStatus("checking");
    void check();
    const interval = window.setInterval(() => void check(), intervalMs);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [intervalMs, online, timeoutMs]);

  return status;
}
