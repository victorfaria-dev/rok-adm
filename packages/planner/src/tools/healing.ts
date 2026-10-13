// Healing planner (F-22). Hospital capacity per level arrives as an argument (A01 Hospital table, A01-0008).
// Heal cost and heal time per troop are not in our data: the player types them (pending measurement).
import { nonNeg } from "./types";
import { MINUTE } from "./time";

export interface HospitalLevel { level: number; capacity: number }

/** Capacity of one hospital at `level`. Throws RangeError for a level not in the table. */
export function hospitalCapacity(level: number, table: readonly HospitalLevel[]): number {
  const row = table.find((r) => r.level === level);
  if (!row) throw new RangeError(`hospital level ${level} is not in the table`);
  return row.capacity;
}

/** Total capacity of `count` hospitals at the same level (count read as a whole number ≥ 0). */
export function totalCapacity(level: number, count: number, table: readonly HospitalLevel[]): number {
  return hospitalCapacity(level, table) * Math.floor(nonNeg(count));
}

/** Wounded troops that do not fit in the hospitals (they die, A08-0502). */
export function overflow(wounded: number, capacity: number): number {
  return Math.max(0, Math.floor(nonNeg(wounded)) - nonNeg(capacity));
}

export interface PerTroop { food: number; wood: number; stone: number; gold: number; seconds: number }

export interface HealWave {
  troops: number;
  food: number;
  wood: number;
  stone: number;
  gold: number;
  /** Raw heal seconds for all troops (null when the per-troop time was not entered). */
  seconds: number | null;
  /** Healing speedup minutes still missing after the ones you hold (null when time is unknown). */
  speedupShortMin: number | null;
  /** True when no per-troop cost was entered (show a prompt, not a 0 total). */
  costUnknown: boolean;
}

/** Cost and time of healing `troops` wounded at the per-troop values the player entered. */
export function healWave(troops: number, per: PerTroop, healingSpeedupMin = 0): HealWave {
  const n = Math.floor(nonNeg(troops));
  const f = nonNeg(per.food), w = nonNeg(per.wood), s = nonNeg(per.stone), g = nonNeg(per.gold), t = nonNeg(per.seconds);
  const seconds = t > 0 ? n * t : null;
  return {
    troops: n,
    food: n * f, wood: n * w, stone: n * s, gold: n * g,
    seconds,
    speedupShortMin: seconds === null ? null : Math.max(0, seconds / MINUTE - nonNeg(healingSpeedupMin)),
    costUnknown: f + w + s + g === 0,
  };
}
