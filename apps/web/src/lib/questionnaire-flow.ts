// Onboarding step machine (UX stage 1: at most 5 questions). Pure functions, no DOM and no storage:
// the island owns side effects. Profile questions, options, limits and defaults come from QUESTIONS
// in @rokadm/core; the one extra step, "Playing as" (player / leader), is the site's own and is not
// part of the profile code. Every other core question is optional and edited later on /me.
import {
  QUESTIONS,
  decodeProfile,
  encodeProfile,
  getQuestion,
  validateAnswers,
  type AccountProfile,
  type NumberQuestion,
  type Question,
  type QuestionId,
  type QuestionOption,
} from "@rokadm/core";
import { HOME_FOR } from "./nav";
import { PLAYING_AS, type PlayingAs } from "./store";

/** "Playing as": picks the tab set (lib/nav.ts) and the home tab the onboarding ends on. */
export interface PlayingAsQuestion {
  id: "playingAs";
  type: "choice";
  label: string;
  help: string;
  default: PlayingAs;
  nullable: false;
  options: ReadonlyArray<QuestionOption<PlayingAs>>;
}

export const PLAYING_AS_QUESTION: PlayingAsQuestion = {
  id: "playingAs",
  type: "choice",
  nullable: false,
  default: "player",
  label: "Como você vai usar o KingdomOps?",
  help: "Define as suas abas. Você pode trocar quando quiser na aba Eu.",
  options: [
    { value: "player", label: "Como jogador", help: "Sua Prefeitura, o essencial de hoje, guias e ferramentas." },
    { value: "leader", label: "Como líder de reino ou de aliança", help: "Regras do reino, membros, recrutamento e eventos, além dos guias." },
  ],
};

export type StepId = QuestionId | "playingAs";
export type FlowQuestion = Question | PlayingAsQuestion;

/** The core questions asked during onboarding, in order after "Playing as". */
export const ONBOARDING_IDS: readonly QuestionId[] = ["spending", "minutesPerDay", "cityHall", "kingdomStage"];

/** Optional answers, edited on /me ("More about your account"); the onboarding never asks them. */
export const OPTIONAL_IDS: readonly QuestionId[] = QUESTIONS.map((q) => q.id).filter((id) => !ONBOARDING_IDS.includes(id));

/** Every onboarding step, in display order. */
export const STEPS: readonly FlowQuestion[] = [PLAYING_AS_QUESTION, ...ONBOARDING_IDS.map(getQuestion)];

/** Raw answers keyed by step id. Number answers may be the text being typed. */
export type Answers = Partial<Record<StepId, unknown>>;

export interface FlowState {
  /** 0..STEPS.length - 1 is a question; SUMMARY is the final review step. */
  step: number;
  answers: Answers;
  /** Opened from the summary with "Change": Next goes back to the summary. */
  review: boolean;
  /** How-to-fix message for the current step, or null. */
  error: string | null;
}

/** Shape stored in StoreV1.draft. */
export interface Draft {
  step: number;
  answers: Answers;
}

export const TOTAL = STEPS.length;
export const SUMMARY = TOTAL;

export function initialState(): FlowState {
  return { step: 0, answers: {}, review: false, error: null };
}

export function questionAt(step: number): FlowQuestion | null {
  return STEPS[step] ?? null;
}

export const isSummary = (s: FlowState): boolean => s.step === SUMMARY;

/** The value shown for a question: the answer, or the core default when unanswered. */
export function currentValue(s: FlowState, q: FlowQuestion): unknown {
  const v = s.answers[q.id];
  return v === undefined ? q.default : v;
}

export function setAnswer(s: FlowState, value: unknown): FlowState {
  const q = questionAt(s.step);
  if (!q) return s;
  return { ...s, answers: { ...s.answers, [q.id]: value }, error: null };
}

const fmt = (n: number): string => n.toLocaleString("pt-BR");

/** "de 1 a 25", "de 0 a 10.000.000 USD". */
export function rangeText(q: NumberQuestion): string {
  return `de ${fmt(q.min)} a ${fmt(q.max)}${q.unit ? ` ${q.unit}` : ""}`;
}

/** Text typed in a number field: spaces, commas and underscores are digit grouping, and so is a pt-BR dot ("1.200"). */
export function cleanNumberText(raw: string): string {
  const s = raw.replace(/[\s,_]/g, "");
  return /^-?\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s;
}

