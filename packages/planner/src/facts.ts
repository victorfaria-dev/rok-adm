import type { Confidence, Fact } from "@rokadm/core";
import factsMetaJson from "../data/facts-meta.json";

/**
 * The part of a fact card the planner needs. Compatible with `Fact` from @rokadm/core,
 * so a full Fact[] from @rokadm/data can be passed instead of the bundled index.
 */
export type FactMeta = Pick<Fact, "id" | "title" | "confidence" | "status"> &
  Partial<Pick<Fact, "invalidatedBy" | "validUntil">> & { consensus?: string };

export type FactIndex = ReadonlyMap<string, FactMeta>;

export const BUNDLED_FACTS: readonly FactMeta[] = (factsMetaJson as { facts: Array<FactMeta & { status: string }> })
  .facts as unknown as FactMeta[];

export function indexFacts(facts: readonly FactMeta[] = BUNDLED_FACTS): FactIndex {
  return new Map(facts.map((f) => [f.id, f]));
}

const RANK: Record<Confidence, number> = { pending: 0, low: 1, medium: 2, high: 3 };

export function minConfidence(...cs: Confidence[]): Confidence {
  if (cs.length === 0) return "pending";
  return cs.reduce((a, b) => (RANK[b] < RANK[a] ? b : a));
}

/** Card confidence → app confidence; contested/obsolete statuses cap at low. */
export function factConfidence(f: FactMeta | undefined): Confidence {
  if (!f) return "pending";
  const base: Confidence = f.confidence === "alta" ? "high" : f.confidence === "media" ? "medium" : "low";
  if (f.status === "contestado" || f.status === "obsoleto" || f.status === "parcialmente_obsoleto") return minConfidence(base, "low");
  return base;
}

/** Confidence of a statement that rests on all `ids` (weakest link). Missing facts → pending. */
export function confidenceOf(ids: readonly string[], index: FactIndex): Confidence {
  return minConfidence(...ids.map((id) => factConfidence(index.get(id))));
}

export function missingFacts(ids: readonly string[], index: FactIndex): string[] {
  return ids.filter((id) => !index.has(id));
}
