import { readFile } from "node:fs/promises";
import { expect, test, type Download, type Page } from "@playwright/test";
import { expectAxeClean, expectNoSidewaysScroll, expectTargets44, seed, trackErrors, gotoHydrated } from "./kingdom-helpers";

const cand = (id: string, name: string, score: number | null) => ({ id, name, score, tags: [] });
const ev = (id: string, date: string, over: Record<string, unknown> = {}) => ({ id, date, commander: "", applicants: [], overrides: [], locked: false, result: null, ...over });

/** A filled plan: 5 governors, 2 events, applications on, one manual placement. */
const PLAN = {
  id: "p1", kind: "mge", title: "K1234 MGE", updatedAt: "2026-10-13T10:00:00.000Z",
  data: {
    id: "p1", updatedAt: "2026-10-13T10:00:00.000Z", title: "K1234 MGE", slotsPerEvent: 3, policy: "score", cooldownEvents: 1, applicationsRequired: true,
    candidates: [cand("a", "Alpha", 4_200_000), cand("b", "Bravo", 3_000_000), cand("c", "Charlie", 2_000_000), cand("d", "Delta", null), cand("e", "Echo", 1_000_000)],
    events: [
      ev("e1", "2026-10-01", { commander: "Cao Cao", applicants: ["a", "b", "c", "e"], overrides: [{ slot: 1, candidateId: "e", reason: "Garrison lead for Kingsland" }] }),
      ev("e2", "2026-10-15", { applicants: ["a", "b"] }),
    ],
  },
};

async function ledgerRows(page: Page, date: string): Promise<string[][]> {
  return page.locator(`table[data-ledger="${date}"] tbody tr`).evaluateAll((rows) =>
    rows.map((r) => [...r.querySelectorAll("td")].slice(0, 3).map((td) => (td.textContent ?? "").trim())));
}

