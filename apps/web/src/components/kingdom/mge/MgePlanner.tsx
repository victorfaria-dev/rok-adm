import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { MGE_POLICY_TEXT, emptyMgeDoc, newDocId, planMge, type MgeDoc } from "@rokadm/planner";
import { deleteMgePlan, listMgePlans, loadMgePlan, localDay, saveMgePlan } from "../../../lib/kingdom-mge";
import { kingdomStorage, type StorageLike, type StoredDoc } from "../../../lib/kingdom-store";
import ConfirmAction from "../shared/ConfirmAction";
import Candidates from "./Candidates";
import Events from "./Events";
import ExportCsv from "./ExportCsv";
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
      setError(e instanceof Error ? e.message : "Não foi possível salvar este plano.");
    }
    setPlans(listMgePlans(stRef.current));
  }

  function newPlan() {
    const d = emptyMgeDoc(newDocId(), clock());
    try {
      setDoc(saveMgePlan(d, stRef.current, clock()));
      setError("");
      setStatus("Novo plano criado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar este plano.");
    }
    setPlans(listMgePlans(stRef.current));
  }

  function open(id: string) {
    const d = loadMgePlan(id, stRef.current);
    if (d) {
      setDoc(d);
      setStatus(`${d.title} aberto.`);
    }
  }

  function remove(id: string) {
    deleteMgePlan(id, stRef.current);
    const list = listMgePlans(stRef.current);
    setPlans(list);
    if (doc?.id === id) setDoc(null);
    setStatus("Plano apagado.");
  }

  const unfilled = plan ? plan.events.reduce((s, e) => s + e.unfilled.length, 0) : 0;
  const summary = doc && plan
    ? `${doc.title}: ${doc.candidates.length} ${doc.candidates.length === 1 ? "governador" : "governadores"}, ${doc.events.length} ${doc.events.length === 1 ? "evento" : "eventos"}, regra ${MGE_POLICY_TEXT[doc.policy].label.toLowerCase()}, ${doc.slotsPerEvent} vagas por evento.${doc.events.length ? ` ${unfilled === 0 ? "Todas as vagas estão preenchidas." : `${unfilled} ${unfilled === 1 ? "vaga não preenchida" : "vagas não preenchidas"}.`}` : ""}`
    : "";

  return (
    <div class="kg" data-mge>
      {blocked && <p class="kg-error" data-blocked>Este navegador bloqueia o salvamento. Seu plano dura até você fechar esta página; exporte-o pela visão geral do Reino para guardá-lo.</p>}
      <section class="kg-grid" aria-labelledby="kx-plans-h">
        <h2 id="kx-plans-h">Planos salvos</h2>
        {plans.length === 0 ? <p class="kg-note">Nenhum plano de MGE neste aparelho ainda.</p> : (
          <ul class="kx-plans" data-plans>
            {plans.map((p) => (
              <li key={p.id}>
                <span class="kx-plan-name">
                  <strong>{p.title || "Plano de MGE"}</strong>
                  {doc?.id === p.id && <span class="kg-badge">Aberto</span>}
                  <span class="kg-hint">Editado em {localDay(new Date(p.updatedAt))}</span>
                </span>
                <span class="kg-actions">
                  {doc?.id !== p.id && <button type="button" class="btn btn-secondary" aria-label={`Abrir ${p.title}`} onClick={() => open(p.id)}>Abrir</button>}
                  <ConfirmAction label="Apagar" ariaLabel={`Apagar ${p.title}`} question={`Apagar o plano "${p.title}"? Isto não pode ser desfeito.`} onConfirm={() => remove(p.id)} />
                </span>
              </li>
            ))}
          </ul>
        )}
        <div class="kg-actions"><button type="button" class="btn btn-primary" onClick={newPlan}>Novo plano</button></div>
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
          <ExportCsv key={`x-${doc.id}`} doc={doc} plan={plan} today={today} />
        </>
      )}
    </div>
  );
}