/** Parse one number answer; errors say how to fix it. */
export function parseNumberAnswer(q: NumberQuestion, raw: unknown): { value: number | null } | { error: string } {
  if (raw === null || raw === undefined || (typeof raw === "string" && cleanNumberText(raw) === "")) {
    if (q.nullable) return { value: null };
    return { error: `Digite um número ${rangeText(q)}.` };
  }
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(cleanNumberText(raw)) : NaN;
  if (typeof raw === "string" && !/^-?\d*\.?\d*$/.test(cleanNumberText(raw))) {
    return { error: `Use só dígitos: um número inteiro ${rangeText(q)}.` };
  }
  if (!Number.isFinite(n)) return { error: `Use só dígitos: um número inteiro ${rangeText(q)}.` };
  if (q.integer && !Number.isInteger(n)) return { error: `Use um número inteiro ${rangeText(q)}.` };
  if (n < q.min || n > q.max) return { error: `${fmt(n)} está fora do intervalo. Digite um número ${rangeText(q)}.` };
  return { value: n };
}

/** Parse a step's answer into the value stored when the step is committed. */
export function parseStep(q: FlowQuestion, raw: unknown): { value: unknown } | { error: string } {
  if (q.type === "number") return parseNumberAnswer(q, raw);
  if (q.type === "boolean") {
    return typeof raw === "boolean" ? { value: raw } : { error: "Escolha Sim ou Não." };
  }
  if (raw === null && q.nullable) return { value: null };
  return (q.options as ReadonlyArray<QuestionOption<unknown>>).some((o) => o.value === raw) ? { value: raw } : { error: "Escolha uma das opções." };
}

/** Profile answers as typed values for validateAnswers: number text parsed, unanswered and "playingAs" left out. */
export function normalizeAnswers(answers: Answers): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const q of QUESTIONS) {
    const v = answers[q.id];
    if (v === undefined) continue;
    if (q.type === "number" && typeof v === "string") {
      const r = parseNumberAnswer(q, v);
      out[q.id] = "value" in r ? r.value : v;
    } else {
      out[q.id] = v;
    }
  }
  return out;
}

/**
 * Validate the current step: the step's own range check first (friendly message), then the
 * core rules (validateAnswers), so cross-field rules such as kingdom day vs stage also block.
 */
export function validateStep(s: FlowState): { value: unknown } | { error: string } {
  const q = questionAt(s.step);
  if (!q) return { error: "Não há pergunta neste passo." };
  const r = parseStep(q, currentValue(s, q));
  if ("error" in r || q.id === "playingAs") return r;
  const all = validateAnswers({ ...normalizeAnswers(s.answers), [q.id]: r.value });
  if ("errors" in all) {
    const mine = all.errors.find((e) => e.field === q.id);
    if (mine) return { error: mine.message };
  }
  return r;
}

function advance(s: FlowState, value: unknown): FlowState {
  const q = questionAt(s.step)!;
  const answers = { ...s.answers, [q.id]: value };
  const step = s.review ? SUMMARY : Math.min(s.step + 1, SUMMARY);
  return { step, answers, review: step === SUMMARY ? false : s.review, error: null };
}

/** Next: commit the answer when valid, otherwise stay with a how-to-fix error. */
export function next(s: FlowState): FlowState {
  if (isSummary(s)) return s;
  const r = validateStep(s);
  if ("error" in r) return { ...s, error: r.error };
  return advance(s, r.value);
}

/** Back keeps every answer, including one being typed. */
export function back(s: FlowState): FlowState {
  if (s.step === 0) return { ...s, error: null };
  return { ...s, step: s.step - 1, review: false, error: null };
}

export const canSkip = (s: FlowState): boolean => questionAt(s.step)?.nullable === true;

/** Skip a nullable question: stores null ("I don't know") and moves on. */
export function skip(s: FlowState): FlowState {
  if (!canSkip(s)) return s;
  return advance(s, null);
}

/** "Change" on the summary: open that question; Next returns to the summary. */
export function edit(s: FlowState, step: number): FlowState {
  if (!questionAt(step)) return s;
  return { ...s, step, review: true, error: null };
}

// ---------------------------------------------------------------------------
// Draft and resume

export function toDraft(s: FlowState): Draft {
  return { step: s.step, answers: { ...s.answers } };
}

const isPrimitive = (v: unknown): boolean =>
  v === null || typeof v === "string" || typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v));

/** Read a stored draft; null when it is missing or not a draft. Unknown keys are dropped. */
export function fromDraft(raw: unknown): FlowState | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const d = raw as Record<string, unknown>;
  const a = d.answers;
  if (typeof a !== "object" || a === null || Array.isArray(a)) return null;
  const answers: Answers = {};
  for (const id of [...QUESTIONS.map((q) => q.id), PLAYING_AS_QUESTION.id] as StepId[]) {
    const v = (a as Record<string, unknown>)[id];
    if (v !== undefined && isPrimitive(v)) answers[id] = v;
  }
  const step = typeof d.step === "number" && Number.isInteger(d.step) && d.step >= 0 ? Math.min(d.step, SUMMARY) : 0;
  return { step, answers, review: false, error: null };
}

