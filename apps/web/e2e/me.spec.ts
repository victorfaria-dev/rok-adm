import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { QUESTIONS } from "@rokadm/core";
import { expect, test, type Page } from "@playwright/test";
import { importStore } from "../src/lib/store";

const CODE = "1.0.1.0.12.30.....0";
const RICH = "1.0.0.0.12.30...10000..0";
const h1 = (page: Page) => page.getByRole("heading", { level: 1 });

/** Seed localStorage before the island reads it. */
async function seed(page: Page, store: object) {
  await page.goto("/");
  await page.evaluate((s) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: "dark", ...s })), store);
}

const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("ko:v1") ?? "null"));

/** UX stage 1: Me is a grouped list hub; long content opens behind a row. */
async function openRow(page: Page, label: string) {
  const row = page.locator("details.me-row-item").filter({ has: page.locator("summary", { hasText: label }) });
  await expect(row).toHaveCount(1);
  if ((await row.getAttribute("open")) === null) await row.locator("summary").click();
  await expect(row).toHaveAttribute("open", "");
}

test("summary shows a seeded profile in words", async ({ page }) => {
  await seed(page, { profileCode: CODE });
  await page.goto("/me/");
  await expect(h1(page)).toHaveText("Eu: Principal");
  await expect(page.locator(".me-hero-line")).toHaveText("Jogador · F2P · CH 12");
  await openRow(page, "Perfil e contas");
  await expect(page.getByLabel("What is this account's main role?")).toHaveValue("farm");
  await expect(page.getByText("F2P — $0 per month").first()).toBeVisible();
  await expect(page.locator("main").getByText("30 min", { exact: true })).toBeVisible();
  await expect(page.getByText(QUESTIONS[0]!.label)).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
});

test("hub: header, Playing as, then grouped rows with Guides first", async ({ page }) => {
  await seed(page, { profileCode: CODE });
  await page.goto("/me/");
  await expect(page.locator(".me-avatar")).toHaveText("PR");
  await expect(page.getByRole("radio", { name: "Jogador" })).toBeChecked();
  const groups = page.locator("ul.me-group");
  await expect(groups).toHaveCount(3);
  await expect(groups.first().locator(".me-item-label").first()).toHaveText("Guias");
  await expect(groups.first().getByRole("link", { name: "Guias" })).toHaveAttribute("href", "/guides/");
  await expect(page.getByRole("link", { name: "Cartão para compartilhar" })).toHaveAttribute("href", "/card/");
  // Long text sits behind the rows: nothing of the data section shows until its row opens.
  await expect(page.getByRole("button", { name: "Exportar arquivo de perfil" })).toBeHidden();
  await openRow(page, "Seus dados");
  await expect(page.getByRole("button", { name: "Exportar arquivo de perfil" })).toBeVisible();
});

test("no profile shows the empty state", async ({ page }) => {
  await page.goto("/me/");
  await openRow(page, "Perfil e contas");
  const cta = page.getByRole("link", { name: "Começar", exact: true });
  await expect(cta).toHaveAttribute("href", "/start/");
  await expect(page.getByRole("button", { name: "Editar respostas" })).toHaveCount(0);
});

test("F-72: rule shown and override persists after reload", async ({ page }) => {
  await seed(page, { profileCode: RICH });
  await page.goto("/me/");
  await openRow(page, "Perfil e contas");
  await expect(page.getByText("High (elevado pelo gasto total)")).toBeVisible();
  await expect(page.getByText("Regra do produto, não um fato do jogo")).toBeVisible();
  await page.getByRole("radio", { name: /^Whale/ }).check();
  await expect(page.getByText("Whale (definido à mão)")).toBeVisible();
  await page.reload();
  await openRow(page, "Perfil e contas");
  await expect(page.getByRole("radio", { name: /^Whale/ })).toBeChecked();
  expect((await stored(page)).profileOverride).toBe("whale");
  await page.getByRole("radio", { name: "Automático (recomendado)" }).check();
  await page.reload();
  await openRow(page, "Perfil e contas");
  await expect(page.getByRole("radio", { name: "Automático (recomendado)" })).toBeChecked();
  expect((await stored(page)).profileOverride).toBeNull();
});

