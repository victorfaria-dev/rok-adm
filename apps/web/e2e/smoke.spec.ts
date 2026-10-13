import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  "/", "/start/", "/guide/", "/guides/", "/guides/new-kingdom/", "/guides/first-30-days/", "/guides/low-spender/",
  "/guides/returning/", "/guides/recovery/", "/guides/kingdom-admin/", "/routine/", "/commanders/", "/me/", "/trust/",
];
const DESTS = [["/guide/", "Guide"], ["/routine/", "Routine"], ["/commanders/", "Commanders"], ["/me/", "You"]] as const;

test.describe("every MVP route", () => {
  for (const route of ROUTES) {
    test(`${route} renders with one h1, no console errors, no sideways scroll at 360px`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width: 360, height: 780 });
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
});

test("navigation marks the current destination", async ({ page, isMobile }) => {
  const nav = isMobile ? page.locator("nav.tabs") : page.locator("nav.rail");
  for (const [href, label] of DESTS) {
    await page.goto(href);
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: label, exact: false }).first()).toHaveAttribute("aria-current", "page");
  }
});

test.describe("theme", () => {
  test("dark on first visit", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(16, 18, 20)");
  });

  test("light persists after reload, set before first paint", async ({ page, isMobile }) => {
    await page.goto("/");
    const picker = page.locator(isMobile ? "header.top [data-theme-picker]" : "nav.rail [data-theme-picker]");
    await picker.locator("summary").click();
    await picker.getByText("Light", { exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload({ waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("light");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#F4F1EC");
  });

  test("system follows the OS setting", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: "system" })));
    await page.emulateMedia({ colorScheme: "light" });
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.hasAttribute("data-theme"))).toBe(false);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(244, 241, 236)");
  });
});

test("profile chip: setup link without a profile, summary with one", async ({ page, isMobile }) => {
  const chip = page.locator(isMobile ? "header.top [data-profile-chip]" : "nav.rail [data-profile-chip]");
  await page.goto("/");
  await expect(chip).toHaveAttribute("href", "/start/");
  await page.evaluate(() => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: "dark", profileCode: "1.0.1.0.12.30.....0" })));
  await page.reload();
  await expect(chip).toHaveText("F2P · 30 min · CH 12");
  await expect(chip).toHaveAttribute("href", "/me/");
});

test("home: primary action visible without scrolling on a phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone only");
  await page.goto("/");
  const cta = page.getByRole("link", { name: "Build my guide" });
  await expect(cta).toBeInViewport();
});

test("skip link moves focus to the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("pages open offline after the first visit", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // let the worker control the page
  await context.setOffline(true);
  for (const route of ["/guide/", "/start/", "/guides/", "/guides/new-kingdom/", "/guides/recovery/"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
  await context.setOffline(false);
});

test.describe("accessibility", () => {
  for (const theme of ["dark", "light"] as const) {
    for (const route of ROUTES) {
      test(`axe ${theme} ${route}`, async ({ page }) => {
        if (route.startsWith("/guide")) test.slow(); // the full guide is ~40k px tall; axe needs more than 30 s under load
        await page.goto("/");
        await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
        await page.goto(route);
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
