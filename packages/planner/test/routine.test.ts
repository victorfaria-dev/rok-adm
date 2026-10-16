import { describe, expect, it } from "vitest";
import type { RoutineTask } from "@rokadm/core";
import {
  ROUTINE_TASKS, ROUTINE_META, ROUTINE_PRESETS, ESTIMATE_NOTICE,
  planRoutine, planRoutinePreset, breakMode, compareByValuePerMinute, assertRoutineTasks,
} from "../src/routine";
import { profile } from "./helpers";

const MUST_DO = ["vip-claim", "daily-ap-claim", "daily-objectives-100", "queues"];

function task(over: Partial<RoutineTask> & { id: string }): RoutineTask {
  return {
    title: over.id, minutes: null, estimatedMinutes: 1, frequency: "daily", value: 3, safeToSkip: true,
    unlockCityHall: null, profiles: ["todos"], roles: ["todas"], facts: [], gaps: [], ...over,
  };
}

describe("routine data", () => {
  it("honours the RoutineTask contract and has metadata for every task", () => {
    expect(() => assertRoutineTasks(ROUTINE_TASKS)).not.toThrow();
    expect(Object.keys(ROUTINE_META).sort()).toEqual(ROUTINE_TASKS.map((t) => t.id).sort());
  });

  it("marks every minute value as an unmeasured estimate pending T0 (L-A10-01)", () => {
    for (const t of ROUTINE_TASKS) {
      expect(t.minutes).toBeNull();
      expect(t.gaps).toContain("L-A10-01");
      expect(t.facts.length).toBeGreaterThan(0);
    }
    expect(ESTIMATE_NOTICE.gap).toBe("L-A10-01");
    expect(ESTIMATE_NOTICE.label).toMatch(/ESTIMATIVA/);
  });

  it("presets are 15/30/60", () => {
    expect(ROUTINE_PRESETS).toEqual({ quick: 15, standard: 30, full: 60 });
  });
});

