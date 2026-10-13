import { expect, test, type Page } from "@playwright/test";
import { KINGDOM_KEY, expectAxeClean, expectNoSidewaysScroll, expectTargets44, seed, trackErrors, gotoHydrated } from "./kingdom-helpers";

const RULES = {
  id: "r1",
  updatedAt: "2026-10-13T10:00:00.000Z",
  kingdom: "K1234",
  title: "K1234 rules",
  languageNote: "Written in English; translations are informal, the original prevails.",
  intro: "Read these first.",
  sections: [
    { id: "a", heading: "MGE policy", body: "Rotation.\n\n- Top 10 fixed\n- Others capped" },
    { id: "b", heading: "Farms & alt accounts", body: "Register farms with the council." },
  ],
  charter: { agreedOn: "2026-10-01", signers: ["Ana", "Bo"] },
  lastReviewed: "2026-10-10",
};
const DOC = { id: "r1", kind: "rules", title: "K1234 rules", updatedAt: RULES.updatedAt, data: RULES };

async function storedDocs(page: Page): Promise<Array<{ id: string; kind: string; data: Record<string, unknown> }>> {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{"docs":[]}').docs, KINGDOM_KEY);
}

/** Pseudo-random words, so the link stays long after compression. */
function noise(n: number, seedNum: number): string {
  let x = seedNum;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    out.push(x.toString(36));
  }
  return out.join(" ");
}

