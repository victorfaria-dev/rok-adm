import { useState } from "preact/hooks";
import {
  MGE_LIMITS, cleanLine, isDay, mgePublicPayload, newDocId, orderedEvents, setEventLocked,
  type MgeDoc, type MgeEvent, type MgePlan,
} from "@rokadm/planner";
import { longDay } from "../../../lib/kingdom-mge";
import ConfirmAction from "../shared/ConfirmAction";
import { TextField } from "../shared/Field";
import LedgerTable from "./LedgerTable";

interface Props {
  doc: MgeDoc;
  plan: MgePlan;
  today: string;
  onChange: (d: MgeDoc) => void;
}

function DateField({ id, label, value, onValue, error, disabled }: { id: string; label: string; value: string; onValue: (v: string) => void; error?: string; disabled?: boolean }) {
  const errId = error ? `${id}-error` : undefined;
  return (
    <div class="kg-field">
      <label for={id}>{label}</label>
      <input id={id} type="date" value={value} disabled={disabled} aria-invalid={error ? "true" : undefined} aria-describedby={errId} onInput={(e) => onValue((e.currentTarget as HTMLInputElement).value)} />
      {error && <p id={errId} class="kg-error">{error}</p>}
    </div>
  );
}

/** Add events, edit applicants and manual placements, lock, and see each event's ledger. */
export default function Events({ doc, plan, today, onChange }: Props) {
  const [date, setDate] = useState(today);
  const [commander, setCommander] = useState("");
  const [error, setError] = useState("");
  const pub = mgePublicPayload(doc, true, today, plan);

  function addEvent() {
    if (!isDay(date)) return setError("Escolha a data do evento.");
    if (doc.events.length >= MGE_LIMITS.events) return setError(`Um plano comporta até ${MGE_LIMITS.events} eventos. Comece um plano novo ou apague eventos antigos.`);
    setError("");
    const ev: MgeEvent = { id: newDocId(), date, commander: cleanLine(commander, MGE_LIMITS.commander), applicants: [], overrides: [], locked: false, result: null };
    onChange({ ...doc, events: [...doc.events, ev] });
    setCommander("");
  }

  const updateEvent = (id: string, patch: Partial<MgeEvent>) => onChange({ ...doc, events: doc.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) });

  return (
    <section class="kg-grid" aria-labelledby="kx-events-h">
      <h2 id="kx-events-h">Eventos e registro ({doc.events.length})</h2>
      <div class="kg-grid kg-grid-2">
        <DateField id="kx-ev-date" label="Data do evento" value={date} onValue={setDate} error={error} />
        <TextField id="kx-ev-cmd" label="Comandante (opcional)" value={commander} onValue={setCommander} maxLength={MGE_LIMITS.commander} hint="Como o seu conselho escreve, por exemplo o comandante do MGE daquela semana." />
      </div>
      <div class="kg-actions"><button type="button" class="btn btn-primary" onClick={addEvent}>Adicionar evento</button></div>
      {plan.warnings.length > 0 && (
        <ul class="kx-warn" data-plan-warnings aria-label="Avisos do plano">
          {plan.warnings.map((w, i) => <li key={i}>{w.message}</li>)}
        </ul>
      )}
      {doc.events.length === 0 && <p class="kg-note">Nenhum evento ainda. Adicione a data do próximo MGE para ver quem fica com cada vaga.</p>}
      {orderedEvents(doc).map((ev, i) => {
        const p = plan.events[i]!;
        const pe = pub.events[i]!;
        return (
          <EventBlock
            key={ev.id}
            doc={doc}
            ev={ev}
            warnings={p.warnings.map((w) => w.message)}
            ledger={<LedgerTable event={pe} showScores={doc.policy === "score"} />}
            onPatch={(patch) => updateEvent(ev.id, patch)}
            onLock={(locked) => onChange(setEventLocked(doc, ev.id, locked))}
            onDelete={() => onChange({ ...doc, events: doc.events.filter((e) => e.id !== ev.id) })}
          />
        );
      })}
    </section>
  );
}

interface BlockProps {
  doc: MgeDoc;
  ev: MgeEvent;
  warnings: string[];
  ledger: preact.ComponentChildren;
  onPatch: (p: Partial<MgeEvent>) => void;
  onLock: (locked: boolean) => void;
  onDelete: () => void;
}

