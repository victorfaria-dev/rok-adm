// Pack value calculator (/tools/pack-value/, wave J). Client-safe, pure. Method A12-0618: only raw gems
// and raw VIP points per unit of money are counted; speedups, sculptures, materials and other items are
// never priced in gems (the basis changes rankings by up to about 5×).

export interface PackInput {
  /** The price the player sees in their store, in their currency. */
  price: number;
  gems: number;
  vipPoints: number;
}

export interface PackValue {
  gemsPerUnit: number;
  vipPerUnit: number;
}

/** Raw gems and VIP points per unit of the player's currency; null when there is no positive price. */
export function packValue(i: PackInput): PackValue | null {
  if (!(i.price > 0) || !Number.isFinite(i.price)) return null;
  const per = (x: number) => (x > 0 && Number.isFinite(x) ? Math.round((x / i.price) * 10) / 10 : 0);
  return { gemsPerUnit: per(i.gems), vipPerUnit: per(i.vipPoints) };
}

/** A pack from the Low spender data, priced at its USD list price (A12-0618 ratios). */
export interface PackReference {
  id: string;
  label: string;
  priceUsd: number;
  gemsPerUsd: number | null;
  vipPerUsd: number | null;
}

export interface Comparison {
  /** References with fewer raw gems per dollar than the pack. */
  moreGemsThan: string[];
  /** References with more raw gems per dollar than the pack. */
  fewerGemsThan: string[];
}

/**
 * Where a pack priced in USD sits among the reference packs, by raw gems per dollar only. Null for
 * another currency: list prices are USD and store prices differ by region, so a cross-currency
 * comparison would be invented.
 */
export function compareGems(v: PackValue, refs: readonly PackReference[], currency: "usd" | "other"): Comparison | null {
  if (currency !== "usd" || v.gemsPerUnit <= 0) return null;
  const withGems = refs.filter((r): r is PackReference & { gemsPerUsd: number } => r.gemsPerUsd !== null && r.gemsPerUsd > 0);
  return {
    moreGemsThan: withGems.filter((r) => r.gemsPerUsd < v.gemsPerUnit).map((r) => r.label),
    fewerGemsThan: withGems.filter((r) => r.gemsPerUsd > v.gemsPerUnit).map((r) => r.label),
  };
}
