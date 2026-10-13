import { useEffect, useState } from "preact/hooks";
import {
  allPatches, formatMonth, formatPatchDate, groupBySource, patchesSince, PATCH_CONFIDENCE_WORDS,
  type ChangeItem, type PatchRow,
} from "@rokadm/planner/tools";
import { Cite } from "../kit/Cite";
import { SelectField } from "../kit/NumberField";
import { useToolInputs } from "../kit/useToolInputs";
import type { Cite as CiteData } from "@rokadm/planner/tools";

export interface ChangesPatch extends PatchRow {
  cite: CiteData;
}

export interface ChangesViewProps {
  patches: ChangesPatch[];
  /** Picker months, newest first ("YYYY-MM"). */
  months: string[];
}

function PatchCard({ item }: { item: ChangeItem<ChangesPatch> }) {
  const p = item.patch;
  return (
    <li class="c-patch" data-version={p.version} data-confidence={p.confidence}>
      <h4>
        <span class="mono">{p.version}</span> <span class="c-date">{formatPatchDate(p.date)}</span>
      </h4>
      <p>{p.summary}</p>
      <p class="c-conf">{PATCH_CONFIDENCE_WORDS[p.confidence]}.</p>
      {item.sameMonth ? <p class="c-flag">Same month you stopped: you may have played this one already.</p> : null}
      <Cite cite={p.cite} />
    </li>
  );
}

function Group({ id, title, note, items }: { id: string; title: string; note: string; items: ChangeItem<ChangesPatch>[] }) {
  return (
    <section class="c-group" aria-labelledby={id} data-group={id}>
      <h3 id={id}>{title} ({items.length})</h3>
      <p class="t-note">{note}</p>
      {items.length ? <ol class="c-list">{items.map((i) => <PatchCard key={i.patch.version} item={i} />)}</ol> : <p>None in this range.</p>}
    </section>
  );
}

/** F-28: pick the month you stopped playing, see every patch since, newest first. */
export default function ChangesView({ patches, months }: ChangesViewProps) {
  const [ready, setReady] = useState(false);
  const { values, set } = useToolInputs("changes", { since: "" });
  useEffect(() => setReady(true), []);

  const since = ready && months.includes(values.since) ? values.since : "";
  const items = since ? patchesSince(patches, since) : allPatches(patches);
  const g = groupBySource(items);
  const summary = since
    ? items.length
      ? `${items.length} patch${items.length === 1 ? "" : "es"} since ${formatMonth(since)}, newest first.`
      : `No patch in our data after ${formatMonth(since)}. You haven't missed a known update.`
    : `All ${items.length} patches in our data, newest first.`;

  return (
    <div class="t-page-body" data-tool="changes">
      {ready ? (
        <form class="c-form" onSubmit={(e) => e.preventDefault()} aria-label="When you stopped">
          <SelectField id="c-since" label="When did you stop playing?" value={since}
            help="Pick the month. Patches from that same month are shown and marked, since you may have seen them."
            options={[{ value: "", label: "Show every patch" }, ...months.map((m) => ({ value: m, label: formatMonth(m) }))]}
            onChange={(v) => set({ since: v })} />
        </form>
      ) : null}
      <p class="c-summary" aria-live="polite" data-testid="c-summary">{summary}</p>
      <Group id="c-official" title="With official patch notes" items={g.official}
        note="Lilith published notes for these versions." />
      <Group id="c-reported" title="Reported only" items={g.reported}
        note="No official notes found yet: known from other sources, so details may change." />
    </div>
  );
}
