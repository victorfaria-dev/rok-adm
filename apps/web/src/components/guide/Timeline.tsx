// Scroll timeline of the guide (wave VG). Static HTML that works without JS: each step is a <details> node
// (title + confidence; open: gist, sources, fact-card count, "Read more" to the full block below). With JS,
// lib/guide-timeline-dom.ts adds arrow-key navigation, the scroll highlight and the reveal.
import type { Here, Timeline as TimelineData, TimelineLane, TimelineNode } from "../../lib/guide-timeline";
import { useState } from "preact/hooks";
import { Confidence } from "./Confidence";

interface Props {
  timeline: TimelineData;
  here?: Here | null;
  title?: string;
  /** Prefix for ids, so two timelines never clash. */
  idPrefix?: string;
  /** Build a step's summary card only when it is opened (the island, to keep its render short). Off for static HTML. */
  lazyCards?: boolean;
}

const MAX_SITES = 3;

function Node({ n, lazy }: { n: TimelineNode; lazy: boolean }) {
  const [open, setOpen] = useState(false);
  const sites = n.sources.slice(0, MAX_SITES).join(", ") + (n.sources.length > MAX_SITES ? ` +${n.sources.length - MAX_SITES}` : "");
  return (
    <li class="tl-node" data-node={n.id} data-conf={n.confidence} data-done={n.done ? "" : undefined}>
      <details onToggle={lazy ? (e) => setOpen((e.currentTarget as HTMLDetailsElement).open) : undefined}>
        <summary>
          <span class="tl-dot" aria-hidden="true" />
          <span class="tl-node-title">{n.title}</span>
          <span class="tl-node-tags">
            {n.done && <span class="tl-done">Probably done</span>}
            {n.ch && <span class="tl-ch mono">CH {n.ch[0]}–{n.ch[1]}</span>}
            <Confidence level={n.confidence} short />
          </span>
        </summary>
        {(!lazy || open) && (
        <div class="tl-card">
          {n.gist && <p class="tl-gist">{n.gist}</p>}
          <p class="tl-meta">
            <span>Sources: {sites || "none listed"}</span>
            {n.cards.length > 0 && <span class="tl-cards"> · {n.cards.length} fact {n.cards.length === 1 ? "card" : "cards"}</span>}
          </p>
          <a class="tl-more" href={`#b-${n.id}`} data-read-more={n.id}>
            Read more<span class="visually-hidden">: {n.title}</span>
          </a>
        </div>
        )}
      </details>
    </li>
  );
}

function Nodes({ lane, lazy }: { lane: TimelineLane; lazy: boolean }) {
  const [open, setOpen] = useState(false);
  const list = (
    <ol class="tl-nodes">
      {lane.nodes.map((n) => <Node key={n.id} n={n} lazy={lazy} />)}
    </ol>
  );
  // Folded: a phase the profile has (probably) finished, and the undated "any day" steps (daily routine,
  // events, habits: they have no place on the road). One tap shows them; the island builds them on open.
  const done = lane.nodes.every((n) => n.done);
  if (!done && lane.id !== "any") return list;
  const n = lane.nodes.length;
  return (
    <details class="tl-fold" data-fold={done ? "done" : "any"} onToggle={lazy ? (e) => setOpen((e.currentTarget as HTMLDetailsElement).open) : undefined}>
      <summary>Show {n} {n === 1 ? "step" : "steps"} {done ? "(probably done)" : "for any day"}</summary>
      {(!lazy || open) && list}
    </details>
  );
}

export function Timeline({ timeline, here = null, title = "Your road to KvK1", idPrefix = "tl", lazyCards = false }: Props) {
  const hid = `${idPrefix}-h`;
  return (
    <section class="tl" data-timeline aria-labelledby={hid}>
      <h2 id={hid} class="tl-title">{title}</h2>
      <p class="tl-hint">Each dot is a step, placed where it applies. Open one for a short summary; the full text of every step is further down.</p>
      <ol class="tl-lanes">
        {timeline.lanes.map((lane) => {
          const isHere = here?.lane === lane.id;
          return (
            <li class="tl-lane" key={lane.id} data-lane={lane.id} data-dated={lane.days ? "" : undefined} data-here={isHere ? "" : undefined}>
              <div class="tl-lane-head">
                <span class="tl-lane-mark" aria-hidden="true" />
                <h3 id={`${idPrefix}-${lane.id}-h`} class="tl-lane-title">{lane.title}</h3>
                {lane.sub && <span class="tl-lane-sub">{lane.sub}</span>}
                {isHere && here && (
                  <span class="tl-here" data-you-are-here>
                    You are here <span class="tl-here-why">· {here.text}</span>
                  </span>
                )}
              </div>
              <Nodes lane={lane} lazy={lazyCards} />
            </li>
          );
        })}
      </ol>
      {here?.lane === "past" && (
        <p class="tl-past" data-you-are-here>You are here: past the end of this road. {here.text}.</p>
      )}
    </section>
  );
}
