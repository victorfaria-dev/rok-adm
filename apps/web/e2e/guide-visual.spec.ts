// Wave VG: the visual guide. Scroll timeline (nodes per step, keyboard, reveal, reduced motion), the
// kingdom-day calendar (dated cards only, pending otherwise), the progress tower and its lazy 3D view.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { defaultProfile, encodeProfile, selectBlocks, type AccountProfile, type GuideBlock } from "@rokadm/core";

const here = dirname(fileURLToPath(import.meta.url));
const load = (set: string) => JSON.parse(readFileSync(join(here, `../../../guides/data/blocks.${set}.json`), "utf8")) as GuideBlock[];
const f2p = load("f2p");
const make = (p: Partial<AccountProfile>): AccountProfile => ({ ...defaultProfile(), ...p });
const F2P_D20 = make({ spending: "f2p", kingdomDay: 20, cityHall: 12, minutesPerDay: 30 });
const URL_D20 = `/guide/?p=${encodeProfile(F2P_D20)}`;

// Routes (3D chunk failure) must reach the page, not the service worker cache.
test.use({ serviceWorkers: "block" });

const timeline = (page: Page) => page.locator("[data-timeline]").first();
const summaries = (page: Page) => timeline(page).locator(".tl-node > details > summary, .tl-fold > summary").filter({ visible: true });

