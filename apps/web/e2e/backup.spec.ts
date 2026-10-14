// Wave G: "Back up everything" on /me/ — one file with every ko:* section; restore shows a diff first.
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WEBHOOK = "https://discord.com/api/webhooks/123456789012345678/AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-AbCdEfGhIjKlMnOpQrStUvWxYz0123";

async function seedAll(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate((wh) => {
    localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: "dark", profileCode: null }));
    localStorage.setItem("ko:card:v1", JSON.stringify({ v: 1, name: "Ana", tag: "K1", color: "jade", reduceMotion: null }));
    localStorage.setItem("ko:farms:v1", JSON.stringify({ v: 1, farms: [], shipments: [], showHypotheses: false }));
    localStorage.setItem("ko:kingdom:webhook:v1", JSON.stringify({ v: 1, url: wh }));
  }, WEBHOOK);
}

const hydrated = (page: Page) => expect(page.locator("astro-island[ssr]")).toHaveCount(0);

test("export holds every section but never the webhook; restore shows the diff and waits for confirmation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seedAll(page);
  await page.goto("/me/#me-row-backup"); // UX stage 1: the Backup row opens from its link
  await hydrated(page);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Fazer backup de tudo" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^kingdomops-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const file = JSON.parse(readFileSync((await download.path())!, "utf8"));
  expect(file.app).toBe("kingdomops-backup");
  expect(file.v).toBe(1);
  expect(Object.keys(file.keys).sort()).toEqual(["ko:card:v1", "ko:farms:v1", "ko:v1"]);
  expect(JSON.stringify(file)).not.toContain("webhooks");
  await expect(page.locator("[data-backup-status]")).toContainText("3 seções");

  // Change the device, then restore: the plan lists the differences and writes nothing yet.
  file.keys["ko:farms:v1"].showHypotheses = true;
  file.keys["ko:tools:v1"] = { v: 1, inventory: { gems: 3000 }, inputs: {}, checks: {} };
  await page.evaluate(() => localStorage.setItem("ko:card:v1", JSON.stringify({ v: 1, name: "Bo", tag: "", color: "jade", reduceMotion: null })));
  await page.locator("[data-backup-file]").setInputFiles({ name: "b.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(file)) });
  const plan = page.locator("[data-restore-plan]");
  await expect(plan.getByRole("heading", { name: "Restaurar este backup?" })).toBeFocused();
  await expect(plan.locator('[data-restore-row="ko:card:v1"]')).toHaveAttribute("data-change", "replace");
  await expect(plan.locator('[data-restore-row="ko:card:v1"]')).toContainText("Aqui agora: Bo");
  await expect(plan.locator('[data-restore-row="ko:card:v1"]')).toContainText("No arquivo: Ana [K1]");
  await expect(plan.locator('[data-restore-row="ko:v1"]')).toHaveAttribute("data-change", "same");
  await expect(plan.locator('[data-restore-row="ko:tools:v1"]')).toHaveAttribute("data-change", "add");
  expect(await page.evaluate(() => localStorage.getItem("ko:tools:v1"))).toBeNull();

  await plan.getByRole("button", { name: "Restaurar 3 seções" }).click();
  await page.waitForLoadState("load");
  await hydrated(page);
  const after = await page.evaluate(() => ({
    card: JSON.parse(localStorage.getItem("ko:card:v1") ?? "null"),
    tools: JSON.parse(localStorage.getItem("ko:tools:v1") ?? "null"),
    webhook: localStorage.getItem("ko:kingdom:webhook:v1"),
  }));
  expect(after.card.name).toBe("Ana");
  expect(after.tools.inventory).toEqual({ gems: 3000 });
  expect(after.webhook).toContain("webhooks");
  expect(errors).toEqual([]);
});

test("a wrong file is refused with a message; cancel leaves the device as it was", async ({ page }) => {
  await seedAll(page);
  await page.goto("/me/#me-row-backup"); // UX stage 1: the Backup row opens from its link
  await hydrated(page);
  const input = page.locator("[data-backup-file]");
  await input.setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from('{"app":"kingdomops","v":1}') });
  await expect(page.getByRole("alert").filter({ hasText: "não é um backup do KingdomOps" })).toBeVisible();
  await input.setInputFiles({
    name: "b.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ app: "kingdomops-backup", v: 1, keys: { "ko:card:v1": { v: 1, name: "Zed", tag: "", color: "jade", reduceMotion: null } } })),
  });
  await page.locator("[data-restore-plan]").getByRole("button", { name: "Cancelar" }).click();
  await expect(page.locator("[data-restore-plan]")).toHaveCount(0);
  await expect(page.locator("[data-backup-status]")).toHaveText("Restauração cancelada.");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ko:card:v1")!).name)).toBe("Ana");
});

for (const theme of ["dark", "light"] as const) {
  test(`axe ${theme} /me/ with the restore plan open`, async ({ page }) => {
    await seedAll(page);
    await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
    await page.goto("/me/#me-row-backup"); // UX stage 1: the Backup row opens from its link
    await hydrated(page);
    await page.locator("[data-backup-file]").setInputFiles({
      name: "b.json", mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ app: "kingdomops-backup", v: 1, exportedAt: "2026-10-13T10:00:00Z", keys: { "ko:card:v1": { v: 1, name: "Zed", tag: "", color: "jade", reduceMotion: null }, "ko:crest:v1": 5 } })),
    });
    await expect(page.locator("[data-restore-plan]")).toBeVisible();
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
