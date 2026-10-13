import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Seed localStorage before the island reads it. */
async function seed(page: Page, store: object) {
  await page.goto("/");
  await page.evaluate((s) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: "dark", ...s })), store);
}

const verdict = (page: Page) => page.locator(".cmd-verdict-word");
const group = (page: Page, name: RegExp) => page.getByRole("group", { name });
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("ko:v1") ?? "{}"));

test("pick a commander, see suggestions, answer, reload, clear and undo", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/commanders/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByText("Nothing saved yet.", { exact: false })).toBeVisible();

  await page.getByLabel("Commander", { exact: true }).selectOption({ label: "Lohar" });
  await expect(page).toHaveURL(/#lohar$/);
  await expect(page.getByRole("heading", { level: 2, name: "Lohar" })).toBeVisible();
  await expect(page.getByText("Useful until KvK1: loses value later")).toBeVisible();
  await expect(page.getByText(/Tag as of 2026-10-13/)).toBeVisible();

  const purpose = group(page, /What job will this commander do/);
  await expect(purpose.getByText("Suggested", { exact: true })).toBeVisible();
  await expect(purpose.getByRole("radio", { name: /Barbarians/ })).toBeChecked();
  await expect(verdict(page)).toContainText("Wait");

  await group(page, /What are you about to spend/).getByText("Universal legendary (gold) sculptures").click();
  await expect(verdict(page)).toContainText("Avoid");
  await expect(page.getByText(/Never spend universal gold sculptures on gatherers/)).toBeVisible();
  expect((await stored(page)).commanders).toEqual({ lohar: { sculptureType: "universal_gold" } });

  await page.reload();
  await expect(page.getByRole("heading", { level: 2, name: "Lohar" })).toBeVisible();
  await expect(group(page, /What are you about to spend/).getByRole("radio", { name: /Universal legendary/ })).toBeChecked();
  await expect(verdict(page)).toContainText("Avoid");

  const overview = page.locator(".cmd-overview");
  const row = overview.getByRole("listitem").filter({ hasText: "Lohar" });
  await expect(row).toContainText("Avoid");
  await row.getByRole("button", { name: "Clear answers for Lohar" }).click();
  await expect(overview.getByRole("link", { name: "Lohar" })).toHaveCount(0);
  expect((await stored(page)).commanders).toEqual({});
  await expect(verdict(page)).toContainText("Wait"); // back to suggestions only
  await overview.getByRole("button", { name: "Undo" }).click();
  await expect(overview.getByRole("link", { name: "Lohar" })).toBeVisible();
  expect((await stored(page)).commanders).toEqual({ lohar: { sculptureType: "universal_gold" } });
  expect(errors).toEqual([]);
});

test("a link to a saved check opens that commander", async ({ page }) => {
  await seed(page, { commanders: { "sun-tzu": { purpose: "field_main" }, lohar: { purpose: "gatherer" } } });
  await page.goto("/commanders/#lohar");
  await expect(page.getByRole("heading", { level: 2, name: "Lohar" })).toBeVisible();
  await page.locator(".cmd-overview").getByRole("link", { name: "Sun Tzu" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Sun Tzu" })).toBeFocused();
  await expect(page.getByLabel("Commander", { exact: true })).toHaveValue("sun-tzu");
});

test("corrupted stored answers do not break the page", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seed(page, { commanders: { "sun-tzu": { purpose: "bogus", nope: 3 }, ghost: "x", lohar: ["a"] } });
  await page.goto("/commanders/#sun-tzu");
  await expect(page.getByRole("heading", { level: 2, name: "Sun Tzu" })).toBeVisible();
  await expect(verdict(page)).toHaveText(/Go|Wait|Avoid/);
  await expect(page.getByText("Nothing saved yet.", { exact: false })).toBeVisible();
  // Answering still works and only writes clean answers for that commander.
  await group(page, /Does it fill a troop type/).getByText("Yes", { exact: true }).click();
  expect((await stored(page)).commanders["sun-tzu"]).toEqual({ roleNeed: "yes" });
  expect(errors).toEqual([]);
});

test("worst case fits 360 px without sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await seed(page, { commanders: { minamoto: { purpose: "field_main" }, bertrand: { swap: "eligible" }, other: { roleNeed: "no" } } });
  for (const id of ["minamoto", "other", "cheok-jun-gyeong"]) {
    await page.goto(`/commanders/#${id}`);
    await expect(page.locator("#cmd-name")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, id).toBeLessThanOrEqual(0);
  }
  const small = await page.locator(".cmd-option, .cmd-select, .cmd-link-btn, .cmd-saved-name").evaluateAll((els) =>
    els.filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.outerHTML.slice(0, 80)),
  );
  expect(small).toEqual([]);
});

test.describe("accessibility", () => {
  for (const theme of ["dark", "light"] as const) {
    test(`axe ${theme} with a commander open and a saved check`, async ({ page }) => {
      await seed(page, { theme, commanders: { "yi-seong-gye": { sculptureType: "universal_gold" } } });
      await page.goto("/commanders/#yi-seong-gye");
      await expect(page.getByRole("heading", { level: 2, name: "Yi Seong-Gye" })).toBeVisible();
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