async function axe(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return result.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

/** The personal timeline is built when its place nears the viewport: scroll there, wait, back to the top. */
async function timelineReady(page: Page) {
  await expect(async () => {
    await page.evaluate(() => document.querySelector("[data-tl-sentinel]")?.scrollIntoView());
    await expect(page.locator('[data-guide="personal"] [data-timeline][data-enhanced]')).toBeAttached({ timeout: 1000 });
  }).toPass();
  await page.evaluate(() => scrollTo(0, 0));
}

async function personal(page: Page, url = URL_D20) {
  await page.goto(url);
  await timelineReady(page);
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("/guide/: timeline, calendar and tower are static HTML; the full list stays below", async ({ page }) => {
    await page.goto("/guide/");
    const expected = selectBlocks(f2p, defaultProfile());
    const all = expected.meta.shownBlocks + expected.alreadyDone.length;
    await expect(timeline(page).locator(".tl-node")).toHaveCount(all);
    await expect(page.locator("article[data-block-id]")).toHaveCount(all);
    // Nodes open natively (details): gist, confidence, sources, Read more.
    const first = timeline(page).locator(".tl-node").first();
    await first.locator("summary").click();
    await expect(first.locator(".tl-gist")).toBeVisible();
    await expect(first.locator(".tl-meta")).toContainText("Fontes:");
    await expect(first.locator("a.tl-more")).toHaveAttribute("href", /^#b-/);
    // No reveal without JS: every node is visible as rendered.
    await expect(timeline(page)).not.toHaveAttribute("data-reveal", "");
    await expect(page.locator("[data-calendar] [data-milestone='kvk1'] .cal-day")).toHaveText("Dia ~100");
    await expect(page.locator("[data-calendar] .cal-pending summary")).toContainText("Pendentes");
    await expect(page.locator("[data-tower-svg]")).toBeVisible();
    await expect(page.locator("[data-tower-toggle]")).toBeHidden();
    await expect(page.locator("[data-you-are-here]")).toHaveCount(0);
  });

  test("static guides with dated phases get a timeline; the rest keep the plain list", async ({ page }) => {
    for (const [url, set] of [["/guides/first-30-days/", "first30"], ["/guides/new-kingdom/", "newkingdom"], ["/guides/low-spender/", "low"]] as const) {
      await page.goto(url);
      await expect(page.locator("[data-timeline] .tl-node"), url).toHaveCount(load(set).length);
      await expect(page.locator("article[data-block-id]"), url).toHaveCount(load(set).length);
      await expect(page.locator("[data-calendar]"), url).toHaveCount(0);
    }
    for (const url of ["/guides/kingdom-admin/", "/guides/late-game/", "/guides/recovery/"]) {
      await page.goto(url);
      await expect(page.locator("[data-timeline]"), url).toHaveCount(0);
    }
  });
});

test("why, sources and uncertain notes are folded per step; confidence and patch stay visible", async ({ page }) => {
  await page.goto("/guide/");
  const block = page.locator("article[data-block-id]").first();
  await expect(block.locator(".g-tags [data-confidence]")).toBeVisible();
  await expect(block.locator(".g-patch")).toBeVisible();
  const more = block.locator("details[data-block-more]");
  await expect(more).not.toHaveAttribute("open", "");
  await expect(more.locator("summary")).toContainText("Fontes:");
  await expect(more.locator(".g-note-label").first()).toBeHidden();
  await more.locator("summary").click();
  await expect(more.locator(".g-note-label", { hasText: "Por quê" })).toBeVisible();
});

test("keyboard: arrows move between steps, Enter opens one, Read more lands on the full step", async ({ page }) => {
  await personal(page);
  const s = summaries(page);
  await s.first().focus();
  await page.keyboard.press("ArrowDown");
  await expect(s.nth(1)).toBeFocused();
  await page.keyboard.press("End");
  await expect(s.last()).toBeFocused();
  await page.keyboard.press("Home");
  await expect(s.first()).toBeFocused();
  // Move to a step in the current phase (not folded) and open it.
  const node = timeline(page).locator("[data-lane='day15-40'] .tl-node").first();
  await node.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(node.locator(".tl-card")).toBeVisible();
  await expect(node.locator("summary [data-confidence]")).toBeVisible();
  const id = await node.getAttribute("data-node");
  await page.keyboard.press("Tab");
  await expect(node.locator("a.tl-more")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(`#b-${id}`)).toBeFocused();
  await expect(page).toHaveURL(new RegExp(`#b-${id}$`));
  // Escape closes an open step and keeps focus on it.
  await node.locator("summary").focus();
  await page.keyboard.press("Escape");
  await expect(node.locator("details")).not.toHaveAttribute("open", "");
});

test("you are here: the profile's phase, tower floor and calendar day are marked; finished phases fold", async ({ page }) => {
  await personal(page);
  await expect(timeline(page).locator("[data-lane='day15-40'][data-here] [data-you-are-here]")).toContainText("Dia 20 do reino");
  await expect(page.locator(".tw-floor-here")).toHaveAttribute("data-floor", "day15-40");
  await expect(page.locator("[data-calendar] [data-you-are-here]")).toContainText("dia 20 do reino");
  // Days 0–3 and 4–14 are behind a day-20 kingdom: folded, still one tap away.
  const early = timeline(page).locator("[data-lane='day0-3'] details.tl-fold");
  await expect(early.locator(":scope > summary")).toContainText("provavelmente já feitos");
  await expect(early.locator(".tl-node").first()).toBeHidden();
});

test("Read more on a probably-done step opens Already done? first", async ({ page }) => {
  await personal(page);
  const lane = timeline(page).locator("[data-lane='day4-14'] details.tl-fold");
  await lane.locator(":scope > summary").click();
  const node = lane.locator(".tl-node").first();
  const id = await node.getAttribute("data-node");
  await node.locator("summary").click();
  await node.locator("a.tl-more").click();
  await expect(page.locator("#already-done > details")).toHaveAttribute("open", "");
  await expect(page.locator(`#b-${id}`)).toBeInViewport();
});

test("calendar milestones link to steps on the page and never show a day without a dated card", async ({ page }) => {
  await personal(page);
  const cal = page.locator("[data-calendar]");
  for (const a of await cal.locator("a[data-read-more]").all()) {
    const href = (await a.getAttribute("href"))!;
    await expect(page.locator(href), href).toHaveCount(1);
  }
  for (const item of await cal.locator("[data-pending]").all()) {
    await expect(item.locator(".cal-day")).toHaveText("Pendente");
    await expect(item.locator("[data-confidence='pending']")).toHaveCount(1);
  }
  await expect(cal.locator("[data-milestone='pelagius'] .cal-meta")).toContainText("C04-0005");
});

test("the current phase highlights as you scroll, and steps reveal as they come into view", async ({ page }) => {
  await personal(page);
  await expect(timeline(page)).toHaveAttribute("data-reveal", "");
  const lastLane = timeline(page).locator(".tl-lane[data-lane='pre-kvk1']");
  const lastNode = lastLane.locator(".tl-node").last();
  await expect(lastNode).not.toHaveAttribute("data-shown", "");
  await lastNode.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 200);
  await expect(lastNode).toHaveAttribute("data-shown", "");
  await expect(timeline(page).locator(".tl-lane[data-active]")).toHaveCount(1);
});

