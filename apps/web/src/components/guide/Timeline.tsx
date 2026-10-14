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
            {n.done && <span class="tl-done">Provavelmente já feito</span>}
            {n.ch && <span class="tl-ch mono">Pref. {n.ch[0]}–{n.ch[1]}</span>}
            <Confidence level={n.confidence} short />
          </span>
        </summary>
        {(!lazy || open) && (
        <div class="tl-card">
          {n.gist && <p class="tl-gist">{n.gist}</p>}
          <p class="tl-meta">
            <span>Fontes: {sites || "nenhuma listada"}</span>
            {n.cards.length > 0 && <span class="tl-cards"> · {n.cards.length} {n.cards.length === 1 ? "ficha de fato" : "fichas de fatos"}</span>}
          </p>
          <a class="tl-more" href={`#b-${n.id}`} data-read-more={n.id}>
            Ler mais<span class="visually-hidden">: {n.title}</span>
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
      <summary>Mostrar {n} {n === 1 ? "passo" : "passos"} {done ? "(provavelmente já feitos)" : "para qualquer dia"}</summary>
      {(!lazy || open) && list}
    </details>
  );
}

export function Timeline({ timeline, here = null, title = "Seu caminho até o KvK1", idPrefix = "tl", lazyCards = false }: Props) {
  const hid = `${idPrefix}-h`;
  return (
    <section class="tl" data-timeline aria-labelledby={hid}>
      <h2 id={hid} class="tl-title">{title}</h2>
      <p class="tl-hint">Cada ponto é um passo, colocado onde se aplica. Abra um para ver um resumo curto; o texto completo de cada passo está mais abaixo.</p>
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
                    Você está aqui <span class="tl-here-why">· {here.text}</span>
                  </span>
                )}
              </div>
              <Nodes lane={lane} lazy={lazyCards} />
            </li>
          );
        })}
      </ol>
      {here?.lane === "past" && (
        <p class="tl-past" data-you-are-here>Você está aqui: depois do fim deste caminho. {here.text}.</p>
      )}
    </section>
  );
}