test.describe("rules page builder", () => {
  test("renders empty: one h1, guardrail, privacy note, 360px without sideways scroll, 44px targets", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    const res = await page.goto("/kingdom/rules/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("[data-guardrail]")).toBeVisible();
    await expect(page.locator("[data-privacy]")).toContainText("other players' names");
    await expect(page.getByText("No rules pages saved on this device yet.")).toBeVisible();
    await expect(page.getByRole("link", { name: "kingdom admin guide" })).toHaveAttribute("href", "/guides/kingdom-admin/");
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("build rules → share link → view page matches → print → make an editable copy", async ({ page, context }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await gotoHydrated(page, "/kingdom/rules/");
    await page.getByRole("button", { name: "New blank rules page" }).click();
    await expect(page.locator("[data-editor-title]")).toBeFocused();
    await expect(page).toHaveURL(/\?doc=/);

    await page.getByLabel("Kingdom", { exact: true }).fill("K1234");
    await page.getByLabel("Title", { exact: true }).fill("K1234 rules");
    await page.getByLabel("Introduction").fill("Read these first.\n\n- Be kind");

    await page.getByRole("button", { name: "Add section" }).click();
    await expect(page.getByLabel("Heading")).toBeFocused();
    await page.getByLabel("Heading").fill("MGE policy");
    await page.getByLabel("Text", { exact: true }).fill("Rotation.\n\n1. Top 10 fixed\n2. <b>Others</b> capped");

    await page.getByLabel("Add a section").selectOption("farms");
    await page.getByRole("button", { name: "Add section" }).click();
    await expect(page.locator("[data-section]")).toHaveCount(2);
    await page.getByRole("button", { name: 'Move "Farms & alt accounts" up' }).click();
    await expect(page.locator("[data-section]").first().getByLabel("Heading")).toHaveValue("Farms & alt accounts");
    await expect(page.locator("[data-prompts-left]")).toBeVisible();
    await page.locator("[data-section]").first().getByLabel("Text", { exact: true }).fill("Register farms with the council.");
    await expect(page.locator("[data-prompts-left]")).toHaveCount(0);

    await page.getByLabel("Agreed on").fill("2026-10-01");
    await page.getByLabel("Signed by").fill("Ana\nBo");
    await page.getByLabel("Last reviewed").fill("2026-10-10");
    await expect(page.locator("[data-save-status]")).toHaveText("All changes saved on this device.");
    const docs = await storedDocs(page);
    expect(docs).toHaveLength(1);
    expect(docs[0]!.kind).toBe("rules");
    expect((docs[0]!.data.charter as { signers: string[] }).signers).toEqual(["Ana", "Bo"]);

    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.locator("[data-preview] h2").first()).toHaveText("K1234 rules");
    await page.getByRole("button", { name: "Preview" }).click();

    await page.getByRole("button", { name: "Share view-only link" }).click();
    const link = await page.locator("#kq-link").inputValue();
    expect(link).toMatch(/\/kingdom\/rules\/view\/#d=1[zj]/);
    await expect(page.locator("[data-link-long]")).toHaveCount(0);
    await expect(page.locator("[data-chat-warning]")).toContainText("Never paste links in in-game chat");
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);

    // Open the link in a fresh page with no saved data (as a member would).
    const view = await context.newPage();
    const viewErrors = trackErrors(view);
    await view.goto(link);
    await expect(view.locator("h1")).toHaveText("K1234 rules");
    await expect(view.locator(".kq-doc-kingdom")).toHaveText("K1234");
    await expect(view.locator("[data-rules-doc] h2")).toHaveText(["Farms & alt accounts", "MGE policy", "Charter"]);
    await expect(view.locator(".kq-section ol li")).toHaveText(["Top 10 fixed", "<b>Others</b> capped"]);
    await expect(view.locator(".kq-section b")).toHaveCount(0);
    await expect(view.locator(".kq-doc-intro li")).toHaveText("Be kind");
    await expect(view.locator("[data-signers] li")).toHaveText(["Ana", "Bo"]);
    await expect(view.getByText("Agreed on 1 Oct 2026.")).toBeVisible();
    await expect(view.getByText("Last reviewed 10 Oct 2026")).toBeVisible();
    await expect(view.locator("[data-byline]")).toHaveText("Written by the council of K1234, not by KingdomOps.");
    await expect(view).toHaveTitle(/K1234 rules/);
    await expectNoSidewaysScroll(view);
    await expectTargets44(view);

    await view.evaluate(() => { (window as unknown as { printed: number }).printed = 0; window.print = () => { (window as unknown as { printed: number }).printed++; }; });
    await view.getByRole("button", { name: "Print or save as PDF" }).click();
    expect(await view.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);

    await view.emulateMedia({ media: "print" });
    await expect(view.locator("[data-print]")).toBeHidden();
    await expect(view.locator("nav.tabs")).toBeHidden();
    await view.emulateMedia({ media: "screen" });

    await view.getByRole("button", { name: "Make an editable copy" }).click();
    await expect(view).toHaveURL(/\/kingdom\/rules\/\?doc=/);
    await expect(view.locator("[data-editor-title]")).toHaveText("Editing: K1234 rules");
    const all = await storedDocs(view);
    expect(all).toHaveLength(2);
    expect(new Set(all.map((d) => d.id)).size).toBe(2);
    expect(errors).toEqual([]);
    expect(viewErrors).toEqual([]);
  });

  test("new kingdom charter starts with the starter sections", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/rules/");
    await page.getByRole("button", { name: "New kingdom charter" }).click();
    await expect(page.locator("[data-section]")).toHaveCount(7);
    await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Kingdom charter");
    await expect(page.locator("[data-prompts-left]")).toBeVisible();
  });

  test("opens, deletes a section with confirm, and deletes a saved page from the list", async ({ page }) => {
    const errors = trackErrors(page);
    await seed(page, [DOC]);
    await gotoHydrated(page, "/kingdom/rules/?doc=r1");
    await expect(page.locator("[data-section]")).toHaveCount(2);
    await page.getByRole("button", { name: 'Delete "MGE policy"' }).click();
    await page.getByRole("button", { name: "Yes, delete" }).click();
    await expect(page.locator("[data-section]")).toHaveCount(1);
    await expect(page.locator("[data-save-status]")).toHaveText("All changes saved on this device.");
    await page.getByRole("button", { name: "All rules pages" }).click();
    await expect(page.locator("[data-rules-item]")).toHaveCount(1);
    await page.getByRole("button", { name: "Delete K1234 rules" }).click();
    await page.getByRole("button", { name: "Yes, delete" }).click();
    await expect(page.getByText("No rules pages saved on this device yet.")).toBeVisible();
    expect(await storedDocs(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("unknown ?doc= shows a message", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/rules/?doc=missing");
    await expect(page.getByRole("alert")).toContainText("not saved on this device");
  });

  test("warns when the link is too long for one Discord message", async ({ page }) => {
    const big = { ...RULES, sections: Array.from({ length: 6 }, (_, i) => ({ id: `n${i}`, heading: `Part ${i}`, body: noise(300, i + 7) })) };
    await seed(page, [{ ...DOC, data: big }]);
    await gotoHydrated(page, "/kingdom/rules/?doc=r1");
    await page.getByRole("button", { name: "Share view-only link" }).click();
    await expect(page.locator("[data-link-long]")).toContainText("Discord cuts messages at 2,000 characters");
  });

  for (const theme of ["dark", "light"] as const) {
    for (const state of ["empty", "filled"] as const) {
      test(`axe builder ${theme} ${state}`, async ({ page }) => {
        await seed(page, state === "filled" ? [DOC] : [], theme);
        await gotoHydrated(page, state === "filled" ? "/kingdom/rules/?doc=r1" : "/kingdom/rules/");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator(state === "filled" ? "[data-rules-editor]" : "[data-rules-list]")).toBeVisible();
        await expectAxeClean(page);
        if (state === "filled") {
          await page.getByRole("button", { name: "Share view-only link" }).click();
          await expect(page.locator("#kq-link")).toBeVisible();
          await page.getByRole("button", { name: "Preview" }).click();
          await expect(page.locator("[data-preview]")).toBeVisible();
          await expectAxeClean(page);
        }
      });
    }
  }
});

test.describe("rules view page", () => {
  async function viewLink(page: Page): Promise<string> {
    await seed(page, [DOC]);
    await gotoHydrated(page, "/kingdom/rules/?doc=r1");
    await page.getByRole("button", { name: "Share view-only link" }).click();
    return page.locator("#kq-link").inputValue();
  }

  test("static HTML shows a loading line before the link is decoded", async ({ request }) => {
    const html = await (await request.get("/kingdom/rules/view/")).text();
    expect(html).toContain("Loading the rules…");
  });

  test("a corrupted link shows the error and a way back", async ({ page }) => {
    const errors = trackErrors(page);
    await gotoHydrated(page, "/kingdom/rules/view/#d=1zAB$$broken");
    await expect(page.locator("h1")).toHaveText("This rules link cannot be opened");
    await expect(page.getByRole("alert")).toContainText("This link is damaged");
    await expect(page.getByRole("link", { name: "Go to the rules page builder" })).toHaveAttribute("href", "/kingdom/rules/");
    await gotoHydrated(page, "/kingdom/rules/view/");
    await expect(page.getByRole("alert")).toContainText("This link has no document in it");
    expect(errors).toEqual([]);
  });

  for (const theme of ["dark", "light"] as const) {
    test(`axe view ${theme} (rules and error)`, async ({ page }) => {
      const link = await viewLink(page);
      await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
      await gotoHydrated(page, link);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("[data-rules-doc]")).toBeVisible();
      await expectAxeClean(page);
      await gotoHydrated(page, "/kingdom/rules/view/#d=9xx");
      await expect(page.locator("[data-share-error]")).toBeVisible();
      await expectAxeClean(page);
    });
  }
});
