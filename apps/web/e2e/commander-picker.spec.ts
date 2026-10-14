import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { defaultProfile, encodeProfile, type KingdomStage } from "@rokadm/core";

/** Seed the store (theme, and a profile at the given kingdom stage) before the island reads it. */
async function seed(page: Page, opts: { theme?: "dark" | "light"; stage?: KingdomStage } = {}) {
  const profileCode = opts.stage ? encodeProfile({ ...defaultProfile(), kingdomStage: opts.stage }) : null;
  await page.goto("/");
  await page.evaluate((s) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, ...s })), { theme: opts.theme ?? "dark", profileCode });
}

const tile = (page: Page, name: string) => page.getByRole("button", { name: new RegExp(`^${name},`) });
const picker = (page: Page) => page.locator(".ckp");

test("pick a commander by its portrait", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/commanders/");
  await expect(picker(page).getByRole("heading", { name: "Choose a commander" })).toBeVisible();
  await expect(picker(page).getByRole("group", { name: "From kingdom start" })).toBeVisible();
  // Eager first-row portraits load; every portrait reserves its box (width/height attributes).
  const first = picker(page).locator(".ckt-img").first();
  await expect.poll(() => first.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
  const sizes = await picker(page).locator(".ckt-img").evaluateAll((imgs) => imgs.map((i) => `${i.getAttribute("width")}x${i.getAttribute("height")}:${i.getAttribute("loading")}`));
  expect(new Set(sizes.map((s) => s.split(":")[0]))).toEqual(new Set(["56x56"]));
  expect(sizes.filter((s) => s.endsWith("lazy")).length).toBeGreaterThan(80);
  // A commander without a portrait gets the initials tile.
  await expect(tile(page, "Achilles").locator(".ckt-initials")).toHaveText("AC");
  await expect(picker(page).getByText("Portraits: Rise of Kingdoms © Lilith Games. Fan site, not affiliated.")).toBeVisible();

  await tile(page, "Lohar").locator(".ckt-face").click();
  await expect(page).toHaveURL(/#lohar$/);
  await expect(page.getByRole("heading", { level: 2, name: "Lohar" })).toBeFocused();
  await expect(tile(page, "Lohar")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("group", { name: /What job will this commander do/ })).toBeVisible();

  // Search ignores accents and case.
  await page.getByLabel("Search by name").fill("SÚN TZ");
  await expect(picker(page).locator("button.ckt")).toHaveCount(1);
  await tile(page, "Sun Tzu").click();
  await expect(page.getByRole("heading", { level: 2, name: "Sun Tzu" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("keyboard: one tab stop into the grid, arrows move, Enter picks, focus ring shows", async ({ page }) => {
  await page.goto("/commanders/");
  await page.getByLabel("Search by name").fill("lo");
  await page.getByLabel("Search by name").focus();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate(() => document.activeElement?.classList.contains("ckt"))) break;
  }
  const focusedId = () => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.id ?? null);
  const order = await picker(page).locator("button.ckt").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id));
  expect(order.length).toBeGreaterThan(2);
  expect(await focusedId()).toBe(order[0]);
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(ring).not.toBe("none");
  await page.keyboard.press("ArrowRight");
  expect(await focusedId()).toBe(order[1]);
  await page.keyboard.press("End");
  expect(await focusedId()).toBe(order[order.length - 1]);
  await page.keyboard.press("Home");
  expect(await focusedId()).toBe(order[0]);
  await page.keyboard.press("ArrowRight");
  const id = await focusedId();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
  await expect(page.locator("#cmd-name")).toBeFocused();
  // Only one tile is in the tab order.
  expect(await picker(page).locator('button.ckt[tabindex="0"]').count()).toBe(1);
});

test("future commanders are dimmed and ask no questions", async ({ page }) => {
  await seed(page, { stage: "pre_kvk" });
  await page.goto("/commanders/");
  const guan = tile(page, "Guan Yu");
  await expect(guan).toHaveAttribute("aria-disabled", "true");
  await expect(guan).toContainText("Season 3");
  await expect(picker(page).getByRole("group", { name: /Season 3 \(KvK3\)/ })).toContainText("Coming later");
  await guan.click({ force: true }); // aria-disabled: still clickable, it explains when it arrives
  await expect(picker(page).getByRole("status")).toHaveText("Guan Yu arrives in Season 3 (KvK3). Nothing to decide yet.");
  await expect(page.locator("#cmd-name")).toHaveCount(0);
  await expect(page.getByRole("radio", { name: /Open-field/ })).toHaveCount(0);

  // A direct link to a future commander shows when it arrives, not the checklist.
  await page.goto("/commanders/#guan-yu");
  await expect(page.getByRole("heading", { level: 2, name: "Guan Yu" })).toBeVisible();
  await expect(page.getByText("This commander arrives in Season 3 (KvK3); nothing to decide yet.")).toBeVisible();
  await expect(page.locator(".cmd-verdict")).toHaveCount(0);
  await expect(page.getByRole("group", { name: /What job will this commander do/ })).toHaveCount(0);

  // "Only what I can get now" hides the later seasons.
  await page.getByRole("checkbox", { name: "Only what I can get now" }).check();
  await expect(picker(page).getByRole("group", { name: /Season 3/ })).toHaveCount(0);
  await expect(picker(page).locator("button.ckt[data-future]")).toHaveCount(0);

  // A commander already reachable still gets its questions.
  await tile(page, "Lohar").click();
  await expect(page.getByRole("group", { name: /What job will this commander do/ })).toBeVisible();
});

test("360 px: no sideways scroll, targets at least 44 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await seed(page, { stage: "kvk1", theme: "light" });
  await page.goto("/commanders/#sun-tzu");
  await expect(page.locator("#cmd-name")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const small = await page.locator(".ckt, .ckp-seg-opt span, .ckp-check, .ckp-input, .cmd-other-btn").evaluateAll((els) =>
    els.filter((e) => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 44; }).map((e) => e.outerHTML.slice(0, 80)),
  );
  expect(small).toEqual([]);
});

