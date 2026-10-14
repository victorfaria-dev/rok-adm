import { expect, test } from "@playwright/test";
import { KINGDOM_KEY, expectAxeClean, expectNoSidewaysScroll, expectTargets44, seed, trackErrors, gotoHydrated } from "./kingdom-helpers";

const DRAFT = {
  id: "d1", kind: "recruit", title: "Post de recrutamento do Reino 1234", updatedAt: "2026-10-13T10:00:00.000Z",
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
    await expect(page.locator("[data-guardrail]")).toHaveCount(0); // UX stage 1: shown once, on the Kingdom overview
    await expect(page.locator("[data-chat-warning]")).toContainText("Nunca cole links no chat do jogo");
    await expect(page.locator("[data-privacy]")).toHaveCount(0); // UX stage 1: shown once, on the Kingdom overview
    await expect(page.locator("#kt-body-out")).toHaveValue("**Estamos recrutando**");
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("form → post contains the entered roles in every format; drafts save, reopen and delete", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await gotoHydrated(page, "/kingdom/recruit/");
    await page.getByLabel("Número ou nome do reino").fill("1234");
    await page.getByLabel("Fase", { exact: true }).selectOption("kvk2");
    await page.getByLabel("Poder mínimo").fill("30m");
    await page.getByLabel("Nível mínimo da Prefeitura").fill("25");
    await page.getByLabel("Regras de MGE transparentes").check();
    await page.getByRole("button", { name: "Adicionar função" }).click();
    await expect(page.getByLabel("Função 1", { exact: true })).toBeFocused();
    await page.locator("#kt-count-0").fill("2");
    await page.locator("#kt-note-0").fill("cavalry");
    await page.getByRole("button", { name: "Adicionar função" }).click();
    await page.getByLabel("Função 2", { exact: true }).selectOption("translator");
    await page.getByLabel("Contato").fill("DM Ana on Discord");

    const body = page.locator("#kt-body-out");
    await expect(body).toHaveValue(/^\*\*Reino 1234 está recrutando\*\*/);
    await expect(body).toHaveValue(/- Líder de rally ×2 — cavalry\n- Tradutor/);
    await expect(body).toHaveValue(/- Poder: 30M\+/);
    await expect(body).toHaveValue(/- Regras de MGE transparentes/);
    await expect(body).toHaveValue(/\*\*Contato:\*\* DM Ana on Discord/);
    await expect(page.locator("[data-char-count]")).toContainText("/ 2.000 caracteres");
    await expect(page.locator("[data-over-limit]")).toHaveCount(0);

    await page.getByLabel("Formato").selectOption("reddit");
    await expect(page.locator("#kt-title-out")).toHaveValue("[K1234] Reino KvK2 recrutando: Líder de rally, Tradutor");
    await page.getByLabel("Formato").selectOption("text");
    await expect(body).not.toHaveValue(/\*\*/);
    await expect(body).toHaveValue(/Vagas abertas:\n- Líder de rally ×2 — cavalry/);

    await page.getByRole("button", { name: "Remover função 2" }).click();
    await expect(body).not.toHaveValue(/Tradutor/);

    await page.getByRole("button", { name: "Salvar como rascunho" }).click();
    await expect(page.locator("[data-save-status]")).toContainText("Rascunho salvo neste aparelho: Post de recrutamento do Reino 1234.");
    await expect(page.locator("[data-draft]")).toHaveCount(1);
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);

    await page.reload();
    await expect(page.locator("#kt-body-out")).toHaveValue("**Estamos recrutando**");
    await page.getByRole("button", { name: "Abrir Post de recrutamento do Reino 1234" }).click();
    await expect(page.getByLabel("Número ou nome do reino")).toHaveValue("1234");
    await expect(page.locator("#kt-body-out")).toHaveValue(/Líder de rally ×2 — cavalry/);
    await page.getByRole("button", { name: "Apagar Post de recrutamento do Reino 1234" }).click();
    await page.getByRole("button", { name: "Sim, apagar" }).click();
    await expect(page.locator("[data-draft]")).toHaveCount(0);
    expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).docs.length, KINGDOM_KEY)).toBe(0);
    expect(errors).toEqual([]);
  });

  test("shows an error under a power it cannot read", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/recruit/");
    await page.getByLabel("Poder mínimo").fill("a lot");
    await expect(page.locator("#kt-power-error")).toContainText("Escreva o poder como número");
    await expect(page.getByLabel("Poder mínimo")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#kt-body-out")).not.toHaveValue(/Poder/);
  });

  test("warns and reports the length when the Discord post is over 2,000 characters", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/recruit/");
    await page.getByLabel("Número ou nome do reino").fill("1234");
    await page.getByLabel("Nota sobre migração").fill("m".repeat(600));
    await page.getByLabel("Outros requisitos").fill("r".repeat(300));
    for (let i = 0; i < 8; i++) {
      await page.getByRole("button", { name: "Adicionar função" }).click();
      await page.locator(`#kt-note-${i}`).fill("n".repeat(120));
    }
    await expect(page.locator("[data-over-limit]")).toContainText("acima do limite de 2.000 caracteres do Discord");
    await expect(page.locator("[data-char-count]")).toContainText(/^2\.\d{3} \/ 2\.000 caracteres$/);
    await page.getByLabel("Formato").selectOption("text");
    await expect(page.locator("[data-over-limit]")).toHaveCount(0);
  });

  test("a role count it cannot read shows an error instead of vanishing", async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await gotoHydrated(page, "/kingdom/recruit/");
    await page.getByRole("button", { name: "Adicionar função" }).click();
    const count = page.locator("#kt-count-0");
    await count.fill("two");
    await expect(count).toHaveValue("two");
    await expect(count).toHaveAttribute("aria-invalid", "true");
    await expect(count).toHaveAttribute("aria-describedby", "kt-count-0-error");
    await expect(page.locator("#kt-count-0-error")).toHaveText("Escreva um número inteiro de 1 a 99, ou deixe em branco.");
    await expect(page.locator("#kt-body-out")).toHaveValue(/- Líder de rally$/m);
    await count.fill("0");
    await expect(page.locator("#kt-count-0-error")).toBeVisible();
    await count.fill("3");
    await expect(page.locator("#kt-count-0-error")).toHaveCount(0);
    await expect(count).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#kt-body-out")).toHaveValue(/- Líder de rally ×3/);
    // Errors follow their role when an earlier one is removed.
    await page.getByRole("button", { name: "Adicionar função" }).click();
    await page.locator("#kt-count-1").fill("x1");
    await page.getByRole("button", { name: "Remover função 1" }).click();
    await expect(page.locator("#kt-count-0")).toHaveValue("x1");
    await expect(page.locator("#kt-count-0-error")).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    expect(errors).toEqual([]);
  });

  test("Reddit shows title and body lengths against their limits", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/recruit/");
    await page.getByLabel("Número ou nome do reino").fill("1234");
    await page.getByLabel("Formato").selectOption("reddit");
    await expect(page.locator("[data-title-count]")).toHaveText("Título: 24 / 300 caracteres");
    await expect(page.locator("[data-char-count]")).toHaveText(/^Corpo: \d+ \/ 40\.000 caracteres$/);
    await expect(page.locator("[data-title-cut]")).toHaveCount(0);
    await expect(page.locator("[data-over-limit]")).toHaveCount(0);
    await page.getByLabel("Formato").selectOption("discord");
    await expect(page.locator("[data-title-count]")).toHaveCount(0);
  });

  test("escapes markdown typed by the council", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/recruit/");
    await page.getByLabel("Nota sobre migração").fill("# Open now\n@everyone welcome");
    await expect(page.locator("#kt-body-out")).toHaveValue(/\\# Open now\n@​everyone welcome/);
  });

  for (const theme of ["dark", "light"] as const) {
    for (const state of ["empty", "filled"] as const) {
      test(`axe ${theme} ${state}`, async ({ page }) => {
        await seed(page, state === "filled" ? [DRAFT] : [], theme);
        await gotoHydrated(page, "/kingdom/recruit/");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        if (state === "filled") {
          await page.getByRole("button", { name: "Abrir Post de recrutamento do Reino 1234" }).click();
          await expect(page.locator("#kt-body-out")).toHaveValue(/Líder de guarnição — infantry/);
          await page.getByLabel("Nível mínimo da Prefeitura").fill("30");
          await expect(page.locator("#kt-ch-error")).toBeVisible();
          await page.locator("#kt-count-0").fill("lots");
          await expect(page.locator("#kt-count-0-error")).toBeVisible();
          await page.getByLabel("Formato").selectOption("reddit");
        }
        await expectAxeClean(page);
      });
    }
  }
});
