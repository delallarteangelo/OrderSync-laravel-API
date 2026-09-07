import axios, { type AxiosInstance } from "axios";
import { env, flags } from "@/shared/config/env";
import { attachAuthInterceptor } from "./interceptors/authInterceptor";
import { attachRefreshInterceptor } from "./interceptors/refreshInterceptor";
import { attachErrorInterceptor } from "./interceptors/errorInterceptor";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** When true, the refresh interceptor will not attempt token refresh for this request. */
    _skipRefresh?: boolean;
    _retry?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    _skipRefresh?: boolean;
    _retry?: boolean;
  }
}

export const http: AxiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 20_000,
  headers: { "X-Client": "tonettes-web" },
});

attachAuthInterceptor(http);
attachRefreshInterceptor(http);
attachErrorInterceptor(http);

if (flags.httpLogs) {
  http.interceptors.request.use((cfg) => {
    // eslint-disable-next-line no-console
    console.debug("[http]", cfg.method?.toUpperCase(), cfg.url, cfg.params ?? "");
    return cfg;
  });
}
