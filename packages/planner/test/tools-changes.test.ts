import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  allPatches, compareVersion, formatMonth, formatPatchDate, groupBySource, monthsBetween, parseYmd, patchesSince, relativeToStop, type PatchRow,
} from "../src/tools";

const P = (version: string, date: string | null, confidence: PatchRow["confidence"] = "alta"): PatchRow => ({ version, date, confidence, summary: version, factIds: [] });
const rows = [P("1.0.81", "2024-04"), P("1.0.83", "2024-06"), P("1.0.90", "2025-01-07"), P("1.0.92", "2025-03-11"), P("1.1.10", "2026-07-30", "baixa"), P("1.0.78", "2024-01", "media")];

describe("parseYmd", () => {
  it("reads months and days, rejects the rest", () => {
    expect(parseYmd("2024-05")).toEqual({ y: 2024, m: 5, d: null });
    expect(parseYmd("2025-01-07")).toEqual({ y: 2025, m: 1, d: 7 });
    expect(parseYmd("2024-13")).toBeNull();
    expect(parseYmd("May 2024")).toBeNull();
    expect(parseYmd(null)).toBeNull();
  });
});

describe("compareVersion", () => {
  it("compares numerically", () => {
    expect(compareVersion("1.1.00", "1.0.99")).toBeGreaterThan(0);
    expect(compareVersion("1.0.9", "1.0.10")).toBeLessThan(0);
    expect(compareVersion("1.1.03", "1.1.03")).toBe(0);
  });
});

describe("relativeToStop", () => {
  it("full dates", () => {
    expect(relativeToStop("2025-03-11", "2025-03-10")).toBe("after");
    expect(relativeToStop("2025-03-11", "2025-03-12")).toBe("before");
    expect(relativeToStop("2025-03-11", "2025-03-11")).toBe("same");
  });
  it("partial patch date in the stop month is 'same' (shown, flagged)", () => {
    expect(relativeToStop("2024-05", "2024-05-20")).toBe("same");
    expect(relativeToStop("2024-05", "2024-05")).toBe("same");
    expect(relativeToStop("2024-05", "2024-04-30")).toBe("after");
    expect(relativeToStop("2024-05", "2024-06-01")).toBe("before");
  });
  it("partial stop month against a full patch date", () => {
    expect(relativeToStop("2025-03-11", "2025-03")).toBe("same");
    expect(relativeToStop("2025-03-11", "2025-02")).toBe("after");
    expect(relativeToStop("2025-03-11", "2025-04")).toBe("before");
  });
  it("unknown patch date can't be ruled out", () => {
    expect(relativeToStop(null, "2025-01")).toBe("same");
  });
  it("throws on a bad stop date", () => {
    expect(() => relativeToStop("2025-01", "soon")).toThrow(RangeError);
  });
});

describe("patchesSince", () => {
  it("lists later patches newest first, same-month ones flagged", () => {
    const r = patchesSince(rows, "2024-06");
    expect(r.map((x) => x.patch.version)).toEqual(["1.1.10", "1.0.92", "1.0.90", "1.0.83"]);
    expect(r.find((x) => x.patch.version === "1.0.83")!.sameMonth).toBe(true);
    expect(r.find((x) => x.patch.version === "1.0.90")!.sameMonth).toBe(false);
  });
  it("a stop day after a full-dated patch in the same month drops it", () => {
    expect(patchesSince(rows, "2025-03-12").map((x) => x.patch.version)).toEqual(["1.1.10"]);
  });
  it("a stop before everything lists everything; after everything lists nothing", () => {
    expect(patchesSince(rows, "2020-01")).toHaveLength(rows.length);
    expect(patchesSince(rows, "2030-01")).toEqual([]);
  });
});

describe("allPatches and groupBySource", () => {
  it("sorts newest first and splits official from reported", () => {
    const all = allPatches(rows);
    expect(all[0]!.patch.version).toBe("1.1.10");
    const g = groupBySource(all);
    expect(g.official.map((x) => x.patch.version)).toEqual(["1.0.92", "1.0.90", "1.0.83", "1.0.81"]);
    expect(g.reported.map((x) => x.patch.version)).toEqual(["1.1.10", "1.0.78"]);
  });
});

describe("formatting", () => {
  it("formats dates and months", () => {
    expect(formatPatchDate("2025-01-07")).toBe("7 jan 2025");
    expect(formatPatchDate("2023-03")).toBe("mar 2023");
    expect(formatPatchDate(null)).toBe("Data desconhecida");
    expect(formatMonth("2024-05")).toBe("maio de 2024");
  });
  it("lists months newest first, inclusive", () => {
    expect(monthsBetween("2024-11", "2025-02")).toEqual(["2025-02", "2025-01", "2024-12", "2024-11"]);
    expect(monthsBetween("bad", "2025-02")).toEqual([]);
  });
});

describe("with the real patches.json", () => {
  const real = JSON.parse(readFileSync(resolve(__dirname, "../../data/generated/patches.json"), "utf8")) as PatchRow[];
  it("every patch has a parseable date, so the picker never hides an undated one", () => {
    expect(real.every((p) => parseYmd(p.date) !== null)).toBe(true);
  });
  it("stopping in May 2025 shows 1.0.94 (13 May) flagged and everything newer", () => {
    const r = patchesSince(real, "2025-05");
    expect(r.at(-1)!.patch.version).toBe("1.0.94");
    expect(r.at(-1)!.sameMonth).toBe(true);
    expect(r.every((x) => compareVersion(x.patch.version, "1.0.94") >= 0)).toBe(true);
  });
});
