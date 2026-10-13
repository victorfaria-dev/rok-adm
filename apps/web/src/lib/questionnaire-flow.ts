// Questionnaire step machine (plan §4, screen 2). Pure functions, no DOM and no storage:
// the island owns side effects. Questions, options, limits and defaults all come from
// QUESTIONS in @rokadm/core; this file only adds navigation and how-to-fix messages.
import {
  QUESTIONS,
  decodeProfile,
  encodeProfile,
  validateAnswers,
  type AccountProfile,
  type NumberQuestion,
  type Question,
  type QuestionId,
} from "@rokadm/core";

/** Raw answers keyed by question id. Number answers may be the text being typed. */
export type Answers = Partial<Record<QuestionId, unknown>>;

export interface FlowState {
  /** 0..QUESTIONS.length - 1 is a question; SUMMARY is the final review step. */
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

export const TOTAL = QUESTIONS.length;
export const SUMMARY = TOTAL;

export function initialState(): FlowState {
  return { step: 0, answers: {}, review: false, error: null };
}

export function questionAt(step: number): Question | null {
  return QUESTIONS[step] ?? null;
}

export const isSummary = (s: FlowState): boolean => s.step === SUMMARY;

/** The value shown for a question: the answer, or the core default when unanswered. */
export function currentValue(s: FlowState, q: Question): unknown {
  const v = s.answers[q.id];
  return v === undefined ? q.default : v;
}

export function setAnswer(s: FlowState, value: unknown): FlowState {
  const q = questionAt(s.step);
  if (!q) return s;
  return { ...s, answers: { ...s.answers, [q.id]: value }, error: null };
}

const fmt = (n: number): string => n.toLocaleString("en-US");

/** "from 1 to 25", "from 0 to 10,000,000 USD". */
export function rangeText(q: NumberQuestion): string {
  return `from ${fmt(q.min)} to ${fmt(q.max)}${q.unit ? ` ${q.unit}` : ""}`;
}

/** Text typed in a number field: spaces, commas and underscores are digit grouping. */
export function cleanNumberText(raw: string): string {
  return raw.replace(/[\s,_]/g, "");
}

/** Parse one number answer; errors say how to fix it. */
export function parseNumberAnswer(q: NumberQuestion, raw: unknown): { value: number | null } | { error: string } {
  if (raw === null || raw === undefined || (typeof raw === "string" && cleanNumberText(raw) === "")) {
    if (q.nullable) return { value: null };
    return { error: `Enter a number ${rangeText(q)}.` };
  }
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(cleanNumberText(raw)) : NaN;
  if (typeof raw === "string" && !/^-?\d*\.?\d*$/.test(cleanNumberText(raw))) {
    return { error: `Use digits only: a whole number ${rangeText(q)}.` };
  }
  if (!Number.isFinite(n)) return { error: `Use digits only: a whole number ${rangeText(q)}.` };
  if (q.integer && !Number.isInteger(n)) return { error: `Use a whole number ${rangeText(q)}.` };
  if (n < q.min || n > q.max) return { error: `${fmt(n)} is out of range. Enter a number ${rangeText(q)}.` };
  return { value: n };
}

/** Parse a step's answer into the value stored when the step is committed. */
export function parseStep(q: Question, raw: unknown): { value: unknown } | { error: string } {
  if (q.type === "number") return parseNumberAnswer(q, raw);
  if (q.type === "boolean") {
    return typeof raw === "boolean" ? { value: raw } : { error: "Pick Yes or No." };
  }
  if (raw === null && q.nullable) return { value: null };
  return q.options.some((o) => o.value === raw) ? { value: raw } : { error: "Pick one of the options." };
}

/** Answers as typed values for validateAnswers: number text parsed, unanswered left out. */
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
  if (!q) return { error: "No question at this step." };
  const r = parseStep(q, currentValue(s, q));
  if ("error" in r) return r;
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
  for (const q of QUESTIONS) {
    const v = (a as Record<string, unknown>)[q.id];
    if (v !== undefined && isPrimitive(v)) answers[q.id] = v;
  }
  const step = typeof d.step === "number" && Number.isInteger(d.step) && d.step >= 0 && d.step <= SUMMARY ? d.step : 0;
  return { step, answers, review: false, error: null };
}

export function answersFromProfile(p: AccountProfile): Answers {
  const out: Answers = {};
  for (const q of QUESTIONS) out[q.id] = (p as unknown as Record<string, unknown>)[q.id];
  return out;
}

/**
 * Where the questionnaire opens: the draft in progress (same step), else the saved profile
 * pre-filled on the summary ("Edit answers"), else the first question.
 */
export function resume(saved: { draft: unknown; profileCode: string | null }): FlowState {
  const fromD = fromDraft(saved.draft);
  if (fromD) return fromD;
  if (saved.profileCode) {
    const r = decodeProfile(saved.profileCode);
    if ("profile" in r) return { step: SUMMARY, answers: answersFromProfile(r.profile), review: false, error: null };
  }
  return initialState();
}

// ---------------------------------------------------------------------------
// Summary

export type Outcome =
  | { ok: true; profile: AccountProfile; warnings: string[]; code: string }
  | { ok: false; errors: { step: number; message: string }[] };

/** Final validation with validateAnswers; warnings are profileWarnings (returned by it). */
export function finish(answers: Answers): Outcome {
  const r = validateAnswers(normalizeAnswers(answers));
  if ("errors" in r) {
    return {
      ok: false,
      errors: r.errors.map((e) => ({ step: Math.max(0, QUESTIONS.findIndex((q) => q.id === e.field)), message: e.message })),
    };
  }
  return { ok: true, profile: r.profile, warnings: r.warnings, code: encodeProfile(r.profile) };
}

export function guideUrl(code: string): string {
  return `/guide/?p=${encodeURIComponent(code)}`;
}

/** Answer text for the summary. Option and preset labels come from the core. */
export function answerText(q: Question, value: unknown): string {
  if (value === null) return q.type === "choice" ? (q.options.find((o) => o.value === null)?.label ?? "Skipped") : "Skipped";
  if (q.type === "boolean") return value ? "Yes" : "No";
  if (q.type === "choice") return q.options.find((o) => o.value === value)?.label ?? String(value);
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
