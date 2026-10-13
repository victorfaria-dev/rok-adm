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

  if (state.kind === "loading") return <p class="kg-status" role="status" aria-live="polite">Opening the ledger…</p>;
  if (state.kind === "error") {
    return (
      <div class="kg-grid" data-view-error>
        <p class="kg-error" role="alert">{SHARE_ERROR_TEXT[state.error]}</p>
        <p class="kg-note">A council can make a ledger link on the <a href="/kingdom/mge/">MGE planner</a>.</p>
      </div>
    );
  }
  const d = state.data;
  return (
    <div class="kg-grid" data-view>
      <header class="kg-head">
        <h2 class="kx-view-title" data-view-title>{d.title}</h2>
        <p class="kg-note"><strong>Published by the council, not by KingdomOps.</strong>{d.publishedOn ? ` Published ${longDay(d.publishedOn)}.` : ""} KingdomOps only displays what is inside this link.</p>
      </header>
      <section class="kg-card" aria-labelledby="kx-view-rules-h">
        <h3 id="kx-view-rules-h">Rules used: {MGE_POLICY_TEXT[d.policy].label}</h3>
        <p data-view-rules>{describeMgeRules(d)}</p>
        {!d.includeScores && <p class="kg-note">Scores are not included in this link.</p>}
      </section>
      {d.events.length === 0 ? <p class="kg-note">This ledger has no events.</p> : d.events.map((e, i) => <LedgerTable key={i} event={e} showScores={d.includeScores} />)}
      <div class="kg-actions kg-noprint">
        <button type="button" class="btn btn-secondary" onClick={() => print()}>Print</button>
      </div>
    </div>
  );
}
