import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// @rokadm/planner imports JSON without import attributes, which Playwright's loader rejects,
// so read the generated Trading Post table directly (A03-0024) and pin the CSV header.
const TP_TABLE = JSON.parse(readFileSync(new URL("../../../packages/planner/data/trading-post.json", import.meta.url), "utf8")) as { levels: { level: number; taxRate: number }[] };
const KEY = "ko:farms:v1";
const TP1_TAX = TP_TABLE.levels.find((l) => l.level === 1)!.taxRate;
const LEDGER_CSV_HEADER = ["date", "farm", "resource", "gross", "tax_rate", "net", "note"];

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

async function noSideways(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** A filled store: two farms, one shipment today. */
async function seedFilled(page: Page) {
  const today = localDay();
  const farm = (id: string, name: string, tp: number | null, until: string | null) => ({
    id, name, role: "food", note: "North of the lake", levels: { cityHall: 15, tradingPost: tp, goldmine: null, academy: 9, commanderLevel: 30 },
    gatheringUntil: until, daily: { date: today, done: ["gather-territory"] }, goal: { resource: "food", amount: 500000 }, createdAt: new Date().toISOString(),
  });
  const store = {
    v: 1, showHypotheses: false,
    farms: [farm("fa", "Alpha", 1, null), farm("fb", "Beta with a rather long farm name", 5, new Date(Date.now() + 90 * 60000).toISOString())],
    shipments: [{ id: "s1", farmId: "fa", date: today, resource: "food", gross: 200000, taxRate: TP1_TAX, net: 130000, note: "first run" }],
  };
  await page.goto("/");
  await page.evaluate(([k, s]) => localStorage.setItem(k as string, JSON.stringify(s)), [KEY, store] as const);
}

test.describe("farm hub pages render", () => {
  for (const route of ["/farms/", "/farms/log/"]) {
    for (const state of ["empty", "filled"] as const) {
      test(`${route} ${state}: one h1, guardrail, no console errors, no sideways scroll at 360px`, async ({ page }) => {
        const errors = watchErrors(page);
        await page.setViewportSize({ width: 360, height: 780 });
        if (state === "filled") await seedFilled(page);
        const res = await page.goto(route);
        expect(res?.status()).toBe(200);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator("[data-guardrail]")).toHaveText("Planning and bookkeeping only. You do every in-game action yourself.");
        await expect(page.getByRole("navigation", { name: "Farm hub" })).toBeVisible();
        if (route === "/farms/") {
          await expect(page.getByRole("heading", { level: 2, name: state === "empty" ? "Track your farm accounts" : "Visit next" })).toBeVisible();
        } else {
          await expect(page.getByRole("heading", { level: 2, name: state === "empty" ? "Add a farm first" : "Log a shipment" })).toBeVisible();
        }
        await page.evaluate(() => document.querySelectorAll<HTMLDetailsElement>("#main details").forEach((d) => { d.open = true; }));
        await noSideways(page);
        expect(errors).toEqual([]);
      });
    }
  }
});

