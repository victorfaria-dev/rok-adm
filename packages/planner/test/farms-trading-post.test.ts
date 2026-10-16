import { describe, expect, it } from "vitest";
import {
  TRADING_POST_LEVELS, TP_UNLOCK_NOTE, tradingPostLevel, grossForNet, netForGross, grossRatio, planTransfer,
} from "../src/farms-trading-post";
import { BUNDLED_FACTS, type FactMeta } from "../src/facts";

const codes = (p: ReturnType<typeof planTransfer>) => p.warnings.map((w) => w.code);

describe("TRADING_POST_LEVELS (A03-0024, A03-0025)", () => {
  it("has levels 1..25 with the card's tax milestones", () => {
    expect(TRADING_POST_LEVELS.map((l) => l.level)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
    const tax = (lv: number) => tradingPostLevel(lv)!.taxRate;
    expect([tax(1), tax(5), tax(10), tax(15), tax(20), tax(21), tax(22), tax(23), tax(24), tax(25)])
      .toEqual([0.35, 0.31, 0.26, 0.21, 0.16, 0.15, 0.14, 0.12, 0.1, 0.08]);
  });

  it("has the Fandom capacities L1 10,000 / L15 1.6M / L24 4.0M / L25 10M", () => {
    const cap = (lv: number) => tradingPostLevel(lv)!.capacity;
    expect([cap(1), cap(15), cap(24), cap(25)]).toEqual([10_000, 1_600_000, 4_000_000, 10_000_000]);
  });

  it("keeps requirements (CH12 at L1, Goldmine from L10, none in between)", () => {
    expect(tradingPostLevel(1)!.requirement).toBe("City Hall Lv.12");
    expect(tradingPostLevel(5)!.requirement).toBe("");
    expect(tradingPostLevel(10)!.requirement).toBe("Goldmine Lv.10");
    for (const l of TRADING_POST_LEVELS) expect(l.facts).toEqual(["A03-0024", "A03-0025"]);
  });

  it("unknown levels return undefined", () => {
    expect(tradingPostLevel(0)).toBeUndefined();
    expect(tradingPostLevel(26)).toBeUndefined();
    expect(tradingPostLevel(1.5)).toBeUndefined();
  });

  it("TP_UNLOCK_NOTE is contested CH12 vs CH10 with computed confidence", () => {
    expect(TP_UNLOCK_NOTE.status).toBe("contested");
    expect(TP_UNLOCK_NOTE.probableCityHall).toBe(12);
    expect(TP_UNLOCK_NOTE.otherCityHall).toBe(10);
    expect(TP_UNLOCK_NOTE.facts).toEqual(["A03-0025"]);
    expect(TP_UNLOCK_NOTE.gaps).toEqual(["L-A03-04"]);
    expect(TP_UNLOCK_NOTE.confidence).toBe("low"); // A03-0025 is contestado
  });
});

describe("grossForNet / netForGross / grossRatio", () => {
  it("matches farms.md: 1.27x at 21%, 1.11x at 10%", () => {
    expect(grossRatio(0.21).toFixed(2)).toBe("1.27");
    expect(grossRatio(0.1).toFixed(2)).toBe("1.11");
    expect(grossRatio(0)).toBe(1);
  });

  it("rounds gross up and net down, float-safe", () => {
    expect(grossForNet(79, 0.21)).toBe(100);
    expect(grossForNet(1_000_000, 0.21)).toBe(1_265_823);
    expect(grossForNet(1, 0.35)).toBe(2);
    expect(netForGross(100, 0.21)).toBe(79);
    expect(netForGross(1_265_823, 0.21)).toBe(1_000_000);
    expect(netForGross(3, 0.35)).toBe(1);
  });

  it("round-trips: what you send always covers what you need", () => {
    for (const t of [0.35, 0.29, 0.21, 0.15, 0.12, 0.1, 0.08]) {
      for (const n of [0, 1, 7, 999, 123_457, 5_000_000, 987_654_321_123]) {
        const g = grossForNet(n, t);
        expect(netForGross(g, t)).toBeGreaterThanOrEqual(n);
        if (g > 0) expect(netForGross(g - 1, t)).toBeLessThan(n);
      }
    }
  });

  it("zero is zero; huge numbers stay exact enough", () => {
    expect(grossForNet(0, 0.35)).toBe(0);
    expect(netForGross(0, 0.08)).toBe(0);
    expect(grossForNet(1e12, 0.1)).toBe(1_111_111_111_112);
  });

  it("rejects negative, NaN, Infinity and out-of-range tax", () => {
    expect(() => grossForNet(-1, 0.2)).toThrow(RangeError);
    expect(() => grossForNet(Number.NaN, 0.2)).toThrow(RangeError);
    expect(() => grossForNet(Number.POSITIVE_INFINITY, 0.2)).toThrow(RangeError);
    expect(() => netForGross(10, 1)).toThrow(RangeError);
    expect(() => netForGross(10, -0.1)).toThrow(RangeError);
    expect(() => grossRatio(Number.NaN)).toThrow(RangeError);
    expect(() => grossForNet(Number.MAX_VALUE, 0.5)).toThrow(/too large/);
  });
});

describe("planTransfer", () => {
  it("full plan at TP15: tax 21%, 1.6M per trip, trips, shippable, rounds", () => {
    const p = planTransfer({ netNeeded: 2_000_000, level: 15, resource: "food", farmStock: 4_000_000, storehouseProtection: 1_000_000, marches: 3 });
    expect(p.taxRate).toBe(0.21);
    expect(p.taxSource).toBe("table");
    expect(p.capacityPerTrip).toBe(1_600_000);
    expect(p.capacitySource).toBe("table");
    expect(p.gross).toBe(2_531_646);
    expect(p.tax).toBe(531_646);
    expect(p.trips).toBe(2);
    expect(p.shippable).toBe(3_000_000);
    expect(p.shortfall).toBe(0);
    expect(p.rounds).toBe(1);
    expect(codes(p)).toEqual(["protected_not_shippable", "protection_is_input", "capacity_contested", "capacity_counts_gross", "march_queue"]);
    expect(p.confidence).toBe("low");
    expect(p.facts).toEqual(expect.arrayContaining(["A03-0024", "A03-0025", "A03-0026", "A03-0030", "A03-0006"]));
  });

  it("shortfall when stock above protection is not enough; protection above stock floors at 0", () => {
    const p = planTransfer({ netNeeded: 1_000_000, level: 24, resource: "wood", farmStock: 1_500_000, storehouseProtection: 1_000_000 });
    expect(p.gross).toBe(1_111_112);
    expect(p.shippable).toBe(500_000);
    expect(p.shortfall).toBe(611_112);
    const q = planTransfer({ netNeeded: 10, level: 24, resource: "wood", farmStock: 5, storehouseProtection: 100 });
    expect(q.shippable).toBe(0);
    expect(q.shortfall).toBe(12);
  });

  it("overrides win over the table", () => {
    const p = planTransfer({ netNeeded: 900, level: 1, taxRateOverride: 0.1, capacityOverride: 500, resource: "stone" });
    expect(p.taxRate).toBe(0.1);
    expect(p.taxSource).toBe("override");
    expect(p.capacityPerTrip).toBe(500);
    expect(p.capacitySource).toBe("override");
    expect(p.gross).toBe(1000);
    expect(p.trips).toBe(2);
    expect(codes(p)).not.toContain("capacity_contested");
  });

  it("level 25 capacity is official: no contested warning", () => {
    const p = planTransfer({ netNeeded: 9_200_000, level: 25, resource: "food" });
    expect(p.gross).toBe(10_000_000);
    expect(p.trips).toBe(1);
    expect(codes(p)).not.toContain("capacity_contested");
  });

  it("unknown level and no override: nothing computed, pending", () => {
    const p = planTransfer({ netNeeded: 1000, level: null, resource: "food", farmStock: 10, storehouseProtection: null, marches: 2 });
    expect(p.taxRate).toBeNull();
    expect(p.taxSource).toBe("unknown");
    expect(p.gross).toBeNull();
    expect(p.tax).toBeNull();
    expect(p.trips).toBeNull();
    expect(p.shippable).toBeNull();
    expect(p.shortfall).toBeNull();
    expect(p.rounds).toBeNull();
    expect(p.confidence).toBe("pending");
    expect(codes(p)).toEqual(expect.arrayContaining(["tax_unknown", "capacity_unknown"]));
  });

  it("tax override without capacity: gross known, trips unknown", () => {
    const p = planTransfer({ netNeeded: 790, taxRateOverride: 0.21, resource: "food", marches: 4 });
    expect(p.gross).toBe(1000);
    expect(p.trips).toBeNull();
    expect(p.rounds).toBeNull();
    expect(p.confidence).toBe("high"); // only the tax formula (A03-0024, alta)
    expect(codes(p)).toContain("capacity_unknown");
    expect(codes(p)).not.toContain("capacity_counts_gross");
  });

  it("gold adds the pending-T0 warning (A03-0027, L-A03-03)", () => {
    const p = planTransfer({ netNeeded: 1, level: 10, resource: "gold" });
    const w = p.warnings.find((x) => x.code === "gold_pending_t0")!;
    expect(w.facts).toEqual(["A03-0027"]);
    expect(w.gaps).toEqual(["L-A03-03"]);
    expect(w.confidence).toBe("medium");
    expect(codes(planTransfer({ netNeeded: 1, level: 10, resource: "food" }))).not.toContain("gold_pending_t0");
  });

  it("capacity-vs-gross assumption is flagged as a hypothesis capped at low", () => {
    const p = planTransfer({ netNeeded: 1, level: 25, resource: "food" });
    const w = p.warnings.find((x) => x.code === "capacity_counts_gross")!;
    expect(w.hypothesis).toBe(true);
    expect(w.confidence).toBe("low");
    expect(p.confidence).toBe("low");
  });

  it("zero needed: zero trips", () => {
    const p = planTransfer({ netNeeded: 0, level: 15, resource: "food", marches: 2 });
    expect(p.gross).toBe(0);
    expect(p.trips).toBe(0);
    expect(p.rounds).toBe(0);
  });

  it("rounds = ceil(trips / marches)", () => {
    const p = planTransfer({ netNeeded: 7000, taxRateOverride: 0, capacityOverride: 1000, resource: "food", marches: 3 });
    expect(p.trips).toBe(7);
    expect(p.rounds).toBe(3);
  });

  it("confidence follows the fact index passed in", () => {
    const facts: FactMeta[] = BUNDLED_FACTS.map((f) => (f.id === "A03-0024" ? { ...f, confidence: "baixa" } : f));
    expect(planTransfer({ netNeeded: 1, taxRateOverride: 0.2, resource: "food" }, { facts }).confidence).toBe("low");
    const without = BUNDLED_FACTS.filter((f) => f.id !== "A03-0024");
    expect(planTransfer({ netNeeded: 1, taxRateOverride: 0.2, resource: "food" }, { facts: without }).confidence).toBe("pending");
  });

  it("validates every input", () => {
    const base = { netNeeded: 1, resource: "food" as const };
    expect(() => planTransfer({ ...base, netNeeded: -1 })).toThrow(RangeError);
    expect(() => planTransfer({ ...base, netNeeded: Number.NaN })).toThrow(RangeError);
    expect(() => planTransfer({ ...base, level: 0 })).toThrow(RangeError);
    expect(() => planTransfer({ ...base, level: 26 })).toThrow(RangeError);
    expect(() => planTransfer({ ...base, level: 2.5 })).toThrow(RangeError);
    expect(() => planTransfer({ ...base, taxRateOverride: 1 })).toThrow(RangeError);
    expect(() => planTransfer({ ...base, capacityOverride: 0 })).toThrow(RangeError);
    expect(() => planTransfer({ ...base, capacityOverride: Number.NaN })).toThrow(RangeError);
    expect(() => planTransfer({ ...base, farmStock: -5 })).toThrow(RangeError);
    expect(() => planTransfer({ ...base, storehouseProtection: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => planTransfer({ ...base, marches: 0 })).toThrow(RangeError);
    expect(() => planTransfer({ ...base, marches: 1.5 })).toThrow(RangeError);
    expect(() => planTransfer({ ...base, resource: "gems" as never })).toThrow(RangeError);
  });
});
