import { expect, test } from "@playwright/test";
import { axeViolations, hydrated, noSidewaysScroll, openInTheme, toolsStore } from "./helpers";

test("hub lists the tools and every link resolves", async ({ page, request }) => {
  await page.goto("/tools/");
  await expect(page.locator("h1")).toHaveText("Tools");
  await expect(page.getByText(/latest official patch/)).toBeVisible();
  const hrefs = await page.locator(".t-hub a").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThanOrEqual(1);
  expect(hrefs).toContain("/tools/vip/");
  for (const h of hrefs) expect((await request.get(h)).status(), h).toBe(200);
  await noSidewaysScroll(page);
});

test("VIP calculator: defaults, edit, saved under ko:tools:v1 only", async ({ page }) => {
  await page.goto("/tools/vip/");
  await hydrated(page);
  await expect(page.getByTestId("vip-needed")).toContainText("A05-0001");
  await page.getByLabel("Target VIP level").selectOption("3");
  await page.getByLabel("Your VIP points now").fill("200");
  await expect(page.getByTestId("vip-needed").locator(".t-value")).toHaveText("1,000");
  await expect(page.getByTestId("vip-gems-now").locator(".t-value")).toHaveText("1,000");
  await expect(page.getByTestId("vip-days-chest")).toContainText("Medium confidence");
  const s = await toolsStore(page);
  expect(s).toMatchObject({ v: 1, inventory: { vipPoints: 200 }, inputs: { vip: { targetVip: 3 } } });
  expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();

  await page.reload();
  await hydrated(page);
  await expect(page.getByLabel("Your VIP points now")).toHaveValue("200");
});

test("VIP calculator: invalid input shows an error and keeps the last result", async ({ page }) => {
  await page.goto("/tools/vip/");
  await hydrated(page);
  await page.getByLabel("Target VIP level").selectOption("3");
  await page.getByLabel("Your VIP points now").fill("-5");
  await expect(page.getByText("Use 0 or more.")).toBeVisible();
  await expect(page.getByLabel("Your VIP points now")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByTestId("vip-needed").locator(".t-value")).toHaveText("1,200");
});

test("VIP calculator: a share link fills the inputs without saving them", async ({ page }) => {
  await page.goto("/tools/vip/");
  await hydrated(page);
  await page.getByLabel("Target VIP level").selectOption("5");
  const url = await page.evaluate(() => {
    const code = btoa(JSON.stringify({ vipPoints: 1200, targetVip: 5, streakDay: 1, gemsPerDay: 0 })).replace(/=+$/, "");
    return `/tools/vip/?s=${code}`;
  });
  await page.evaluate(() => localStorage.removeItem("ko:tools:v1"));
  await page.goto(url);
  await hydrated(page);
  await expect(page.getByText("You opened a shared link")).toBeVisible();
  await expect(page.getByLabel("Your VIP points now")).toHaveValue("1200");
  expect(await page.evaluate(() => localStorage.getItem("ko:tools:v1"))).toBeNull();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the VIP page renders defaults and sources", async ({ page }) => {
    await page.goto("/tools/vip/");
    await expect(page.getByTestId("vip-needed")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sources on this page" })).toBeVisible();
  });
});

for (const theme of ["dark", "light"] as const) {
  for (const route of ["/tools/", "/tools/vip/"]) {
    test(`axe ${theme} ${route}`, async ({ page }) => {
      await openInTheme(page, route, theme);
      await hydrated(page);
      expect(await axeViolations(page)).toEqual([]);
      await noSidewaysScroll(page);
    });
  }
}

const link = (route: string, data: Record<string, unknown>): string =>
  `${route}?s=${Buffer.from(JSON.stringify(data)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;

test("a share link overrides only its keys, and the first edit saves and drops ?s=", async ({ page }) => {
  await page.goto("/tools/vip/");
  await hydrated(page);
  await page.getByLabel("Your VIP points now").fill("300");
  await page.getByLabel("Daily chest streak day").fill("4");
  await page.goto(link("/tools/vip/", { targetVip: 5 }));
  await hydrated(page);
  await expect(page.getByLabel("Target VIP level")).toHaveValue("5");
  await expect(page.getByLabel("Daily chest streak day")).toHaveValue("4");
  expect((await toolsStore(page)).inputs).toMatchObject({ vip: { streakDay: 4 } });
  expect(JSON.stringify((await toolsStore(page)).inputs)).not.toContain("\"targetVip\":5");

  await page.getByLabel("Gems you put into VIP each day").fill("50");
  await expect(page).toHaveURL(/\/tools\/vip\/$/);
  await page.reload();
  await hydrated(page);
  await expect(page.getByLabel("Target VIP level")).toHaveValue("5");
  await expect(page.getByLabel("Gems you put into VIP each day")).toHaveValue("50");
});

test("crafted links with impossible values fall back safely", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(link("/tools/vip/", { targetVip: 99, vipPoints: -5, streakDay: 1e300 }));
  await hydrated(page);
  await page.getByLabel("Your VIP points now").fill("5000");
  await expect(page.getByTestId("vip-needed").locator(".t-value")).not.toHaveText("");
  await expect(page.getByLabel("Daily chest streak day")).toHaveValue("1");
  await page.goto(link("/tools/healing/", { hospitals: -5 }));
  await hydrated(page);
  await expect(page.getByText("-5")).toHaveCount(0);
  expect(errors).toEqual([]);
});
