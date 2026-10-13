import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** F2P, fighter, pre-KvK, City Hall 22, 30 min/day (encodeProfile layout: v.spending.role.stage.ch.min.ses.kd.life.civ.ret). */
const CH22_F2P = "1.0.1.0.22.30.....0";
const CH12_LOW = "1.1.1.0.12.30.....0";

const saveProfile = (_code: string) => (c: string) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: "dark", profileCode: c }));

test.describe("governor card", () => {
  test("without a profile: example card, Epic sample, link to /start/", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/card/");
    await expect(page.locator("h1")).toHaveText("Governor card");
    const card = page.locator(".gc");
    await expect(card).toHaveAttribute("data-rarity", "epic");
    await expect(card).toHaveAttribute("data-example", "");
    await expect(card.getByText("Example")).toBeVisible();
    await expect(card.getByText("Self-reported")).toBeVisible();
    await expect(card.getByText("F2P Achiever")).toBeVisible();
    await expect(page.locator(".gc-example").getByRole("link", { name: "Build my guide" })).toHaveAttribute("href", "/start/");
    expect(errors).toEqual([]);
  });

  test("saved City Hall 22 profile renders Epic with its numbers, no Example label", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(saveProfile(CH22_F2P), CH22_F2P);
    await page.goto("/card/");
    const card = page.locator(".gc");
    await expect(card).toHaveAttribute("data-rarity", "epic");
    await expect(card).not.toHaveAttribute("data-example", "");
    await expect(card.locator(".gc-rar")).toHaveText("Epic");
    await expect(card.locator(".gc-stats dd").first()).toHaveText("22");
    await expect(card.locator(".gc-stats dd").nth(1)).toHaveText("F2P");
    await expect(card.getByText("F2P Achiever")).toBeVisible();
    await expect(card.getByText("Example")).toHaveCount(0);
  });

  test("City Hall 12 spender: Common, no F2P Achiever mark", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(saveProfile(CH12_LOW), CH12_LOW);
    await page.goto("/card/");
    const card = page.locator(".gc");
    await expect(card).toHaveAttribute("data-rarity", "common");
    await expect(card.locator(".gc-rar")).toHaveText("Common");
    await expect(card.getByText("F2P Achiever")).toHaveCount(0);
  });

  test("name and tag: validated, shown on the card, persisted in ko:card:v1 without touching ko:v1", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(saveProfile(CH22_F2P), CH22_F2P);
    await page.goto("/card/");
    const name = page.getByLabel("Governor name");
    const tag = page.getByLabel("Alliance tag");

    await name.fill("Valerius Maximus the Third");
    await expect(name).toHaveValue("Valerius Maximus"); // maxlength 16
    await expect(page.locator(".gc-name")).toHaveText("Valerius Maximus");

    await tag.fill("a");
    await expect(tag).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#gc-tag-help")).toHaveClass(/gc-error/);
    await expect(page.locator(".gc-tag")).toHaveCount(0);

    await tag.fill("[k9x]");
    await expect(tag).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator(".gc-tag")).toHaveText("[K9X]");

    await page.getByRole("radio", { name: "rose" }).check();
    await expect(page.locator(".gc")).toHaveAttribute("style", /--ko-alliance-rose/);

    const stored = await page.evaluate(() => ({ card: localStorage.getItem("ko:card:v1"), store: localStorage.getItem("ko:v1") }));
    expect(JSON.parse(stored.card!)).toMatchObject({ v: 1, name: "Valerius Maximus", tag: "K9X", color: "rose" });
    expect(JSON.parse(stored.store!)).toEqual({ v: 1, theme: "dark", profileCode: CH22_F2P });

    await page.reload();
    await expect(page.locator(".gc-name")).toHaveText("Valerius Maximus");
    await expect(page.locator(".gc-tag")).toHaveText("[K9X]");
    await expect(page.getByRole("radio", { name: "rose" })).toBeChecked();
  });

  test("Download PNG fires a download of a 1080×1080 PNG", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(saveProfile(CH22_F2P), CH22_F2P);
    await page.goto("/card/");
    await page.getByLabel("Governor name").fill("Valerius");
    const fired = page.evaluate(() => new Promise<{ file: string; bytes: number }>((r) => document.addEventListener("ko:card-png", (e) => r((e as CustomEvent).detail), { once: true })));
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PNG" }).click();
    const [download, detail] = await Promise.all([downloadPromise, fired]);
    expect(download.suggestedFilename()).toBe("kingdomops-card-valerius.png");
    expect(detail.file).toBe("kingdomops-card-valerius.png");
    expect(detail.bytes).toBeGreaterThan(10_000);
    await expect(page.getByRole("status")).toContainText("Saved kingdomops-card-valerius.png");
  });

  test("tilt follows the pointer and the Reduce motion switch flattens it", async ({ page }) => {
    await page.goto("/card/");
    const card = page.locator(".gc");
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1);
    await expect(card).toHaveAttribute("style", /--ry: ?\d+(\.\d+)?deg/);
    await page.getByLabel("Reduce motion", { exact: false }).check();
    await expect(card).toHaveClass(/still/);
    await expect(card).toHaveCSS("transform", "none");
  });

  test("prefers-reduced-motion keeps the card still", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/card/");
    await expect(page.locator(".gc")).toHaveClass(/still/);
    await expect(page.getByLabel("Reduce motion", { exact: false })).toBeChecked();
  });

  test("no sideways scroll at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/card/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  for (const theme of ["dark", "light"] as const) {
    test(`axe ${theme}: no serious or critical violations`, async ({ page }) => {
      await page.goto("/");
      await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t, profileCode: "1.0.1.0.22.30.....0" })), theme);
      await page.goto("/card/");
      await expect(page.locator(".gc-name")).toBeVisible();
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
