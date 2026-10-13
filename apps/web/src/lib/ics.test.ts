import { describe, expect, it } from "vitest";
import { buildRoutineIcs, escapeText, eventMinutes, foldLine, makeUid, parseTime, utcStamp, type RoutineIcsInput } from "./ics";

const octets = (s: string): number => new TextEncoder().encode(s).length;
/** Undo folding: CRLF followed by one space joins lines. */
const unfold = (s: string): string => s.replace(/\r\n /g, "");

const NOW = new Date(Date.UTC(2026, 9, 13, 18, 5, 9));
const BASE: RoutineIcsInput = {
  tasks: [
    { title: "Claim VIP points + VIP daily chest", minutes: 1, isEstimate: true },
    { title: "Refill queues: both builders, research; training", minutes: 3, isEstimate: false },
  ],
  totalMinutes: 4,
  time: "20:00",
  now: NOW,
  uid: "test-uid@kingdomops.local",
};

describe("escapeText", () => {
  it("escapes backslash, semicolon, comma and every kind of newline", () => {
    expect(escapeText("a\\b;c,d")).toBe("a\\\\b\\;c\\,d");
    expect(escapeText("1\n2\r\n3\r4")).toBe("1\\n2\\n3\\n4");
    expect(escapeText("plain: text")).toBe("plain: text");
  });
});

describe("foldLine", () => {
  it("keeps short lines as they are", () => {
    expect(foldLine("A".repeat(75))).toBe("A".repeat(75));
  });
  it("folds at 75 octets with CRLF + space, and unfolds back", () => {
    const line = "DESCRIPTION:" + "x".repeat(200);
    const folded = foldLine(line);
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) expect(octets(p)).toBeLessThanOrEqual(75);
    expect(octets(parts[0]!)).toBe(75);
    for (const p of parts.slice(1)) expect(p.startsWith(" ")).toBe(true);
    expect(unfold(folded)).toBe(line);
  });
  it("counts UTF-8 octets and never splits a character", () => {
    const line = "SUMMARY:" + "é".repeat(60) + "🏰".repeat(10);
    const folded = foldLine(line);
    for (const p of folded.split("\r\n")) {
      expect(octets(p)).toBeLessThanOrEqual(75);
      expect(p).not.toContain("�");
    }
    expect(unfold(folded)).toBe(line);
    // 2-byte chars: the first line cannot reach 75 octets after the 8-byte prefix (8 + 33*2 = 74).
    expect(octets(folded.split("\r\n")[0]!)).toBe(74);
  });
});

describe("helpers", () => {
  it("utcStamp is UTC with a Z", () => {
    expect(utcStamp(NOW)).toBe("20261013T180509Z");
  });
  it("parseTime accepts HH:MM and falls back to 20:00", () => {
    expect(parseTime("07:30")).toEqual({ h: 7, m: 30 });
    expect(parseTime("24:00")).toEqual({ h: 20, m: 0 });
    expect(parseTime("nope")).toEqual({ h: 20, m: 0 });
  });
  it("eventMinutes rounds up with a 5-minute floor", () => {
    expect(eventMinutes(0)).toBe(5);
    expect(eventMinutes(4.5)).toBe(5);
    expect(eventMinutes(12.5)).toBe(13);
    expect(eventMinutes(Number.NaN)).toBe(5);
  });
  it("makeUid is deterministic with an injected random", () => {
    expect(makeUid(NOW, () => 0.5)).toBe(makeUid(NOW, () => 0.5));
    expect(makeUid(NOW, () => 0.5)).toMatch(/@kingdomops\.local$/);
  });
});

describe("buildRoutineIcs", () => {
  const ics = buildRoutineIcs(BASE);
  const lines = unfold(ics).split("\r\n");

  it("uses CRLF everywhere and ends with CRLF", () => {
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("has the required calendar and event properties", () => {
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("VERSION:2.0");
    expect(lines.some((l) => l.startsWith("PRODID:"))).toBe(true);
    expect(lines).toContain("BEGIN:VEVENT");
    expect(lines).toContain("UID:test-uid@kingdomops.local");
    expect(lines).toContain("DTSTAMP:20261013T180509Z");
    expect(lines).toContain("RRULE:FREQ=DAILY");
    expect(lines).toContain("END:VEVENT");
    expect(lines.filter((l) => l !== "")).toContain("END:VCALENDAR");
    expect(lines.filter((l) => l.startsWith("BEGIN:VEVENT"))).toHaveLength(1);
  });

  it("starts at the chosen floating local time on the local day", () => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const day = `${NOW.getFullYear()}${pad(NOW.getMonth() + 1)}${pad(NOW.getDate())}`;
    expect(lines).toContain(`DTSTART:${day}T200000`);
    expect(lines.find((l) => l.startsWith("DTSTART"))).not.toMatch(/Z$|TZID/);
    expect(buildRoutineIcs({ ...BASE, time: "07:05" })).toContain(`DTSTART:${day}T070500`);
  });

  it("titles and sizes the event from the plan (at least 5 min)", () => {
    expect(lines).toContain("SUMMARY:KingdomOps routine (4 min)");
    expect(lines).toContain("DURATION:PT5M");
    const long = unfold(buildRoutineIcs({ ...BASE, totalMinutes: 27.5 }));
    expect(long).toContain("SUMMARY:KingdomOps routine (27.5 min)");
    expect(long).toContain("DURATION:PT28M");
  });

  it("lists the tasks with estimates marked, escaped", () => {
    const desc = lines.find((l) => l.startsWith("DESCRIPTION:Today"))!;
    expect(desc).toContain("- Claim VIP points + VIP daily chest (~1 min\\, pending measurement)");
    expect(desc).toContain("- Refill queues: both builders\\, research\\; training (3 min)");
    expect(desc).toContain("\\n");
    expect(desc).toContain("pending measurement are estimates");
  });

  it("folds every line to 75 octets", () => {
    for (const l of ics.split("\r\n")) expect(octets(l)).toBeLessThanOrEqual(75);
  });

  it("is deterministic for the same now and uid", () => {
    expect(buildRoutineIcs(BASE)).toBe(ics);
    expect(buildRoutineIcs({ ...BASE, uid: "other" })).not.toBe(ics);
  });
});
