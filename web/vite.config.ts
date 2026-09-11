import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const releaseHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; manifest-src 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self'",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxy = {
    "/api": {
      target: env.VITE_API_PROXY_TARGET || "http://minigrocery.test",
      changeOrigin: true,
      timeout: 5_000,
      proxyTimeout: 5_000,
    },
  };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: apiProxy,
    },
    preview: {
      port: 4173,
      proxy: apiProxy,
      headers: releaseHeaders,
    },
  };
});
