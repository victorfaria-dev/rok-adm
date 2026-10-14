import { Fragment } from "preact";
import type { Confidence } from "@rokadm/core";
import type { Cite as CiteData } from "@rokadm/planner/tools";

const TEXT: Record<Confidence, string> = {
  high: "Confiança alta",
  medium: "Confiança média",
  low: "Confiança baixa",
  pending: "Medição pendente",
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

/** Fact ids + confidence (+ "Reverificar" when a card predates the latest official patch). */
export function Cite({ cite }: { cite: CiteData }) {
  return (
    <span class="t-cite">
      {cite.facts.length > 0 ? (
        <span class="t-facts">
          <span class="visually-hidden">Fichas de fonte: </span>
          {cite.facts.map((id, i) => (
            <Fragment key={id}>
              {i > 0 && ", "}
              <span class="mono">{id}</span>
            </Fragment>
          ))}
        </span>
      ) : null}
      <ConfidenceTag level={cite.facts.length ? cite.confidence : "pending"} />
      {cite.stale ? <StaleTag ids={cite.staleFacts ?? []} /> : null}
    </span>
  );
}

/** "Reverificar" with the card ids that need it, visible and in the tooltip (Q2 P3). */
export function StaleTag({ ids }: { ids: readonly string[] }) {
  const why = "Confirmado antes do último patch oficial";
  return (
    <span class="t-stale" data-stale-ids={ids.join(" ")} title={ids.length ? `${why}: ${ids.join(", ")}` : why}>
      Reverificar{ids.length ? <>: <span class="mono">{ids.join(", ")}</span></> : null}
    </span>
  );
}

/** Marks a user-entered value that no fact card covers. */
export function PendingTag() {
  return <span class="t-pending">Medição pendente</span>;
}
