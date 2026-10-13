import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { defaultProfile, encodeProfile, mergeBlockSets, selectBlocks, type AccountProfile, type GuideBlock } from "@rokadm/core";

const here = dirname(fileURLToPath(import.meta.url));
const blocks = JSON.parse(readFileSync(join(here, "../../../guides/data/blocks.f2p.json"), "utf8")) as GuideBlock[];
const lowBlocks = JSON.parse(readFileSync(join(here, "../../../guides/data/blocks.low.json"), "utf8")) as GuideBlock[];
/** What the personal guide selects from: the F2P base plus the Low delta for Low and higher (core's selectGuide). */
const blocksFor = (p: AccountProfile): GuideBlock[] => (p.spending === "f2p" ? blocks : mergeBlockSets(blocks, lowBlocks));
const make = (p: Partial<AccountProfile>): AccountProfile => ({ ...defaultProfile(), ...p });
const F2P_CH12 = make({ spending: "f2p", cityHall: 12, minutesPerDay: 30 });
const LOW_D20 = make({ spending: "low", kingdomDay: 20, cityHall: 12 });
const VALID = encodeProfile(F2P_CH12);

const personal = (page: Page) => page.locator('[data-guide="personal"]');
const defaultGuide = (page: Page) => page.locator('[data-guide="default"]');

async function axe(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return result.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the default F2P guide is in the HTML, with the personalize banner and budget", async ({ page }) => {
    await page.goto("/guide/");
    await expect(page.locator("h1")).toHaveText("Your guide");
    await expect(page.getByText("Personalize in 2 minutes")).toBeVisible();
    await expect(defaultGuide(page).getByRole("link", { name: "Build my guide" })).toHaveAttribute("href", "/start/");
    const expected = selectBlocks(blocks, defaultProfile());
    await expect(defaultGuide(page).locator("article[data-block-id]")).toHaveCount(expected.meta.shownBlocks + expected.alreadyDone.length);
    await expect(page.locator("article[data-block-id]").first().getByText(/Verified on patch \d/)).toBeVisible();
    await expect(page.locator("#budget h2")).toHaveText("Budget reality check");
    await expect(page.locator("#budget table").first()).toBeAttached();
  });

  test("the new kingdom guide is static HTML with every block", async ({ page }) => {
    const nk = JSON.parse(readFileSync(join(here, "../../../guides/data/blocks.newkingdom.json"), "utf8")) as GuideBlock[];
    await page.goto("/guides/new-kingdom/");
    await expect(page.locator("article[data-block-id]")).toHaveCount(nk.length);
  });
});

test("?p=valid shows the personal guide with Recommended, without saving it", async ({ page }) => {
  await page.goto(`/guide/?p=${VALID}`);
  await expect(personal(page)).toBeVisible();
  await expect(personal(page).getByText("Recommended", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Shared profile:")).toBeVisible();
  const expected = selectBlocks(blocks, F2P_CH12);
  await expect(personal(page).locator("article[data-block-id]")).toHaveCount(expected.meta.shownBlocks + expected.alreadyDone.length);
  expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();

  await page.getByRole("button", { name: "Use this profile" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ko:v1") ?? "{}").profileCode);
  expect(saved).toBe(VALID);
});

test("Low profile: budget says what buying doesn't change, with no purchase links", async ({ page }) => {
  await page.goto(`/guide/?p=${encodeProfile(LOW_D20)}`);
  const unchanged = page.locator("#budget-unchanged");
  await expect(unchanged.getByRole("heading", { name: "What buying doesn't change" })).toBeVisible();
  await expect(page.locator("#budget a")).toHaveCount(0);
  await expect(page.locator("#budget .g-row-you")).toContainText("20");
  const expected = selectBlocks(blocksFor(LOW_D20), LOW_D20);
  await expect(personal(page).locator("article[data-block-id]")).toHaveCount(expected.meta.shownBlocks + expected.alreadyDone.length);
  const done = page.locator("#already-done > details");
  await expect(done).not.toHaveAttribute("open", "");
  await expect(done.locator("article").first()).toBeHidden();
});

test("?p=garbage shows an inline error and the default guide", async ({ page }) => {
  await page.goto("/guide/?p=garbage");
  await expect(page.getByRole("alert")).toContainText("not valid");
  await expect(defaultGuide(page)).toBeVisible();
  await expect(personal(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use this profile" })).toHaveCount(0);
});

test("share falls back to copying the link and confirms inline", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "share", { value: undefined, configurable: true });
  });
  await page.goto(`/guide/?p=${VALID}`);
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.locator(".g-live[aria-live='polite']")).toHaveText("Link copied");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(new RegExp(`/guide/\\?p=${VALID.replace(/\./g, "\\.")}$`));
});

test("KvK2+ profile: the guide falls back to KvK1 content, clearly labelled", async ({ page }) => {
  const kvk2 = make({ spending: "f2p", kingdomStage: "kvk2", cityHall: 12 });
  await page.goto(`/guide/?p=${encodeProfile(kvk2)}`);
  await expect(personal(page)).toBeVisible();
  const notice = page.locator("[data-guide-fallback]");
  await expect(notice).toContainText("Closest available: KvK1 content");
  await expect(notice).toContainText("not researched yet");
  const expected = selectBlocks(blocks, { ...kvk2, kingdomStage: "kvk1" });
  expect(expected.meta.shownBlocks).toBeGreaterThan(0);
  await expect(personal(page).locator("article[data-block-id]")).toHaveCount(expected.meta.shownBlocks + expected.alreadyDone.length);
  await expect(personal(page).locator(".g-meta")).toContainText(`${expected.meta.shownBlocks} of`);
});

test("a link to your own saved profile says 'Your profile' with no save button", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((code) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, profileCode: code })), VALID);
  await page.goto(`/guide/?p=${VALID}`);
  await expect(personal(page)).toBeVisible();
  await expect(page.getByText("Your profile:")).toBeVisible();
  await expect(page.getByText("Shared profile:")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use this profile" })).toHaveCount(0);
});

