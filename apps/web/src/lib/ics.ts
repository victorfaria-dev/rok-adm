// F-86 v0: an on-device iCalendar file (RFC 5545) with one daily recurring routine event.
// Pure: callers inject `now` and `uid`, so the same input always gives the same file.
// The file is built in the browser and downloaded; nothing is sent anywhere.

export interface IcsTask {
  title: string;
  minutes: number;
  /** true while the minutes are an estimate waiting for in-game measurement. */
  isEstimate: boolean;
}

export interface RoutineIcsInput {
  tasks: readonly IcsTask[];
  /** Planned total minutes (event duration is this, rounded up, at least 5). */
  totalMinutes: number;
  /** Local start time "HH:MM" (24 h). */
  time: string;
  /** Clock used for DTSTAMP (UTC) and for the first day (local). */
  now: Date;
  uid: string;
}

export const ICS_FILENAME = "kingdomops-routine.ics";
export const ICS_MIN_DURATION = 5;
const CRLF = "\r\n";
const MAX_OCTETS = 75;

const pad = (n: number, w = 2): string => String(n).padStart(w, "0");
const utf8Len = (s: string): number => new TextEncoder().encode(s).length;

/** RFC 5545 §3.3.11 TEXT escaping: backslash, semicolon, comma and line breaks. */
export function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * RFC 5545 §3.1 folding: lines longer than 75 octets continue on the next line after CRLF + one space.
 * Counts UTF-8 octets and never splits a character.
 */
export function foldLine(line: string): string {
  if (utf8Len(line) <= MAX_OCTETS) return line;
  const out: string[] = [];
  let cur = "";
  let octets = 0;
  let limit = MAX_OCTETS;
  for (const ch of line) {
    const n = utf8Len(ch);
    if (octets + n > limit) {
      out.push(cur);
      cur = "";
      octets = 0;
      limit = MAX_OCTETS - 1; // the leading space takes one octet
    }
    cur += ch;
    octets += n;
  }
  out.push(cur);
  return out.join(CRLF + " ");
}

/** UTC timestamp, e.g. 20261013T201500Z. */
export function utcStamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** Parse "HH:MM" (24 h); falls back to 20:00 when malformed. */
export function parseTime(time: string): { h: number; m: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (m) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h <= 23 && min <= 59) return { h, m: min };
  }
  return { h: 20, m: 0 };
}

const fmtMinutes = (n: number): string => String(Math.round(n * 10) / 10);

/** Duration in whole minutes: planned total rounded up, at least 5. */
export function eventMinutes(totalMinutes: number): number {
  const n = Number.isFinite(totalMinutes) ? Math.ceil(totalMinutes) : 0;
  return Math.max(ICS_MIN_DURATION, n);
}

export function routineDescription(tasks: readonly IcsTask[]): string {
  const lines = tasks.map((t) => `- ${t.title} (${t.isEstimate ? `~${fmtMinutes(t.minutes)} min, pending measurement` : `${fmtMinutes(t.minutes)} min`})`);
  const parts = [tasks.length ? `Today's routine:\n${lines.join("\n")}` : "No tasks planned."];
  if (tasks.some((t) => t.isEstimate)) parts.push("Times marked pending measurement are estimates, not measured in game yet.");
  parts.push("Made on your device by KingdomOps. Delete this event any time.");
  return parts.join("\n\n");
}

/** VCALENDAR with one VEVENT repeating daily at a floating local time (no time zone). */
export function buildRoutineIcs(input: RoutineIcsInput): string {
  const { h, m } = parseTime(input.time);
  const n = input.now;
  const start = `${n.getFullYear()}${pad(n.getMonth() + 1)}${pad(n.getDate())}T${pad(h)}${pad(m)}00`;
  const summary = `KingdomOps routine (${fmtMinutes(Math.max(0, input.totalMinutes))} min)`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KingdomOps//Routine v0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${utcStamp(n)}`,
    `DTSTART:${start}`,
    `DURATION:PT${eventMinutes(input.totalMinutes)}M`,
    "RRULE:FREQ=DAILY",
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(routineDescription(input.tasks))}`,
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(summary)}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join(CRLF) + CRLF;
}

/** A UID that is unique enough for a file made on one device. */
export function makeUid(now: Date, random: () => number = Math.random): string {
  const rand = Math.floor(random() * 2 ** 32).toString(36);
  return `routine-${now.getTime().toString(36)}-${rand}@kingdomops.local`;
}
