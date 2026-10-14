import { describe, expect, it } from "vitest";
import { buildLowBudgetPayload } from "./guide-payload";
import { compareGems, packValue, type PackReference } from "./pack-value";

const refs: PackReference[] = buildLowBudgetPayload().purchases.map((p) => ({
  id: p.id, label: p.label, priceUsd: p.priceUsd.value, gemsPerUsd: p.gemsPerUsd?.value ?? null, vipPerUsd: p.vipPerUsd?.value ?? null,
}));

describe("pack value (A12-0618 method)", () => {
  it("counts raw gems and VIP points per unit of the price the player sees", () => {
    expect(packValue({ price: 9.99, gems: 19500, vipPoints: 0 })).toEqual({ gemsPerUnit: 1952, vipPerUnit: 0 });
    expect(packValue({ price: 5, gems: 1050, vipPoints: 525 })).toEqual({ gemsPerUnit: 210, vipPerUnit: 105 });
  });

  it("matches the planner's ratios for the reference packs", () => {
    for (const r of refs) {
      if (r.gemsPerUsd === null) continue;
      const gems = buildLowBudgetPayload().purchases.find((p) => p.id === r.id)!.gems!.value;
      expect(Math.round(packValue({ price: r.priceUsd, gems, vipPoints: 0 })!.gemsPerUnit), r.id).toBe(r.gemsPerUsd);
    }
  });

  it("gives no value without a positive price", () => {
    for (const price of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) expect(packValue({ price, gems: 100, vipPoints: 0 })).toBeNull();
  });

  it("compares with the USD list prices only when the store shows USD", () => {
    const v = packValue({ price: 5, gems: 1050, vipPoints: 525 })!;
    expect(compareGems(v, refs, "other")).toBeNull();
    const c = compareGems(v, refs, "usd")!;
    expect(c.fewerGemsThan.some((l) => /Suprimento de Gemas/.test(l))).toBe(true);
    expect(c.moreGemsThan).not.toContain(refs.find((r) => r.id === "growth-fund")!.label);
    expect(compareGems({ gemsPerUnit: 0, vipPerUnit: 10 }, refs, "usd")).toBeNull();
  });
});
