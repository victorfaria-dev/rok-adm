import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import type { GuideBlock } from "@rokadm/core";
import { HUB_GROUPS } from "../src/lib/guides-hub";

const here = dirname(fileURLToPath(import.meta.url));
const load = (set: string) => JSON.parse(readFileSync(join(here, `../../../guides/data/blocks.${set}.json`), "utf8")) as GuideBlock[];

const GUIDES = [
  ["/guides/first-30-days/", "first30", "Seus primeiros 30 dias"],
  ["/guides/low-spender/", "low", "Guia para quem gasta pouco"],
  ["/guides/returning/", "returning", "Voltando ao jogo"],
  ["/guides/recovery/", "recovery", "Recuperação depois de ser zerado"],
  ["/guides/kingdom-admin/", "kingdomadmin", "Administração do reino"],
  ["/guides/late-game/", "latestage", "Guia do fim de jogo"],
] as const;

async function axe(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return result.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

// Guides are not a tab (owner decision, UX stage 1): guide pages mark Me, where the Guides row is.
const meTab = (page: Page) => page.locator("nav.tabs[data-nav=player]").getByRole("link", { name: "Eu", exact: true });

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const [url, set, title] of GUIDES) {
    test(`${url} is static HTML with every block, confidence and patch badges`, async ({ page }) => {
      const blocks = load(set);
      await page.goto(url);
      await expect(page.locator("h1")).toHaveText(title);
      await expect(page.locator("article[data-block-id]")).toHaveCount(blocks.length);
      const summary = page.locator("[data-confidence-summary]");
      await expect(summary).toContainText("Passos por confiança");
      const total = (await summary.locator(".g-conf-count .mono").allTextContents()).reduce((n, t) => n + Number(t), 0);
      expect(total).toBe(blocks.length);
      for (const b of blocks) {
        const article = page.locator(`article[data-block-id="${b.id}"]`);
        await expect(article.locator(`.g-tags [data-confidence="${b.confidence}"]`)).toHaveCount(1);
        await expect(article.locator(".g-patch")).toContainText(/Verificado na atualização \d+\.\d+\.\d+/);
      }
    });
  }

  test("/guides/ is one list grouped by intent with every guide, safety, zeroed and what changed", async ({ page }) => {
    await page.goto("/guides/");
    await expect(page.locator("h1")).toHaveText("Guias");
    const entries = page.locator("[data-guide-entry]");
    await expect(entries).toHaveCount(HUB_GROUPS.reduce((n, g) => n + g.items.length, 0));
    await expect(page.locator("[data-guide-group] h2")).toHaveText(HUB_GROUPS.map((g) => g.title));
    for (const href of ["/guide/", "/guides/new-kingdom/", "/guides/farms/", "/tools/safety/", "/tools/zeroed/", "/changes/", ...GUIDES.map(([u]) => u)]) {
      await expect(page.locator(`.gh-item a.gh-link[href="${href}"]`)).toHaveCount(1);
    }
    for (const r of ["food", "wood", "stone", "gold"]) await expect(page.locator(`.gh-sub a[href="/guides/farms/${r}/"]`)).toHaveCount(1);
    // No profile, no JS: everything shows, the filter stays hidden.
    await expect(page.locator("[data-guides-filter]")).toBeHidden();
  });

  test("the glossary search submits to /glossary/ without JS", async ({ page }) => {
    await page.goto("/guides/");
    await page.getByLabel("Procurar um termo").fill("MGE");
    await page.getByRole("button", { name: "Buscar no glossário" }).click();
    await expect(page).toHaveURL(/\/glossary\/\?q=MGE$/);
  });

  test("the low spender page explains it is a delta over the F2P guide", async ({ page }) => {
    await page.goto("/guides/low-spender/");
    await expect(page.locator(".g-intro")).toContainText("complemento ao plano F2P");
    await expect(page.locator(".g-intro a[href='/guide/']")).toHaveCount(1);
  });
});

test("guide pages fetch no guide payload", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(new URL(r.url()).pathname));
  await page.goto("/guides/returning/");
  await expect(page.locator("article[data-block-id]").first()).toBeVisible();
  expect(requests.filter((r) => r.startsWith("/data/"))).toEqual([]);
});

test("the returning guide uses its own chapter titles", async ({ page }) => {
  await page.goto("/guides/returning/");
  await expect(page.locator(".g-section h2").first()).toHaveText("What changed while you were away");
});

test("with a profile the hub filters to For you; All guides shows everything", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, profileCode: "1.0.0.0.12.30.....0" })));
  await page.goto("/guides/");
  const filter = page.locator("[data-guides-filter]");
  await expect(filter).toBeVisible();
  await expect(page.locator('[data-tag="kingdomadmin"]')).toBeHidden();
  await expect(page.locator('a.gh-link[href="/guide/"]')).toBeVisible();
  await filter.getByText("Todos os guias").click();
  await expect(page.locator('[data-tag="kingdomadmin"]')).toBeVisible();
  await page.goto("/glossary/?q=MGE");
  await expect(page.getByLabel("Search the glossary")).toHaveValue("MGE");
});

test.describe("guides under Me (phone)", () => {
  test.beforeEach(({ isMobile }) => test.skip(!isMobile, "the tab bar exists below 768 px only"));

  test("every guide page, the glossary and what changed sit under Me; Me's first row opens the hub", async ({ page }) => {
    for (const url of ["/guides/", "/guide/", "/guides/recovery/", "/guides/farms/food/", "/commanders/", "/glossary/", "/changes/", "/tools/safety/"]) {
      await page.goto(url);
      await expect(meTab(page), url).toHaveAttribute("aria-current", "page");
    }
    await expect(page.locator("nav.tabs[data-nav=player] li")).toHaveCount(3);
    await page.goto("/me/");
    await page.locator("ul.me-group").first().getByRole("link", { name: "Guias", exact: true }).click();
    await page.waitForURL(/\/guides\/$/);
    await expect(page.getByRole("button", { name: "More" })).toHaveCount(0);
  });

  test("fits a 360px screen", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/guides/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

for (const theme of ["dark", "light"] as const) {
  test(`axe ${theme} /guides/`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
    await page.goto("/guides/");
    expect(await axe(page)).toEqual([]);
  });
}

test("desktop: guide pages mark Me in the rail and no More button is shown", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  await page.goto("/guides/recovery/");
  const rail = page.locator("nav.rail");
  await expect(rail.getByRole("link", { name: "Eu", exact: true })).toBeVisible();
  await expect(rail.getByRole("link", { name: "Eu", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("button", { name: "More" })).toHaveCount(0);
});
