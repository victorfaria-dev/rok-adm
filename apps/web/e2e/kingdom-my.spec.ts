import { expect, test, type Page } from "@playwright/test";
import { KINGDOM_KEY, expectAxeClean, expectNoSidewaysScroll, expectTargets44, seed, trackErrors, gotoHydrated } from "./kingdom-helpers";

const CARD = {
  id: "card-1", updatedAt: "2026-10-13T10:00:00.000Z", kingdom: "K1234", title: "", stage: "KvK2", stageOther: "",
  formula: "t4 * 10 + t5 * 30 + deads * 80", presetId: "k2779-kvk2",
  requirement: { mode: "percent", bands: [{ minPower: 0, maxPower: 20_000_000, percent: 250 }, { minPower: 20_000_000, maxPower: null, percent: 400 }] },
  powerBasis: "Highest power before KvK", notes: "Farms are exempt.\nZeroed days count as 0 deads.",
};

/** Share code built in the browser with the app's own encoder (plain JSON mode: "1j" + base64url). */
function codeFor(card: unknown, kind = "requirements"): string {
  return "1j" + Buffer.from(JSON.stringify({ k: kind, d: card })).toString("base64url");
}

async function openCard(page: Page, card: unknown = CARD) {
  await page.goto(`/kingdom/my/#d=${codeFor(card)}`);
  await expect(page.locator("[data-card]")).toBeVisible();
}

