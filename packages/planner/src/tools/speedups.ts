// Speedup inventory and alliance help (F-81). Item durations are the ones printed in item names
// ("Universal Speedup (5m)"); help % and help counts arrive as arguments (A10-0006, A01 Alliance Center).
import { nonNeg } from "./types";
import { MINUTE } from "./time";

export const SPEEDUP_TYPES = ["universal", "building", "research", "training", "healing"] as const;
export type SpeedupType = (typeof SPEEDUP_TYPES)[number];
/** Job types a speedup can be spent on (universal works on all of them). */
export type JobType = Exclude<SpeedupType, "universal">;

/** Item counts by duration in minutes, e.g. { 5: 16, 60: 2 }. */
export type SpeedupCounts = Record<number, number>;

/** Minutes held in one stack of items. Negative, fractional or non-finite counts read as whole non-negative counts. */
export function speedupMinutes(counts: SpeedupCounts): number {
  let total = 0;
  for (const [dur, count] of Object.entries(counts)) {
    const d = Number(dur);
    if (!Number.isFinite(d) || d <= 0) continue;
    total += d * Math.floor(nonNeg(count));
  }
  return total;
}

/** Minutes per speedup type and the grand total. */
export function speedupTotals(byType: Partial<Record<SpeedupType, SpeedupCounts>>): Record<SpeedupType, number> & { total: number } {
  const out = { universal: 0, building: 0, research: 0, training: 0, healing: 0, total: 0 };
  for (const t of SPEEDUP_TYPES) {
    out[t] = speedupMinutes(byType[t] ?? {});
    out.total += out[t];
  }
  return out;
}

/** Whether alliance members can help this kind of job (troop training cannot be helped, A10-0006). */
export function canBeHelped(job: JobType): boolean {
  return job !== "training";
}

/**
 * Seconds removed by alliance helps: each help takes `pctPerHelp`% of the job's total time.
 * Reading: the % is of the total time, and there is no per-help minimum (neither is in our data).
 */
export function helpSeconds(jobSeconds: number, helps: number, pctPerHelp: number): number {
  const job = nonNeg(jobSeconds);
  const share = Math.min(1, (Math.floor(nonNeg(helps)) * nonNeg(pctPerHelp)) / 100);
  return job * share;
}

export interface JobCover {
  /** Seconds the alliance helps take off (0 for training). */
  helped: number;
  /** Seconds left after helps. */
  remaining: number;
  /** Job-type speedup minutes used, then universal minutes used (job-type first). */
  typedUsedMin: number;
  universalUsedMin: number;
  /** Seconds still left after every speedup is used (0 when covered). */
  shortfall: number;
  covered: boolean;
}

/** Can the speedups you hold finish a job? Uses the job's own type first, then universal. */
export function coverJob(input: {
  jobSeconds: number;
  job: JobType;
  typedMinutes: number;
  universalMinutes: number;
  helps: number;
  pctPerHelp: number;
}): JobCover {
  const job = nonNeg(input.jobSeconds);
  const helped = canBeHelped(input.job) ? helpSeconds(job, input.helps, input.pctPerHelp) : 0;
  const remaining = job - helped;
  const needMin = remaining / MINUTE;
  const typed = nonNeg(input.typedMinutes), uni = nonNeg(input.universalMinutes);
  const typedUsedMin = Math.min(typed, needMin);
  const universalUsedMin = Math.min(uni, needMin - typedUsedMin);
  const shortfall = Math.max(0, remaining - (typedUsedMin + universalUsedMin) * MINUTE);
  return { helped, remaining, typedUsedMin, universalUsedMin, shortfall, covered: shortfall < 1e-9 };
}
