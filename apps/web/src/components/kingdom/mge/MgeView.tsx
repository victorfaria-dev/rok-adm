import { useEffect, useState } from "preact/hooks";
import { MGE_POLICY_TEXT, SHARE_ERROR_TEXT, describeMgeRules, type MgePublic, type ShareError } from "@rokadm/planner";
import { longDay, readMgeLink } from "../../../lib/kingdom-mge";
import LedgerTable from "./LedgerTable";
import "./mge.css";

type State = { kind: "loading" } | { kind: "error"; error: ShareError } | { kind: "ok"; data: MgePublic };

/** F-35 public ledger (Read): decodes #d= and shows who got which slot, when and why. */
export default function MgeView() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const load = () => {
      void readMgeLink(location.hash).then((r) => setState(r.ok ? { kind: "ok", data: r.data } : { kind: "error", error: r.error }));
    };
    load();
    addEventListener("hashchange", load);
    return () => removeEventListener("hashchange", load);
  }, []);

  if (state.kind === "loading") return <p class="kg-status" role="status" aria-live="polite">Abrindo o registro…</p>;
  if (state.kind === "error") {
    return (
      <div class="kg-grid" data-view-error>
        <p class="kg-error" role="alert">{SHARE_ERROR_TEXT[state.error]}</p>
        <p class="kg-note">Um conselho pode gerar um link de registro no <a href="/kingdom/mge/">planejador de MGE</a>.</p>
      </div>
    );
  }
  const d = state.data;
  return (
    <div class="kg-grid" data-view>
      <header class="kg-head">
        <h2 class="kx-view-title" data-view-title>{d.title}</h2>
        <p class="kg-note"><strong>Publicado pelo conselho, não pelo KingdomOps.</strong>{d.publishedOn ? ` Publicado em ${longDay(d.publishedOn)}.` : ""} O KingdomOps só exibe o que está dentro deste link.</p>
      </header>
      <section class="kg-card" aria-labelledby="kx-view-rules-h">
        <h3 id="kx-view-rules-h">Regras usadas: {MGE_POLICY_TEXT[d.policy].label}</h3>
        <p data-view-rules>{describeMgeRules(d)}</p>
        {!d.includeScores && <p class="kg-note">As pontuações não estão incluídas neste link.</p>}
      </section>
      {d.events.length === 0 ? <p class="kg-note">Este registro não tem eventos.</p> : d.events.map((e, i) => <LedgerTable key={i} event={e} showScores={d.includeScores} />)}
      <div class="kg-actions kg-noprint">
        <button type="button" class="btn btn-secondary" onClick={() => print()}>Imprimir</button>
      </div>
    </div>
  );
}
