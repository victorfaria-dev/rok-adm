// Wave D calculators: /tools/speedups/, /tools/buildings/, /tools/healing/, /tools/action-points/.
// Expected numbers are computed here from the real generated tables, not copied from the page.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { formatDuration } from "../../../../packages/planner/src/tools/time";
import { axeViolations, hydrated, noSidewaysScroll, openInTheme, toolsStore } from "./helpers";

type Row = Record<string, string | number | null>;
const TABLES = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../packages/data/generated/tables");
const table = (name: string): Row[] => (JSON.parse(readFileSync(`${TABLES}/${name}.json`, "utf8")) as { rows: Row[] }).rows;
const num = (c: unknown): number => (typeof c === "number" ? c : Number(String(c ?? "").replace(/,/g, "")) || 0);
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const rowAt = (rows: Row[], lv: number) => rows.find((r) => num(r.Level ?? r.Lvl) === lv)!;
const value = (page: Page, id: string) => page.getByTestId(id).locator(".t-value");

const ROUTES = ["/tools/speedups/", "/tools/buildings/", "/tools/healing/", "/tools/action-points/"];

test.describe("speedups", () => {
  test("adds up by type, saves minutes to the shared inventory, compares with a job", async ({ page }) => {
    await page.goto("/tools/speedups/");
    await hydrated(page);
    await page.getByLabel("Universal 5m", { exact: true }).fill("16");
    await page.getByLabel("Universal 60m", { exact: true }).fill("2");
    await expect(value(page, "sp-total-universal")).toHaveText(formatDuration(200 * 60));
    await page.getByLabel("Speedup type to enter").selectOption("healing");
    await page.getByLabel("Healing 24h", { exact: true }).fill("1");
    await expect(value(page, "sp-total-healing")).toHaveText("1d");
    await expect(value(page, "sp-total-all")).toHaveText(formatDuration((200 + 1440) * 60));
    await expect(page.getByTestId("sp-total-all")).toContainText("A04-0007");

    const helps = num(rowAt(table("A01-buildings-alliance-center"), 14)["Times You Can Be Helped"]);
    await page.getByLabel("Job time").fill("10h");
    await page.getByLabel("Job type").selectOption("building");
    await page.getByLabel("Your Alliance Center level").selectOption("14");
    const helped = 36000 * helps / 100, remaining = 36000 - helped;
    await expect(value(page, "sp-helps")).toHaveText(`${formatDuration(helped)} (${helps} helps)`);
    await expect(page.getByTestId("sp-helps")).toContainText("A10-0006");
    await expect(value(page, "sp-remaining")).toHaveText(formatDuration(remaining));
    await expect(value(page, "sp-cover")).toHaveText(`No, short by ${formatDuration(remaining - 200 * 60)}`);

    await page.getByLabel("Job type").selectOption("training");
    await expect(value(page, "sp-helps")).toHaveText("None: training cannot be helped");

    const s = await toolsStore(page);
    expect(s).toMatchObject({ v: 1, inventory: { speedupUniversalMin: 200, speedupHealingMin: 1440 }, inputs: { speedups: { universal_5: 16, healing_1440: 1 } } });
    expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();

    // The healing planner reads the healing minutes from the shared inventory.
    await page.goto("/tools/healing/");
    await hydrated(page);
    await expect(page.getByLabel("Healing speedups you hold")).toHaveValue("1440");
  });

  test("a bad job time shows an error", async ({ page }) => {
    await page.goto("/tools/speedups/");
    await hydrated(page);
    await page.getByLabel("Job time").fill("soon");
    await expect(page.getByText("Enter a time like 2d 4h 30m.")).toBeVisible();
    await expect(page.getByLabel("Job time")).toHaveAttribute("aria-invalid", "true");
  });
});

