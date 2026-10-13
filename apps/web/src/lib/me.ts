// Pure helpers for the You page (/me): human-readable profile answers, F-72 effective
// profile rows, theme and export file name. No DOM and no storage: the island owns side effects.
import {
  PROFILE_NAMES,
  QUESTIONS,
  SPENDING_PROFILES,
  type AccountProfile,
  type Question,
  type SpendingProfile,
} from "@rokadm/core";
import { EFFECTIVE_PROFILE_RULE, effectiveProfile, type EffectiveProfile } from "@rokadm/planner";
import { answerText } from "./questionnaire-flow";
import { MAX_SAVED_PROFILES, THEME_PREFS, type SavedProfile, type ThemePref } from "./store";

export interface AnswerRow {
  id: string;
  /** The question as the questionnaire asked it (core label). */
  label: string;
  /** The answer in words (core option labels, grouped numbers with unit). */
  value: string;
  /** Numbers are shown in the mono face. */
  numeric: boolean;
}

/** Answer text for the profile summary; an optional question left blank reads "Not answered". */
export function profileAnswerText(q: Question, value: unknown): string {
  if (value === null && q.type === "number") return "Not answered";
  return answerText(q, value);
}

/** Every saved answer, in questionnaire order, in human words. */
export function profileRows(p: AccountProfile): AnswerRow[] {
  return QUESTIONS.map((q) => {
    const v = (p as unknown as Record<string, unknown>)[q.id];
    return { id: q.id, label: q.label, value: profileAnswerText(q, v), numeric: q.type === "number" && v !== null };
  });
}

/** "F2P", "Low", ... (core names). */
export const profileName = (sp: SpendingProfile): string => PROFILE_NAMES[sp];

/** Monthly band text from the core spending options, e.g. "Low spender — $5–$100 per month". */
export function spendingOptionLabel(sp: SpendingProfile): string {
  const q = QUESTIONS.find((x) => x.id === "spending");
  const opt = q && q.type === "choice" ? q.options.find((o) => o.value === sp) : undefined;
  return opt?.label ?? PROFILE_NAMES[sp];
}

export interface OverrideChoice {
  /** Radio value: "auto" or a spending profile. */
  value: "auto" | SpendingProfile;
  label: string;
}

/** Radio options for the manual override: Automatic first, then the six profiles. */
export const OVERRIDE_CHOICES: readonly OverrideChoice[] = [
  { value: "auto", label: "Automatic (recommended)" },
  ...SPENDING_PROFILES.map((sp) => ({ value: sp, label: spendingOptionLabel(sp) })),
];

/** Radio value → stored override (null = automatic). Unknown values mean automatic. */
export function parseOverride(value: string): SpendingProfile | null {
  return (SPENDING_PROFILES as readonly string[]).includes(value) ? (value as SpendingProfile) : null;
}

export const overrideValue = (o: SpendingProfile | null): OverrideChoice["value"] => o ?? "auto";

export interface EffectiveView {
  result: EffectiveProfile;
  declared: string;
  lifetime: string;
  effective: string;
}

/** F-72 panel content: declared, lifetime tier and effective profile in words. */
export function effectiveView(p: AccountProfile, override: SpendingProfile | null): EffectiveView {
  const result = effectiveProfile(p, override);
  const lifetime =
    p.lifetimeSpendUsd === null
      ? "Not answered"
      : `${profileName(result.lifetimeTier!)} (about $${p.lifetimeSpendUsd.toLocaleString("en-US")} in total)`;
  const effective =
    result.source === "override"
      ? `${profileName(result.effective)} (set by hand)`
      : result.source === "lifetime"
        ? `${profileName(result.effective)} (raised by total spend)`
        : profileName(result.effective);
  return { result, declared: profileName(result.declared), lifetime, effective };
}

const RULE_PREFIX = /^Product rule, not a game fact:\s*/;

