// Wave G: CSV import/export in the council kit (MGE governors + ledger, requirements sandbox roster).
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { gotoHydrated, seed, trackErrors } from "./kingdom-helpers";

const PLAN = {
  id: "p1", kind: "mge", title: "K1 MGE", updatedAt: "2026-10-13T10:00:00.000Z",
  data: {
    id: "p1", updatedAt: "2026-10-13T10:00:00.000Z", title: "K1 MGE", slotsPerEvent: 2, policy: "score", cooldownEvents: 0, applicationsRequired: false,
    candidates: [{ id: "a", name: "Alpha", score: 100, tags: [] }],
    events: [{ id: "e1", date: "2026-10-01", commander: "Cao Cao", applicants: [], overrides: [], locked: false, result: null }],
  },
};

test("MGE: import governors from a CSV, then download the ledger as CSV", async ({ page }) => {
  const errors = trackErrors(page);
  await seed(page, [PLAN]);
  await gotoHydrated(page, "/kingdom/mge/");
  await page.locator('[data-csv-import="mge"]').setInputFiles({
    name: "dkp.csv", mimeType: "text/csv",
    buffer: Buffer.from("Governor;DKP\nalpha;4.2m\n\"Bo, Jr\";\"1,200\"\n'=Cmd;5\nBad;xx\n"),
  });
  await expect(page.locator("[data-cand-status]")).toContainText("Added 2 governors. Updated the score of 1.");
  await expect(page.locator("[data-paste-errors]")).toContainText("Line 5");
  await expect(page.locator("table[data-candidates]")).toContainText("Bo, Jr");
  await expect(page.locator("table[data-candidates]")).toContainText("=Cmd");

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download ledger (.csv)" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^kingdomops-mge-ledger-\d{4}-\d{2}-\d{2}\.csv$/);
  const text = readFileSync((await download.path())!, "utf8").replace(/^﻿/, "");
  const lines = text.split("\r\n");
  expect(lines[0]).toBe("event_date,commander,locked,slot,governor,why");
  expect(lines[1]).toMatch(/^2026-10-01,Cao Cao,no,1,Alpha,/);
  expect(text).not.toContain("4200000");
  await expect(page.locator("[data-csv-status]")).toContainText("CSV ready");
  expect(errors).toEqual([]);
});

test("Requirements: import sample accounts from CSV and export them back", async ({ page }) => {
  const errors = trackErrors(page);
  await gotoHydrated(page, "/kingdom/requirements/");
  await page.locator('[data-csv-import="roster"]').setInputFiles({
    name: "roster.csv", mimeType: "text/csv", buffer: Buffer.from("name,power,t4,t5,deads\nRiver,20m,1m,500k,200k\n,1,1,1,1\n"),
  });
  await expect(page.locator("[data-roster-status]")).toContainText("Added 1 account, updated 0.");
  await expect(page.locator("[data-roster-errors]")).toContainText("Row 3: No name on this row.");
  await expect(page.getByRole("group", { name: "River" })).toBeVisible();
  await expect(page.locator("[data-result]")).toHaveCount(4);

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export accounts (CSV)" }).click()]);
  const text = readFileSync((await download.path())!, "utf8");
  expect(text).toContain("River,20000000,");
  expect(text.split("\r\n")[0]).toContain("name,power,t1,t2,t3,t4,t5,deads,kp,dkp,target,percent_of_target,result");
  expect(errors).toEqual([]);
});
