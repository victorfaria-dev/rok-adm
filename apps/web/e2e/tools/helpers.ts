// Shared helpers for the wave D specs (/tools/, /glossary/, /changes/).
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function axeViolations(page: Page): Promise<string[]> {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return result.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

/** Open a route in a theme (set before load via ko:v1, like the smoke spec). */
export async function openInTheme(page: Page, route: string, theme: "dark" | "light"): Promise<void> {
  await page.goto("/404.html");
  await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

export async function noSidewaysScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Islands hydrate after load; wait until an island is interactive. */
export async function hydrated(page: Page): Promise<void> {
  await page.waitForFunction(() => [...document.querySelectorAll("astro-island")].every((i) => !i.hasAttribute("ssr")));
}

export async function toolsStore(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => JSON.parse(localStorage.getItem("ko:tools:v1") ?? "{}") as Record<string, unknown>);
}
