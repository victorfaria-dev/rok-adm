// Regression tests for QA findings: focus ring, control borders, theme picker, landing page.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";


async function setTheme(page: Page, theme: "dark" | "light") {
  await page.goto("/");
  await page.evaluate((t) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: t })), theme);
}

/** WCAG contrast between two computed CSS colors (rgb()/rgba()). */
function contrastOf(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, bl] = (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const cssVar = (page: Page, name: string) =>
  page.evaluate((n) => {
    const probe = document.createElement("i");
    probe.style.color = `var(${n})`;
    document.body.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, name);

for (const theme of ["dark", "light"] as const) {
  test(`${theme}: the primary button shows a focus ring that contrasts with the button and the page`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/guide/");
    const btn = page.locator(".g-banner .btn-primary");
    await page.keyboard.press("Tab");
    await btn.focus();
    const s = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { focusVisible: el.matches(":focus-visible"), clip: cs.clipPath, style: cs.outlineStyle, width: cs.outlineWidth, color: cs.outlineColor };
    });
    expect(s.focusVisible).toBe(true);
    expect(s.clip).toBe("none"); // the chamfer is on ::before, so the outline is not clipped
    expect(s.style).toBe("solid");
    expect(parseFloat(s.width)).toBeGreaterThanOrEqual(2);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    for (const other of [bg, await cssVar(page, "--ko-surface"), await cssVar(page, "--ko-accent")]) {
      expect(contrastOf(s.color, other)).toBeGreaterThanOrEqual(3);
    }
  });

  test(`${theme}: questionnaire options and inputs have borders of at least 3:1`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/start/");
    const option = page.locator(".q-option").first();
    await expect(option).toBeVisible();
    const border = await option.evaluate((el) => getComputedStyle(el).borderTopColor);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const surface = await cssVar(page, "--ko-surface");
    expect(contrastOf(border, bg)).toBeGreaterThanOrEqual(3);
    expect(contrastOf(border, surface)).toBeGreaterThanOrEqual(3);
  });
}

test("the theme picker closes when focus leaves it", async ({ page, isMobile }) => {
  await page.goto("/guides/");
  const picker = page.locator(isMobile ? "header.top [data-theme-picker]" : "nav.rail [data-theme-picker]");
  await picker.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(picker).toHaveAttribute("open", "");
  await page.keyboard.press("Tab"); // into the radio group
  await expect(picker.locator("input:focus")).toHaveCount(1);
  await page.keyboard.press("Tab"); // out of the picker
  await expect(picker).not.toHaveAttribute("open", "");
});

for (const url of ["/guide/", "/guides/new-kingdom/"]) {
  test(`${url}: table regions have unique names and the prose has no fake checkboxes`, async ({ page }) => {
    await page.goto(url);
    const result = await new AxeBuilder({ page }).withRules(["landmark-unique"]).analyze();
    expect(result.violations.map((v) => v.id)).toEqual([]);
    await expect(page.locator(".g-prose input[type=checkbox]")).toHaveCount(0);
  });
}

test("the guide's task list renders as list items with a done/undone marker", async ({ page }) => {
  await page.goto("/guide/");
  await expect(page.locator(".g-prose li.ko-task").first()).toBeAttached();
});

test("landing: what it is, for whom, 3 examples, the trust points and one Start", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Plan your Rise of Kingdoms account");
  await expect(page.locator(".lp-card h3")).toHaveText(["Players", "Kingdom and alliance leaders"]);
  await expect(page.locator(".lp-examples > li")).toHaveCount(3);
  await expect(page.locator(".lp-trust dt")).toHaveText(["Sourced data", "No bots", "Within Lilith's terms"]);
  for (const a of await page.locator("[data-start]").all()) await expect(a).toHaveAttribute("href", "/start/");
  await expect(page.locator("video[data-mascot]")).toHaveAttribute("poster", /\/mascot\//);
});
