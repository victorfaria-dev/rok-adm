// Phone "More" entry without JavaScript: a link to /more/ (same list); with JS the disclosure button.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { SECONDARY } from "../src/lib/nav";

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("phone: More is a link to /more/, which lists every secondary page", async ({ page, isMobile }) => {
    test.skip(!isMobile, "the top bar is phone/tablet only");
    await page.goto("/guide/");
    const top = page.locator("header.top");
    await expect(top.getByRole("button", { name: "More" })).toBeHidden();
    const link = top.getByRole("link", { name: "More pages" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/more\/$/);
    const list = page.locator("[data-more-list]");
    for (const s of SECONDARY) await expect(list.getByRole("link", { name: s.label, exact: true })).toHaveAttribute("href", s.href);
    await expect(top.getByRole("link", { name: "More pages" })).toHaveAttribute("aria-current", "page");
  });
});

test("with JavaScript the /more/ link is swapped for the menu button", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the top bar is phone/tablet only");
  await page.goto("/guide/");
  const top = page.locator("header.top");
  await expect(top.getByRole("button", { name: "More" })).toBeVisible();
  await expect(top.getByRole("link", { name: "More pages" })).toBeHidden();
});

for (const theme of ["dark", "light"] as const) {
  test(`axe ${theme} /more/`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
    await page.goto("/more/");
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });
}
