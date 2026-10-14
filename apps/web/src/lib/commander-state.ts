// F-20 /commanders: pure helpers between the stored answers (StoreV1.commanders) and the planner.
// The planner throws on unknown question/option ids, so everything read from storage or the
// shelf-life table goes through sanitizeAnswers() before evaluateCommanderDecision().
import { QUESTIONS, type Confidence, type KingdomStage } from "@rokadm/core";
import {
  COMMANDER_CHECKLIST,
  COMMANDER_SHELF_LIFE,
  evaluateCommanderDecision,
  suggestAnswers,
  type CommanderChecklist,
  type CommanderDecision,
  type CommanderReason,
  type CommanderShelfLife,
  type Verdict,
} from "@rokadm/planner";

/** Answers as stored: question id → option id. */
export type Answers = Record<string, string>;
export type AnswersMap = Record<string, Answers>;

/** Entry for commanders that are not in the shelf-life table. */
export const OTHER_ID = "other";
export const OTHER_NAME = "Outro comandante";

export interface CommanderChoice { id: string; name: string }

/** Picker entries: table commanders A to Z, then "Another commander". */
export const COMMANDER_CHOICES: readonly CommanderChoice[] = [
  ...[...COMMANDER_SHELF_LIFE].map((c) => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
  { id: OTHER_ID, name: OTHER_NAME },
];

/**
 * Table commanders plus every other commander the picker shows (A to Z, "Another commander" last).
 * Commanders outside the shelf-life table get nothing prefilled, like "Another commander", but keep their name.
 */
export function withRoster(extra: readonly CommanderChoice[]): CommanderChoice[] {
  const byId = new Map<string, CommanderChoice>();
  for (const c of [...COMMANDER_CHOICES, ...extra]) if (c.id !== OTHER_ID && !byId.has(c.id)) byId.set(c.id, { id: c.id, name: c.name });
  return [...[...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "en")), { id: OTHER_ID, name: OTHER_NAME }];
}

export function isCommanderId(id: unknown, choices: readonly CommanderChoice[] = COMMANDER_CHOICES): id is string {
  return typeof id === "string" && choices.some((c) => c.id === id);
}

export function commanderName(id: string, choices: readonly CommanderChoice[] = COMMANDER_CHOICES): string {
  return choices.find((c) => c.id === id)?.name ?? id;
}

/** "#sun-tzu" → "sun-tzu"; anything that is not a known commander → null. */
export function commanderFromHash(hash: string, choices: readonly CommanderChoice[] = COMMANDER_CHOICES): string | null {
  let id = hash.startsWith("#") ? hash.slice(1) : hash;
  try {
    id = decodeURIComponent(id);
  } catch {
    return null;
  }
  return isCommanderId(id, choices) ? id : null;
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/** Keeps only answers whose question and option exist in the checklist. Never throws. */
export function sanitizeAnswers(raw: unknown, checklist: CommanderChecklist = COMMANDER_CHECKLIST): Answers {
  const out: Answers = {};
  if (!isRecord(raw)) return out;
  for (const q of checklist.questions) {
    const a = raw[q.id];
    if (typeof a === "string" && q.options.some((o) => o.id === a)) out[q.id] = a;
  }
  return out;
}

export interface Prefilled {
  /** Suggestions from the shelf-life table, overridden by the player's own answers. */
  answers: Answers;
  /** Question ids whose answer is a suggestion the player has not confirmed or changed. */
  suggested: string[];
}

/** Player's own answers win over the table's suggestions (planner suggestAnswers). */
export function prefill(id: string, ownRaw: unknown): Prefilled {
  const own = sanitizeAnswers(ownRaw);
  const answers = sanitizeAnswers(suggestAnswers(id, own));
  const suggested = Object.keys(answers).filter((q) => !(q in own));
  return { answers, suggested };
}

export function decide(id: string, ownRaw: unknown): CommanderDecision {
  return evaluateCommanderDecision(prefill(id, ownRaw).answers);
}

/** Map with one answer set for a commander; unknown question/option leaves the map as is. */
export function setAnswer(map: AnswersMap, id: string, question: string, option: string): AnswersMap {
  const q = COMMANDER_CHECKLIST.questions.find((x) => x.id === question);
  if (!q || !q.options.some((o) => o.id === option)) return map;
  return { ...map, [id]: { ...sanitizeAnswers(map[id]), [question]: option } };
}

/** The player accepts every suggestion shown for the commander as their own answer. */
export function confirmSuggestions(map: AnswersMap, id: string): AnswersMap {
  const { answers } = prefill(id, map[id]);
  if (Object.keys(answers).length === 0) return map;
  return { ...map, [id]: answers };
}

export function clearCommander(map: AnswersMap, id: string): AnswersMap {
  const { [id]: _gone, ...rest } = map;
  return rest;
}

export interface SavedCheck {
  id: string;
  name: string;
  answered: number;
  verdict: Verdict;
}

/** Commanders with at least one valid saved answer, A to Z ("Another commander" last). */
export function savedChecks(map: unknown, choices: readonly CommanderChoice[] = COMMANDER_CHOICES): SavedCheck[] {
  if (!isRecord(map)) return [];
  return choices.flatMap((c) => {
    const own = sanitizeAnswers(map[c.id]);
    const answered = Object.keys(own).length;
    return answered > 0 ? [{ id: c.id, name: c.name, answered, verdict: decide(c.id, own).verdict }] : [];
  });
}

// ---------------------------------------------------------------------------
// Text shown to the player

export const SHELF_LIFE_TEXT: Record<CommanderShelfLife["shelfLife"], string> = {
  long_term: "Útil a longo prazo: além do KvK1 e até a Temporada de Conquista",
  kvk1_only: "Útil até o KvK1: perde valor depois",
  no_priority: "Sem prioridade para F2P",
  unknown: "Validade desconhecida",
};

const STAGE_QUESTION = QUESTIONS.find((q) => q.id === "kingdomStage");
const STAGE_OPTIONS = STAGE_QUESTION?.type === "choice" ? STAGE_QUESTION.options : [];

/** Stage label from the questionnaire (same words everywhere). */
export function stageLabel(stage: KingdomStage): string {
  return STAGE_OPTIONS.find((o) => o.value === stage)?.label ?? stage;
}

export const VERDICT_TEXT: Record<Verdict, { word: string; summary: string }> = {
  go: { word: "Vale a pena", summary: "Suas respostas apoiam este investimento. Leia os motivos antes de gastar." },
  wait: { word: "Espere", summary: "Guarde suas esculturas por enquanto. Os motivos abaixo dizem o que mudaria isso." },
  avoid: { word: "Evite", summary: "Suas respostas combinam com uma escolha que os guias F2P desaconselham." },
};

export const CONFIDENCE_TEXT: Record<Confidence, string> = {
  high: "Confiança alta",
  medium: "Confiança média",
  low: "Confiança baixa",
  pending: "Pendente",
};

export const EFFECT_TEXT: Record<CommanderReason["effect"], string> = {
  avoid: "Contra",
  wait: "Espere",
  unanswered: "Falta resposta",
  go: "A favor",
  info: "Nota",
};

export { getShelfLife, SHELF_LIFE_AS_OF, COMMANDER_CHECKLIST } from "@rokadm/planner";
export type { CommanderDecision, CommanderReason, CommanderShelfLife, Verdict } from "@rokadm/planner";
