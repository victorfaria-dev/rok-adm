import { describe, expect, it } from "vitest";
import { buffedSeconds, formatDuration, parseDuration, mergeCites, weakest, nonNeg } from "../src/tools";

describe("formatDuration", () => {
  it("formats zero, seconds, minutes, days", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(90)).toBe("1m 30s");
    expect(formatDuration(3 * 86400 + 4 * 3600 + 5 * 60)).toBe("3d 4h 5m");
    expect(formatDuration(86400 + 7)).toBe("1d");
  });
  it("treats negative and non-finite as zero", () => {
    expect(formatDuration(-5)).toBe("0m");
    expect(formatDuration(Number.NaN)).toBe("0m");
  });
});

describe("parseDuration", () => {
  it("parses table time strings", () => {
    expect(parseDuration("1m 30s")).toBe(90);
    expect(parseDuration("2d23h")).toBe(2 * 86400 + 23 * 3600);
    expect(parseDuration("6s")).toBe(6);
  });
  it("rejects non-durations", () => {
    expect(parseDuration("None")).toBeNull();
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("5 apples")).toBeNull();
  });
});

describe("buffedSeconds", () => {
  it("divides by 1 + bonus", () => {
    expect(buffedSeconds(200, 100)).toBe(100);
    expect(buffedSeconds(100, 0)).toBe(100);
  });
  it("ignores impossible bonuses", () => {
    expect(buffedSeconds(100, -100)).toBe(100);
    expect(buffedSeconds(100, Number.NaN)).toBe(100);
  });
});

describe("cites", () => {
  it("merges ids and keeps the weakest confidence", () => {
    expect(mergeCites({ facts: ["B"], confidence: "high" }, { facts: ["A", "B"], confidence: "low" })).toEqual({
      facts: ["A", "B"], confidence: "low", stale: false,
    });
    expect(weakest()).toBe("pending");
    expect(nonNeg(-1, 3)).toBe(3);
    expect(nonNeg("2")).toBe(0);
  });
});
