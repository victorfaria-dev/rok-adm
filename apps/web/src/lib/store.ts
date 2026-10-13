// Device-local state (ADR 0002): one versioned key in localStorage.
// Every read is tolerant: missing, corrupted or blocked storage falls back to defaults.
import { SPENDING_PROFILES, decodeProfile, type SpendingProfile } from "@rokadm/core";

export type ThemePref = "dark" | "light" | "system";

/** Which bottom nav the site shows (UX stage 1): a player's or a kingdom leader's. Set on /start and /me. */
export type PlayingAs = "player" | "leader";
export const PLAYING_AS: readonly PlayingAs[] = ["player", "leader"];
export const THEME_PREFS: readonly ThemePref[] = ["dark", "light", "system"];

export interface RoutineState {
  date: string;   // YYYY-MM-DD of the day the marks belong to
  done: string[]; // RoutineTask ids
}

/** Routine screen choices (wave B, F-15). */
export interface RoutinePrefs {
  /** Time budget picked on /routine; null = use the profile's minutes per day. */
  minutes: number | null;
  /** Break Mode: minimal routine for busy days. */
  breakMode: boolean;
  /** "Also plan for" toggles on /routine; missing = off. */
  includeWeekly?: boolean;
  includeEvents?: boolean;
}

/**
 * One account (main, farms, alts). The active one (StoreV1.activeAccountId) is mirrored in
 * profileCode/profileOverride/commanders/routine, so every page that reads those keeps working;
 * the other accounts keep their own copies here (lib/accounts.ts swaps them on a switch).
 */
export interface SavedProfile {
  id: string;
  name: string;
  /** encodeProfile() code. */
  code: string;
  /** F-72 hand-picked profile for this account, or null. */
  override: SpendingProfile | null;
  /** "My commanders" answers of this account while it is not the active one. */
  commanders?: CommanderAnswersMap;
  /** Today's routine ticks of this account while it is not the active one. */
  routine?: RoutineState | null;
}
export const MAX_SAVED_PROFILES = 10;

/** F-20 checklist answers per commander id: question id → option id. */
export type CommanderAnswersMap = Record<string, Record<string, string>>;

export interface StoreV1 {
  v: 1;
  /** Saved profile as an encodeProfile() code, or null when the user has none. */
  profileCode: string | null;
  /** Questionnaire answers in progress (screen 2), shape owned by the questionnaire. */
  draft: Record<string, unknown> | null;
  routine: RoutineState | null;
  theme: ThemePref;
  /** F-72: spending profile picked by hand on /me; null = computed effective profile. */
  profileOverride: SpendingProfile | null;
  routinePrefs: RoutinePrefs | null;
  commanders: CommanderAnswersMap;
  /** Accounts saved on /me to switch between; profileCode stays the active one. */
  savedProfiles: SavedProfile[];
  /** "Playing as" on /me: picks the player or the leader tabs. Missing in older saves = player. */
  playingAs: PlayingAs;
  /** The account in use (an id in savedProfiles); null = not set yet (lib/accounts.ts migrates). */
  activeAccountId: string | null;
}

export const STORE_KEY = "ko:v1";

