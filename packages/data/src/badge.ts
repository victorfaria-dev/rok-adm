// Label data for the "Verified on patch X" badge (F-50).
import type { Fact, UsabilityPolicy } from "@rokadm/core";
import { DEFAULT_POLICY, isUsable } from "./policy";

export interface FactBadge {
  factId: string;
  confidence: Fact["confidence"];
  status: Fact["status"];
  /** Patch the fact was verified on / is valid from; null = unknown patch. */
  patch: string | null;
  /** Last date a source confirmed the fact (data_validade). */
  verifiedOn: string | null;
  /** Distinct source slugs cited (copies are not flagged in the contract; see NOTES.md). */
  sourceCount: number;
  /** True when the fact may back a firm statement under the policy. */
  usable: boolean;
  /** Short pt-BR label, e.g. "Verificado no patch 1.1.09 · 2026-06-30" or "Não verificado". */
  label: string;
}

export function factBadge(fact: Fact, policy: UsabilityPolicy = DEFAULT_POLICY): FactBadge {
  const usable = isUsable(fact, policy);
  const sourceCount = new Set(fact.sources.map((s) => s.id)).size;
  let label: string;
  if (fact.status === "obsoleto") label = "Desatualizado";
  else if (fact.status === "contestado") label = "Contestado";
  else if (!usable) label = "Não verificado";
  else {
    const parts = [fact.patch ? `Verificado no patch ${fact.patch}` : "Verificado (patch desconhecido)"];
    if (fact.validUntil) parts.push(fact.validUntil);
    label = parts.join(" · ");
  }
  return { factId: fact.id, confidence: fact.confidence, status: fact.status, patch: fact.patch, verifiedOn: fact.validUntil, sourceCount, usable, label };
}
