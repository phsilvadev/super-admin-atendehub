import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3400",
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: {
      executablePath: process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"] ?? "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: [
    {
      command: "python3 scripts/start-e2e-backend.py",
      url: "http://127.0.0.1:8400/health",
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: "npm run start -- --port 3400",
      url: "http://127.0.0.1:3400/login",
      env: { BACKEND_URL: "http://127.0.0.1:8400", APP_ORIGIN: "http://127.0.0.1:3400" },
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});
