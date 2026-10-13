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
  { value: "list" as const, label: "Paste a list of powers" },
  { value: "quick" as const, label: "Quick: counts per power band" },
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
      setError(e instanceof Error ? e.message : "This simulation could not be saved.");
    }
    setSaved(listSeeds(stRef.current));
  }
  const set = (patch: Partial<SeedDoc>) => commit({ ...doc, ...patch });

  function newSim() {
    setDoc(emptySeedDoc(newDocId(), clock()));
    setStatus("New simulation started. It is saved when you enter something.");
  }
  function open(id: string) {
    const d = loadSeed(id, stRef.current);
    if (d) {
      setDoc(d);
      setStatus(`Opened ${d.title}.`);
    }
  }
  function remove(id: string) {
    deleteSeed(id, stRef.current);
    setSaved(listSeeds(stRef.current));
    if (doc.id === id) setDoc(emptySeedDoc(newDocId(), clock()));
    setStatus("Simulation deleted.");
  }

  return (
    <div class="kg" data-seed>
      {blocked && <p class="kg-error" data-blocked>This browser blocks saving. Your simulation lasts until you close this page.</p>}
      <p class="kg-note" data-freshness><strong>{fresh.text}</strong> Rule from patch {SEED_RULE.patch} ({SEED_RULE.patchDate}).</p>

      <section class="kg-grid" aria-labelledby="ks-saved-h">
        <h2 id="ks-saved-h">Saved simulations</h2>
        {saved.length === 0 ? <p class="kg-note">None saved on this device yet. A simulation is saved as soon as you enter something.</p> : (
          <ul class="ks-saved" data-saved>
            {saved.map((s) => (
              <li key={s.id}>
                <span class="ks-saved-name"><strong>{s.title || "Seed simulation"}</strong>{doc.id === s.id && <span class="kg-badge">Open</span>}</span>
                <span class="kg-actions">
                  {doc.id !== s.id && <button type="button" class="btn btn-secondary" aria-label={`Open ${s.title}`} onClick={() => open(s.id)}>Open</button>}
                  <ConfirmAction label="Delete" ariaLabel={`Delete ${s.title}`} question={`Delete the simulation "${s.title}"?`} onConfirm={() => remove(s.id)} />
                </span>
              </li>
            ))}
          </ul>
        )}
        <div class="kg-actions"><button type="button" class="btn btn-secondary" onClick={newSim}>New simulation</button></div>
        {error && <p class="kg-error" role="alert">{error}</p>}
        <p class="kg-status" role="status" aria-live="polite">{status}</p>
      </section>

      <section class="kg-grid" aria-labelledby="ks-input-h">
        <h2 id="ks-input-h">Your governors</h2>
        <div class="kg-grid kg-grid-2">
          <TextField id="ks-title" label="Simulation name (optional)" value={doc.title} maxLength={SEED_LIMITS.title} onValue={(v) => set({ title: v.slice(0, SEED_LIMITS.title) })} />
          <SelectField id="ks-mode" label="How to enter powers" value={doc.mode} options={MODE_OPTIONS} onValue={(v) => set({ mode: v })} />
        </div>
        {doc.mode === "list" ? (
          <>
            <TextAreaField
              id="ks-list"
              label="Governor powers, one per line"
              value={doc.listText}
              rows={8}
              onValue={(v) => { const listText = v.slice(0, SEED_LIMITS.text); set({ listText, whatIf: remapWhatIf(doc.listText, listText, doc.whatIf) }); }}
              hint="Write 1.5m, 300k or 1,200,000. A name is optional: Name, power. Paste up to 2,000 lines."
              error={input.errors.length ? `${input.errors.length} line${input.errors.length === 1 ? "" : "s"} could not be read.` : undefined}
            />
            {input.errors.length > 0 && (
              <ul class="ks-errors" data-line-errors>
                {input.errors.slice(0, 20).map((e) => <li key={e.line}>Line {e.line} ("{e.text.slice(0, 40)}"): {e.message}</li>)}
                {input.errors.length > 20 && <li>…and {input.errors.length - 20} more.</li>}
              </ul>
            )}
            {input.truncated && <p class="kg-error">Only the first {formatInt(SEED_LIMITS.governors)} governors are read.</p>}
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
      <p class="kg-note">Enter how many governors are in each band and, if you know it, their average power. An empty average uses the middle of the band (600M for the top band; above 500M every governor counts the same).</p>
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
        label="Governors"
        inputMode="numeric"
        value={count}
        error={errs.count}
        onValue={(v) => {
          setCount(v);
          const n = v.trim() === "" ? 0 : parseQuantity(v);
          if (n === null || n > SEED_LIMITS.governors) return setErrs({ ...errs, count: `Enter a whole number up to ${formatInt(SEED_LIMITS.governors)}.` });
          setErrs({ ...errs, count: undefined });
          onChange({ ...value, count: n });
        }}
      />
      <TextField
        id={`${id}-avg`}
        label="Average power (optional)"
        value={avg}
        error={errs.avg}
        hint={`Empty: ${formatCompact(QUICK_DEFAULT_AVERAGE[band])}`}
        onValue={(v) => {
          setAvg(v);
          if (!v.trim()) {
            setErrs({ ...errs, avg: undefined });
            return onChange({ ...value, average: null });
          }
          const n = parseQuantity(v);
          if (n === null || !quickAverageFits(band, n)) return setErrs({ ...errs, avg: `Enter a power inside this band (${label.toLowerCase()}), for example ${formatCompact(QUICK_DEFAULT_AVERAGE[band])}.` });
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
      <h2 id="ks-res-h">Counted kingdom power</h2>
      <p class="ks-summary" aria-live="polite" data-summary>{summary}</p>
      {r.totalGovernors > 0 && (
        <>
          <dl class="ks-stats" data-stats>
            <div><dt>Counted power</dt><dd data-counted>{powerText(r.counted)}</dd></div>
            <div><dt>Raw power of the top {r.countedGovernors}</dt><dd>{powerText(r.rawTopPower)}</dd></div>
            <div><dt>Imperium threshold</dt><dd>{formatCompact(r.imperium.threshold)} — {r.imperium.reached ? "reached" : `${formatCompact(r.imperium.gap)} short`}</dd></div>
            <div><dt>Not counted (rank 301 and below)</dt><dd data-ignored>{r.ignoredGovernors} governor{r.ignoredGovernors === 1 ? "" : "s"}, {formatCompact(r.ignoredPower)}</dd></div>
          </dl>
          <div class="kg-table-wrap" tabIndex={0} role="region" aria-label="Breakdown by power band">
            <table class="kg-table" data-bands>
              <caption class="ks-caption">Breakdown by band (top {r.countedGovernors})</caption>
              <thead>
                <tr>
                  <th scope="col">Part of each governor's power</th>
                  <th scope="col" class="num">Counts at</th>
                  <th scope="col" class="num">Power in this part</th>
                  <th scope="col" class="num">Counted</th>
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
            <li>Above 150M: <strong>{r.above150M}</strong> governor{r.above150M === 1 ? "" : "s"}</li>
            <li>Above 300M: <strong>{r.above300M}</strong></li>
            <li>Above 500M: <strong>{r.above500M}</strong> (power above 500M adds nothing)</li>
          </ul>
          <p class="kg-note">No seed letter is shown: only the Imperium threshold is published. The thresholds for A, B, C and D are not known.</p>
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
      <h2 id="ks-whatif-h">What if</h2>
      <p class="kg-note">
        Some councils zero their own players or turn power away to land in a lower seed. This panel shows the arithmetic only; it is not advice to do either. The Vacation Permit is the official way a king can take a governor out of the matchmaking score.
      </p>
      <p class="kg-note"><span class="kg-badge">Hypothesis</span> A Vacation Permit is treated here as removing the governor from this counted power. The patch notes only say "matchmaking score"; whether that is the same number is not stated.</p>
      <dl class="ks-stats" data-whatif-result aria-live="polite">
        <div><dt>Counted now</dt><dd>{formatCompact(result.counted)}</dd></div>
        <div><dt>With your marks</dt><dd data-after>{formatCompact(after.counted)}</dd></div>
        <div><dt>Change</dt><dd data-delta>{marks === 0 ? "No marks yet" : `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${formatCompact(Math.abs(delta))}`}</dd></div>
        <div><dt>Imperium threshold</dt><dd>{after.imperium.reached ? "reached" : `${formatCompact(after.imperium.gap)} short`}</dd></div>
      </dl>
      {marks > 0 && <div class="kg-actions"><button type="button" class="btn btn-secondary" onClick={() => onChange({ vacation: [], zeroed: {} })}>Clear all marks</button></div>}
      <details class="ks-details">
        <summary>Mark governors ({all.length} highest shown)</summary>
        <div class="kg-table-wrap" tabIndex={0} role="region" aria-label="Mark governors">
          <table class="kg-table ks-whatif" data-whatif>
            <caption class="visually-hidden">Governors by power, with what-if marks</caption>
            <thead>
              <tr>
                <th scope="col" class="num">Rank</th>
                <th scope="col">Governor</th>
                <th scope="col" class="num">Power</th>
                <th scope="col">Vacation Permit</th>
                <th scope="col">Power after zeroing</th>
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
                        aria-label={`Vacation Permit for ${label}`}
                        checked={vac.has(g.id)}
                        onChange={(e) => {
                          const on = (e.currentTarget as HTMLInputElement).checked;
                          onChange({ ...w, vacation: on ? [...w.vacation, g.id] : w.vacation.filter((x) => x !== g.id) });
                        }}
                      />
                    </td>
                    <td>
                      <ZeroInput id={`ks-zero-${g.id}`} label={`Power after zeroing for ${label}`} value={w.zeroed[g.id]} max={g.power} onValue={(v) => {
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
        <p class="kg-hint">The row after rank {SEED_RULE.topN} is the first governor who is not counted now. Removing someone above moves them in.</p>
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
    {bad && <p id={`${id}-error`} class="kg-error">Enter a power below {formatCompact(max)}.</p>}
    </>
  );
}
