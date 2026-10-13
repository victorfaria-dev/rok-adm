import AxeBuilder from "@axe-core/playwright";
import { QUESTIONS } from "@rokadm/core";
import { expect, test, type Page } from "@playwright/test";

const stepOf = (id: string): number => QUESTIONS.findIndex((q) => q.id === id);
const title = (page: Page) => page.getByRole("heading", { level: 1 });
const WORST = { spending: "kraken", lifetimeSpendUsd: 10_000_000, minutesPerDay: 1440, sessionsPerDay: 24, kingdomDay: 5000, cityHall: 25, civilization: null };

/** Seed localStorage before the island reads it. */
async function seed(page: Page, store: object) {
  await page.goto("/");
  await page.evaluate((s) => localStorage.setItem("ko:v1", JSON.stringify({ v: 1, theme: "dark", ...s })), store);
}

const focused = (page: Page, selector: string) => page.evaluate((sel) => document.activeElement?.matches(sel) ?? false, selector);

/** Press Tab until the focused element matches (keyboard only, no clicks). */
async function tabTo(page: Page, selector: string) {
  for (let i = 0; i < 25; i++) {
    if (await focused(page, selector)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Tab never reached ${selector}`);
}

/** Open /start and wait for the island to hydrate (keys and clicks are handled by it). */
async function open(page: Page) {
  await page.goto("/start/");
  await page.waitForSelector("astro-island:not([ssr])");
}

/** Focus sits in the reply area, never in the chat log. */
async function expectFocusInReply(page: Page) {
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest(".q-reply") && !document.activeElement?.closest("[role=log]"))).toBe(true);
}

async function enter(page: Page, times = 1) {
  for (let i = 0; i < times; i++) {
    const before = await title(page).textContent();
    await page.keyboard.press("Enter");
    await expect(title(page)).not.toHaveText(before ?? "");
  }
}

test("keyboard only: answer every question and land on /guide/?p=", async ({ page }) => {
  await open(page);
  await expect(title(page)).toHaveText(QUESTIONS[0]!.label);
  await expect(page.getByText("1 of 10")).toBeVisible();
  await expect(page.getByRole("radio", { name: /F2P/ })).toBeFocused(); // first load: the picked option

  await tabTo(page, "input[type=radio]");
  await page.keyboard.press("ArrowDown"); // Low spender
  await enter(page);
  await expectFocusInReply(page);
  await expect(page.getByRole("log")).toContainText("Low spender");
  await enter(page); // total spend: left blank = skipped

  await tabTo(page, "#q-input"); // minutes per day: "Other"
  await page.keyboard.type("45");
  await enter(page);
  await expect(page.getByText("4 of 10")).toBeVisible();
  await enter(page, 4); // sessions, role, stage, kingdom day: defaults

  await expect(title(page)).toHaveText(QUESTIONS[stepOf("cityHall")]!.label);
  await tabTo(page, "#q-input");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("12");
  await enter(page, 3); // City Hall, civilization, returning player

  await expect(title(page)).toHaveText("Check your answers");
  await expect(title(page)).toBeFocused(); // the summary has no options: its heading
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/guide\/\?p=/);
  expect(new URL(page.url()).searchParams.get("p")).toBe("1.1.0.0.12.45.....0");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ko:v1")!));
  expect(stored.profileCode).toBe("1.1.0.0.12.45.....0");
  expect(stored.draft).toBeNull();
});

test("reload resumes on the same step with the answers kept", async ({ page }) => {
  await open(page);
  await page.getByRole("radio", { name: /Medium spender/ }).click(); // a tap on a quick reply sends it
  await expect(page.getByText("2 of 10")).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByText("3 of 10")).toBeVisible();
  await page.reload();
  await expect(title(page)).toHaveText(QUESTIONS[2]!.label);
  await expect(page.getByText("3 of 10")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("radio", { name: /Medium spender/ })).toBeChecked();
});

test("Sun Tzu asks in a live log; the reply is ready at once and focus skips the log", async ({ page }) => {
  await open(page);
  const log = page.getByRole("log");
  await expect(log).toHaveAttribute("aria-live", "polite");
  await expect(log).toContainText("Sun Tzu");
  await page.keyboard.press("Enter");
  // Typing dots never hold the reply back: the new options take focus within ~400 ms.
  await expect(page.getByRole("radio").first()).toBeFocused({ timeout: 400 });
  await expectFocusInReply(page);
  await expect(log).toContainText("You: F2P");
  // Every option explains why it matters; no option is marked Recommended (QC-1).
  for (const r of await page.getByRole("radio").all()) await expect(r).toHaveAttribute("aria-describedby", /help/);
  await expect(page.locator("main")).not.toContainText(/recommended/i);
});

test("no typing dots under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await page.keyboard.press("Enter");
  await expect(page.locator(".q-msg-bot[data-current]")).toBeVisible();
  await expect(page.locator(".q-msg-bot[data-current] .q-typing")).toBeHidden();
  await expect(page.locator(".q-msg-bot[data-current] .q-title")).toHaveCSS("opacity", "1");
});

test.describe("Sun Tzu's stage", () => {
  test("one <video> on the page, on the stage above the current question; history is posters", async ({ page }) => {
    await seed(page, { draft: { step: 3, answers: { spending: "low", minutesPerDay: 45 } } });
    await open(page);
    const video = page.locator("video");
    await expect(video).toHaveCount(1);
    await expect(page.locator(".q-msg-bot[data-current] > .st-stage video")).toHaveCount(1);
    await expect(page.locator(".st-stage")).toHaveAttribute("aria-hidden", "true");
    expect(await video.evaluate((v: HTMLVideoElement) => ({ muted: v.muted, inline: v.playsInline, preload: v.preload, poster: !!v.poster }))).toEqual({ muted: true, inline: true, preload: "metadata", poster: true });
    // 480 px clip unless the stage covers more than 480 device px.
    await expect(video).toHaveAttribute("src", /-480\.mp4$/);
    // The box is reserved: the stage is laid out at its final size.
    const box = (await page.locator(".st-stage").boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(140);
    expect(box.height).toBeLessThanOrEqual(240);
    expect(await page.locator(".q-msg-bot:not([data-current]) img").count()).toBeGreaterThan(0);
    // Advancing keeps a single video (the talk clip plays on the new stage).
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("5 of 10")).toBeVisible();
    await expect(page.locator("video")).toHaveCount(1);
  });

  test("under reduced motion the stage is the poster only", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    await page.keyboard.press("Enter");
    await expect(page.getByText("2 of 10")).toBeVisible();
    await expect(page.locator("video")).toHaveCount(0);
    await expect(page.locator(".st-stage img")).toHaveAttribute("src", /poster\.webp$/);
  });

  test("first question at 390x844: the options start above the fold, no layout shift", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      const w = window as unknown as { cls: number };
      w.cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await open(page);
    await expect(page.locator("video")).toHaveCount(1);
    const option = (await page.locator(".q-option").first().boundingBox())!;
    const actions = (await page.locator(".q-actions").boundingBox())!;
    expect(option.y + option.height).toBeLessThanOrEqual(actions.y);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBeLessThan(0.02);
  });

  test("phones: once scrolled, the stage sticks to the top as a 72 px strip", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    const stage = page.locator(".st-stage");
    await expect(stage).not.toHaveAttribute("data-compact", "");
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(stage).toHaveAttribute("data-compact", "");
    const box = (await stage.boundingBox())!;
    expect(Math.round(box.y + box.height)).toBe(72);
  });
});

test("an invalid City Hall shows how to fix it and blocks Next", async ({ page }) => {
  await seed(page, { draft: { step: stepOf("cityHall"), answers: {} } });
  await open(page);
  const field = page.getByRole("textbox", { name: QUESTIONS[stepOf("cityHall")]!.label });
  await field.fill("30");
  // The grumble is brief (~700 ms): record it as it happens instead of racing it under load.
  await page.evaluate(() => {
    const w = window as unknown as { grumbled: boolean };
    w.grumbled = false;
    new MutationObserver(() => {
      if (document.querySelector(".q-msg-bot[data-current] .st-avatar[data-state=grumble]")) w.grumbled = true;
    }).observe(document.querySelector(".q-log")!, { subtree: true, childList: true, attributes: true });
  });
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("30 is out of range. Enter a number from 1 to 25.")).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { grumbled: boolean }).grumbled)).toBe(true);
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(field).toBeFocused();
  await field.press("Enter");
  await expect(title(page)).toHaveText(QUESTIONS[stepOf("cityHall")]!.label);
  await field.fill("25");
  await field.press("Enter");
  await expect(title(page)).toHaveText(QUESTIONS[stepOf("cityHall") + 1]!.label);
});

test("Close keeps the draft and returns to the previous page", async ({ page }) => {
  await open(page); // direct load: referrer is empty, Close goes home
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("2 of 10")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.waitForURL((u) => u.pathname === "/");
  await page.goto("/me/");
  await page.locator("a[href='/start/']").first().evaluate((a: HTMLAnchorElement) => a.click());
  await page.waitForURL(/\/start\/$/);
  await expect(page.getByText("2 of 10")).toBeVisible();
  await page.getByRole("link", { name: "Close" }).click();
  await page.waitForURL(/\/me\/$/);
});

test("worst case answers fit 360 px on every step and the summary", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (let step = 0; step <= QUESTIONS.length; step++) {
    await seed(page, { draft: { step, answers: { ...WORST, lifetimeSpendUsd: "10,000,000" } } });
    await open(page);
    await expect(title(page)).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `step ${step}`).toBeLessThanOrEqual(0);
  }
  await expect(page.getByText("10,000,000 USD")).toBeVisible();
  await expect(page.getByText("5,000 days")).toBeVisible();
});

test.describe("accessibility", () => {
  const cases = [
    { name: "first question", draft: null },
    { name: "question with chat history", draft: { step: stepOf("cityHall"), answers: { spending: "low", minutesPerDay: 45, sessionsPerDay: 2 } } },
    { name: "number step with error", draft: { step: stepOf("cityHall"), answers: { cityHall: "99" } }, submit: true },
    { name: "summary with warnings", draft: { step: QUESTIONS.length, answers: { ...WORST, spending: "f2p" } } },
  ];
  for (const theme of ["dark", "light"] as const) {
    for (const c of cases) {
      test(`axe ${theme}: ${c.name}`, async ({ page }) => {
        await seed(page, { theme, draft: c.draft });
        await open(page);
        await expect(title(page)).toBeVisible();
        if (c.submit) {
          await page.getByRole("button", { name: "Next" }).click();
          await expect(page.locator("#q-error")).toBeVisible();
        }
        await expect(page.locator("[data-typing]")).toHaveCount(0); // typing dots done: text fully shown
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
