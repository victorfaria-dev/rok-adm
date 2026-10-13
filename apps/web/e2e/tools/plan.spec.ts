// Wave D W2: /tools/gems/, /tools/migration/, /tools/kvk/, /tools/hoard/.
import { expect, test, type Page } from "@playwright/test";
import { axeViolations, hydrated, noSidewaysScroll, openInTheme, toolsStore } from "./helpers";

const ROUTES = ["/tools/gems/", "/tools/migration/", "/tools/kvk/", "/tools/hoard/"] as const;

async function fresh(page: Page, route: string): Promise<void> {
  await page.goto("/404.html");
  await page.evaluate(() => localStorage.clear());
  await page.goto(route);
  await hydrated(page);
}

test.describe("gem value table", () => {
  test("summary cites every row and links to the VIP calculator", async ({ page }) => {
    await fresh(page, "/tools/gems/");
    const sum = page.getByTestId("gems-summary");
    await expect(sum.locator('tr[data-row="vip"]')).toContainText("A05-0004");
    await expect(sum.locator('tr[data-row="ap"]')).toContainText("A04-0008");
    await expect(sum.locator('tr[data-row="speedups"]')).toContainText("A04-0007");
    await expect(sum.locator('tr[data-row="ch"]')).toContainText("800");
    await expect(sum.locator('tr[data-row="wheel"]')).toContainText("Low confidence");
    await expect(sum.getByRole("link", { name: "VIP points" })).toHaveAttribute("href", "/tools/vip/");
    await expect(page.getByText(/Wheel of Fortune guarantees.*needs cost data/)).toBeVisible();
    await expect(page.getByTestId("gems-guidance")).toContainText("Community divided");
  });

  test("AP ladder, City Hall gems and the VIP filter; saved under ko:tools:v1 only", async ({ page }) => {
    await fresh(page, "/tools/gems/");
    await page.getByLabel("Purchases today").fill("5");
    await expect(page.getByTestId("gems-ap-total").locator(".t-value")).toHaveText("1,000");
    await expect(page.getByTestId("gems-ap-total")).toContainText("2,500 AP");
    await page.getByLabel("Your City Hall level").fill("16");
    await expect(page.getByTestId("gems-ch-left").locator(".t-value")).toHaveText("700");
    await page.getByLabel("Show items you can buy at").selectOption("3");
    await expect(page.getByTestId("gems-shop-count")).toHaveText("2 of 32 items shown");
    await expect(page.getByTestId("gems-shop")).toContainText("1.20");
    const s = await toolsStore(page);
    expect(s).toMatchObject({ v: 1, inputs: { gems: { apBuys: 5, cityHall: 16, shopVip: "3" } } });
    expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();
    await page.reload();
    await hydrated(page);
    await expect(page.getByLabel("Purchases today")).toHaveValue("5");
  });
});