function EventBlock({ doc, ev, warnings, ledger, onPatch, onLock, onDelete }: BlockProps) {
  const [slot, setSlot] = useState("1");
  const [who, setWho] = useState(doc.candidates[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [errs, setErrs] = useState<{ who?: string; reason?: string }>({});
  const base = `kx-ev-${ev.id}`;
  const title = `${longDay(ev.date)}${ev.commander ? `, ${ev.commander}` : ""}`;
  const byId = new Map(doc.candidates.map((c) => [c.id, c]));

  function place() {
    const e: typeof errs = {};
    if (!byId.has(who)) e.who = "Escolha um governador.";
    const r = cleanLine(reason, MGE_LIMITS.reason);
    if (!r) e.reason = "Escreva por que este governador fica com esta vaga. O motivo aparece no registro.";
    setErrs(e);
    if (e.who || e.reason) return;
    const s = Number(slot);
    const overrides = [...ev.overrides.filter((o) => o.slot !== s && o.candidateId !== who), { slot: s, candidateId: who, reason: r }].sort((a, b) => a.slot - b.slot);
    onPatch({ overrides });
    setReason("");
  }

  return (
    <article class="kx-event" aria-labelledby={`${base}-h`} data-event={ev.date}>
      <div class="kx-event-head">
        <h3 id={`${base}-h`} class="kx-h3">{title}</h3>
        {ev.locked && <span class="kg-badge">Travado</span>}
      </div>
      {!ev.locked && (
        <>
          <div class="kg-grid kg-grid-2">
            <DateField id={`${base}-date`} label="Data" value={ev.date} onValue={(v) => isDay(v) && onPatch({ date: v })} />
            <TextField id={`${base}-cmd`} label="Comandante" value={ev.commander} maxLength={MGE_LIMITS.commander} onValue={(v) => onPatch({ commander: v.slice(0, MGE_LIMITS.commander) })} />
          </div>
          {doc.applicationsRequired && (
            <details class="kx-details">
              <summary>Candidatos: {ev.applicants.length} de {doc.candidates.length}</summary>
              {doc.candidates.length === 0 ? <p class="kg-note">Adicione governadores primeiro.</p> : (
                <fieldset class="kx-fieldset">
                  <legend class="visually-hidden">Candidatos para {title}</legend>
                  <div class="kx-checks">
                    {doc.candidates.map((c) => (
                      <div class="kg-check" key={c.id}>
                        <input
                          id={`${base}-app-${c.id}`}
                          type="checkbox"
                          checked={ev.applicants.includes(c.id)}
                          onChange={(e) => {
                            const on = (e.currentTarget as HTMLInputElement).checked;
                            onPatch({ applicants: on ? [...ev.applicants, c.id] : ev.applicants.filter((a) => a !== c.id) });
                          }}
                        />
                        <label for={`${base}-app-${c.id}`}>{c.name}</label>
                      </div>
                    ))}
                  </div>
                </fieldset>
              )}
            </details>
          )}
          <details class="kx-details">
            <summary>Colocar um governador à mão ({ev.overrides.length})</summary>
            {doc.candidates.length === 0 ? <p class="kg-note">Adicione governadores primeiro.</p> : (
              <div class="kg-grid">
                <div class="kg-grid kg-grid-2">
                  <div class="kg-field">
                    <label for={`${base}-slot`}>Vaga</label>
                    <select id={`${base}-slot`} value={slot} onChange={(e) => setSlot((e.currentTarget as HTMLSelectElement).value)}>
                      {Array.from({ length: doc.slotsPerEvent }, (_, i) => <option key={i} value={String(i + 1)}>{i + 1}</option>)}
                    </select>
                  </div>
                  <div class="kg-field">
                    <label for={`${base}-who`}>Governador</label>
                    <select id={`${base}-who`} value={who} aria-invalid={errs.who ? "true" : undefined} aria-describedby={errs.who ? `${base}-who-error` : undefined} onChange={(e) => setWho((e.currentTarget as HTMLSelectElement).value)}>
                      {!byId.has(who) && <option value="">Escolha um governador</option>}
                      {doc.candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errs.who && <p id={`${base}-who-error`} class="kg-error">{errs.who}</p>}
                  </div>
                </div>
                <TextField id={`${base}-reason`} label="Motivo (obrigatório)" value={reason} onValue={setReason} maxLength={MGE_LIMITS.reason} error={errs.reason} hint="Aparece no registro público, por exemplo: líder de guarnição na luta da Terra dos Reis." />
                <div class="kg-actions"><button type="button" class="btn btn-secondary" onClick={place}>Colocar na vaga {slot}</button></div>
                {ev.overrides.length > 0 && (
                  <ul class="kx-overrides">
                    {ev.overrides.map((o) => (
                      <li key={o.slot}>
                        <span>Vaga {o.slot}: {byId.get(o.candidateId)?.name ?? "governador removido"}. {o.reason}</span>
                        <button type="button" class="btn btn-secondary" aria-label={`Remover colocação manual na vaga ${o.slot}`} onClick={() => onPatch({ overrides: ev.overrides.filter((x) => x.slot !== o.slot) })}>Remover</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </details>
        </>
      )}
      {ledger}
      {warnings.length > 0 && (
        <ul class="kx-warn" aria-label={`Avisos de ${title}`}>
          {warnings.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      )}
      <div class="kg-actions">
        <button type="button" class="btn btn-secondary" onClick={() => onLock(!ev.locked)} aria-describedby={`${base}-lock-hint`}>{ev.locked ? "Destravar evento" : "Travar evento"}</button>
        <ConfirmAction label="Apagar evento" ariaLabel={`Apagar evento ${title}`} question={`Apagar o evento de ${title}?`} onConfirm={onDelete} />
      </div>
      <p id={`${base}-lock-hint`} class="kg-hint">
        {ev.locked ? "Travado: este registro é mantido como histórico. Destravar recalcula com a lista e as regras atuais." : "Trave um evento quando ele acabar: o registro fica como histórico e edições posteriores não o alteram."}
      </p>
    </article>
  );
}
