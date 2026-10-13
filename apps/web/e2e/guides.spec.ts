import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import type { GuideBlock } from "@rokadm/core";

const here = dirname(fileURLToPath(import.meta.url));
const load = (set: string) => JSON.parse(readFileSync(join(here, `../../../guides/data/blocks.${set}.json`), "utf8")) as GuideBlock[];

const GUIDES = [
  ["/guides/first-30-days/", "first30", "Your first 30 days"],
  ["/guides/low-spender/", "low", "Low spender guide"],
  ["/guides/returning/", "returning", "Coming back to the game"],
  ["/guides/recovery/", "recovery", "Recovering after being zeroed"],
  ["/guides/kingdom-admin/", "kingdomadmin", "Kingdom administration"],
] as const;

async function axe(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return result.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

const moreButton = (page: Page) => page.locator("header.top").getByRole("button", { name: "More" });

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const [url, set, title] of GUIDES) {
    test(`${url} is static HTML with every block, confidence and patch badges`, async ({ page }) => {
      const blocks = load(set);
      await page.goto(url);
      await expect(page.locator("h1")).toHaveText(title);
      await expect(page.locator("article[data-block-id]")).toHaveCount(blocks.length);
      const summary = page.locator("[data-confidence-summary]");
      await expect(summary).toContainText("Steps by confidence");
      const total = (await summary.locator(".g-conf-count .mono").allTextContents()).reduce((n, t) => n + Number(t), 0);
      expect(total).toBe(blocks.length);
      for (const b of blocks) {
        const article = page.locator(`article[data-block-id="${b.id}"]`);
        await expect(article.locator(`.g-tags [data-confidence="${b.confidence}"]`)).toHaveCount(1);
        await expect(article.locator(".g-patch")).toContainText(/Verified on patch \d+\.\d+\.\d+/);
      }
    });
  }

  test("/guides/ lists every guide with who it is for", async ({ page }) => {
    await page.goto("/guides/");
    await expect(page.locator("h1")).toHaveText("All guides");
    const entries = page.locator("[data-guide-entry]");
    await expect(entries).toHaveCount(8);
    for (const href of ["/guide/", "/guides/new-kingdom/", "/guides/farms/", ...GUIDES.map(([u]) => u)]) {
      await expect(page.locator(`.gi-item h2 a[href="${href}"]`)).toHaveCount(1);
    }
    for (const entry of await entries.all()) await expect(entry.locator(".gi-for")).toContainText("For:");
  });

  test("the low spender page explains it is a delta over the F2P guide", async ({ page }) => {
    await page.goto("/guides/low-spender/");
    await expect(page.locator(".g-intro")).toContainText("delta over the F2P plan");
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

test.describe("More menu (phone)", () => {
  test.beforeEach(({ isMobile }) => test.skip(!isMobile, "the top bar exists below 1024 px only"));

  test("opens and closes with the button, Esc returns focus", async ({ page }) => {
    await page.goto("/guide/");
    const button = moreButton(page);
    const panel = page.locator("#more-panel");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toHaveAttribute("aria-controls", "more-panel");
    await expect(panel).toBeHidden();

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("link")).toHaveText(["All guides", "Farms", "Governor card", "Trust & privacy", "Brand", "Alliance crest"]);

    await page.keyboard.press("Tab");
    await expect(panel.getByRole("link", { name: "All guides" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();

    await button.click();
    await expect(panel).toBeVisible();
    await page.mouse.click(10, 600); // tap outside the menu
    await expect(panel).toBeHidden();
  });

  test("keyboard: Enter opens, Tab past the last link closes", async ({ page }) => {
    await page.goto("/");
    const button = moreButton(page);
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    for (let n = 0; n < 7; n++) await page.keyboard.press("Tab"); // one past the 6 links
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("All guides navigates to /guides/ and marks it current; the tab bar keeps 4 tabs", async ({ page }) => {
    await page.goto("/routine/");
    await moreButton(page).click();
    await page.locator("#more-panel").getByRole("link", { name: "All guides" }).click();
    await expect(page).toHaveURL(/\/guides\/$/);
    await moreButton(page).click();
    await expect(page.locator("#more-panel").getByRole("link", { name: "All guides" })).toHaveAttribute("aria-current", "page");
    await expect(page.locator("nav.tabs li")).toHaveCount(4);
  });

  test("fits a 360px screen with the menu open", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/guide/");
    await moreButton(page).click();
    await expect(page.locator("#more-panel")).toBeInViewport({ ratio: 1 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  for (const theme of ["dark", "light"] as const) {
    test(`axe ${theme} with the menu open`, async ({ page }) => {
      await page.goto("/");
      await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
      await page.goto("/guides/");
      await moreButton(page).click();
      await expect(page.locator("#more-panel")).toBeVisible();
      expect(await axe(page)).toEqual([]);
    });
  }
});

test("desktop: the rail lists All guides and no More button is shown", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  await page.goto("/guides/recovery/");
  await expect(page.locator("nav.rail").getByRole("link", { name: "All guides" })).toBeVisible();
  await expect(page.getByRole("button", { name: "More" })).toBeHidden();
});
