// Shared helpers for the council kit specs (/kingdom/**).
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const KINGDOM_KEY = "ko:kingdom:v1";

/** Collect console errors and page errors; assert the list is empty at the end of a test. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

/** Seed council documents (ko:kingdom:v1) and optionally the theme, then stay on "/". */
export async function seed(page: Page, docs: unknown[] = [], theme?: "dark" | "light"): Promise<void> {
  await page.goto("/");
  await page.evaluate(([key, d, t]) => {
    localStorage.setItem(key as string, JSON.stringify({ v: 1, docs: d }));
    if (t) localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t }));
  }, [KINGDOM_KEY, docs, theme] as const);
}

export async function setTheme(page: Page, theme: "dark" | "light"): Promise<void> {
  await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
}

export async function expectNoSidewaysScroll(page: Page): Promise<void> {
  await page.evaluate(() => document.querySelectorAll<HTMLDetailsElement>("#main details").forEach((d) => { d.open = true; }));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

export async function expectAxeClean(page: Page): Promise<void> {
  await page.evaluate(() => document.querySelectorAll<HTMLDetailsElement>("#main details").forEach((d) => { d.open = true; }));
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

/** Every interactive control in #main is at least 44 px tall (WCAG 2.5.8 target size, our 44 px rule). */
export async function expectTargets44(page: Page): Promise<void> {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("#main button, #main a.btn, #main select, #main input:not([type=checkbox]):not([type=radio]):not([type=file]), #main summary")]
      .filter((el) => el.offsetParent !== null && el.getBoundingClientRect().height < 44)
      .map((el) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${el.getBoundingClientRect().height}px`));
  expect(small).toEqual([]);
}

/** Go to a page and wait until every Preact island has hydrated (Astro drops the `ssr` attribute then). */
export async function gotoHydrated(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
}
