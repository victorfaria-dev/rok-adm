// Shared pieces of the council kit (wave E): document base shape, text and number helpers.
// Every council document is a plain JSON object with an id and updatedAt so a later backend
// (wave F) can sync it as-is. No module here imports fact data (see NOTES.md, bundle rule).

export interface KingdomDocBase {
  id: string;
  /** ISO time of the last edit. */
  updatedAt: string;
}

export const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/** Trimmed text cut to `max` chars, or "" for non-strings. Line breaks are kept, CR removed. */
export function cleanText(x: unknown, max: number): string {
  if (typeof x !== "string") return "";
  return x.replace(/\r\n?/g, "\n").trim().slice(0, max);
}

/** One-line text: whitespace runs (including line breaks) become one space. */
export function cleanLine(x: unknown, max: number): string {
  if (typeof x !== "string") return "";
  return x.replace(/\s+/g, " ").trim().slice(0, max);
}

export const isIsoTime = (x: unknown): x is string => typeof x === "string" && x.length > 0 && Number.isFinite(Date.parse(x));

const SUFFIX: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };

/**
 * Parse a game quantity typed by a person: "1,500,000", "1 500 000", "1.5m", "300k", "2.4B", "1500000".
 * Returns null for anything else (negative, fractions without a suffix, badly grouped commas, NaN).
 */
export function parseQuantity(text: string): number | null {
  const s = text.trim().toLowerCase().replace(/[\s_]/g, "");
  if (!s) return null;
  const m = /^(\d+(?:\.\d+)?)([kmb])$/.exec(s);
  if (m) {
    const v = Math.round(Number(m[1]) * SUFFIX[m[2]!]!);
    return Number.isSafeInteger(v) ? v : null;
  }
  if (/^\d{1,3}(,\d{3})+$/.test(s)) {
    const v = Number(s.replace(/,/g, ""));
    return Number.isSafeInteger(v) ? v : null;
  }
  if (/^\d+$/.test(s)) {
    const v = Number(s);
    return Number.isSafeInteger(v) ? v : null;
  }
  return null;
}

/** "12,345,678" (en-US grouping, rounded to an integer). */
export function formatInt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("en-US");
}

/** "10.5M", "300K", "2.35B" — short form for cards and posts. */
export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  const fmt = (v: number, suf: string): string => `${Number(v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2))}${suf}`;
  if (a >= 1e9) return (n < 0 ? "-" : "") + fmt(a / 1e9, "B");
  if (a >= 1e6) return (n < 0 ? "-" : "") + fmt(a / 1e6, "M");
  if (a >= 1e3) return (n < 0 ? "-" : "") + fmt(a / 1e3, "K");
  return String(Math.round(n));
}

export function newDocId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    // fall through
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
