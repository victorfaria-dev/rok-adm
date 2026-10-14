import { defineConfig, devices } from "@playwright/test";

// Sign-in CONFIGURED, with Supabase mocked by page.route (no real project, no network).
// Builds a separate copy of the site with fake PUBLIC_SUPABASE_* values into dist-auth-e2e/, so
// the normal dist/ (and every other spec) stays unconfigured. Run from apps/web:
//   E2E_PORT=4451 pnpm exec playwright test --config playwright.auth.config.ts
const PORT = Number(process.env.E2E_PORT ?? 4322);
export const FAKE_SUPABASE_URL = "http://127.0.0.1:54399";

export default defineConfig({
  testDir: "e2e-auth",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", serviceWorkers: "block" },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], browserName: "chromium", viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `pnpm exec astro build --outDir dist-auth-e2e && pnpm exec astro preview --outDir dist-auth-e2e --port ${PORT}`,
    env: { PUBLIC_SUPABASE_URL: FAKE_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY: "e2e-anon-key" },
    port: PORT,
    timeout: 600_000,
    reuseExistingServer: !process.env.CI,
  },
});
