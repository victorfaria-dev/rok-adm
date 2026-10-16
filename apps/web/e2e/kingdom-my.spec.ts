import { expect, test, type Page } from "@playwright/test";
import { KINGDOM_KEY, expectAxeClean, expectNoSidewaysScroll, expectTargets44, seed, trackErrors, gotoHydrated } from "./kingdom-helpers";

const CARD = {
  id: "card-1", updatedAt: "2026-10-13T10:00:00.000Z", kingdom: "K1234", title: "", stage: "KvK2", stageOther: "",
  formula: "t4 * 10 + t5 * 30 + deads * 80", presetId: "k2779-kvk2",
  requirement: { mode: "percent", bands: [{ minPower: 0, maxPower: 20_000_000, percent: 250 }, { minPower: 20_000_000, maxPower: null, percent: 400 }] },
  powerBasis: "Highest power before KvK", notes: "Farms are exempt.\nZeroed days count as 0 deads.",
};

/** Share code built in the browser with the app's own encoder (plain JSON mode: "1j" + base64url). */
function codeFor(card: unknown, kind = "requirements"): string {
  return "1j" + Buffer.from(JSON.stringify({ k: kind, d: card })).toString("base64url");
}

async function openCard(page: Page, card: unknown = CARD) {
  await page.goto(`/kingdom/my/#d=${codeFor(card)}`);
  await expect(page.locator("[data-card]")).toBeVisible();
}

