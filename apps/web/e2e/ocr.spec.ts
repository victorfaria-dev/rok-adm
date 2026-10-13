// F-54 experimental screenshot reader: real Tesseract on a synthetic fixture (text drawn by
// scripts/make-ocr-fixture.py, no game art). Every request must stay on our own origin.
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const FIXTURE = fileURLToPath(new URL("./fixtures/profile-synthetic.png", import.meta.url));

function watchRequests(page: Page, baseURL: string): { ocr: string[]; foreign: string[] } {
  const seen = { ocr: [] as string[], foreign: [] as string[] };
  const origin = new URL(baseURL).origin;
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.protocol === "data:" || u.protocol === "blob:") return;
    if (u.origin !== origin) seen.foreign.push(r.url());
    else if (u.pathname.startsWith("/ocr/")) seen.ocr.push(u.pathname);
  });
  return seen;
}

test("reads City Hall, power and VIP on the device; nothing loads before the click; nothing is saved", async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const seen = watchRequests(page, baseURL!);
  await page.goto("/tools/screenshot/");
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  await expect(page.locator("h1")).toContainText("Experimental");
  await expect(page.locator("[data-ocr-promises]")).toContainText("never leaves this device");

  await page.locator("[data-ocr-file]").setInputFiles(FIXTURE);
  await expect(page.locator("[data-ocr-preview]")).toBeVisible();
  expect(seen.ocr).toEqual([]);
  const before = await page.evaluate(() => Object.keys(localStorage).sort());

  await page.getByRole("button", { name: "Read the screenshot" }).click();
  await expect(page.locator("[data-ocr-results]")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByRole("heading", { name: "3. Check the suggestions" })).toBeFocused();
  await expect(page.getByLabel("City Hall level")).toHaveValue("22");
  await expect(page.getByLabel("Power")).toHaveValue("45,678,901");
  await expect(page.getByLabel("VIP level")).toHaveValue("12");
  expect(seen.ocr).toContain("/ocr/worker.min.js");
  expect(seen.ocr).toContain("/ocr/eng.traineddata.gz");
  expect(seen.foreign).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual(before);
  await page.locator(".ocr-raw summary").click();
  await expect(page.locator("[data-ocr-text]")).toContainText("Governor Profile");
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);

  // Suggestions are editable; links carry the edited values and save nothing by themselves.
  await page.getByLabel("City Hall level").fill("23");
  const mig = page.locator('[data-ocr-use="migration"]');
  await page.getByLabel("VIP level").fill("99");
  await expect(page.locator("#ocr-vip-err")).toContainText("Use 0 to 20");
  await expect(page.locator('[data-ocr-use="vip"]')).toHaveCount(0);
  await mig.click();
  await expect(page).toHaveURL(/\/tools\/migration\/\?s=/);
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  await expect(page.getByLabel("City Hall level")).toHaveValue("23");
  await expect(page.getByLabel("Displayed power (millions)")).toHaveValue("45.68");
  expect(await page.evaluate(() => localStorage.getItem("ko:tools:v1"))).toBeNull();
  expect(errors).toEqual([]);
});

test("refuses a file that is not an image", async ({ page }) => {
  await page.goto("/tools/screenshot/");
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  await page.locator("[data-ocr-file]").setInputFiles({ name: "x.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
  await expect(page.getByRole("alert")).toContainText("Pick a screenshot image");
  await expect(page.getByRole("button", { name: "Read the screenshot" })).toBeDisabled();
});

for (const theme of ["dark", "light"] as const) {
  test(`axe ${theme} /tools/screenshot/ with a picked image`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
    await page.goto("/tools/screenshot/");
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
    await page.locator("[data-ocr-file]").setInputFiles(FIXTURE);
    await expect(page.locator("[data-ocr-preview]")).toBeVisible();
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
