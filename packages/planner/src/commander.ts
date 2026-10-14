// F-20 Commander Decision Checklist (+ shelf-life tags). Declarative rules in data/.
import type { Confidence, KingdomStage } from "@rokadm/core";
import checklistJson from "../data/commander-checklist.json";
import shelfJson from "../data/commander-shelf-life.json";
import { confidenceOf, indexFacts, minConfidence, BUNDLED_FACTS, type FactMeta } from "./facts";

export type Verdict = "go" | "wait" | "avoid";
export type RuleEffect = Verdict | "info";

export interface ChecklistOption { id: string; label: string }
export interface ChecklistQuestion { id: string; text: string; required: boolean; options: ChecklistOption[]; facts: string[] }
export interface ChecklistRule {
  id: string;
  when: Record<string, string[]>;
  effect: RuleEffect;
  text: string;
  facts: string[];
  /** Community divided or single-source view. */
  split: boolean;
}
export interface CommanderChecklist { asOf: string; audience: string[]; questions: ChecklistQuestion[]; rules: ChecklistRule[] }

export const COMMANDER_CHECKLIST = checklistJson as unknown as CommanderChecklist;

export type CommanderAnswers = Partial<Record<string, string>>;

export interface CommanderReason {
  ruleId: string;
  effect: RuleEffect | "unanswered";
  text: string;
  facts: string[];
  split: boolean;
  confidence: Confidence;
}

export interface CommanderDecision {
  verdict: Verdict;
  /** Reasons that drive the verdict first (avoid → wait → go), then info. */
  reasons: CommanderReason[];
  /** All fact IDs behind the reasons. */
  facts: string[];
  /** true when at least one deciding reason is a divided/single-source view. */
  hasSplitViews: boolean;
  /** Overall confidence = weakest deciding reason (strategy content: medium at best). */
  confidence: Confidence;
  unanswered: string[];
}

const ORDER: Record<CommanderReason["effect"], number> = { avoid: 0, wait: 1, unanswered: 2, go: 3, info: 4 };

/** Validates answers against the checklist; throws on unknown question/option IDs. */
export function validateAnswers(answers: CommanderAnswers, checklist: CommanderChecklist = COMMANDER_CHECKLIST): void {
  for (const [q, a] of Object.entries(answers)) {
    if (a === undefined) continue;
    const question = checklist.questions.find((x) => x.id === q);
    if (!question) throw new Error(`Unknown checklist question: ${q}`);
    if (!question.options.some((o) => o.id === a)) throw new Error(`Unknown option "${a}" for question ${q}`);
  }
}

function ruleFires(rule: ChecklistRule, answers: CommanderAnswers): boolean {
  return Object.entries(rule.when).every(([q, opts]) => {
    const a = answers[q];
    return a !== undefined && opts.includes(a);
  });
}

/**
 * Evaluates the checklist. avoid if any avoid rule fires; else wait if any wait rule
 * fires or a required question is unanswered; else go (needs at least one go reason).
 */
export function evaluateCommanderDecision(
  answers: CommanderAnswers,
  opts: { checklist?: CommanderChecklist; facts?: readonly FactMeta[] } = {},
): CommanderDecision {
  const checklist = opts.checklist ?? COMMANDER_CHECKLIST;
  validateAnswers(answers, checklist);
  const index = indexFacts(opts.facts ?? BUNDLED_FACTS);

  const reasons: CommanderReason[] = [];
  for (const rule of checklist.rules) {
    if (!ruleFires(rule, answers)) continue;
    let c = confidenceOf(rule.facts, index);
    if (rule.split) c = minConfidence(c, "low");
    reasons.push({ ruleId: rule.id, effect: rule.effect, text: rule.text, facts: [...rule.facts], split: rule.split, confidence: c });
  }
  const unanswered = checklist.questions.filter((q) => q.required && answers[q.id] === undefined).map((q) => q.id);
  for (const q of unanswered) {
    const question = checklist.questions.find((x) => x.id === q);
    reasons.push({
      ruleId: `unanswered:${q}`, effect: "unanswered", text: `Responda primeiro: ${question?.text ?? q}`,
      facts: [...(question?.facts ?? [])], split: false, confidence: "pending",
    });
  }
  reasons.sort((a, b) => ORDER[a.effect] - ORDER[b.effect]);

  const has = (e: CommanderReason["effect"]) => reasons.some((r) => r.effect === e);
  const verdict: Verdict = has("avoid") ? "avoid" : has("wait") || has("unanswered") || !has("go") ? "wait" : "go";
  if (!has("avoid") && !has("wait") && !has("unanswered") && !has("go")) {
    reasons.push({ ruleId: "no-go-reason", effect: "wait", text: "Suas respostas não trouxeram nenhum motivo para investir.", facts: [], split: false, confidence: "pending" });
  }
  const deciding = reasons.filter((r) => r.effect === verdict || (verdict === "wait" && r.effect === "unanswered"));
  const facts = [...new Set(reasons.flatMap((r) => r.facts))].sort();
  const decidingConf = deciding.map((r) => r.confidence).filter((c) => c !== "pending");
  return {
    verdict,
    reasons,
    facts,
    hasSplitViews: deciding.some((r) => r.split),
    confidence: decidingConf.length ? minConfidence(...decidingConf) : "pending",
    unanswered,
  };
}

// ---------------------------------------------------------------------------
// Shelf-life tags

export interface CommanderShelfLife {
  id: string;
  name: string;
  rarity: string | null;
  shelfLife: "long_term" | "kvk1_only" | "no_priority" | "unknown";
  usefulStages: KingdomStage[];
  suggested: CommanderAnswers;
  facts: string[];
  split: boolean;
  note: string;
}

export const COMMANDER_SHELF_LIFE: readonly CommanderShelfLife[] =
  (shelfJson as unknown as { commanders: CommanderShelfLife[] }).commanders;
export const SHELF_LIFE_AS_OF: string = (shelfJson as { asOf: string }).asOf;

export function getShelfLife(commanderId: string): CommanderShelfLife | undefined {
  return COMMANDER_SHELF_LIFE.find((c) => c.id === commanderId);
}

/** Prefills checklist answers from the shelf-life table; the player's own answers win. */
export function suggestAnswers(commanderId: string, own: CommanderAnswers = {}): CommanderAnswers {
  const tag = getShelfLife(commanderId);
  return { ...(tag?.suggested ?? {}), ...own };
}