export function defaultStore(): StoreV1 {
  return {
    v: 1, profileCode: null, draft: null, routine: null, theme: "dark",
    profileOverride: null, routinePrefs: null, commanders: {}, savedProfiles: [], playingAs: "player", activeAccountId: null,
  };
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/** Parse stored JSON; any field that is missing or malformed gets its default. */
export function parseStore(raw: string | null | undefined): StoreV1 {
  return parseStoreReport(raw).store;
}

function parseRoutine(r: unknown): RoutineState | null {
  if (isRecord(r) && typeof r.date === "string" && Array.isArray(r.done) && r.done.every((x) => typeof x === "string")) {
    return { date: r.date, done: [...(r.done as string[])] };
  }
  return null;
}

function parseCommanders(x: unknown): CommanderAnswersMap {
  const out: CommanderAnswersMap = {};
  if (!isRecord(x)) return out;
  for (const [id, answers] of Object.entries(x)) {
    if (!isRecord(answers)) continue;
    const clean: Record<string, string> = {};
    for (const [q, a] of Object.entries(answers)) if (typeof a === "string") clean[q] = a;
    out[id] = clean;
  }
  return out;
}

/** true when an encodeProfile() code decodes to a profile. */
const codeDecodes = (code: string): boolean => {
  try {
    return "profile" in decodeProfile(code);
  } catch {
    return false;
  }
};

/**
 * parseStore plus what it had to drop: saved accounts whose profile code does not decode
 * (Q2 P2-5) are skipped, never stored, and counted so the import can say so.
 */
export function parseStoreReport(raw: string | null | undefined): { store: StoreV1; skippedProfiles: number } {
  const s = defaultStore();
  let skippedProfiles = 0;
  if (!raw) return { store: s, skippedProfiles };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { store: s, skippedProfiles };
  }
  if (!isRecord(data) || data.v !== 1) return { store: s, skippedProfiles };
  if (typeof data.profileCode === "string" && data.profileCode.length > 0) s.profileCode = data.profileCode;
  if (isRecord(data.draft)) s.draft = data.draft;
  s.routine = parseRoutine(data.routine);
  if (THEME_PREFS.includes(data.theme as ThemePref)) s.theme = data.theme as ThemePref;
  if (PLAYING_AS.includes(data.playingAs as PlayingAs)) s.playingAs = data.playingAs as PlayingAs;
  if (typeof data.activeAccountId === "string" && data.activeAccountId) s.activeAccountId = data.activeAccountId;
  if (SPENDING_PROFILES.includes(data.profileOverride as SpendingProfile)) s.profileOverride = data.profileOverride as SpendingProfile;
  const rp = data.routinePrefs;
  if (isRecord(rp)) {
    const m = rp.minutes;
    s.routinePrefs = {
      minutes: typeof m === "number" && Number.isFinite(m) && m > 0 && m <= 1440 ? m : null,
      breakMode: rp.breakMode === true,
    };
    if (typeof rp.includeWeekly === "boolean") s.routinePrefs.includeWeekly = rp.includeWeekly;
    if (typeof rp.includeEvents === "boolean") s.routinePrefs.includeEvents = rp.includeEvents;
  }
  s.commanders = parseCommanders(data.commanders);
  if (Array.isArray(data.savedProfiles)) {
    const ids = new Set<string>();
    for (const x of data.savedProfiles) {
      if (s.savedProfiles.length >= MAX_SAVED_PROFILES) break;
      if (!isRecord(x) || typeof x.id !== "string" || !x.id || ids.has(x.id)) continue;
      if (typeof x.name !== "string" || !x.name.trim() || typeof x.code !== "string" || !x.code) continue;
      if (!codeDecodes(x.code)) {
        skippedProfiles++;
        continue;
      }
      ids.add(x.id);
      const o = SPENDING_PROFILES.includes(x.override as SpendingProfile) ? (x.override as SpendingProfile) : null;
      const entry: SavedProfile = { id: x.id, name: x.name.trim().slice(0, 40), code: x.code, override: o };
      if (isRecord(x.commanders)) entry.commanders = parseCommanders(x.commanders);
      if (x.routine !== undefined) entry.routine = parseRoutine(x.routine);
      s.savedProfiles.push(entry);
    }
  }
  return { store: s, skippedProfiles };
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function storage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readStore(st: StorageLike | null = storage()): StoreV1 {
  try {
    return parseStore(st?.getItem(STORE_KEY));
  } catch {
    return defaultStore();
  }
}

/** Merge a patch into the stored state. Returns the new state (also when storage is unavailable). */
export function writeStore(patch: Partial<Omit<StoreV1, "v">>, st: StorageLike | null = storage()): StoreV1 {
  const next: StoreV1 = { ...readStore(st), ...patch, v: 1 };
  try {
    st?.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or quota: keep working in memory for this page.
  }
  return next;
}

export function clearStore(st: StorageLike | null = storage()): void {
  try {
    st?.removeItem(STORE_KEY);
  } catch {
    // ignore
  }
}

/** Export as a file the user can keep. */
export function exportStore(s: StoreV1): string {
  return JSON.stringify({ app: "kingdomops", ...s }, null, 2);
}

/** Import a previously exported file. Throws with a message the user can act on. */
export function importStore(text: string): StoreV1 {
  return importStoreReport(text).store;
}

/** importStore plus how many saved accounts were skipped because their profile code is damaged. */
export function importStoreReport(text: string): { store: StoreV1; skippedProfiles: number } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file is not a KingdomOps export. Pick the .json file you exported from the Me page.");
  }
  if (!isRecord(data) || data.app !== "kingdomops") {
    throw new Error("This file is not a KingdomOps export. Pick the .json file you exported from the Me page.");
  }
  const { app: _app, ...rest } = data;
  return parseStoreReport(JSON.stringify(rest));
}
