import { expect, test } from "@playwright/test";
import { KINGDOM_KEY, expectAxeClean, expectNoSidewaysScroll, expectTargets44, seed, trackErrors, gotoHydrated } from "./kingdom-helpers";

const M = 1e6;
/** Marginal bands of B08-0008, recomputed here independently of the app code. */
const counted = (p: number) => Math.min(p, 150 * M) + 0.8 * Math.max(0, Math.min(p, 300 * M) - 150 * M) + 0.5 * Math.max(0, Math.min(p, 500 * M) - 300 * M);
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const SIM = {
  id: "s1", kind: "seed", title: "Before SoC", updatedAt: "2026-10-13T10:00:00.000Z",
  data: { id: "s1", title: "Before SoC", mode: "list", listText: "Alpha, 600m\nBravo, 400m\nCharlie, 200m\nDelta, 100m", quick: {}, whatIf: { vacation: [], zeroed: {} } },
};

test.describe("seed simulator", () => {
  test("renders experimental badge, freshness warning, assumptions and sources", async ({ page }) => {
    const errors = trackErrors(page);
    await gotoHydrated(page, "/kingdom/seed/");
    await expect(page.locator("h1")).toHaveText("Seed simulator");
    await expect(page.locator("[data-experimental].kg-badge")).toHaveText("Experimental");
    await expect(page.locator("[data-freshness]")).toContainText("Last verified for patch 1.0.95; check date passed, may be outdated.");
    await expect(page.locator("[data-assumptions] li")).toHaveCount(8);
    await expect(page.locator("[data-assumptions]")).toContainText("L-B03-03");
    await expect(page.locator("[data-sources]")).toContainText("B08-0008 (confidence: high)");
    await expect(page.locator("[data-privacy]")).toHaveCount(0); // UX stage 1: shown once, on the Kingdom overview
    await expect(page.locator("[data-summary]")).toHaveText("No governors entered yet.");
    expect(errors).toEqual([]);
  });

  test("305 pasted powers: only the top 300 count", async ({ page }) => {
    const errors = trackErrors(page);
    await gotoHydrated(page, "/kingdom/seed/");
    const powers = Array.from({ length: 305 }, (_, i) => (i + 1) * M);
    await page.getByLabel("Governor powers, one per line").fill(powers.map((p) => `${p / M}m`).join("\n"));
    const expected = powers.slice(5).reduce((s, p) => s + counted(p), 0);
    await expect(page.locator("[data-counted]")).toContainText(fmt(expected));
    await expect(page.locator("[data-ignored]")).toContainText("5 governors, 15M");
    await expect(page.locator("[data-summary]")).toContainText("from the top 300 of 305 governors");
    await expect(page.locator("[data-summary]")).toContainText("5 governors are below the top 300 and not counted.");
    expect(errors).toEqual([]);
  });

  test("band breakdown for a known input, saved locally, and what-if marks", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/seed/");
    await page.getByLabel("Governor powers, one per line").fill("Alpha, 600m\nBravo, 400m\nCharlie, 200,000,000\n100000000\nnot a number");
    await expect(page.locator("[data-line-errors]")).toContainText("Line 5");
    const band = (k: string) => page.locator(`[data-band="${k}"] td`).allTextContents();
    expect(await band("0-150M")).toEqual(["100%", fmt(550 * M), fmt(550 * M)]);
    expect(await band("150-300M")).toEqual(["80%", fmt(350 * M), fmt(280 * M)]);
    expect(await band("300-500M")).toEqual(["50%", fmt(300 * M), fmt(150 * M)]);
    expect(await band(">500M")).toEqual(["0%", fmt(100 * M), "0"]);
    await expect(page.locator("[data-counted]")).toContainText(fmt(980 * M));
    await expect(page.locator("[data-thresholds]")).toContainText("Above 150M: 3 governors");
    await expect(page.locator("[data-thresholds]")).toContainText("Above 500M: 1");
    await expect(page.locator("[data-summary]")).toContainText("below the Imperium threshold (23.5B)");

    await page.getByText(/Mark governors/).click();
    await page.getByLabel("Vacation Permit for #1 Alpha").check();
    await expect(page.locator("[data-delta]")).toHaveText("−370M");
    await page.getByLabel("Power after zeroing for #3 Charlie").fill("50m");
    await expect(page.locator("[data-after]")).toHaveText("470M"); // 980 − 370 (Alpha) − 140 (Charlie 190 → 50)
    await expect(page.locator("[data-summary]")).toContainText("counted power drops by 510M to 470M");
    await page.getByLabel("Power after zeroing for #2 Bravo").fill("900m");
    await expect(page.locator("#ks-zero-L2-error")).toContainText("Enter a power below 400M");

    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "{}"), KINGDOM_KEY);
    expect(stored.docs[0].kind).toBe("seed");
    expect(stored.docs[0].data.whatIf).toEqual({ vacation: ["L1"], zeroed: { L3: 50_000_000 } });
    await page.reload();
    await expect(page.locator("[data-saved]")).toContainText("Seed simulation");
    await expect(page.locator("[data-after]")).toHaveText("470M");
  });

  test("quick mode: counts per band", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/seed/");
    // The select is server-rendered: retry until the island has hydrated and shows the quick fields.
    await expect(async () => {
      await page.getByLabel("How to enter powers").selectOption("quick");
      await expect(page.locator("#ks-q-0150M-count")).toBeVisible({ timeout: 1000 });
    }).toPass();
    await page.locator("#ks-q-0150M-count").fill("100");
    await page.locator("#ks-q-0150M-avg").fill("100m");
    await page.locator("#ks-q-500M-count").fill("2");
    await expect(page.locator("[data-counted]")).toContainText(fmt(100 * 100 * M + 2 * 370 * M));
    await page.locator("#ks-q-150300M-avg").fill("10m");
    await expect(page.locator("#ks-q-150300M-avg-error")).toContainText("inside this band");
  });

  test("360px: no sideways scroll, 44px targets (filled)", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await seed(page, [SIM]);
    await gotoHydrated(page, "/kingdom/seed/");
    await expect(page.locator("[data-counted]")).toContainText(fmt(980 * M));
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
  });

  for (const theme of ["dark", "light"] as const) {
    for (const state of ["empty", "filled"] as const) {
      test(`axe ${theme} ${state}`, async ({ page }) => {
        await seed(page, state === "filled" ? [SIM] : [], theme);
        await gotoHydrated(page, "/kingdom/seed/");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("[data-seed]")).toBeVisible();
        if (state === "filled") await expect(page.locator("[data-whatif-result]")).toBeVisible();
        await expectAxeClean(page);
      });
    }
  }
});
