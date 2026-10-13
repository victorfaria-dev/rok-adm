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
import { THEME_PREFS, type ThemePref } from "./store";

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

export const DELETED_MESSAGE = "All KingdomOps data was deleted from this browser.";
export const IMPORTED_MESSAGE = "Imported. Your saved state was replaced with the file's contents.";
