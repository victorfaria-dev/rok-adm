// Governor card rarity (F-60, v2 rule in produto/ideias-3d.md): one number decides it, the City Hall level.

export type Rarity = "common" | "rare" | "epic" | "legendary";

/** Lowest tier first. */
export const RARITIES: readonly Rarity[] = ["common", "rare", "epic", "legendary"];

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary",
};

/** Inclusive City Hall range for each tier. */
export const RARITY_RANGES: Record<Rarity, readonly [number, number]> = {
  common: [1, 16], rare: [17, 21], epic: [22, 24], legendary: [25, 25],
};

/** What the tier means in the game (copy for the card page). */
export const RARITY_MEANING: Record<Rarity, string> = {
  common: "Building up the account",
  rare: "Ready for the first KvK",
  epic: "Late game, last push to the top",
  legendary: "Maxed City Hall, ready for Season of Conquest",
};

export const CITY_HALL_MAX = 25;

/** Pure: City Hall 1–16 Common, 17–21 Rare, 22–24 Epic, 25 Legendary. Out-of-range and junk values clamp. */
export function rarityForCityHall(cityHall: number): Rarity {
  const ch = Number.isFinite(cityHall) ? Math.floor(cityHall) : 1;
  if (ch >= 25) return "legendary";
  if (ch >= 22) return "epic";
  if (ch >= 17) return "rare";
  return "common";
}

/** 0 for common … 3 for legendary. */
export function rarityRank(r: Rarity): number {
  return RARITIES.indexOf(r);
}

/** F2P Achiever: the same milestone reached without spending (rare or better). */
export function isF2PAchiever(spending: string, rarity: Rarity): boolean {
  return spending === "f2p" && rarityRank(rarity) >= rarityRank("rare");
}
