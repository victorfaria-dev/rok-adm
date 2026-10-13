import { describe, expect, it } from "vitest";
import { countDone, doneToday, localDateKey, localWeekday, setDone } from "./routine-day";

// Local-time constructors: the tests hold in any time zone.
const at = (y: number, m: number, d: number, h = 12, min = 0): Date => new Date(y, m - 1, d, h, min);

describe("localDateKey", () => {
  it("uses the local calendar day, zero-padded", () => {
    expect(localDateKey(at(2026, 1, 5))).toBe("2026-01-05");
    expect(localDateKey(at(2026, 12, 31, 23, 59))).toBe("2026-12-31");
    expect(localDateKey(at(2027, 1, 1, 0, 0))).toBe("2027-01-01");
  });
});

describe("localWeekday", () => {
  it("is 0 on Sunday and 1 on Monday (local)", () => {
    expect(localWeekday(at(2026, 10, 11))).toBe(0);
    expect(localWeekday(at(2026, 10, 12, 0, 1))).toBe(1);
  });
});

describe("doneToday", () => {
  it("returns today's marks", () => {
    expect(doneToday({ date: "2026-10-13", done: ["a", "b"] }, at(2026, 10, 13, 23, 59))).toEqual(["a", "b"]);
  });
  it("starts empty on a new day and without saved state", () => {
    expect(doneToday({ date: "2026-10-12", done: ["a"] }, at(2026, 10, 13, 0, 0))).toEqual([]);
    expect(doneToday(null, at(2026, 10, 13))).toEqual([]);
  });
  it("does not share the stored array", () => {
    const s = { date: "2026-10-13", done: ["a"] };
    doneToday(s, at(2026, 10, 13)).push("x");
    expect(s.done).toEqual(["a"]);
  });
});

describe("setDone", () => {
  const now = at(2026, 10, 13);
  it("checks and unchecks without duplicates", () => {
    let s = setDone(null, "a", true, now);
    expect(s).toEqual({ date: "2026-10-13", done: ["a"] });
    s = setDone(s, "a", true, now);
    expect(s.done).toEqual(["a"]);
    s = setDone(s, "b", true, now);
    expect(s.done).toEqual(["a", "b"]);
    s = setDone(s, "a", false, now);
    expect(s.done).toEqual(["b"]);
  });
  it("drops yesterday's marks when checking today", () => {
    expect(setDone({ date: "2026-10-12", done: ["a", "b"] }, "c", true, now)).toEqual({ date: "2026-10-13", done: ["c"] });
  });
});

describe("countDone", () => {
  it("counts only shown tasks", () => {
    expect(countDone(["a", "b", "c"], ["b", "zzz", "c"])).toBe(2);
    expect(countDone([], ["a"])).toBe(0);
  });
});
