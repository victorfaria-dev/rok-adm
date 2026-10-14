// Wave D W2: /tools/gems/, /tools/migration/, /tools/kvk/, /tools/hoard/.
import { expect, test, type Page } from "@playwright/test";
import { axeViolations, hydrated, noSidewaysScroll, openInTheme, toolsStore } from "./helpers";

const ROUTES = ["/tools/gems/", "/tools/migration/", "/tools/kvk/", "/tools/hoard/"] as const;

async function fresh(page: Page, route: string): Promise<void> {
  await page.goto("/404.html");
  await page.evaluate(() => localStorage.clear());
  await page.goto(route);
  await hydrated(page);
}

test.describe("gem value table", () => {
  test("summary cites every row and links to the VIP calculator", async ({ page }) => {
    await fresh(page, "/tools/gems/");
    const sum = page.getByTestId("gems-summary");
    await expect(sum.locator('tr[data-row="vip"]')).toContainText("A05-0004");
    await expect(sum.locator('tr[data-row="ap"]')).toContainText("A04-0008");
    await expect(sum.locator('tr[data-row="speedups"]')).toContainText("A04-0007");
    await expect(sum.locator('tr[data-row="ch"]')).toContainText("800");
    await expect(sum.locator('tr[data-row="wheel"]')).toContainText("Confiança baixa");
    await expect(sum.getByRole("link", { name: "Pontos VIP" })).toHaveAttribute("href", "/tools/vip/");
    await expect(page.getByText(/Garantias da Roda da Fortuna.*precisa de dados de custo/)).toBeVisible();
    await expect(page.getByTestId("gems-guidance")).toContainText("Comunidade dividida");
  });

  test("AP ladder, City Hall gems and the VIP filter; saved under ko:tools:v1 only", async ({ page }) => {
    await fresh(page, "/tools/gems/");
    await page.getByLabel("Compras hoje").fill("5");
    await expect(page.getByTestId("gems-ap-total").locator(".t-value")).toHaveText("1.000");
    await expect(page.getByTestId("gems-ap-total")).toContainText("2.500 PA");
    await page.getByLabel("Nível da sua Prefeitura").fill("16");
    await expect(page.getByTestId("gems-ch-left").locator(".t-value")).toHaveText("700");
    await page.getByLabel("Mostrar itens que você pode comprar com").selectOption("3");
    await expect(page.getByTestId("gems-shop-count")).toHaveText("2 de 32 itens exibidos");
    await expect(page.getByTestId("gems-shop")).toContainText("1,20");
    const s = await toolsStore(page);
    expect(s).toMatchObject({ v: 1, inputs: { gems: { apBuys: 5, cityHall: 16, shopVip: "3" } } });
    expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();
    await page.reload();
    await hydrated(page);
    await expect(page.getByLabel("Compras hoje")).toHaveValue("5");
  });
});

async function fillEligible(page: Page): Promise<void> {
  await page.getByLabel("Nível da Prefeitura").fill("16");
  await page.getByLabel("Poder exibido (milhões)").fill("10");
  await page.getByLabel("Você está em uma aliança?").selectOption("no");
  await page.getByLabel("Todas as suas tropas estão em casa?").selectOption("yes");
  await page.getByLabel("Seus recursos estão dentro da proteção do Depósito?").selectOption("yes");
  await page.getByLabel("Há um período de espera de migração ativo?").selectOption("no");
  await page.getByLabel("Idade do personagem (dias)").fill("100");
  await page.getByLabel("Idade do reino de destino (dias)").fill("100");
}

