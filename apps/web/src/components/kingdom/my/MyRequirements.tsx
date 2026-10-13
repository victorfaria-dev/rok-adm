// F-30 My requirements (player side): open the council's card link, type your own numbers,
// see your target and progress. Also works without a link (pick a preset or type a formula).
import {
  FORMULA_PRESETS, MEASURED_AS, SHARE_ERROR_TEXT, VAR_NOUN, decodeShare, defaultRequirementsCard, evaluatePlayer, excludedDeadsText, explainFormula,
  formatFormula, formatInt, parseFormula, parseRequirementsCard, presetById, shareFromHash, stageLabel, targetFor, usedVariables,
  type FormulaVar, type FormulaVars, type PowerBand, type RequirementsCard,
} from "@rokadm/planner";
import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  errorOf, parseExcluded, parsePct, parseQty, saveMine, valueOf, latestMine, parseMyDoc, SHARE_KIND, type MyRequirementsDoc,
} from "../../../lib/kingdom-requirements";
import { kingdomStorage, listDocs } from "../../../lib/kingdom-store";
import { SelectField, TextField } from "../shared/Field";
import FormulaField from "../requirements/FormulaField";

type Source = "link" | "saved" | "self";
type Phase = { kind: "loading" } | { kind: "ready"; card: RequirementsCard | null; source: Source; linkError: string };

const CUSTOM = "custom";
const PRESET_OPTIONS = [...FORMULA_PRESETS.map((p) => ({ value: p.id, label: p.label })), { value: CUSTOM, label: "Type my kingdom's formula" }];

const qty = (n: number): string => formatInt(n);
const bandText = (b: PowerBand): string =>
  `${b.maxPower === null ? `${qty(b.minPower)} power and above` : `${qty(b.minPower)} to under ${qty(b.maxPower)} power`}: ${b.percent}% of power`;

function statLabel(v: FormulaVar): string {
  if (v === "kp") return "My kill points gained since the start scan";
  return `My ${VAR_NOUN[v].many} since the start scan`;
}

function savedFor(cardId: string): MyRequirementsDoc | null {
  const { st } = kingdomStorage();
  for (const d of listDocs("my-requirements", st)) {
    const m = parseMyDoc(d.data);
    if (m && m.card.id === cardId) return m;
  }
  return null;
}

