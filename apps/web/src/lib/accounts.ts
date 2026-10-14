// Accounts (UX stage 1): main, farms and alts, each with its own profile, "My commanders" answers
// and routine ticks, plus the active-account id. Everything lives in the ko:v1 store (no new
// storage key): savedProfiles is the list, activeAccountId the one in use, and the active account
// is mirrored in profileCode / profileOverride / commanders / routine so every older page keeps
// reading what it always read. Pure functions: callers write the returned patch.
import { decodeProfile } from "@rokadm/core";
import type { SavedProfile, StoreV1 } from "./store";

/** Name and id given to the single profile of an older save when it becomes account #1. */
export const FIRST_ACCOUNT = { id: "main", name: "Main" } as const;

type AccountsStore = Pick<StoreV1, "profileCode" | "profileOverride" | "savedProfiles" | "activeAccountId" | "commanders" | "routine">;

const decodes = (code: string): boolean => {
  try {
    return "profile" in decodeProfile(code);
  } catch {
    return false;
  }
};

export interface AccountsView {
  accounts: SavedProfile[];
  activeId: string | null;
  /** The store must be written to persist this view (an older save was migrated). */
  migrated: boolean;
}

/**
 * The account list as it should be. Active = activeAccountId when it is in the list, else the saved
 * entry whose code matches profileCode (saves from before activeAccountId), else the current profile
 * becomes account #1 ("Main", or a free id when "main" is taken).
 */
export function accountsOf(s: AccountsStore): AccountsView {
  const list = s.savedProfiles.filter((a) => decodes(a.code));
  const byId = s.activeAccountId ? list.find((a) => a.id === s.activeAccountId) : undefined;
  if (byId) return { accounts: list, activeId: byId.id, migrated: false };
  if (!s.profileCode || !decodes(s.profileCode)) return { accounts: list, activeId: null, migrated: s.activeAccountId !== null };
  const match = list.find((a) => a.code === s.profileCode && a.override === s.profileOverride);
  if (match) return { accounts: list, activeId: match.id, migrated: true };
  let id: string = FIRST_ACCOUNT.id;
  for (let n = 2; list.some((a) => a.id === id); n++) id = `${FIRST_ACCOUNT.id}${n}`;
  const name = list.some((a) => a.name.toLowerCase() === FIRST_ACCOUNT.name.toLowerCase()) ? `${FIRST_ACCOUNT.name} (current)` : FIRST_ACCOUNT.name;
  const first: SavedProfile = { id, name, code: s.profileCode, override: s.profileOverride, kind: list.length ? "farm" : "main" };
  return { accounts: [first, ...list], activeId: id, migrated: true };
}

/** Store patch that persists the migration (or null when nothing changes). */
export function migrationPatch(s: AccountsStore): Pick<StoreV1, "savedProfiles" | "activeAccountId"> | null {
  const v = accountsOf(s);
  return v.migrated ? { savedProfiles: v.accounts, activeAccountId: v.activeId } : null;
}

/** The active account, if any. */
export function activeAccount(s: AccountsStore): SavedProfile | null {
  const v = accountsOf(s);
  return v.accounts.find((a) => a.id === v.activeId) ?? null;
}

/**
 * Switch the account in use: the outgoing account keeps its current code, override, commander
 * answers and routine ticks; the incoming one's are mirrored into the top-level fields.
 */
export function switchAccountPatch(s: AccountsStore, id: string): Partial<StoreV1> | null {
  const v = accountsOf(s);
  const target = v.accounts.find((a) => a.id === id);
  if (!target) return null;
  if (id === v.activeId) return v.migrated ? { savedProfiles: v.accounts, activeAccountId: v.activeId } : null;
  const accounts = v.accounts.map((a) => {
    if (a.id === v.activeId) return { ...a, code: s.profileCode ?? a.code, override: s.profileOverride, commanders: s.commanders, routine: s.routine };
    if (a.id === id) {
      const { commanders: _c, routine: _r, ...rest } = a;
      return rest;
    }
    return a;
  });
  return {
    savedProfiles: accounts,
    activeAccountId: id,
    profileCode: target.code,
    profileOverride: target.override,
    commanders: target.commanders ?? {},
    routine: target.routine ?? null,
    draft: null,
  };
}

/** Patch for a new profile code of the account in use (onboarding, details on /me). */
export function withActiveCode(s: AccountsStore, code: string): Pick<StoreV1, "profileCode" | "savedProfiles" | "activeAccountId"> {
  const v = accountsOf({ ...s });
  if (!v.activeId) return { profileCode: code, savedProfiles: s.savedProfiles, activeAccountId: s.activeAccountId };
  return {
    profileCode: code,
    savedProfiles: v.accounts.map((a) => (a.id === v.activeId ? { ...a, code } : a)),
    activeAccountId: v.activeId,
  };
}
