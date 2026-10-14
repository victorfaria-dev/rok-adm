// Wave J: /tools/pack-value/ (A12-0618 method: raw gems and VIP points per unit of money only).
import { expect, test, type Page } from "@playwright/test";
import { axeViolations, hydrated, noSidewaysScroll, openInTheme } from "./helpers";

const ROUTE = "/tools/pack-value/";
const value = (page: Page, id: string) => page.getByTestId(id).locator(".t-value");

test("computes gems and VIP points per dollar at the price typed, and compares only in USD", async ({ page }) => {
  await page.goto(ROUTE);
  await hydrated(page);
  await expect(page.locator("[data-pack-limits]")).toContainText("não são convertidos em gemas");
  await page.getByLabel("Preço que você vê").fill("9.99");
  await page.getByLabel("Gemas no pacote").fill("19500");
  await page.getByLabel("Pontos VIP no pacote").fill("0");
  await expect(value(page, "pv-gems-per")).toHaveText("1.952,0");
  await expect(value(page, "pv-vip-per")).toHaveText("0,0");
  await expect(page.getByTestId("pv-compare")).toContainText("gemas brutas por dólar");

  await page.getByLabel("Moeda").selectOption("other");
  await expect(page.getByTestId("pv-gems-per")).toContainText("unidade da sua moeda");
  await expect(page.getByTestId("pv-compare")).toHaveCount(0);
  await expect(page.getByTestId("pv-no-compare")).toBeVisible();

  await page.getByLabel("Preço que você vê").fill("0");
  await expect(page.getByTestId("pv-empty")).toBeVisible();
});

test("lists the reference packs with a regional price note on every price", async ({ page }) => {
  await page.goto(ROUTE);
  const rows = page.locator("[data-testid='pv-refs'] tbody tr");
  expect(await rows.count()).toBeGreaterThan(5);
  for (const row of await rows.all()) await expect(row).toContainText("varia por região");
  await expect(page.locator("[data-row='gem-supply-30d']")).toContainText("1.952");
});

test("is listed on /tools/", async ({ page }) => {
  await page.goto("/tools/");
  await expect(page.locator(`a[href="${ROUTE}"]`).first()).toBeVisible();
});

test(`no sideways scroll at 360px ${ROUTE}`, async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(ROUTE);
  await hydrated(page);
  await noSidewaysScroll(page);
});

for (const theme of ["dark", "light"] as const) {
  test(`axe ${theme} ${ROUTE}`, async ({ page }) => {
    await openInTheme(page, ROUTE, theme);
    await hydrated(page);
    expect(await axeViolations(page)).toEqual([]);
  });
}
