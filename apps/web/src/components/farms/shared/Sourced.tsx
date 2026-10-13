import type { JSX } from "preact";

export type Confidence = "high" | "medium" | "low" | "pending";

const LABEL: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  pending: "Pending in-game check",
};

/** Confidence as text plus a token-coloured dot (never colour alone). */
export function ConfidencePill({ confidence }: { confidence: Confidence }): JSX.Element {
  return <span class={`fm-pill fm-pill-${confidence}`}>{LABEL[confidence]}</span>;
}

export function HypothesisPill(): JSX.Element {
  return <span class="fm-pill fm-pill-hypothesis">Hypothesis, not sourced</span>;
}

interface SourcedProps {
  confidence: Confidence;
  facts: readonly string[];
  gaps?: readonly string[];
  hypothesis?: boolean;
}

/** One line under a recommendation: confidence, hypothesis label, fact cards, open gaps. */
export function Sourced({ confidence, facts, gaps = [], hypothesis = false }: SourcedProps): JSX.Element {
  return (
    <p class="fm-sourced">
      <ConfidencePill confidence={confidence} />
      {hypothesis && <HypothesisPill />}
      {facts.length > 0 && <span class="fm-cards mono">Sources: {facts.join(", ")}</span>}
      {gaps.length > 0 && <span class="fm-gaps mono">Pending measurement: {gaps.join(", ")}</span>}
    </p>
  );
}
