// Usability policy (research/schemas/fato.md): a fact backs a firm statement only if
// status = verificado AND confianca >= media. Anything else must be shown as uncertain.
import type { Fact, UsabilityPolicy } from "@rokadm/core";

export const CONFIDENCE_RANK: Record<Fact["confidence"], number> = { baixa: 0, media: 1, alta: 2 };

export const DEFAULT_POLICY: UsabilityPolicy = Object.freeze({
  minConfidence: "media",
  allowedStatuses: Object.freeze(["verificado"]) as Fact["status"][],
}) as UsabilityPolicy;

export function isUsable(fact: Pick<Fact, "confidence" | "status">, policy: UsabilityPolicy = DEFAULT_POLICY): boolean {
  return policy.allowedStatuses.includes(fact.status) && CONFIDENCE_RANK[fact.confidence] >= CONFIDENCE_RANK[policy.minConfidence];
}

/** Lowest confidence of a set (a derived number is only as good as its weakest input). */
export function minConfidence(levels: Fact["confidence"][]): Fact["confidence"] {
  if (levels.length === 0) throw new Error("minConfidence of empty set");
  return levels.reduce((a, b) => (CONFIDENCE_RANK[b] < CONFIDENCE_RANK[a] ? b : a));
}
