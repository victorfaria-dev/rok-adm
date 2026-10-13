import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { QUESTIONS } from "@rokadm/core";
import { expect, test, type Page } from "@playwright/test";
import { importStore } from "../src/lib/store";

const CODE = "1.0.1.0.12.30.....0";
const RICH = "1.0.0.0.12.30...10000..0";
const h1 = (page: Page) => page.getByRole("heading", { level: 1 });

/** Seed localStorage before the island reads it. */
async function seed(page: Page, store: object) {
  await page.goto("/");
  await page.evaluate((s) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: "dark", ...s })), store);
}

const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("ko:v1") ?? "null"));

test("summary shows a seeded profile in words", async ({ page }) => {
  await seed(page, { profileCode: CODE });
  await page.goto("/me/");
  await expect(h1(page)).toHaveText("You");
  await expect(page.getByText("Farm account")).toBeVisible();
  await expect(page.getByText("F2P — $0 per month").first()).toBeVisible();
  await expect(page.locator("main").getByText("30 min", { exact: true })).toBeVisible();
  await expect(page.getByText(QUESTIONS[0]!.label)).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
});

test("no profile shows the empty state", async ({ page }) => {
  await page.goto("/me/");
  const cta = page.getByRole("link", { name: "Build my guide" });
  await expect(cta).toHaveAttribute("href", "/start/");
  await expect(page.getByRole("button", { name: "Edit answers" })).toHaveCount(0);
});

test("F-72: rule shown and override persists after reload", async ({ page }) => {
  await seed(page, { profileCode: RICH });
  await page.goto("/me/");
  await expect(page.getByText("High (raised by total spend)")).toBeVisible();
  await expect(page.getByText("Product rule, not a game fact")).toBeVisible();
  await page.getByRole("radio", { name: /^Whale/ }).check();
  await expect(page.getByText("Whale (set by hand)")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio", { name: /^Whale/ })).toBeChecked();
  expect((await stored(page)).profileOverride).toBe("whale");
  await page.getByRole("radio", { name: "Automatic (recommended)" }).check();
  await page.reload();
  await expect(page.getByRole("radio", { name: "Automatic (recommended)" })).toBeChecked();
  expect((await stored(page)).profileOverride).toBeNull();
});

test("Edit answers clears the draft and opens /start/ with the saved answers", async ({ page }) => {
  await seed(page, { profileCode: CODE, draft: { step: 2, answers: { spending: "whale" } } });
  await page.goto("/me/");
  await page.getByRole("button", { name: "Edit answers" }).click();
  await page.waitForURL(/\/start\/$/);
  await expect(h1(page)).toHaveText("Check your answers");
  await expect(page.getByText("Farm account")).toBeVisible();
  await expect(page.getByText("Whale")).toHaveCount(0);
});

test("theme change applies and persists", async ({ page }) => {
  await page.goto("/me/");
  const main = page.locator("main");
  await main.getByRole("radio", { name: "Light" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("[data-theme-picker] input[value=light]").first()).toBeChecked();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(main.getByRole("radio", { name: "Light" })).toBeChecked();
  await main.getByRole("radio", { name: "System" }).check();
  await expect.poll(() => page.evaluate(() => document.documentElement.hasAttribute("data-theme"))).toBe(false);
  expect((await stored(page)).theme).toBe("system");
});

test("export downloads a JSON file that import accepts", async ({ page }) => {
  await seed(page, { profileCode: CODE, theme: "light", commanders: { minamoto: { q1: "a" } } });
  await page.goto("/me/");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export profile file" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^kingdomops-\d{4}-\d{2}-\d{2}\.json$/);
  const text = await readFile((await download.path())!, "utf8");
  expect(importStore(text)).toMatchObject({ profileCode: CODE, theme: "light", commanders: { minamoto: { q1: "a" } } });
});

test("import restores a valid file and rejects an invalid one", async ({ page }) => {
  await seed(page, { profileCode: CODE });
  await page.goto("/me/");
  // The profile renders only after the island has hydrated and read the store: no lost change events.
  await expect(page.getByRole("button", { name: "Edit answers" })).toBeVisible();
  const input = page.locator("input[type=file]:not([data-backup-file])");

  await input.setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from("{\"hello\":1}") });
  await expect(page.getByRole("alert")).toContainText("not a KingdomOps export");
  expect((await stored(page)).profileCode).toBe(CODE);

  const backup = JSON.stringify({ app: "kingdomops", v: 1, profileCode: RICH, theme: "light", profileOverride: "kraken", draft: null, routine: null, routinePrefs: null, commanders: {} });
  await input.setInputFiles({ name: "good.json", mimeType: "application/json", buffer: Buffer.from(backup) });
  await expect(page.getByText(/^Imported\./)).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText("");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByText("Kraken (set by hand)")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Kraken (set by hand)")).toBeVisible();
  expect(await stored(page)).toMatchObject({ profileCode: RICH, theme: "light", profileOverride: "kraken" });
});

