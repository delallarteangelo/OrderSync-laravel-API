import { z } from "zod";

const schema = z.object({
  VITE_API_BASE_URL: z.string().default("/api/v1"),
  VITE_WS_BASE_URL: z.string().default("ws://localhost:5173/ws"),
  VITE_APP_ENV: z.enum(["dev", "staging", "prod"]).default("dev"),
  VITE_ENABLE_HTTP_LOGS: z.enum(["true", "false"]).default("false"),
  VITE_LOW_STOCK_BANNER: z.enum(["true", "false"]).default("true"),
  VITE_USE_MSW: z.enum(["true", "false"]).default("true"),
  VITE_USE_MOCK_AUTH: z.enum(["true", "false"]).default("false"),
  VITE_USE_POLLING_CHAT: z.enum(["true", "false"]).default("false"),
  VITE_PWA_ENABLED: z.enum(["true", "false"]).default("false"),
  VITE_AI_SUPPORT_ENABLED: z.enum(["true", "false"]).default("false"),
});

export const env = schema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  VITE_ENABLE_HTTP_LOGS: import.meta.env.VITE_ENABLE_HTTP_LOGS,
  VITE_LOW_STOCK_BANNER: import.meta.env.VITE_LOW_STOCK_BANNER,
  VITE_USE_MSW: import.meta.env.VITE_USE_MSW,
  VITE_USE_MOCK_AUTH: import.meta.env.VITE_USE_MOCK_AUTH,
  VITE_USE_POLLING_CHAT: import.meta.env.VITE_USE_POLLING_CHAT,
  VITE_PWA_ENABLED: import.meta.env.VITE_PWA_ENABLED,
  VITE_AI_SUPPORT_ENABLED: import.meta.env.VITE_AI_SUPPORT_ENABLED,
});

export const flags = {
  httpLogs: env.VITE_ENABLE_HTTP_LOGS === "true",
  lowStockBanner: env.VITE_LOW_STOCK_BANNER === "true",
  useMsw: env.VITE_USE_MSW === "true",
  useMockAuth: env.VITE_USE_MOCK_AUTH === "true",
  usePollingChat: env.VITE_USE_POLLING_CHAT === "true",
  pwaEnabled: env.VITE_PWA_ENABLED === "true",
  aiSupportEnabled: env.VITE_AI_SUPPORT_ENABLED === "true",
};
