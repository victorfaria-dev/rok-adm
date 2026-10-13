// @vitest-environment happy-dom
import { ROUTINE_TASKS, breakMode, planRoutine, withEffectiveSpending } from "@rokadm/planner";
import { defaultProfile, decodeProfile, type AccountProfile } from "@rokadm/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STORE_KEY, readStore } from "../../lib/store";
import Routine from "./Routine";

// Tuesday 13 Oct 2026, local noon.
const NOW = new Date(2026, 9, 13, 12, 0);
const TODAY = "2026-10-13";
const CODE = "1.0.0.0.12.30.....0"; // F2P, CH 12, 30 min/day
const PROFILE = (decodeProfile(CODE) as { profile: AccountProfile }).profile;

function setup(stored?: object) {
  if (stored) localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, theme: "dark", ...stored }));
  return render(h(Routine, { now: () => NOW }));
}
const taskBoxes = (): HTMLInputElement[] => [...document.querySelectorAll<HTMLInputElement>(".rt-task input")];

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("routine island", () => {
  it("without a profile: default plan, one h1 and a set-up banner", () => {
    setup();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Set up your profile" }).getAttribute("href")).toBe("/start/");
    const expected = planRoutine(ROUTINE_TASKS, defaultProfile(), defaultProfile().minutesPerDay, { weekday: 2 });
    expect(taskBoxes()).toHaveLength(expected.included.length);
  });

  it("with a profile: planned-for line links to /me/ and the list follows the budget", () => {
    setup({ profileCode: CODE });
    expect(screen.queryByText("Set up your profile")).toBeNull();
    expect(screen.getByRole("link", { name: "F2P · CH 12" }).getAttribute("href")).toBe("/me/");
    const p = withEffectiveSpending(PROFILE);
    const at = (m: number) => planRoutine(ROUTINE_TASKS, p, m, { weekday: 2 }).included.length;
    expect(taskBoxes()).toHaveLength(at(30));
    fireEvent.click(screen.getByRole("radio", { name: "15 min" }));
    expect(taskBoxes()).toHaveLength(at(15));
    expect(readStore().routinePrefs).toEqual({ minutes: 15, breakMode: false });
    fireEvent.click(screen.getByRole("radio", { name: /My usual/ }));
    expect(readStore().routinePrefs?.minutes).toBeNull();
  });

  it("lifetime spend raises the plan to the effective profile (F-72)", () => {
    setup({ profileCode: "1.0.0.0.12.30...2000..0" });
    expect(screen.getByText("Medium (effective profile, from your total spend) · CH 12")).toBeTruthy();
    expect(screen.getByText(/not researched yet/)).toBeTruthy();
  });

  it("check-off is saved for today; yesterday's marks start empty", () => {
    setup({ profileCode: CODE, routine: { date: "2026-10-12", done: ["vip-claim", "queues"] } });
    expect(taskBoxes().every((b) => !b.checked)).toBe(true);
    const total = taskBoxes().length;
    expect(screen.getByText(/done$/).textContent).toBe(`0 of ${total} done`);
    fireEvent.click(taskBoxes()[0]!);
    expect(readStore().routine).toEqual({ date: TODAY, done: [taskBoxes()[0]!.id.replace("rt-task-", "")] });
    expect(screen.getByText(/done$/).textContent).toBe(`1 of ${total} done`);
  });

  it("estimates are labelled pending measurement", () => {
    setup({ profileCode: CODE });
    expect(screen.getAllByText(/pending measurement/).length).toBeGreaterThan(0);
  });

  it("Break Mode shows the daily minimal set and is saved", () => {
    setup({ profileCode: CODE });
    fireEvent.click(screen.getByRole("switch", { name: /Break Mode/ }));
    expect(readStore().routinePrefs?.breakMode).toBe(true);
    const bm = breakMode(ROUTINE_TASKS, { profile: withEffectiveSpending(PROFILE) });
    // Q2 P2-9: streak + loss-prevention tasks (queues incl. healing, gatherers), and the Planned line stays.
    expect(taskBoxes()).toHaveLength(bm.daily.length + bm.beforePause.length);
    expect(taskBoxes().map((b) => b.id.replace("rt-task-", ""))).toEqual(expect.arrayContaining(["vip-claim", "queues", "gathering"]));
    expect(screen.getByText(/does not cover shields or resource protection/)).toBeTruthy();
    const mins = Math.round((bm.dailyMinutes + bm.beforePauseMinutes) * 10) / 10;
    expect(screen.getByText(/^Planned:/).textContent).toMatch(new RegExp(`^Planned: ${mins} of \\d+(\\.\\d)? min \\(Break Mode\\)\\.$`));
    expect(screen.getByText(/Safe to drop while paused/)).toBeTruthy();
    expect(screen.queryByRole("radio")).toBeNull();
  });
});
