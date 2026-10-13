// F-34 requirements card builder + DKP formula sandbox (council side).
import {
  FORMULA_PRESETS, REQ_MAX_SAMPLES, REQ_STAGES, VAR_NOUN, WEIGHTS_NOT_COMPARABLE, evaluatePlayer, formatCompact, formatInt,
  presetById, rankSamples, usedVariables, type FormulaVar, type RequirementsCard, type ReqStage,
} from "@rokadm/planner";
import type { JSX } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { linkLengthHint } from "../../../lib/kingdom-share";
import { kingdomStorage } from "../../../lib/kingdom-store";
import {
  EXAMPLE_PERCENT, MAX_BANDS, cardTitle, cardToForm, deleteCard, emptyBand, emptySample, formToCard, listCards, newCard, publishLink, saveCard,
  type CardForm, type SampleRow,
} from "../../../lib/kingdom-requirements";
import ConfirmAction from "../shared/ConfirmAction";
import CopyText from "../shared/CopyText";
import { SelectField, TextAreaField, TextField } from "../shared/Field";
import FormulaField, { formulaState } from "./FormulaField";

const STAGE_OPTIONS = REQ_STAGES.map((s) => ({ value: s, label: s === "other" ? "Other (type it)" : s }));
const CUSTOM = "custom";
const PRESET_OPTIONS = [...FORMULA_PRESETS.map((p) => ({ value: p.id, label: p.label })), { value: CUSTOM, label: "Your own formula" }];
const COMPARE_OPTIONS = [{ value: "", label: "Choose a preset (optional)" }, ...FORMULA_PRESETS.map((p) => ({ value: p.id, label: p.label }))];
/** Stat columns always shown in the sandbox; other variables appear when the formula uses them. */
const BASE_STATS: FormulaVar[] = ["t4", "t5", "deads"];

const statLabel = (v: FormulaVar): string => (v === "power" ? "Power" : v === "kp" ? "Kill points" : VAR_NOUN[v].many[0]!.toUpperCase() + VAR_NOUN[v].many.slice(1));
const pct = (n: number | null): string => (n === null ? "—" : `${Math.floor(n)}%`);