test.describe("accessibility", () => {
  for (const theme of ["dark", "light"] as const) {
    test(`axe ${theme}: picker with future commanders and a commander open`, async ({ page }) => {
      await seed(page, { theme, stage: "pre_kvk" });
      await page.goto("/commanders/#lohar");
      await expect(page.getByRole("heading", { level: 2, name: "Lohar" })).toBeVisible();
      await tile(page, "Guan Yu").click({ force: true });
      await expect(picker(page).getByRole("status")).not.toBeEmpty();
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

// Review screenshots (not a check): CMD_SHOTS=<dir> E2E_PORT=... pnpm exec playwright test commander-picker -g screenshots
test("screenshots", async ({ page }, info) => {
  const dir = process.env.CMD_SHOTS;
  test.skip(!dir, "set CMD_SHOTS to a directory");
  for (const theme of ["dark", "light"] as const) {
    await seed(page, { theme, stage: "kvk1" });
    await page.goto("/commanders/");
    await page.locator(".ckp-scroll").evaluate((el) => el.scrollTo(0, 0));
    await expect(picker(page).locator(".ckt-img").first()).toBeVisible();
    await page.waitForTimeout(300);
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${dir}/picker-${w}-${theme}.png`, fullPage: false });
    await page.locator(".ckp-scroll").evaluate((el) => el.scrollTo(0, el.scrollHeight * 0.55));
    await page.locator(".ckp").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator(".ckp").screenshot({ path: `${dir}/picker-${w}-${theme}-later.png` });
    await page.goto("/commanders/#guan-yu");
    await expect(page.locator("#cmd-name")).toBeVisible();
    await page.locator("#cmd-name").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${dir}/picker-${w}-${theme}-arrives.png` });
  }
  void info;
});
