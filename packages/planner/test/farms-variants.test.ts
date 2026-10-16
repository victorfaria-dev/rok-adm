import { describe, expect, it } from "vitest";
import {
  recommendFarms, mainBottleneck, civsByResource, LOTS_OF_TIME_MINUTES, MIN_FARM_MINUTES, MAX_FARMS_SUGGESTED,
  type FarmRecommendationInput,
} from "../src/farms-variants";
import { BUNDLED_FACTS } from "../src/facts";

const base: FarmRecommendationInput = { mainCityHall: 12, minutesPerDay: 30, spending: "f2p", farmsOwned: 0 };
const variant = (r: ReturnType<typeof recommendFarms>, id: string) => r.variants.find((v) => v.id === id)!;

describe("mainBottleneck (farms.md table)", () => {
  it("CH1–5 food+wood, CH6–9 +stone, CH10–20 gold+stone, CH21+ gold", () => {
    expect(mainBottleneck(1).resources).toEqual(["food", "wood"]);
    expect(mainBottleneck(5).resources).toEqual(["food", "wood"]);
    expect(mainBottleneck(6).resources).toEqual(["food", "wood", "stone"]);
    expect(mainBottleneck(9).resources).toEqual(["food", "wood", "stone"]);
    expect(mainBottleneck(10).resources).toEqual(["gold", "stone"]);
    expect(mainBottleneck(20).resources).toEqual(["gold", "stone"]);
    expect(mainBottleneck(21).resources).toEqual(["gold"]);
    expect(mainBottleneck(25).resources).toEqual(["gold"]);
  });

  it("cites cards and computes confidence from them", () => {
    const b = mainBottleneck(12);
    expect(b.facts).toEqual(["A03-0021", "A03-0001"]);
    expect(b.confidence).toBe("low"); // A03-0001 is contestado
    expect(mainBottleneck(3).confidence).toBe("medium");
    expect(b.stageLabel).toMatch(/Prefeitura 10/);
  });

  it("rejects City Hall outside 1..25", () => {
    for (const ch of [0, 26, 1.5, Number.NaN]) expect(() => mainBottleneck(ch)).toThrow(RangeError);
  });
});

describe("recommendFarms variants (evidence table)", () => {
  it("general is the recommended default", () => {
    const v = variant(recommendFarms(base), "general");
    expect(v.status).toBe("recommended");
    expect(v.hypothesis).toBe(false);
    expect(v.facts).toEqual(["A13-0007", "A13-0009"]);
    expect(v.confidence).toBe("low");
  });

  it("single-resource only possible with a lot of time, always with a weak-evidence note", () => {
    const few = variant(recommendFarms(base), "single-resource");
    expect(few.status).toBe("not_recommended");
    expect(few.why).toMatch(/Evidência fraca/);
    const lots = variant(recommendFarms({ ...base, minutesPerDay: LOTS_OF_TIME_MINUTES }), "single-resource");
    expect(lots.status).toBe("possible");
    expect(lots.hypothesis).toBe(true); // the threshold is a hypothesis
    expect(lots.confidence).toBe("low");
    expect(variant(recommendFarms({ ...base, minutesPerDay: LOTS_OF_TIME_MINUTES - 1 }), "single-resource").status).toBe("not_recommended");
    expect(variant(recommendFarms({ ...base, minutesPerDay: null }), "single-resource").status).toBe("not_recommended");
  });

  it("gold not recommended for f2p/low/unknown spending; possible for higher spenders", () => {
    for (const spending of ["f2p", "low", null] as const) {
      const v = variant(recommendFarms({ ...base, spending }), "gold");
      expect(v.status).toBe("not_recommended");
      expect(v.gaps).toContain("L-A03-03");
      expect(v.facts).toEqual(["A03-0027", "A13-0004"]);
    }
    expect(variant(recommendFarms({ ...base, spending: "high" }), "gold").status).toBe("possible");
  });

  it("food+wood pair is always hidden and a hypothesis (L-A13-03)", () => {
    for (const minutesPerDay of [0, 30, 300]) {
      const v = variant(recommendFarms({ ...base, minutesPerDay, wantsMany: true }), "pair-food-wood");
      expect(v.status).toBe("hidden");
      expect(v.hypothesis).toBe(true);
      expect(v.gaps).toEqual(["L-A13-03"]);
      expect(v.confidence).toBe("low");
    }
  });

  it("returns the four variants in a fixed order", () => {
    expect(recommendFarms(base).variants.map((v) => v.id)).toEqual(["general", "single-resource", "gold", "pair-food-wood"]);
  });
});

