// UX stage 1 navigation (replaces the More menu spec): two tab sets by "Playing as", old URLs that
// still resolve, and the footer holding the off-nav pages.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { LEADER_NAV, PLAYER_NAV } from "../src/lib/nav";

const PROFILE = "1.0.0.0.12.30.....0";

async function store(page: Page, data: object) {
  await page.goto("/?about");
  await page.evaluate((d) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, ...d })), data);
}

/** Visible tab labels: bottom tabs on a phone, the rail's long labels on desktop. */
const tabLabels = (page: Page, isMobile: boolean) => (isMobile ? page.locator("nav.tabs:visible a span") : page.locator("nav.rail ul.dest:visible a .long"));

/** The visible main nav: bottom tabs on a phone, the rail on desktop. */
const mainNav = (page: Page, isMobile: boolean) => (isMobile ? page.locator("nav.tabs:visible") : page.locator("nav.rail ul.dest:visible"));

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("player tabs are plain links; no More menu anywhere", async ({ page, isMobile }) => {
    await page.goto("/guide/");
    const nav = mainNav(page, isMobile);
    for (const d of PLAYER_NAV) await expect(nav.getByRole("link", { name: d.label, exact: true })).toHaveAttribute("href", d.href);
    await expect(page.getByRole("button", { name: "More" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "More pages" })).toHaveCount(0);
  });

  test("old URLs still resolve: /more/ and /routine/ redirect", async ({ page }) => {
    const more = await page.request.get("/more/");
    expect(more.ok()).toBe(true);
    expect(await more.text()).toMatch(/http-equiv="refresh" content="0;url=\/"/);
    const routine = await page.request.get("/routine/");
    expect(await routine.text()).toMatch(/url=\/city-hall\/today\//);
  });
});

