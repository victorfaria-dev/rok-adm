// Action Points (F-81). Every rule number arrives as an argument (A09-0001, A09-0002, A09-0006, A04-0008).
// The base regeneration rate is unknown (gap L-A09-01): any regen figure is the player's own.
import { nonNeg } from "./types";

export interface BarbarianRule {
  /** AP of the first attack (50). */
  base: number;
  /** AP less per consecutive attack without returning (2). */
  step: number;
  /** Largest streak reduction (10). */
  maxStreak: number;
}

/** AP of attack number `n` (1 = first) in one chain, with an extra flat reduction (Insight talent). */
export function barbarianAttackCost(n: number, rule: BarbarianRule, insight = 0): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError("attack number must be 1 or more");
  const streak = Math.min(rule.maxStreak, rule.step * (n - 1));
  return Math.max(0, rule.base - streak - nonNeg(insight));
}

export interface Chain { attacks: number; spent: number; left: number }

/** Attacks you can make in one chain (never returning to the city) with `ap` AP. */
export function barbarianChain(ap: number, rule: BarbarianRule, insight = 0, maxAttacks = 10000): Chain {
  let left = Math.floor(nonNeg(ap)), attacks = 0, spent = 0;
  while (attacks < maxAttacks) {
    const c = barbarianAttackCost(attacks + 1, rule, insight);
    if (c <= 0 || c > left) break;
    left -= c; spent += c; attacks++;
  }
  return { attacks, spent, left };
}

export interface PackRule { ap: number; startGems: number; stepGems: number }

/** Gem price of the next pack after `bought` purchases today. */
export function packPrice(bought: number, rule: PackRule): number {
  return rule.startGems + rule.stepGems * Math.floor(nonNeg(bought));
}

/** Gems for `more` packs after `bought` purchases today (prices rise each purchase, reset daily). */
export function packsCost(bought: number, more: number, rule: PackRule): number {
  const p = Math.floor(nonNeg(bought)), n = Math.floor(nonNeg(more));
  return n * rule.startGems + rule.stepGems * (n * p + (n * (n - 1)) / 2);
}

/**
 * AP after the daily claim. Since 1.1.02 the claim works while AP is below the cap and may push it
 * over the cap (A09-0006); at or above the cap it cannot be claimed.
 */
export function afterDailyClaim(ap: number, cap: number, claim: number): { ap: number; claimed: boolean; overCap: number } {
  const now = nonNeg(ap);
  const claimed = now < cap;
  const next = claimed ? now + nonNeg(claim) : now;
  return { ap: next, claimed, overCap: Math.max(0, next - cap) };
}

/** Hours until AP reaches the cap at `perHour` (null when the rate is unknown or 0). */
export function hoursToCap(ap: number, cap: number, perHour: number): number | null {
  if (!(perHour > 0)) return null;
  return Math.max(0, cap - nonNeg(ap)) / perHour;
}
