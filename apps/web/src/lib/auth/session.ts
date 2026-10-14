// The sign-in session lives in localStorage under one ko:* key (lib/storage-keys.ts), written by
// supabase-js. These helpers read it synchronously, without loading Supabase, so the route guard
// and the navigation can tell "probably signed in" before any network call. The server (RLS) is
// what actually protects data; this is only for routing and UI.

export const AUTH_STORAGE_KEY = "ko:auth:v1";

export interface StoredSessionHint {
  userId: string;
  email: string | null;
}

type Readable = Pick<Storage, "getItem">;

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/** The stored session's user, or null when there is none (or storage is blocked or garbled). */
export function readSessionHint(st: Readable | null): StoredSessionHint | null {
  let raw: string | null = null;
  try {
    raw = st?.getItem(AUTH_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  // supabase-js v2 stores the session object itself; older builds wrapped it in currentSession.
  const s = isRecord(data) && isRecord(data.currentSession) ? data.currentSession : data;
  if (!isRecord(s) || typeof s.refresh_token !== "string" || s.refresh_token === "") return null;
  const user = s.user;
  if (!isRecord(user) || typeof user.id !== "string") return null;
  return { userId: user.id, email: typeof user.email === "string" ? user.email : null };
}

export function hasStoredSession(st: Readable | null): boolean {
  return readSessionHint(st) !== null;
}

/** localStorage, or null when the browser blocks it. */
export function localStore(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
