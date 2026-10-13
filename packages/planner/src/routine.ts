// F-15 Time-Boxed Routine (+ Break Mode). Pure functions; no UI, no I/O.
import type { AccountProfile, RoutineTask } from "@rokadm/core";
import tasksJson from "../data/routine-tasks.json";
import metaJson from "../data/routine-task-meta.json";

/** Planner-side metadata not in the RoutineTask contract (see NOTES.md). */
export interface RoutineTaskMeta {
  /** One-line rationale for `value`, citing fact IDs. */
  valueReason: string;
  /** Done before anything else when it fits (e.g. the 100-point Daily Objectives chest). */
  mustDo: boolean;
  mustDoReason?: string;
  /** Role in Break Mode: `streak` = skipping causes a loss that compounds after the day; `before_pause` = do once before stepping away. */
  breakRole: "streak" | "before_pause" | null;
  /** Task name in the T0 stopwatch log (research/protocolos/t0-medicao.md §3). */
  t0Task: string;
  weekdaysOnly?: boolean;
  minVip?: number;
  cadence?: string;
}
export type RoutineMetaMap = Readonly<Record<string, RoutineTaskMeta>>;

export interface Note { text: string; facts: string[]; pending: boolean }

const VALUES = new Set([1, 2, 3, 4, 5]);
const FREQ = new Set(["daily", "weekly", "event"]);

/** Runtime check that JSON rows honour the RoutineTask contract. */
export function assertRoutineTasks(rows: unknown): RoutineTask[] {
  if (!Array.isArray(rows)) throw new Error("routine tasks: expected an array");
  const seen = new Set<string>();
  for (const r of rows as Array<Record<string, unknown>>) {
    const id = String(r["id"]);
    if (seen.has(id)) throw new Error(`routine tasks: duplicate id ${id}`);
    seen.add(id);
    if (!VALUES.has(r["value"] as number)) throw new Error(`${id}: value must be 1..5`);
    if (!FREQ.has(r["frequency"] as string)) throw new Error(`${id}: bad frequency`);
    if (r["minutes"] !== null && typeof r["minutes"] !== "number") throw new Error(`${id}: minutes must be number|null`);
    if (typeof r["estimatedMinutes"] !== "number" || !((r["estimatedMinutes"] as number) > 0)) throw new Error(`${id}: estimatedMinutes must be > 0`);
    for (const k of ["profiles", "roles", "facts", "gaps"]) if (!Array.isArray(r[k])) throw new Error(`${id}: ${k} must be an array`);
    if (r["unlockCityHall"] !== null && typeof r["unlockCityHall"] !== "number") throw new Error(`${id}: unlockCityHall`);
  }
  return rows as RoutineTask[];
}

export const ROUTINE_TASKS: readonly RoutineTask[] = assertRoutineTasks(tasksJson);
export const ROUTINE_META: RoutineMetaMap = (metaJson as unknown as { tasks: Record<string, RoutineTaskMeta> }).tasks;
/** Label + basis shown next to every estimated minute value (gap L-A10-01). */
export const ESTIMATE_NOTICE = (metaJson as { _estimates: { label: string; basis: string; gap: string; asOf: string } })._estimates;
export const BREAK_MODE_NOTES: readonly Note[] = (metaJson as unknown as { breakModeNotes: Note[] }).breakModeNotes;

export const ROUTINE_PRESETS = { quick: 15, standard: 30, full: 60 } as const;
export type RoutinePreset = keyof typeof ROUTINE_PRESETS;

export type SkipReason =
  | "locked_city_hall"
  | "not_for_profile"
  | "not_for_role"
  | "not_today"
  | "below_vip"
  | "over_budget";

export interface PlannedTask {
  id: string;
  title: string;
  task: RoutineTask;
  minutes: number;
  /** true while `task.minutes` is null (unmeasured; estimate pending T0). */
  isEstimate: boolean;
  valuePerMinute: number;
  mustDo: boolean;
  why: string;
}

export interface SkippedTask {
  id: string;
  title: string;
  task: RoutineTask;
  reason: SkipReason;
  detail: string;
  /** Mirrors task.safeToSkip: the UI's "safe to skip today" list. */
  safeToSkip: boolean;
}

export interface RoutinePlan {
  budgetMinutes: number;
  included: PlannedTask[];
  skipped: SkippedTask[];
  totalMinutes: number;
  remainingMinutes: number;
  usesEstimates: boolean;
  /** Included tasks whose minutes are estimates waiting for the T0 stopwatch. */
  pendingTaskIds: string[];
  /** Must-do tasks that did not fit the budget. */
  mustDoSkipped: string[];
  notes: Note[];
}

