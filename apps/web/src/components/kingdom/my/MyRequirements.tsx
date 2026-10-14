// F-30 My requirements (player side): open the council's card link, type your own numbers,
// see your target and progress. Also works without a link (pick a preset or type a formula).
import {
  FORMULA_PRESETS, MEASURED_AS, SHARE_ERROR_TEXT, VAR_NOUN, decodeShare, defaultRequirementsCard, evaluatePlayer, excludedDeadsText, explainFormula, groupFor, groupText,
  formatFormula, formatInt, parseFormula, parseRequirementsCard, presetById, shareFromHash, stageLabel, targetFor, usedVariables,
  type FormulaVar, type FormulaVars, type PowerBand, type RequirementsCard, type TargetInfo,
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
const PRESET_OPTIONS = [...FORMULA_PRESETS.map((p) => ({ value: p.id, label: p.label })), { value: CUSTOM, label: "Digitar a fórmula do meu reino" }];

const qty = (n: number): string => formatInt(n);
const bandText = (b: PowerBand): string =>
  `${b.maxPower === null ? `${qty(b.minPower)} de poder ou mais` : `${qty(b.minPower)} a menos de ${qty(b.maxPower)} de poder`}: ${b.percent}% do poder`;

function statLabel(v: FormulaVar): string {
  if (v === "kp") return "Meus pontos de abate ganhos desde a leitura inicial";
  return `Meus ${VAR_NOUN[v].many} desde a leitura inicial`;
}

/** " (250% de 10.500.000 × 80% para Contas com menos de 6 meses)" ou "" quando não há o que explicar. */
function targetDetail(t: TargetInfo, power: number | null): string {
  const parts: string[] = [];
  if (t.band) parts.push(`${t.band.percent}% de ${formatInt(power ?? 0)}`);
  else if (t.group) parts.push(`${formatInt(t.baseTarget)}`);
  if (t.group) parts.push(`${t.group.percent}% para ${t.group.name}`);
  return parts.length ? ` (${parts.join(" × ")})` : "";
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
  /** Id of the card group the player belongs to ("" = the normal target). */
  const [group, setGroup] = useState("");
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
          setGroup(prev?.group ?? "");
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
        setGroup(mine.group ?? "");
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

  if (phase.kind === "loading") return <p class="kg-status" role="status">Carregando…</p>;

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
  const groupId = groupFor(card, group)?.id ?? null;
  const result = parsed.ok ? evaluatePlayer(card, vars, { excludedDeads, groupId }) : null;
  const needsTarget = card.requirement.mode === "fixed" || power !== null;
  const myTarget = power !== null ? targetFor(card, power, groupId) : card.requirement.mode === "fixed" ? targetFor(card, 0, groupId) : null;

  const setStat = (v: FormulaVar, x: string) => { setStats((s) => ({ ...s, [v]: x })); setStatus(""); };

  let summary = "";
  if (!parsed.ok) summary = self ? "Escolha um modelo ou digite uma fórmula para começar." : "A fórmula deste cartão tem um erro. Peça ao seu conselho para corrigir e publicar de novo.";
  else if (hasErrors) summary = "Corrija os campos destacados para ver o seu progresso.";
  else if (card.requirement.mode === "percent" && card.requirement.bands.length === 0) summary = "Digite a porcentagem do poder que o seu conselho pediu.";
  else if (!needsTarget) summary = "Digite o seu poder para ver a sua meta.";
  else if (result && result.ok) {
    if (result.target === null) summary = "Nenhuma faixa deste cartão cobre o seu poder. Pergunte ao seu conselho qual meta vale para você.";
    else if (result.met) summary = `Você tem ${formatInt(result.dkp)} de DKP: cumpre a meta de ${formatInt(result.target)}.`;
    else summary = `Você tem ${formatInt(result.dkp)} de ${formatInt(result.target)} de DKP (${Math.floor(result.percentOfTarget ?? 0)}%). Faltam ${formatInt(result.remaining ?? 0)}.`;
  } else if (result && !result.ok) summary = result.error.message;

  const ways = result && result.ok && result.met === false && result.linear ? [...result.ways].sort((a, b) => a.unitsNeeded - b.unitsNeeded) : [];
  const progress = result && result.ok && result.target !== null && needsTarget && !hasErrors
    ? (result.target > 0 ? Math.max(0, Math.min(100, (result.dkp / result.target) * 100)) : 100)
    : null;

  function onSave() {
    try {
      saveMine({ card: self ? { ...card, id: "self" } : card, myStats: stats, selfMade: self, ...(excluded ? { excludedDeads: excluded } : {}), ...(groupId ? { group: groupId } : {}) }, kingdomStorage().st);
      setSaveError("");
      setStatus("Salvo neste aparelho. Abra esta página de novo para continuar de onde parou.");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }

  return (
    <div class="km">
      {phase.linkError && <p class="kg-error km-alert" role="alert" data-link-error>{phase.linkError}</p>}

      {self ? (
        <section class="kg-card" aria-labelledby="km-self-h" data-self>
          <h2 id="km-self-h">{phase.linkError ? "Ou configure a fórmula você mesmo" : "Sem link do cartão? Configure você mesmo"}</h2>
          <p class="kg-note">Se o seu conselho mandou um link, abra-o: ele preenche isto para você. Senão, escolha um exemplo publicado ou digite a fórmula do seu reino como o seu conselho a escreveu.</p>
          <SelectField id="km-preset" label="Fórmula" value={selfPreset} options={PRESET_OPTIONS} onValue={setSelfPreset} />
          {selfPreset === CUSTOM
            ? <FormulaField id="km-formula" label="Fórmula do seu reino" value={selfFormula} onValue={setSelfFormula} />
            : parsed.ok && <p class="kr-explain" data-explain="km-preset">{explainFormula(parsed.ast)}</p>}
          <TextField id="km-pct" label="Seu requisito (% do poder)" hint="A porcentagem que o seu conselho pediu, ex.: 250 para 250% do poder." value={selfPct} onValue={setSelfPct} error={errorOf(pctP)} inputMode="decimal" placeholder="250" />
          <p class="kg-hint">Você digitou esta fórmula; confira com o aviso do seu reino.</p>
        </section>
      ) : (
        <section class="kg-card" aria-labelledby="km-card-h" data-card>
          <h2 id="km-card-h">{card.title || (card.kingdom ? `Requisitos de ${card.kingdom}` : "Requisitos do seu reino")}</h2>
          <p class="km-byline" data-byline>Este cartão foi escrito pelo seu conselho, não pelo KingdomOps.</p>
          <dl class="km-dl">
            {card.kingdom && <div><dt>Reino</dt><dd>{card.kingdom}</dd></div>}
            <div><dt>Fase</dt><dd>{stageLabel(card)}</dd></div>
            <div>
              <dt>Fórmula de DKP</dt>
              <dd>
                {parsed.ok ? (<><p data-explain="card">{explainFormula(parsed.ast)}</p><p class="kg-hint">Fórmula: <code>{formatFormula(parsed.ast)}</code></p></>)
                  : <p class="kg-error">{parsed.error.message}</p>}
              </dd>
            </div>
            <div>
              <dt>Requisito</dt>
              <dd>
                {card.requirement.mode === "fixed" ? `${formatInt(card.requirement.target)} de DKP para todos`
                  : card.requirement.bands.length === 0 ? "Não definido neste cartão."
                  : card.requirement.bands.length === 1 && card.requirement.bands[0]!.minPower === 0 && card.requirement.bands[0]!.maxPower === null
                    ? `${card.requirement.bands[0]!.percent}% do seu poder em DKP`
                    : <ul class="km-bands">{card.requirement.bands.map((b, i) => <li key={i}>{bandText(b)}</li>)}</ul>}
              </dd>
            </div>
            {card.excludedDeads.enabled && <div><dt>Mortos excluídos</dt><dd data-excluded-rule>{excludedDeadsText(card.excludedDeads)}</dd></div>}
            {card.groups.length > 0 && (
              <div>
                <dt>Grupos de requisito (definidos pelo seu conselho)</dt>
                <dd><ul class="km-bands" data-groups>{card.groups.map((g) => <li key={g.id}>{groupText(g)}</li>)}</ul></dd>
              </div>
            )}
            <div><dt>Qual poder conta</dt><dd data-basis>{card.powerBasis}</dd></div>
            <div><dt>Medido como</dt><dd>{MEASURED_AS}</dd></div>
            {card.notes && <div><dt>Notas</dt><dd class="km-notes">{card.notes}</dd></div>}
          </dl>
        </section>
      )}

      <section class="kg-card" aria-labelledby="km-stats-h">
        <h2 id="km-stats-h">Meus números</h2>
        <p class="kg-hint" id="km-delta-hint">Digite o que você ganhou desde a leitura inicial (o delta): seu número agora menos o seu número quando a leitura inicial foi feita. Aceita 1200000, 10.5m ou 300k.</p>
        <div class="km-fields">
          {card.groups.length > 0 && (
            <SelectField
              id="km-group"
              label="Meu grupo"
              hint="Escolha o grupo em que o seu conselho colocou você, se houver."
              value={groupId ?? ""}
              options={[{ value: "", label: "Nenhum destes (meta normal)" }, ...card.groups.map((g) => ({ value: g.id, label: `${g.name} (${g.percent}%)` }))]}
              onValue={(v) => { setGroup(v); setStatus(""); }}
            />
          )}
          <TextField id="km-power"label={`Meu poder (${card.powerBasis})`} value={stats.power ?? ""} onValue={(v) => setStat("power", v)} error={errorOf(powerP)} placeholder="ex.: 10.5m" />
          {used.map((v) => (
            <TextField key={v} id={`km-${v}`} label={statLabel(v)} value={stats[v] ?? ""} onValue={(x) => setStat(v, x)} error={errorOf(statP[v])} placeholder="0" />
          ))}
          {exclusionOn && (
            <TextField
              id="km-excluded-deads"
              label="Mortos em dias excluídos"
              hint={`Mortos nos dias em que você foi ${card.excludedDeads.label}. Fazem parte dos seus mortos acima; são descontados antes de calcular o seu DKP.`}
              value={excluded}
              onValue={(x) => { setExcluded(x); setStatus(""); }}
              error={errorOf(excludedP)}
              placeholder="0"
            />
          )}
        </div>
      </section>

      <section class="kg-card" aria-labelledby="km-progress-h" data-progress-section>
        <h2 id="km-progress-h">Meu progresso</h2>
        <p class="km-summary" role="status" aria-live="polite" data-summary>{summary}</p>
        {result && result.ok && !hasErrors && (anyStat || needsTarget) && (
          <dl class="km-results">
            {exclusionOn && excludedDeads > 0 && <div data-row="counted-deads"><dt>Mortos que contam</dt><dd>{formatInt(Math.max(0, (vars.deads ?? 0) - excludedDeads))}</dd></div>}
            <div data-row="dkp"><dt>DKP até agora</dt><dd>{formatInt(result.dkp)}</dd></div>
            {myTarget && <div data-row="target"><dt>Minha meta</dt><dd>{formatInt(myTarget.target)}{targetDetail(myTarget, power)}</dd></div>}
            {result.remaining !== null && needsTarget && <div data-row="remaining"><dt>Falta</dt><dd>{result.remaining === 0 ? "Nada: meta cumprida" : formatInt(result.remaining)}</dd></div>}
          </dl>
        )}
        {progress !== null && result && result.ok && (
          <div class="km-bar-wrap">
            <div class="km-bar" role="progressbar" aria-label="Progresso rumo à minha meta" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(progress)} aria-valuetext={`${Math.floor(progress)}% da meta`} data-progress={Math.floor(progress)}>
              <div class="km-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <p class="km-bar-text">{Math.floor(result.percentOfTarget ?? 100)}% da meta</p>
          </div>
        )}
        {ways.length > 0 && (
          <p data-ways>Para fechar a diferença você precisaria de cerca de {ways.map((w) => `${formatInt(w.unitsNeeded)} ${w.unitsNeeded === 1 ? VAR_NOUN[w.variable].one : VAR_NOUN[w.variable].many} a mais`).join(" ou ")} (cada um sozinho; uma mistura também serve).</p>
        )}
        {card.presetId === "k2779-kvk2" && !card.excludedDeads.enabled && presetById("k2779-kvk2")?.ruleNote && <p class="kg-hint">{presetById("k2779-kvk2")!.ruleNote}</p>}
        <div class="kg-actions">
          <button type="button" class="btn btn-primary" onClick={onSave}>Salvar neste aparelho</button>
        </div>
        {saveError && <p class="kg-error" role="alert">{saveError}</p>}
        <p class="kg-status" role="status" aria-live="polite">{status}</p>
      </section>
    </div>
  );
}
