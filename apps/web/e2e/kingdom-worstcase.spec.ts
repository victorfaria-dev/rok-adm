// Worst-case text (long names with no spaces) at 360px on every council page: no sideways scroll.
import { expect, test } from "@playwright/test";
import { expectNoSidewaysScroll, gotoHydrated, seed } from "./kingdom-helpers";

const LONG = (n: number) => "K".repeat(n);
const T = "2026-10-13T10:00:00.000Z";
/** Plain (uncompressed) share fragment, the same format encodeShare writes as "1j". */
const share = (kind: string, d: unknown) => `1j${Buffer.from(JSON.stringify({ k: kind, d })).toString("base64url")}`;

const rules = {
  id: "r1", updatedAt: T, kingdom: LONG(40), title: LONG(80), languageNote: LONG(200), intro: LONG(500),
  sections: [{ id: "a", heading: LONG(80), body: `${LONG(600)}\n\n- ${LONG(300)}\n1. ${LONG(300)}` }],
  charter: { agreedOn: "2026-10-01", signers: [LONG(40), LONG(40)] }, lastReviewed: "2026-10-10",
};
const cand = (i: number) => ({ id: `c${i}`, name: `${LONG(36)}${String(i).padStart(3, "0")}`, score: 1_000_000 * i, tags: [] });
const mge = {
  id: "p1", updatedAt: T, title: LONG(80), slotsPerEvent: 3, policy: "rotation", cooldownEvents: 0, applicationsRequired: false,
  candidates: [1, 2, 3, 4].map(cand),
  events: [{ id: "e1", date: "2026-10-01", commander: LONG(40), applicants: [], overrides: [], locked: false, result: null }],
};
const recruit = {
  kingdom: LONG(40), stage: "kvk2", stageOther: "", seed: LONG(40), languages: LONG(80), timezones: LONG(80), minPower: "30m", minCityHall: "25",
  otherReq: LONG(300), offers: ["mge-rules"], roles: [{ role: "other", count: 1, note: LONG(120) }], migrationNote: LONG(300), contact: LONG(120),
};

test.describe("council kit worst-case text at 360px", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await seed(page, [
      { id: "r1", kind: "rules", title: LONG(80), updatedAt: T, data: rules },
      { id: "p1", kind: "mge", title: LONG(80), updatedAt: T, data: mge },
      { id: "d1", kind: "recruit", title: LONG(80), updatedAt: T, data: recruit },
    ]);
  });

  for (const route of ["/kingdom/", "/kingdom/rules/?doc=r1", "/kingdom/mge/", "/kingdom/recruit/", "/kingdom/requirements/", "/kingdom/my/", "/kingdom/seed/"]) {
    test(`${route}`, async ({ page }) => {
      await gotoHydrated(page, route);
      await expect(page.locator("h1")).toHaveCount(1);
      await expectNoSidewaysScroll(page);
    });
  }

  test("rules view with long text", async ({ page }) => {
    await gotoHydrated(page, `/kingdom/rules/view/#d=${share("rules", rules)}`);
    await expect(page.locator("h1")).toContainText("KKKK");
    await expectNoSidewaysScroll(page);
  });

  test("MGE view with long text", async ({ page }) => {
    const pub = {
      title: LONG(80), policy: "rotation", slotsPerEvent: 3, cooldownEvents: 0, applicationsRequired: false, publishedOn: "2026-10-13",
      events: [{ date: "2026-10-01", commander: LONG(40), locked: false, slots: [1, 2, 3].map((s) => ({ slot: s, name: cand(s).name, reason: LONG(200) })), unfilled: [] }],
    };
    await gotoHydrated(page, `/kingdom/mge/view/#d=${share("mge", pub)}`);
    await expect(page.locator("[data-view-title]")).toContainText("KKKK");
    await expect(page.locator(`table[data-ledger="2026-10-01"] tbody tr`)).toHaveCount(3);
    await expectNoSidewaysScroll(page);
  });
});

test("focus stays on the page after a confirmed delete (keyboard)", async ({ page }) => {
  await seed(page, [{ id: "r1", kind: "rules", title: "Regras do K1", updatedAt: T, data: { ...rules, title: "Regras do K1", sections: [{ id: "a", heading: "First", body: "x" }, { id: "b", heading: "Second", body: "y" }] } }]);
  await gotoHydrated(page, "/kingdom/rules/?doc=r1");
  await page.getByRole("button", { name: "Apagar \"First\"" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Sim, apagar" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Apagar \"Second\"" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
});
