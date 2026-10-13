import { describe, expect, it } from "vitest";
import { healWave, hospitalCapacity, overflow, totalCapacity } from "../src/tools";

const table = [{ level: 1, capacity: 7500 }, { level: 15, capacity: 29000 }];

describe("hospital capacity", () => {
  it("reads one hospital and multiplies by the count", () => {
    expect(hospitalCapacity(15, table)).toBe(29000);
    expect(totalCapacity(15, 4, table)).toBe(116000);
    expect(totalCapacity(1, 0, table)).toBe(0);
    expect(totalCapacity(1, -2, table)).toBe(0);
    expect(totalCapacity(1, 2.7, table)).toBe(15000);
  });
  it("throws RangeError for a level not in the table", () => {
    expect(() => hospitalCapacity(2, table)).toThrow(RangeError);
  });
});

describe("overflow", () => {
  it("counts wounded beyond capacity", () => {
    expect(overflow(40000, 29000)).toBe(11000);
    expect(overflow(1000, 29000)).toBe(0);
    expect(overflow(-5, 10)).toBe(0);
  });
});

describe("healWave", () => {
  it("multiplies per-troop cost and time", () => {
    const w = healWave(1000, { food: 10, wood: 10, stone: 5, gold: 2, seconds: 3 }, 20);
    expect(w).toMatchObject({ troops: 1000, food: 10000, wood: 10000, stone: 5000, gold: 2000, seconds: 3000, costUnknown: false });
    expect(w.speedupShortMin).toBe(30);
  });
  it("time unknown → null; cost unknown → flagged", () => {
    const w = healWave(1000, { food: 0, wood: 0, stone: 0, gold: 0, seconds: 0 });
    expect(w.seconds).toBeNull();
    expect(w.speedupShortMin).toBeNull();
    expect(w.costUnknown).toBe(true);
  });
  it("speedups beyond the need leave no shortfall; negatives read as zero", () => {
    expect(healWave(10, { food: 1, wood: 0, stone: 0, gold: 0, seconds: 6 }, 999).speedupShortMin).toBe(0);
    expect(healWave(-10, { food: -1, wood: 0, stone: 0, gold: 0, seconds: 6 }).troops).toBe(0);
  });
});