test("Edit answers clears the draft and opens /start/ with the saved answers", async ({ page }) => {
  await seed(page, { profileCode: CODE, draft: { step: 2, answers: { spending: "whale" } } });
  await page.goto("/me/");
  await openRow(page, "Perfil e contas");
  await page.getByRole("button", { name: "Editar respostas" }).click();
  await page.waitForURL(/\/start\/$/);
  await expect(h1(page)).toHaveText("Confira suas respostas");
  await expect(page.getByText("F2P — $0 per month")).toBeVisible();
  await expect(page.getByText("Whale")).toHaveCount(0);
});

test("theme change applies and persists", async ({ page }) => {
  await page.goto("/me/");
  await openRow(page, "Aparência");
  const main = page.locator("main");
  await main.getByRole("radio", { name: "Claro" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("[data-theme-picker] input[value=light]").first()).toBeChecked();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await openRow(page, "Aparência");
  await expect(main.getByRole("radio", { name: "Claro" })).toBeChecked();
  await main.getByRole("radio", { name: "Sistema" }).check();
  await expect.poll(() => page.evaluate(() => document.documentElement.hasAttribute("data-theme"))).toBe(false);
  expect((await stored(page)).theme).toBe("system");
});

test("export downloads a JSON file that import accepts", async ({ page }) => {
  await seed(page, { profileCode: CODE, theme: "light", commanders: { minamoto: { q1: "a" } } });
  await page.goto("/me/");
  await openRow(page, "Seus dados");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportar arquivo de perfil" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^kingdomops-\d{4}-\d{2}-\d{2}\.json$/);
  const text = await readFile((await download.path())!, "utf8");
  expect(importStore(text)).toMatchObject({ profileCode: CODE, theme: "light", commanders: { minamoto: { q1: "a" } } });
});

test("import restores a valid file and rejects an invalid one", async ({ page }) => {
  await seed(page, { profileCode: CODE });
  await page.goto("/me/");
  // The profile renders only after the island has hydrated and read the store: no lost change events.
  await openRow(page, "Perfil e contas");
  await expect(page.getByRole("button", { name: "Editar respostas" })).toBeVisible();
  await openRow(page, "Seus dados");
  const input = page.locator("input[type=file]:not([data-backup-file])");

  await input.setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from("{\"hello\":1}") });
  await expect(page.getByRole("alert")).toContainText("não é uma exportação do KingdomOps");
  expect((await stored(page)).profileCode).toBe(CODE);

  const backup = JSON.stringify({ app: "kingdomops", v: 1, profileCode: RICH, theme: "light", profileOverride: "kraken", draft: null, routine: null, routinePrefs: null, commanders: {} });
  await input.setInputFiles({ name: "good.json", mimeType: "application/json", buffer: Buffer.from(backup) });
  await expect(page.getByText(/^Importado\./)).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText("");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByText("Kraken (definido à mão)")).toBeVisible();
  await page.reload();
  await openRow(page, "Perfil e contas");
  await expect(page.getByText("Kraken (definido à mão)")).toBeVisible();
  expect(await stored(page)).toMatchObject({ profileCode: RICH, theme: "light", profileOverride: "kraken" });
});