test.describe("my requirements (F-30)", () => {
  test("renders at 360px with the DKP explainer and the no-link setup", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await seed(page, []);
    const res = await page.goto("/kingdom/my/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("[data-guardrail]")).toHaveCount(0); // UX stage 1: shown once, on the Kingdom overview
    await expect(page.locator("[data-explainer]")).toContainText("DKP não é um número do jogo: cada reino define a própria fórmula");
    await expect(page.locator("[data-explainer]")).toContainText("250% do poder");
    await expect(page.locator("[data-self]")).toBeVisible();
    await expect(page.locator('[data-explain="km-preset"]')).toContainText("Cada abate de T4 = 10 pontos");
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("opens a council link: card details, inputs only for used variables, progress and ways", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await openCard(page);
    const card = page.locator("[data-card]");
    await expect(card).toContainText("Requisitos de K1234");
    await expect(card).toContainText("KvK2");
    await expect(card).toContainText("Cada abate de T4 = 10 pontos, cada abate de T5 = 30 pontos, cada morte = 80 pontos.");
    await expect(card).toContainText("0 a menos de 20.000.000 de poder: 250% do poder");
    await expect(page.locator("[data-basis]")).toHaveText("Highest power before KvK");
    await expect(card).toContainText("Zeroed days count as 0 deads.");
    await expect(page.locator("[data-byline]")).toBeVisible();
    await expect(page.locator("#km-t4")).toBeVisible();
    await expect(page.locator("#km-t5")).toBeVisible();
    await expect(page.locator("#km-deads")).toBeVisible();
    await expect(page.locator("#km-kp")).toHaveCount(0);
    await expect(page.locator("#km-t1")).toHaveCount(0);
    await expect(page.getByLabel("Meu poder (Highest power before KvK)")).toBeVisible();

    await page.getByLabel(/^Meu poder/).fill("10.5m");
    await expect(page.locator("[data-summary]")).toContainText("Você tem 0 de 26.250.000 de DKP (0%)");
    await page.locator("#km-deads").fill("300k");
    await page.locator("#km-t4").fill("abc");
    await expect(page.locator("#km-t4")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("[data-summary]")).toHaveText("Corrija os campos destacados para ver o seu progresso.");
    await page.locator("#km-t4").fill("226,000");
    await expect(page.locator("[data-summary]")).toContainText("Você tem 26.260.000 de DKP: cumpre a meta de 26.250.000.");
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    await expect(page.locator("[data-ways]")).toHaveCount(0);
    await page.locator("#km-t4").fill("0");
    await expect(page.locator("[data-ways]")).toContainText("cerca de 28.125 mortes a mais ou 75.000 abates de T5 a mais ou 225.000 abates de T4 a mais");
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("excluded deads: rule on the card, extra input validated and subtracted before the formula", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await seed(page, []);
    await openCard(page, { ...CARD, requirement: { mode: "fixed", target: 10_000_000 }, excludedDeads: { enabled: true, label: "zeroed in a 'terrible trade'" } });
    await expect(page.locator("[data-excluded-rule]")).toHaveText("As mortes dos dias em que você foi zeroed in a 'terrible trade' não contam: elas são descontadas das suas mortes antes de calcular o seu DKP.");
    const ex = page.getByLabel("Mortos em dias excluídos");
    await expect(ex).toBeVisible();
    await page.getByLabel(/^Meu poder/).fill("10m");
    await page.locator("#km-deads").fill("100k");
    await ex.fill("150k");
    await expect(ex).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#km-excluded-deads-error")).toHaveText("Isso não pode ser maior que as suas mortes (100.000).");
    await expect(page.locator("[data-summary]")).toHaveText("Corrija os campos destacados para ver o seu progresso.");
    await ex.fill("25k");
    await expect(ex).not.toHaveAttribute("aria-invalid", "true");
    // (100,000 - 25,000) deads × 80 = 6,000,000
    await expect(page.locator("[data-summary]")).toContainText("Você tem 6.000.000 de 10.000.000 de DKP (60%)");
    await expect(page.locator('[data-row="counted-deads"]')).toContainText("75.000");
    await page.getByRole("button", { name: "Salvar neste aparelho" }).click();
    await gotoHydrated(page, "/kingdom/my/");
    await expect(page.getByLabel("Mortos em dias excluídos")).toHaveValue("25k");
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("requirement groups: card lists them, the player picks one, target scales and is remembered", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await seed(page, []);
    // Group names and percents are test values typed as if by a council.
    await openCard(page, { ...CARD, groups: [{ id: "young", name: "Accounts under 6 months", percent: 80 }, { id: "seed", name: "Seed group", percent: 150 }] });
    await expect(page.locator("[data-card]")).toContainText("Grupos de requisito (definidos pelo seu conselho)");
    await expect(page.locator("[data-groups] li")).toHaveText(["Accounts under 6 months: 80% da meta normal", "Seed group: 150% da meta normal"]);
    const pick = page.getByLabel("Meu grupo");
    await expect(pick).toHaveValue("");
    await page.getByLabel(/^Meu poder/).fill("10.5m");
    await expect(page.locator('[data-row="target"]')).toContainText("26.250.000 (250% de 10.500.000)");
    await pick.selectOption("young");
    await expect(page.locator('[data-row="target"]')).toContainText("21.000.000 (250% de 10.500.000 × 80% para Accounts under 6 months)");
    await expect(page.locator("[data-summary]")).toContainText("de 21.000.000 de DKP");
    await page.getByRole("button", { name: "Salvar neste aparelho" }).click();
    await gotoHydrated(page, "/kingdom/my/");
    await expect(page.getByLabel("Meu grupo")).toHaveValue("young");
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("old links without the new fields still open (rule off, no group picker)", async ({ page }) => {
    await openCard(page);
    await expect(page.locator("[data-excluded-rule]")).toHaveCount(0);
    await expect(page.getByLabel("Mortos em dias excluídos")).toHaveCount(0);
    await expect(page.locator("#km-group")).toHaveCount(0);
  });

  test("non-linear formula: no 'close the gap' sentence", async ({ page }) => {
    await openCard(page, { ...CARD, formula: "max(t4, deads * 10)", requirement: { mode: "fixed", target: 1000 } });
    await page.getByLabel(/^Meu poder/).fill("1m");
    await page.locator("#km-t4").fill("10");
    await expect(page.locator("[data-summary]")).toContainText("de 1.000 de DKP");
    await expect(page.locator("[data-ways]")).toHaveCount(0);
  });

  test("bad links show the share error and still offer the self setup", async ({ page }) => {
    const errors = trackErrors(page);
    await gotoHydrated(page, "/kingdom/my/#d=1jnot*valid");
    await expect(page.locator("[data-link-error]")).toHaveText("Este link está danificado (faltam ou mudaram alguns caracteres). Copie o link inteiro de novo.");
    await expect(page.locator("[data-self]")).toBeVisible();
    await page.goto(`/kingdom/my/#d=${codeFor(CARD, "rules")}`);
    await expect(page.locator("[data-link-error]")).toHaveText("Este link é de outra ferramenta do KingdomOps.");
    await gotoHydrated(page, "/kingdom/my/#d=");
    await expect(page.locator("[data-link-error]")).toContainText("não tem nenhum documento");
    // Q2 P3: a link whose document was changed after sharing (checksum no longer matches) is "damaged", not shown.
    const tampered = "1j" + Buffer.from(JSON.stringify({ k: "requirements", d: { ...CARD, kingdom: "K9999" }, h: "00000000" })).toString("base64url");
    await page.goto(`/kingdom/my/#d=${tampered}`);
    await expect(page.locator("[data-link-error]")).toHaveText("Este link está danificado (o documento dentro dele não pode ser lido). Copie o link inteiro de novo.");
    expect(errors).toEqual([]);
  });

  test("save on this device; reopening without a hash loads the last card", async ({ page }) => {
    await seed(page, []);
    await openCard(page);
    await page.getByLabel(/^Meu poder/).fill("10m");
    await page.locator("#km-deads").fill("1k");
    await page.getByRole("button", { name: "Salvar neste aparelho" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Salvo neste aparelho" })).toBeVisible();
    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KINGDOM_KEY);
    expect(stored.docs[0].kind).toBe("my-requirements");
    await gotoHydrated(page, "/kingdom/my/");
    await expect(page.locator("[data-card]")).toContainText("K1234");
    await expect(page.getByLabel(/^Meu poder/)).toHaveValue("10m");
    await expect(page.locator("#km-deads")).toHaveValue("1k");
  });

  test("self setup: custom formula and percent", async ({ page }) => {
    await seed(page, []);
    await gotoHydrated(page, "/kingdom/my/");
    await page.getByLabel("Fórmula", { exact: true }).selectOption("custom");
    const f = page.getByLabel("Fórmula do seu reino");
    await f.fill("t4 *");
    await expect(f).toHaveAttribute("aria-invalid", "true");
    await f.fill("kp + deads * 5");
    await expect(page.locator("#km-kp")).toBeVisible();
    await expect(page.locator("#km-t4")).toHaveCount(0);
    await page.getByLabel("Seu requisito (% do poder)").fill("100");
    await page.getByLabel(/^Meu poder/).fill("1m");
    await page.locator("#km-kp").fill("500k");
    await expect(page.locator("[data-summary]")).toContainText("Você tem 500.000 de 1.000.000 de DKP (50%)");
    await expect(page.locator("[data-byline]")).toHaveCount(0);
  });

  for (const theme of ["dark", "light"] as const) {
    for (const state of ["empty", "filled"] as const) {
      test(`axe ${theme} ${state}`, async ({ page }) => {
        await seed(page, [], theme);
        if (state === "filled") {
          await openCard(page, { ...CARD, excludedDeads: { enabled: true, label: "zeroed in a 'terrible trade'" }, groups: [{ id: "young", name: "Accounts under 6 months", percent: 80 }] });
          await page.getByLabel(/^Meu poder/).fill("10m");
          await page.locator("#km-deads").fill("100k");
          await page.getByLabel("Meu grupo").selectOption("young");
          await page.getByLabel("Mortos em dias excluídos").fill("200k"); // error state
          await expect(page.getByLabel("Mortos em dias excluídos")).toHaveAttribute("aria-invalid", "true");
          await expectAxeClean(page);
          await page.getByLabel("Mortos em dias excluídos").fill("20k");
          await expect(page.getByRole("progressbar")).toBeVisible();
        } else {
          await gotoHydrated(page, "/kingdom/my/");
          await expect(page.locator("[data-self]")).toBeVisible();
        }
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expectAxeClean(page);
      });
    }
  }
});