test.describe("MGE planner", () => {
  test("create plan → paste governors → 3 events → rotation ledger → publish → view matches", async ({ page }) => {
    const errors = trackErrors(page);
    await gotoHydrated(page, "/kingdom/mge/");
    await expect(page.locator("h1")).toHaveText("Planejador de MGE");
    await expect(page.locator("[data-guardrail]")).toHaveCount(0); // UX stage 1: shown once, on the Kingdom overview
    await expect(page.locator("[data-privacy]")).toHaveCount(0); // UX stage 1: shown once, on the Kingdom overview
    await page.getByRole("button", { name: "Novo plano" }).click();

    await page.getByLabel("Nome do plano").fill("K1234 KvK3 MGE");
    await page.getByLabel("Vagas por evento").fill("2");
    await expect(page.getByLabel("Como as vagas são dadas")).toHaveValue("rotation");
    await expect(page.getByLabel("Intervalo de descanso (eventos)")).toHaveValue("1");

    await page.getByLabel("Governadores, um por linha").fill("Alpha, 500\nBravo, 400\nCharlie, 300\nDelta, 200\nEcho, 100");
    await page.getByRole("button", { name: "Adicionar da lista" }).click();
    await expect(page.locator("[data-cand-status]")).toContainText("5 governadores adicionados.");
    await expect(page.locator("table[data-candidates] tbody tr")).toHaveCount(5);

    for (const d of ["2026-10-01", "2026-10-15", "2026-10-29"]) {
      await page.locator("#kx-ev-date").fill(d);
      await page.getByRole("button", { name: "Adicionar evento" }).click();
    }
    await expect(page.locator("[data-event]")).toHaveCount(3);
    await expect(page.locator("[data-summary]")).toContainText("5 governadores, 3 eventos, regra rotation, 2 vagas por evento. Todas as vagas estão preenchidas.");

    const never = "rotation: longest wait since last slot (never had one)";
    expect(await ledgerRows(page, "2026-10-01")).toEqual([["1", "Alpha", never], ["2", "Bravo", never]]);
    expect(await ledgerRows(page, "2026-10-15")).toEqual([["1", "Charlie", never], ["2", "Delta", never]]);
    const third = await ledgerRows(page, "2026-10-29");
    expect(third).toEqual([["1", "Echo", never], ["2", "Alpha", "rotation: longest wait since last slot (2 events ago, on 2026-10-01)"]]);

    await page.getByRole("button", { name: "Criar link público" }).click();
    const url = await page.locator("#kx-link").inputValue();
    expect(url).toMatch(/\/kingdom\/mge\/view\/#d=1[zj]/);

    await gotoHydrated(page, url);
    await expect(page.locator("[data-view-title]")).toHaveText("K1234 KvK3 MGE");
    await expect(page.locator("[data-view]")).toContainText("Publicado pelo conselho, não pelo KingdomOps");
    await expect(page.locator("[data-view-rules]")).toContainText("2 slots per event, set by the council.");
    await expect(page.locator("[data-view-rules]")).toContainText("Cooldown: 1 event after a slot.");
    expect(await ledgerRows(page, "2026-10-01")).toEqual([["1", "Alpha", never], ["2", "Bravo", never]]);
    expect(await ledgerRows(page, "2026-10-15")).toEqual([["1", "Charlie", never], ["2", "Delta", never]]);
    expect(await ledgerRows(page, "2026-10-29")).toEqual(third);
    await expect(page.getByRole("button", { name: "Imprimir" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Pontuação" })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("score policy: scores stay out of the public link unless ticked", async ({ page }) => {
    await seed(page, [PLAN]);
    await gotoHydrated(page, "/kingdom/mge/");
    await expect(page.locator("[data-plans]")).toContainText("K1234 MGE");
    // Manual placement first, then score rank among applicants not placed by hand; Delta did not apply.
    const rest = "among applicants not placed by hand";
    expect(await ledgerRows(page, "2026-10-01")).toEqual([
      ["1", "Echo", "manual: Garrison lead for Kingsland"], ["2", "Alpha", `score rank 1 ${rest} (4,200,000)`], ["3", "Bravo", `score rank 2 ${rest} (3,000,000)`],
    ]);
    expect(await ledgerRows(page, "2026-10-15")).toEqual([["1", "Alpha", "score rank 1 among applicants (4,200,000)"], ["2", "Bravo", "score rank 2 among applicants (3,000,000)"], ["3", "Não preenchida", ""]]);
    await expect(page.locator("[data-plan-warnings]")).toContainText("Delta has no score");

    await page.getByRole("button", { name: "Criar link público" }).click();
    await page.goto(await page.locator("#kx-link").inputValue());
    await expect(page.locator("[data-view]")).toContainText("As pontuações não estão incluídas neste link.");
    await expect(page.locator("[data-view]")).not.toContainText("4,200,000");
    expect(await ledgerRows(page, "2026-10-01")).toEqual([["1", "Echo", "manual: Garrison lead for Kingsland"], ["2", "Alpha", `score rank 1 ${rest}`], ["3", "Bravo", `score rank 2 ${rest}`]]);

    await gotoHydrated(page, "/kingdom/mge/");
    await page.getByLabel("Incluir pontuações no link público").check();
    await page.getByRole("button", { name: "Criar link público" }).click();
    await page.goto(await page.locator("#kx-link").inputValue());
    await expect(page.locator('table[data-ledger="2026-10-01"]')).toContainText("4,200,000");
  });

  test("manual placement needs a reason; lock keeps history", async ({ page }) => {
    await seed(page, [PLAN]);
    await gotoHydrated(page, "/kingdom/mge/");
    const block = page.locator('[data-event="2026-10-15"]');
    await block.getByText("Colocar um governador à mão").click();
    await block.getByRole("button", { name: /Colocar na vaga/ }).click();
    await expect(block.locator(".kg-error")).toContainText("Escreva por que este governador fica com esta vaga");
    await block.getByLabel("Vaga").selectOption("3");
    await block.getByLabel("Governador", { exact: true }).selectOption({ label: "Charlie" });
    await block.getByLabel("Motivo (obrigatório)").fill("Rally lead, applied late");
    await block.getByRole("button", { name: "Colocar na vaga 3" }).click();
    expect((await ledgerRows(page, "2026-10-15"))[2]).toEqual(["3", "Charlie", "manual: Rally lead, applied late"]);

    const first = page.locator('[data-event="2026-10-01"]');
    await first.getByRole("button", { name: "Travar evento" }).click();
    await expect(first.getByText("Travado", { exact: true })).toBeVisible();
    // Raising Charlie's score (an applicant of the locked event) does not change its stored ledger.
    await page.getByLabel("Governadores, um por linha").fill("Charlie, 9m");
    await page.getByRole("button", { name: "Adicionar da lista" }).click();
    await expect(page.locator("[data-cand-status]")).toContainText("Pontuação atualizada em 1.");
    expect((await ledgerRows(page, "2026-10-01")).map((r) => r[1])).toEqual(["Echo", "Alpha", "Bravo"]);

    await page.reload();
    await expect(page.locator('[data-event="2026-10-01"]').getByText("Travado", { exact: true })).toBeVisible();
  });

  test("inline edit by keyboard: rename keeps placements and locked history; bad scores are refused", async ({ page }) => {
    const errors = trackErrors(page);
    await seed(page, [PLAN]);
    await gotoHydrated(page, "/kingdom/mge/");
    const first = page.locator('[data-event="2026-10-01"]');
    await first.getByRole("button", { name: "Travar evento" }).click();
    await expect(first.getByText("Travado", { exact: true })).toBeVisible();

    // Open the editor from the keyboard; focus lands in the name field.
    await page.getByRole("button", { name: "Editar Echo" }).focus();
    await page.keyboard.press("Enter");
    const editor = page.locator('[data-editor="e"]');
    await expect(editor.getByRole("group", { name: "Editar Echo" })).toBeVisible();
    await expect(page.getByLabel("Nome de Echo")).toBeFocused();

    // Escape cancels and returns focus to the row's Edit button.
    await page.keyboard.press("Escape");
    await expect(editor).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Editar Echo" })).toBeFocused();

    await page.keyboard.press("Enter");
    await page.keyboard.press("Control+A");
    await page.keyboard.type("Echo Prime");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Pontuação de Echo (opcional)")).toBeFocused();
    await page.keyboard.press("Control+A");
    await page.keyboard.type("9,007,199,254,740,992");
    await page.keyboard.press("Enter");
    const scoreInput = page.getByLabel("Pontuação de Echo (opcional)");
    await expect(scoreInput).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#kx-edit-e-score-error")).toContainText("too large");
    await expect(scoreInput).toHaveAttribute("aria-describedby", /kx-edit-e-score-error/);
    await expect(scoreInput).toBeFocused();

    await page.keyboard.press("Control+A");
    await page.keyboard.type("5m");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Etiquetas de Echo (opcional)")).toBeFocused();
    await page.keyboard.type("Garrison Lead");
    await page.keyboard.press("Enter");
    await expect(editor).toHaveCount(0);
    await expect(page.locator("[data-cand-status]")).toHaveText("Echo Prime (era Echo) salvo.");
    await expect(page.getByRole("button", { name: "Editar Echo Prime" })).toBeFocused();
    await expect(page.locator('tr[data-candidate="e"]')).toContainText("5,000,000");
    await expect(page.locator('tr[data-candidate="e"]')).toContainText("garrison lead");

    // The locked event keeps the old name; the open event uses the new one and the manual placement stays attached.
    expect((await ledgerRows(page, "2026-10-01"))[0]).toEqual(["1", "Echo", "manual: Garrison lead for Kingsland"]);
    await page.reload();
    await expect(page.locator('tr[data-candidate="e"] td').first()).toHaveText("Echo Prime");
    expect((await ledgerRows(page, "2026-10-01"))[0]![1]).toBe("Echo");

    // Duplicate name: allowed, with the warning.
    await page.getByRole("button", { name: "Editar Bravo" }).click();
    await page.getByLabel("Nome de Bravo").fill("alpha");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.locator("[data-cand-status]")).toContainText("Outro governador também se chama alpha");
    await expect(page.locator("[data-plan-warnings]")).toContainText('share the name "Alpha"');
    expect(errors).toEqual([]);
  });

  test("CSV downloads: ledger (scores off by default, then on) and governors, UTF-8 with BOM, no network", async ({ page }) => {
    const errors = trackErrors(page);
    await seed(page, [PLAN]);
    await gotoHydrated(page, "/kingdom/mge/");
    const requests: string[] = [];
    page.on("request", (r) => { if (!r.url().startsWith("blob:") && !r.url().startsWith("data:")) requests.push(r.url()); });
    const get = async (name: string): Promise<{ file: string; bytes: Buffer }> => {
      const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name }).click()]) as [Download, unknown];
      return { file: dl.suggestedFilename(), bytes: await readFile((await dl.path())!) };
    };

    const ledger = await get("Baixar CSV do registro");
    expect(ledger.file).toMatch(/^kingdomops-mge-ledger-k1234-mge-\d{4}-\d{2}-\d{2}\.csv$/);
    expect([...ledger.bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = ledger.bytes.toString("utf8").slice(1);
    const rest = "among applicants not placed by hand";
    expect(text.split("\r\n")).toEqual([
      "date,commander,slot,governor,reason,locked",
      "2026-10-01,Cao Cao,1,Echo,manual: Garrison lead for Kingsland,no",
      `2026-10-01,Cao Cao,2,Alpha,score rank 1 ${rest},no`,
      `2026-10-01,Cao Cao,3,Bravo,score rank 2 ${rest},no`,
      "2026-10-15,,1,Alpha,score rank 1 among applicants,no",
      "2026-10-15,,2,Bravo,score rank 2 among applicants,no",
      "2026-10-15,,3,,not filled,no",
      "",
    ]);
    await expect(page.locator("[data-csv-status]")).toContainText("está pronto: confira seus downloads.");

    await page.getByLabel("Incluir pontuações no CSV do registro").check();
    const scored = (await get("Baixar CSV do registro")).bytes.toString("utf8");
    expect(scored).toContain("date,commander,slot,governor,reason,locked,score\r\n");
    expect(scored).toContain(`2026-10-01,Cao Cao,2,Alpha,"score rank 1 ${rest} (4,200,000)",no,4200000\r\n`);

    const gov = await get("Baixar CSV dos governadores");
    expect(gov.file).toMatch(/^kingdomops-mge-governors-k1234-mge-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(gov.bytes.toString("utf8")).toBe("\uFEFFname,score,tags\r\nAlpha,4200000,\r\nBravo,3000000,\r\nCharlie,2000000,\r\nDelta,,\r\nEcho,1000000,\r\n");
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("bad links show a plain error", async ({ page }) => {
    await gotoHydrated(page, "/kingdom/mge/view/#d=1zNOT-A-REAL-LINK");
    await expect(page.getByRole("alert")).toContainText("This link is damaged");
    await gotoHydrated(page, "/kingdom/mge/view/");
    await expect(page.getByRole("alert")).toContainText("This link has no document in it");
  });

  test("360px: no sideways scroll, 44px targets (filled)", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await seed(page, [PLAN]);
    await gotoHydrated(page, "/kingdom/mge/");
    await expect(page.locator("[data-event]")).toHaveCount(2);
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    // With the inline governor editor open, too.
    await page.getByRole("button", { name: "Editar Charlie" }).click();
    await expect(page.getByLabel("Nome de Charlie")).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
    await page.getByRole("button", { name: "Cancelar" }).click();
    await page.getByRole("button", { name: "Criar link público" }).click();
    await page.goto(await page.locator("#kx-link").inputValue());
    await expect(page.locator("[data-view]")).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectTargets44(page);
  });

  for (const theme of ["dark", "light"] as const) {
    for (const state of ["empty", "filled"] as const) {
      test(`axe planner ${theme} ${state}`, async ({ page }) => {
        await seed(page, state === "filled" ? [PLAN] : [], theme);
        await gotoHydrated(page, "/kingdom/mge/");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("[data-mge]")).toBeVisible();
        if (state === "filled") await expect(page.locator("[data-event]")).toHaveCount(2);
        await expectAxeClean(page);
      });
    }

    test(`axe planner ${theme} with the governor editor open (and an error)`, async ({ page }) => {
      await seed(page, [PLAN], theme);
      await gotoHydrated(page, "/kingdom/mge/");
      await page.getByRole("button", { name: "Editar Alpha" }).click();
      await page.getByLabel("Pontuação de Alpha (opcional)").fill("lots");
      await page.getByRole("button", { name: "Salvar" }).click();
      await expect(page.locator("#kx-edit-a-score-error")).toBeVisible();
      await expectAxeClean(page);
    });

    test(`axe view ${theme} (ledger and error)`, async ({ page }) => {
      await seed(page, [PLAN], theme);
      await gotoHydrated(page, "/kingdom/mge/");
      await page.getByRole("button", { name: "Criar link público" }).click();
      await page.goto(await page.locator("#kx-link").inputValue());
      await expect(page.locator("[data-view]")).toBeVisible();
      await expectAxeClean(page);
      await gotoHydrated(page, "/kingdom/mge/view/#d=xx");
      await expect(page.getByRole("alert")).toBeVisible();
      await expectAxeClean(page);
    });
  }
});