test("farms: add two, set gathering and a daily task, reload keeps everything", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/farms/");
  await page.getByRole("button", { name: "Add a farm" }).click();
  await expect(page.getByLabel("Name")).toBeFocused();
  await page.getByRole("button", { name: "Add farm" }).click();
  await expect(page.getByText("Give the farm a name.")).toBeVisible();
  await page.getByLabel("Name").fill("Alpha");
  await page.getByRole("radio", { name: "Food" }).check();
  await page.getByLabel("Trading Post").fill("1");
  await page.getByLabel("City Hall").fill("40");
  await page.getByRole("button", { name: "Add farm" }).click();
  await expect(page.getByText(/City Hall: enter a whole number from 1 to 25/)).toBeVisible();
  await expect(page.getByLabel("City Hall")).toBeFocused();
  await page.getByLabel("City Hall").fill("14");
  await page.getByRole("button", { name: "Add farm" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Alpha" })).toBeFocused();

  await page.getByRole("button", { name: "Add a farm" }).click();
  await page.getByLabel("Name").fill("Beta");
  await page.getByRole("button", { name: "Add farm" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Beta" })).toBeFocused();

  const alpha = page.locator("article", { has: page.getByRole("heading", { level: 3, name: "Alpha" }) });
  const beta = page.locator("article", { has: page.getByRole("heading", { level: 3, name: "Beta" }) });
  await beta.getByRole("button", { name: "+2 h" }).click();
  await alpha.getByRole("button", { name: "+4 h" }).click();
  await expect(beta.getByText(/Gathering: back in 2 h/)).toBeVisible();
  const visit = page.locator(".fh-visit-list li");
  await expect(visit.nth(0)).toContainText("Beta");
  await expect(visit.nth(0)).toContainText("back in 2 h");
  await expect(visit.nth(1)).toContainText("Alpha");

  const task = alpha.getByRole("checkbox", { name: "Gather inside alliance territory" });
  await task.check();
  await expect(alpha.getByText(/Today's checklist: 1 of/)).toBeVisible();
  await expect(alpha.getByRole("link", { name: /Build path/ })).toHaveAttribute("href", /\/farms\/build\/\?farm=/);

  await page.reload();
  await expect(page.getByRole("heading", { level: 3, name: "Alpha" })).toBeVisible();
  await expect(alpha.getByRole("checkbox", { name: "Gather inside alliance territory" })).toBeChecked();
  await expect(alpha.getByText("City Hall 14 · Trading Post 1")).toBeVisible();
  await expect(page.locator(".fh-visit-list li").nth(0)).toContainText("Beta");
  const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), KEY);
  expect(stored.farms.map((f: { name: string }) => f.name)).toEqual(["Alpha", "Beta"]);
  expect(stored.farms[0].daily.done).toEqual(["gather-territory"]);
  expect(stored.farms[1].gatheringUntil).not.toBeNull();

  // Edit, then delete with the inline confirm.
  await alpha.getByRole("button", { name: "Edit Alpha" }).click();
  await page.getByLabel("Name").fill("Alpha Prime");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Alpha Prime" })).toBeFocused();
  await beta.getByRole("button", { name: "Delete Beta" }).click();
  await beta.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Beta" })).toHaveCount(0);
  await expect(page.locator("#fh-list-h")).toBeFocused();

  await page.getByRole("button", { name: "Delete all farm data" }).click();
  await page.getByRole("button", { name: "Yes, delete all" }).click();
  await expect(page.getByRole("heading", { name: "Track your farm accounts" })).toBeVisible();
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
  expect(errors).toEqual([]);
});

test("shipment log: gross → net with table tax, weekly summary, CSV, delete", async ({ page }) => {
  const errors = watchErrors(page);
  await seedFilled(page);
  await page.goto("/farms/log/?farm=fa");
  await expect(page.getByLabel("Farm", { exact: true })).toHaveValue("fa");
  const tax = page.getByLabel("Trading Post tax (%)");
  await expect(tax).toHaveValue(String(Math.round(TP1_TAX * 100)));
  await expect(page.locator("#fl-tax-hint")).toHaveAttribute("data-tax-source", "table");
  await expect(page.getByLabel("Date sent")).toHaveValue(localDay());

  await page.getByLabel("Amount", { exact: true }).fill("100,000");
  const net = Math.floor(100000 * (1 - TP1_TAX) + 1e-6);
  await expect(page.locator("[data-preview]")).toContainText(`main receives ${net.toLocaleString("en-US")}`);
  await page.getByRole("button", { name: "Add shipment" }).click();
  await expect(page.getByLabel("Amount", { exact: true })).toBeFocused();
  await expect(page.locator("[data-shipment]")).toHaveCount(2);
  await expect(page.locator("[data-total-net]")).toHaveText((130000 + net).toLocaleString("en-US"));
  await expect(page.getByRole("table", { name: "By resource" })).toContainText("Food");

  await page.getByLabel("Resource").selectOption("gold");
  await expect(page.locator("[data-warning='gold_pending_t0']")).toContainText("not yet confirmed in game");

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Export CSV: shown/ }).click()]);
  expect(download.suggestedFilename()).toBe(`kingdomops-shipments-${localDay()}.csv`);
  const csv = readFileSync((await download.path())!, "utf8").replace(/^﻿/, "");
  const lines = csv.split("\r\n");
  expect(lines[0]).toBe(LEDGER_CSV_HEADER.join(","));
  expect(lines).toContain(`${localDay()},Alpha,food,100000,${TP1_TAX},${net},`);

  await page.reload();
  await expect(page.locator("[data-shipment]")).toHaveCount(2);
  await page.getByRole("button", { name: /^Delete shipment .*first run|^Delete shipment .*200,000/ }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.locator("[data-shipment]")).toHaveCount(1);
  await expect(page.locator("#fl-list-h")).toBeFocused();
  const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), KEY);
  expect(stored.shipments.map((s: { gross: number }) => s.gross)).toEqual([100000]);

  // Week navigation: last week is empty.
  await page.getByRole("button", { name: "Previous week" }).click();
  await expect(page.getByText("No shipments this week.")).toBeVisible();
  await page.getByRole("button", { name: "This week" }).click();
  await expect(page.locator("[data-shipment]")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test.describe("farm hub accessibility", () => {
  for (const theme of ["dark", "light"] as const) {
    for (const route of ["/farms/", "/farms/log/"]) {
      for (const state of ["empty", "filled"] as const) {
        test(`axe ${theme} ${route} ${state}`, async ({ page }) => {
          if (state === "filled") await seedFilled(page);
          else await page.goto("/");
          await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
          await page.goto(route);
          await page.reload();
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          await expect(page.locator("h2").first()).toBeVisible();
          if (route === "/farms/log/" && state === "filled") await page.getByLabel("Resource").selectOption("gold");
          await page.evaluate(() => document.querySelectorAll<HTMLDetailsElement>("#main details").forEach((d) => { d.open = true; }));
          const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
          expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
        });
      }
    }
  }
});
