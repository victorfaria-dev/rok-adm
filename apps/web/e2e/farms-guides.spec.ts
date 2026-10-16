import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/guides/farms/", "/guides/farms/food/", "/guides/farms/wood/", "/guides/farms/stone/", "/guides/farms/gold/"];

test.describe("farm guide pages", () => {
  for (const route of PAGES) {
    test(`${route} renders: one h1, badges, no console errors, no sideways scroll at 360px`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width: 360, height: 780 });
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 2, name: "Qual o grau de certeza?" })).toBeVisible();
      expect(await page.locator("[data-block]").count()).toBeGreaterThanOrEqual(3);
      // Every block shows its confidence as text.
      for (const block of await page.locator("[data-block]").all()) {
        await expect(block.locator("[data-confidence]")).toHaveCount(1);
        await expect(block.locator("[data-confidence]")).toHaveText(/Confiança|Conferência no jogo pendente/);
      }
      expect(await page.locator("[data-block] .fg-cite").count()).toBeGreaterThan(0);
      await expect(page.locator("[data-guardrail]")).toContainText("Você faz cada ação no jogo por conta própria");
      await expect(page.locator('a[href="/farms/"]').first()).toBeAttached();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  for (const route of ["/guides/farms/", "/guides/farms/food/", "/guides/farms/wood/"]) {
    test(`${route} labels the food + wood pair as a hypothesis`, async ({ page }) => {
      await page.goto(route);
      const hyp = page.locator('[data-block="farms-pair-food-wood"]');
      await expect(hyp.locator("[data-hypothesis]")).toHaveText("Hipótese: sem fonte");
      await expect(hyp).toContainText("Nenhuma fonte recomenda isto.");
      await hyp.getByText("Ler o raciocínio").click();
      await expect(hyp.getByText("Nenhuma fonte recomenda pares de recursos", { exact: true })).toBeVisible();
    });
  }

  test("only one pair block exists, and stone/gold pages don't show it", async ({ page }) => {
    for (const route of ["/guides/farms/stone/", "/guides/farms/gold/"]) {
      await page.goto(route);
      await expect(page.locator("[data-block] [data-hypothesis]")).toHaveCount(0);
    }
    await page.goto("/guides/farms/");
    await expect(page.locator('[data-block^="farms-pair-"]')).toHaveCount(1);
  });

  test("gold page shows both views of the split", async ({ page }) => {
    await page.goto("/guides/farms/gold/");
    const split = page.locator('[data-block="farms-gold-ship-or-main"] [data-split]');
    await expect(split).toBeVisible();
    await expect(split).toContainText("Visão A");
    await expect(split).toContainText("Visão B");
    await expect(page.locator('[data-block="farms-gold-ship-or-main"]')).toContainText("As fontes divergem");
  });

  test("the Why section opens and lists the cited cards", async ({ page }) => {
    await page.goto("/guides/farms/");
    const block = page.locator('[data-block="farms-general-accounts"]');
    await block.locator("summary", { hasText: "Por quê" }).click();
    await expect(block.locator(".fg-facts")).toContainText("C04-0006");
    await expect(block.locator(".fg-gaps")).toContainText("Pesquisa pendente: L-A13-02");
  });

  test("links between the guides", async ({ page }) => {
    await page.goto("/guides/farms/");
    const more = page.getByRole("navigation", { name: "Guias de farm" });
    await more.getByRole("link", { name: "Ouro numa conta farm" }).click();
    await expect(page).toHaveURL(/\/guides\/farms\/gold\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ouro numa conta farm");
  });
});

test.describe("farm guides accessibility", () => {
  for (const theme of ["dark", "light"] as const) {
    for (const route of PAGES) {
      test(`axe ${theme} ${route}`, async ({ page }) => {
        await page.goto("/");
        await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
        await page.goto(route);
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        // Open every <details> so the hidden content is checked too.
        await page.evaluate(() => document.querySelectorAll<HTMLDetailsElement>("#main details").forEach((d) => { d.open = true; }));
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
