// UX stage 1 review screenshots (dark mode, 390x844 and 1280x800). Not part of the build or tests.
// Usage: node scripts/ux1-shots.mjs <baseURL> <outDir>
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [base = "http://localhost:4440", out = "ux1"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const MAIN = "1.0.0.0.12.30.....0";
const FARM = "1.0.1.0.9.15.....0";
const player = { v: 1, theme: "dark", playingAs: "player", profileCode: MAIN, activeAccountId: "main",
  savedProfiles: [{ id: "main", name: "Main", code: MAIN, override: null }, { id: "farm1", name: "Farm 1", code: FARM, override: null }] };
const leader = { ...player, playingAs: "leader" };
const fresh = { v: 1, theme: "dark" };

const shots = [
  ["landing", "/", fresh],
  ["onboarding", "/start/", fresh],
  ["city-hall", "/city-hall/", player],
  ["city-hall-expanded", "/city-hall/", player, async (p) => { const b = p.locator("[data-sheet-toggle]"); if (await b.count()) await b.click(); }],
  ["guides", "/guides/", player],
  ["tools", "/tools/", player],
  ["me", "/me/", player],
  ["leader-kingdom", "/kingdom/", leader],
  ["leader-members", "/kingdom/requirements/", leader],
  ["leader-events", "/kingdom/mge/", leader],
];

const browser = await chromium.launch();
for (const [w, h, tag] of [[390, 844, "phone"], [1280, 800, "desktop"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: "dark", deviceScaleFactor: 1 });
  for (const [name, path, store, act] of shots) {
    const page = await ctx.newPage();
    await page.goto(`${base}/?about`);
    await page.evaluate((s) => { localStorage.clear(); sessionStorage.setItem("ko:sting", "1"); localStorage.setItem("ko:v1", JSON.stringify(s)); }, store);
    await page.goto(`${base}${path}`);
    await page.waitForLoadState("networkidle");
    if (act) await act(page);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${name}-${tag}.png`, fullPage: false });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log("done");
