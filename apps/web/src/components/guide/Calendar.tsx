// Kingdom-day calendar of the guide (wave VG): a strip from day 0 to 160 with the milestones of dated fact
// cards, then the list (the accessible content). Milestones without a dated, sourced card show as Pending.
import { Fragment } from "preact";
import type { CalendarMilestone, PayloadBlock } from "../../lib/guide-types";
import { dayText, STRIP_DAYS, stripPos, tipsFor, type Here } from "../../lib/guide-timeline";
import { Confidence } from "./Confidence";

interface Props {
  milestones: readonly CalendarMilestone[];
  /** Blocks of the guide on the page, to link each milestone to its steps. */
  blocks: readonly PayloadBlock[];
  here?: Here | null;
}

const TICKS = [0, 40, 80, 120, 160];

export function Calendar({ milestones, blocks, here = null }: Props) {
  const dated = milestones.filter((m) => m.day !== null).sort((a, b) => a.day![0] - b.day![0] || a.day![1] - b.day![1]);
  const pending = milestones.filter((m) => m.day === null);
  const bands = dated.filter((m) => m.day![1] > m.day![0] + 3);
  const points = dated.filter((m) => m.day![1] <= m.day![0] + 3);
  const item = (m: CalendarMilestone) => {
    const tips = tipsFor(m, blocks);
    return (
      <li key={m.id} class="cal-item" data-milestone={m.id} data-pending={m.day ? undefined : ""} data-kind={m.kind}>
        <span class={`cal-day mono${m.day ? "" : " cal-day-pending"}`}>{dayText(m)}</span>
        <span class="cal-what">
          <span class="cal-name">{m.title}</span>
          <span class="cal-meta">
            <Confidence level={m.day ? m.confidence : "pending"} short />
            {m.day === null && m.gaps.length > 0 && <> · lacuna de pesquisa <span class="mono">{m.gaps.join(", ")}</span></>}
            {" · "}
            <span class="visually-hidden">Fichas de fatos: </span>
            <span class="mono">{m.facts.join(", ")}</span>
            {m.sources.length > 0 && <> · {m.sources.slice(0, 3).join(", ")}</>}
          </span>
          {m.note && <span class="cal-note">{m.note}</span>}
          {tips.length > 0 && (
            <span class="cal-tips">
              Passos:{" "}
              {tips.map((t, n) => (
                <Fragment key={t.id}>
                  {n > 0 && ", "}
                  <a href={`#b-${t.id}`} data-read-more={t.id}>{t.title}</a>
                </Fragment>
              ))}
            </span>
          )}
        </span>
      </li>
    );
  };
  const you = here?.day ?? null;
  return (
    <section class="cal" aria-labelledby="cal-h" data-calendar>
      <h2 id="cal-h" class="cal-title">Calendário do reino</h2>
      <div class="cal-strip" aria-hidden="true">
        <div class="cal-bar">
          {bands.map((m) => (
            <span key={m.id} class={`cal-band cal-band-${m.kind}`} data-conf={m.confidence} style={`left:${stripPos(m.day![0])}%;width:${stripPos(m.day![1]) - stripPos(m.day![0])}%`}>
              <span class="cal-band-label">{m.id === "pre-kvk" ? "Pré-KvK" : m.id === "kvk1-length" ? "KvK1" : ""}</span>
            </span>
          ))}
          {points.map((m) => (
            <span key={m.id} class={`cal-pin cal-pin-${m.kind}`} data-conf={m.confidence} style={`left:${stripPos(m.day![0])}%`} />
          ))}
          {you !== null && (
            <span class="cal-you" style={`left:${stripPos(you)}%`}>
              <span class="cal-you-label">Você{you > STRIP_DAYS ? ` (dia ${you})` : ""}</span>
            </span>
          )}
        </div>
        <div class="cal-ticks">
          {TICKS.map((t) => (
            <span key={t} class="cal-tick mono" style={`left:${stripPos(t)}%`}>{t === 0 ? "Dia 0" : t}</span>
          ))}
        </div>
      </div>
      {you !== null && (
        <p class="cal-here" data-you-are-here>
          Você está aqui: <span class="mono">dia {you} do reino</span>
          {you > STRIP_DAYS ? ", depois do fim deste calendário." : "."}
        </p>
      )}
      <ol class="cal-list">{dated.map(item)}</ol>
      {pending.length > 0 && (
        <details class="cal-pending">
          <summary>Pendentes: {pending.length} marcos ainda sem fonte datada</summary>
          <ul class="cal-list">{pending.map(item)}</ul>
        </details>
      )}
      <p class="cal-foot">Os eventos não seguem um calendário fixo; o calendário do jogo mostra alguns dias à frente. Os dias vêm só de fichas de fatos datadas; todo o resto fica marcado como Pendente.</p>
    </section>
  );
}
