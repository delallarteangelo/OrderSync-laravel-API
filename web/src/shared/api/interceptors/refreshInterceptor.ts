import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/app/stores/authStore";

type Resolver = (value?: unknown) => void;
let refreshing = false;
let queue: Array<{
  resolve: Resolver;
  reject: (reason?: unknown) => void;
  cfg: AxiosRequestConfig;
}> = [];

function flushQueue(error: unknown, http: AxiosInstance) {
  const pending = queue;
  queue = [];
  for (const item of pending) {
    if (error) item.reject(error);
    else item.resolve(http(item.cfg));
  }
}

export function attachRefreshInterceptor(http: AxiosInstance) {
  http.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const cfg = (error.config ?? {}) as AxiosRequestConfig & {
        _retry?: boolean;
        _skipRefresh?: boolean;
      };
      const status = error.response?.status;
      if (status !== 401 || cfg._retry || cfg._skipRefresh) throw error;

      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve: resolve as Resolver, reject, cfg });
        });
      }

      refreshing = true;
      cfg._retry = true;
      try {
        const { data } = await http.post("/auth/refresh", null, {
          _skipRefresh: true,
        } as AxiosRequestConfig);
        if (data?.accessToken && data?.user) {
          useAuthStore.getState().setSession({ accessToken: data.accessToken, user: data.user });
        }
        flushQueue(null, http);
        return http(cfg);
      } catch (e) {
        flushQueue(e, http);
        useAuthStore.getState().clear();
        throw e;
      } finally {
        refreshing = false;
      }
    },
  );
}
