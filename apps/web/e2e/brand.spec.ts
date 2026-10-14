import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("brand page and logo sting", () => {
  test("renders the lockup and the color swatches", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/brand/");
    await expect(page.locator("h1")).toHaveText("Marca KingdomOps");
    await expect(page.locator(".swatches li")).toHaveCount(3 + 4 + 12);
    await expect(page.getByRole("link", { name: "abrir o guia de estilo" })).toHaveAttribute("href", /styleguide/);
    expect(errors).toEqual([]);
  });

  test("the sting plays on the button and stops within 1.6 s", async ({ page }) => {
    await page.goto("/brand/");
    const sting = page.locator("[data-sting]");
    await expect(sting).toHaveCount(1);
    await expect(sting).not.toHaveAttribute("data-playing", "");
    await page.getByRole("button", { name: "Tocar vinheta" }).click();
    await expect(sting).toHaveAttribute("data-playing", "");
    // The sweep is the last animation: the facets must be moving right after the press.
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
    expect(running).toBeGreaterThan(0);
    await expect(sting).not.toHaveAttribute("data-playing", "", { timeout: 2500 });
    // Replays.
    await page.getByRole("button", { name: "Tocar vinheta" }).click();
    await expect(sting).toHaveAttribute("data-playing", "");
  });

  test("under reduced motion the sting is absent and the button explains", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/brand/");
    await expect(page.locator("[data-sting]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tocar vinheta" })).toBeDisabled();
    await expect(page.locator("[data-sting-note]")).toBeVisible();
  });

  test("axe: no serious or critical violations", async ({ page }) => {
    await page.goto("/brand/");
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