export default function MyRequirements(): JSX.Element {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [stats, setStats] = useState<Partial<Record<FormulaVar, string>>>({});
  const [status, setStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  /** "Deads on excluded days", as typed (card rule excludedDeads). */
  const [excluded, setExcluded] = useState("");
  // Self-made card (no link)
  const [selfPreset, setSelfPreset] = useState<string>(FORMULA_PRESETS[0]!.id);
  const [selfFormula, setSelfFormula] = useState("");
  const [selfPct, setSelfPct] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      const code = shareFromHash(window.location.hash);
      if (code !== null) {
        const r = await decodeShare(code, SHARE_KIND, parseRequirementsCard);
        if (!alive) return;
        if (r.ok) {
          const prev = savedFor(r.data.id);
          setStats(prev?.myStats ?? {});
          setExcluded(prev?.excludedDeads ?? "");
          setPhase({ kind: "ready", card: r.data, source: "link", linkError: "" });
        } else {
          setPhase({ kind: "ready", card: null, source: "self", linkError: SHARE_ERROR_TEXT[r.error] });
        }
        return;
      }
      const mine = latestMine(kingdomStorage().st);
      if (!alive) return;
      if (mine && !mine.selfMade) {
        setStats(mine.myStats);
        setExcluded(mine.excludedDeads ?? "");
        setPhase({ kind: "ready", card: mine.card, source: "saved", linkError: "" });
      } else {
        if (mine) {
          setStats(mine.myStats);
          const p = FORMULA_PRESETS.find((x) => x.formula === mine.card.formula);
          setSelfPreset(p ? p.id : CUSTOM);
          if (!p) setSelfFormula(mine.card.formula);
          const b = mine.card.requirement.mode === "percent" ? mine.card.requirement.bands[0] : undefined;
          if (b) setSelfPct(String(b.percent));
        }
        setPhase({ kind: "ready", card: null, source: "self", linkError: "" });
      }
    }
    void load();
    const onHash = () => { setStatus(""); void load(); };
    window.addEventListener("hashchange", onHash);
    return () => { alive = false; window.removeEventListener("hashchange", onHash); };
  }, []);

  if (phase.kind === "loading") return <p class="kg-status" role="status">Loading…</p>;

  // The card in use: council card, or one built from the self-made inputs.
  const pctP = parsePct(selfPct);
  const selfCard: RequirementsCard = defaultRequirementsCard({
    id: "self",
    formula: selfPreset === CUSTOM ? selfFormula : presetById(selfPreset)!.formula,
    presetId: selfPreset === CUSTOM ? null : selfPreset,
    stage: "other",
    requirement: { mode: "percent", bands: valueOf(pctP) !== null ? [{ minPower: 0, maxPower: null, percent: valueOf(pctP)! }] : [] },
  }, new Date(0));
  const card = phase.card ?? selfCard;
  const self = phase.card === null;
  const parsed = parseFormula(card.formula);
  const used = parsed.ok ? usedVariables(parsed.ast).filter((v) => v !== "power") : [];

  const powerP = parseQty(stats.power ?? "");
  const statP = Object.fromEntries(used.map((v) => [v, parseQty(stats[v] ?? "")])) as Record<FormulaVar, ReturnType<typeof parseQty>>;
  // Deads on excluded days: only when the card's rule is on and the formula uses deads.
  const exclusionOn = card.excludedDeads.enabled && used.includes("deads");
  const excludedP = exclusionOn ? parseExcluded(excluded, valueOf(statP.deads)) : null;
  const hasErrors = [powerP, ...Object.values(statP), excludedP].some((p) => errorOf(p)) || !!errorOf(pctP);
  const vars: FormulaVars = { power: valueOf(powerP) ?? 0 };
  for (const v of used) vars[v] = valueOf(statP[v]) ?? 0;
  const anyStat = used.some((v) => valueOf(statP[v]) !== null);
  const power = valueOf(powerP);
  const excludedDeads = valueOf(excludedP) ?? 0;
  const result = parsed.ok ? evaluatePlayer(card, vars, { excludedDeads }) : null;
  const needsTarget = card.requirement.mode === "fixed" || power !== null;
  const myTarget = power !== null ? targetFor(card, power) : card.requirement.mode === "fixed" ? targetFor(card, 0) : null;

  const setStat = (v: FormulaVar, x: string) => { setStats((s) => ({ ...s, [v]: x })); setStatus(""); };

  let summary = "";
  if (!parsed.ok) summary = self ? "Pick a preset or type a formula to start." : "This card's formula has an error. Ask your council to fix and republish it.";
  else if (hasErrors) summary = "Fix the highlighted fields to see your progress.";
  else if (card.requirement.mode === "percent" && card.requirement.bands.length === 0) summary = "Enter the percent of power your council asked for.";
  else if (!needsTarget) summary = "Enter your power to see your target.";
  else if (result && result.ok) {
    if (result.target === null) summary = "No band on this card covers your power. Ask your council which target applies to you.";
    else if (result.met) summary = `You have ${formatInt(result.dkp)} DKP: you meet the target of ${formatInt(result.target)}.`;
    else summary = `You have ${formatInt(result.dkp)} DKP of ${formatInt(result.target)} (${Math.floor(result.percentOfTarget ?? 0)}%). ${formatInt(result.remaining ?? 0)} to go.`;
  } else if (result && !result.ok) summary = result.error.message;

  const ways = result && result.ok && result.met === false && result.linear ? [...result.ways].sort((a, b) => a.unitsNeeded - b.unitsNeeded) : [];
  const progress = result && result.ok && result.target !== null && needsTarget && !hasErrors
    ? (result.target > 0 ? Math.max(0, Math.min(100, (result.dkp / result.target) * 100)) : 100)
    : null;

  function onSave() {
    try {
      saveMine({ card: self ? { ...card, id: "self" } : card, myStats: stats, selfMade: self, ...(excluded ? { excludedDeads: excluded } : {}) }, kingdomStorage().st);
      setSaveError("");
      setStatus("Saved on this device. Open this page again to pick up where you left off.");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save.");
    }
  }

  return (
    <div class="km">
      {phase.linkError && <p class="kg-error km-alert" role="alert" data-link-error>{phase.linkError}</p>}

      {self ? (
        <section class="kg-card" aria-labelledby="km-self-h" data-self>
          <h2 id="km-self-h">{phase.linkError ? "Or set up your formula yourself" : "No card link? Set it up yourself"}</h2>
          <p class="kg-note">If your council sent you a link, open it instead: it fills this in for you. Otherwise pick a published example or type your kingdom's formula as your council wrote it.</p>
          <SelectField id="km-preset" label="Formula" value={selfPreset} options={PRESET_OPTIONS} onValue={setSelfPreset} />
          {selfPreset === CUSTOM
            ? <FormulaField id="km-formula" label="Your kingdom's formula" value={selfFormula} onValue={setSelfFormula} />
            : parsed.ok && <p class="kr-explain" data-explain="km-preset">{explainFormula(parsed.ast)}</p>}
          <TextField id="km-pct" label="Your requirement (% of power)" hint="The percent your council asked for, e.g. 250 for 250% of power." value={selfPct} onValue={setSelfPct} error={errorOf(pctP)} inputMode="decimal" placeholder="250" />
          <p class="kg-hint">You entered this formula yourself; check it against your kingdom's announcement.</p>
        </section>
      ) : (
        <section class="kg-card" aria-labelledby="km-card-h" data-card>
          <h2 id="km-card-h">{card.title || (card.kingdom ? `${card.kingdom} requirements` : "Your kingdom's requirements")}</h2>
          <p class="km-byline" data-byline>This card was written by your council, not by KingdomOps.</p>
          <dl class="km-dl">
            {card.kingdom && <div><dt>Kingdom</dt><dd>{card.kingdom}</dd></div>}
            <div><dt>Stage</dt><dd>{stageLabel(card)}</dd></div>
            <div>
              <dt>DKP formula</dt>
              <dd>
                {parsed.ok ? (<><p data-explain="card">{explainFormula(parsed.ast)}</p><p class="kg-hint">Formula: <code>{formatFormula(parsed.ast)}</code></p></>)
                  : <p class="kg-error">{parsed.error.message}</p>}
              </dd>
            </div>
            <div>
              <dt>Requirement</dt>
              <dd>
                {card.requirement.mode === "fixed" ? `${formatInt(card.requirement.target)} DKP for everyone`
                  : card.requirement.bands.length === 0 ? "Not set on this card."
                  : card.requirement.bands.length === 1 && card.requirement.bands[0]!.minPower === 0 && card.requirement.bands[0]!.maxPower === null
                    ? `${card.requirement.bands[0]!.percent}% of your power as DKP`
                    : <ul class="km-bands">{card.requirement.bands.map((b, i) => <li key={i}>{bandText(b)}</li>)}</ul>}
              </dd>
            </div>
            {card.excludedDeads.enabled && <div><dt>Excluded deads</dt><dd data-excluded-rule>{excludedDeadsText(card.excludedDeads)}</dd></div>}
            <div><dt>Which power counts</dt><dd data-basis>{card.powerBasis}</dd></div>
            <div><dt>Measured as</dt><dd>{MEASURED_AS}</dd></div>
            {card.notes && <div><dt>Notes</dt><dd class="km-notes">{card.notes}</dd></div>}
          </dl>
        </section>
      )}

      <section class="kg-card" aria-labelledby="km-stats-h">
        <h2 id="km-stats-h">My numbers</h2>
        <p class="kg-hint" id="km-delta-hint">Enter what you gained since the start scan (the delta): your number now minus your number when the start scan was taken. Accepts 1,200,000, 10.5m or 300k.</p>
        <div class="km-fields">
          <TextField id="km-power" label={`My power (${card.powerBasis})`} value={stats.power ?? ""} onValue={(v) => setStat("power", v)} error={errorOf(powerP)} placeholder="e.g. 10.5m" />
          {used.map((v) => (
            <TextField key={v} id={`km-${v}`} label={statLabel(v)} value={stats[v] ?? ""} onValue={(x) => setStat(v, x)} error={errorOf(statP[v])} placeholder="0" />
          ))}
          {exclusionOn && (
            <TextField
              id="km-excluded-deads"
              label="Deads on excluded days"
              hint={`Deads on days you were ${card.excludedDeads.label}. Part of your deads above; they are taken off before your DKP is worked out.`}
              value={excluded}
              onValue={(x) => { setExcluded(x); setStatus(""); }}
              error={errorOf(excludedP)}
              placeholder="0"
            />
          )}
        </div>
      </section>

      <section class="kg-card" aria-labelledby="km-progress-h" data-progress-section>
        <h2 id="km-progress-h">My progress</h2>
        <p class="km-summary" role="status" aria-live="polite" data-summary>{summary}</p>
        {result && result.ok && !hasErrors && (anyStat || needsTarget) && (
          <dl class="km-results">
            {exclusionOn && excludedDeads > 0 && <div data-row="counted-deads"><dt>Deads that count</dt><dd>{formatInt(Math.max(0, (vars.deads ?? 0) - excludedDeads))}</dd></div>}
            <div data-row="dkp"><dt>DKP so far</dt><dd>{formatInt(result.dkp)}</dd></div>
            {myTarget && <div data-row="target"><dt>My target</dt><dd>{formatInt(myTarget.target)}{myTarget.band ? ` (${myTarget.band.percent}% of ${formatInt(power ?? 0)})` : ""}</dd></div>}
            {result.remaining !== null && needsTarget && <div data-row="remaining"><dt>Still to go</dt><dd>{result.remaining === 0 ? "Nothing: target met" : formatInt(result.remaining)}</dd></div>}
          </dl>
        )}
        {progress !== null && result && result.ok && (
          <div class="km-bar-wrap">
            <div class="km-bar" role="progressbar" aria-label="Progress toward my target" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(progress)} aria-valuetext={`${Math.floor(progress)}% of target`} data-progress={Math.floor(progress)}>
              <div class="km-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <p class="km-bar-text">{Math.floor(result.percentOfTarget ?? 100)}% of target</p>
          </div>
        )}
        {ways.length > 0 && (
          <p data-ways>To close the gap you'd need about {ways.map((w) => `${formatInt(w.unitsNeeded)} more ${w.unitsNeeded === 1 ? VAR_NOUN[w.variable].one : VAR_NOUN[w.variable].many}`).join(" or ")} (each on its own; a mix also works).</p>
        )}
        {card.presetId === "k2779-kvk2" && !card.excludedDeads.enabled && presetById("k2779-kvk2")?.ruleNote && <p class="kg-hint">{presetById("k2779-kvk2")!.ruleNote}</p>}
        <div class="kg-actions">
          <button type="button" class="btn btn-primary" onClick={onSave}>Save on this device</button>
        </div>
        {saveError && <p class="kg-error" role="alert">{saveError}</p>}
        <p class="kg-status" role="status" aria-live="polite">{status}</p>
      </section>
    </div>
  );
}