test.describe("buildings", () => {
  test("sums the hospital table between two levels", async ({ page }) => {
    const rows = table("A01-buildings-hospital");
    const range = rows.filter((r) => num(r.Level) > 9 && num(r.Level) <= 15);
    const sum = (k: string) => range.reduce((a, r) => a + num(r[k]), 0);
    const secs = sum("time_seconds");

    await page.goto("/tools/buildings/");
    await hydrated(page);
    await page.getByLabel("Building", { exact: true }).selectOption({ label: "Hospital" });
    await page.getByLabel("Current level").selectOption("9");
    await page.getByLabel("Target level").selectOption("15");
    await expect(value(page, "b-food")).toHaveText(fmt(sum("food")));
    await expect(value(page, "b-wood")).toHaveText(fmt(sum("wood")));
    await expect(value(page, "b-stone")).toHaveText(sum("stone") ? fmt(sum("stone")) : "None");
    await expect(value(page, "b-time")).toHaveText(formatDuration(secs));
    await expect(page.getByTestId("b-food")).toContainText("A01-0004");
    await page.getByLabel("Your build speed bonus").fill("25");
    await expect(value(page, "b-time-buffed")).toHaveText(formatDuration(secs / 1.25));
    await expect(page.getByTestId("b-time-buffed")).toContainText("pending measurement");
    await expect(value(page, "b-req")).toHaveText(String(rowAt(rows, 15).Requirements));

    const s = await toolsStore(page);
    expect(s).toMatchObject({ v: 1, inputs: { buildings: { building: "A01-buildings-hospital", from: 9, to: 15, bonusPct: 25 } } });
    expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();
    await page.reload();
    await hydrated(page);
    await expect(value(page, "b-food")).toHaveText(fmt(sum("food")));
  });

  test("counts Book of Covenant, handles equal levels, bad ranges and garbled rows", async ({ page }) => {
    const castle = table("A01-buildings-castle");
    const books = castle.filter((r) => num(r.Level) > 1 && num(r.Level) <= 4)
      .reduce((a, r) => a + Number(/x(\d+)/.exec(String(r.extra_cost))?.[1] ?? 0), 0);
    await page.goto("/tools/buildings/");
    await hydrated(page);
    await page.getByLabel("Building", { exact: true }).selectOption({ label: "Castle" });
    await page.getByLabel("Current level").selectOption("1");
    await page.getByLabel("Target level").selectOption("4");
    await expect(value(page, "b-items")).toHaveText(`Book of Covenant ×${books}`);

    await page.getByLabel("Current level").selectOption("4");
    await expect(page.getByTestId("b-same")).toBeVisible();
    await expect(value(page, "b-food")).toHaveText("None");

    await page.getByLabel("Current level").selectOption("6");
    await expect(page.getByTestId("b-error")).toHaveText("Pick a target level above your current level.");

    await page.getByLabel("Building", { exact: true }).selectOption({ label: "Farm" });
    await page.getByLabel("Current level").selectOption("24");
    await page.getByLabel("Target level").selectOption("25");
    await expect(page.getByTestId("b-food")).toContainText("Level 25 left out");
  });
});

test.describe("healing", () => {
  test("capacity, overflow and the cost of one full wave", async ({ page }) => {
    const cap15 = num(rowAt(table("A01-buildings-hospital"), 15)["Hospital Capacity"]);
    const all = cap15 * 4;
    await page.goto("/tools/healing/");
    await hydrated(page);
    await page.getByLabel("Hospital level").selectOption("15");
    await page.getByLabel("Hospitals in your city").fill("4");
    await expect(value(page, "h-cap-one")).toHaveText(`${fmt(cap15)} troops`);
    await expect(page.getByTestId("h-cap-one")).toContainText("A01-0008");
    await expect(value(page, "h-cap-all")).toHaveText(`${fmt(all)} troops`);
    await page.getByLabel("Wounded you expect in a fight").fill(String(all + 14000));
    await expect(value(page, "h-dead")).toHaveText("14,000 troops");
    await expect(page.getByTestId("h-dead")).toContainText("A08-0502");

    await expect(value(page, "h-wave-cost")).toHaveText("Enter the heal cost per troop from your hospital screen");
    await expect(value(page, "h-wave-time")).toHaveText("Enter the heal time per troop from your hospital screen");
    await page.getByLabel("Food per troop").fill("10");
    await expect(value(page, "h-wave-cost")).toHaveText(`Food ${fmt(all * 10)} · Wood 0 · Stone 0 · Gold 0`);
    await page.getByLabel("Heal time per troop").fill("2");
    await page.getByLabel("Healing speedups you hold").fill("1440");
    await expect(value(page, "h-wave-time")).toHaveText(formatDuration(all * 2));
    await expect(value(page, "h-wave-speedups")).toHaveText(formatDuration(all * 2 - 1440 * 60));
    await expect(page.locator(".t-callout")).toContainText("T5 heals cost much more");
    await expect(page.locator(".t-callout")).toContainText("A08-0505");

    const s = await toolsStore(page);
    expect(s).toMatchObject({ v: 1, inventory: { speedupHealingMin: 1440 }, inputs: { healing: { hospitalLevel: 15, hospitals: 4, healFood: 10 } } });
    expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();
  });
});

