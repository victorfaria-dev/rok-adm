import { defineConfig } from "vitest/config";

// Unit tests only; e2e/ runs under Playwright.
export default defineConfig({ test: { include: ["src/**/*.test.ts"] } });
