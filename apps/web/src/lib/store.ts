// Device-local state (ADR 0002): one versioned key in localStorage.
// Every read is tolerant: missing, corrupted or blocked storage falls back to defaults.
import { SPENDING_PROFILES, type SpendingProfile } from "@rokadm/core";

export type ThemePref = "dark" | "light" | "system";
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
}

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
}

export const STORE_KEY = "ko:v1";

export function defaultStore(): StoreV1 {
  return {
    v: 1, profileCode: null, draft: null, routine: null, theme: "dark",
    profileOverride: null, routinePrefs: null, commanders: {},
  };
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/** Parse stored JSON; any field that is missing or malformed gets its default. */
export function parseStore(raw: string | null | undefined): StoreV1 {
  const s = defaultStore();
  if (!raw) return s;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return s;
  }
  if (!isRecord(data) || data.v !== 1) return s;
  if (typeof data.profileCode === "string" && data.profileCode.length > 0) s.profileCode = data.profileCode;
  if (isRecord(data.draft)) s.draft = data.draft;
  const r = data.routine;
  if (isRecord(r) && typeof r.date === "string" && Array.isArray(r.done) && r.done.every((x) => typeof x === "string")) {
    s.routine = { date: r.date, done: [...(r.done as string[])] };
  }
  if (THEME_PREFS.includes(data.theme as ThemePref)) s.theme = data.theme as ThemePref;
  if (SPENDING_PROFILES.includes(data.profileOverride as SpendingProfile)) s.profileOverride = data.profileOverride as SpendingProfile;
  const rp = data.routinePrefs;
  if (isRecord(rp)) {
    const m = rp.minutes;
    s.routinePrefs = {
      minutes: typeof m === "number" && Number.isFinite(m) && m > 0 && m <= 1440 ? m : null,
      breakMode: rp.breakMode === true,
    };
  }
  if (isRecord(data.commanders)) {
    for (const [id, answers] of Object.entries(data.commanders)) {
      if (!isRecord(answers)) continue;
      const clean: Record<string, string> = {};
      for (const [q, a] of Object.entries(answers)) if (typeof a === "string") clean[q] = a;
      s.commanders[id] = clean;
    }
  }
  return s;
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
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file is not a KingdomOps export. Pick the .json file you exported from the You page.");
  }
  if (!isRecord(data) || data.app !== "kingdomops") {
    throw new Error("This file is not a KingdomOps export. Pick the .json file you exported from the You page.");
  }
  const { app: _app, ...rest } = data;
  return parseStore(JSON.stringify(rest));
}
