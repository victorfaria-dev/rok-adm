import { expect, test } from "@playwright/test";
import { KINGDOM_KEY, expectAxeClean, expectNoSidewaysScroll, expectTargets44, seed, trackErrors, gotoHydrated } from "./kingdom-helpers";

const DOC = { id: "r1", kind: "rules", title: "K1234 rules", updatedAt: "2026-10-13T10:00:00.000Z", data: { sections: [] } };

test.describe("council kit hub", () => {
  test("renders: one h1, guardrail, privacy note, tool links, no sideways scroll at 360px", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    const res = await page.goto("/kingdom/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("[data-guardrail]")).toContainText("No bots, no scanning");
    await expect(page.locator("[data-privacy]")).toContainText("Nothing is sent to a server");
    await expect(page.getByRole("navigation", { name: "Council kit" })).toBeVisible();
    await expect(page.getByRole("link", { name: /kingdom admin guide/i })).toHaveAttribute("href", "/guides/kingdom-admin/");
    for (const href of ["/kingdom/rules/", "/kingdom/requirements/", "/kingdom/my/", "/kingdom/mge/", "/kingdom/recruit/", "/kingdom/seed/"]) {
      await expect(page.locator(`#main .kg-tools a[href="${href}"]`)).toHaveCount(1);
    }
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("shows saved documents, exports, deletes all and imports back", async ({ page }) => {
    const errors = trackErrors(page);
    await seed(page, [DOC]);
    await gotoHydrated(page, "/kingdom/");
    await expect(page.locator("[data-counts]")).toContainText("Rules pages: 1");
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export (.json)" }).click()]);
    const path = await download.path();
    expect(download.suggestedFilename()).toMatch(/^kingdomops-council-\d{4}-\d{2}-\d{2}\.json$/);

    await page.getByRole("button", { name: "Delete all council data" }).click();
    await page.getByRole("button", { name: "Yes, delete all" }).click();
    await expect(page.getByText("No council documents saved on this device yet.")).toBeVisible();
    expect(await page.evaluate((k) => localStorage.getItem(k), KINGDOM_KEY)).toBeNull();

    await page.locator("[data-import]").setInputFiles(path!);
    await expect(page.getByRole("status").filter({ hasText: "Imported: 1 added" })).toBeVisible();
    await expect(page.locator("[data-counts]")).toContainText("Rules pages: 1");
    expect(errors).toEqual([]);
  });

  test("rejects a file that is not a council export", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/");
    await page.locator("[data-import]").setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from('{"app":"other"}') });
    await expect(page.getByRole("alert")).toContainText("not a KingdomOps council export");
  });

  for (const theme of ["dark", "light"] as const) {
    for (const state of ["empty", "filled"] as const) {
      test(`axe ${theme} ${state}`, async ({ page }) => {
        await seed(page, state === "filled" ? [DOC] : [], theme);
        await gotoHydrated(page, "/kingdom/");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("[data-controls]")).toBeVisible();
        await expectAxeClean(page);
      });
    }
  }
});