export function answersFromProfile(p: AccountProfile): Answers {
  const out: Answers = {};
  for (const q of QUESTIONS) out[q.id] = (p as unknown as Record<string, unknown>)[q.id];
  return out;
}

/**
 * Where the onboarding opens: the draft in progress (same step), else the saved profile
 * pre-filled on the summary ("Edit answers"), else the first question. A draft saved by the
 * old 10-question flow keeps its answers; a step past the new summary opens the summary.
 */
export function resume(saved: { draft: unknown; profileCode: string | null; playingAs?: PlayingAs }): FlowState {
  const fromD = fromDraft(saved.draft);
  if (fromD) return fromD;
  if (saved.profileCode) {
    const r = decodeProfile(saved.profileCode);
    if ("profile" in r) {
      return { step: SUMMARY, answers: { ...answersFromProfile(r.profile), playingAs: saved.playingAs ?? "player" }, review: false, error: null };
    }
  }
  return initialState();
}

// ---------------------------------------------------------------------------
// Summary

export type Outcome =
  | { ok: true; profile: AccountProfile; warnings: string[]; code: string; playingAs: PlayingAs }
  | { ok: false; errors: { step: number; message: string }[] };

const asPlayingAs = (v: unknown): PlayingAs => (PLAYING_AS.includes(v as PlayingAs) ? (v as PlayingAs) : "player");

/**
 * Final validation with validateAnswers; warnings are profileWarnings (returned by it). Optional
 * answers carried over from a saved profile are kept. "Playing as" sets the profile's account
 * role only where they disagree: a leader becomes "Alliance / kingdom leader" (adds the kingdom
 * admin guide); a player whose profile said leader goes back to the default role.
 */
export function finish(answers: Answers): Outcome {
  const playingAs = asPlayingAs(answers.playingAs);
  const typed = normalizeAnswers(answers);
  if (playingAs === "leader") typed.role = "lider";
  else if (typed.role === "lider") delete typed.role;
  let r = validateAnswers(typed);
  let cleared: string[] = [];
  // An optional answer kept from the saved profile (e.g. kingdom day) that no longer fits a new
  // onboarding answer (e.g. kingdom stage) is cleared, not blocking: it is not on screen here.
  if ("errors" in r && r.errors.every((e) => (OPTIONAL_IDS as readonly string[]).includes(e.field))) {
    cleared = [...new Set(r.errors.map((e) => e.field))];
    for (const f of cleared) delete typed[f];
    r = validateAnswers(typed);
  }
  if ("errors" in r) {
    return {
      ok: false,
      // An error on an optional answer (never shown here) points at the first step.
      errors: r.errors.map((e) => ({ step: Math.max(0, STEPS.findIndex((q) => q.id === e.field)), message: e.message })),
    };
  }
  const notes = cleared.map((f) => `${QUESTIONS.find((q) => q.id === f)?.label ?? f} Sua resposta antiga deixou de combinar e foi apagada. Informe-a de novo na aba Eu.`);
  return { ok: true, profile: r.profile, warnings: [...notes, ...r.warnings], code: encodeProfile(r.profile), playingAs };
}

/** Where the onboarding ends: the role's home tab (City Hall or Kingdom), not the long guide. */
export function homeUrl(playingAs: PlayingAs): string {
  return HOME_FOR[playingAs];
}

export function guideUrl(code: string): string {
  return `/guide/?p=${encodeURIComponent(code)}`;
}

/** Answer text for the summary. Option and preset labels come from the core. */
export function answerText(q: FlowQuestion, value: unknown): string {
  const options = q.type === "choice" ? (q.options as ReadonlyArray<QuestionOption<unknown>>) : [];
  if (value === null) return q.type === "choice" ? (options.find((o) => o.value === null)?.label ?? "Pulada") : "Pulada";
  if (q.type === "boolean") return value ? "Sim" : "Não";
  if (q.type === "choice") return options.find((o) => o.value === value)?.label ?? String(value);
  const n = typeof value === "number" ? value : Number(cleanNumberText(String(value)));
  if (!Number.isFinite(n)) return String(value);
  return `${fmt(n)}${q.unit ? ` ${q.unit}` : ""}`;
}

/** Close target: the previous page on this site, else the home page. */
export function closeTarget(referrer: string, origin: string): string {
  try {
    const u = new URL(referrer);
    if (u.origin === origin && !u.pathname.startsWith("/start")) return u.pathname + u.search + u.hash;
  } catch {
    // empty or malformed referrer
  }
  return "/";
}
