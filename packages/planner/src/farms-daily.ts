// F-68 Farm daily checklist, "gathering until" board and daily goal. Pure.
import {
  FARMS_DATA, evidenceOf, farmIndex, isResource,
  type FarmEvidence, type FarmFactsOption, type Resource,
} from "./farms-common";

export interface FarmDailyTask extends FarmEvidence {
  id: string;
  label: string;
  detail: string;
  optional: boolean;
  /** Measured minutes; null until a farm stopwatch exists (gap L-A13-01). */
  minutes: null;
}

export function farmDailyTasks(opts: FarmFactsOption = {}): FarmDailyTask[] {
  const index = farmIndex(opts);
  return FARMS_DATA.dailyTasks.map((t) => ({
    id: t.id, label: t.label, detail: t.detail, optional: t.optional, minutes: null,
    ...evidenceOf(t.facts, t.gaps, false, index),
  }));
}

/** The farm daily checklist with bundled fact confidence. */
export const FARM_DAILY_TASKS: readonly FarmDailyTask[] = farmDailyTasks();

export interface DailyMarks {
  /** YYYY-MM-DD of the day the marks belong to. */
  date: string;
  /** FarmDailyTask ids. */
  done: string[];
}

/** Marks for `today`: kept when they belong to today, reset to empty when the date changed. */
export function dailyState(marks: DailyMarks | null, today: string): DailyMarks {
  if (marks && marks.date === today) return { date: today, done: [...new Set(marks.done)] };
  return { date: today, done: [] };
}

/** Toggle one task for `today` (resets stale marks first). */
export function toggleDaily(marks: DailyMarks | null, today: string, taskId: string): DailyMarks {
  const s = dailyState(marks, today);
  return s.done.includes(taskId) ? { date: today, done: s.done.filter((x) => x !== taskId) } : { date: today, done: [...s.done, taskId] };
}

export type FarmVisitStatus = "idle" | "gathering";

export interface FarmVisit {
  id: string;
  status: FarmVisitStatus;
  /** Whole minutes left (rounded up) while gathering; null when idle. */
  minutesLeft: number | null;
  /** The parsed `gatheringUntil` (ISO) or null. */
  until: string | null;
}

/**
 * Which farm needs you next: idle farms first (no time set, unparseable time, or time
 * already past) in input order, then gathering farms by the soonest return.
 */
export function nextFarmToVisit(farms: ReadonlyArray<{ id: string; gatheringUntil: string | null }>, now: Date): FarmVisit[] {
  const t = now.getTime();
  if (!Number.isFinite(t)) throw new RangeError("now must be a valid Date");
  const visits = farms.map((f, i) => {
    const ms = f.gatheringUntil ? Date.parse(f.gatheringUntil) : Number.NaN;
    if (!Number.isFinite(ms) || ms <= t) return { i, v: { id: f.id, status: "idle" as const, minutesLeft: null, until: Number.isFinite(ms) ? new Date(ms).toISOString() : null } };
    return { i, v: { id: f.id, status: "gathering" as const, minutesLeft: Math.ceil((ms - t) / 60000), until: new Date(ms).toISOString() } };
  });
  visits.sort((a, b) => {
    if (a.v.status !== b.v.status) return a.v.status === "idle" ? -1 : 1;
    if (a.v.status === "gathering") return (a.v.minutesLeft ?? 0) - (b.v.minutesLeft ?? 0) || a.i - b.i;
    return a.i - b.i;
  });
  return visits.map((x) => x.v);
}

export interface FarmGoal {
  resource: Resource;
  /** Net amount the main should receive today. */
  amount: number;
}

export interface GoalProgress {
  resource: Resource;
  target: number;
  shipped: number;
  remaining: number;
  /** shipped / target, clamped to 0..1 (1 when target is 0). */
  ratio: number;
  done: boolean;
}

/** Progress toward a user-set daily goal (no target is suggested: yields are pending, L-A13-01). */
export function goalProgress(target: FarmGoal | null, shippedToday: number): GoalProgress | null {
  if (!target) return null;
  if (!isResource(target.resource)) throw new RangeError(`unknown resource: ${String(target.resource)}`);
  if (!Number.isFinite(target.amount) || target.amount < 0) throw new RangeError("goal amount must be a finite number >= 0");
  if (!Number.isFinite(shippedToday) || shippedToday < 0) throw new RangeError("shippedToday must be a finite number >= 0");
  const remaining = Math.max(0, target.amount - shippedToday);
  const ratio = target.amount === 0 ? 1 : Math.min(1, shippedToday / target.amount);
  return { resource: target.resource, target: target.amount, shipped: shippedToday, remaining, ratio, done: remaining === 0 };
}
