// Main-thread perf probe (Q2 P2-10): long tasks for "View in 3D" on /crest/ and for /guide/ at 4x CPU.
// Usage (after `pnpm --filter @rokadm/web build`): pnpm --filter @rokadm/web exec tsx scripts/perf.ts
// Starts `astro preview` on PERF_PORT (default 4551), runs each scenario RUNS times (default 5) in
// headless Chromium and prints the median of: longest task, total blocking time (sum of task time
// over 50 ms) and long-task count. Numbers are for before/after comparison on the same machine only.
import { spawn } from "node:child_process";
import { chromium, type Page } from "@playwright/test";
import { defaultProfile, encodeProfile } from "@rokadm/core";

const PORT = Number(process.env.PERF_PORT ?? 4551);
const RUNS = Number(process.env.RUNS ?? 5);
const BASE = `http://localhost:${PORT}`;

interface Sample { longest: number; tbt: number; count: number }

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
};

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("preview server did not start");
}

const OBSERVE = () => {
  const w = window as unknown as { __lt: Array<{ start: number; duration: number }> };
  w.__lt = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__lt.push({ start: e.startTime, duration: e.duration });
    }).observe({ type: "longtask", buffered: true });
  } catch {
    // no long task API
  }
};

async function collect(page: Page, since: number): Promise<Sample> {
  const tasks = await page.evaluate((t0) => (window as unknown as { __lt: Array<{ start: number; duration: number }> }).__lt.filter((x) => x.start >= t0), since);
  return {
    longest: Math.round(Math.max(0, ...tasks.map((t) => t.duration))),
    tbt: Math.round(tasks.reduce((s, t) => s + Math.max(0, t.duration - 50), 0)),
    count: tasks.length,
  };
}

async function crestRun(page: Page): Promise<Sample> {
  await page.goto(`${BASE}/crest/`);
  await page.waitForFunction(() => [...document.querySelectorAll("astro-island")].every((i) => !i.hasAttribute("ssr")));
  await page.waitForTimeout(500);
  const t0 = await page.evaluate(() => performance.now());
  await page.click("[data-view-3d]");
  await page.waitForSelector("canvas[data-crest3d], [data-fallback]", { timeout: 30_000 });
  await page.waitForTimeout(1000);
  return collect(page, t0);
}

async function guideRun(page: Page, code: string): Promise<Sample> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto(`${BASE}/guide/?p=${code}`, { waitUntil: "load" });
  await page.waitForTimeout(4000);
  const s = await collect(page, 0);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  return s;
}

async function main(): Promise<void> {
  const server = spawn("pnpm", ["exec", "astro", "preview", "--port", String(PORT)], { stdio: "ignore" });
  try {
    await waitForServer();
    const browser = await chromium.launch();
    const code = encodeProfile({ ...defaultProfile(), spending: "low", cityHall: 12, kingdomDay: 20 });
    const out: Record<string, Sample[]> = { crest3d: [], guide4x: [] };
    for (let i = 0; i < RUNS; i++) {
      for (const [name, run] of [["crest3d", crestRun], ["guide4x", (p: Page) => guideRun(p, code)]] as const) {
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
        const page = await ctx.newPage();
        await page.addInitScript(OBSERVE);
        out[name]!.push(await run(page));
        await ctx.close();
      }
    }
    await browser.close();
    for (const [name, xs] of Object.entries(out)) {
      console.log(`${name.padEnd(8)} longest ${median(xs.map((x) => x.longest))} ms · TBT ${median(xs.map((x) => x.tbt))} ms · long tasks ${median(xs.map((x) => x.count))} (median of ${xs.length})`);
    }
  } finally {
    server.kill();
  }
}

void main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
