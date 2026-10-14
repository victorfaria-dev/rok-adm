// Sign-in NOT configured (CI and Netlify previews today): the site works exactly as before.
// The configured mode (mocked Supabase) is in e2e-auth/ with playwright.auth.config.ts.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("app areas open without sign-in and carry no route guard", async ({ page }) => {
  for (const path of ["/me/", "/tools/", "/kingdom/", "/city-hall/"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    expect(new URL(page.url()).pathname, path).toBe(path);
    await expect(page.locator("script[data-auth-guard]"), path).toHaveCount(0);
  }
  // No account panel and no dev notice in the production build.
  await page.goto("/me/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Me: Governor");
  await expect(page.locator("[data-account-panel]")).toHaveCount(0);
  await expect(page.locator("[data-auth-dev-notice]")).toHaveCount(0);
});

test("the landing page does not load Supabase", async ({ page }) => {
  const bodies: Promise<string>[] = [];
  page.on("response", (r) => { if (r.request().resourceType() === "script") bodies.push(r.text().catch(() => "")); });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // supabase-js sends an "X-Client-Info: supabase-js-…" header; that string is in its code.
  for (const b of await Promise.all(bodies)) expect(b.includes("supabase-js")).toBe(false);
});

for (const [path, text] of [
  ["/login/", "Accounts are not switched on yet"],
  ["/u/?h=bob", "Player profiles are not switched on yet."],
  ["/me/profile/", "Accounts are not switched on yet, so there is no public profile to edit"],
  ["/me/verify/", "Accounts are not switched on yet, so there is nothing to verify."],
] as const) {
  test(`${path} says accounts are off and passes axe`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("[data-auth-off]")).toContainText(text);
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
}

test("the callback page is harmless when accounts are off", async ({ page }) => {
  await page.goto("/auth/callback/?code=abc&next=%2Fme%2F");
  await expect(page.locator("[data-auth-off]")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/auth/callback/");
});
