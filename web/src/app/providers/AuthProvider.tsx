import * as React from "react";
import { useAuthStore } from "@/app/stores/authStore";
import { refresh as apiRefresh } from "@/shared/api/auth";
import { stomp } from "@/shared/ws/stompClient";

/**
 * Bootstraps the session once on cold load by attempting to refresh
 * against the backend (refresh-token cookie). Children render either way;
 * `RequireAuth` shows a splash until `bootstrapped === true`.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const setSession = useAuthStore((s) => s.setSession);
  const markBootstrapped = useAuthStore((s) => s.markBootstrapped);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  React.useEffect(() => {
    if (bootstrapped) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRefresh();
        if (!cancelled) setSession({ accessToken: res.accessToken, user: res.user });
      } catch {
        /* no refresh cookie / expired */
      } finally {
        if (!cancelled) markBootstrapped();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrapped, setSession, markBootstrapped]);

  // Manage STOMP lifecycle alongside auth.
  React.useEffect(() => {
    if (user && accessToken) {
      stomp.connect();
      return () => stomp.disconnect();
    }
  }, [user, accessToken]);

  return <>{children}</>;
}
