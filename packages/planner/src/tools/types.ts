// Client-safe calculator core (F-81). Nothing in src/tools/ may import JSON data or the
// fact dataset: islands import this module, and every number reaches it as an argument
// (lean payloads built at build time by apps/web/src/lib/tools-payload.ts).
import type { Confidence } from "@rokadm/core";

/** Where a number comes from: fact card ids and the weakest confidence among them. */
export interface Cite {
  facts: string[];
  confidence: Confidence;
  /** True when a card's validity date is older than the build date ("re-verify"). */
  stale?: boolean;
}

/** A sourced input value that a calculator reads (from tools-data or a table). */
export interface SourcedValue<T = number> extends Cite {
  value: T;
  unit?: string;
}

/** A calculator result: the value plus what it rests on. */
export interface Calc<T> {
  value: T;
  facts: string[];
  /** Readings and assumptions shown next to the number. */
  assumptions: string[];
  /** Names of user-entered inputs that the facts don't cover (shown as "pending measurement"). */
  pending: string[];
}

export const CONF_RANK: Record<Confidence, number> = { pending: 0, low: 1, medium: 2, high: 3 };

export function weakest(...cs: Confidence[]): Confidence {
  if (cs.length === 0) return "pending";
  return cs.reduce((a, b) => (CONF_RANK[b] < CONF_RANK[a] ? b : a));
}

/** Merge citations: union of fact ids (sorted), weakest confidence, stale if any is. */
export function mergeCites(...cs: Cite[]): Cite {
  const facts = [...new Set(cs.flatMap((c) => c.facts))].sort();
  return { facts, confidence: weakest(...cs.map((c) => c.confidence)), stale: cs.some((c) => c.stale) };
}

/** Finite, non-negative number or the fallback (inputs come from forms and storage). */
export function nonNeg(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;
}
