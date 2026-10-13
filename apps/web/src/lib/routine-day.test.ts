import { describe, expect, it } from "vitest";
import { countDone, doneToday, gameDateKey, gameWeekday, resetLocalTime, setDone } from "./routine-day";

// UTC constructors: the game day is the UTC day (A10-0001), so tests hold in any time zone.
const at = (y: number, m: number, d: number, h = 12, min = 0): Date => new Date(Date.UTC(y, m - 1, d, h, min));

describe("gameDateKey", () => {
  it("uses the UTC calendar day, zero-padded", () => {
    expect(gameDateKey(at(2026, 1, 5))).toBe("2026-01-05");
    expect(gameDateKey(at(2026, 12, 31, 23, 59))).toBe("2026-12-31");
    expect(gameDateKey(at(2027, 1, 1, 0, 0))).toBe("2027-01-01");
  });
  it("rolls over at 00:00 UTC, not local midnight", () => {
    // 21:30 on Oct 13 in Brazil (UTC-3) is already Oct 14 in the game.
    expect(gameDateKey(new Date("2026-10-13T21:30:00-03:00"))).toBe("2026-10-14");
  });
});

describe("gameWeekday", () => {
  it("is 0 on Sunday and 1 on Monday (UTC)", () => {
    expect(gameWeekday(at(2026, 10, 11))).toBe(0);
    expect(gameWeekday(at(2026, 10, 12, 0, 1))).toBe(1);
  });
});

describe("resetLocalTime", () => {
  it("formats the next 00:00 UTC in local time", () => {
    const now = at(2026, 10, 13, 15);
    const reset = new Date(Date.UTC(2026, 9, 14));
    const expected = `${String(reset.getHours()).padStart(2, "0")}:${String(reset.getMinutes()).padStart(2, "0")}`;
    expect(resetLocalTime(now)).toBe(expected);
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
