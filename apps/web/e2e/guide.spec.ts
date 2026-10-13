import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { defaultProfile, encodeProfile, selectBlocks, type AccountProfile, type GuideBlock } from "@rokadm/core";

const here = dirname(fileURLToPath(import.meta.url));
const blocks = JSON.parse(readFileSync(join(here, "../../../guides/data/blocks.f2p.json"), "utf8")) as GuideBlock[];
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
  const expected = selectBlocks(blocks, LOW_D20);
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