test.describe("reduced motion", () => {
  test("no reveal: every step is visible without scrolling, with no transform", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await personal(page);
    await expect(timeline(page)).not.toHaveAttribute("data-reveal", "");
    const far = timeline(page).locator(".tl-lane[data-lane='pre-kvk1']").locator(".tl-node").last();
    expect(await far.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
    expect(await far.evaluate((el) => getComputedStyle(el).clipPath)).toBe("none");
  });
});

test.describe("3D tower", () => {
  test.describe.configure({ timeout: 90_000 }); // SwiftShader WebGL is slow under parallel load
  test("View in 3D loads the scene on demand and Back to 2D returns to the SVG", async ({ page }) => {
    const chunks: string[] = [];
    page.on("request", (r) => chunks.push(new URL(r.url()).pathname));
    await personal(page);
    expect(chunks.some((c) => c.includes("guide-tower-3d"))).toBe(false);
    const btn = page.locator("[data-tower-toggle]");
    await expect(btn).toHaveText("Ver em 3D");
    await btn.click();
    await expect(page.locator("canvas[data-tower3d], [data-tower-fallback]:not([hidden])").first()).toBeVisible({ timeout: 20_000 });
    expect(chunks.some((c) => c.includes("guide-tower-3d"))).toBe(true);
    if (await page.locator("canvas[data-tower3d]").count()) {
      await expect(page.locator("canvas[data-tower3d]")).toHaveAttribute("aria-label", /Você está no andar Days 15–40/);
      await expect(page.locator("[data-tower-svg]")).toBeHidden();
      // Centre it first: the fixed top bar on phones covers a button scrolled to the top edge.
      await btn.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await btn.click();
      await expect(page.locator("canvas[data-tower3d]")).toHaveCount(0);
    }
    await expect(page.locator("[data-tower-svg]")).toBeVisible();
    await expect(btn).toHaveText("Ver em 3D");
  });

  test("without WebGL: the SVG stays and a message says why", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (/webgl/.test(type)) return null;
        return (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof orig;
    });
    await personal(page);
    await page.locator("[data-tower-toggle]").click();
    await expect(page.locator("[data-tower-fallback]")).toContainText("vista 3D não está disponível");
    await expect(page.locator("[data-tower-svg]")).toBeVisible();
    await expect(page.locator("canvas[data-tower3d]")).toHaveCount(0);
    await expect(page.locator("[data-tower-toggle]")).toBeEnabled();
  });

  test("if the 3D chunk fails to load, the SVG stays with the message", async ({ page }) => {
    await page.route(/guide-tower-3d.*\.js$/, (r) => r.abort());
    await personal(page);
    await page.locator("[data-tower-toggle]").click();
    await expect(page.locator("[data-tower-fallback]")).toBeVisible();
    await expect(page.locator("[data-tower-svg]")).toBeVisible();
  });
});

test("no sideways scroll at 360px with the visual guide", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const url of [URL_D20, "/guides/first-30-days/", "/guide/"]) {
    await page.goto(url);
    if (url === URL_D20) await timelineReady(page);
    await expect(page.locator("[data-timeline]").first()).toBeVisible();
    await page.locator("[data-timeline] .tl-node summary").first().click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(0);
    // Mobile emulation widens the layout viewport to fit overflowing content, so check it stayed 360.
    expect(await page.evaluate(() => innerWidth), url).toBe(360);
  }
});

test.describe("accessibility", () => {
  test.describe.configure({ timeout: 90_000 });
  const pages: Array<[string, string, (page: Page) => Promise<void>]> = [
    ["personal guide, step and pending milestones open", URL_D20, async (page) => {
      await timelineReady(page);
      await page.locator("[data-lane='day15-40'] .tl-node summary").first().click();
      await page.locator("[data-calendar] .cal-pending summary").click();
      await page.locator("[data-lane='day0-3'] .tl-fold > summary").click();
    }],
    ["first 30 days, timeline", "/guides/first-30-days/", async (page) => {
      await page.locator("[data-timeline] .tl-node summary").first().click();
    }],
    ["3D fallback message", URL_D20, async (page) => {
      await page.route(/guide-tower-3d.*\.js$/, (r) => r.abort());
      await timelineReady(page);
      await page.locator("[data-tower-toggle]").click();
      await expect(page.locator("[data-tower-fallback]")).toBeVisible();
    }],
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
