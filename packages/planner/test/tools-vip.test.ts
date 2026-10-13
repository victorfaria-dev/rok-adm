import { describe, expect, it } from "vitest";
import { chestPointsOnDay, daysToPoints, gemsForPoints, thresholdOf, vipLevelAt, vipPlan, vipPointsToTarget } from "../src/tools";
import vipJson from "../data/vip-levels.json";
import tools from "../tools-data/vip.json";

const LEVELS = vipJson.levels.map((l) => ({ vip: l.vip, threshold: l.threshold }));
const RULE = { start: tools.chestStart.value, increment: tools.chestIncrement.value, cap: tools.chestCap.value };

describe("VIP thresholds (A05-0001)", () => {
  it("reads levels from cumulative points", () => {
    expect(vipLevelAt(0, LEVELS)).toBe(0);
    expect(vipLevelAt(199, LEVELS)).toBe(0);
    expect(vipLevelAt(200, LEVELS)).toBe(1);
    expect(vipLevelAt(1200, LEVELS)).toBe(3);
    expect(vipLevelAt(10 ** 9, LEVELS)).toBe(18);
  });
  it("points to target never go negative", () => {
    expect(vipPointsToTarget(0, 3, LEVELS)).toBe(1200);
    expect(vipPointsToTarget(5000, 3, LEVELS)).toBe(0);
    expect(thresholdOf(0, LEVELS)).toBe(0);
    expect(() => thresholdOf(19, LEVELS)).toThrow(RangeError);
  });
});

describe("gems and the daily chest (A05-0003, A05-0004)", () => {
  it("1 gem = 1 point, rounded up", () => {
    expect(gemsForPoints(1200, tools.gemToVip.value)).toBe(1200);
    expect(gemsForPoints(5, 2)).toBe(3);
    expect(() => gemsForPoints(5, 0)).toThrow();
  });
  it("chest grows by 20 from 40 and caps at 200 on day 9", () => {
    expect(chestPointsOnDay(1, RULE)).toBe(40);
    expect(chestPointsOnDay(2, RULE)).toBe(60);
    expect(chestPointsOnDay(9, RULE)).toBe(200);
    expect(chestPointsOnDay(50, RULE)).toBe(200);
    // A05-0003 states the first 9 days total 1,080.
    const nine = Array.from({ length: 9 }, (_, d) => chestPointsOnDay(d + 1, RULE)).reduce((a, b) => a + b, 0);
    expect(nine).toBe(1080);
  });
  it("days to a target", () => {
    expect(daysToPoints(0, RULE).days).toBe(0);
    expect(daysToPoints(40, RULE).days).toBe(1);
    expect(daysToPoints(1080, RULE).days).toBe(9);
    expect(daysToPoints(1081, RULE).days).toBe(10);
    expect(daysToPoints(1080, RULE, 9).days).toBe(6); // 200/day from day 9 of the streak
    expect(daysToPoints(1000, RULE, 1, 960).days).toBe(1);
    expect(daysToPoints(10 ** 12, RULE, 1, 0, 10).days).toBeNull();
  });
  it("vipPlan combines thresholds, chest and gems", () => {
    const plan = vipPlan({ currentPoints: 0, targetVip: 3, streakDay: 1, gemsPerDay: 100 }, LEVELS, RULE, 1, { thresholds: ["A05-0001"], chest: ["A05-0003"], gems: ["A05-0004"] });
    expect(plan.currentVip).toBe(0);
    expect(plan.pointsNeeded).toBe(1200);
    expect(plan.gemsIfAllNow.value).toBe(1200);
    expect(plan.daysChestOnly.value).toBe(10);
    expect(plan.daysWithGems.value).toBeLessThan(plan.daysChestOnly.value!);
    expect(plan.daysWithGems.facts).toEqual(["A05-0001", "A05-0003", "A05-0004"]);
    expect(plan.daysWithGems.pending).toEqual(["gems per day"]);
  });
});
