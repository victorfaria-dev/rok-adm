import { defineConfig, devices } from "@playwright/test";

// E2E_PORT lets parallel worktrees run previews side by side without hitting each other's build.
const PORT = Number(process.env.E2E_PORT ?? 4321);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], browserName: "chromium", viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1280, height: 800 } } },
  ],
  // Tests the real static build (with service worker), not the dev server.
  webServer: { command: `pnpm exec astro preview --port ${PORT}`, port: PORT, reuseExistingServer: !process.env.CI },
});
