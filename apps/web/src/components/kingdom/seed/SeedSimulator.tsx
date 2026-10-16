import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  QUICK_DEFAULT_AVERAGE, SEED_BANDS, SEED_LIMITS, SEED_RULE, compareWhatIf, emptySeedDoc, remapWhatIf, formatCompact, formatInt, newDocId, parseQuantity,
  quickAverageFits, seedGovernors, seedRuleFreshness,
  type QuickBandKey, type SeedDoc, type SeedResult,
} from "@rokadm/planner";
import { localDay } from "../../../lib/kingdom-mge";
import { deleteSeed, listSeeds, loadSeed, powerText, saveSeed, seedSummary } from "../../../lib/kingdom-seed";
import { kingdomStorage, type StorageLike, type StoredDoc } from "../../../lib/kingdom-store";
import ConfirmAction from "../shared/ConfirmAction";
import { SelectField, TextAreaField, TextField } from "../shared/Field";
import "./seed.css";

interface Props {
  clock?: () => Date;
}

const realClock = (): Date => new Date();
/** Rows shown in the what-if list: the top 300 plus the next few who could move in. */
const WHATIF_ROWS = 320;

const MODE_OPTIONS = [
  { value: "list" as const, label: "Colar uma lista de poderes" },
  { value: "quick" as const, label: "Rápido: quantidade por faixa de poder" },
];

/** F-39 seed simulator (EXPERIMENTAL): counted kingdom power under the 1.0.95 rule, with a what-if panel. */
export default function SeedSimulator({ clock = realClock }: Props) {
  const stRef = useRef<StorageLike | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [saved, setSaved] = useState<StoredDoc[]>([]);
  const [doc, setDoc] = useState<SeedDoc>(() => emptySeedDoc(newDocId(), clock()));
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const { st, blocked } = kingdomStorage();
    stRef.current = st;
    setBlocked(blocked);
    const list = listSeeds(st);
    setSaved(list);
    const first = list[0] ? loadSeed(list[0].id, st) : null;
    if (first) setDoc(first);
  }, []);

  const input = useMemo(() => seedGovernors(doc), [doc.mode, doc.listText, doc.quick]);
  const cmp = useMemo(() => compareWhatIf(input.governors, doc.whatIf), [input, doc.whatIf]);
  const fresh = seedRuleFreshness(localDay(clock()));

  function commit(next: SeedDoc) {
    try {
      setDoc(saveSeed(next, stRef.current, clock()));
      setError("");
    } catch (e) {
      setDoc(next);
      setError(e instanceof Error ? e.message : "Não foi possível salvar esta simulação.");
    }
    setSaved(listSeeds(stRef.current));
  }
  const set = (patch: Partial<SeedDoc>) => commit({ ...doc, ...patch });

  function newSim() {
    setDoc(emptySeedDoc(newDocId(), clock()));
    setStatus("Nova simulação iniciada. Ela é salva assim que você digitar algo.");
  }
  function open(id: string) {
    const d = loadSeed(id, stRef.current);
    if (d) {
      setDoc(d);
      setStatus(`${d.title} aberta.`);
    }
  }
  function remove(id: string) {
    deleteSeed(id, stRef.current);
    setSaved(listSeeds(stRef.current));
    if (doc.id === id) setDoc(emptySeedDoc(newDocId(), clock()));
    setStatus("Simulação apagada.");
  }

  return (
    <div class="kg" data-seed>
      {blocked && <p class="kg-error" data-blocked>Este navegador bloqueia o salvamento. Sua simulação dura até você fechar esta página.</p>}
      <p class="kg-note" data-freshness><strong>{fresh.text}</strong> Regra da atualização {SEED_RULE.patch} ({SEED_RULE.patchDate}).</p>

      <section class="kg-grid" aria-labelledby="ks-saved-h">
        <h2 id="ks-saved-h">Simulações salvas</h2>
        {saved.length === 0 ? <p class="kg-note">Nenhuma salva neste aparelho ainda. Uma simulação é salva assim que você digita algo.</p> : (
          <ul class="ks-saved" data-saved>
            {saved.map((s) => (
              <li key={s.id}>
                <span class="ks-saved-name"><strong>{s.title || "Simulação de seed"}</strong>{doc.id === s.id && <span class="kg-badge">Aberta</span>}</span>
                <span class="kg-actions">
                  {doc.id !== s.id && <button type="button" class="btn btn-secondary" aria-label={`Abrir ${s.title}`} onClick={() => open(s.id)}>Abrir</button>}
                  <ConfirmAction label="Apagar" ariaLabel={`Apagar ${s.title}`} question={`Apagar a simulação "${s.title}"?`} onConfirm={() => remove(s.id)} />
                </span>
              </li>
            ))}
          </ul>
        )}
        <div class="kg-actions"><button type="button" class="btn btn-secondary" onClick={newSim}>Nova simulação</button></div>
        {error && <p class="kg-error" role="alert">{error}</p>}
        <p class="kg-status" role="status" aria-live="polite">{status}</p>
      </section>

      <section class="kg-grid" aria-labelledby="ks-input-h">
        <h2 id="ks-input-h">Seus governadores</h2>
        <div class="kg-grid kg-grid-2">
          <TextField id="ks-title" label="Nome da simulação (opcional)" value={doc.title} maxLength={SEED_LIMITS.title} onValue={(v) => set({ title: v.slice(0, SEED_LIMITS.title) })} />
          <SelectField id="ks-mode" label="Como informar os poderes" value={doc.mode} options={MODE_OPTIONS} onValue={(v) => set({ mode: v })} />
        </div>
        {doc.mode === "list" ? (
          <>
            <TextAreaField
              id="ks-list"
              label="Poder dos governadores, um por linha"
              value={doc.listText}
              rows={8}
              onValue={(v) => { const listText = v.slice(0, SEED_LIMITS.text); set({ listText, whatIf: remapWhatIf(doc.listText, listText, doc.whatIf) }); }}
              hint="Escreva 1.5m, 300k ou 1200000. O nome é opcional: Nome, poder. Cole até 2.000 linhas."
              error={input.errors.length ? `${input.errors.length} ${input.errors.length === 1 ? "linha não pôde" : "linhas não puderam"} ser lida${input.errors.length === 1 ? "" : "s"}.` : undefined}
            />
            {input.errors.length > 0 && (
              <ul class="ks-errors" data-line-errors>
                {input.errors.slice(0, 20).map((e) => <li key={e.line}>Linha {e.line} ("{e.text.slice(0, 40)}"): {e.message}</li>)}
                {input.errors.length > 20 && <li>…e mais {input.errors.length - 20}.</li>}
              </ul>
            )}
            {input.truncated && <p class="kg-error">Só os primeiros {formatInt(SEED_LIMITS.governors)} governadores são lidos.</p>}
          </>
        ) : (
          <QuickInputs key={doc.id} doc={doc} onChange={(quick) => set({ quick })} />
        )}
      </section>

      <Results result={cmp.before} summary={seedSummary(cmp)} />

      {cmp.before.totalGovernors > 0 && (
        <WhatIf key={doc.id} doc={doc} result={cmp.before} after={cmp.after} delta={cmp.delta} marks={cmp.vacationCount + cmp.zeroedCount} onChange={(whatIf) => set({ whatIf })} />
      )}
    </div>
  );
}

