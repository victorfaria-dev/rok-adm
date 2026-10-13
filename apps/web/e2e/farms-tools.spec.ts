import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PAGES = ["/farms/choose/", "/farms/build/", "/farms/trading-post/"];

const FARM = {
  id: "e2e-farm", name: "Food Farm", role: "food", note: "",
  levels: { cityHall: 17, tradingPost: 15, goldmine: 12, academy: null, commanderLevel: null },
  gatheringUntil: null, daily: null, goal: null, createdAt: "2026-10-01T00:00:00.000Z",
};

async function seedFarm(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate((farm) => {
    localStorage.setItem("ko:farms:v1", JSON.stringify({ v: 1, farms: [farm], shipments: [], showHypotheses: false }));
  }, FARM);
}

test.describe("farm tools", () => {
  for (const route of PAGES) {
    test(`${route} renders: one h1, guardrail, no console errors, no sideways scroll at 360px`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width: 360, height: 780 });
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("[data-guardrail]")).toHaveText("Planning and bookkeeping only. You do every in-game action yourself.");
      await expect(page.getByRole("navigation", { name: "Farm hub" })).toBeVisible();
      await expect(page.locator("[data-summary]")).toHaveAttribute("aria-live", "polite");
      // Open every <details> so the reference table is measured too.
      await page.evaluate(() => document.querySelectorAll<HTMLDetailsElement>("#main details").forEach((d) => { d.open = true; }));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test("calculator works with the keyboard only", async ({ page }) => {
    await page.goto("/farms/trading-post/");
    const net = page.getByLabel("Amount your main needs (after tax)");
    await net.focus();
    await page.keyboard.type("1,000,000");
    await page.keyboard.press("Tab"); // Resource
    await page.keyboard.press("Tab"); // Trading Post level
    await expect(page.getByLabel("Farm Trading Post level")).toBeFocused();
    await page.keyboard.type("15");
    const summary = page.locator("[data-summary]");
    await expect(summary).toHaveText("Send 1,265,823 food so your main receives 1,000,000. 1 trip.");
    await expect(page.locator('[data-row="tax"] dd')).toHaveText("265,823 (21%, from table)");
    await expect(page.locator('[data-warning="capacity_counts_gross"]')).toContainText("Hypothesis, not sourced");
    // An invalid amount shows an error, never NaN.
    await net.fill("lots");
    await expect(page.locator("#tp-net-error")).toBeVisible();
    await expect(net).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#main")).not.toContainText("NaN");
    // Reference table opens from the keyboard.
    await page.locator("[data-reference] summary").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-reference] table")).toBeVisible();
  });

  test("hypothesis toggle reveals the food + wood pair and persists after reload", async ({ page }) => {
    await page.goto("/farms/choose/");
    const pair = page.locator('[data-variant="pair-food-wood"]');
    await expect(pair).toHaveCount(0);
    await page.getByLabel("Show hypotheses").check();
    await expect(pair).toBeVisible();
    await expect(pair).toContainText("No source recommends resource pairs. This is our own reasoning, pending an in-game test.");
    await page.reload();
    await expect(page.getByLabel("Show hypotheses")).toBeChecked();
    await expect(pair).toBeVisible();
  });

  test("build path loads a seeded farm from ?farm= and saves edits back", async ({ page }) => {
    await seedFarm(page);
    await page.goto(`/farms/build/?farm=${FARM.id}`);
    await expect(page.getByLabel("Farm", { exact: true })).toHaveValue(FARM.id);
    await expect(page.getByLabel("City Hall", { exact: true })).toHaveValue("17");
    await expect(page.locator("[data-summary]")).toContainText("Next step: Goldmine at the same level");
    await expect(page.locator('[data-step="ch11"] [data-step-status]')).toContainText("Done");
    await page.getByLabel("Goldmine", { exact: true }).fill("15");
    await expect(page.locator("[data-summary]")).not.toContainText("Goldmine");
    await page.getByRole("button", { name: "Save levels to Food Farm" }).click();
    await expect(page.getByRole("status")).toHaveText("Saved to Food Farm.");
    await page.reload();
    await expect(page.getByLabel("Goldmine", { exact: true })).toHaveValue("15");
  });

  test("Trading Post prefills from ?farm=", async ({ page }) => {
    await seedFarm(page);
    await page.goto(`/farms/trading-post/?farm=${FARM.id}`);
    await expect(page.getByLabel("Farm Trading Post level")).toHaveValue("15");
    await expect(page.locator("[data-prefilled]")).toHaveText("Trading Post level prefilled from Food Farm.");
  });
});

test.describe("farm tools accessibility", () => {
  for (const theme of ["dark", "light"] as const) {
    for (const route of PAGES) {
      test(`axe ${theme} ${route}`, async ({ page }) => {
        await page.goto("/");
        await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
        await page.goto(route);
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        // Fill the calculator so results and warnings are checked too; show hypotheses on the chooser.
        if (route === "/farms/trading-post/") {
          await page.getByLabel("Amount your main needs (after tax)").fill("1m");
          await page.getByLabel("Farm Trading Post level").fill("15");
          await expect(page.locator("[data-warning]").first()).toBeVisible();
        }
        if (route === "/farms/choose/") {
          await page.getByLabel("Show hypotheses").check();
          await expect(page.locator('[data-variant="pair-food-wood"]')).toBeVisible();
        }
        await page.evaluate(() => document.querySelectorAll<HTMLDetailsElement>("#main details").forEach((d) => { d.open = true; }));
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
