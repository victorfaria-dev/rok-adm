import { Fragment } from "preact";
import type { Confidence as Level } from "@rokadm/core";

const TEXT: Record<Level, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  pending: "Pending measurement",
};

/** Confidence in words (never colour alone). Low and pending get a visible label. */
export function Confidence({ level, short = false }: { level: Level; short?: boolean }) {
  const flagged = level === "low" || level === "pending";
  return (
    <span class={`g-conf g-conf-${level}`} data-confidence={level}>
      <span class="g-conf-mark" aria-hidden="true" />
      {flagged && !short ? <strong>{TEXT[level]}</strong> : TEXT[level]}
    </span>
  );
}

/** Fact card ids as plain text (no links: the cards are not published pages yet). */
export function FactIds({ ids }: { ids: readonly string[] }) {
  if (ids.length === 0) return null;
  return (
    <span class="g-facts">
      <span class="visually-hidden">Fact cards: </span>
      {ids.map((id, n) => (
        <Fragment key={id}>
          {n > 0 && ", "}
          <span class="mono">{id}</span>
        </Fragment>
      ))}
    </span>
  );
}