function QuickInputs({ doc, onChange }: { doc: SeedDoc; onChange: (q: SeedDoc["quick"]) => void }) {
  return (
    <div class="kg-grid" data-quick>
      <p class="kg-note">Informe quantos governadores há em cada faixa e, se souber, o poder médio deles. Uma média vazia usa o meio da faixa (600M para a faixa mais alta; acima de 500M todo governador conta igual).</p>
      <div class="kg-grid kg-grid-2">
        {SEED_BANDS.map((b) => <QuickBand key={b.key} band={b.key} label={b.label} value={doc.quick[b.key]} onChange={(v) => onChange({ ...doc.quick, [b.key]: v })} />)}
      </div>
    </div>
  );
}

function QuickBand({ band, label, value, onChange }: { band: QuickBandKey; label: string; value: SeedDoc["quick"][QuickBandKey]; onChange: (v: SeedDoc["quick"][QuickBandKey]) => void }) {
  const [count, setCount] = useState(value.count ? String(value.count) : "");
  const [avg, setAvg] = useState(value.average !== null ? formatCompact(value.average) : "");
  const [errs, setErrs] = useState<{ count?: string; avg?: string }>({});
  const id = `ks-q-${band.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <fieldset class="ks-band">
      <legend>{label}</legend>
      <TextField
        id={`${id}-count`}
        label="Governadores"
        inputMode="numeric"
        value={count}
        error={errs.count}
        onValue={(v) => {
          setCount(v);
          const n = v.trim() === "" ? 0 : parseQuantity(v);
          if (n === null || n > SEED_LIMITS.governors) return setErrs({ ...errs, count: `Digite um número inteiro até ${formatInt(SEED_LIMITS.governors)}.` });
          setErrs({ ...errs, count: undefined });
          onChange({ ...value, count: n });
        }}
      />
      <TextField
        id={`${id}-avg`}
        label="Poder médio (opcional)"
        value={avg}
        error={errs.avg}
        hint={`Vazio: ${formatCompact(QUICK_DEFAULT_AVERAGE[band])}`}
        onValue={(v) => {
          setAvg(v);
          if (!v.trim()) {
            setErrs({ ...errs, avg: undefined });
            return onChange({ ...value, average: null });
          }
          const n = parseQuantity(v);
          if (n === null || !quickAverageFits(band, n)) return setErrs({ ...errs, avg: `Digite um poder dentro desta faixa (${label.toLowerCase()}), por exemplo ${formatCompact(QUICK_DEFAULT_AVERAGE[band])}.` });
          setErrs({ ...errs, avg: undefined });
          onChange({ ...value, average: n });
        }}
      />
    </fieldset>
  );
}

function Results({ result: r, summary }: { result: SeedResult; summary: string }) {
  return (
    <section class="kg-grid" aria-labelledby="ks-res-h">
      <h2 id="ks-res-h">Poder do reino contado</h2>
      <p class="ks-summary" aria-live="polite" data-summary>{summary}</p>
      {r.totalGovernors > 0 && (
        <>
          <dl class="ks-stats" data-stats>
            <div><dt>Poder contado</dt><dd data-counted>{powerText(r.counted)}</dd></div>
            <div><dt>Poder bruto dos {r.countedGovernors} primeiros</dt><dd>{powerText(r.rawTopPower)}</dd></div>
            <div><dt>Limite do Imperium</dt><dd>{formatCompact(r.imperium.threshold)} — {r.imperium.reached ? "atingido" : `faltam ${formatCompact(r.imperium.gap)}`}</dd></div>
            <div><dt>Não contados (posição 301 em diante)</dt><dd data-ignored>{r.ignoredGovernors} {r.ignoredGovernors === 1 ? "governador" : "governadores"}, {formatCompact(r.ignoredPower)}</dd></div>
          </dl>
          <div class="kg-table-wrap" tabIndex={0} role="region" aria-label="Detalhamento por faixa de poder">
            <table class="kg-table" data-bands>
              <caption class="ks-caption">Detalhamento por faixa (top {r.countedGovernors})</caption>
              <thead>
                <tr>
                  <th scope="col">Parte do poder de cada governador</th>
                  <th scope="col" class="num">Conta a</th>
                  <th scope="col" class="num">Poder nesta parte</th>
                  <th scope="col" class="num">Contado</th>
                </tr>
              </thead>
              <tbody>
                {r.bands.map((b) => (
                  <tr key={b.key} data-band={b.key}>
                    <th scope="row">{b.label}</th>
                    <td class="num">{Math.round(b.rate * 100)}%</td>
                    <td class="num">{formatInt(b.rawPower)}</td>
                    <td class="num">{formatInt(b.countedPower)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><th scope="row">Total</th><td></td><td class="num">{formatInt(r.rawTopPower)}</td><td class="num">{formatInt(r.counted)}</td></tr>
              </tfoot>
            </table>
          </div>
          <ul class="ks-thresholds" data-thresholds>
            <li>Acima de 150M: <strong>{r.above150M}</strong> {r.above150M === 1 ? "governador" : "governadores"}</li>
            <li>Acima de 300M: <strong>{r.above300M}</strong></li>
            <li>Acima de 500M: <strong>{r.above500M}</strong> (poder acima de 500M não soma nada)</li>
          </ul>
          <p class="kg-note">Nenhuma letra de seed é mostrada: só o limite do Imperium foi publicado. Os limites de A, B, C e D não são conhecidos.</p>
        </>
      )}
    </section>
  );
}

interface WhatIfProps {
  doc: SeedDoc;
  result: SeedResult;
  after: SeedResult;
  delta: number;
  marks: number;
  onChange: (w: SeedDoc["whatIf"]) => void;
}

function WhatIf({ doc, result, after, delta, marks, onChange }: WhatIfProps) {
  const w = doc.whatIf;
  const vac = new Set(w.vacation);
  // Rank the full input (not only the top 300) so governors just below the cut can be seen moving in.
  const all = useMemo(() => {
    const { governors } = seedGovernors(doc);
    return [...governors].sort((a, b) => b.power - a.power || (a.name < b.name ? -1 : a.name > b.name ? 1 : a.id < b.id ? -1 : 1)).slice(0, WHATIF_ROWS);
  }, [doc.mode, doc.listText, doc.quick]);

  return (
    <section class="kg-grid" aria-labelledby="ks-whatif-h">
      <h2 id="ks-whatif-h">E se</h2>
      <p class="kg-note">
        Alguns conselhos zeram os próprios jogadores ou dispensam poder para cair num seed mais baixo. Este painel mostra só a aritmética; não é conselho para fazer nenhuma das duas coisas. A Permissão de Férias é a forma oficial de o rei tirar um governador da pontuação de matchmaking.
      </p>
      <p class="kg-note"><span class="kg-badge">Hipótese</span> Aqui, uma Permissão de Férias é tratada como tirar o governador deste poder contado. As notas só dizem "pontuação de matchmaking"; não está dito se é o mesmo número.</p>
      <dl class="ks-stats" data-whatif-result aria-live="polite">
        <div><dt>Contado agora</dt><dd>{formatCompact(result.counted)}</dd></div>
        <div><dt>Com as suas marcas</dt><dd data-after>{formatCompact(after.counted)}</dd></div>
        <div><dt>Mudança</dt><dd data-delta>{marks === 0 ? "Nenhuma marca ainda" : `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${formatCompact(Math.abs(delta))}`}</dd></div>
        <div><dt>Limite do Imperium</dt><dd>{after.imperium.reached ? "atingido" : `faltam ${formatCompact(after.imperium.gap)}`}</dd></div>
      </dl>
      {marks > 0 && <div class="kg-actions"><button type="button" class="btn btn-secondary" onClick={() => onChange({ vacation: [], zeroed: {} })}>Limpar todas as marcas</button></div>}
      <details class="ks-details">
        <summary>Marcar governadores ({all.length} maiores mostrados)</summary>
        <div class="kg-table-wrap" tabIndex={0} role="region" aria-label="Marcar governadores">
          <table class="kg-table ks-whatif" data-whatif>
            <caption class="visually-hidden">Governadores por poder, com marcas de simulação</caption>
            <thead>
              <tr>
                <th scope="col" class="num">Posição</th>
                <th scope="col">Governador</th>
                <th scope="col" class="num">Poder</th>
                <th scope="col">Permissão de Férias</th>
                <th scope="col">Poder depois de zerar</th>
              </tr>
            </thead>
            <tbody>
              {all.map((g, i) => {
                const label = `#${i + 1}${g.name ? ` ${g.name}` : ""}`;
                return (
                  <tr key={g.id} class={i === SEED_RULE.topN ? "ks-cut" : undefined}>
                    <td class="num">{i + 1}</td>
                    <td>{g.name || <span class="ks-muted">—</span>}</td>
                    <td class="num">{formatCompact(g.power)}</td>
                    <td>
                      <input
                        type="checkbox"
                        class="ks-check"
                        aria-label={`Permissão de Férias para ${label}`}
                        checked={vac.has(g.id)}
                        onChange={(e) => {
                          const on = (e.currentTarget as HTMLInputElement).checked;
                          onChange({ ...w, vacation: on ? [...w.vacation, g.id] : w.vacation.filter((x) => x !== g.id) });
                        }}
                      />
                    </td>
                    <td>
                      <ZeroInput id={`ks-zero-${g.id}`} label={`Poder depois de zerar para ${label}`} value={w.zeroed[g.id]} max={g.power} onValue={(v) => {
                        const zeroed = { ...w.zeroed };
                        if (v === null) delete zeroed[g.id];
                        else zeroed[g.id] = v;
                        onChange({ ...w, zeroed });
                      }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p class="kg-hint">A linha depois da posição {SEED_RULE.topN} é o primeiro governador que não conta agora. Tirar alguém de cima faz ele entrar.</p>
      </details>
    </section>
  );
}

function ZeroInput({ id, label, value, max, onValue }: { id: string; label: string; value: number | undefined; max: number; onValue: (v: number | null) => void }) {
  const [text, setText] = useState(value !== undefined ? formatCompact(value) : "");
  const [bad, setBad] = useState(false);
  return (
    <>
    <input
      id={id}
      type="text"
      inputMode="decimal"
      class="ks-zero"
      aria-label={label}
      aria-invalid={bad ? "true" : undefined}
      aria-describedby={bad ? `${id}-error` : undefined}
      placeholder="—"
      value={text}
      onInput={(e) => {
        const v = (e.currentTarget as HTMLInputElement).value;
        setText(v);
        if (!v.trim()) {
          setBad(false);
          return onValue(null);
        }
        const n = parseQuantity(v);
        const ok = n !== null && n < max;
        setBad(!ok);
        if (ok) onValue(n);
      }}
    />
    {bad && <p id={`${id}-error`} class="kg-error">Digite um poder abaixo de {formatCompact(max)}.</p>}
    </>
  );
}