/** The rule text without its "Product rule, not a game fact:" lead (the page shows that as a label). */
export const RULE_BODY = ((s: string) => s.charAt(0).toUpperCase() + s.slice(1))(EFFECTIVE_PROFILE_RULE.replace(RULE_PREFIX, ""));

export const THEME_CHOICES: ReadonlyArray<{ value: ThemePref; label: string }> = THEME_PREFS.map((t) => ({
  value: t,
  label: t === "dark" ? "Dark" : t === "light" ? "Light" : "System",
}));

export const isThemePref = (v: unknown): v is ThemePref => THEME_PREFS.includes(v as ThemePref);

const pad = (n: number): string => String(n).padStart(2, "0");

/** "kingdomops-YYYY-MM-DD.json" in the user's local date. */
export function exportFileName(d: Date): string {
  return `kingdomops-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

/** What "Delete everything" reports: it clears every ko:* key (lib/storage-keys.ts), webhook included. */
export function deletedMessage(removed: number, offlineCleared: boolean | null): string {
  const what = removed === 0
    ? "Nothing KingdomOps saved was left in this browser."
    : "Everything KingdomOps saved in this browser was deleted, including the Discord webhook URL if you had one.";
  if (offlineCleared === null) return `${what} The offline copy of the site (pages only, nothing about you) was kept.`;
  return `${what} ${offlineCleared ? "The offline copy of the site was removed too." : "There was no offline copy of the site to remove."}`;
}
export const DELETED_MESSAGE = deletedMessage(1, null);
export const IMPORTED_MESSAGE = "Imported. Your profile, saved accounts, routine, commander checks and theme were replaced with the file's contents.";

/** Import note when saved accounts in the file had a profile code that does not decode (Q2 P2-5). */
export function skippedMessage(n: number): string {
  return n === 1
    ? "1 saved account in the file had a damaged profile code and was skipped. Answer the questions again on that account to save it."
    : `${n} saved accounts in the file had a damaged profile code and were skipped. Answer the questions again on those accounts to save them.`;
}

// ---------------------------------------------------------------------------
// Saved accounts (main + farms): the active one is profileCode/profileOverride.

export const NAME_MAX = 30;

export type SaveResult = { ok: true; list: SavedProfile[] } | { ok: false; error: string };

/** Save the current profile under a name; the same name replaces that entry (case-insensitive). */
export function saveAccount(
  list: readonly SavedProfile[],
  name: string,
  code: string,
  override: SpendingProfile | null,
  id: string,
): SaveResult {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return { ok: false, error: "Give this account a name, for example Main or Farm 1." };
  if (clean.length > NAME_MAX) return { ok: false, error: `Use at most ${NAME_MAX} characters.` };
  const same = list.findIndex((p) => p.name.toLowerCase() === clean.toLowerCase());
  if (same >= 0) {
    const next = [...list];
    next[same] = { ...next[same]!, name: clean, code, override };
    return { ok: true, list: next };
  }
  if (list.length >= MAX_SAVED_PROFILES) {
    return { ok: false, error: `You can save up to ${MAX_SAVED_PROFILES} accounts. Remove one first.` };
  }
  return { ok: true, list: [...list, { id, name: clean, code, override }] };
}

export const removeAccount = (list: readonly SavedProfile[], id: string): SavedProfile[] => list.filter((p) => p.id !== id);

/** The saved account that is in use now, if any. */
export function activeAccountId(list: readonly SavedProfile[], code: string | null, override: SpendingProfile | null): string | null {
  return list.find((p) => p.code === code && p.override === override)?.id ?? null;
}

/** Store patch that makes a saved account the active one (stale questionnaire draft cleared). */
export function useAccountPatch(p: SavedProfile): { profileCode: string; profileOverride: SpendingProfile | null; draft: null } {
  return { profileCode: p.code, profileOverride: p.override, draft: null };
}

export function newAccountId(now: Date, random: () => number = Math.random): string {
  return `${now.getTime().toString(36)}${Math.floor(random() * 1e6).toString(36)}`;
}
