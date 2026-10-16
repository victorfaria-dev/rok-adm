import { expect, test } from "@playwright/test";
import { KINGDOM_KEY, expectAxeClean, expectNoSidewaysScroll, expectTargets44, seed, trackErrors, gotoHydrated } from "./kingdom-helpers";

const DOC = { id: "r1", kind: "rules", title: "Regras do K1234", updatedAt: "2026-10-13T10:00:00.000Z", data: { sections: [] } };

test.describe("council kit hub", () => {
  test("renders: one h1, guardrail, privacy note, one section nav (no card grid), no sideways scroll at 360px", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    const res = await page.goto("/kingdom/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("[data-guardrail]")).toContainText("Sem bots, sem varredura");
    await expect(page.locator("[data-privacy]")).toContainText("Nada é enviado a um servidor");
    const nav = page.getByRole("navigation", { name: "Páginas de Reino" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveText(["Visão geral", "Regras", "Brasão da aliança", "Seed (experimental)"]);
    await expect(nav.getByRole("link", { name: "Visão geral" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: /guia de administração do reino/i })).toHaveAttribute("href", "/guides/kingdom-admin/");
    // UX stage 1: no card grid repeating the nav, and the one section nav is the only in-page nav.
    await expect(page.locator("#main .kg-tools")).toHaveCount(0);
    await expect(page.locator("#main nav.kg-subnav")).toHaveCount(1);
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("shows saved documents, exports, deletes all and imports back", async ({ page }) => {
    const errors = trackErrors(page);
    await seed(page, [DOC]);
    await gotoHydrated(page, "/kingdom/");
    await expect(page.locator("[data-counts]")).toContainText("Páginas de regras: 1");
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exportar (.json)" }).click()]);
    const path = await download.path();
    expect(download.suggestedFilename()).toMatch(/^kingdomops-council-\d{4}-\d{2}-\d{2}\.json$/);

    await page.getByRole("button", { name: "Apagar todos os dados do conselho" }).click();
    await page.getByRole("button", { name: "Sim, apagar tudo" }).click();
    await expect(page.getByText("Nenhum documento do conselho salvo neste aparelho ainda.")).toBeVisible();
    expect(await page.evaluate((k) => localStorage.getItem(k), KINGDOM_KEY)).toBeNull();

    await page.locator("[data-import]").setInputFiles(path!);
    await expect(page.getByRole("status").filter({ hasText: "Importado: 1 adicionados" })).toBeVisible();
    await expect(page.locator("[data-counts]")).toContainText("Páginas de regras: 1");
    expect(errors).toEqual([]);
  });

  test("rejects a file that is not a council export", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/");
    // Q2 P2-6: the file input has its own accessible name and is not hidden from assistive tech.
    await expect(page.locator("[data-import]")).toHaveAccessibleName("Importar dados do conselho de um arquivo .json");
    await expect(page.locator("[data-import]")).not.toHaveAttribute("aria-hidden", "true");
    await page.locator("[data-import]").setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from('{"app":"other"}') });
    await expect(page.getByRole("alert")).toContainText("não é uma exportação do conselho do KingdomOps");
  });

  for (const theme of ["dark", "light"] as const) {
    for (const state of ["empty", "filled"] as const) {
      test(`axe ${theme} ${state}`, async ({ page }) => {
        await seed(page, state === "filled" ? [DOC] : [], theme);
        await gotoHydrated(page, "/kingdom/");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("[data-controls]")).toBeVisible();
        await expectAxeClean(page);
      });
    }
  }
});