describe("recommendFarms farm count (labelled hypothesis, L-A13-04)", () => {
  it("default is 1", () => {
    const c = recommendFarms(base).farmCount;
    expect(c.value).toBe(1);
    expect(c.hypothesis).toBe(true);
    expect(c.gaps).toContain("L-A13-04");
    expect(c.facts).toContain("A13-0001");
  });

  it("0 below the minimum daily time, 1 at it", () => {
    expect(recommendFarms({ ...base, minutesPerDay: MIN_FARM_MINUTES - 1 }).farmCount.value).toBe(0);
    expect(recommendFarms({ ...base, minutesPerDay: 0 }).farmCount.value).toBe(0);
    expect(recommendFarms({ ...base, minutesPerDay: MIN_FARM_MINUTES }).farmCount.value).toBe(1);
  });

  it("2 only when the player wants many and has a lot of time; never more", () => {
    expect(recommendFarms({ ...base, wantsMany: true }).farmCount.value).toBe(1);
    expect(recommendFarms({ ...base, minutesPerDay: 600 }).farmCount.value).toBe(1);
    const two = recommendFarms({ ...base, minutesPerDay: 600, wantsMany: true, farmsOwned: 5 }).farmCount;
    expect(two.value).toBe(MAX_FARMS_SUGGESTED);
    expect(two.why).toMatch(/já tem 5/);
    expect(two.why).toMatch(/nunca sugere mais que 2/);
    expect(two.why).toMatch(/duas cidades por reino/);
  });

  it("unknown minutes still gives 1", () => {
    expect(recommendFarms({ ...base, minutesPerDay: null }).farmCount.value).toBe(1);
  });
});

describe("recommendFarms misc", () => {
  it("mainBottleneck is null when City Hall is unknown", () => {
    expect(recommendFarms({ ...base, mainCityHall: null }).mainBottleneck).toBeNull();
    expect(recommendFarms(base).mainBottleneck?.resources).toEqual(["gold", "stone"]);
  });

  it("civByResource from A03-0029", () => {
    const c = civsByResource();
    expect(c.food.civs).toEqual(["rome", "japan"]);
    expect(c.wood.civs).toEqual(["france", "japan"]);
    expect(c.stone.civs).toEqual(["greece", "byzantium", "japan"]);
    expect(c.gold.civs).toEqual(["maya", "japan"]);
    for (const r of Object.values(c)) {
      expect(r.facts).toEqual(["A03-0029"]);
      expect(r.confidence).toBe("medium");
    }
    expect(recommendFarms(base).civByResource).toEqual(c);
  });

  it("confidence is computed from the index, never hard-coded", () => {
    const facts = BUNDLED_FACTS.map((f) => (f.id === "A03-0029" ? { ...f, confidence: "alta" as const } : f));
    expect(recommendFarms(base, { facts }).civByResource.food.confidence).toBe("high");
    expect(recommendFarms(base, { facts: [] }).variants.every((v) => v.confidence === "pending")).toBe(true);
  });

  it("validates input", () => {
    expect(() => recommendFarms({ ...base, farmsOwned: -1 })).toThrow(RangeError);
    expect(() => recommendFarms({ ...base, farmsOwned: 1.5 })).toThrow(RangeError);
    expect(() => recommendFarms({ ...base, minutesPerDay: -5 })).toThrow(RangeError);
    expect(() => recommendFarms({ ...base, minutesPerDay: Number.NaN })).toThrow(RangeError);
    expect(() => recommendFarms({ ...base, mainCityHall: 30 })).toThrow(RangeError);
  });
});
