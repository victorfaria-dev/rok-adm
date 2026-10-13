import { expect, test } from "@playwright/test";
import { KINGDOM_KEY, expectAxeClean, expectNoSidewaysScroll, expectTargets44, seed, trackErrors } from "./kingdom-helpers";

const DRAFT = {
  id: "d1", kind: "recruit", title: "Kingdom 1234 recruitment post", updatedAt: "2026-10-13T10:00:00.000Z",
  data: {
    kingdom: "1234", stage: "kvk2", stageOther: "", seed: "B", languages: "English", timezones: "UTC", minPower: "30m", minCityHall: "25",
    otherReq: "", offers: ["mge-rules"], roles: [{ role: "garrison-leader", count: 1, note: "infantry" }], migrationNote: "", contact: "DM Ana on Discord",
  },
};

test.describe("recruitment post generator", () => {
  test("renders empty: one h1, guardrails, privacy note, 360px without sideways scroll, 44px targets", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    const res = await page.goto("/kingdom/recruit/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("[data-guardrail]")).toBeVisible();
    await expect(page.locator("[data-chat-warning]")).toContainText("Never paste links in in-game chat");
    await expect(page.locator("[data-privacy]")).toBeVisible();
    await expect(page.locator("#kt-body-out")).toHaveValue("**We are recruiting**");
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("form → post contains the entered roles in every format; drafts save, reopen and delete", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/kingdom/recruit/");
    await page.getByLabel("Kingdom number or name").fill("1234");
    await page.getByLabel("Stage", { exact: true }).selectOption("kvk2");
    await page.getByLabel("Minimum power").fill("30m");
    await page.getByLabel("Minimum City Hall level").fill("25");
    await page.getByLabel("Transparent MGE rules").check();
    await page.getByRole("button", { name: "Add role" }).click();
    await expect(page.getByLabel("Role 1", { exact: true })).toBeFocused();
    await page.locator("#kt-count-0").fill("2");
    await page.locator("#kt-note-0").fill("cavalry");
    await page.getByRole("button", { name: "Add role" }).click();
    await page.getByLabel("Role 2", { exact: true }).selectOption("translator");
    await page.getByLabel("Contact").fill("DM Ana on Discord");

    const body = page.locator("#kt-body-out");
    await expect(body).toHaveValue(/^\*\*Kingdom 1234 is recruiting\*\*/);
    await expect(body).toHaveValue(/- Rally leader ×2 — cavalry\n- Translator/);
    await expect(body).toHaveValue(/- Power: 30M\+/);
    await expect(body).toHaveValue(/- Transparent MGE rules/);
    await expect(body).toHaveValue(/\*\*Contact:\*\* DM Ana on Discord/);
    await expect(page.locator("[data-char-count]")).toContainText("/ 2,000 characters");
    await expect(page.locator("[data-over-limit]")).toHaveCount(0);

    await page.getByLabel("Format").selectOption("reddit");
    await expect(page.locator("#kt-title-out")).toHaveValue("[K1234] KvK2 kingdom recruiting: Rally leader, Translator");
    await page.getByLabel("Format").selectOption("text");
    await expect(body).not.toHaveValue(/\*\*/);
    await expect(body).toHaveValue(/Open roles:\n- Rally leader ×2 — cavalry/);

    await page.getByRole("button", { name: "Remove role 2" }).click();
    await expect(body).not.toHaveValue(/Translator/);

    await page.getByRole("button", { name: "Save as draft" }).click();
    await expect(page.locator("[data-save-status]")).toContainText("Draft saved on this device: Kingdom 1234 recruitment post.");
    await expect(page.locator("[data-draft]")).toHaveCount(1);
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);

    await page.reload();
    await expect(page.locator("#kt-body-out")).toHaveValue("**We are recruiting**");
    await page.getByRole("button", { name: "Open Kingdom 1234 recruitment post" }).click();
    await expect(page.getByLabel("Kingdom number or name")).toHaveValue("1234");
    await expect(page.locator("#kt-body-out")).toHaveValue(/Rally leader ×2 — cavalry/);
    await page.getByRole("button", { name: "Delete Kingdom 1234 recruitment post" }).click();
    await page.getByRole("button", { name: "Yes, delete" }).click();
    await expect(page.locator("[data-draft]")).toHaveCount(0);
    expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).docs.length, KINGDOM_KEY)).toBe(0);
    expect(errors).toEqual([]);
  });

  test("shows an error under a power it cannot read", async ({ page }) => {
    await page.goto("/kingdom/recruit/");
    await page.getByLabel("Minimum power").fill("a lot");
    await expect(page.locator("#kt-power-error")).toContainText("Write the power as a number");
    await expect(page.getByLabel("Minimum power")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#kt-body-out")).not.toHaveValue(/Power/);
  });

  test("warns and reports the length when the Discord post is over 2,000 characters", async ({ page }) => {
    await page.goto("/kingdom/recruit/");
    await page.getByLabel("Kingdom number or name").fill("1234");
    await page.getByLabel("Migration note").fill("m".repeat(600));
    await page.getByLabel("Other requirements").fill("r".repeat(300));
    for (let i = 0; i < 8; i++) {
      await page.getByRole("button", { name: "Add role" }).click();
      await page.locator(`#kt-note-${i}`).fill("n".repeat(120));
    }
    await expect(page.locator("[data-over-limit]")).toContainText("over Discord's 2,000-character limit");
    await expect(page.locator("[data-char-count]")).toContainText(/^2,\d{3} \/ 2,000 characters$/);
    await page.getByLabel("Format").selectOption("text");
    await expect(page.locator("[data-over-limit]")).toHaveCount(0);
  });

  test("escapes markdown typed by the council", async ({ page }) => {
    await page.goto("/kingdom/recruit/");
    await page.getByLabel("Migration note").fill("# Open now\n@everyone welcome");
    await expect(page.locator("#kt-body-out")).toHaveValue(/\\# Open now\n@​everyone welcome/);
  });

  for (const theme of ["dark", "light"] as const) {
    for (const state of ["empty", "filled"] as const) {
      test(`axe ${theme} ${state}`, async ({ page }) => {
        await seed(page, state === "filled" ? [DRAFT] : [], theme);
        await page.goto("/kingdom/recruit/");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        if (state === "filled") {
          await page.getByRole("button", { name: "Open Kingdom 1234 recruitment post" }).click();
          await expect(page.locator("#kt-body-out")).toHaveValue(/Garrison leader — infantry/);
          await page.getByLabel("Minimum City Hall level").fill("30");
          await expect(page.locator("#kt-ch-error")).toBeVisible();
          await page.getByLabel("Format").selectOption("reddit");
        }
        await expectAxeClean(page);
      });
    }
  }
});