test.describe("migration checker", () => {
  test("starts empty and neutral: no verdict before the user answers", async ({ page }) => {
    await fresh(page, "/tools/migration/");
    await expect(page.getByTestId("mig-verdict").locator(".t-value")).toHaveText("Ainda não verificado");
    await expect(page.getByTestId("mig-verdict")).toContainText("Responda mais 8 perguntas");
    await expect(page.getByLabel("Nível da Prefeitura")).toHaveValue("");
    await expect(page.getByTestId("mig-pages").locator(".t-value")).toHaveText("Digite o seu poder");
    await expect(page.locator('[data-check="ch"]')).toHaveAttribute("data-ok", "unknown");
    await expect(page.locator('[data-check="ch"]')).toContainText("Não verificado");
    await page.getByLabel("Nível da Prefeitura").fill("12");
    await expect(page.getByTestId("mig-verdict").locator(".t-value")).toHaveText("Não elegível");
    await page.getByLabel("Nível da Prefeitura").fill("");
    await expect(page.getByTestId("mig-verdict").locator(".t-value")).toHaveText("Ainda não verificado");
  });

  test("all answers passing are eligible; each failing rule is listed with its card and patch", async ({ page }) => {
    await fresh(page, "/tools/migration/");
    await fillEligible(page);
    await expect(page.getByTestId("mig-verdict").locator(".t-value")).toHaveText("Elegível");
    await page.getByLabel("Nível da Prefeitura").fill("15");
    await page.getByLabel("Você está em uma aliança?").selectOption("yes");
    await expect(page.getByTestId("mig-verdict").locator(".t-value")).toHaveText("Não elegível");
    await expect(page.getByTestId("mig-verdict")).toContainText("2 regras bloqueiam a mudança");
    const ch = page.locator('[data-check="ch"]');
    await expect(ch).toHaveAttribute("data-ok", "false");
    await expect(ch).toContainText("Bloqueia");
    await expect(ch).toContainText("B06-0001");
    await page.getByLabel("Nível da Prefeitura").fill("16");
    await page.getByLabel("Você está em uma aliança?").selectOption("no");
    await expect(page.getByTestId("mig-verdict").locator(".t-value")).toHaveText("Elegível");
  });

  test("age limit per route: 150 days passes, 151 fails (1.1.06)", async ({ page }) => {
    await fresh(page, "/tools/migration/");
    await page.getByLabel("Idade do reino de destino (dias)").fill("0");
    await page.getByLabel("Idade do personagem (dias)").fill("150");
    await expect(page.locator('[data-check="age"]')).toHaveAttribute("data-ok", "true");
    await expect(page.locator('[data-check="age"]')).toContainText("1.1.06");
    await page.getByLabel("Idade do personagem (dias)").fill("151");
    await expect(page.locator('[data-check="age"]')).toHaveAttribute("data-ok", "false");
    await page.getByLabel("Rota", { exact: true }).selectOption("cross-s3");
    await page.getByLabel("Idade do personagem (dias)").fill("120");
    await expect(page.locator('[data-check="age"]')).toHaveAttribute("data-ok", "true");
    await expect(page.locator('[data-check="cross-power"]')).toContainText("C04-0025");
  });

  test("passport pages: exact only at known data points, ranges in between", async ({ page }) => {
    await fresh(page, "/tools/migration/");
    const pages = page.getByTestId("mig-pages");
    const power = page.getByLabel("Poder exibido (milhões)");
    await power.fill("10");
    await expect(pages.locator(".t-value")).toHaveText("1 página");
    await power.fill("30");
    await expect(pages.locator(".t-value")).toHaveText("Entre 1 e 25 páginas");
    await expect(pages).toContainText("Tabela exata pendente");
    await power.fill("50");
    await expect(pages.locator(".t-value")).toHaveText("25 páginas");
    await power.fill("100");
    await expect(pages.locator(".t-value")).toHaveText("Entre 25 e 75 páginas");
    await power.fill("120");
    await expect(pages.locator(".t-value")).toHaveText("75 páginas");
  });

  test("officer link opens the checker with the kingdom fields only", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await fresh(page, "/tools/migration/");
    await page.getByLabel("Nível da Prefeitura").fill("22");
    await page.getByLabel("Rota", { exact: true }).selectOption("cross-s2");
    await page.getByLabel("Idade do reino de destino (dias)").fill("200");
    await page.getByLabel("Limite de poder do reino de destino (milhões, opcional)").fill("40");
    await page.getByRole("button", { name: /Copiar link para candidatos/ }).click();
    const status = page.getByTestId("mig-officer-status");
    await expect(status).not.toBeEmpty();
    const text = (await status.textContent()) ?? "";
    const url = text.startsWith("Copie este link: ") ? text.slice("Copie este link: ".length) : await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain("/tools/migration/?s=");
    await page.evaluate(() => localStorage.removeItem("ko:tools:v1"));
    await page.goto(url);
    await hydrated(page);
    await expect(page.getByText("Mostrando valores de um link")).toBeVisible();
    await expect(page.getByLabel("Rota", { exact: true })).toHaveValue("cross-s2");
    await expect(page.getByLabel("Idade do reino de destino (dias)")).toHaveValue("200");
    await expect(page.getByLabel("Limite de poder do reino de destino (milhões, opcional)")).toHaveValue("40");
    await expect(page.getByLabel("Nível da Prefeitura")).toHaveValue("");
    await expect(page.locator('[data-check="cap"]')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("ko:tools:v1"))).toBeNull();
  });

  test("before-you-move checklist persists in ko:tools:v1 only", async ({ page }) => {
    await fresh(page, "/tools/migration/");
    await page.getByRole("checkbox", { name: /Tenha Páginas de Passaporte suficientes/ }).check();
    expect(await toolsStore(page)).toMatchObject({ checks: { "migration-before": ["pages"] } });
    expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();
    await page.reload();
    await hydrated(page);
    await expect(page.getByRole("checkbox", { name: /Tenha Páginas de Passaporte suficientes/ })).toBeChecked();
    await expect(page.locator('[data-checklist="migration-before"] .t-progress')).toHaveText("1 de 7 concluídos");
  });
});