test.describe("action points", () => {
  test("chain, daily claim, gem packs and regen", async ({ page }) => {
    await page.goto("/tools/action-points/");
    await hydrated(page);
    // 1,000 AP: 50+48+46+44+42 = 230, then 40 each → 5 + 19 attacks, 10 left.
    await expect(value(page, "ap-chain-now")).toHaveText("24 attacks (990 AP, 10 left)");
    await expect(page.getByTestId("ap-chain-now")).toContainText("A09-0002");
    await expect(value(page, "ap-claim")).toHaveText("1,500 AP");
    await expect(value(page, "ap-chain-after")).toHaveText("36 attacks");
    await page.getByLabel("AP packs bought with gems today").fill("2");
    await page.getByLabel("Packs you want to buy now").fill("3");
    await expect(value(page, "ap-gems")).toHaveText("750 gems");
    await expect(page.getByTestId("ap-gems")).toContainText("A04-0008");
    await expect(value(page, "ap-total")).toHaveText("3,000 AP");
    await expect(value(page, "ap-regen")).toHaveText("Enter the AP you regain per hour");
    await page.getByLabel("AP you regain per hour").fill("60");
    await expect(value(page, "ap-regen")).toHaveText("8h 20m");
    await page.getByLabel("Your Action Points now").fill("1500");
    await expect(value(page, "ap-claim")).toHaveText("Cannot claim: you are at or above the 1,500 cap");
    await page.getByLabel("Your Action Points now").fill("1200");
    await expect(value(page, "ap-claim")).toHaveText("1,700 AP (200 over the 1,500 cap)");

    const s = await toolsStore(page);
    expect(s).toMatchObject({ v: 1, inputs: { ap: { currentAp: 1200, purchasesToday: 2, packsToBuy: 3, regenPerHour: 60 } } });
    expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("every calculator renders its defaults and sources", async ({ page }) => {
    const ch10 = rowAt(table("A01-city-hall"), 10);
    await page.goto("/tools/buildings/");
    await expect(value(page, "b-food")).toHaveText(fmt(num(ch10.food)));
    await expect(page.getByRole("heading", { name: "Sources on this page" })).toBeVisible();
    await page.goto("/tools/speedups/");
    await expect(value(page, "sp-total-all")).toHaveText("0m");
    await page.goto("/tools/healing/");
    await expect(value(page, "h-cap-one")).toHaveText(`${fmt(num(rowAt(table("A01-buildings-hospital"), 10)["Hospital Capacity"]))} troops`);
    await page.goto("/tools/action-points/");
    await expect(value(page, "ap-chain-now")).toHaveText("24 attacks (990 AP, 10 left)");
    for (const r of ROUTES) {
      await page.goto(r);
      await expect(page.getByText(/latest official patch/)).toBeVisible();
      await expect(page.getByRole("button", { name: "Copy link to these inputs" })).toBeVisible();
    }
  });
});

for (const route of ROUTES) {
  test(`no sideways scroll at 360px ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(route);
    await hydrated(page);
    await noSidewaysScroll(page);
  });
  for (const theme of ["dark", "light"] as const) {
    test(`axe ${theme} ${route}`, async ({ page }) => {
      await openInTheme(page, route, theme);
      await hydrated(page);
      expect(await axeViolations(page)).toEqual([]);
      await noSidewaysScroll(page);
    });
  }
}

// Q2 P2-7: axe best-practice landmark-unique (not in the WCAG tag set above) on every tool page.
for (const route of ["/tools/gems/", "/tools/hoard/", "/tools/vip/", "/tools/migration/", "/tools/safety/", "/tools/zeroed/", ...ROUTES]) {
  test(`landmarks have unique names ${route}`, async ({ page }) => {
    await page.goto(route);
    await hydrated(page);
    const result = await new AxeBuilder({ page }).withRules(["landmark-unique", "landmark-no-duplicate-main"]).analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