describe("planRoutine", () => {
  it("fits the budget and puts must-do tasks first", () => {
    const plan = planRoutinePreset(ROUTINE_TASKS, profile(), "quick");
    expect(plan.totalMinutes).toBeLessThanOrEqual(15);
    const firstIds = plan.included.slice(0, MUST_DO.length).map((p) => p.id);
    expect(new Set(firstIds)).toEqual(new Set(MUST_DO));
    expect(plan.included.slice(0, MUST_DO.length).every((p) => p.mustDo)).toBe(true);
    expect(plan.mustDoSkipped).toEqual([]);
    expect(plan.remainingMinutes).toBeCloseTo(15 - plan.totalMinutes, 5);
  });

  it("orders must-dos and optional tasks by value per minute", () => {
    const plan = planRoutine(ROUTINE_TASKS, profile(), 60);
    const must = plan.included.filter((p) => p.mustDo);
    const rest = plan.included.filter((p) => !p.mustDo);
    expect([...must].sort(compareByValuePerMinute)).toEqual(must);
    expect([...rest].sort(compareByValuePerMinute)).toEqual(rest);
    for (let i = 1; i < rest.length; i++) expect(rest[i - 1]!.valuePerMinute).toBeGreaterThanOrEqual(rest[i]!.valuePerMinute);
  });

  it("flags estimates and lists pending task IDs", () => {
    const plan = planRoutine(ROUTINE_TASKS, profile(), 30);
    expect(plan.usesEstimates).toBe(true);
    expect(plan.pendingTaskIds).toEqual(plan.included.map((p) => p.id));
    expect(plan.notes.some((n) => n.pending)).toBe(true);
  });

  it("60 minutes covers every eligible daily task at CH12", () => {
    const plan = planRoutinePreset(ROUTINE_TASKS, profile({ cityHall: 12 }), "full", { weekday: 2 });
    const daily = ROUTINE_TASKS.filter((t) => t.frequency === "daily");
    expect(plan.included.map((p) => p.id).sort()).toEqual(daily.map((t) => t.id).sort());
    expect(plan.skipped.every((s) => s.reason === "not_today")).toBe(true);
  });

  it("skips over-budget tasks with the reason and the safe-to-skip flag, and keeps filling", () => {
    const tasks = [
      task({ id: "big", value: 5, estimatedMinutes: 10, safeToSkip: false }),
      task({ id: "small", value: 1, estimatedMinutes: 2 }),
      task({ id: "mid", value: 4, estimatedMinutes: 5 }),
    ];
    const plan = planRoutine(tasks, profile(), 7, { meta: {} });
    expect(plan.included.map((p) => p.id)).toEqual(["mid", "small"]);
    const big = plan.skipped.find((s) => s.id === "big");
    expect(big?.reason).toBe("over_budget");
    expect(big?.safeToSkip).toBe(false);
    expect(plan.totalMinutes).toBe(7);
  });

  it("respects City Hall unlocks, profile and role filters", () => {
    const plan = planRoutine(ROUTINE_TASKS, profile({ cityHall: 5 }), 60);
    const locked = plan.skipped.filter((s) => s.reason === "locked_city_hall").map((s) => s.id);
    expect(locked).toEqual(expect.arrayContaining(["courier-merchant", "lyceum-mock"]));
    const custom = [task({ id: "low-only", profiles: ["low"] }), task({ id: "farm-only", roles: ["farm"] })];
    const p2 = planRoutine(custom, profile(), 60, { meta: {} });
    expect(p2.skipped.map((s) => [s.id, s.reason])).toEqual([["low-only", "not_for_profile"], ["farm-only", "not_for_role"]]);
  });

  it("weekly/event tasks only when asked; VIP and weekday gates", () => {
    const base = planRoutine(ROUTINE_TASKS, profile(), 120);
    expect(base.included.some((p) => p.id === "vip-shop-weekly")).toBe(false);
    const weekly = planRoutine(ROUTINE_TASKS, profile(), 120, { includeWeekly: true, vipLevel: 3 });
    expect(weekly.included.some((p) => p.id === "vip-shop-weekly")).toBe(true);
    const lowVip = planRoutine(ROUTINE_TASKS, profile(), 120, { includeWeekly: true, vipLevel: 1 });
    expect(lowVip.skipped.find((s) => s.id === "vip-shop-weekly")?.reason).toBe("below_vip");
    const unknownVip = planRoutine(ROUTINE_TASKS, profile(), 120, { includeWeekly: true });
    expect(unknownVip.notes.some((n) => /Nível de VIP desconhecido/.test(n.text))).toBe(true);
    const sunday = planRoutine(ROUTINE_TASKS, profile(), 120, { weekday: 0 });
    expect(sunday.skipped.find((s) => s.id === "lyceum-mock")?.reason).toBe("not_today");
    const events = planRoutine(ROUTINE_TASKS, profile(), 120, { includeEvents: true });
    expect(events.included.some((p) => p.id === "events")).toBe(true);
  });

  it("uses measured minutes when present (T0) and drops the estimate flag", () => {
    const measured = ROUTINE_TASKS.map((t) => ({ ...t, minutes: 1 }));
    const plan = planRoutine(measured, profile(), 15);
    expect(plan.usesEstimates).toBe(false);
    expect(plan.pendingTaskIds).toEqual([]);
    expect(plan.included.every((p) => !p.isEstimate && p.minutes === 1)).toBe(true);
  });

  it("zero budget reports every must-do as not fitting", () => {
    const plan = planRoutine(ROUTINE_TASKS, profile(), 0);
    expect(plan.included).toEqual([]);
    expect(new Set(plan.mustDoSkipped)).toEqual(new Set(MUST_DO));
    expect(() => planRoutine(ROUTINE_TASKS, profile(), -1)).toThrow();
  });
});

describe("breakMode", () => {
  it("keeps only streak tasks daily, plus a one-off before-pause set", () => {
    const b = breakMode(ROUTINE_TASKS);
    expect(b.daily.map((p) => p.id)).toEqual(["vip-claim"]);
    expect(b.daily[0]!.task.facts).toContain("A05-0003");
    expect(new Set(b.beforePause.map((p) => p.id))).toEqual(new Set(["queues", "gathering"]));
    expect(b.dailyMinutes).toBe(1);
    expect(b.usesEstimates).toBe(true);
    expect(b.dropWhilePaused.map((d) => d.id)).toContain("daily-objectives-100");
    expect(b.notes.some((n) => n.pending && n.facts.length === 0)).toBe(true); // protection while away: no fact card
  });

  it("is smaller than any routine preset", () => {
    const b = breakMode(ROUTINE_TASKS, { profile: profile() });
    const quick = planRoutinePreset(ROUTINE_TASKS, profile(), "quick");
    expect(b.dailyMinutes).toBeLessThan(quick.totalMinutes);
  });
});
