import { expect, test } from "@playwright/test";
import { KINGDOM_KEY, expectAxeClean, expectNoSidewaysScroll, expectTargets44, seed, trackErrors, gotoHydrated } from "./kingdom-helpers";

const SAVED = {
  id: "c1", kind: "requirements", title: "Requisitos de K1234", updatedAt: "2026-10-13T10:00:00.000Z",
  data: {
    kingdom: "K1234", title: "", stage: "KvK2", stageOther: "", formula: "t4 * 10 + t5 * 30 + deads * 80", presetId: "k2779-kvk2",
    requirement: { mode: "percent", bands: [{ minPower: 0, maxPower: 20_000_000, percent: 250 }, { minPower: 20_000_000, maxPower: null, percent: 400 }] },
    powerBasis: "Power at the start scan", notes: "Farms are exempt.",
    excludedDeads: { enabled: true, label: "zeroed in a 'terrible trade'" },
    groups: [{ id: "young", name: "Accounts under 6 months", percent: 80 }], // test values, as typed by a council
    sampleAccounts: [{ id: "s1", name: "Sample A", stats: { power: 10_000_000, t4: 1_000_000, deads: 200_000 } }], compareFormula: "",
  },
};

test.describe("requirements card (F-34)", () => {
  test("renders at 360px: h1, guardrail, privacy, preset explanation, sandbox results", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    const res = await page.goto("/kingdom/requirements/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("[data-guardrail]")).toHaveCount(0); // UX stage 1: shown once, on the Kingdom overview
    await expect(page.locator("[data-privacy]")).toHaveCount(0); // UX stage 1: shown once, on the Kingdom overview
    await expect(page.getByRole("navigation", { name: "Páginas de Membros" }).getByRole("link", { name: "Requisitos", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.locator('[data-explain="kr-formula"]')).toContainText("Each T4 kill = 10 points, each T5 kill = 20 points, each dead = 50 points.");
    await expect(page.locator("[data-source]")).toContainText("B08-0001, confiança medium");
    await expect(page.locator("[data-not-comparable]")).toContainText("not comparable across kingdoms");
    await expect(page.locator("[data-results] tbody tr")).toHaveCount(3);
    await expect(page.locator("[data-summary]")).toContainText("de 3 contas de exemplo");
    // Results table fits 360px: no header or number wraps, no scroll inside the table wrapper.
    const table = await page.evaluate(() => {
      const wrap = document.querySelector("[data-results]")!.parentElement!;
      const wrapped = [...document.querySelectorAll<HTMLElement>("[data-results] th[scope=col], [data-results] td")].filter((c) => {
        const r = document.createRange();
        r.selectNodeContents(c);
        return r.getBoundingClientRect().height > parseFloat(getComputedStyle(c).lineHeight) * 1.5;
      }).map((c) => c.textContent);
      return { overflow: wrap.scrollWidth - wrap.clientWidth, wrapped };
    });
    expect(table).toEqual({ overflow: 0, wrapped: [] });
    await expect(page.locator("[data-results] thead abbr")).toHaveAttribute("title", "Porcentagem da meta");
    // The formula explanation is an unboxed block inside the card (no card-in-card).
    const box = await page.locator('[data-explain="kr-formula"]').evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, border: s.borderTopWidth, radius: s.borderTopLeftRadius, padding: s.paddingTop };
    });
    expect(box).toEqual({ bg: "rgba(0, 0, 0, 0)", border: "0px", radius: "0px", padding: "0px" });
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("live formula validation, presets and rule note", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/requirements/");
    const f = page.getByLabel("Fórmula", { exact: true });
    await f.fill("t4 * 10 + tx");
    await expect(f).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#kr-formula-error")).toHaveText("Unknown name 'tx' at character 11. Use t1–t5, deads, kp or power.");
    await expect(f).toHaveAttribute("aria-describedby", /kr-formula-error/);
    await expect(page.locator("[data-summary]")).toContainText("Erro na fórmula");
    await expect(page.locator("[data-source]")).toContainText("definid");
    await f.fill("-".repeat(33) + "t4");
    await expect(page.locator("#kr-formula-error")).toHaveText("This formula is nested too deeply at character 33 (at most 32 levels). Simplify it.");
    await f.fill("t4 * 1000000000000000000000");
    await expect(page.locator("#kr-formula-error")).toContainText("is too large");
    await f.fill("t4 * 0.0000001");
    await expect(page.locator('[data-explain="kr-formula"]')).toContainText("Each T4 kill = 0.0000001 points.");
    await expect(page.locator('[data-explain="kr-formula"] code')).toHaveText("t4 * 0.0000001");
    await f.fill("max(t4, deads)");
    await expect(f).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator('[data-explain="kr-formula"]')).toContainText("not always worth the same");
    await page.getByLabel("Começar de").selectOption("k2779-kvk2");
    await expect(f).toHaveValue("t4 * 10 + t5 * 30 + deads * 80");
    await expect(page.locator("[data-rule-note]")).toContainText("terrible trade");
  });

  test("bands editor validates overlap; compare shows ranking change", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/requirements/");
    await page.getByLabel("Até o poder").fill("20m");
    await page.getByRole("button", { name: "Adicionar faixa" }).click();
    await expect(page.locator("#kr-band-1-min")).toHaveValue("20m");
    await page.locator("#kr-band-1-min").fill("10m");
    await page.locator("#kr-band-1-pct").fill("400");
    // The overlap is tied to the offending input, not only listed.
    const min = page.locator("#kr-band-1-min");
    await expect(min).toHaveAttribute("aria-invalid", "true");
    await expect(min).toHaveAttribute("aria-describedby", /kr-band-1-min-error/);
    await expect(page.locator("#kr-band-1-min-error")).toHaveText("Band 2 overlaps band 1: start it at or above where band 1 ends.");
    await expect(page.locator("#kr-band-0-min")).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#kr-band-1-pct")).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("[data-band-issues]")).toHaveCount(0);
    await expect(page.locator("[data-summary]")).toHaveText("Corrija o requisito para ver quem passa.");
    await min.fill("20m");
    await expect(min).not.toHaveAttribute("aria-invalid", "true");
    // An open upper limit on a middle band marks that band's "Up to power" field.
    await page.locator("#kr-band-0-max").fill("");
    await expect(page.locator("#kr-band-0-max")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#kr-band-0-max-error")).toHaveText("Band 1: only the last band can have no upper limit.");
    await page.locator("#kr-band-0-max").fill("20m");
    await expect(page.locator("#kr-band-0-max")).not.toHaveAttribute("aria-invalid", "true");
    // Removing the second band leaves a valid single band: nothing listed.
    await page.getByRole("button", { name: "Remover faixa 2" }).click();
    await expect(page.locator("[data-band-issues]")).toHaveCount(0);
    await page.getByLabel("Segunda fórmula").fill("deads");
    await expect(page.locator("[data-compare] tbody tr")).toHaveCount(3);
  });

  test("excluded deads rule: tick, edit the label, publish, player sees it", async ({ page }) => {
    const errors = trackErrors(page);
    await gotoHydrated(page, "/kingdom/requirements/");
    await expect(page.getByLabel("Dias excluídos são dias em que o jogador foi…")).toHaveCount(0);
    await expect(page.locator("#kr-excl-hint")).toContainText("B08-0001");
    await page.getByLabel("Mortos em dias excluídos não contam").check();
    const label = page.getByLabel("Dias excluídos são dias em que o jogador foi…");
    await expect(label).toHaveValue("zeroed in a 'terrible trade'");
    await label.fill("zeroed by a bad trade");
    await expect(page.locator("[data-excluded-preview]")).toContainText("Deads on days you were zeroed by a bad trade don't count");
    await page.getByRole("button", { name: "Publicar cartão" }).click();
    const url = await page.locator("#kr-link").inputValue();
    await page.goto(new URL(url).pathname + new URL(url).hash);
    await expect(page.locator("[data-excluded-rule]")).toContainText("Deads on days you were zeroed by a bad trade don't count");
    await expect(page.getByLabel("Mortos em dias excluídos")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("requirement groups: add, validate, remove, publish to the player", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await gotoHydrated(page, "/kingdom/requirements/");
    await expect(page.locator("#kr-groups-hint")).toContainText("definid");
    await expect(page.locator("#kr-groups-hint")).toContainText("B08-0002");
    await page.getByRole("button", { name: "Adicionar grupo" }).click();
    const name = page.locator("#kr-group-0-name");
    const pct = page.locator("#kr-group-0-pct");
    await expect(pct).toHaveAttribute("aria-invalid", "true");
    await page.getByRole("button", { name: "Publicar cartão" }).click();
    await expect(page.getByRole("alert")).toHaveText("Corrija primeiro os campos destacados.");
    await name.fill("Accounts under 6 months");
    await pct.fill("2000");
    await expect(page.locator("#kr-group-0-pct-error")).toHaveText("Digite mais que 0 e no máximo 1.000.");
    await pct.fill("80");
    await page.getByRole("button", { name: "Adicionar grupo" }).click();
    await page.locator("#kr-group-1-name").fill("accounts under 6 months");
    await page.locator("#kr-group-1-pct").fill("90");
    await expect(page.locator("#kr-group-1-name-error")).toHaveText("Group 2 has the same name as group 1.");
    await page.getByRole("button", { name: "Remover grupo 2" }).click();
    await expect(page.locator("[data-group]")).toHaveCount(1);
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    await page.getByRole("button", { name: "Publicar cartão" }).click();
    const url = await page.locator("#kr-link").inputValue();
    await page.goto(new URL(url).pathname + new URL(url).hash);
    await expect(page.locator("[data-groups]")).toContainText("Accounts under 6 months: 80% of the normal target");
    await expect(page.getByLabel("Meu grupo")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("save, list, open and delete on this device", async ({ page }) => {
    const errors = trackErrors(page);
    await seed(page, []);
    await gotoHydrated(page, "/kingdom/requirements/");
    await expect(page.locator("[data-saved-empty]")).toBeVisible();
    await page.getByLabel("Reino", { exact: true }).fill("K9999");
    await page.getByRole("button", { name: "Salvar neste aparelho" }).click();
    await expect(page.locator("[data-saved]")).toContainText("Requisitos de K9999");
    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KINGDOM_KEY);
    expect(stored.docs[0].kind).toBe("requirements");
    await page.getByRole("button", { name: "Novo cartão" }).click();
    await expect(page.getByLabel("Reino", { exact: true })).toHaveValue("");
    await page.getByRole("button", { name: "Abrir Requisitos de K9999" }).click();
    await expect(page.getByLabel("Reino", { exact: true })).toHaveValue("K9999");
    await page.getByRole("button", { name: "Apagar Requisitos de K9999" }).click();
    await page.getByRole("button", { name: "Sim, apagar" }).click();
    await expect(page.locator("[data-saved-empty]")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("keyboard flow: council builds card → publish → player opens link → enters stats → progress", async ({ page }) => {
    const errors = trackErrors(page);
    await seed(page, []);
    await gotoHydrated(page, "/kingdom/requirements/");
    await page.getByLabel("Reino", { exact: true }).focus();
    await page.keyboard.type("K1234");
    await page.keyboard.press("Tab"); // title
    await page.keyboard.press("Tab"); // stage
    await page.getByLabel("Começar de").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Fórmula", { exact: true })).toBeFocused();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("t4 * 10 + t5 * 20 + deads * 50");
    await page.getByLabel("Notas e exceções (opcional)").fill("Farms are exempt.");
    await page.getByRole("button", { name: "Publicar cartão" }).focus();
    await page.keyboard.press("Enter");
    const link = page.locator("#kr-link");
    await expect(link).toHaveValue(/\/kingdom\/my\/#d=1/);
    const url = await link.inputValue();
    expect(url).not.toContain("Exemplo");

    await page.goto(new URL(url).pathname + new URL(url).hash);
    await expect(page.locator("[data-card]")).toContainText("K1234");
    await expect(page.locator("[data-byline]")).toHaveText("Este cartão foi escrito pelo seu conselho, não pelo KingdomOps.");
    await expect(page.locator("[data-card]")).toContainText("250% do seu poder em DKP");
    await expect(page.locator("[data-card]")).toContainText("Farms are exempt.");
    await page.getByLabel(/^Meu poder/).focus();
    await page.keyboard.type("10m");
    await page.keyboard.press("Tab");
    await page.keyboard.type("500k");
    await page.keyboard.press("Tab");
    await page.keyboard.type("100,000");
    await page.keyboard.press("Tab");
    await page.keyboard.type("50k");
    await expect(page.locator("[data-summary]")).toContainText("Você tem 9,500,000 de 25,000,000 de DKP (38%). Faltam 15,500,000.");
    await expect(page.getByRole("progressbar", { name: "Progresso rumo à minha meta" })).toHaveAttribute("aria-valuenow", "38");
    await expect(page.locator("[data-ways]")).toContainText("310,000 deads a mais ou 775,000 T5 kills a mais ou 1,550,000 T4 kills a mais");
    expect(errors).toEqual([]);
  });

  for (const theme of ["dark", "light"] as const) {
    for (const state of ["empty", "filled"] as const) {
      test(`axe ${theme} ${state}`, async ({ page }) => {
        await seed(page, state === "filled" ? [SAVED] : [], theme);
        await gotoHydrated(page, "/kingdom/requirements/");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        if (state === "filled") {
          await page.getByRole("button", { name: "Abrir Requisitos de K1234" }).click();
          await expect(page.locator("#kr-excl-label")).toBeVisible();
          await expect(page.locator("#kr-group-0-name")).toHaveValue("Accounts under 6 months");
          await page.locator("#kr-group-0-pct").fill("x"); // error state on a group field
          await expect(page.locator("#kr-group-0-pct")).toHaveAttribute("aria-invalid", "true");
          await expectAxeClean(page);
          await page.locator("#kr-group-0-pct").fill("80");
          await page.getByLabel("Segunda fórmula").fill("deads * 10");
          await page.getByRole("button", { name: "Publicar cartão" }).click();
          await expect(page.locator("#kr-link")).toBeVisible();
        } else {
          await expect(page.locator("[data-saved-empty]")).toBeVisible();
        }
        await expectAxeClean(page);
      });
    }
  }
});
