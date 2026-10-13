import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const CODE = "1.0.0.0.12.30.....0"; // F2P, CH 12, 30 min/day
const tasks = (page: Page) => page.locator(".rt-task input[type=checkbox]");
const progress = (page: Page) => page.locator(".rt-progress");

/** Seed localStorage before the island reads it. */
async function seed(page: Page, store: object) {
  await page.goto("/");
  await page.evaluate((s) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: "dark", ...s })), store);
}

/** Open /routine/ and wait until the island has read the saved state. */
async function open(page: Page) {
  await page.goto("/routine/");
  await expect(page.locator(".rt[data-ready]")).toBeAttached();
}

const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("ko:v1") ?? "{}"));
/** Game day (UTC, A10-0001) as YYYY-MM-DD in the browser, `offset` days from today. */
const localDay = (page: Page, offset = 0) =>
  page.evaluate((o) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + o);
    return d.toISOString().slice(0, 10);
  }, offset);

test("renders the plan for a saved profile", async ({ page }) => {
  await seed(page, { profileCode: CODE });
  await open(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today's routine");
  await expect(page.getByRole("link", { name: "F2P · CH 12" })).toHaveAttribute("href", "/me/");
  await expect(page.getByText("Set up your profile")).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "My usual (30 min)" })).toBeChecked();
  expect(await tasks(page).count()).toBeGreaterThan(0);
  await expect(page.getByText(/pending measurement/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reality check" })).toBeVisible();
});

test("without a profile: default plan and a set-up banner", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("link", { name: "Set up your profile" })).toHaveAttribute("href", "/start/");
  expect(await tasks(page).count()).toBeGreaterThan(0);
});

test("budget change changes the list and is saved", async ({ page }) => {
  await seed(page, { profileCode: CODE });
  await open(page);
  await expect(page.getByRole("radio", { name: "My usual (30 min)" })).toBeChecked();
  const at30 = await tasks(page).count();
  await page.getByRole("radio", { name: "15 min" }).check();
  await expect(tasks(page)).not.toHaveCount(at30);
  const at15 = await tasks(page).count();
  expect(at15).toBeLessThan(at30);
  expect((await stored(page)).routinePrefs).toEqual({ minutes: 15, breakMode: false });
  await page.reload();
  await expect(page.locator(".rt[data-ready]")).toBeAttached();
  await expect(page.getByRole("radio", { name: "15 min" })).toBeChecked();
  await expect(tasks(page)).toHaveCount(at15);
});

test("check-off persists after reload and resets on a new day", async ({ page }) => {
  await page.goto("/");
  const yesterday = await localDay(page, -1);
  await seed(page, { profileCode: CODE, routine: { date: yesterday, done: ["vip-claim", "queues", "daily-ap-claim"] } });
  await open(page);
  const total = await tasks(page).count();
  await expect(progress(page)).toHaveText(`0 of ${total} done`);
  for (let i = 0; i < total; i++) await expect(tasks(page).nth(i)).not.toBeChecked();

  await tasks(page).first().check();
  await tasks(page).nth(1).check();
  await expect(progress(page)).toHaveText(`2 of ${total} done`);
  const s = await stored(page);
  expect(s.routine.date).toBe(await localDay(page));
  expect(s.routine.done).toHaveLength(2);

  await page.reload();
  await expect(page.locator(".rt[data-ready]")).toBeAttached();
  await expect(tasks(page).first()).toBeChecked();
  await expect(tasks(page).nth(1)).toBeChecked();
  await expect(progress(page)).toHaveText(`2 of ${total} done`);
});

test("Break Mode shows the minimal set and persists", async ({ page }) => {
  await seed(page, { profileCode: CODE });
  await open(page);
  const sw = page.getByRole("switch", { name: /Break Mode/ });
  await sw.check();
  await expect(page.getByRole("heading", { name: "Break Mode: the minimum" })).toBeVisible();
  await expect(page.locator("#rt-task-queues")).toBeAttached();
  await expect(page.locator("#rt-task-gathering")).toBeAttached();
  await expect(page.getByText(/^Planned: .* min \(Break Mode\)\.$/)).toBeVisible();
  await expect(page.getByText(/Safe to drop while paused/)).toBeVisible();
  await expect(page.getByText(/Pending research:/).first()).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  const daily = await tasks(page).count();
  expect(daily).toBeGreaterThan(0);
  expect((await stored(page)).routinePrefs.breakMode).toBe(true);
  await page.reload();
  await expect(page.locator(".rt[data-ready]")).toBeAttached();
  await expect(page.getByRole("switch", { name: /Break Mode/ })).toBeChecked();
  await expect(tasks(page)).toHaveCount(daily);
  await page.getByRole("switch", { name: /Break Mode/ }).uncheck();
  await expect(page.getByRole("radio", { name: "15 min" })).toBeVisible();
});

test("calendar file downloads with a daily event", async ({ page }) => {
  await seed(page, { profileCode: CODE });
  await open(page);
  await page.getByLabel("Reminder time").fill("07:30");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download calendar file" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("kingdomops-routine.ics");
  const text = readFileSync((await download.path())!, "utf8");
  expect(text.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
  expect(text).toContain("RRULE:FREQ=DAILY");
  expect(text).toMatch(/DTSTART:\d{8}T073000\r\n/);
  expect(text).toContain("SUMMARY:KingdomOps routine (");
  await expect(page.getByText("Saved kingdomops-routine.ics", { exact: false })).toBeVisible();

  // Q2 P2-9 / P3: in Break Mode the file follows the Break Mode list, and DURATION matches its minutes.
  await page.getByRole("switch", { name: /Break Mode/ }).check();
  const planned = Number(/Planned: ([\d.]+) of/.exec((await page.getByText(/^Planned:/).textContent()) ?? "")![1]);
  const [second] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download calendar file" }).click()]);
  const ics = readFileSync((await second.path())!, "utf8").replace(/\r\n /g, "");
  expect(ics).toContain(`SUMMARY:KingdomOps routine (${planned} min)`);
  expect(ics).toContain(`DURATION:PT${Math.max(1, Math.ceil(planned))}M`);
  expect(ics).toContain("Refill queues");
});

test("no sideways scroll at 360 px, in both modes", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const breakMode of [false, true]) {
    await seed(page, { profileCode: "1.5.0.0.25.1440.24.5000.10000000..1", routinePrefs: { minutes: null, breakMode } });
    await open(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.locator("details").evaluateAll((ds) => ds.forEach((d) => ((d as HTMLDetailsElement).open = true)));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `breakMode=${breakMode}`).toBeLessThanOrEqual(0);
  }
});

test.describe("accessibility", () => {
  for (const theme of ["dark", "light"] as const) {
    for (const breakMode of [false, true]) {
      test(`axe ${theme}${breakMode ? " Break Mode" : ""}`, async ({ page }) => {
        await seed(page, { theme, profileCode: CODE, routinePrefs: { minutes: null, breakMode } });
        await open(page);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await tasks(page).first().check();
        await page.locator("details").evaluateAll((ds) => ds.forEach((d) => ((d as HTMLDetailsElement).open = true)));
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
