import { defineConfig, devices } from "@playwright/test";

const browserChannel = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4173",
    trace: "on-first-retry",
    headless: true,
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command:
          "node node_modules/vite/bin/vite.js preview --config vite.config.ts --port 4173",
        url: "http://localhost:4173",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(browserChannel ? { channel: browserChannel } : {}),
      },
    },
  ],
});
