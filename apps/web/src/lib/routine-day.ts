// F-15 check-off by GAME day. The game's daily reset is 00:00 UTC (fact A10-0001), so a
// routine day runs from 00:00 UTC to 00:00 UTC, not local midnight (in Brazil it starts at 21:00).
// Pure functions: callers inject `now`, nothing reads the clock here.
// A new game day starts with nothing checked (no streaks, no carry-over).
import type { RoutineState } from "./store";

const pad = (n: number): string => String(n).padStart(2, "0");

/** Game day (UTC calendar day) as YYYY-MM-DD. */
export function gameDateKey(now: Date): string {
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

/** Game weekday (UTC), 0 = Sunday … 6 = Saturday; matches the planner's weekday option. */
export function gameWeekday(now: Date): number {
  return now.getUTCDay();
}

/** Local time of the next daily reset, e.g. "21:00" in UTC-3 (shown so the reset is not a surprise). */
export function resetLocalTime(now: Date): string {
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return `${pad(reset.getHours())}:${pad(reset.getMinutes())}`;
}

/** Ids checked today; marks saved on another game day count as nothing. */
export function doneToday(state: RoutineState | null, now: Date): string[] {
  return state && state.date === gameDateKey(now) ? [...state.done] : [];
}

/** Check or uncheck one task for today. Marks from an older day are dropped. */
export function setDone(state: RoutineState | null, id: string, done: boolean, now: Date): RoutineState {
  const today = doneToday(state, now).filter((x) => x !== id);
  return { date: gameDateKey(now), done: done ? [...today, id] : today };
}

/** How many of `ids` are in `done` (marks for tasks not shown are ignored). */
export function countDone(ids: readonly string[], done: readonly string[]): number {
  const set = new Set(done);
  return ids.filter((id) => set.has(id)).length;
}