test("delete: cancel keeps data, confirm removes it", async ({ page }) => {
  await seed(page, { profileCode: CODE, theme: "light" });
  await page.goto("/me/");
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  await openRow(page, "Seus dados");
  const trigger = page.getByRole("button", { name: "Apagar todos os dados" });

  await trigger.click();
  await expect(page.getByRole("heading", { name: "Apagar tudo?" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("button", { name: "Cancelar" }).click();
  expect((await stored(page)).profileCode).toBe(CODE);

  // Every other store, the webhook secret and a session flag must go too (Q2 P1-1).
  await page.evaluate(() => {
    for (const k of ["ko:card:v1", "ko:crest:v1", "ko:tools:v1", "ko:farms:v1", "ko:kingdom:v1", "ko:kingdom:webhook:v1"]) localStorage.setItem(k, "{\"v\":1}");
    sessionStorage.setItem("ko:sting", "1");
    localStorage.setItem("not-ours", "keep");
  });
  await trigger.click();
  await expect(page.locator("[data-delete-list]")).toContainText("URL do webhook do Discord");
  await expect(page.locator("[data-delete-list]")).toContainText("Farms e registro de envios");
  await page.getByRole("checkbox", { name: /Remover também a cópia offline/ }).check();
  await page.getByRole("button", { name: "Apagar tudo" }).click();
  await expect(page.getByText(/Tudo o que o KingdomOps salvou neste navegador foi apagado, inclusive a URL do webhook do Discord/)).toBeVisible();
  await openRow(page, "Perfil e contas");
  await expect(page.getByRole("link", { name: "Começar", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const left = await page.evaluate(() => ({
    local: Object.keys(localStorage).filter((k) => k.startsWith("ko:")),
    session: Object.keys(sessionStorage).filter((k) => k.startsWith("ko:")),
    other: localStorage.getItem("not-ours"),
  }));
  expect(left).toEqual({ local: [], session: [], other: "keep" });
  await page.reload();
  await openRow(page, "Perfil e contas");
  await expect(page.getByRole("link", { name: "Começar", exact: true })).toBeVisible();
});

test("accounts: the profile is account #1, save a farm, switch, each keeps its own commanders, remove", async ({ page }) => {
  await seed(page, { profileCode: RICH, commanders: { minamoto: { q1: "main" } } });
  await page.goto("/me/");
  await openRow(page, "Perfil e contas");
  // An older single profile shows as account #1, in use.
  await expect(page.locator(".me-account")).toHaveCount(1);
  await expect(page.locator(".me-account").first()).toContainText("Principal");
  await expect(page.locator(".me-account").getByText("Em uso")).toBeVisible();
  const name = page.getByLabel("Salvar o perfil atual como");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.locator("#me-acc-error")).toContainText("Dê um nome a esta conta");
  await name.fill("Farm 1");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.locator(".me-account")).toHaveCount(2);

  await page.getByRole("button", { name: "Usar Farm 1" }).click();
  await expect(page.getByText('Agora usando "Farm 1".')).toBeVisible();
  let s = await stored(page);
  expect(s.savedProfiles.find((p: { id: string }) => p.id === s.activeAccountId).name).toBe("Farm 1");
  expect(s.commanders).toEqual({});
  await page.reload();
  await expect(h1(page)).toHaveText("Eu: Farm 1");
  await openRow(page, "Perfil e contas");
  await page.getByRole("button", { name: "Usar Principal" }).click();
  s = await stored(page);
  expect(s.profileCode).toBe(RICH);
  expect(s.commanders).toEqual({ minamoto: { q1: "main" } });

  await page.getByRole("button", { name: "Remover Farm 1" }).click();
  await expect(page.locator(".me-account")).toHaveCount(1);
  s = await stored(page);
  expect(s.savedProfiles.map((p: { name: string }) => p.name)).toEqual(["Principal"]);
  expect(s.profileCode).toBe(RICH);
});

test("360 px: no sideways scroll with the worst-case profile and confirmation open", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await seed(page, { profileCode: "1.5.4.4.25.1440.24.5000.10000000.byzantium.1", profileOverride: "kraken" });
  await page.goto("/me/");
  await openRow(page, "Perfil e contas");
  await expect(page.getByLabel("Roughly how much have you spent in total on this account?")).toHaveValue("10000000");
  await openRow(page, "Seus dados");
  await page.getByRole("button", { name: "Apagar todos os dados" }).click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe("accessibility", () => {
  for (const theme of ["dark", "light"] as const) {
    for (const c of [
      { name: "empty", store: {} },
      { name: "profile", store: { profileCode: RICH } },
      {
        name: "saved accounts",
        store: { profileCode: RICH, savedProfiles: [{ id: "m", name: "Main", code: RICH, override: null }, { id: "f", name: "Farm 1", code: CODE, override: null }] },
      },
      { name: "delete confirmation", store: { profileCode: RICH }, confirm: true },
    ]) {
      test(`axe ${theme}: ${c.name}`, async ({ page }) => {
        await seed(page, { theme, ...c.store });
        await page.goto("/me/");
        await expect(h1(page)).toBeVisible();
        for (const r of ["Perfil e contas", "Aparência", "Seus dados", "Backup"]) await openRow(page, r);
        await expect(page.getByRole("button", { name: "Exportar arquivo de perfil" })).toBeVisible();
        if (c.confirm) {
          await page.getByRole("button", { name: "Apagar todos os dados" }).click();
          await expect(page.getByRole("button", { name: "Apagar tudo" })).toBeVisible();
        }
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
