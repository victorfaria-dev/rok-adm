import { useEffect, useState } from "preact/hooks";
import type { Cite as CiteData } from "@rokadm/planner/tools";
import { readToolsStore, writeChecks } from "../../../lib/tools-store";
import { Cite } from "./Cite";

export interface CheckItem {
  id: string;
  text: string;
  /** Optional second line (why / how). */
  detail?: string;
  /** Where the item comes from; items with no card show "No consensus" instead of a confidence. */
  cite: CiteData | null;
}

interface Props {
  /** Storage id (ko:tools:v1 → checks[listId]). */
  listId: string;
  title: string;
  items: readonly CheckItem[];
  /** Heading level of the title (default 2). */
  level?: 2 | 3;
}

/** Saved checklist (marks stay on this device). Marks load after mount; the static HTML shows all unchecked. */
export function Checklist({ listId, title, items, level = 2 }: Props) {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    const ids = new Set(items.map((i) => i.id));
    setDone((readToolsStore().checks[listId] ?? []).filter((x) => ids.has(x)));
  }, [listId]);

  const toggle = (id: string, on: boolean): void => {
    const next = on ? [...new Set([...done, id])] : done.filter((x) => x !== id);
    setDone(next);
    writeChecks(listId, next);
  };
  const H = level === 3 ? "h3" : "h2";
  const hid = `cl-${listId}-h`;

  return (
    <section class="t-checklist" aria-labelledby={hid} data-checklist={listId}>
      <H id={hid}>{title}</H>
      <p class="t-progress" aria-live="polite">{done.length} of {items.length} done</p>
      <ul class="t-check">
        {items.map((it) => {
          const cid = `cl-${listId}-${it.id}`;
          return (
            <li key={it.id}>
              <input type="checkbox" id={cid} checked={done.includes(it.id)} onChange={(e) => toggle(it.id, (e.currentTarget as HTMLInputElement).checked)} />
              <label for={cid}>
                <span>{it.text}</span>
                {it.detail ? <span class="t-note">{it.detail}</span> : null}
                {it.cite ? <Cite cite={it.cite} /> : <span class="t-cite"><strong>No consensus</strong> (no fact card yet)</span>}
              </label>
            </li>
          );
        })}
      </ul>
      {done.length > 0 ? (
        <button type="button" class="btn btn-secondary" onClick={() => { setDone([]); writeChecks(listId, []); }}>Clear marks</button>
      ) : null}
    </section>
  );
}
