import { describe, expect, it } from "vitest";
import { FARM_DAILY_TASKS, farmDailyTasks, dailyState, toggleDaily, nextFarmToVisit, goalProgress } from "../src/farms-daily";

describe("FARM_DAILY_TASKS", () => {
  it("cites cards, has no measured minutes and computed confidence", () => {
    expect(FARM_DAILY_TASKS.length).toBeGreaterThanOrEqual(5);
    for (const t of FARM_DAILY_TASKS) {
      expect(t.minutes).toBeNull();
      expect(t.facts.length).toBeGreaterThan(0);
      expect(t.gaps).toContain("L-A13-01");
      expect(["high", "medium", "low"]).toContain(t.confidence);
      expect(t.hypothesis).toBe(false);
    }
    const byId = Object.fromEntries(FARM_DAILY_TASKS.map((t) => [t.id, t]));
    expect(byId["gather-territory"]!.confidence).toBe("high"); // A03-0009 alta
    expect(byId["enhanced-gathering"]!.optional).toBe(true);
    expect(byId["dispatch-big-nodes"]!.optional).toBe(false);
    expect(byId["dispatch-big-nodes"]!.facts).toContain("A03-0016");
    expect(byId["ship-surplus"]!.facts).toEqual(expect.arrayContaining(["A03-0030", "A13-0005"]));
  });

  it("follows a custom fact index", () => {
    expect(farmDailyTasks({ facts: [] }).every((t) => t.confidence === "pending")).toBe(true);
  });
});

describe("dailyState / toggleDaily", () => {
  it("keeps marks on the same day and resets when the date changes", () => {
    expect(dailyState({ date: "2026-10-13", done: ["a", "b"] }, "2026-10-13")).toEqual({ date: "2026-10-13", done: ["a", "b"] });
    expect(dailyState({ date: "2026-10-12", done: ["a"] }, "2026-10-13")).toEqual({ date: "2026-10-13", done: [] });
    expect(dailyState(null, "2026-10-13")).toEqual({ date: "2026-10-13", done: [] });
  });

  it("dedupes and does not share the input array", () => {
    const marks = { date: "2026-10-13", done: ["a", "a"] };
    const s = dailyState(marks, "2026-10-13");
    expect(s.done).toEqual(["a"]);
    s.done.push("x");
    expect(marks.done).toEqual(["a", "a"]);
  });

  it("toggles on and off; a toggle on a new day starts fresh", () => {
    let m = toggleDaily(null, "2026-10-13", "a");
    expect(m.done).toEqual(["a"]);
    m = toggleDaily(m, "2026-10-13", "b");
    expect(m.done).toEqual(["a", "b"]);
    m = toggleDaily(m, "2026-10-13", "a");
    expect(m.done).toEqual(["b"]);
    expect(toggleDaily(m, "2026-10-14", "c")).toEqual({ date: "2026-10-14", done: ["c"] });
  });
});

describe("nextFarmToVisit", () => {
  const now = new Date("2026-10-13T12:00:00Z");

  it("idle first (no time, past, invalid), then gathering by soonest return", () => {
    const list = nextFarmToVisit([
      { id: "late", gatheringUntil: "2026-10-13T15:00:00Z" },
      { id: "none", gatheringUntil: null },
      { id: "soon", gatheringUntil: "2026-10-13T12:30:00Z" },
      { id: "past", gatheringUntil: "2026-10-13T11:00:00Z" },
      { id: "bad", gatheringUntil: "not a date" },
    ], now);
    expect(list.map((v) => v.id)).toEqual(["none", "past", "bad", "soon", "late"]);
    expect(list.map((v) => v.status)).toEqual(["idle", "idle", "idle", "gathering", "gathering"]);
    expect(list[3]!.minutesLeft).toBe(30);
    expect(list[4]!.minutesLeft).toBe(180);
    expect(list[0]!.minutesLeft).toBeNull();
    expect(list[1]!.until).toBe("2026-10-13T11:00:00.000Z");
    expect(list[2]!.until).toBeNull();
  });

  it("exactly now counts as idle; seconds round up to a whole minute", () => {
    expect(nextFarmToVisit([{ id: "a", gatheringUntil: now.toISOString() }], now)[0]!.status).toBe("idle");
    const v = nextFarmToVisit([{ id: "a", gatheringUntil: "2026-10-13T12:00:01Z" }], now)[0]!;
    expect(v.status).toBe("gathering");
    expect(v.minutesLeft).toBe(1);
  });

  it("ties keep input order; empty list is empty; invalid now throws", () => {
    const t = "2026-10-13T13:00:00Z";
    expect(nextFarmToVisit([{ id: "x", gatheringUntil: t }, { id: "y", gatheringUntil: t }], now).map((v) => v.id)).toEqual(["x", "y"]);
    expect(nextFarmToVisit([], now)).toEqual([]);
    expect(() => nextFarmToVisit([], new Date("nope"))).toThrow(RangeError);
  });

  it("understands ISO times with offsets", () => {
    const v = nextFarmToVisit([{ id: "a", gatheringUntil: "2026-10-13T10:40:00-03:00" }], now)[0]!;
    expect(v.minutesLeft).toBe(100); // 10:40 at UTC-3 = 13:40Z

  });
});

describe("goalProgress", () => {
  it("null target gives null", () => {
    expect(goalProgress(null, 100)).toBeNull();
  });

  it("partial, exact, over", () => {
    expect(goalProgress({ resource: "food", amount: 1000 }, 250)).toEqual({ resource: "food", target: 1000, shipped: 250, remaining: 750, ratio: 0.25, done: false });
    expect(goalProgress({ resource: "food", amount: 1000 }, 1000)?.done).toBe(true);
    const over = goalProgress({ resource: "wood", amount: 1000 }, 5000)!;
    expect(over.ratio).toBe(1);
    expect(over.remaining).toBe(0);
  });

  it("zero target is done", () => {
    expect(goalProgress({ resource: "stone", amount: 0 }, 0)).toMatchObject({ ratio: 1, done: true });
  });

  it("validates", () => {
    expect(() => goalProgress({ resource: "food", amount: -1 }, 0)).toThrow(RangeError);
    expect(() => goalProgress({ resource: "food", amount: Number.NaN }, 0)).toThrow(RangeError);
    expect(() => goalProgress({ resource: "food", amount: 10 }, -1)).toThrow(RangeError);
    expect(() => goalProgress({ resource: "gems" as never, amount: 10 }, 0)).toThrow(RangeError);
  });
});