test("player by default: Prefeitura · Ferramentas · Eu, with the current tab marked; guides mark Eu", async ({ page, isMobile }) => {
  await page.goto("/tools/pack-value/");
  const nav = mainNav(page, isMobile);
  await expect(tabLabels(page, isMobile)).toHaveText(PLAYER_NAV.map((d) => d.label));
  await expect(nav.getByRole("link", { name: "Ferramentas", exact: true })).toHaveAttribute("aria-current", "page");
  // Guides are public pages, reached from Me's first row (and the landing page), not a tab.
  await page.goto("/guides/recovery/");
  await expect(mainNav(page, isMobile).getByRole("link", { name: "Eu", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(mainNav(page, isMobile).getByRole("link", { name: "Guias", exact: true })).toHaveCount(0);
});

test("leader: the Eu switch swaps to Reino · Membros · Eventos · Eu at once", async ({ page, isMobile }) => {
  await store(page, { profileCode: PROFILE });
  await page.goto("/me/");
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0); // hydrated: the change is not lost
  await page.getByRole("radio", { name: "Líder" }).check();
  const nav = mainNav(page, isMobile);
  await expect(tabLabels(page, isMobile)).toHaveText(LEADER_NAV.map((d) => d.label));
  await expect(nav.getByRole("link", { name: "Eu", exact: true })).toHaveAttribute("aria-current", "page");
  // Next page: the boot script picks the leader tabs before paint.
  await page.goto("/kingdom/recruit/");
  await expect(mainNav(page, isMobile).getByRole("link", { name: "Membros", exact: true })).toHaveAttribute("aria-current", "page");
  await page.goto("/tools/kvk/");
  await expect(mainNav(page, isMobile).getByRole("link", { name: "Eventos", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Events pages" })).toBeVisible();
});

test("a returning visitor skips the landing page; /?about still shows it", async ({ page }) => {
  await store(page, { profileCode: PROFILE });
  await page.goto("/");
  await expect(page).toHaveURL(/\/city-hall\/$/);
  await store(page, { profileCode: PROFILE, playingAs: "leader" });
  await page.goto("/");
  await expect(page).toHaveURL(/\/kingdom\/$/);
  await page.goto("/?about");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Planeje sua conta de Rise of Kingdoms");
});

test("the footer links Confiança e privacidade and Marca (off the tabs)", async ({ page }) => {
  await page.goto("/tools/");
  const foot = page.locator("footer.foot");
  await expect(foot.getByRole("link", { name: "Confiança e privacidade" })).toHaveAttribute("href", "/trust/");
  await expect(foot.getByRole("link", { name: "Marca" })).toHaveAttribute("href", "/brand/");
});

for (const theme of ["dark", "light"] as const) {
  for (const [role, url] of [["player", "/city-hall/"], ["leader", "/kingdom/"], ["leader", "/kingdom/requirements/"]] as const) {
    test(`axe ${theme} ${role} ${url}`, async ({ page }) => {
      await store(page, { theme, playingAs: role, profileCode: PROFILE });
      await page.goto(url);
      expect(await axe(page)).toEqual([]);
    });
  }
}

test.describe("City Hall hub", () => {
  const FARM = "1.0.1.0.9.15.....0";
  const accounts = { profileCode: PROFILE, activeAccountId: "main", savedProfiles: [{ id: "main", name: "Main", code: PROFILE, override: null }, { id: "farm", name: "Farm 1", code: FARM, override: null }] };

  test("an older single profile becomes account #1 with one card and no dots", async ({ page }) => {
    await store(page, { profileCode: PROFILE });
    await page.goto("/city-hall/");
    await expect(page.locator("[data-city-card]")).toHaveCount(1);
    await expect(page.locator("[data-city-card]")).toContainText("Principal");
    await expect(page.locator(".ch-dots")).toHaveCount(0);
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem("ko:v1")!));
    expect(s.activeAccountId).toBe("main");
    expect(s.profileCode).toBe(PROFILE);
  });

  test("one card per account; a dot switches the account and the whole sheet follows", async ({ page }) => {
    await store(page, accounts);
    await page.goto("/city-hall/");
    await expect(page.locator("[data-city-card]")).toHaveCount(2);
    await expect(page.locator(".ch-tile").filter({ hasText: "Próxima: CH 13" })).toHaveCount(1);
    await page.getByRole("button", { name: "Mostrar Farm 1" }).click();
    await expect(page.getByRole("button", { name: "Mostrar Farm 1" })).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".ch-tile").filter({ hasText: "Próxima: CH 10" })).toHaveCount(1);
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem("ko:v1")!));
    expect(s.activeAccountId).toBe("farm");
    expect(s.profileCode).toBe(FARM);
    await expect(page.locator(".ch-tile").filter({ hasText: "Meus comandantes" })).toHaveAttribute("href", "/city-hall/commanders/");
  });

  test("phone: the sheet opens with a button (no drag needed); Tarefas de hoje opens it too", async ({ page, isMobile }) => {
    test.skip(!isMobile, "the sheet folds on phones only");
    await store(page, accounts);
    await page.goto("/city-hall/");
    const toggle = page.locator("[data-sheet-toggle]");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#ch-sheet-more")).toBeHidden();
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("[data-alerts]")).toBeVisible();
    await toggle.click();
    await expect(page.locator("#ch-sheet-more")).toBeHidden();
    await page.locator(".ch-tile").filter({ hasText: "Tarefas de hoje" }).click();
    await expect(page.locator("[data-today]")).toBeVisible();
    await expect(page.locator("[data-today]")).toBeFocused();
  });

  test("reduced motion: the sheet is expanded and static", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await store(page, accounts);
    await page.goto("/city-hall/");
    await expect(page.locator("[data-today]")).toBeVisible();
    await expect(page.locator("[data-sheet-toggle]")).toHaveCount(0);
  });

  test("My commanders keeps answers per account", async ({ page }) => {
    await store(page, { ...accounts, commanders: { minamoto: { q1: "a" } } });
    await page.goto("/city-hall/commanders/");
    await expect(page.locator("[data-account-name]")).toContainText("Main");
    await page.goto("/city-hall/");
    await page.getByRole("button", { name: "Mostrar Farm 1" }).click();
    await expect(page.getByRole("button", { name: "Mostrar Farm 1" })).toHaveAttribute("aria-current", "true");
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem("ko:v1")!));
    expect(s.commanders).toEqual({});
    expect(s.savedProfiles.find((a: { id: string }) => a.id === "main").commanders).toEqual({ minamoto: { q1: "a" } });
  });

  test("banner: default 3:4 art by account type; own image per account with a focal-point crop; reset to default", async ({ page }) => {
    await store(page, accounts);
    await page.goto("/city-hall/");
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
    await expect(page.locator('[data-city-card="main"]')).toHaveAttribute("data-kind", "main");
    await expect(page.locator('[data-city-card="farm"]')).toHaveAttribute("data-kind", "farm");
    await expect(page.locator('[data-city-card="main"] img.ch-card-img')).toHaveAttribute("src", "/banners/main-portrait-480.webp");
    await expect(page.locator('[data-city-card="farm"] img.ch-card-img')).toHaveAttribute("src", "/banners/farm-portrait-480.webp");
    const ratio = await page.locator('[data-city-card="main"]').evaluate((el) => el.clientWidth / el.clientHeight);
    expect(ratio).toBeCloseTo(0.75, 1);
    const toggle = page.locator("[data-banner-toggle]");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    await page.locator("[data-banner-file]").setInputFiles({ name: "city.png", mimeType: "image/png", buffer: png });
    // The cropper never needs a drag: the two sliders move the focal point too.
    await expect(page.locator("[data-cropper]")).toBeVisible();
    await page.getByLabel("Da esquerda para a direita").fill("20");
    await expect(page.locator(".ch-crop-frame img")).toHaveAttribute("style", /object-position: 20% 50%/);
    await page.getByRole("button", { name: "Salvar banner" }).click();
    await expect(page.getByText("Banner salvo neste aparelho.")).toBeVisible();
    await expect(page.locator('[data-city-card="main"]')).toHaveAttribute("data-custom-banner", "");
    await expect(page.locator('[data-city-card="farm"]')).not.toHaveAttribute("data-custom-banner", "");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ko:banners:v1")!));
    expect(Object.keys(saved.banners)).toEqual(["main"]);
    expect(saved.banners.main).toMatch(/^data:image\/(webp|jpeg);base64,/);
    await page.getByLabel("Tipo de conta").selectOption("farm");
    await expect(page.locator('[data-city-card="main"]')).toHaveAttribute("data-kind", "farm");
    await page.getByRole("button", { name: "Voltar ao padrão" }).click();
    await expect(page.locator('[data-city-card="main"]')).not.toHaveAttribute("data-custom-banner", "");
  });
});

test("City Hall at 390x844: the sheet handle and the first tile row are above the fold", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone layout");
  await page.setViewportSize({ width: 390, height: 844 });
  await store(page, { profileCode: PROFILE, activeAccountId: "main", savedProfiles: [{ id: "main", name: "Main", code: PROFILE, override: null }, { id: "farm", name: "Farm 1", code: "1.0.1.0.9.15.....0", override: null }] });
  await page.goto("/city-hall/");
  const tabsTop = (await page.locator("nav.tabs:visible").boundingBox())!.y;
  const handle = (await page.locator("[data-sheet-toggle]").boundingBox())!;
  const firstTile = (await page.locator(".ch-tile").first().boundingBox())!;
  expect(handle.y + handle.height).toBeLessThanOrEqual(tabsTop);
  expect(firstTile.y + firstTile.height).toBeLessThanOrEqual(tabsTop);
});
