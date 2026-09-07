export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  code: string;
  status: number;
  fieldErrors?: FieldErrors;
  constructor(message: string, opts: { code?: string; status?: number; fieldErrors?: FieldErrors } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = opts.code ?? "UNKNOWN";
    this.status = opts.status ?? 0;
    this.fieldErrors = opts.fieldErrors;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}
