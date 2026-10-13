// F-15 check-off by LOCAL day. Pure functions: callers inject `now`, nothing reads the clock here.
// A new local day starts with nothing checked (no streaks, no carry-over).
import type { RoutineState } from "./store";

const pad = (n: number): string => String(n).padStart(2, "0");

/** Local calendar day as YYYY-MM-DD (the player's day, not UTC). */
export function localDateKey(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Local weekday, 0 = Sunday … 6 = Saturday. */
export function localWeekday(now: Date): number {
  return now.getDay();
}

/** Ids checked today; marks saved on another day count as nothing. */
export function doneToday(state: RoutineState | null, now: Date): string[] {
  return state && state.date === localDateKey(now) ? [...state.done] : [];
}

/** Check or uncheck one task for today. Marks from an older day are dropped. */
export function setDone(state: RoutineState | null, id: string, done: boolean, now: Date): RoutineState {
  const today = doneToday(state, now).filter((x) => x !== id);
  return { date: localDateKey(now), done: done ? [...today, id] : today };
}

/** How many of `ids` are in `done` (marks for tasks not shown are ignored). */
export function countDone(ids: readonly string[], done: readonly string[]): number {
  const set = new Set(done);
  return ids.filter((id) => set.has(id)).length;
}
