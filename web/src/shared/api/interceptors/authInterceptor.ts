import type { AxiosInstance } from "axios";
import { useAuthStore } from "@/app/stores/authStore";

export function attachAuthInterceptor(http: AxiosInstance) {
  http.interceptors.request.use((cfg) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      cfg.headers = cfg.headers ?? {};
      (cfg.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return cfg;
  });
}