test.describe("migration checker", () => {
  test("defaults are eligible; each failing rule is listed with its card and patch", async ({ page }) => {
    await fresh(page, "/tools/migration/");
    await expect(page.getByTestId("mig-verdict").locator(".t-value")).toHaveText("Eligible");
    await page.getByLabel("City Hall level").fill("15");
    await page.getByLabel("Are you in an alliance?").selectOption("yes");
    await expect(page.getByTestId("mig-verdict").locator(".t-value")).toHaveText("Not eligible");
    await expect(page.getByTestId("mig-verdict")).toContainText("2 rules block the move");
    const ch = page.locator('[data-check="ch"]');
    await expect(ch).toHaveAttribute("data-ok", "false");
    await expect(ch).toContainText("Blocks");
    await expect(ch).toContainText("B06-0001");
    await page.getByLabel("City Hall level").fill("16");
    await page.getByLabel("Are you in an alliance?").selectOption("no");
    await expect(page.getByTestId("mig-verdict").locator(".t-value")).toHaveText("Eligible");
  });

  test("age limit per route: 150 days passes, 151 fails (1.1.06)", async ({ page }) => {
    await fresh(page, "/tools/migration/");
    await page.getByLabel("Target kingdom age (days)").fill("0");
    await page.getByLabel("Character age (days)").fill("150");
    await expect(page.locator('[data-check="age"]')).toHaveAttribute("data-ok", "true");
    await expect(page.locator('[data-check="age"]')).toContainText("1.1.06");
    await page.getByLabel("Character age (days)").fill("151");
    await expect(page.locator('[data-check="age"]')).toHaveAttribute("data-ok", "false");
    await page.getByLabel("Route", { exact: true }).selectOption("cross-s3");
    await page.getByLabel("Character age (days)").fill("120");
    await expect(page.locator('[data-check="age"]')).toHaveAttribute("data-ok", "true");
    await expect(page.locator('[data-check="cross-power"]')).toContainText("C04-0025");
  });

  test("passport pages: exact only at known data points, ranges in between", async ({ page }) => {
    await fresh(page, "/tools/migration/");
    const pages = page.getByTestId("mig-pages");
    const power = page.getByLabel("Displayed power (millions)");
    await power.fill("10");
    await expect(pages.locator(".t-value")).toHaveText("1 page");
    await power.fill("30");
    await expect(pages.locator(".t-value")).toHaveText("Between 1 and 25 pages");
    await expect(pages).toContainText("Exact table pending");
    await power.fill("50");
    await expect(pages.locator(".t-value")).toHaveText("25 pages");
    await power.fill("100");
    await expect(pages.locator(".t-value")).toHaveText("Between 25 and 75 pages");
    await power.fill("120");
    await expect(pages.locator(".t-value")).toHaveText("75 pages");
  });

  test("officer link opens the checker with the kingdom fields only", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await fresh(page, "/tools/migration/");
    await page.getByLabel("City Hall level").fill("22");
    await page.getByLabel("Route", { exact: true }).selectOption("cross-s2");
    await page.getByLabel("Target kingdom age (days)").fill("200");
    await page.getByLabel("Target kingdom power cap (millions, optional)").fill("40");
    await page.getByRole("button", { name: /Copy applicant link/ }).click();
    const status = page.getByTestId("mig-officer-status");
    await expect(status).not.toBeEmpty();
    const text = (await status.textContent()) ?? "";
    const url = text.startsWith("Copy this link: ") ? text.slice("Copy this link: ".length) : await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain("/tools/migration/?s=");
    await page.evaluate(() => localStorage.removeItem("ko:tools:v1"));
    await page.goto(url);
    await hydrated(page);
    await expect(page.getByText("You opened a shared link")).toBeVisible();
    await expect(page.getByLabel("Route", { exact: true })).toHaveValue("cross-s2");
    await expect(page.getByLabel("Target kingdom age (days)")).toHaveValue("200");
    await expect(page.getByLabel("Target kingdom power cap (millions, optional)")).toHaveValue("40");
    await expect(page.getByLabel("City Hall level")).toHaveValue("16");
    await expect(page.locator('[data-check="cap"]')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("ko:tools:v1"))).toBeNull();
  });

  test("before-you-move checklist persists in ko:tools:v1 only", async ({ page }) => {
    await fresh(page, "/tools/migration/");
    await page.getByRole("checkbox", { name: /Have enough Passport Pages/ }).check();
    expect(await toolsStore(page)).toMatchObject({ checks: { "migration-before": ["pages"] } });
    expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();
    await page.reload();
    await hydrated(page);
    await expect(page.getByRole("checkbox", { name: /Have enough Passport Pages/ })).toBeChecked();
    await expect(page.locator('[data-checklist="migration-before"] .t-progress')).toHaveText("1 of 7 done");
  });
});

