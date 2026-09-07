import type { AxiosError, AxiosInstance } from "axios";
import { ApiError, type FieldErrors } from "../errors";

type ServerError = { code?: string; message?: string; fieldErrors?: FieldErrors };

export function attachErrorInterceptor(http: AxiosInstance) {
  http.interceptors.response.use(
    (r) => r,
    (error: AxiosError<ServerError>) => {
      if (error.response) {
        const body = error.response.data ?? ({} as ServerError);
        throw new ApiError(body.message ?? error.message ?? "Request failed", {
          code: body.code ?? `HTTP_${error.response.status}`,
          status: error.response.status,
          fieldErrors: body.fieldErrors,
        });
      }
      if (error.code === "ECONNABORTED") {
        throw new ApiError("Request timed out", { code: "TIMEOUT" });
      }
      throw new ApiError(error.message || "Network error", { code: "NETWORK" });
    },
  );
}
