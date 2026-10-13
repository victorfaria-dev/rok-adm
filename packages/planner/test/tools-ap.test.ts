import { describe, expect, it } from "vitest";
import { afterDailyClaim, barbarianAttackCost, barbarianChain, hoursToCap, packPrice, packsCost } from "../src/tools";

const rule = { base: 50, step: 2, maxStreak: 10 };
const pack = { ap: 500, startGems: 100, stepGems: 50 };

describe("barbarian attacks", () => {
  it("first attack is full price, then −2 each, floor at −10", () => {
    expect([1, 2, 3, 6, 7, 20].map((n) => barbarianAttackCost(n, rule))).toEqual([50, 48, 46, 40, 40, 40]);
    expect(barbarianAttackCost(6, rule, 10)).toBe(30);
  });
  it("throws for attack numbers below 1", () => {
    expect(() => barbarianAttackCost(0, rule)).toThrow(RangeError);
    expect(() => barbarianAttackCost(1.5, rule)).toThrow(RangeError);
  });
  it("counts the attacks one chain allows", () => {
    // 50+48+46+44+42 = 230, then 40 each.
    expect(barbarianChain(230, rule)).toEqual({ attacks: 5, spent: 230, left: 0 });
    expect(barbarianChain(1500, rule)).toEqual({ attacks: 5 + Math.floor((1500 - 230) / 40), spent: 230 + 31 * 40, left: 30 });
    expect(barbarianChain(49, rule).attacks).toBe(0);
    expect(barbarianChain(-100, rule).attacks).toBe(0);
  });
});

describe("gem AP packs", () => {
  it("prices rise 50 per purchase", () => {
    expect(packPrice(0, pack)).toBe(100);
    expect(packPrice(3, pack)).toBe(250);
  });
  it("sums escalating prices", () => {
    expect(packsCost(0, 3, pack)).toBe(100 + 150 + 200);
    expect(packsCost(2, 2, pack)).toBe(200 + 250);
    expect(packsCost(5, 0, pack)).toBe(0);
    expect(packsCost(-1, -1, pack)).toBe(0);
  });
});

describe("daily claim and regen", () => {
  it("claims below the cap, may go over it", () => {
    expect(afterDailyClaim(1200, 1500, 500)).toEqual({ ap: 1700, claimed: true, overCap: 200 });
    expect(afterDailyClaim(0, 1500, 500)).toEqual({ ap: 500, claimed: true, overCap: 0 });
    expect(afterDailyClaim(1500, 1500, 500)).toEqual({ ap: 1500, claimed: false, overCap: 0 });
  });
  it("hours to cap only with a known rate", () => {
    expect(hoursToCap(1000, 1500, 0)).toBeNull();
    expect(hoursToCap(1000, 1500, 50)).toBe(10);
    expect(hoursToCap(2000, 1500, 50)).toBe(0);
  });
});
