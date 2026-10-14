import { expect, test, type Page } from "@playwright/test";

/** Media condition that wraps the @view-transition rule in the built CSS ("" when there is no such rule). */
const transitionCondition = (page: Page) =>
  page.evaluate(() => {
    const walk = (rules: CSSRuleList, media: string): string | null => {
      for (const r of Array.from(rules)) {
        if (r.cssText.startsWith("@view-transition")) return media;
        if (r instanceof CSSMediaRule) {
          const hit = walk(r.cssRules, r.conditionText);
          if (hit !== null) return hit;
        }
      }
      return null;
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const hit = walk(sheet.cssRules, "");
        if (hit !== null) return hit;
      } catch {
        // cross-origin sheet
      }
    }
    return null;
  });

test.describe("page transitions", () => {
  test("cross-document view transitions are declared only when motion is welcome", async ({ page }) => {
    await page.goto("/guide/");
    const condition = await transitionCondition(page);
    expect(condition).toMatch(/prefers-reduced-motion:\s*no-preference/);
    expect(await page.evaluate((c) => matchMedia(c).matches, condition!)).toBe(true);
  });

  test("prefers-reduced-motion: no page transition applies", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/guide/");
    const condition = await transitionCondition(page);
    expect(await page.evaluate((c) => matchMedia(c).matches, condition!)).toBe(false);
    // Navigation still works without the animation.
    await page.goto("/crest/");
    await expect(page.locator("h1")).toHaveText("Alliance crest");
  });

  test("after a link navigation: theme, skip link, islands and the service worker still work", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: "light" })));
    await page.goto("/guide/");
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));

    const nav = page.locator(isMobile ? "nav.tabs:visible" : "nav.rail");
    await nav.getByRole("link", { name: "City Hall" }).click();
    await page.waitForURL("**/city-hall/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();

    // An island on a page reached by a link hydrates and reacts.
    await page.goto("/crest/");
    await nav.getByRole("link", { name: "Tools" }).first().click();
    await page.waitForURL("**/tools/");
    await page.goBack();
    await page.waitForURL("**/crest/");
    await expect(page.locator("astro-island:has(.cr-wrap)")).not.toHaveAttribute("ssr", "");
    await page.getByRole("radio", { name: "Round" }).check();
    await expect(page.locator(".cr-svg")).toHaveAttribute("data-shape", "round");
  });

  test("/start reached by a link still moves focus to the next question's replies", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start", exact: true }).first().click();
    await page.waitForURL("**/start/");
    const title = page.getByRole("heading", { level: 1 });
    await expect(page.locator("astro-island").first()).not.toHaveAttribute("ssr", "");
    const before = await title.textContent();
    await page.getByRole("radio").first().focus();
    await page.keyboard.press("Enter");
    await expect(title).not.toHaveText(before ?? "");
    await expect(page.getByRole("radio").first()).toBeFocused();
  });
});