export default function RequirementsBuilder(): JSX.Element {
  const [form, setForm] = useState<CardForm>(() => cardToForm(newCard()));
  const [saved, setSaved] = useState<RequirementsCard[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [status, setStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  const [link, setLink] = useState("");
  const [comparePreset, setComparePreset] = useState("");

  useEffect(() => {
    const { st, blocked } = kingdomStorage();
    setBlocked(blocked);
    setSaved(listCards(st));
  }, []);

  const set = <K extends keyof CardForm>(k: K, v: CardForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setLink("");
  };

  const check = useMemo(() => formToCard(form), [form]);
  const formula = formulaState(form.formula, true);
  const compare = formulaState(form.compare, false);
  const used = formula.parsed?.ok ? usedVariables(formula.parsed.ast) : [];
  const statCols: FormulaVar[] = [...BASE_STATS, ...used.filter((v) => v !== "power" && !BASE_STATS.includes(v))];
  if (compare.parsed?.ok) for (const v of usedVariables(compare.parsed.ast)) if (v !== "power" && !statCols.includes(v)) statCols.push(v);
  const preset = presetById(form.presetId);
  const fieldErrors = Object.keys(check.errors).length + check.bandIssues.length + (formula.error ? 1 : 0) + (compare.error ? 1 : 0);
  const canPublish = fieldErrors === 0;

  // ---- Formula / preset
  function pickPreset(id: string) {
    const p = presetById(id);
    setForm((f) => (p ? { ...f, presetId: p.id, formula: p.formula } : { ...f, presetId: null }));
    setLink("");
  }
  function editFormula(v: string) {
    setForm((f) => ({ ...f, formula: v, presetId: f.presetId && presetById(f.presetId)?.formula === v ? f.presetId : null }));
    setLink("");
  }

  // ---- Bands
  const setBand = (i: number, k: "min" | "max" | "pct", v: string) => set("bands", form.bands.map((b, j) => (j === i ? { ...b, [k]: v } : b)));
  function addBand() {
    const last = form.bands[form.bands.length - 1];
    set("bands", [...form.bands, emptyBand(last?.max ?? "")]);
  }
  const removeBand = (i: number) => set("bands", form.bands.filter((_, j) => j !== i));

  // ---- Samples
  const setSample = (id: string, patch: (s: SampleRow) => SampleRow) => set("samples", form.samples.map((s) => (s.id === id ? patch(s) : s)));
  const addSample = () => set("samples", [...form.samples, emptySample(form.samples.length)]);
  const removeSample = (id: string) => set("samples", form.samples.filter((s) => s.id !== id));

  const results = check.card.sampleAccounts.map((s) => ({ s, r: formula.parsed?.ok ? evaluatePlayer(check.card, s.stats) : null }));
  const passing = results.filter((x) => x.r?.ok && x.r.met === true).length;

  let summary: string;
  if (formula.error) summary = `Formula error: ${formula.error}`;
  else if (check.bandIssues.length || Object.keys(check.errors).some((k) => k.startsWith("band-") || k === "fixed")) summary = "Fix the requirement to see who passes.";
  else if (results.length === 0) summary = "Add a sample account to test the card.";
  else summary = `${passing} of ${results.length} sample account${results.length === 1 ? "" : "s"} meet${results.length === 1 && passing === 1 ? "s" : ""} the requirement.`;

  const rankA = useMemo(() => rankSamples(check.card.formula, check.card.sampleAccounts), [check]);
  const rankB = useMemo(() => (compare.parsed?.ok ? rankSamples(form.compare, check.card.sampleAccounts) : null), [check, form.compare]);

  // ---- Save / open / delete / publish
  function onSave() {
    setLink("");
    if (!canPublish) {
      setSaveError("Fix the highlighted fields first.");
      setStatus("");
      return;
    }
    try {
      const { st } = kingdomStorage();
      saveCard(check.card, st);
      setSaved(listCards(st));
      setSaveError("");
      setStatus(`Saved "${cardTitle(check.card)}" on this device.`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save.");
    }
  }
  function onOpen(c: RequirementsCard) {
    setForm(cardToForm(c));
    setLink("");
    setSaveError("");
    setStatus(`Opened "${cardTitle(c)}".`);
  }
  function onDelete(c: RequirementsCard) {
    const { st } = kingdomStorage();
    deleteCard(c.id, st);
    setSaved(listCards(st));
    setStatus(`Deleted "${cardTitle(c)}".`);
  }
  function onNew() {
    setForm(cardToForm(newCard()));
    setLink("");
    setSaveError("");
    setStatus("Started a new card.");
  }
  async function onPublish() {
    if (!canPublish) {
      setSaveError("Fix the highlighted fields first.");
      return;
    }
    setSaveError("");
    setLink(await publishLink(check.card));
    setStatus("Link ready. Copy it and post it where your players read announcements.");
  }

  const bandErr = (i: number, k: string) => check.errors[`band-${i}-${k}`];

  return (
    <div class="kr">
      {blocked && <p class="kg-error" data-blocked>This browser blocks saving. Your card lasts until you close this page; publish the link to keep it.</p>}

      <section class="kg-card" aria-labelledby="kr-about-h">
        <h2 id="kr-about-h">Card details</h2>
        <div class="kr-fields">
          <TextField id="kr-kingdom" label="Kingdom" hint="Up to 40 characters, e.g. K1234." value={form.kingdom} onValue={(v) => set("kingdom", v)} maxLength={40} />
          <TextField id="kr-title" label="Card title (optional)" value={form.title} onValue={(v) => set("title", v)} maxLength={80} />
          <SelectField<ReqStage> id="kr-stage" label="Stage" value={form.stage} options={STAGE_OPTIONS} onValue={(v) => set("stage", v)} />
          {form.stage === "other" && <TextField id="kr-stage-other" label="Stage name" value={form.stageOther} onValue={(v) => set("stageOther", v)} maxLength={40} />}
        </div>
      </section>

      <section class="kg-card" aria-labelledby="kr-formula-h">
        <h2 id="kr-formula-h">DKP formula</h2>
        <p class="kg-note">DKP is not a game number: every kingdom sets its own formula. Start from a published example or write your own.</p>
        <SelectField id="kr-preset" label="Start from" value={form.presetId ?? CUSTOM} options={PRESET_OPTIONS} onValue={pickPreset} />
        <FormulaField id="kr-formula" label="Formula" value={form.formula} onValue={editFormula} />
        {preset ? (
          <div class="kr-source" data-source>
            <p><strong>{preset.label}</strong>: published kingdom formula (fact {preset.factId}, {preset.confidence} confidence).</p>
            {preset.ruleNote && <p data-rule-note>Rule note: {preset.ruleNote}</p>}
          </div>
        ) : (
          <p class="kr-source" data-source>Your own formula: set by your council.</p>
        )}
        <p class="kg-note" data-not-comparable>{WEIGHTS_NOT_COMPARABLE}</p>
      </section>

      <section class="kg-card" aria-labelledby="kr-req-h">
        <h2 id="kr-req-h">Requirement</h2>
        <fieldset class="kr-choice">
          <legend class="kg-label">Requirement type</legend>
          {([["percent", "Percent of power, by power band"], ["fixed", "One fixed DKP target for everyone"]] as const).map(([v, l]) => (
            <label key={v} class="kr-radio">
              <input type="radio" name="kr-mode" value={v} checked={form.mode === v} onChange={() => set("mode", v)} />
              <span>{l}</span>
            </label>
          ))}
        </fieldset>
        {form.mode === "percent" ? (
          <div class="kr-bands">
            <p class="kg-hint">A band covers power from its lowest value up to (not including) its upper limit. Leave the last upper limit blank for "and above". {EXAMPLE_PERCENT}% is an example from a real kingdom (fact B08-0002); your council sets the real numbers.</p>
            {form.bands.map((b, i) => (
              <fieldset key={b.key} class="kr-band" data-band={i}>
                <legend class="kg-label">Band {i + 1}</legend>
                <div class="kr-band-fields">
                  <TextField id={`kr-band-${i}-min`} label="From power" value={b.min} onValue={(v) => setBand(i, "min", v)} error={bandErr(i, "min")} placeholder="0" />
                  <TextField id={`kr-band-${i}-max`} label="Up to power" hint="Blank = no limit" value={b.max} onValue={(v) => setBand(i, "max", v)} error={bandErr(i, "max")} placeholder="e.g. 20m" />
                  <TextField id={`kr-band-${i}-pct`} label="DKP target (% of power)" value={b.pct} onValue={(v) => setBand(i, "pct", v)} error={bandErr(i, "pct")} inputMode="decimal" placeholder="250" />
                </div>
                {form.bands.length > 1 && <button type="button" class="btn btn-secondary" aria-label={`Remove band ${i + 1}`} onClick={() => removeBand(i)}>Remove band</button>}
              </fieldset>
            ))}
            {check.bandIssues.length > 0 && (
              <ul class="kr-issues" data-band-issues>
                {check.bandIssues.map((x, i) => <li key={i} class="kg-error">{x.message}</li>)}
              </ul>
            )}
            {form.bands.length < MAX_BANDS && <button type="button" class="btn btn-secondary" onClick={addBand}>Add band</button>}
          </div>
        ) : (
          <TextField id="kr-fixed" label="DKP target" hint="Accepts 5,000,000, 5m or 500k." value={form.fixed} onValue={(v) => set("fixed", v)} error={check.errors.fixed} placeholder="e.g. 5m" />
        )}
        <TextField
          id="kr-basis"
          label="Which power is the base"
          hint="No public source says which power counts (start scan, troop power or highest power), so this is your council's decision. It is shown on the card."
          value={form.powerBasis}
          onValue={(v) => set("powerBasis", v)}
          maxLength={120}
        />
        <p class="kg-note">Progress is measured as gains between the start scan and the end scan (the delta), not lifetime totals (fact B08-0002).</p>
        <TextAreaField id="kr-notes" label="Notes and exceptions (optional)" hint="Up to 1,000 characters. E.g. farms exempt, how zeroed days count." value={form.notes} onValue={(v) => set("notes", v)} maxLength={1000} rows={4} />
      </section>

      <section class="kg-card" aria-labelledby="kr-sandbox-h">
        <h2 id="kr-sandbox-h">Sandbox: test on sample accounts</h2>
        <p class="kg-note">Sample accounts stay on this device and are never put in the published link. Use made-up numbers, or numbers your players agreed to share.</p>
        <div class="kr-samples">
          {form.samples.map((s) => (
            <fieldset key={s.id} class="kr-sample" data-sample={s.id}>
              <legend class="kg-label">{s.name || "Unnamed account"}</legend>
              <div class="kr-sample-fields">
                <TextField id={`kr-s-${s.id}-name`} label="Name" value={s.name} onValue={(v) => setSample(s.id, (x) => ({ ...x, name: v }))} maxLength={40} />
                {(["power", ...statCols] as FormulaVar[]).map((v) => (
                  <TextField
                    key={v}
                    id={`kr-s-${s.id}-${v}`}
                    label={statLabel(v)}
                    value={s.values[v]}
                    onValue={(x) => setSample(s.id, (row) => ({ ...row, values: { ...row.values, [v]: x } }))}
                    error={check.errors[`sample-${s.id}-${v}`]}
                    placeholder="0"
                  />
                ))}
              </div>
              <button type="button" class="btn btn-secondary" aria-label={`Remove ${s.name || "this account"}`} onClick={() => removeSample(s.id)}>Remove</button>
            </fieldset>
          ))}
        </div>
        {form.samples.length < REQ_MAX_SAMPLES && <button type="button" class="btn btn-secondary" onClick={addSample}>Add sample account</button>}

        <p class="kr-summary" role="status" aria-live="polite" data-summary>{summary}</p>
        {results.length > 0 && formula.parsed?.ok && (
          <div class="kg-table-wrap" role="region" aria-labelledby="kr-results-cap" tabIndex={0}>
            <table class="kg-table kr-table" data-results>
              <caption id="kr-results-cap" class="kr-caption">Sample results</caption>
              <thead><tr><th scope="col">Account</th><th scope="col" class="num">DKP</th><th scope="col" class="num">Target</th><th scope="col" class="num">%</th><th scope="col">Result</th></tr></thead>
              <tbody>
                {results.map(({ s, r }) => (
                  <tr key={s.id} data-result={s.id}>
                    <th scope="row">{s.name || "Unnamed"}</th>
                    {r && r.ok ? (
                      <>
                        <td class="num" title={formatInt(r.dkp)}>{formatCompact(r.dkp)}</td>
                        <td class="num">{r.target === null ? "No band" : formatCompact(r.target)}</td>
                        <td class="num">{pct(r.percentOfTarget)}</td>
                        <td data-met={String(r.met)}>{r.met === null ? "—" : r.met ? "Pass" : "Below"}</td>
                      </>
                    ) : (
                      <td colSpan={4} class="kg-error">{r && !r.ok ? r.error.message : "—"}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section class="kg-card" aria-labelledby="kr-compare-h">
        <h2 id="kr-compare-h">Compare with another formula (optional)</h2>
        <p class="kg-note">See how the ranking of your sample accounts changes under a second formula. It is not published.</p>
        <SelectField
          id="kr-compare-preset"
          label="Fill from a preset"
          value={comparePreset}
          options={COMPARE_OPTIONS}
          onValue={(v) => { setComparePreset(v); const p = presetById(v); if (p) set("compare", p.formula); }}
        />
        <FormulaField id="kr-compare" label="Second formula" value={form.compare} onValue={(v) => { setComparePreset(""); set("compare", v); }} required={false} hint="Leave blank to skip." />
        {rankB && rankA.length > 0 && (
          <div class="kg-table-wrap" role="region" aria-labelledby="kr-compare-cap" tabIndex={0}>
            <table class="kg-table kr-table" data-compare>
              <caption id="kr-compare-cap" class="kr-caption">Ranking: card formula vs second formula</caption>
              <thead><tr><th scope="col">Account</th><th scope="col" class="num">Rank now</th><th scope="col" class="num">Rank with second</th><th scope="col">Change</th></tr></thead>
              <tbody>
                {rankA.map((a, i) => {
                  const b = rankB[i]!;
                  const change = a.rank === null || b.rank === null ? "—" : b.rank < a.rank ? `Up ${a.rank - b.rank}` : b.rank > a.rank ? `Down ${b.rank - a.rank}` : "Same";
                  return (
                    <tr key={a.id}>
                      <th scope="row">{a.name || "Unnamed"}</th>
                      <td class="num">{a.rank ?? "—"}</td>
                      <td class="num">{b.rank ?? "—"}</td>
                      <td>{change}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section class="kg-card" aria-labelledby="kr-publish-h">
        <h2 id="kr-publish-h">Save and publish</h2>
        <p class="kg-note">Publishing makes a link to the My requirements page. Players open it, type their own numbers and see their target and progress. The link carries the card only, never the sample accounts.</p>
        <div class="kg-actions">
          <button type="button" class="btn btn-primary" onClick={onPublish} data-publish>Publish card</button>
          <button type="button" class="btn btn-secondary" onClick={onSave}>Save on this device</button>
          <button type="button" class="btn btn-secondary" onClick={onNew}>New card</button>
        </div>
        {saveError && <p class="kg-error" role="alert">{saveError}</p>}
        <p class="kg-status" role="status" aria-live="polite">{status}</p>
        {link && (
          <div class="kr-link" data-link>
            <CopyText id="kr-link" label="Link for your players" text={link} variant="link" copyLabel="Copy link" hint="Anyone with this link can read the card." />
            {linkLengthHint(link) === "long" && <p class="kg-error" data-long>This link is long ({link.length.toLocaleString("en-US")} characters) and may be cut in Discord (2,000 per message). Shorten the notes, or post it in a channel topic or document.</p>}
            <p><a href={link.replace(/^https?:\/\/[^/]+/, "")} target="_blank" rel="noopener">Preview as a player</a></p>
          </div>
        )}
        <h3>Saved cards</h3>
        {saved.length === 0 ? (
          <p class="kg-note" data-saved-empty>No cards saved on this device yet.</p>
        ) : (
          <ul class="kr-saved" data-saved>
            {saved.map((c) => (
              <li key={c.id}>
                <span class="kr-saved-name">{cardTitle(c)}</span>
                <div class="kg-actions">
                  <button type="button" class="btn btn-secondary" aria-label={`Open ${cardTitle(c)}`} onClick={() => onOpen(c)}>Open</button>
                  <ConfirmAction label="Delete" ariaLabel={`Delete ${cardTitle(c)}`} question={`Delete "${cardTitle(c)}"?`} onConfirm={() => onDelete(c)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
