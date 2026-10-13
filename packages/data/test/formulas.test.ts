import { describe, expect, it } from "vitest";
import {
  cityHallBuildSeconds, cityHallUpgradeCost, getFact, getTable, tradingPostReceived, tradingPostSendFor, tradingPostTaxRate,
  vipPointsBetween, type FormulaData,
} from "../src";
import { rawCsvColumn } from "./helpers";

const chTime = rawCsvColumn("facts/A01/data/city-hall.csv", "Level", "time_seconds");
const chFood = rawCsvColumn("facts/A01/data/city-hall.csv", "Level", "food");
const vip = rawCsvColumn("facts/A05/data/vip-levels.csv", "vip_level", "vip_points_threshold");
const tax = rawCsvColumn("facts/A03/data/trading-post.csv", "Level", "Tax Rate");

describe("City Hall build time (A01-0001)", () => {
  it("equals the CSV time of a single level", () => {
    for (let lv = 2; lv <= 25; lv++) expect(cityHallBuildSeconds(lv - 1, lv).value).toBe(Number(chTime.get(String(lv))));
  });
  it("is cumulative and additive", () => {
    let sum = 0;
    for (let lv = 2; lv <= 25; lv++) sum += Number(chTime.get(String(lv)));
    expect(cityHallBuildSeconds(1, 25).value).toBe(sum);
    expect(cityHallBuildSeconds(1, 17).value + cityHallBuildSeconds(17, 25).value).toBe(sum);
    expect(cityHallBuildSeconds(10, 10).value).toBe(0);
  });
  it("agrees with the derived card A01-0005 (CH2→CH17 ≈ 21.6 d, CH2→CH22 ≈ 70.8 d, CH2→CH25 ≈ 257.1 d)", () => {
    const days = (to: number) => cityHallBuildSeconds(1, to).value / 86400;
    expect(days(17)).toBeCloseTo(21.6, 1);
    expect(days(22)).toBeCloseTo(70.8, 1);
    expect(days(25)).toBeCloseTo(257.1, 1);
  });
  it("carries inputs and confidence", () => {
    const r = cityHallBuildSeconds(20, 21);
    expect(r.inputs).toEqual(["A01-0001"]);
    expect(r.confidence).toBe(getFact("A01-0001")!.confidence);
    expect(r.usable).toBe(true);
  });
  it("rejects out-of-range levels", () => {
    expect(() => cityHallBuildSeconds(0, 5)).toThrow(RangeError);
    expect(() => cityHallBuildSeconds(5, 26)).toThrow(RangeError);
    expect(() => cityHallBuildSeconds(6, 5)).toThrow(RangeError);
  });
});

describe("City Hall upgrade cost (A01-0001)", () => {
  it("sums CSV resources and lists extra items", () => {
    let food = 0;
    for (let lv = 2; lv <= 25; lv++) food += Number(chFood.get(String(lv)) || 0);
    const r = cityHallUpgradeCost(1, 25);
    expect(r.value.food).toBe(food);
    expect(r.value.gold).toBe(0);
    expect(r.value.extra).toEqual(["L25: 1x Master's Blueprint"]);
  });
});

describe("VIP points between levels (A05-0001)", () => {
  it("is the difference of cumulative thresholds", () => {
    for (let lv = 1; lv <= 18; lv++) expect(vipPointsBetween(0, lv).value).toBe(Number(vip.get(String(lv))));
    expect(vipPointsBetween(6, 10).value).toBe(Number(vip.get("10")) - Number(vip.get("6")));
    expect(vipPointsBetween(6, 10).value).toBe(138500); // the T4 quote in A05-0001: "138k VIP points from 6 to 10"
    expect(vipPointsBetween(3, 3).value).toBe(0);
  });
  it("flags the cumulative reading", () => {
    const r = vipPointsBetween(0, 10);
    expect(r.inputs).toEqual(["A05-0001"]);
    expect(r.assumptions.join(" ")).toMatch(/cumulative/);
    expect(() => vipPointsBetween(0, 19)).toThrow(RangeError);
  });
});

describe("Trading Post tax (A03-0024)", () => {
  it("matches the CSV rate at every level", () => {
    for (let lv = 1; lv <= 25; lv++) expect(tradingPostTaxRate(lv).value).toBeCloseTo(parseFloat(tax.get(String(lv))!) / 100, 10);
  });
  it("matches the card statement endpoints (35% at L1, 8% at L25)", () => {
    expect(getFact("A03-0024")!.statement).toMatch(/35%.*8%/);
    expect(tradingPostTaxRate(1).value).toBeCloseTo(0.35);
    expect(tradingPostTaxRate(25).value).toBeCloseTo(0.08);
  });
  it("derives received/sent amounts (A03-0024 notes: 1.27x at 21%, 1.11x at 10%)", () => {
    expect(tradingPostReceived(1_000_000, 1).value).toBeCloseTo(650_000);
    expect(tradingPostSendFor(1, 15).value).toBeCloseTo(1.27, 2); // L15 = 21%
    expect(tradingPostSendFor(1, 24).value).toBeCloseTo(1.11, 2); // L24 = 10%
    const r = tradingPostReceived(100, 10);
    expect(r).toMatchObject({ inputs: ["A03-0024"], confidence: "alta", usable: true });
  });
});

describe("formulas only read injected data", () => {
  it("uses fixture data and propagates the weakest confidence / usability", () => {
    const data: FormulaData = {
      fact: (id) => ({ ...getFact(id)!, confidence: "baixa" }),
      table: (name) => ({ ...getTable(name), rows: [{ Level: 1, time_seconds: null }, { Level: 2, time_seconds: 60 }, { Level: 3, time_seconds: 120 }] }),
    };
    expect(cityHallBuildSeconds(1, 3, data)).toMatchObject({ value: 180, confidence: "baixa", usable: false });
    expect(() => cityHallBuildSeconds(1, 4, data)).toThrow(RangeError);
  });
  it("fails loudly when a needed value is missing", () => {
    const data: FormulaData = {
      fact: (id) => getFact(id)!,
      table: (name) => ({ ...getTable(name), rows: [{ Level: 1, time_seconds: null }, { Level: 2, time_seconds: null }] }),
    };
    expect(() => cityHallBuildSeconds(1, 2, data)).toThrow(/no numeric value/);
  });
});
