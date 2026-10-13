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

export type QuantityError = "empty" | "negative" | "format" | "fraction" | "too_large";
export type QuantityResult = { ok: true; value: number } | { ok: false; error: QuantityError };

export interface QuantityOptions {
  /** Largest value accepted (default: largest safe integer). */
  max?: number;
  /** Accept a result with decimals ("12.5"); default false = whole numbers only. */
  decimals?: boolean;
}

/**
 * The one number parser for what players type (Q2 P2-3: farms log, tools, council inputs):
 * "1500000", "1,500,000", "1 500 000", "1.5m", "300k", "2.4B", ".5m". Commas must be en-US thousands
 * groups. No negatives, no scientific notation ("1e6"), no NaN. Spaces and "_" are ignored.
 */
export function readQuantity(text: string, opts: QuantityOptions = {}): QuantityResult {
  const s = text.trim().toLowerCase().replace(/[\s_]/g, "");
  if (!s) return { ok: false, error: "empty" };
  if (/^-/.test(s)) return { ok: false, error: "negative" };
  const m = /^(\d{1,3}(?:,\d{3})+|\d*)(?:\.(\d+))?([kmb])?$/.exec(s);
  if (!m || (m[1] === "" && m[2] === undefined)) return { ok: false, error: "format" };
  const base = Number(`${m[1]!.replace(/,/g, "") || "0"}.${m[2] ?? "0"}`);
  const value = base * (m[3] ? SUFFIX[m[3]]! : 1);
  if (!Number.isFinite(value)) return { ok: false, error: "too_large" };
  const max = opts.max ?? Number.MAX_SAFE_INTEGER;
  if (opts.decimals) {
    const v = Math.round(value * 1e6) / 1e6;
    return v > max ? { ok: false, error: "too_large" } : { ok: true, value: v };
  }
  // Float-safe: 1.1m must give 1,100,000, not 1,100,000.0000000002.
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) > 1e-6 * Math.max(1, Math.abs(value))) return { ok: false, error: "fraction" };
  if (rounded > max || !Number.isSafeInteger(rounded)) return { ok: false, error: "too_large" };
  return { ok: true, value: rounded };
}

/** Plain-language fix for each QuantityError (UI copy). */
export const QUANTITY_ERROR_TEXT: Readonly<Record<QuantityError, string>> = {
  empty: "Enter a number.",
  negative: "Enter 0 or more.",
  format: "Enter a number like 1,500,000, 1.5m or 300k.",
  fraction: "Use a whole number.",
  too_large: "That number is too large.",
};

/**
 * Parse a game quantity typed by a person (see readQuantity): whole number, or null for anything
 * else (empty, negative, fractions, badly grouped commas, scientific notation, NaN).
 */
export function parseQuantity(text: string): number | null {
  const r = readQuantity(text);
  return r.ok ? r.value : null;
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
