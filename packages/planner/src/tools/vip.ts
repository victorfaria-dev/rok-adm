// Gem → VIP math (F-21). Thresholds and chest rules arrive as arguments (A05-0001, A05-0003, A05-0004).
import { nonNeg, type Calc } from "./types";

export interface VipThreshold { vip: number; threshold: number }

export interface ChestRule { start: number; increment: number; cap: number }

/** Highest VIP level reached with `points` cumulative points (VIP 0 below the first threshold). */
export function vipLevelAt(points: number, levels: readonly VipThreshold[]): number {
  let lv = 0;
  for (const l of [...levels].sort((a, b) => a.vip - b.vip)) if (points >= l.threshold) lv = l.vip;
  return lv;
}

/** Cumulative points of a level (VIP 0 = 0). Throws for a level not in the table. */
export function thresholdOf(vip: number, levels: readonly VipThreshold[]): number {
  if (vip === 0) return 0;
  const l = levels.find((x) => x.vip === vip);
  if (!l) throw new RangeError(`VIP ${vip} is not in the table`);
  return l.threshold;
}

/** VIP points still needed to reach `targetVip` from `currentPoints` (0 when already there). */
export function vipPointsToTarget(currentPoints: number, targetVip: number, levels: readonly VipThreshold[]): number {
  return Math.max(0, thresholdOf(targetVip, levels) - nonNeg(currentPoints));
}

/** Gems needed to buy `points` VIP points at `perGem` points per gem (rounded up). */
export function gemsForPoints(points: number, perGem: number): number {
  if (!(perGem > 0)) throw new RangeError("perGem must be positive");
  return Math.ceil(nonNeg(points) / perGem);
}

/** Daily chest points on day `streakDay` of an unbroken streak (day 1 = start). */
export function chestPointsOnDay(streakDay: number, rule: ChestRule): number {
  const d = Math.max(1, Math.floor(streakDay));
  return Math.min(rule.cap, rule.start + rule.increment * (d - 1));
}

export interface DaysToTarget {
  /** Days until the target is reached (0 = already reached); null when it is not reached within `maxDays`. */
  days: number | null;
  /** Points gained over those days (chest + extra). */
  gained: number;
}

/**
 * Days of daily claims until `needed` points are gathered, starting today at streak day `streakDay`
 * (1 = a fresh streak), plus `extraPerDay` points a day from other sources (e.g. gems spent on VIP).
 * Assumes the streak is never broken.
 */
export function daysToPoints(needed: number, rule: ChestRule, streakDay = 1, extraPerDay = 0, maxDays = 3650): DaysToTarget {
  const need = nonNeg(needed);
  if (need === 0) return { days: 0, gained: 0 };
  let gained = 0;
  for (let d = 0; d < maxDays; d++) {
    gained += chestPointsOnDay(Math.max(1, Math.floor(streakDay)) + d, rule) + nonNeg(extraPerDay);
    if (gained >= need) return { days: d + 1, gained };
  }
  return { days: null, gained };
}

export interface VipPlanInput {
  currentPoints: number;
  targetVip: number;
  streakDay: number;
  gemsPerDay: number;
}

export interface VipPlan {
  currentVip: number;
  pointsNeeded: number;
  gemsIfAllNow: Calc<number>;
  daysChestOnly: Calc<number | null>;
  daysWithGems: Calc<number | null>;
}

/** The whole Gem → VIP answer for one set of inputs. `cites` = fact ids of thresholds and chest/gem rules. */
export function vipPlan(input: VipPlanInput, levels: readonly VipThreshold[], rule: ChestRule, perGem: number, cites: { thresholds: string[]; chest: string[]; gems: string[] }): VipPlan {
  const pointsNeeded = vipPointsToTarget(input.currentPoints, input.targetVip, levels);
  const both = (...xs: string[][]) => [...new Set(xs.flat())].sort();
  const streak = "streak never broken (missing a day resets it, A05-0003)";
  return {
    currentVip: vipLevelAt(nonNeg(input.currentPoints), levels),
    pointsNeeded,
    gemsIfAllNow: { value: gemsForPoints(pointsNeeded, perGem), facts: both(cites.thresholds, cites.gems), assumptions: ["thresholds read as cumulative totals"], pending: [] },
    daysChestOnly: { value: daysToPoints(pointsNeeded, rule, input.streakDay, 0).days, facts: both(cites.thresholds, cites.chest), assumptions: [streak], pending: [] },
    daysWithGems: {
      value: daysToPoints(pointsNeeded, rule, input.streakDay, nonNeg(input.gemsPerDay) * perGem).days,
      facts: both(cites.thresholds, cites.chest, cites.gems),
      assumptions: [streak, "every one of those gems goes to VIP"],
      pending: ["gems per day"],
    },
  };
}