export interface PlanOptions {
  meta?: RoutineMetaMap;
  /** Include weekly tasks (e.g. Monday VIP Shop restock). Default false. */
  includeWeekly?: boolean;
  /** Include event tasks. Default false. */
  includeEvents?: boolean;
  /** Game weekday: 0 = Sunday … 6 = Saturday in UTC (daily reset 00:00 UTC, A10-0001). Unknown → weekday-only tasks are kept. */
  weekday?: number | null;
  /** VIP level (not in AccountProfile yet — see NOTES.md). Unknown → VIP-gated tasks kept with a note. */
  vipLevel?: number | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function taskMinutes(t: RoutineTask): { minutes: number; isEstimate: boolean } {
  return t.minutes !== null ? { minutes: t.minutes, isEstimate: false } : { minutes: t.estimatedMinutes, isEstimate: true };
}

function matches<T extends string>(list: readonly string[], all: string, v: T): boolean {
  return list.includes(all) || list.includes(v);
}

function toPlanned(t: RoutineTask, meta: RoutineMetaMap): PlannedTask {
  const { minutes, isEstimate } = taskMinutes(t);
  const m = meta[t.id];
  return {
    id: t.id,
    title: t.title,
    task: t,
    minutes,
    isEstimate,
    valuePerMinute: minutes > 0 ? t.value / minutes : Number.POSITIVE_INFINITY,
    mustDo: m?.mustDo ?? false,
    why: m?.mustDo && m.mustDoReason ? `${m.mustDoReason} ${m.valueReason}` : m?.valueReason ?? "",
  };
}

/** Value per minute desc, then value desc, then shorter first, then id (deterministic). */
export function compareByValuePerMinute(a: PlannedTask, b: PlannedTask): number {
  return (
    b.valuePerMinute - a.valuePerMinute ||
    b.task.value - a.task.value ||
    a.minutes - b.minutes ||
    a.id.localeCompare(b.id)
  );
}

function eligibility(t: RoutineTask, profile: AccountProfile, opts: PlanOptions, meta: RoutineMetaMap): { reason: SkipReason; detail: string } | null {
  if (t.unlockCityHall !== null && profile.cityHall < t.unlockCityHall) {
    return { reason: "locked_city_hall", detail: `Unlocks at City Hall ${t.unlockCityHall} (you: CH${profile.cityHall}).` };
  }
  if (!matches(t.profiles, "todos", profile.spending)) return { reason: "not_for_profile", detail: `Not relevant for ${profile.spending}.` };
  if (!matches(t.roles, "todas", profile.role)) return { reason: "not_for_role", detail: `Not relevant for role ${profile.role}.` };
  if (t.frequency === "weekly" && !opts.includeWeekly) return { reason: "not_today", detail: "Weekly task: plan it on its day." };
  if (t.frequency === "event" && !opts.includeEvents) return { reason: "not_today", detail: "Only while an event is active." };
  const m = meta[t.id];
  if (m?.weekdaysOnly && opts.weekday != null && (opts.weekday === 0 || opts.weekday === 6)) {
    return { reason: "not_today", detail: "Only Monday–Friday." };
  }
  if (m?.minVip !== undefined && opts.vipLevel != null && opts.vipLevel < m.minVip) {
    return { reason: "below_vip", detail: `Needs VIP ${m.minVip}.` };
  }
  return null;
}

/**
 * Builds a checklist that fits `budgetMinutes`: must-do tasks first (by value per minute),
 * then the rest by value per minute, greedily, skipping what does not fit.
 * Minutes are T0-measured when `task.minutes` is set, otherwise the labelled estimate.
 */
export function planRoutine(
  tasks: readonly RoutineTask[],
  profile: AccountProfile,
  budgetMinutes: number,
  opts: PlanOptions = {},
): RoutinePlan {
  if (!Number.isFinite(budgetMinutes) || budgetMinutes < 0) throw new Error("budgetMinutes must be a non-negative number");
  const meta = opts.meta ?? ROUTINE_META;
  const skipped: SkippedTask[] = [];
  const candidates: PlannedTask[] = [];
  const notes: Note[] = [];

  for (const t of tasks) {
    const e = eligibility(t, profile, opts, meta);
    if (e) skipped.push({ id: t.id, title: t.title, task: t, reason: e.reason, detail: e.detail, safeToSkip: t.safeToSkip });
    else candidates.push(toPlanned(t, meta));
  }

  const mustDo = candidates.filter((c) => c.mustDo).sort(compareByValuePerMinute);
  const rest = candidates.filter((c) => !c.mustDo).sort(compareByValuePerMinute);
  const included: PlannedTask[] = [];
  const mustDoSkipped: string[] = [];
  let used = 0;
  for (const c of [...mustDo, ...rest]) {
    if (used + c.minutes <= budgetMinutes + 1e-9) {
      included.push(c);
      used += c.minutes;
    } else {
      if (c.mustDo) mustDoSkipped.push(c.id);
      skipped.push({
        id: c.id, title: c.title, task: c.task, reason: "over_budget",
        detail: `${round1(c.minutes)} min does not fit the ${round1(budgetMinutes - used)} min left${c.task.safeToSkip ? " — safe to skip today" : ""}.`,
        safeToSkip: c.task.safeToSkip,
      });
    }
  }

  const pendingTaskIds = included.filter((c) => c.isEstimate).map((c) => c.id);
  if (pendingTaskIds.length) {
    notes.push({ text: `${ESTIMATE_NOTICE.label}: ${ESTIMATE_NOTICE.basis}`, facts: ["A10-0002"], pending: true });
  }
  if (mustDoSkipped.length) {
    notes.push({ text: `Budget too small for must-do tasks: ${mustDoSkipped.join(", ")}.`, facts: [], pending: false });
  }
  if (opts.vipLevel == null && included.some((c) => meta[c.id]?.minVip !== undefined)) {
    notes.push({ text: "VIP level unknown: VIP-gated tasks were kept; check your VIP level.", facts: ["A04-0007"], pending: false });
  }

  return {
    budgetMinutes,
    included,
    skipped,
    totalMinutes: round1(used),
    remainingMinutes: round1(budgetMinutes - used),
    usesEstimates: pendingTaskIds.length > 0,
    pendingTaskIds,
    mustDoSkipped,
    notes,
  };
}

export function planRoutinePreset(
  tasks: readonly RoutineTask[],
  profile: AccountProfile,
  preset: RoutinePreset,
  opts: PlanOptions = {},
): RoutinePlan {
  return planRoutine(tasks, profile, ROUTINE_PRESETS[preset], opts);
}

export interface BreakModePlan {
  /** Minimum daily set while paused: tasks whose skip causes a loss that compounds (e.g. VIP streak). */
  daily: PlannedTask[];
  /** One-off actions before stepping away (long queues, long gathering marches). */
  beforePause: PlannedTask[];
  dailyMinutes: number;
  beforePauseMinutes: number;
  usesEstimates: boolean;
  pendingTaskIds: string[];
  /** Everything else, safe to drop while paused (losses do not compound). */
  dropWhilePaused: Array<{ id: string; title: string; safeToSkip: boolean }>;
  notes: Note[];
}

/**
 * Break Mode: the smallest set that avoids losing progress that compounds while the
 * player pauses for days. Only `breakRole: "streak"` tasks are daily; `before_pause`
 * tasks are done once. A profile, if given, removes tasks locked by City Hall.
 */
export function breakMode(
  tasks: readonly RoutineTask[],
  opts: { meta?: RoutineMetaMap; profile?: AccountProfile } = {},
): BreakModePlan {
  const meta = opts.meta ?? ROUTINE_META;
  const unlocked = tasks.filter(
    (t) => !opts.profile || t.unlockCityHall === null || opts.profile.cityHall >= t.unlockCityHall,
  );
  const daily = unlocked.filter((t) => meta[t.id]?.breakRole === "streak").map((t) => toPlanned(t, meta)).sort(compareByValuePerMinute);
  const beforePause = unlocked.filter((t) => meta[t.id]?.breakRole === "before_pause").map((t) => toPlanned(t, meta)).sort(compareByValuePerMinute);
  const kept = new Set([...daily, ...beforePause].map((p) => p.id));
  const all = [...daily, ...beforePause];
  const pendingTaskIds = all.filter((p) => p.isEstimate).map((p) => p.id);
  const notes: Note[] = [...BREAK_MODE_NOTES];
  if (pendingTaskIds.length) notes.push({ text: `${ESTIMATE_NOTICE.label}: ${ESTIMATE_NOTICE.basis}`, facts: ["A10-0002"], pending: true });
  return {
    daily,
    beforePause,
    dailyMinutes: round1(daily.reduce((s, p) => s + p.minutes, 0)),
    beforePauseMinutes: round1(beforePause.reduce((s, p) => s + p.minutes, 0)),
    usesEstimates: pendingTaskIds.length > 0,
    pendingTaskIds,
    dropWhilePaused: unlocked.filter((t) => !kept.has(t.id)).map((t) => ({ id: t.id, title: t.title, safeToSkip: t.safeToSkip })),
    notes,
  };
}
