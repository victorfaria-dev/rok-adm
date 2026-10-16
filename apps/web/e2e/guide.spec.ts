import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { defaultProfile, encodeProfile, mergeBlockSets, selectBlocks, type AccountProfile, type GuideBlock } from "@rokadm/core";
import type { GuidePayload, PayloadBlock } from "../src/lib/guide-types";
import { selectGuideWithFallback } from "../src/lib/guide-view";

const here = dirname(fileURLToPath(import.meta.url));
const blocks = JSON.parse(readFileSync(join(here, "../../../guides/data/blocks.f2p.json"), "utf8")) as GuideBlock[];
const lowBlocks = JSON.parse(readFileSync(join(here, "../../../guides/data/blocks.low.json"), "utf8")) as GuideBlock[];
const lateBlocks = JSON.parse(readFileSync(join(here, "../../../guides/data/blocks.latestage.json"), "utf8")) as GuideBlock[];
/** Raw blocks in the payload shape selectGuideWithFallback reads (it only looks at the block fields). */
const asPayload = (b: GuideBlock[]): GuidePayload => ({ v: 1, set: "x", blocks: b as PayloadBlock[], badges: {} });
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
    await expect(page.locator("h1")).toHaveText("Seu guia");
    await expect(page.getByText("Personalize em 2 minutos")).toBeVisible();
    await expect(defaultGuide(page).getByRole("link", { name: "Montar meu guia" })).toHaveAttribute("href", "/start/");
    const expected = selectBlocks(blocks, defaultProfile());
    await expect(defaultGuide(page).locator("article[data-block-id]")).toHaveCount(expected.meta.shownBlocks + expected.alreadyDone.length);
    await expect(page.locator("article[data-block-id]").first().getByText(/Verificado na atualização \d/)).toBeVisible();
    await expect(page.locator("#budget h2")).toHaveText("Teste de realidade do orçamento");
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
  await expect(personal(page).getByText("Recomendado", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Perfil compartilhado:")).toBeVisible();
  const expected = selectBlocks(blocks, F2P_CH12);
  await expect(personal(page).locator("article[data-block-id]")).toHaveCount(expected.meta.shownBlocks + expected.alreadyDone.length);
  expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();

  await page.getByRole("button", { name: "Usar este perfil" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Salvo" })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ko:v1") ?? "{}").profileCode);
  expect(saved).toBe(VALID);
});

test("Low profile: budget says what buying doesn't change, with no purchase links", async ({ page }) => {
  await page.goto(`/guide/?p=${encodeProfile(LOW_D20)}`);
  const unchanged = page.locator("#budget-unchanged");
  await expect(unchanged.getByRole("heading", { name: "O que comprar não muda" })).toBeVisible();
  // The only link is our own pack value calculator: nothing points to a store.
  await expect(page.locator("#budget-low")).toBeVisible();
  const hrefs = await page.locator("#budget a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs).toEqual(["/tools/pack-value/"]);
  await expect(page.locator("#budget .g-row-you")).toContainText("20");
  const expected = selectBlocks(blocksFor(LOW_D20), LOW_D20);
  await expect(personal(page).locator("article[data-block-id]")).toHaveCount(expected.meta.shownBlocks + expected.alreadyDone.length);
  const done = page.locator("#already-done > details");
  await expect(done).not.toHaveAttribute("open", "");
  await expect(done.locator("article").first()).toBeHidden();
});

test("Low profile: Low spender targets, with tiers, per-dollar caveat, price warnings, confidence and fact ids", async ({ page }) => {
  await page.goto(`/guide/?p=${encodeProfile(LOW_D20)}#budget`);
  const low = page.locator("#budget-low");
  await expect(low.getByRole("heading", { name: "Metas para quem gasta pouco" })).toBeVisible();
  await expect(low.locator("[data-low-tier='pass-only'] h4")).toContainText("Só passes");
  await expect(low.locator("[data-low-tier='low-full'] h4")).toContainText("orçamento mais completo");
  await expect(low.locator("#budget-low-method")).toContainText("Só gemas e pontos de VIP brutos por dólar");
  await expect(low.locator("[data-low-purchase='gem-supply-30d']").first()).toContainText("1.952");
  // Every line with a price carries the regional warning; every purchase row has confidence and fact ids.
  for (const item of await low.locator("[data-low-purchase]").all()) {
    await expect(item.locator("[data-price-warning]")).toHaveCount(1);
    await expect(item.locator("[data-confidence]").first()).toBeAttached();
    await expect(item.locator(".g-facts .mono").first()).toBeAttached();
  }
  await expect(low.locator("[data-low-outside] [data-low-purchase='daily-special-offers']")).toHaveCount(1);
  await expect(low.locator("table")).toBeAttached();
  // The F2P numbers below stay labelled as the F2P baseline, never as Low's.
  await expect(page.locator("#budget [data-f2p-baseline]")).toContainText("base F2P");
  await expect(page.locator("#budget h3", { hasText: "(base F2P)" }).first()).toBeVisible();
});

test("F2P and Medium profiles never get the Low targets payload", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(new URL(r.url()).pathname));
  for (const p of [F2P_CH12, make({ spending: "medium", cityHall: 20 })]) {
    await page.goto(`/guide/?p=${encodeProfile(p)}#budget`);
    await expect(page.locator("#budget")).toBeAttached();
    await expect(page.locator("#budget-low")).toHaveCount(0);
  }
  expect(requests).not.toContain("/data/guide-low-budget.json");
});

