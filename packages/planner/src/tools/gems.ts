// Gem value math (F-21) and reserve gaps (F-25). Prices and rewards arrive as arguments
// (A04-0007 VIP Shop table, A04-0008 AP purchase rule, A01-0002 City Hall rewards).
import { parseDuration } from "./time";
import { nonNeg } from "./types";

/** Escalating gem price rule: the 1st purchase of the day costs `start`, each next one `step` more. */
export interface LadderRule { start: number; step: number; perPurchase: number }

/** Price in gems of the `n`-th purchase of the day (n = 1 is the first). */
export function ladderPrice(n: number, rule: LadderRule): number {
  const k = Math.max(1, Math.floor(nonNeg(n, 1)));
  return rule.start + rule.step * (k - 1);
}

/** Total gems for the first `count` purchases of one day (arithmetic series). */
export function ladderTotal(count: number, rule: LadderRule): number {
  const c = Math.floor(nonNeg(count));
  return c * rule.start + (rule.step * c * (c - 1)) / 2;
}

export interface LadderRow {
  n: number;
  price: number;
  total: number;
  /** What you get from all purchases so far (e.g. AP). */
  amount: number;
  /** Gems per unit for this one purchase (price ÷ perPurchase). */
  perUnit: number;
}

/** The first `count` rows of the day's price ladder. */
export function ladderRows(count: number, rule: LadderRule): LadderRow[] {
  if (!(rule.perPurchase > 0)) throw new RangeError("perPurchase must be positive");
  const rows: LadderRow[] = [];
  for (let n = 1; n <= Math.floor(nonNeg(count)); n++) {
    const price = ladderPrice(n, rule);
    rows.push({ n, price, total: ladderTotal(n, rule), amount: n * rule.perPurchase, perUnit: price / rule.perPurchase });
  }
  return rows;
}

/** Speedup minutes printed in an item name, e.g. "Universal Speedup (8h)" → 480; null when the name has no duration. */
export function speedupMinutes(item: string): number | null {
  if (!/speedup/i.test(item)) return null;
  const m = /\(([^()]+)\)\s*$/.exec(item.trim());
  if (!m) return null;
  const s = parseDuration(m[1]!);
  return s && s > 0 ? s / 60 : null;
}

/** Gems per minute of speedup (derived: price ÷ minutes). */
export function gemsPerMinute(price: number, minutes: number): number {
  if (!(minutes > 0)) throw new RangeError("minutes must be positive");
  return nonNeg(price) / minutes;
}

/** True when a scraped table cell is a plain item name (not wiki markup or a comment). */
export function isPlainItemName(item: unknown): item is string {
  return typeof item === "string" && /^[A-Za-z0-9]/.test(item.trim()) && !/\[\[|\{\{|<!--|\|/.test(item);
}

export interface ShopRow { item: string; price: number; vip: number; qty: number }

export interface ShopRowView extends ShopRow {
  /** Derived from the duration in the item name; null when the name has none. */
  gemsPerMinute: number | null;
  /** Gems to buy the whole weekly quantity. */
  weeklyGems: number;
}

/** Add the derived columns to VIP Shop rows. */
export function shopView(rows: readonly ShopRow[]): ShopRowView[] {
  return rows.map((r) => {
    const min = speedupMinutes(r.item);
    return { ...r, gemsPerMinute: min ? gemsPerMinute(r.price, min) : null, weeklyGems: r.price * r.qty };
  });
}

/** Rows a player at `vip` can buy (all rows when vip is null). */
export function shopForVip<T extends { vip: number }>(rows: readonly T[], vip: number | null): T[] {
  return vip === null ? [...rows] : rows.filter((r) => r.vip <= vip);
}

export interface LevelGems { level: number; gems: number }

/** One-time gems still to come from City Hall rewards above `currentCh` (levels currentCh+1 … maxCh). */
export function gemsStillToCome(currentCh: number, rows: readonly LevelGems[]): number {
  const ch = Math.floor(nonNeg(currentCh));
  return rows.filter((r) => r.level > ch).reduce((s, r) => s + nonNeg(r.gems), 0);
}

/** One-time gems already collected from City Hall rewards up to `currentCh`. */
export function gemsCollected(currentCh: number, rows: readonly LevelGems[]): number {
  const ch = Math.floor(nonNeg(currentCh));
  return rows.filter((r) => r.level <= ch).reduce((s, r) => s + nonNeg(r.gems), 0);
}

export interface ReserveGap {
  saved: number;
  target: number;
  /** Still missing (0 when on target). */
  missing: number;
  /** 0–100, whole number; 100 when the target is 0. */
  pct: number;
}

/** Saved vs target for one hoarded item (F-25). */
export function reserveGap(saved: number, target: number): ReserveGap {
  const s = nonNeg(saved), t = nonNeg(target);
  return { saved: s, target: t, missing: Math.max(0, t - s), pct: t === 0 ? 100 : Math.min(100, Math.floor((s / t) * 100)) };
}