test.describe("KvK readiness", () => {
  test("grouped checklist with cites, No consensus items and related links; marks persist", async ({ page }) => {
    await fresh(page, "/tools/kvk/");
    for (const h of ["City Hall", "Troops", "Hospital", "Speedups and resources", "Commanders", "Alliance and behaviour"]) {
      await expect(page.getByRole("heading", { name: h, exact: true })).toBeVisible();
    }
    await expect(page.locator('[data-checklist="kvk-troops"]')).toContainText("A08-0500");
    await expect(page.locator('[data-checklist="kvk-commanders"]')).toContainText("No consensus");
    await expect(page.getByRole("link", { name: "Healing planner" })).toHaveAttribute("href", "/tools/healing/");
    await expect(page.getByRole("link", { name: "Hoard advisor" })).toHaveAttribute("href", "/tools/hoard/");
    await expect(page.getByTestId("kvk-explainer")).toContainText("Checked on: 1.1.06");
    await page.getByRole("checkbox", { name: /Fight your first KvK with T4/ }).check();
    expect(await toolsStore(page)).toMatchObject({ checks: { "kvk-troops": ["t4"] } });
    expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();
    await page.reload();
    await hydrated(page);
    await expect(page.getByRole("checkbox", { name: /Fight your first KvK with T4/ })).toBeChecked();
  });
});

test.describe("hoard advisor", () => {
  test("rules per goal with cites; divided advice is marked", async ({ page }) => {
    await fresh(page, "/tools/hoard/");
    await expect(page.locator('[data-goal="lohar"]')).toContainText("A11-0505");
    await expect(page.locator('[data-goal="mtg"]')).toContainText("7,000 gems a day");
    await expect(page.locator('[data-goal="eve"]')).toContainText("A09-0007");
    await expect(page.locator('[data-goal="mge"]')).toContainText("A11-0500");
    const universal = page.getByTestId("hoard-general").locator('[data-rule="universal"]');
    await expect(universal).toContainText("Community divided");
    await expect(universal).toContainText("A02-0503");
    await expect(page.getByTestId("hoard-general")).toContainText("A11-0512");
  });

  test("saved vs target reads and writes the shared inventory", async ({ page }) => {
    await page.goto("/404.html");
    await page.evaluate(() => localStorage.setItem("ko:tools:v1", JSON.stringify({ v: 1, inventory: { speedupHealingMin: 1234 }, inputs: {}, checks: {} })));
    await page.goto("/tools/hoard/");
    await hydrated(page);
    await page.getByLabel("Saving for").selectOption("eve");
    await expect(page.getByLabel("Healing speedups saved (minutes)")).toHaveValue("1234");
    await page.getByLabel("Saving for").selectOption("mtg");
    await page.getByLabel("Gems saved (gems)").fill("3000");
    await page.getByLabel(/Gems target \(gems\)/).fill("7000");
    await expect(page.getByTestId("hoard-gap-gems").locator(".t-value")).toHaveText("4,000 gems to go (42%)");
    await expect(page.getByTestId("hoard-gap-gems")).toContainText("pending measurement");
    expect(await toolsStore(page)).toMatchObject({ inventory: { gems: 3000, speedupHealingMin: 1234 }, inputs: { hoard: { goal: "mtg", target_gems: 7000 } } });
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const [route, id] of [["/tools/gems/", "gems-ap-total"], ["/tools/migration/", "mig-verdict"], ["/tools/kvk/", "kvk-explainer"], ["/tools/hoard/", "hoard-general"]] as const) {
    test(`${route} renders defaults and sources`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByTestId(id)).toBeVisible();
      await expect(page.getByRole("heading", { name: "Sources on this page" })).toBeVisible();
      await expect(page.getByText(/latest official patch/)).toBeVisible();
    });
  }
});

for (const route of ROUTES) {
  for (const theme of ["dark", "light"] as const) {
    test(`axe ${theme} ${route}`, async ({ page }) => {
      await openInTheme(page, route, theme);
      await hydrated(page);
      expect(await axeViolations(page)).toEqual([]);
      await noSidewaysScroll(page);
    });
  }
  test(`no sideways scroll at 360px ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(route);
    await hydrated(page);
    await noSidewaysScroll(page);
  });
}
