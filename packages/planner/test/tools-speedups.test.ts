import { describe, expect, it } from "vitest";
import { canBeHelped, coverJob, helpSeconds, speedupMinutes, speedupTotals } from "../src/tools";

describe("speedupMinutes", () => {
  it("adds duration × count", () => {
    expect(speedupMinutes({ 5: 16, 60: 2, 1440: 1 })).toBe(80 + 120 + 1440);
    expect(speedupMinutes({})).toBe(0);
  });
  it("ignores negative, fractional and bad counts or durations", () => {
    expect(speedupMinutes({ 5: -3, 60: 1.9, 15: Number.NaN })).toBe(60);
    expect(speedupMinutes({ 0: 10, [-5]: 2 })).toBe(0);
  });
});

describe("speedupTotals", () => {
  it("totals per type and overall", () => {
    const t = speedupTotals({ universal: { 5: 2 }, healing: { 60: 1 }, training: { 1440: 1 } });
    expect(t).toEqual({ universal: 10, building: 0, research: 0, training: 1440, healing: 60, total: 1510 });
  });
});

describe("alliance help", () => {
  it("removes 1% of the job per help, capped at the whole job", () => {
    expect(helpSeconds(10000, 30, 1)).toBe(3000);
    expect(helpSeconds(10000, 0, 1)).toBe(0);
    expect(helpSeconds(10000, 200, 1)).toBe(10000);
    expect(helpSeconds(-5, 10, 1)).toBe(0);
  });
  it("never helps troop training", () => {
    expect(canBeHelped("training")).toBe(false);
    expect(canBeHelped("building")).toBe(true);
  });
});

describe("coverJob", () => {
  it("uses the job's own type first, then universal", () => {
    const c = coverJob({ jobSeconds: 100 * 60, job: "building", typedMinutes: 60, universalMinutes: 100, helps: 0, pctPerHelp: 1 });
    expect(c.typedUsedMin).toBe(60);
    expect(c.universalUsedMin).toBe(40);
    expect(c.covered).toBe(true);
    expect(c.shortfall).toBe(0);
  });
  it("reports the shortfall when speedups run out", () => {
    const c = coverJob({ jobSeconds: 10000, job: "research", typedMinutes: 10, universalMinutes: 5, helps: 10, pctPerHelp: 1 });
    expect(c.helped).toBe(1000);
    expect(c.remaining).toBe(9000);
    expect(c.shortfall).toBe(9000 - 15 * 60);
    expect(c.covered).toBe(false);
  });
  it("training gets no helps; a zero job is covered", () => {
    expect(coverJob({ jobSeconds: 6000, job: "training", typedMinutes: 0, universalMinutes: 0, helps: 30, pctPerHelp: 1 }).helped).toBe(0);
    expect(coverJob({ jobSeconds: 0, job: "healing", typedMinutes: 0, universalMinutes: 0, helps: 0, pctPerHelp: 1 }).covered).toBe(true);
  });
});
