import { expect, test } from "@playwright/test";
import { KINGDOM_KEY, expectAxeClean, expectNoSidewaysScroll, expectTargets44, seed, trackErrors, gotoHydrated } from "./kingdom-helpers";

const SAVED = {
  id: "c1", kind: "requirements", title: "K1234 requirements", updatedAt: "2026-10-13T10:00:00.000Z",
  data: {
    kingdom: "K1234", title: "", stage: "KvK2", stageOther: "", formula: "t4 * 10 + t5 * 30 + deads * 80", presetId: "k2779-kvk2",
    requirement: { mode: "percent", bands: [{ minPower: 0, maxPower: 20_000_000, percent: 250 }, { minPower: 20_000_000, maxPower: null, percent: 400 }] },
    powerBasis: "Power at the start scan", notes: "Farms are exempt.",
    sampleAccounts: [{ id: "s1", name: "Sample A", stats: { power: 10_000_000, t4: 1_000_000, deads: 200_000 } }], compareFormula: "",
  },
};

test.describe("requirements card (F-34)", () => {
  test("renders at 360px: h1, guardrail, privacy, preset explanation, sandbox results", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    const res = await page.goto("/kingdom/requirements/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("[data-guardrail]")).toContainText("No bots, no scanning");
    await expect(page.locator("[data-privacy]")).toContainText("other players' names");
    await expect(page.getByRole("navigation", { name: "Council kit" }).getByRole("link", { name: "Requirements", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.locator('[data-explain="kr-formula"]')).toContainText("Each T4 kill = 10 points, each T5 kill = 20 points, each dead = 50 points.");
    await expect(page.locator("[data-source]")).toContainText("B08-0001, medium confidence");
    await expect(page.locator("[data-not-comparable]")).toContainText("not comparable across kingdoms");
    await expect(page.locator("[data-results] tbody tr")).toHaveCount(3);
    await expect(page.locator("[data-summary]")).toContainText("of 3 sample accounts");
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("live formula validation, presets and rule note", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/requirements/");
    const f = page.getByLabel("Formula", { exact: true });
    await f.fill("t4 * 10 + tx");
    await expect(f).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#kr-formula-error")).toHaveText("Unknown name 'tx' at character 11. Use t1–t5, deads, kp or power.");
    await expect(f).toHaveAttribute("aria-describedby", /kr-formula-error/);
    await expect(page.locator("[data-summary]")).toContainText("Formula error");
    await expect(page.locator("[data-source]")).toContainText("set by your council");
    await f.fill("max(t4, deads)");
    await expect(f).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator('[data-explain="kr-formula"]')).toContainText("not always worth the same");
    await page.getByLabel("Start from").selectOption("k2779-kvk2");
    await expect(f).toHaveValue("t4 * 10 + t5 * 30 + deads * 80");
    await expect(page.locator("[data-rule-note]")).toContainText("terrible trade");
  });

  test("bands editor validates overlap; compare shows ranking change", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/requirements/");
    await page.getByLabel("Up to power").fill("20m");
    await page.getByRole("button", { name: "Add band" }).click();
    await expect(page.locator("#kr-band-1-min")).toHaveValue("20m");
    await page.locator("#kr-band-1-min").fill("10m");
    await page.locator("#kr-band-1-pct").fill("400");
    await expect(page.locator("[data-band-issues]")).toContainText("Band 2 overlaps band 1");
    await page.locator("#kr-band-1-min").fill("20m");
    await expect(page.locator("[data-band-issues]")).toHaveCount(0);
    await page.getByLabel("Second formula").fill("deads");
    await expect(page.locator("[data-compare] tbody tr")).toHaveCount(3);
  });

  test("save, list, open and delete on this device", async ({ page }) => {
    const errors = trackErrors(page);
    await seed(page, []);
    await gotoHydrated(page, "/kingdom/requirements/");
    await expect(page.locator("[data-saved-empty]")).toBeVisible();
    await page.getByLabel("Kingdom", { exact: true }).fill("K9999");
    await page.getByRole("button", { name: "Save on this device" }).click();
    await expect(page.locator("[data-saved]")).toContainText("K9999 requirements");
    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KINGDOM_KEY);
    expect(stored.docs[0].kind).toBe("requirements");
    await page.getByRole("button", { name: "New card" }).click();
    await expect(page.getByLabel("Kingdom", { exact: true })).toHaveValue("");
    await page.getByRole("button", { name: "Open K9999 requirements" }).click();
    await expect(page.getByLabel("Kingdom", { exact: true })).toHaveValue("K9999");
    await page.getByRole("button", { name: "Delete K9999 requirements" }).click();
    await page.getByRole("button", { name: "Yes, delete" }).click();
    await expect(page.locator("[data-saved-empty]")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("keyboard flow: council builds card → publish → player opens link → enters stats → progress", async ({ page }) => {
    const errors = trackErrors(page);
    await seed(page, []);
    await gotoHydrated(page, "/kingdom/requirements/");
    await page.getByLabel("Kingdom", { exact: true }).focus();
    await page.keyboard.type("K1234");
    await page.keyboard.press("Tab"); // title
    await page.keyboard.press("Tab"); // stage
    await page.getByLabel("Start from").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Formula", { exact: true })).toBeFocused();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("t4 * 10 + t5 * 20 + deads * 50");
    await page.getByLabel("Notes and exceptions (optional)").fill("Farms are exempt.");
    await page.getByRole("button", { name: "Publish card" }).focus();
    await page.keyboard.press("Enter");
    const link = page.locator("#kr-link");
    await expect(link).toHaveValue(/\/kingdom\/my\/#d=1/);
    const url = await link.inputValue();
    expect(url).not.toContain("Sample");

    await page.goto(new URL(url).pathname + new URL(url).hash);
    await expect(page.locator("[data-card]")).toContainText("K1234");
    await expect(page.locator("[data-byline]")).toHaveText("This card was written by your council, not by KingdomOps.");
    await expect(page.locator("[data-card]")).toContainText("250% of your power as DKP");
    await expect(page.locator("[data-card]")).toContainText("Farms are exempt.");
    await page.getByLabel(/^My power/).focus();
    await page.keyboard.type("10m");
    await page.keyboard.press("Tab");
    await page.keyboard.type("500k");
    await page.keyboard.press("Tab");
    await page.keyboard.type("100,000");
    await page.keyboard.press("Tab");
    await page.keyboard.type("50k");
    await expect(page.locator("[data-summary]")).toContainText("You have 9,500,000 DKP of 25,000,000 (38%). 15,500,000 to go.");
    await expect(page.getByRole("progressbar", { name: "Progress toward my target" })).toHaveAttribute("aria-valuenow", "38");
    await expect(page.locator("[data-ways]")).toContainText("310,000 more deads or 775,000 more T5 kills or 1,550,000 more T4 kills");
    expect(errors).toEqual([]);
  });

  for (const theme of ["dark", "light"] as const) {
    for (const state of ["empty", "filled"] as const) {
      test(`axe ${theme} ${state}`, async ({ page }) => {
        await seed(page, state === "filled" ? [SAVED] : [], theme);
        await gotoHydrated(page, "/kingdom/requirements/");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        if (state === "filled") {
          await page.getByRole("button", { name: "Open K1234 requirements" }).click();
          await page.getByLabel("Second formula").fill("deads * 10");
          await page.getByRole("button", { name: "Publish card" }).click();
          await expect(page.locator("#kr-link")).toBeVisible();
        } else {
          await expect(page.locator("[data-saved-empty]")).toBeVisible();
        }
        await expectAxeClean(page);
      });
    }
  }
});