test("the personal guide renders in steps after idle, and a #section link renders it all at once (Q2 P2-10)", async ({ page }) => {
  const expected = selectBlocks(blocksFor(LOW_D20), LOW_D20);
  const all = expected.meta.shownBlocks + expected.alreadyDone.length;
  // Count the blocks in the first frame the personal guide appears: only the first steps are there.
  await page.goto(`/guide/?p=${encodeProfile(LOW_D20)}`);
  const first = await page.waitForFunction(() => {
    const n = document.querySelectorAll('[data-guide="personal"] article[data-block-id]').length;
    return n > 0 ? n : null;
  });
  expect(await first.jsonValue()).toBeLessThan(all);
  await expect(personal(page).locator("article[data-block-id]")).toHaveCount(all);
  await expect(page.locator("#budget")).toBeAttached();
  // Below-the-fold sections skip rendering until near the viewport.
  expect(await page.locator(".g-section").nth(1).evaluate((el) => getComputedStyle(el).contentVisibility)).toBe("auto");

  await page.goto(`/guide/?p=${encodeProfile(LOW_D20)}#budget`);
  await expect(page.locator("#budget")).toBeAttached();
  await expect(personal(page).locator("article[data-block-id]")).toHaveCount(all);
});

test("?p=garbage shows an inline error and the default guide", async ({ page }) => {
  await page.goto("/guide/?p=garbage");
  await expect(page.getByRole("alert")).toContainText("não é válido");
  await expect(defaultGuide(page)).toBeVisible();
  await expect(personal(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Usar este perfil" })).toHaveCount(0);
});

test("share falls back to copying the link and confirms inline", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "share", { value: undefined, configurable: true });
  });
  await page.goto(`/guide/?p=${VALID}`);
  await page.getByRole("button", { name: "Compartilhar" }).click();
  await expect(page.locator(".g-live[aria-live='polite']")).toHaveText("Link copiado");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(new RegExp(`/guide/\\?p=${VALID.replace(/\./g, "\\.")}$`));
});

test("KvK2+ profile: the late-game plan is the main content; KvK1 only labels the sections still without late steps", async ({ page }) => {
  const kvk2 = make({ spending: "f2p", kingdomStage: "kvk2", cityHall: 25, minutesPerDay: 120 });
  await page.goto(`/guide/?p=${encodeProfile(kvk2)}`);
  await expect(personal(page)).toBeVisible();
  await expect(page.locator("[data-guide-late]")).toContainText("Seu plano para KvK2");
  await expect(page.locator("[data-guide-late] a")).toHaveAttribute("href", "/guides/late-game/");
  await expect(page.locator("[data-guide-fallback]")).toHaveCount(0);
  const sel = selectGuideWithFallback(asPayload(blocks), kvk2, asPayload(lateBlocks));
  expect(sel.lateStage).toBe(true);
  expect(sel.fallbackSections.length).toBeGreaterThan(0);
  const articles = personal(page).locator("article[data-block-id]");
  await expect(articles).toHaveCount(sel.view.meta.shownBlocks + sel.view.alreadyDone.length);
  await expect(personal(page).locator('article[data-block-id="ls-t5-is-a-research-project"]')).toHaveCount(1);
  await expect(personal(page).locator('article[data-block-id="daily-15min"]')).toHaveCount(1);
  await expect(personal(page).locator('article[data-block-id^="d4-"]')).toHaveCount(0);
  // The KvK1 notice sits only in the sections that still lack late-stage steps.
  const marked = personal(page).locator("[data-section-fallback]");
  await expect(marked).toHaveCount(sel.fallbackSections.length);
  await expect(marked.first()).toContainText("O mais próximo disponível: conteúdo do KvK1");
  for (const id of sel.fallbackSections) await expect(personal(page).locator(`#s-${id} [data-section-fallback]`)).toHaveCount(1);
  await expect(personal(page).locator("#s-plan [data-section-fallback]")).toHaveCount(0);
  const first = personal(page).locator("[data-guides-for-you] li").first();
  await expect(first).toHaveAttribute("data-guide-link", "latestage");
});

