// F-01 Account Setup Questionnaire: declarative questions, validation into an
// AccountProfile, and a compact URL-safe encoding (no backend needed to share
// or bookmark a guide setup). Pure functions, no I/O.

import { SPENDING_PROFILES } from "./types";
import type { AccountProfile, KingdomStage, Role, SpendingProfile } from "./types";

// ---------------------------------------------------------------------------
// Constants

export const ROLES: readonly Role[] = ["lutador", "farm", "rally", "guarnicao", "lider"];
export const KINGDOM_STAGES: readonly KingdomStage[] = ["pre_kvk", "kvk1", "kvk2", "kvk3", "soc"];

/**
 * Civilization codes (lower-case English names) seen in research/facts.
 * The game adds civilizations over time; confirm the list in game (T0).
 */
export const CIVILIZATIONS: readonly string[] = [
  "arabia", "britain", "byzantium", "china", "egypt", "france", "germany", "greece",
  "japan", "korea", "maya", "ottoman", "rome", "spain", "vikings",
];

export const MINUTES_PRESETS = [15, 30, 60, 120] as const;
export const CITY_HALL_MIN = 1;
export const CITY_HALL_MAX = 25;

// ---------------------------------------------------------------------------
// Question model

export type QuestionId =
  | "spending" | "lifetimeSpendUsd" | "minutesPerDay" | "sessionsPerDay" | "role"
  | "kingdomStage" | "kingdomDay" | "cityHall" | "civilization" | "returningPlayer";

export interface QuestionOption<V> {
  value: V;
  label: string;
  help?: string;
}

interface QuestionBase<V> {
  id: QuestionId;
  label: string;
  help: string;
  /** Value used when the answer is missing or blank. */
  default: V;
  /** null is an accepted answer ("I don't know" / "skip"). */
  nullable: boolean;
}

export interface ChoiceQuestion<V extends string | null = string | null> extends QuestionBase<V> {
  type: "choice";
  options: ReadonlyArray<QuestionOption<V>>;
}

export interface NumberQuestion extends QuestionBase<number | null> {
  type: "number";
  min: number;
  max: number;
  integer: boolean;
  unit?: string;
  /** Suggested values shown as quick picks; any value in [min, max] is valid. */
  presets?: ReadonlyArray<QuestionOption<number>>;
}

export interface BooleanQuestion extends QuestionBase<boolean> {
  type: "boolean";
  /** Yes/No labels with their one-line "why this matters". */
  options: readonly [QuestionOption<boolean>, QuestionOption<boolean>];
}

export type Question = ChoiceQuestion | NumberQuestion | BooleanQuestion;

const SPENDING_OPTIONS: ReadonlyArray<QuestionOption<SpendingProfile>> = [
  { value: "f2p", label: "F2P — $0 per month", help: "No money spent. The guide sticks to the free path." },
  { value: "low", label: "Low spender — $5–$100 per month", help: "e.g. a monthly pass. Adds the low-spender notes to the free path." },
  { value: "medium", label: "Medium spender — $100–$500 per month", help: "Adds the spender notes; steps written for medium spenders are tagged for you." },
  { value: "high", label: "High spender — $500–$1,000 per month", help: "Adds the spender notes; steps written for high spenders are tagged for you." },
  { value: "whale", label: "Whale — $1,000–$5,000 per month", help: "Adds the spender notes; steps written for whales are tagged for you." },
  { value: "kraken", label: "Kraken — $5,000+ per month", help: "Adds the spender notes; steps written for krakens are tagged for you." },
];

const ROLE_OPTIONS: ReadonlyArray<QuestionOption<Role>> = [
  { value: "lutador", label: "Fighter", help: "Your main fights in the field. The routine keeps the fighter tasks." },
  { value: "farm", label: "Farm account", help: "A second account that gathers for a main. The routine drops tasks only a main needs." },
  { value: "rally", label: "Rally leader", help: "You lead rallies on forts, flags and cities. The routine keeps the rally tasks." },
  { value: "guarnicao", label: "Garrison", help: "You defend structures and cities. The routine keeps the garrison tasks." },
  { value: "lider", label: "Alliance / kingdom leader", help: "R4/R5 or kingdom council. Adds the kingdom administration guide." },
];

