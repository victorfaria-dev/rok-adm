// UI helpers for the Farm hub islands (/farms/ and /farms/log/): local dates, form parsing,
// labels and file download. Only types come from @rokadm/planner.
import { readQuantity, type FarmFocus, type Resource } from "@rokadm/planner";
import { FARM_LEVEL_RANGES, FARM_NAME_MAX, FARM_NOTE_MAX, type FarmLevelField, type FarmLevelsState } from "./farms-store";

export const FOCUS_LABEL: Record<FarmFocus, string> = {
  general: "General (all resources)",
  food: "Food",
  wood: "Wood",
  stone: "Stone",
  gold: "Gold",
};

export const RESOURCE_LABEL: Record<Resource, string> = { food: "Food", wood: "Wood", stone: "Stone", gold: "Gold" };

export const LEVEL_LABEL: Record<FarmLevelField, string> = {
  cityHall: "City Hall",
  tradingPost: "Trading Post",
  goldmine: "Goldmine",
  academy: "Academy",
  commanderLevel: "Gathering commander level",
};

export const LEVEL_FIELDS: readonly FarmLevelField[] = ["cityHall", "tradingPost", "goldmine", "academy", "commanderLevel"];

const pad = (n: number): string => String(n).padStart(2, "0");

/** YYYY-MM-DD of `d` in the user's local time zone. */
export function localDay(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** YYYY-MM-DD plus `n` days (calendar math, no time zone). */
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "12 Oct" for a YYYY-MM-DD day. */
export function shortDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** "Mon, Oct 12, 2026" for a YYYY-MM-DD day. */
export function longDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function fmtNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** "45 min", "1 h", "1 h 20 min". */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

/** Local clock time ("14:05" style, user's locale), with "tomorrow" when it is not today. */
export function formatLocalTime(iso: string, now: Date): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const day = localDay(d);
  const today = localDay(now);
  if (day === today) return time;
  if (day === addDays(today, 1)) return `tomorrow ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${time}`;
}

/** ISO time `hours` from `now`. */
export function untilInHours(now: Date, hours: number): string {
  return new Date(now.getTime() + hours * 3_600_000).toISOString();
}

/** ISO time of the next local "HH:MM" after `now` (today, or tomorrow if that time has passed). null when malformed. */
export function untilAtLocalTime(now: Date, hhmm: string): string | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

/** "HH:MM" local for an ISO time (value for <input type="time">), "" when null. */
export function timeInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "City Hall 12 · Trading Post 5", or "" when no level is saved. */
export function levelsSummary(levels: FarmLevelsState): string {
  return LEVEL_FIELDS.filter((f) => levels[f] !== null)
    .map((f) => `${f === "commanderLevel" ? "Commander" : LEVEL_LABEL[f]} ${levels[f]}`)
    .join(" · ");
}

// ---------------------------------------------------------------------------
// Form parsing

/** Whole number >= 0, commas/spaces allowed ("1,200,000"). null when empty; NaN when not a number. */
export function parseWhole(raw: string): number | null {
  const s = raw.replace(/[\s,_]/g, "");
  if (s === "") return null;
  if (!/^\d+$/.test(s)) return Number.NaN;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : Number.NaN;
}

/**
 * A resource amount as players type it ("500000", "500,000", "500k", "1.5m"): the shared parser
 * (readQuantity) used by the tools and council inputs too. null = empty, NaN = not a valid amount.
 */
export function parseResourceAmount(raw: string): number | null {
  const r = readQuantity(raw);
  return r.ok ? r.value : r.error === "empty" ? null : Number.NaN;
}

export type LevelParse = { ok: true; value: number | null } | { ok: false; error: string };

export function parseLevel(field: FarmLevelField, raw: string): LevelParse {
  const [min, max] = FARM_LEVEL_RANGES[field];
  const n = parseWhole(raw);
  if (n === null) return { ok: true, value: null };
  if (Number.isNaN(n) || n < min || n > max) return { ok: false, error: `${LEVEL_LABEL[field]}: enter a whole number from ${min} to ${max}, or leave it empty.` };
  return { ok: true, value: n };
}

export interface FarmFormValues {
  name: string;
  role: FarmFocus;
  note: string;
  levels: Record<FarmLevelField, string>;
}

export type FarmFormErrors = Partial<Record<"name" | "note" | FarmLevelField, string>>;

export interface FarmFormResult {
  errors: FarmFormErrors;
  value: { name: string; role: FarmFocus; note: string; levels: FarmLevelsState } | null;
}

export function validateFarmForm(v: FarmFormValues): FarmFormResult {
  const errors: FarmFormErrors = {};
  const name = v.name.trim();
  if (name.length === 0) errors.name = "Give the farm a name.";
  else if (name.length > FARM_NAME_MAX) errors.name = `Use at most ${FARM_NAME_MAX} characters (now ${name.length}).`;
  const note = v.note.trim();
  if (note.length > FARM_NOTE_MAX) errors.note = `Use at most ${FARM_NOTE_MAX} characters (now ${note.length}).`;
  const levels = {} as FarmLevelsState;
  for (const f of LEVEL_FIELDS) {
    const p = parseLevel(f, v.levels[f]);
    if (p.ok) levels[f] = p.value;
    else {
      errors[f] = p.error;
      levels[f] = null;
    }
  }
  return { errors, value: Object.keys(errors).length === 0 ? { name, role: v.role, note, levels } : null };
}

export type TaxParse = { ok: true; rate: number } | { ok: false; error: string };

/** Percent text ("21", "21.5", "21%") → rate 0..<1. */
export function parseTaxPercent(raw: string): TaxParse {
  const s = raw.trim().replace(/%$/, "").trim().replace(",", ".");
  const error = "Enter the tax as a percent from 0 to 99, e.g. 21.";
  if (s === "" || !/^\d+(\.\d+)?$/.test(s)) return { ok: false, error };
  const n = Number(s);
  if (!(n >= 0 && n < 100)) return { ok: false, error };
  return { ok: true, rate: Math.round(n * 1000) / 100000 };
}

/** 0.21 → "21". */
export function taxPercentText(rate: number): string {
  return String(Math.round(rate * 100000) / 1000);
}

// ---------------------------------------------------------------------------
// Browser helpers

/** true when localStorage can be written (false in some private modes or with blocked site data). */
export function storageWorks(): boolean {
  try {
    const k = "ko:farms:probe";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** In-memory stand-in for localStorage when the browser blocks it (data lasts for this page only). */
export function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
  };
}

/** localStorage when it works (st undefined = the store's default), else an in-memory store and blocked = true. */
export function farmsStorage(): { st: StorageLike | undefined; blocked: boolean } {
  return storageWorks() ? { st: undefined, blocked: false } : { st: memoryStorage(), blocked: true };
}

/** Save text as a file (Blob + a[download]). No network. */
export function downloadText(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
