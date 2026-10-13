import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { MGE_POLICY_TEXT, emptyMgeDoc, newDocId, planMge, type MgeDoc } from "@rokadm/planner";
import { deleteMgePlan, listMgePlans, loadMgePlan, localDay, saveMgePlan } from "../../../lib/kingdom-mge";
import { kingdomStorage, type StorageLike, type StoredDoc } from "../../../lib/kingdom-store";
import ConfirmAction from "../shared/ConfirmAction";
import Candidates from "./Candidates";
import Events from "./Events";
import Publish from "./Publish";
import Settings from "./Settings";
import "./mge.css";

interface Props {
  clock?: () => Date;
}

const realClock = (): Date => new Date();

/** F-35 MGE planner (Operate): saved plans, rules, governors, events, ledger and public link. */
export default function MgePlanner({ clock = realClock }: Props) {
  const stRef = useRef<StorageLike | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [plans, setPlans] = useState<StoredDoc[]>([]);
  const [doc, setDoc] = useState<MgeDoc | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const today = localDay(clock());

  useEffect(() => {
    const { st, blocked } = kingdomStorage();
    stRef.current = st;
    setBlocked(blocked);
    const list = listMgePlans(st);
    setPlans(list);
    if (list[0]) setDoc(loadMgePlan(list[0].id, st));
  }, []);

  const plan = useMemo(() => (doc ? planMge(doc) : null), [doc]);

  function commit(next: MgeDoc) {
    try {
      setDoc(saveMgePlan(next, stRef.current, clock()));
      setError("");
    } catch (e) {
      setDoc(next);
      setError(e instanceof Error ? e.message : "This plan could not be saved.");
    }
    setPlans(listMgePlans(stRef.current));
  }

  function newPlan() {
    const d = emptyMgeDoc(newDocId(), clock());
    try {
      setDoc(saveMgePlan(d, stRef.current, clock()));
      setError("");
      setStatus("New plan created.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "This plan could not be created.");
    }
    setPlans(listMgePlans(stRef.current));
  }

  function open(id: string) {
    const d = loadMgePlan(id, stRef.current);
    if (d) {
      setDoc(d);
      setStatus(`Opened ${d.title}.`);
    }
  }

  function remove(id: string) {
    deleteMgePlan(id, stRef.current);
    const list = listMgePlans(stRef.current);
    setPlans(list);
    if (doc?.id === id) setDoc(null);
    setStatus("Plan deleted.");
  }

  const unfilled = plan ? plan.events.reduce((s, e) => s + e.unfilled.length, 0) : 0;
  const summary = doc && plan
    ? `${doc.title}: ${doc.candidates.length} governor${doc.candidates.length === 1 ? "" : "s"}, ${doc.events.length} event${doc.events.length === 1 ? "" : "s"}, ${MGE_POLICY_TEXT[doc.policy].label.toLowerCase()} rule, ${doc.slotsPerEvent} slots per event.${doc.events.length ? ` ${unfilled === 0 ? "Every slot is filled." : `${unfilled} slot${unfilled === 1 ? "" : "s"} not filled.`}` : ""}`
    : "";

  return (
    <div class="kg" data-mge>
      {blocked && <p class="kg-error" data-blocked>This browser blocks saving. Your plan lasts until you close this page; export it from the Council kit page to keep it.</p>}
      <section class="kg-grid" aria-labelledby="kx-plans-h">
        <h2 id="kx-plans-h">Saved plans</h2>
        {plans.length === 0 ? <p class="kg-note">No MGE plan on this device yet.</p> : (
          <ul class="kx-plans" data-plans>
            {plans.map((p) => (
              <li key={p.id}>
                <span class="kx-plan-name">
                  <strong>{p.title || "MGE plan"}</strong>
                  {doc?.id === p.id && <span class="kg-badge">Open</span>}
                  <span class="kg-hint">Edited {localDay(new Date(p.updatedAt))}</span>
                </span>
                <span class="kg-actions">
                  {doc?.id !== p.id && <button type="button" class="btn btn-secondary" aria-label={`Open ${p.title}`} onClick={() => open(p.id)}>Open</button>}
                  <ConfirmAction label="Delete" ariaLabel={`Delete ${p.title}`} question={`Delete the plan "${p.title}"? This cannot be undone.`} onConfirm={() => remove(p.id)} />
                </span>
              </li>
            ))}
          </ul>
        )}
        <div class="kg-actions"><button type="button" class="btn btn-primary" onClick={newPlan}>New plan</button></div>
        {error && <p class="kg-error" role="alert">{error}</p>}
        <p class="kg-status" role="status" aria-live="polite">{status}</p>
      </section>

      {doc && plan && (
        <>
          <p class="kx-summary" aria-live="polite" data-summary>{summary}</p>
          <Settings key={doc.id} doc={doc} onChange={commit} />
          <Candidates key={`c-${doc.id}`} doc={doc} plan={plan} onChange={commit} />
          <Events key={`e-${doc.id}`} doc={doc} plan={plan} today={today} onChange={commit} />
          <Publish doc={doc} plan={plan} today={today} />
        </>
      )}
    </div>
  );
}