const STAGE_OPTIONS: ReadonlyArray<QuestionOption<KingdomStage>> = [
  { value: "pre_kvk", label: "Before the first KvK", help: "A new kingdom. The guide covers the early phases and the kingdom start." },
  { value: "kvk1", label: "KvK 1 (Season 1)", help: "The guide adds the KvK 1 sections." },
  { value: "kvk2", label: "KvK 2", help: "Not researched yet: the guide shows KvK 1 content, labelled." },
  { value: "kvk3", label: "KvK 3", help: "Not researched yet: the guide shows KvK 1 content, labelled." },
  { value: "soc", label: "Season of Conquest (SoC)", help: "Not researched yet: the guide shows KvK 1 content, labelled." },
];

const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** The F-01 question list, in display order. Labels are English. */
export const QUESTIONS: readonly Question[] = [
  {
    id: "spending", type: "choice", nullable: false, default: "f2p",
    label: "How much do you spend on Rise of Kingdoms per month?",
    help: "Picks which advice you see and which guide steps are tagged for you. There is no right answer. Ranges are a community convention, in USD.",
    options: SPENDING_OPTIONS,
  },
  {
    id: "lifetimeSpendUsd", type: "number", nullable: true, default: null, min: 0, max: 10_000_000, integer: true, unit: "USD",
    label: "Roughly how much have you spent in total on this account?",
    help: "Optional. Past spending changes the advice even if you are F2P today.",
    presets: [
      { value: 0, label: "Nothing", help: "Your monthly answer alone sets the profile." },
      { value: 100, label: "About $100", help: "Counts as Low when your monthly answer is lower." },
      { value: 1_000, label: "About $1,000", help: "Counts as Low; the summary flags it if you play F2P now." },
      { value: 10_000, label: "$10,000 or more", help: "Counts as High or above when your monthly answer is lower." },
    ],
  },
  {
    id: "minutesPerDay", type: "number", nullable: false, default: 60, min: 0, max: 1440, integer: true, unit: "min",
    label: "How much time can you play on a typical day?",
    help: "Sets the daily routine tier. Pick the time you really have, not the time you wish you had.",
    presets: [
      { value: 15, label: "15 minutes", help: "The routine keeps only the tasks worth the most per minute." },
      { value: 30, label: "30 minutes", help: "The routine fits the daily essentials and a few extras." },
      { value: 60, label: "1 hour", help: "Room for most daily tasks and some event work." },
      { value: 120, label: "2 hours or more", help: "The routine fits longer tasks that a short day leaves out." },
    ],
  },
  {
    id: "sessionsPerDay", type: "number", nullable: true, default: null, min: 1, max: 24, integer: true,
    label: "How many times a day do you log in?",
    help: "Optional. It shapes how timers and marches fit between your visits.",
    presets: [
      { value: 1, label: "Once", help: "One sitting: set long timers and marches before you leave." },
      { value: 2, label: "2–3 times", help: "You can refill queues and marches between sittings." },
      { value: 4, label: "4 or more", help: "Short timers and quick event tasks fit between check-ins." },
    ],
  },
  {
    id: "role", type: "choice", nullable: false, default: "lutador",
    label: "What is this account's main role?",
    help: "Farm accounts still get the routine and safety advice that applies to every account.",
    options: ROLE_OPTIONS,
  },
  {
    id: "kingdomStage", type: "choice", nullable: false, default: "pre_kvk",
    label: "Where is your kingdom right now?",
    help: "Shown on the kingdom's season/KvK screen.",
    options: STAGE_OPTIONS,
  },
  {
    id: "kingdomDay", type: "number", nullable: true, default: null, min: 0, max: 5000, integer: true, unit: "days",
    label: "How many days old is your kingdom?",
    help: "Optional. Phases already behind you are moved to an \"Already done?\" list.",
  },
  {
    id: "cityHall", type: "number", nullable: false, default: 1, min: CITY_HALL_MIN, max: CITY_HALL_MAX, integer: true,
    label: "What is your City Hall level?",
    help: "Steps for lower levels go to \"Already done?\" so you can check what you missed.",
  },
  {
    id: "civilization", type: "choice", nullable: true, default: null,
    label: "Which civilization do you play?",
    help: "Leave it as \"Not chosen yet\" if you are still deciding: the guide includes the civilization choice.",
    options: [
      { value: null, label: "Not chosen yet / not sure", help: "The guide keeps the civilization choice in your plan." },
      ...CIVILIZATIONS.map((c) => ({
        value: c,
        label: titleCase(c),
        help: "Saved with your profile. The guide does not change by civilization yet.",
      })),
    ],
  },
  {
    id: "returningPlayer", type: "boolean", nullable: false, default: false,
    label: "Are you coming back after a long break?",
    help: "Returning accounts get catch-up advice where it exists.",
    options: [
      { value: true, label: "Yes", help: "The guide opens with the coming-back guide and catch-up steps." },
      { value: false, label: "No", help: "New accounts at a low City Hall also get the first-30-days path." },
    ],
  },
];

