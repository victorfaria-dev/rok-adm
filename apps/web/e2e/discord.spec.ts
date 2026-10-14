// Wave G: "Post to Discord" with a webhook the council pastes itself. Discord is mocked with page.route;
// no request leaves the test machine.
import { expect, test, type Page, type Request } from "@playwright/test";
import { expectAxeClean, gotoHydrated, seed, trackErrors } from "./kingdom-helpers";

const ID = "123456789012345678";
const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-AbCdEfGhIjKlMnOpQrStUvWxYz0123";
const WEBHOOK = `https://discord.com/api/webhooks/${ID}/${TOKEN}`;
const WEBHOOK_KEY = "ko:kingdom:webhook:v1";

/** Every console line, to check the URL's token is never logged. */
function consoleLines(page: Page): string[] {
  const lines: string[] = [];
  page.on("console", (m) => lines.push(m.text()));
  return lines;
}

/** Mock Discord: answer each POST with the given responses in order (last one repeats). */
async function mockDiscord(page: Page, responses: Array<{ status: number; body?: unknown }>): Promise<Request[]> {
  const seen: Request[] = [];
  await page.route("https://discord.com/api/webhooks/**", async (route) => {
    seen.push(route.request());
    const r = responses[Math.min(seen.length - 1, responses.length - 1)]!;
    await route.fulfill({
      status: r.status,
      headers: { "access-control-allow-origin": "*", "content-type": "application/json" },
      body: r.body === undefined ? "" : JSON.stringify(r.body),
    });
  });
  return seen;
}

const PLAN = {
  id: "p1", kind: "mge", title: "K1 MGE", updatedAt: "2026-10-13T10:00:00.000Z",
  data: {
    id: "p1", updatedAt: "2026-10-13T10:00:00.000Z", title: "K1 MGE", slotsPerEvent: 2, policy: "score", cooldownEvents: 0, applicationsRequired: false,
    candidates: [{ id: "a", name: "Alpha", score: 4_200_000, tags: [] }, { id: "b", name: "@everyone", score: 100, tags: [] }],
    events: [{ id: "e1", date: "2026-10-01", commander: "Cao Cao", applicants: [], overrides: [], locked: false, result: null }],
  },
};

async function seedWebhook(page: Page): Promise<void> {
  await page.evaluate(([k, u]) => localStorage.setItem(k!, JSON.stringify({ v: 1, url: u })), [WEBHOOK_KEY, WEBHOOK]);
}

test("hub: paste, validate, save (masked), keep out of the council export, forget", async ({ page }) => {
  const errors = trackErrors(page);
  const lines = consoleLines(page);
  await gotoHydrated(page, "/kingdom/");
  const box = page.locator("#discord");
  await expect(box.locator("[data-webhook-warning]")).toContainText("Qualquer pessoa com esta URL pode publicar nesse canal.");
  const input = box.getByLabel("URL do webhook do Discord");
  await input.fill("https://evil.example/api/webhooks/1/2");
  await box.getByRole("button", { name: "Salvar webhook" }).click();
  await expect(box.locator(".dc-error")).toContainText("Só webhooks em discord.com");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.fill(`${WEBHOOK}?wait=true`);
  await box.getByRole("button", { name: "Salvar webhook" }).click();
  await expect(box.locator(".dc-error")).toContainText("Remova tudo depois do token");

  await input.fill(WEBHOOK);
  await box.getByRole("button", { name: "Salvar webhook" }).click();
  await expect(box.locator("[data-webhook-saved]")).toHaveText("Webhook: discord.com/api/webhooks/1234…5678 (token oculto)");
  await expect(page.locator("#main")).not.toContainText(TOKEN);
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), WEBHOOK_KEY)).toEqual({ v: 1, url: WEBHOOK });

  // The council export never carries it.
  await seed(page, [PLAN]);
  await seedWebhook(page);
  await gotoHydrated(page, "/kingdom/");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export (.json)" }).click()]);
  const { readFileSync } = await import("node:fs");
  expect(readFileSync((await download.path())!, "utf8")).not.toContain(TOKEN);

  await page.locator("#discord").getByRole("button", { name: "Esquecer webhook" }).click();
  await expect(page.locator("#discord").getByLabel("URL do webhook do Discord")).toBeVisible();
  expect(await page.evaluate((k) => localStorage.getItem(k), WEBHOOK_KEY)).toBeNull();
  expect(lines.filter((l) => l.includes(TOKEN))).toEqual([]);
  expect(errors).toEqual([]);
});

test("MGE: preview is exactly what is posted; nothing is sent before the click; mentions never ping", async ({ page }) => {
  const errors = trackErrors(page);
  const lines = consoleLines(page);
  const sent = await mockDiscord(page, [{ status: 204 }]);
  await seed(page, [PLAN]);
  await seedWebhook(page);
  await gotoHydrated(page, "/kingdom/mge/");
  const panel = page.locator('[data-discord="mge"]');
  await panel.locator("summary").click();
  const preview = panel.locator("[data-discord-preview]");
  await expect(preview).toContainText("**Resultados do MGE: K1 MGE**");
  await expect(preview).toContainText("1. Alpha — score rank 1");
  await expect(preview).toContainText("2. @​everyone — score rank 2");
  await expect(preview).not.toContainText("4.200.000");
  expect(sent).toHaveLength(0);

  const text = await preview.textContent();
  await panel.getByRole("button", { name: "Enviar ao Discord" }).click();
  await expect(panel.locator('[data-discord-result="ok"]')).toHaveText("Publicado no Discord.");
  expect(sent).toHaveLength(1);
  expect(sent[0]!.method()).toBe("POST");
  expect(sent[0]!.url()).toBe(WEBHOOK);
  expect(sent[0]!.postDataJSON()).toEqual({ content: text, allowed_mentions: { parse: [] } });

  // Creating the public link adds it to the message (new message → old result cleared).
  await page.getByRole("button", { name: "Create public link" }).click();
  await expect(preview).toContainText("Registro completo: http");
  await expect(panel.locator("[data-discord-result]")).toHaveCount(0);
  expect(lines.filter((l) => l.includes(TOKEN))).toEqual([]);
  expect(errors).toEqual([]);
});