test.describe("KvK readiness", () => {
  test("grouped checklist with cites, No consensus items and related links; marks persist", async ({ page }) => {
    await fresh(page, "/tools/kvk/");
    for (const h of ["Prefeitura", "Tropas", "Hospital", "Acelerações e recursos", "Comandantes", "Aliança e comportamento"]) {
      await expect(page.getByRole("heading", { name: h, exact: true })).toBeVisible();
    }
    await expect(page.locator('[data-checklist="kvk-troops"]')).toContainText("A08-0500");
    await expect(page.locator('[data-checklist="kvk-commanders"]')).toContainText("Sem consenso");
    await expect(page.getByRole("link", { name: "Planejador de cura" })).toHaveAttribute("href", "/tools/healing/");
    await expect(page.getByRole("link", { name: "Guia de acúmulo" })).toHaveAttribute("href", "/tools/hoard/");
    await expect(page.getByTestId("kvk-explainer")).toContainText("Conferido em: 1.1.06");
    await page.getByRole("checkbox", { name: /Lute sua primeira KvK com T4/ }).check();
    expect(await toolsStore(page)).toMatchObject({ checks: { "kvk-troops": ["t4"] } });
    expect(await page.evaluate(() => localStorage.getItem("ko:v1"))).toBeNull();
    await page.reload();
    await hydrated(page);
    await expect(page.getByRole("checkbox", { name: /Lute sua primeira KvK com T4/ })).toBeChecked();
  });
});

test.describe("hoard advisor", () => {
  test("rules per goal with cites; divided advice is marked", async ({ page }) => {
    await fresh(page, "/tools/hoard/");
    await expect(page.locator('[data-goal="lohar"]')).toContainText("A11-0505");
    await expect(page.locator('[data-goal="mtg"]')).toContainText("7.000 gemas por dia");
    await expect(page.locator('[data-goal="eve"]')).toContainText("A09-0007");
    await expect(page.locator('[data-goal="mge"]')).toContainText("A11-0500");
    const universal = page.getByTestId("hoard-general").locator('[data-rule="universal"]');
    await expect(universal).toContainText("Comunidade dividida");
    await expect(universal).toContainText("A02-0503");
    await expect(page.getByTestId("hoard-general")).toContainText("A11-0512");
  });

  test("saved vs target reads and writes the shared inventory", async ({ page }) => {
    await page.goto("/404.html");
    await page.evaluate(() => localStorage.setItem("ko:tools:v1", JSON.stringify({ v: 1, inventory: { speedupHealingMin: 1234 }, inputs: {}, checks: {} })));
    await page.goto("/tools/hoard/");
    await hydrated(page);
    await page.getByLabel("Guardando para").selectOption("eve");
    await expect(page.getByLabel("Guardado: Acelerações de cura (minutos)")).toHaveValue("1234");
    await page.getByLabel("Guardando para").selectOption("mtg");
    await page.getByLabel("Guardado: Gemas (gemas)").fill("3000");
    await page.getByLabel(/Meta: Gemas \(gemas\)/).fill("7000");
    await expect(page.getByTestId("hoard-gap-gems").locator(".t-value")).toHaveText("Faltam 4.000 gemas (42%)");
    await expect(page.getByTestId("hoard-gap-gems")).toContainText("medição pendente");
    expect(await toolsStore(page)).toMatchObject({ inventory: { gems: 3000, speedupHealingMin: 1234 }, inputs: { hoard: { goal: "mtg", target_gems: 7000 } } });
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const [route, id] of [["/tools/gems/", "gems-ap-total"], ["/tools/migration/", "mig-verdict"], ["/tools/kvk/", "kvk-explainer"], ["/tools/hoard/", "hoard-general"]] as const) {
    test(`${route} renders defaults and sources`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByTestId(id)).toBeVisible();
      await expect(page.getByRole("heading", { name: "Fontes desta página" })).toBeVisible();
      await expect(page.getByText(/último patch oficial/)).toBeVisible();
    });
  }
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
  });
}