export function getQuestion(id: QuestionId): Question {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown question ${id}`);
  return q;
}

// ---------------------------------------------------------------------------
// Validation

export interface ValidationError {
  field: QuestionId | "_";
  message: string;
}

export type ValidationResult =
  | { profile: AccountProfile; warnings: string[] }
  | { errors: ValidationError[] };

export function defaultProfile(): AccountProfile {
  const p: Record<string, unknown> = {};
  for (const q of QUESTIONS) p[q.id] = q.default;
  return p as unknown as AccountProfile;
}

const isBlank = (v: unknown): boolean => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

function parseNumber(q: NumberQuestion, raw: unknown): { value: number | null } | { error: string } {
  if (isBlank(raw)) {
    if (raw === null && q.nullable) return { value: null };
    return { value: q.default };
  }
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw.trim()) : NaN;
  if (!Number.isFinite(n)) return { error: `${q.label} Expected a number.` };
  if (q.integer && !Number.isInteger(n)) return { error: `${q.label} Expected a whole number.` };
  if (n < q.min || n > q.max) return { error: `${q.label} Must be between ${q.min} and ${q.max}.` };
  return { value: n };
}

function parseChoice(q: ChoiceQuestion, raw: unknown): { value: string | null } | { error: string } {
  if (isBlank(raw)) {
    if (raw === null && q.nullable) return { value: null };
    return { value: q.default };
  }
  if (typeof raw !== "string") return { error: `${q.label} Expected one of the listed options.` };
  const v = raw.trim().toLowerCase();
  const opt = q.options.find((o) => o.value === v);
  if (!opt) {
    const allowed = q.options.map((o) => o.value ?? "(none)").join(", ");
    return { error: `${q.label} "${raw}" is not an option (${allowed}).` };
  }
  return { value: opt.value };
}

function parseBoolean(q: BooleanQuestion, raw: unknown): { value: boolean } | { error: string } {
  if (isBlank(raw)) return { value: q.default };
  if (typeof raw === "boolean") return { value: raw };
  if (raw === 1 || raw === 0) return { value: raw === 1 };
  if (typeof raw === "string") {
    const v = raw.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(v)) return { value: true };
    if (["false", "0", "no", "n", "off"].includes(v)) return { value: false };
  }
  return { error: `${q.label} Expected yes or no.` };
}

/**
 * Validate raw answers (form values: strings or typed values, keyed by question id).
 * Missing answers take the question default; an explicit `null` is accepted only for
 * nullable questions. Unknown keys are errors (catches typos in shared links).
 */
export function validateAnswers(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { errors: [{ field: "_", message: "Answers must be an object keyed by question id." }] };
  }
  const input = raw as Record<string, unknown>;
  const errors: ValidationError[] = [];
  const out: Record<string, unknown> = {};

  for (const key of Object.keys(input)) {
    if (!QUESTIONS.some((q) => q.id === key)) errors.push({ field: "_", message: `Unknown question "${key}".` });
  }

  for (const q of QUESTIONS) {
    const v = input[q.id];
    if (v === null && !q.nullable) {
      errors.push({ field: q.id, message: `${q.label} An answer is required.` });
      continue;
    }
    const r = q.type === "number" ? parseNumber(q, v) : q.type === "choice" ? parseChoice(q, v) : parseBoolean(q, v);
    if ("error" in r) errors.push({ field: q.id, message: r.error });
    else out[q.id] = r.value;
  }

  // Cross-field rules
  if (errors.length === 0) {
    const day = out.kingdomDay as number | null;
    const stage = out.kingdomStage as KingdomStage;
    if (day !== null && stage !== "pre_kvk" && day < 60) {
      errors.push({
        field: "kingdomDay",
        message: `A kingdom on day ${day} cannot be past pre-KvK yet (the first KvK starts around day 100).`,
      });
    }
  }
  if (errors.length > 0) return { errors };

  const profile = out as unknown as AccountProfile;
  return { profile, warnings: profileWarnings(profile) };
}

/** Soft checks: answers that are valid but change how the advice should be read. */
export function profileWarnings(p: AccountProfile): string[] {
  const w: string[] = [];
  if ((p.spending === "f2p" || p.spending === "low") && p.lifetimeSpendUsd !== null && p.lifetimeSpendUsd >= 1000) {
    w.push(
      `You spent about $${p.lifetimeSpendUsd} in the past: your account may be ahead of a typical ${p.spending.toUpperCase()} account, so some targets will be conservative.`,
    );
  }
  if (p.kingdomStage === "pre_kvk" && p.kingdomDay !== null && p.kingdomDay > 150) {
    w.push(`Kingdom day ${p.kingdomDay} is late for pre-KvK; check your kingdom stage.`);
  }
  if (p.minutesPerDay < 15) {
    w.push("Under 15 minutes a day: the guide shows the Light days / Break Mode floor.");
  }
  return w;
}

// ---------------------------------------------------------------------------
// URL-safe encoding
//
// Format (version 1), fields joined by ".", empty field = null:
//   1.<spending>.<role>.<stage>.<cityHall>.<minutes>.<sessions>.<kingdomDay>.<lifetimeUsd>.<civ>.<returning>
// spending/role/stage are indexes into SPENDING_PROFILES/ROLES/KINGDOM_STAGES,
// civ is the lower-case code, returning is 0/1. Only [0-9a-z.] is produced, which
// fits URL hashes and query values ([A-Za-z0-9._~-]) without escaping.
// Example: "1.0.0.0.12.60..35..china.0"

export const PROFILE_CODE_VERSION = "1";
const CODE_RE = /^[A-Za-z0-9._~-]*$/;

export function encodeProfile(p: AccountProfile): string {
  const idx = <T>(list: readonly T[], v: T, name: string): string => {
    const i = list.indexOf(v);
    if (i < 0) throw new Error(`Cannot encode ${name} "${String(v)}"`);
    return String(i);
  };
  const num = (n: number | null): string => (n === null ? "" : String(n));
  const civ = p.civilization === null ? "" : p.civilization.toLowerCase();
  if (civ !== "" && !/^[a-z0-9]+$/.test(civ)) throw new Error(`Cannot encode civilization "${p.civilization}"`);
  return [
    PROFILE_CODE_VERSION,
    idx(SPENDING_PROFILES, p.spending, "spending"),
    idx(ROLES, p.role, "role"),
    idx(KINGDOM_STAGES, p.kingdomStage, "kingdomStage"),
    String(p.cityHall),
    String(p.minutesPerDay),
    num(p.sessionsPerDay),
    num(p.kingdomDay),
    num(p.lifetimeSpendUsd),
    civ,
    p.returningPlayer ? "1" : "0",
  ].join(".");
}

/** Decode and validate a profile code. Never throws. */
export function decodeProfile(code: string): ValidationResult {
  const fail = (message: string): ValidationResult => ({ errors: [{ field: "_", message }] });
  if (typeof code !== "string" || code.length === 0) return fail("Empty profile code.");
  if (code.length > 200 || !CODE_RE.test(code)) return fail("Profile code has invalid characters.");
  const parts = code.split(".");
  if (parts[0] !== PROFILE_CODE_VERSION) return fail(`Unsupported profile code version "${parts[0]}".`);
  if (parts.length !== 11) return fail(`Profile code must have 11 fields, got ${parts.length}.`);
  const [, sp, ro, st, ch, min, ses, kd, life, civ, ret] = parts as [string, ...string[]];

  const fromIdx = <T>(list: readonly T[], s: string | undefined): T | string => {
    if (s === undefined || !/^\d$/.test(s)) return `#${s ?? ""}`;
    const v = list[Number(s)];
    return v === undefined ? `#${s}` : v;
  };
  const opt = (s: string | undefined): string | null => (s === undefined || s === "" ? null : s);

  return validateAnswers({
    spending: fromIdx(SPENDING_PROFILES, sp),
    role: fromIdx(ROLES, ro),
    kingdomStage: fromIdx(KINGDOM_STAGES, st),
    cityHall: ch === "" ? null : ch,
    minutesPerDay: min === "" ? null : min,
    sessionsPerDay: opt(ses),
    kingdomDay: opt(kd),
    lifetimeSpendUsd: opt(life),
    civilization: opt(civ),
    returningPlayer: ret === "1" ? true : ret === "0" ? false : (ret ?? null),
  });
}