test("rate limit (429) and deleted webhook (404) are explained; Send waits for Discord's delay", async ({ page }) => {
  const sent = await mockDiscord(page, [{ status: 429, body: { message: "You are being rate limited.", retry_after: 1.2, global: false } }, { status: 404, body: { code: 10015 } }]);
  await seed(page, [PLAN]);
  await seedWebhook(page);
  await gotoHydrated(page, "/kingdom/mge/");
  const panel = page.locator('[data-discord="mge"]');
  await panel.locator("summary").click();
  const send = panel.getByRole("button", { name: "Enviar ao Discord" });
  await send.click();
  await expect(panel.getByRole("alert")).toContainText("Tente de novo em 2 segundos.");
  await expect(send).toBeDisabled();
  await expect(send).toBeEnabled({ timeout: 5000 });
  await send.click();
  await expect(panel.getByRole("alert")).toContainText("foi excluído ou a URL está errada");
  await expect(panel.getByRole("alert")).not.toContainText(TOKEN);
  expect(sent).toHaveLength(2);
});

test("no webhook saved: Send stays off and the panel asks for one", async ({ page }) => {
  await seed(page, [PLAN]);
  await gotoHydrated(page, "/kingdom/mge/");
  const panel = page.locator('[data-discord="mge"]');
  await panel.locator("summary").click();
  await expect(panel.getByRole("button", { name: "Enviar ao Discord" })).toBeDisabled();
  await expect(panel).toContainText("Salve um webhook primeiro.");
  await panel.getByLabel("URL do webhook do Discord").fill(WEBHOOK);
  await panel.getByRole("button", { name: "Salvar webhook" }).click();
  await expect(panel.getByRole("button", { name: "Enviar ao Discord" })).toBeEnabled();
});

test("recruitment post and rules link go to Discord in Discord format", async ({ page }) => {
  const sent = await mockDiscord(page, [{ status: 204 }]);
  await page.goto("/");
  await seedWebhook(page);
  await gotoHydrated(page, "/kingdom/recruit/");
  const panel = page.locator('[data-discord="recruit"]');
  await panel.locator("summary").click();
  await expect(panel.locator("[data-discord-reason]")).toContainText("a publicação está vazia");
  await page.getByLabel("Contact").fill("DM Ana on Discord");
  await expect(panel.locator("[data-discord-preview]")).toContainText("DM Ana on Discord");
  await panel.getByRole("button", { name: "Enviar ao Discord" }).click();
  await expect(panel.locator('[data-discord-result="ok"]')).toBeVisible();
  expect((sent[0]!.postDataJSON() as { content: string }).content).toContain("DM Ana on Discord");

  await gotoHydrated(page, "/kingdom/rules/");
  await page.locator("[data-new-blank]").click();
  const rules = page.locator('[data-discord="rules"]');
  await rules.locator("summary").click();
  await expect(rules.locator("[data-discord-reason]")).toContainText("Crie primeiro o link somente para visualização");
  await page.locator("[data-make-link]").click();
  await expect(rules.locator("[data-discord-preview]")).toContainText("Leia as regras do nosso reino (somente leitura): http");
});

test("farm log: weekly summary to Discord", async ({ page }) => {
  const sent = await mockDiscord(page, [{ status: 204 }]);
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  await page.goto("/");
  await page.evaluate(([day]) => localStorage.setItem("ko:farms:v1", JSON.stringify({
    v: 1, showHypotheses: false,
    farms: [{ id: "fa", name: "Alpha_farm", role: "food", note: "", levels: { cityHall: 15, tradingPost: null, goldmine: null, academy: null, commanderLevel: null }, gatheringUntil: null, daily: null, goal: null, createdAt: new Date().toISOString() }],
    shipments: [{ id: "s1", farmId: "fa", date: day, resource: "food", gross: 200000, taxRate: 0.1, net: 180000, note: "" }],
  })), [today]);
  await seedWebhook(page);
  await page.goto("/farms/log/");
  const panel = page.locator('[data-discord="farms"]');
  await panel.locator("summary").click();
  const preview = panel.locator("[data-discord-preview]");
  await expect(preview).toContainText("Recebido pela principal: **180.000** (1 envio, imposto pago 20.000)");
  await expect(preview).toContainText("Alpha\\_farm: recebido 180.000");
  await panel.getByRole("button", { name: "Enviar ao Discord" }).click();
  await expect(panel.locator('[data-discord-result="ok"]')).toBeVisible();
  expect(sent).toHaveLength(1);
});

for (const theme of ["dark", "light"] as const) {
  test(`axe ${theme}: hub webhook settings and MGE panel open`, async ({ page }) => {
    await seed(page, [PLAN], theme);
    await gotoHydrated(page, "/kingdom/");
    await expectAxeClean(page);
    await seedWebhook(page);
    await gotoHydrated(page, "/kingdom/mge/");
    await expectAxeClean(page);
  });
}