test("delete: cancel keeps data, confirm removes it", async ({ page }) => {
  await seed(page, { profileCode: CODE, theme: "light" });
  await page.goto("/me/");
  const trigger = page.getByRole("button", { name: "Delete all data" });

  await trigger.click();
  await expect(page.getByRole("heading", { name: "Delete everything?" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("button", { name: "Cancel" }).click();
  expect((await stored(page)).profileCode).toBe(CODE);

  // Every other store, the webhook secret and a session flag must go too (Q2 P1-1).
  await page.evaluate(() => {
    for (const k of ["ko:card:v1", "ko:crest:v1", "ko:tools:v1", "ko:farms:v1", "ko:kingdom:v1", "ko:kingdom:webhook:v1"]) localStorage.setItem(k, "{\"v\":1}");
    sessionStorage.setItem("ko:sting", "1");
    localStorage.setItem("not-ours", "keep");
  });
  await trigger.click();
  await expect(page.locator("[data-delete-list]")).toContainText("Discord webhook URL");
  await expect(page.locator("[data-delete-list]")).toContainText("Farms & shipment log");
  await page.getByRole("checkbox", { name: /Also remove the offline copy/ }).check();
  await page.getByRole("button", { name: "Delete everything" }).click();
  await expect(page.getByText(/Everything KingdomOps saved in this browser was deleted, including the Discord webhook URL/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Build my guide" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const left = await page.evaluate(() => ({
    local: Object.keys(localStorage).filter((k) => k.startsWith("ko:")),
    session: Object.keys(sessionStorage).filter((k) => k.startsWith("ko:")),
    other: localStorage.getItem("not-ours"),
  }));
  expect(left).toEqual({ local: [], session: [], other: "keep" });
  await page.reload();
  await expect(page.getByRole("link", { name: "Build my guide" })).toBeVisible();
});

test("accounts: save main and farm, switch, remove", async ({ page }) => {
  await seed(page, { profileCode: RICH });
  await page.goto("/me/");
  const name = page.getByLabel("Save the current profile as");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator("#me-acc-error")).toContainText("Give this account a name");
  await name.fill("Main");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".me-account")).toHaveCount(1);
  await expect(page.locator(".me-account").getByText("In use")).toBeVisible();

  // Make the farm the current profile (as /start would), then save it too.
  await page.evaluate((code) => {
    const s = JSON.parse(localStorage.getItem("ko:v1")!);
    localStorage.setItem("ko:v1", JSON.stringify({ ...s, profileCode: code }));
  }, CODE);
  await page.reload();
  await name.fill("Farm 1");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".me-account")).toHaveCount(2);

  await page.getByRole("button", { name: "Use Main" }).click();
  await expect(page.getByText('Now using "Main".')).toBeVisible();
  expect((await stored(page)).profileCode).toBe(RICH);
  await page.reload();
  await expect(page.getByRole("button", { name: "Use Farm 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use Main" })).toHaveCount(0);

  await page.getByRole("button", { name: "Remove Farm 1" }).click();
  await expect(page.locator(".me-account")).toHaveCount(1);
  const s = await stored(page);
  expect(s.savedProfiles.map((p: { name: string }) => p.name)).toEqual(["Main"]);
  expect(s.profileCode).toBe(RICH);
});

test("360 px: no sideways scroll with the worst-case profile and confirmation open", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await seed(page, { profileCode: "1.5.4.4.25.1440.24.5000.10000000.byzantium.1", profileOverride: "kraken" });
  await page.goto("/me/");
  await expect(page.getByText("10,000,000 USD")).toBeVisible();
  await page.getByRole("button", { name: "Delete all data" }).click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe("accessibility", () => {
  for (const theme of ["dark", "light"] as const) {
    for (const c of [
      { name: "empty", store: {} },
      { name: "profile", store: { profileCode: RICH } },
      {
        name: "saved accounts",
        store: { profileCode: RICH, savedProfiles: [{ id: "m", name: "Main", code: RICH, override: null }, { id: "f", name: "Farm 1", code: CODE, override: null }] },
      },
      { name: "delete confirmation", store: { profileCode: RICH }, confirm: true },
    ]) {
      test(`axe ${theme}: ${c.name}`, async ({ page }) => {
        await seed(page, { theme, ...c.store });
        await page.goto("/me/");
        await expect(h1(page)).toBeVisible();
        await expect(page.getByRole("button", { name: "Export profile file" })).toBeVisible();
        if (c.confirm) {
          await page.getByRole("button", { name: "Delete all data" }).click();
          await expect(page.getByRole("button", { name: "Delete everything" })).toBeVisible();
        }
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