test.describe("my requirements (F-30)", () => {
  test("renders at 360px with the DKP explainer and the no-link setup", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await seed(page, []);
    const res = await page.goto("/kingdom/my/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("[data-guardrail]")).toContainText("No bots, no scanning");
    await expect(page.locator("[data-explainer]")).toContainText("DKP isn't a game number: each kingdom sets its own formula");
    await expect(page.locator("[data-explainer]")).toContainText("250% of power");
    await expect(page.locator("[data-self]")).toBeVisible();
    await expect(page.locator('[data-explain="km-preset"]')).toContainText("Each T4 kill = 10 points");
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("opens a council link: card details, inputs only for used variables, progress and ways", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await openCard(page);
    const card = page.locator("[data-card]");
    await expect(card).toContainText("K1234 requirements");
    await expect(card).toContainText("KvK2");
    await expect(card).toContainText("Each T4 kill = 10 points, each T5 kill = 30 points, each dead = 80 points.");
    await expect(card).toContainText("0 to under 20,000,000 power: 250% of power");
    await expect(page.locator("[data-basis]")).toHaveText("Highest power before KvK");
    await expect(card).toContainText("Zeroed days count as 0 deads.");
    await expect(page.locator("[data-byline]")).toBeVisible();
    await expect(page.locator("#km-t4")).toBeVisible();
    await expect(page.locator("#km-t5")).toBeVisible();
    await expect(page.locator("#km-deads")).toBeVisible();
    await expect(page.locator("#km-kp")).toHaveCount(0);
    await expect(page.locator("#km-t1")).toHaveCount(0);
    await expect(page.getByLabel("My power (Highest power before KvK)")).toBeVisible();

    await page.getByLabel(/^My power/).fill("10.5m");
    await expect(page.locator("[data-summary]")).toContainText("You have 0 DKP of 26,250,000 (0%)");
    await page.locator("#km-deads").fill("300k");
    await page.locator("#km-t4").fill("abc");
    await expect(page.locator("#km-t4")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("[data-summary]")).toHaveText("Fix the highlighted fields to see your progress.");
    await page.locator("#km-t4").fill("226,000");
    await expect(page.locator("[data-summary]")).toContainText("You have 26,260,000 DKP: you meet the target of 26,250,000.");
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    await expect(page.locator("[data-ways]")).toHaveCount(0);
    await page.locator("#km-t4").fill("0");
    await expect(page.locator("[data-ways]")).toContainText("about 28,125 more deads or 75,000 more T5 kills or 225,000 more T4 kills");
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("excluded deads: rule on the card, extra input validated and subtracted before the formula", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await seed(page, []);
    await openCard(page, { ...CARD, requirement: { mode: "fixed", target: 10_000_000 }, excludedDeads: { enabled: true, label: "zeroed in a 'terrible trade'" } });
    await expect(page.locator("[data-excluded-rule]")).toHaveText("Deads on days you were zeroed in a 'terrible trade' don't count: they are taken off your deads before your DKP is worked out.");
    const ex = page.getByLabel("Deads on excluded days");
    await expect(ex).toBeVisible();
    await page.getByLabel(/^My power/).fill("10m");
    await page.locator("#km-deads").fill("100k");
    await ex.fill("150k");
    await expect(ex).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#km-excluded-deads-error")).toHaveText("This can't be more than your deads (100,000).");
    await expect(page.locator("[data-summary]")).toHaveText("Fix the highlighted fields to see your progress.");
    await ex.fill("25k");
    await expect(ex).not.toHaveAttribute("aria-invalid", "true");
    // (100,000 - 25,000) deads × 80 = 6,000,000
    await expect(page.locator("[data-summary]")).toContainText("You have 6,000,000 DKP of 10,000,000 (60%)");
    await expect(page.locator('[data-row="counted-deads"]')).toContainText("75,000");
    await page.getByRole("button", { name: "Save on this device" }).click();
    await gotoHydrated(page, "/kingdom/my/");
    await expect(page.getByLabel("Deads on excluded days")).toHaveValue("25k");
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("old links without the new fields still open (rule off, no group picker)", async ({ page }) => {
    await openCard(page);
    await expect(page.locator("[data-excluded-rule]")).toHaveCount(0);
    await expect(page.getByLabel("Deads on excluded days")).toHaveCount(0);
    await expect(page.locator("#km-group")).toHaveCount(0);
  });

  test("non-linear formula: no 'close the gap' sentence", async ({ page }) => {
    await openCard(page, { ...CARD, formula: "max(t4, deads * 10)", requirement: { mode: "fixed", target: 1000 } });
    await page.getByLabel(/^My power/).fill("1m");
    await page.locator("#km-t4").fill("10");
    await expect(page.locator("[data-summary]")).toContainText("of 1,000");
    await expect(page.locator("[data-ways]")).toHaveCount(0);
  });

  test("bad links show the share error and still offer the self setup", async ({ page }) => {
    const errors = trackErrors(page);
    await gotoHydrated(page, "/kingdom/my/#d=1jnot*valid");
    await expect(page.locator("[data-link-error]")).toHaveText("This link is damaged (some characters are missing or changed). Copy the whole link again.");
    await expect(page.locator("[data-self]")).toBeVisible();
    await page.goto(`/kingdom/my/#d=${codeFor(CARD, "rules")}`);
    await expect(page.locator("[data-link-error]")).toHaveText("This link is for a different KingdomOps tool.");
    await gotoHydrated(page, "/kingdom/my/#d=");
    await expect(page.locator("[data-link-error]")).toContainText("no document in it");
    expect(errors).toEqual([]);
  });

  test("save on this device; reopening without a hash loads the last card", async ({ page }) => {
    await seed(page, []);
    await openCard(page);
    await page.getByLabel(/^My power/).fill("10m");
    await page.locator("#km-deads").fill("1k");
    await page.getByRole("button", { name: "Save on this device" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Saved on this device" })).toBeVisible();
    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KINGDOM_KEY);
    expect(stored.docs[0].kind).toBe("my-requirements");
    await gotoHydrated(page, "/kingdom/my/");
    await expect(page.locator("[data-card]")).toContainText("K1234");
    await expect(page.getByLabel(/^My power/)).toHaveValue("10m");
    await expect(page.locator("#km-deads")).toHaveValue("1k");
  });

  test("self setup: custom formula and percent", async ({ page }) => {
    await seed(page, []);
    await gotoHydrated(page, "/kingdom/my/");
    await page.getByLabel("Formula", { exact: true }).selectOption("custom");
    const f = page.getByLabel("Your kingdom's formula");
    await f.fill("t4 *");
    await expect(f).toHaveAttribute("aria-invalid", "true");
    await f.fill("kp + deads * 5");
    await expect(page.locator("#km-kp")).toBeVisible();
    await expect(page.locator("#km-t4")).toHaveCount(0);
    await page.getByLabel("Your requirement (% of power)").fill("100");
    await page.getByLabel(/^My power/).fill("1m");
    await page.locator("#km-kp").fill("500k");
    await expect(page.locator("[data-summary]")).toContainText("You have 500,000 DKP of 1,000,000 (50%)");
    await expect(page.locator("[data-byline]")).toHaveCount(0);
  });

  for (const theme of ["dark", "light"] as const) {
    for (const state of ["empty", "filled"] as const) {
      test(`axe ${theme} ${state}`, async ({ page }) => {
        await seed(page, [], theme);
        if (state === "filled") {
          await openCard(page);
          await page.getByLabel(/^My power/).fill("10m");
          await page.locator("#km-deads").fill("100k");
          await expect(page.getByRole("progressbar")).toBeVisible();
        } else {
          await gotoHydrated(page, "/kingdom/my/");
          await expect(page.locator("[data-self]")).toBeVisible();
        }
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expectAxeClean(page);
      });
    }
  }
});
