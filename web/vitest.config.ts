import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/shared/**", "src/features/**/api/**", "src/features/**/hooks/**"],
      exclude: ["**/*.d.ts", "src/test/**", "src/mock/**"],
      thresholds: { lines: 70, statements: 70, branches: 60, functions: 70 },
    },
  },
});