test("no sideways scroll at 360px on the personal guide", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(`/guide/?p=${encodeProfile(LOW_D20)}`);
  await expect(personal(page)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe("accessibility", () => {
  test.describe.configure({ timeout: 60_000 });
  const pages: Array<[string, string, (page: Page) => Promise<void>]> = [
    ["default guide", "/guide/", async () => {}],
    ["personal guide (Low), Already done? open", `/guide/?p=${encodeProfile(LOW_D20)}`, async (page) => {
      await expect(personal(page)).toBeVisible();
      await page.locator("#already-done > details > summary").click();
    }],
    ["invalid link", "/guide/?p=garbage", async (page) => { await expect(page.getByRole("alert")).toBeVisible(); }],
    ["new kingdom guide", "/guides/new-kingdom/", async () => {}],
  ];
  for (const theme of ["dark", "light"] as const) {
    for (const [name, url, prepare] of pages) {
      test(`axe ${theme}: ${name}`, async ({ page }) => {
        await page.goto("/");
        await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
        await page.goto(url);
        await prepare(page);
        expect(await axe(page)).toEqual([]);
      });
    }
  }
});

test.describe("guides for you", () => {
  test("a returning player sees Returning first", async ({ page }) => {
    const back = make({ spending: "f2p", returningPlayer: true, cityHall: 20 });
    await page.goto(`/guide/?p=${encodeProfile(back)}`);
    const strip = personal(page).locator("[data-guides-for-you]");
    await expect(strip.getByRole("heading", { name: "Guides for you" })).toBeVisible();
    const first = strip.locator("li").first();
    await expect(first).toHaveAttribute("data-guide-link", "returning");
    await expect(first.getByRole("link")).toHaveAttribute("href", "/guides/returning/");
    await expect(strip.getByRole("link", { name: "All guides" })).toHaveAttribute("href", "/guides/");
  });

  test("a Low profile gets the low spender steps merged in, and a link to read them alone", async ({ page }) => {
    await page.goto(`/guide/?p=${encodeProfile(LOW_D20)}`);
    await expect(personal(page).locator('article[data-block-id="low-growth-fund"]')).toHaveCount(1);
    await expect(personal(page).locator('[data-guide-link="low"] a')).toHaveAttribute("href", "/guides/low-spender/");
  });

  test("a Medium farm account sees the farm guides first; the Low page is listed as already in the guide (Q2 P2-8)", async ({ page }) => {
    const farm = make({ spending: "medium", role: "farm", returningPlayer: false, cityHall: 22, kingdomStage: "kvk1" });
    await page.goto(`/guide/?p=${encodeProfile(farm)}`);
    const strip = personal(page).locator("[data-guides-for-you]");
    const first = strip.locator("li").first();
    await expect(first).toHaveAttribute("data-guide-link", "farms");
    await expect(first.getByRole("link")).toHaveAttribute("href", "/guides/farms/");
    const low = strip.locator('[data-guide-link="low"]');
    await expect(low).toHaveAttribute("data-included", "");
    await expect(low).toContainText("Already in your guide");
    await expect(strip.getByRole("link", { name: "Low spender guide" })).toHaveCount(0);
  });

  test("an F2P profile does not load the Low delta", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(new URL(r.url()).pathname));
    await page.goto(`/guide/?p=${VALID}`);
    await expect(personal(page)).toBeVisible();
    expect(requests).not.toContain("/data/guide-low.json");
    await expect(personal(page).locator('article[data-block-id^="low-"]')).toHaveCount(0);
    await expect(personal(page).locator('[data-guide-link="low"]')).toHaveCount(0);
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    test("without a profile, the default guide lists the other guides", async ({ page }) => {
      await page.goto("/guide/");
      const strip = defaultGuide(page).locator("[data-guides-for-you]");
      await expect(strip.getByRole("heading", { name: "Other guides" })).toBeVisible();
      await expect(strip.locator("li")).toHaveCount(4);
    });
  });
});
