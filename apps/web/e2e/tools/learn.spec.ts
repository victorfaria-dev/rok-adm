// Wave D "learn" pages: /glossary/ (F-88), /changes/ (F-28), /tools/safety/ (F-32, F-82), /tools/zeroed/ (F-13).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { patchesSince, type PatchRow } from "@rokadm/planner/tools";
import { axeViolations, hydrated, noSidewaysScroll, openInTheme, toolsStore } from "./helpers";

const here = dirname(fileURLToPath(import.meta.url));
const patches = JSON.parse(readFileSync(join(here, "../../../../packages/data/generated/patches.json"), "utf8")) as PatchRow[];
const glossary = JSON.parse(readFileSync(join(here, "../../../../packages/planner/tools-data/glossary.json"), "utf8")) as { terms: { id: string }[] };

const ROUTES = ["/glossary/", "/changes/", "/tools/safety/", "/tools/zeroed/"] as const;

test.describe("glossary", () => {
  test("search filters by term, alias and definition, with a live count", async ({ page }) => {
    await page.goto("/glossary/");
    await expect(page.locator("h1")).toHaveText("Glossary");
    await hydrated(page);
    const all = page.locator("[data-glossary-term]");
    await expect(all).toHaveCount(glossary.terms.length);
    const q = page.getByLabel("Search the glossary");
    await q.fill("More Than Gems");
    await expect(page.locator("#more-than-gems")).toBeVisible();
    await expect(page.locator("#dkp")).toBeHidden();
    await expect(page.getByTestId("g-count")).toHaveText(/^\d+ of \d+ terms match$/);
    await q.fill("mtg");
    await expect(page.locator("#more-than-gems")).toBeVisible();
    await q.fill("");
    await expect(page.locator("[data-glossary-term]:visible")).toHaveCount(glossary.terms.length);
  });

  test("empty state says what to do and clears", async ({ page }) => {
    await page.goto("/glossary/");
    await hydrated(page);
    await page.getByLabel("Search the glossary").fill("qwertyzzz");
    await expect(page.getByTestId("g-empty")).toContainText("Try a shorter word");
    await expect(page.getByTestId("g-count")).toHaveText(`0 of ${glossary.terms.length} terms match`);
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(page.getByTestId("g-empty")).toHaveCount(0);
    await expect(page.getByLabel("Search the glossary")).toBeFocused();
    await expect(page.locator("[data-glossary-term]:visible")).toHaveCount(glossary.terms.length);
  });

  test("anchor links target terms, even ones hidden by the filter", async ({ page }) => {
    await page.goto("/glossary/#dkp");
    await expect(page.locator("#dkp")).toBeInViewport();
    await hydrated(page);
    await page.getByLabel("Search the glossary").fill("dkp");
    await expect(page.locator("#t4-t5")).toBeHidden();
    await page.locator("#dkp .g-related").getByRole("link", { name: "T4 / T5" }).click();
    await expect(page).toHaveURL(/#t4-t5$/);
    await expect(page.locator("#t4-t5")).toBeVisible();
    await expect(page.locator("#t4-t5")).toBeInViewport();
  });
});

test.describe("what changed since", () => {
  test("picking a month lists exactly the patches since then, newest first, saved on the device", async ({ page }) => {
    await page.goto("/changes/");
    await hydrated(page);
    await expect(page.locator(".c-patch")).toHaveCount(patches.length);
    await page.getByLabel("When did you stop playing?").selectOption("2025-05");
    const expected = patchesSince(patches, "2025-05");
    await expect(page.getByTestId("c-summary")).toHaveText(`${expected.length} patches since May 2025, newest first.`);
    const shown = await page.locator(".c-patch").evaluateAll((els) => els.map((e) => e.getAttribute("data-version")!));
    expect(new Set(shown)).toEqual(new Set(expected.map((x) => x.patch.version)));
    expect(shown).not.toContain("1.0.92");
    const official = await page.locator('[data-group="c-official"] .c-patch').evaluateAll((els) => els.map((e) => e.getAttribute("data-version")!));
    expect(official).toEqual(expected.filter((x) => x.patch.confidence === "alta").map((x) => x.patch.version));
    await expect(page.locator('.c-patch[data-version="1.0.94"]')).toContainText("Same month you stopped");
    await expect(page.locator('.c-patch[data-version="1.1.12"]')).toContainText("Low confidence");
    expect(await toolsStore(page)).toMatchObject({ v: 1, inputs: { changes: { since: "2025-05" } } });
    await page.reload();
    await hydrated(page);
    await expect(page.getByLabel("When did you stop playing?")).toHaveValue("2025-05");
    await expect(page.locator(".c-patch")).toHaveCount(expected.length);
  });

  test("a month after the last patch says nothing was missed", async ({ page }) => {
    await page.goto("/changes/");
    await hydrated(page);
    const last = patches.map((p) => p.date!.slice(0, 7)).sort().at(-1)!;
    const options = await page.getByLabel("When did you stop playing?").locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    const later = options.find((v) => v > last);
    test.skip(!later, "no month after the last patch in the picker");
    await page.getByLabel("When did you stop playing?").selectOption(later!);
    await expect(page.getByTestId("c-summary")).toContainText("You haven't missed a known update");
    await expect(page.locator(".c-patch")).toHaveCount(0);
  });

  test("links to the migration checker", async ({ page }) => {
    await page.goto("/changes/");
    await expect(page.getByRole("link", { name: /Check whether you can migrate/ })).toHaveAttribute("href", "/tools/migration/");
  });
});

test.describe("play it safe", () => {
  test("FAQ covers the rules and the Discord-link warning", async ({ page }) => {
    await page.goto("/tools/safety/");
    await expect(page.locator("h1")).toHaveText("Play it safe");
    await expect(page.locator("#faq-bots")).toContainText("C02-0002");
    await expect(page.locator("#faq-discord-links")).toContainText("Reported by the community");
    await expect(page.locator("#faq-sharing")).toContainText("C02-0005");
  });

  test("account checklist persists in ko:tools:v1", async ({ page }) => {
    await page.goto("/tools/safety/");
    await hydrated(page);
    const box = page.getByRole("checkbox", { name: /Never share your password/ });
    await box.check();
    expect(await toolsStore(page)).toMatchObject({ v: 1, checks: { "safety-account": ["password"] } });
    await page.reload();
    await hydrated(page);
    await expect(page.getByRole("checkbox", { name: /Never share your password/ })).toBeChecked();
  });

  test("ticket builder writes the typed governor ID and saves nothing", async ({ page }) => {
    await page.goto("/tools/safety/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await hydrated(page);
    await page.getByRole("radio", { name: /Appeal a ban or mute/ }).check();
    await page.getByLabel("Your governor ID").fill("87654321");
    await page.getByLabel("Kingdom number").fill("2708");
    await page.getByLabel("When the ban or mute started").fill("2026-10-12 18:00 UTC");
    await expect(page.getByTestId("s-missing")).toContainText("Why you think it is a mistake");
    await page.getByLabel("Why you think it is a mistake").fill("I only posted rally times in alliance chat.");
    await page.getByLabel(/Screenshots you will attach/).fill("mute notice\nprofile page");
    const out = page.getByLabel("Ticket text to copy");
    await expect(out).toHaveJSProperty("readOnly", true);
    await expect(out).toHaveValue(/Subject: Appeal of a ban or mute/);
    await expect(out).toHaveValue(/Your governor ID: 87654321/);
    await expect(out).toHaveValue(/- profile page/);
    await expect(page.getByTestId("s-missing")).toHaveCount(0);
    await page.getByRole("button", { name: "Copy ticket text" }).click();
    await expect(page.getByRole("status").filter({ hasText: /Copied|Copy didn't work/ })).toBeVisible();
    const stored = await page.evaluate(() => Object.keys(localStorage).map((k) => `${k}=${localStorage.getItem(k)}`).join("\n"));
    expect(stored).not.toContain("87654321");
    expect(stored).not.toContain("rally times");
  });
});

test.describe("zeroed recovery", () => {
  test("log-off checklist has at most 6 items, flags the shield gap and persists", async ({ page }) => {
    await page.goto("/tools/zeroed/");
    await hydrated(page);
    const items = page.locator('[data-checklist="zeroed-logoff"] input[type="checkbox"]');
    expect(await items.count()).toBeLessThanOrEqual(6);
    await expect(page.locator('[data-checklist="zeroed-logoff"]')).toContainText("Pending measurement");
    await expect(page.getByText("Peace shields: pending measurement.")).toBeVisible();
    await page.getByRole("checkbox", { name: /Heal or clear your hospital/ }).check();
    expect(await toolsStore(page)).toMatchObject({ checks: { "zeroed-logoff": ["hospital"] } });
    await expect(page.locator("ol.z-steps > li")).toHaveCount(7);
    await expect(page.getByRole("heading", { name: "If it was your farm" })).toBeVisible();
    await expect(page.locator("main")).toContainText("A13-0005");
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("glossary lists every term, no dead search box", async ({ page }) => {
    await page.goto("/glossary/");
    await expect(page.locator("[data-glossary-term]")).toHaveCount(glossary.terms.length);
    await expect(page.getByLabel("Search the glossary")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Sources on this page" })).toBeVisible();
  });
  test("changes shows the full timeline", async ({ page }) => {
    await page.goto("/changes/");
    await expect(page.locator(".c-patch")).toHaveCount(patches.length);
    await expect(page.getByTestId("c-summary")).toHaveText(`All ${patches.length} patches in our data, newest first.`);
  });
  test("safety shows the FAQ, checklist and ticket form", async ({ page }) => {
    await page.goto("/tools/safety/");
    await expect(page.locator(".s-faq article")).toHaveCount(11);
    await expect(page.getByRole("heading", { name: "Account safety checklist" })).toBeVisible();
    await expect(page.getByLabel("Ticket text to copy")).toBeVisible();
  });
  test("zeroed shows the checklist and the steps", async ({ page }) => {
    await page.goto("/tools/zeroed/");
    await expect(page.getByRole("heading", { name: "30-second log-off check" })).toBeVisible();
    await expect(page.locator("ol.z-steps > li")).toHaveCount(7);
    await expect(page.getByRole("heading", { name: "Sources on this page" })).toBeVisible();
  });
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
    await expect(page.locator("h1")).toHaveCount(1);
  });
}
