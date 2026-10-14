import type { ComponentChildren } from "preact";
import type { Cite as CiteData } from "@rokadm/planner/tools";
import { Cite } from "./Cite";

interface RowProps {
  label: string;
  value: ComponentChildren;
  cite: CiteData;
  /** Readings/assumptions the number depends on. */
  notes?: readonly string[];
  /** Inputs no card covers that this number uses. */
  pending?: readonly string[];
  testId?: string;
}

/** One result: label, big number, where it comes from. */
export function ResultRow({ label, value, cite, notes = [], pending = [], testId }: RowProps) {
  return (
    <div class="t-result" data-testid={testId}>
      <dt>{label}</dt>
      <dd>
        <span class="t-value mono">{value}</span>
        <Cite cite={cite} />
        {pending.length ? <span class="t-note">Usa o seu próprio valor para: {pending.join(", ")} (medição pendente).</span> : null}
        {notes.map((n) => <span class="t-note" key={n}>{n}</span>)}
      </dd>
    </div>
  );
}

/** Results live region: screen readers hear updates without focus moving. */
export function Results({ title = "Resultado", children }: { title?: string; children: ComponentChildren }) {
  return (
    <section class="t-results" aria-labelledby="t-results-h">
      <h2 id="t-results-h">{title}</h2>
      <dl aria-live="polite">{children}</dl>
    </section>
  );
}
