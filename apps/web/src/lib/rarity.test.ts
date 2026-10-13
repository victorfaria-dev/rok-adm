import { describe, expect, it } from "vitest";
import { isF2PAchiever, RARITIES, RARITY_RANGES, rarityForCityHall, rarityRank } from "./rarity";

describe("rarityForCityHall (ideias-3d.md, rarity v2)", () => {
  it("maps every City Hall level 1..25 to its tier", () => {
    for (let ch = 1; ch <= 16; ch++) expect(rarityForCityHall(ch)).toBe("common");
    for (let ch = 17; ch <= 21; ch++) expect(rarityForCityHall(ch)).toBe("rare");
    for (let ch = 22; ch <= 24; ch++) expect(rarityForCityHall(ch)).toBe("epic");
    expect(rarityForCityHall(25)).toBe("legendary");
  });

  it("agrees with the published ranges", () => {
    for (const r of RARITIES) {
      const [lo, hi] = RARITY_RANGES[r];
      expect(rarityForCityHall(lo)).toBe(r);
      expect(rarityForCityHall(hi)).toBe(r);
    }
  });

  it("clamps junk: below 1, above 25, fractions, NaN", () => {
    expect(rarityForCityHall(0)).toBe("common");
    expect(rarityForCityHall(-3)).toBe("common");
    expect(rarityForCityHall(99)).toBe("legendary");
    expect(rarityForCityHall(21.9)).toBe("rare");
    expect(rarityForCityHall(Number.NaN)).toBe("common");
    expect(rarityForCityHall(Number.POSITIVE_INFINITY)).toBe("common");
  });

  it("ranks tiers in order", () => {
    expect(RARITIES.map(rarityRank)).toEqual([0, 1, 2, 3]);
  });
});

describe("F2P Achiever", () => {
  it("needs f2p spending and rare or better", () => {
    expect(isF2PAchiever("f2p", "common")).toBe(false);
    expect(isF2PAchiever("f2p", "rare")).toBe(true);
    expect(isF2PAchiever("f2p", "epic")).toBe(true);
    expect(isF2PAchiever("f2p", "legendary")).toBe(true);
    expect(isF2PAchiever("low", "legendary")).toBe(false);
    expect(isF2PAchiever("whale", "epic")).toBe(false);
  });
});