test("KvK2+ profile: if the late-game guide fails to load, the whole guide falls back to KvK1, labelled", async ({ page }) => {
  await page.route("**/data/guide-latestage.json", (r) => r.abort());
  const soc = make({ spending: "f2p", kingdomStage: "soc", cityHall: 12 });
  await page.goto(`/guide/?p=${encodeProfile(soc)}`);
  await expect(personal(page)).toBeVisible();
  const notice = page.locator("[data-guide-fallback]");
  await expect(notice).toContainText("O mais próximo disponível: conteúdo do KvK1");
  const expected = selectBlocks(blocks, { ...soc, kingdomStage: "kvk1" });
  await expect(personal(page).locator("article[data-block-id]")).toHaveCount(expected.meta.shownBlocks + expected.alreadyDone.length);
  await expect(page.locator("[data-guide-late]")).toHaveCount(0);
});

test("a link to your own saved profile says 'Your profile' with no save button", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((code) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, profileCode: code })), VALID);
  await page.goto(`/guide/?p=${VALID}`);
  await expect(personal(page)).toBeVisible();
  await expect(page.getByText("Seu perfil:")).toBeVisible();
  await expect(page.getByText("Perfil compartilhado:")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Usar este perfil" })).toHaveCount(0);
});

test("no sideways scroll at 360px on the personal guide", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(`/guide/?p=${encodeProfile(LOW_D20)}`);
  await expect(personal(page)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe("accessibility", () => {
  // Wave VG: the personal guide also carries the timeline, calendar and tower; axe needs longer under load.
  test.describe.configure({ timeout: 120_000 });
  const pages: Array<[string, string, (page: Page) => Promise<void>]> = [
    ["default guide", "/guide/", async () => {}],
    ["personal guide (Low), Already done? open", `/guide/?p=${encodeProfile(LOW_D20)}`, async (page) => {
      await expect(personal(page)).toBeVisible();
      await page.locator("#already-done > details > summary").click();
    }],
    ["invalid link", "/guide/?p=garbage", async (page) => { await expect(page.getByRole("alert")).toBeVisible(); }],
    ["personal guide (KvK3), late-game plan", `/guide/?p=${encodeProfile(make({ spending: "f2p", kingdomStage: "kvk3", cityHall: 25 }))}`, async (page) => {
      await expect(page.locator("[data-guide-late]")).toBeVisible();
      await expect(page.locator("[data-section-fallback]").first()).toBeAttached();
    }],
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
    await expect(strip.getByRole("heading", { name: "Guias para você" })).toBeVisible();
    const first = strip.locator("li").first();
    await expect(first).toHaveAttribute("data-guide-link", "returning");
    await expect(first.getByRole("link")).toHaveAttribute("href", "/guides/returning/");
    await expect(strip.getByRole("link", { name: "Todos os guias" })).toHaveAttribute("href", "/guides/");
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
    await expect(low).toHaveAttribute("data-included", "true");
    await expect(low).toContainText("Já está no seu guia");
    await expect(strip.getByRole("link", { name: "Guia para quem gasta pouco" })).toHaveCount(0);
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
      await expect(strip.getByRole("heading", { name: "Outros guias" })).toBeVisible();
      await expect(strip.locator("li")).toHaveCount(4);
    });
  });
});
