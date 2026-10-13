import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const FALLBACK = /3D view is not available/;

/** Make every WebGL context request fail, as on a browser without WebGL. */
const noWebGL = (page: Page) =>
  page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error narrowing the overloads is not needed for a stub
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      if (/webgl/.test(type)) return null;
      return orig.call(this, type, ...rest);
    };
  });

/** Wait until the island has hydrated (Astro drops the ssr attribute), so typed input is not reset. */
const ready = (page: Page) => expect(page.locator("astro-island:has(.cr-wrap)")).not.toHaveAttribute("ssr", "");

test.describe("alliance crest (F-61)", () => {
  test("2D editor: shape, colour, tag and emblem update the crest and persist in ko:crest:v1 only", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/crest/");
    await ready(page);
    await expect(page.locator("h1")).toHaveText("Alliance crest");
    await expect(page.getByText("Experimental", { exact: true })).toBeVisible();
    const svg = page.locator(".cr-svg");
    await expect(svg).toHaveAttribute("data-shape", "heater");

    await page.getByRole("radio", { name: "Kite" }).check();
    await page.getByRole("radio", { name: "rose" }).check();
    await page.getByRole("radio", { name: "Tower" }).check();
    const tag = page.getByLabel("Alliance tag");
    await tag.fill("a");
    await expect(tag).toHaveAttribute("aria-invalid", "true");
    await tag.fill("[k9x]");
    await expect(tag).not.toHaveAttribute("aria-invalid", "true");

    await expect(svg).toHaveAttribute("data-shape", "kite");
    await expect(svg).toHaveAttribute("data-color", "rose");
    await expect(svg).toHaveAttribute("data-emblem", "tower");
    await expect(svg.locator("text")).toHaveText("[K9X]");
    await expect(page.locator(".cr-desc")).toHaveText("Kite shield in rose, tower emblem with the tag [K9X].");

    const stored = await page.evaluate(() => ({ crest: localStorage.getItem("ko:crest:v1"), store: localStorage.getItem("ko:v1") }));
    expect(JSON.parse(stored.crest!)).toEqual({ v: 1, shape: "kite", color: "rose", tag: "K9X", emblem: "tower" });
    expect(stored.store).toBeNull();

    await page.reload();
    await expect(page.locator(".cr-svg")).toHaveAttribute("data-shape", "kite");
    await expect(page.getByRole("radio", { name: "Tower" })).toBeChecked();
    await expect(page.getByLabel("Alliance tag")).toHaveValue("K9X");
    expect(errors).toEqual([]);
  });

  test("a corrupt saved crest falls back to the default without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("ko:crest:v1", '{"v":1,"shape":"dragon","color":"rose"'));
    await page.goto("/crest/");
    await ready(page);
    await expect(page.locator(".cr-svg")).toHaveAttribute("data-shape", "heater");
    expect(errors).toEqual([]);
  });

  test("downloads SVG and PNG", async ({ page }) => {
    await page.goto("/crest/");
    await ready(page);
    await page.getByLabel("Alliance tag").fill("OPS");
    const detail = () => page.evaluate(() => new Promise<{ file: string; bytes: number; type: string }>((r) =>
      document.addEventListener("ko:crest-export", (e) => r((e as CustomEvent).detail), { once: true })));

    let fired = detail();
    let dl = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download SVG" }).click();
    const [svgDl, svg] = await Promise.all([dl, fired]);
    expect(svgDl.suggestedFilename()).toBe("kingdomops-crest-ops.svg");
    expect(svg.type).toBe("image/svg+xml");

    fired = detail();
    dl = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PNG" }).click();
    const [pngDl, png] = await Promise.all([dl, fired]);
    expect(pngDl.suggestedFilename()).toBe("kingdomops-crest-ops.png");
    expect(png.bytes).toBeGreaterThan(5_000);
    await expect(page.getByRole("status")).toContainText("Saved kingdomops-crest-ops.png");
  });

  test("Three.js is not loaded until View in 3D; then a canvas or the fallback message", async ({ page }) => {
    const scripts: string[] = [];
    page.on("request", (r) => { if (r.resourceType() === "script") scripts.push(r.url()); });
    await page.goto("/crest/");
    await ready(page);
    await expect(page.locator(".cr-svg")).toBeVisible();
    expect(scripts.some((u) => u.includes("crest-3d"))).toBe(false);

    // Q2 P2-10: the 3D scene is built in steps; the page says so and keeps the 2D crest until it is ready.
    const statuses: string[] = [];
    await page.exposeFunction("koStatus", (t: string) => statuses.push(t));
    await page.evaluate(() => {
      const el = document.querySelector("[data-3d-status]")!;
      new MutationObserver(() => (window as unknown as { koStatus: (t: string) => void }).koStatus(el.textContent ?? "")).observe(el, { childList: true, characterData: true, subtree: true });
    });
    await page.getByRole("button", { name: "View in 3D" }).click();
    const canvas = page.locator("canvas[data-crest3d]");
    const fallback = page.getByText(FALLBACK);
    await expect(canvas.or(fallback)).toBeVisible();
    expect(scripts.some((u) => u.includes("crest-3d"))).toBe(true);
    if (await canvas.isVisible()) expect(statuses.some((t) => /Loading the 3D view|Preparing the 3D view/.test(t))).toBe(true);
    if (await canvas.isVisible()) {
      await expect(page.getByRole("button", { name: "Back to 2D" })).toBeFocused();
      const box = (await canvas.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
      await page.mouse.up();
      await page.getByRole("button", { name: "Back to 2D" }).click();
      await expect(page.locator(".cr-svg")).toBeVisible();
      await expect(page.getByRole("button", { name: "View in 3D" })).toBeFocused();
    } else {
      await expect(page.locator(".cr-svg")).toBeVisible();
    }
  });

  test("without WebGL the 3D button falls back to the 2D crest with a message", async ({ page }) => {
    await noWebGL(page);
    await page.goto("/crest/");
    await ready(page);
    await page.getByRole("button", { name: "View in 3D" }).click();
    await expect(page.getByText(FALLBACK)).toBeVisible();
    await expect(page.locator(".cr-svg")).toBeVisible();
    await expect(page.locator("canvas[data-crest3d]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "View in 3D" })).toBeFocused();
  });

  test("prefers-reduced-motion: the 3D crest does not rotate on its own", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/crest/");
    await ready(page);
    await page.getByRole("button", { name: "View in 3D" }).click();
    const canvas = page.locator("canvas[data-crest3d]");
    await expect(canvas.or(page.getByText(FALLBACK))).toBeVisible();
    test.skip(!(await canvas.isVisible()), "no WebGL in this browser");
    await expect(page.locator("[data-auto-rotate]")).not.toBeChecked();
    await expect(page.getByText("starts still")).toBeVisible();
  });

  test("the governor card shows the saved crest", async ({ page }) => {
    await page.goto("/card/");
    await expect(page.locator(".gc-crest")).toHaveCount(0);
    await page.evaluate(() => localStorage.setItem("ko:crest:v1", JSON.stringify({ v: 1, shape: "round", color: "jade", tag: "OPS", emblem: "crown" })));
    await page.reload();
    await expect(page.locator(".gc .gc-crest")).toHaveAttribute("data-shape", "round");
  });

  test("no sideways scroll at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/crest/");
    await ready(page);
    await expect(page.locator(".cr-svg")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  for (const theme of ["dark", "light"] as const) {
    test(`axe ${theme}: no serious or critical violations (2D and after View in 3D)`, async ({ page }) => {
      await page.goto("/");
      await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
      await page.goto("/crest/");
      await ready(page);
      await page.getByLabel("Alliance tag").fill("ABC");
      await expect(page.locator(".cr-svg text")).toHaveText("[ABC]");
      const scan = async () => {
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        return result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      };
      expect(await scan()).toEqual([]);
      await page.getByRole("button", { name: "View in 3D" }).click();
      await expect(page.locator("canvas[data-crest3d]").or(page.getByText(FALLBACK))).toBeVisible();
      expect(await scan()).toEqual([]);
    });
  }
});
