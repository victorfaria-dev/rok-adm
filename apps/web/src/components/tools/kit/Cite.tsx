import { Fragment } from "preact";
import type { Confidence } from "@rokadm/core";
import type { Cite as CiteData } from "@rokadm/planner/tools";

const TEXT: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  pending: "Pending measurement",
};

/** Confidence in words (never colour alone). */
export function ConfidenceTag({ level }: { level: Confidence }) {
  return (
    <span class={`t-conf t-conf-${level}`} data-confidence={level}>
      <span class="t-conf-mark" aria-hidden="true" />
      {level === "low" || level === "pending" ? <strong>{TEXT[level]}</strong> : TEXT[level]}
    </span>
  );
}

/** Fact ids + confidence (+ "Re-verify" when a card predates the latest official patch). */
export function Cite({ cite }: { cite: CiteData }) {
  return (
    <span class="t-cite">
      {cite.facts.length > 0 ? (
        <span class="t-facts">
          <span class="visually-hidden">Fact cards: </span>
          {cite.facts.map((id, i) => (
            <Fragment key={id}>
              {i > 0 && ", "}
              <span class="mono">{id}</span>
            </Fragment>
          ))}
        </span>
      ) : null}
      <ConfidenceTag level={cite.facts.length ? cite.confidence : "pending"} />
      {cite.stale ? <span class="t-stale">Re-verify</span> : null}
    </span>
  );
}

/** Marks a user-entered value that no fact card covers. */
export function PendingTag() {
  return <span class="t-pending">Pending measurement</span>;
}
