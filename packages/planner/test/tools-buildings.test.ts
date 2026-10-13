import { describe, expect, it } from "vitest";
import { cleanRequirement, parseExtra, upgradeCost, type LevelCost } from "../src/tools";

const row = (level: number, x: Partial<LevelCost> = {}): LevelCost => ({
  level, food: 100 * level, wood: 200 * level, stone: null, gold: null, seconds: 60 * level, extra: null, ...x,
});
const rows: LevelCost[] = [
  row(1, { food: null, wood: null, seconds: null }),
  row(2),
  row(3, { extra: "Book of Covenant x2", stone: 50 }),
  row(4, { extra: "Book of Covenant x5", gold: 7 }),
  row(5, { seconds: null, extra: "size = 24" }),
  row(6, { garbled: true, food: 2 }),
];

describe("upgradeCost", () => {
  it("sums the rows above `from` up to `to`", () => {
    const c = upgradeCost(rows, 1, 4);
    expect(c).toMatchObject({ food: 900, wood: 1800, stone: 50, gold: 7, seconds: 540, levels: [2, 3, 4], skipped: [], missingTime: [] });
    expect(c.items).toEqual([{ name: "Book of Covenant", count: 7 }]);
  });
  it("from 0 includes level 1 (free level 1 has no missing time)", () => {
    const c = upgradeCost(rows, 0, 2);
    expect(c.levels).toEqual([1, 2]);
    expect(c.missingTime).toEqual([]);
    expect(c.food).toBe(200);
  });
  it("from == to costs nothing", () => {
    expect(upgradeCost(rows, 3, 3)).toMatchObject({ food: 0, wood: 0, seconds: 0, levels: [], items: [] });
  });
  it("flags missing times, unreadable extras and skips garbled rows", () => {
    const c = upgradeCost(rows, 4, 6);
    expect(c.levels).toEqual([5]);
    expect(c.missingTime).toEqual([5]);
    expect(c.unreadableExtra).toEqual([5]);
    expect(c.skipped).toEqual([6]);
    expect(c.food).toBe(500);
  });
  it("throws RangeError for bad ranges", () => {
    expect(() => upgradeCost(rows, 4, 2)).toThrow(RangeError);
    expect(() => upgradeCost(rows, -1, 2)).toThrow(RangeError);
    expect(() => upgradeCost(rows, 1, 7)).toThrow(RangeError);
    expect(() => upgradeCost(rows, 1.5, 3)).toThrow(RangeError);
    expect(() => upgradeCost([row(1), row(3)], 0, 3)).toThrow(RangeError);
  });
});

describe("parseExtra", () => {
  it("reads items out of wiki cells", () => {
    expect(parseExtra("Arrow of Resistance x1500").items).toEqual([{ name: "Arrow of Resistance", count: 1500 }]);
    expect(parseExtra("1x Master's Blueprint").items).toEqual([{ name: "Master's Blueprint", count: 1 }]);
    expect(parseExtra("+ Master's Blueprint").items).toEqual([{ name: "Master's Blueprint", count: 1 }]);
    expect(parseExtra("size = 24 1x Master's Blueprint (glued to cost cell in wiki)").items).toEqual([{ name: "Master's Blueprint", count: 1 }]);
  });
  it("marks unreadable cells and ignores empty ones", () => {
    expect(parseExtra("?")).toEqual({ items: [], unreadable: true });
    expect(parseExtra(null)).toEqual({ items: [], unreadable: false });
    expect(parseExtra("None")).toEqual({ items: [], unreadable: false });
  });
});

describe("cleanRequirement", () => {
  it("drops wiki quote marks and empty values", () => {
    expect(cleanRequirement("'Wall' Lv.4 + 'Hospital' Lv.4")).toBe("Wall Lv.4 + Hospital Lv.4");
    expect(cleanRequirement("None")).toBeNull();
    expect(cleanRequirement(null)).toBeNull();
  });
});
