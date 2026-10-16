// F-34 requirements card builder + DKP formula sandbox (council side).
import {
  EXCLUDED_DEADS_DEFAULT_LABEL, EXCLUDED_DEADS_FACT_ID, EXCLUDED_DEADS_LABEL_MAX, FORMULA_PRESETS, REQUIREMENT_FACT_ID, REQ_GROUP_NAME_MAX, REQ_MAX_SAMPLES, REQ_STAGES, VAR_NOUN,
  WEIGHTS_NOT_COMPARABLE, evaluatePlayer, excludedDeadsText, formatCompact, formatInt, presetById, rankSamples, usedVariables, type FormulaVar, type RequirementsCard, type ReqStage,
} from "@rokadm/planner";
import type { JSX } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { linkLengthHint } from "../../../lib/kingdom-share";
import { downloadText, kingdomStorage } from "../../../lib/kingdom-store";
import {
  EXAMPLE_PERCENT, MAX_BANDS, MAX_GROUPS, cardTitle, cardToForm, deleteCard, emptyBand, emptyGroup, emptySample, formToCard, listCards, newCard, publishLink, rosterFromCsv, rosterToCsv, saveCard,
  type CardForm, type SampleRow,
} from "../../../lib/kingdom-requirements";
import ConfirmAction from "../shared/ConfirmAction";
import CsvImport from "../shared/CsvImport";
import CopyText from "../shared/CopyText";
import { CheckField, SelectField, TextAreaField, TextField } from "../shared/Field";
import FormulaField, { formulaState } from "./FormulaField";

const STAGE_OPTIONS = REQ_STAGES.map((s) => ({ value: s, label: s === "other" ? "Outra (digite)" : s }));
const CUSTOM = "custom";
const PRESET_OPTIONS = [...FORMULA_PRESETS.map((p) => ({ value: p.id, label: p.label })), { value: CUSTOM, label: "Sua própria fórmula" }];
const COMPARE_OPTIONS = [{ value: "", label: "Escolha um modelo (opcional)" }, ...FORMULA_PRESETS.map((p) => ({ value: p.id, label: p.label }))];
/** Stat columns always shown in the sandbox; other variables appear when the formula uses them. */
const BASE_STATS: FormulaVar[] = ["t4", "t5", "deads"];

const statLabel = (v: FormulaVar): string => (v === "power" ? "Poder" : v === "kp" ? "Pontos de abate" : VAR_NOUN[v].many[0]!.toUpperCase() + VAR_NOUN[v].many.slice(1));
const pct = (n: number | null): string => (n === null ? "—" : `${Math.floor(n)}%`);

export default function RequirementsBuilder(): JSX.Element {
  const [form, setForm] = useState<CardForm>(() => cardToForm(newCard()));
  const [saved, setSaved] = useState<RequirementsCard[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [status, setStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  const [link, setLink] = useState("");
  const [comparePreset, setComparePreset] = useState("");
  const [rosterStatus, setRosterStatus] = useState("");
  const [rosterErrors, setRosterErrors] = useState<Array<{ line: number; message: string }>>([]);

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

  // ---- Groups
  const setGroup = (i: number, k: "name" | "pct", v: string) => set("groups", form.groups.map((g, j) => (j === i ? { ...g, [k]: v } : g)));
  const addGroup = () => set("groups", [...form.groups, emptyGroup(form.groups.map((g) => g.id))]);
  const removeGroup = (i: number) => set("groups", form.groups.filter((_, j) => j !== i));

  // ---- Samples
  const setSample = (id: string, patch: (s: SampleRow) => SampleRow) => set("samples", form.samples.map((s) => (s.id === id ? patch(s) : s)));
  const addSample = () => set("samples", [...form.samples, emptySample(form.samples.length)]);
  const removeSample = (id: string) => set("samples", form.samples.filter((s) => s.id !== id));
  function importRoster(text: string) {
    try {
      const r = rosterFromCsv(form.samples, text);
      set("samples", r.samples);
      setRosterErrors(r.errors);
      const parts = [`${r.added} ${r.added === 1 ? "conta adicionada" : "contas adicionadas"}, ${r.updated} atualizada${r.updated === 1 ? "" : "s"}.`];
      if (r.overLimit) parts.push(`${r.overLimit} não ${r.overLimit === 1 ? "adicionada" : "adicionadas"}: o laboratório comporta ${REQ_MAX_SAMPLES}.`);
      if (r.errors.length) parts.push(`${r.errors.length} ${r.errors.length === 1 ? "linha não pôde" : "linhas não puderam"} ser lida${r.errors.length === 1 ? "" : "s"} (veja abaixo).`);
      setRosterStatus(parts.join(" "));
    } catch (e) {
      setRosterErrors([]);
      setRosterStatus(e instanceof Error ? e.message : "Não foi possível ler este arquivo.");
    }
  }
  function exportRoster() {
    const day = new Date().toISOString().slice(0, 10);
    downloadText(`kingdomops-sample-accounts-${day}.csv`, `\uFEFF${rosterToCsv(check.card)}`, "text/csv;charset=utf-8");
    setRosterErrors([]);
    setRosterStatus("CSV pronto: confira seus downloads.");
  }

  const results = check.card.sampleAccounts.map((s) => ({ s, r: formula.parsed?.ok ? evaluatePlayer(check.card, s.stats) : null }));
  const passing = results.filter((x) => x.r?.ok && x.r.met === true).length;

  let summary: string;
  if (formula.error) summary = `Erro na fórmula: ${formula.error}`;
  else if (check.bandIssues.length || Object.keys(check.errors).some((k) => k.startsWith("band-") || k === "fixed")) summary = "Corrija o requisito para ver quem passa.";
  else if (results.length === 0) summary = "Adicione uma conta de exemplo para testar o cartão.";
  else summary = `${passing} de ${results.length} ${results.length === 1 ? "conta de exemplo cumpre" : "contas de exemplo cumprem"} o requisito.`;

  const rankA = useMemo(() => rankSamples(check.card.formula, check.card.sampleAccounts), [check]);
  const rankB = useMemo(() => (compare.parsed?.ok ? rankSamples(form.compare, check.card.sampleAccounts) : null), [check, form.compare]);

  // ---- Save / open / delete / publish
  function onSave() {
    setLink("");
    if (!canPublish) {
      setSaveError("Corrija primeiro os campos destacados.");
      setStatus("");
      return;
    }
    try {
      const { st } = kingdomStorage();
      saveCard(check.card, st);
      setSaved(listCards(st));
      setSaveError("");
      setStatus(`"${cardTitle(check.card)}" salvo neste aparelho.`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }
  function onOpen(c: RequirementsCard) {
    setForm(cardToForm(c));
    setLink("");
    setSaveError("");
    setStatus(`"${cardTitle(c)}" aberto.`);
  }
  function onDelete(c: RequirementsCard) {
    const { st } = kingdomStorage();
    deleteCard(c.id, st);
    setSaved(listCards(st));
    setStatus(`"${cardTitle(c)}" apagado.`);
  }
  function onNew() {
    setForm(cardToForm(newCard()));
    setLink("");
    setSaveError("");
    setStatus("Novo cartão iniciado.");
  }
  async function onPublish() {
    if (!canPublish) {
      setSaveError("Corrija primeiro os campos destacados.");
      return;
    }
    setSaveError("");
    try {
      setLink(await publishLink(check.card));
      setStatus("Link pronto. Copie e poste onde os seus jogadores leem os avisos.");
    } catch (e) {
      setSaveError(e instanceof Error && e.name === "ShareTooLargeError" ? `${e.message} Encurte as notas.` : "Não foi possível gerar o link neste navegador.");
    }
  }

  const bandErr = (i: number, k: string) => check.errors[`band-${i}-${k}`];

  return (
    <div class="kr">
      {blocked && <p class="kg-error" data-blocked>Este navegador bloqueia o salvamento. Seu cartão dura até você fechar esta página; publique o link para guardá-lo.</p>}

      <section class="kg-card" aria-labelledby="kr-about-h">
        <h2 id="kr-about-h">Detalhes do cartão</h2>
        <div class="kr-fields">
          <TextField id="kr-kingdom" label="Reino" hint="Até 40 caracteres, ex.: K1234." value={form.kingdom} onValue={(v) => set("kingdom", v)} maxLength={40} />
          <TextField id="kr-title" label="Título do cartão (opcional)" value={form.title} onValue={(v) => set("title", v)} maxLength={80} />
          <SelectField<ReqStage> id="kr-stage" label="Fase" value={form.stage} options={STAGE_OPTIONS} onValue={(v) => set("stage", v)} />
          {form.stage === "other" && <TextField id="kr-stage-other" label="Nome da fase" value={form.stageOther} onValue={(v) => set("stageOther", v)} maxLength={40} />}
        </div>
      </section>

      <section class="kg-card" aria-labelledby="kr-formula-h">
        <h2 id="kr-formula-h">Fórmula de DKP</h2>
        <p class="kg-note">DKP não é um número do jogo: cada reino define a própria fórmula. Comece por um exemplo publicado ou escreva a sua.</p>
        <SelectField id="kr-preset" label="Começar de" value={form.presetId ?? CUSTOM} options={PRESET_OPTIONS} onValue={pickPreset} />
        <FormulaField id="kr-formula" label="Fórmula" value={form.formula} onValue={editFormula} />
        {preset ? (
          <div class="kr-source" data-source>
            <p><strong>{preset.label}</strong>: fórmula publicada de um reino (fato {preset.factId}, confiança {preset.confidence}).</p>
            {preset.ruleNote && <p data-rule-note>Nota da regra: {preset.ruleNote}</p>}
          </div>
        ) : (
          <p class="kr-source" data-source>Sua própria fórmula: definida pelo seu conselho.</p>
        )}
        <p class="kg-note" data-not-comparable>{WEIGHTS_NOT_COMPARABLE}</p>
        <div class="kr-excluded" data-excluded-rule>
          <CheckField
            id="kr-excl"
            label="Mortos em dias excluídos não contam"
            hint={`Uma regra publicada de um reino (K2779, fato ${EXCLUDED_DEADS_FACT_ID}): mortos num dia em que o jogador foi zerado numa 'troca terrível' contam como 0. Os jogadores informam esses mortos à parte e eles são descontados antes da fórmula.`}
            checked={form.excludedOn}
            onValue={(v) => set("excludedOn", v)}
          />
          {form.excludedOn && (
            <>
              <TextField
                id="kr-excl-label"
                label="Dias excluídos são dias em que o jogador foi…"
                hint="Completa a frase mostrada aos jogadores. Em branco, usa o texto do K2779."
                value={form.excludedLabel}
                onValue={(v) => set("excludedLabel", v)}
                maxLength={EXCLUDED_DEADS_LABEL_MAX}
                placeholder={EXCLUDED_DEADS_DEFAULT_LABEL}
              />
              <p class="kg-hint" data-excluded-preview>Os jogadores leem: {excludedDeadsText(check.card.excludedDeads)}</p>
            </>
          )}
        </div>
      </section>

      <section class="kg-card" aria-labelledby="kr-req-h">
        <h2 id="kr-req-h">Requisito</h2>
        <fieldset class="kr-choice">
          <legend class="kg-label">Tipo de requisito</legend>
          {([["percent", "Porcentagem do poder, por faixa de poder"], ["fixed", "Uma meta fixa de DKP para todos"]] as const).map(([v, l]) => (
            <label key={v} class="kr-radio">
              <input type="radio" name="kr-mode" value={v} checked={form.mode === v} onChange={() => set("mode", v)} />
              <span>{l}</span>
            </label>
          ))}
        </fieldset>
        {form.mode === "percent" ? (
          <div class="kr-bands">
            <p class="kg-hint">Uma faixa cobre o poder do seu valor mínimo até (sem incluir) o limite superior. Deixe o último limite em branco para "e acima". {EXAMPLE_PERCENT}% é um exemplo de um reino real (fato B08-0002); o seu conselho define os números de verdade.</p>
            {form.bands.map((b, i) => (
              <fieldset key={b.key} class="kr-band" data-band={i}>
                <legend class="kg-label">Faixa {i + 1}</legend>
                <div class="kr-band-fields">
                  <TextField id={`kr-band-${i}-min`} label="A partir do poder" value={b.min} onValue={(v) => setBand(i, "min", v)} error={bandErr(i, "min")} placeholder="0" />
                  <TextField id={`kr-band-${i}-max`} label="Até o poder" hint="Em branco = sem limite" value={b.max} onValue={(v) => setBand(i, "max", v)} error={bandErr(i, "max")} placeholder="ex.: 20m" />
                  <TextField id={`kr-band-${i}-pct`} label="Meta de DKP (% do poder)" value={b.pct} onValue={(v) => setBand(i, "pct", v)} error={bandErr(i, "pct")} inputMode="decimal" placeholder="250" />
                </div>
                {form.bands.length > 1 && <button type="button" class="btn btn-secondary" aria-label={`Remover faixa ${i + 1}`} onClick={() => removeBand(i)}>Remover faixa</button>}
              </fieldset>
            ))}
            {/* Problemas de uma faixa aparecem sob o campo dela; aqui só os da lista toda. */}
            {check.bandIssues.some((x) => x.index < 0 || !x.field) && (
              <ul class="kr-issues" data-band-issues>
                {check.bandIssues.filter((x) => x.index < 0 || !x.field).map((x, i) => <li key={i} class="kg-error">{x.message}</li>)}
              </ul>
            )}
            {form.bands.length < MAX_BANDS && <button type="button" class="btn btn-secondary" onClick={addBand}>Adicionar faixa</button>}
          </div>
        ) : (
          <TextField id="kr-fixed" label="Meta de DKP" hint="Aceita 5000000, 5m ou 500k." value={form.fixed} onValue={(v) => set("fixed", v)} error={check.errors.fixed} placeholder="ex.: 5m" />
        )}
        <div class="kr-groups" data-groups>
          <h3>Grupos de requisito (opcional)</h3>
          <p class="kg-hint" id="kr-groups-hint">Alguns reinos ajustam o requisito pela idade da conta, pelo seed ou pelo grupo de jogadores (fato {REQUIREMENT_FACT_ID}). Nenhuma fonte pública dá os números, então cada grupo e porcentagem aqui é definido pelo seu conselho. Os jogadores escolhem o grupo e precisam dessa porcentagem da meta normal, arredondada para cima.</p>
          {form.groups.map((g, i) => (
            <fieldset key={g.key} class="kr-group" data-group={i}>
              <legend class="kg-label">Grupo {i + 1}</legend>
              <div class="kr-group-fields">
                <TextField id={`kr-group-${i}-name`} label="Nome do grupo" value={g.name} onValue={(v) => setGroup(i, "name", v)} error={check.errors[`group-${i}-name`]} maxLength={REQ_GROUP_NAME_MAX} placeholder="ex.: Contas com menos de 6 meses" />
                <TextField id={`kr-group-${i}-pct`} label="% da meta normal" value={g.pct} onValue={(v) => setGroup(i, "pct", v)} error={check.errors[`group-${i}-pct`]} inputMode="decimal" placeholder="definido pelo seu conselho" />
              </div>
              <button type="button" class="btn btn-secondary" aria-label={`Remover grupo ${i + 1}`} onClick={() => removeGroup(i)}>Remover grupo</button>
            </fieldset>
          ))}
          {form.groups.length < MAX_GROUPS && <button type="button" class="btn btn-secondary" onClick={addGroup}>Adicionar grupo</button>}
        </div>
        <TextField
          id="kr-basis"
          label="Qual poder é a base"
          hint="Nenhuma fonte pública diz qual poder conta (leitura inicial, poder de tropas ou poder máximo), então é decisão do seu conselho. Aparece no cartão."
          value={form.powerBasis}
          onValue={(v) => set("powerBasis", v)}
          maxLength={120}
        />
        <p class="kg-note">O progresso é medido pelos ganhos entre a leitura inicial e a final (o delta), não pelos totais de sempre (fato B08-0002).</p>
        <TextAreaField id="kr-notes" label="Notas e exceções (opcional)" hint="Até 1.000 caracteres. Ex.: farms isentas, como contam os dias zerados." value={form.notes} onValue={(v) => set("notes", v)} maxLength={1000} rows={4} />
      </section>

      <section class="kg-card" aria-labelledby="kr-sandbox-h">
        <h2 id="kr-sandbox-h">Laboratório: teste em contas de exemplo</h2>
        <p class="kg-note">As contas de exemplo ficam neste aparelho e nunca entram no link publicado. Use números inventados, ou números que os seus jogadores aceitaram compartilhar.</p>
        <div class="kr-samples">
          {form.samples.map((s) => (
            <fieldset key={s.id} class="kr-sample" data-sample={s.id}>
              <legend class="kg-label">{s.name || "Conta sem nome"}</legend>
              <div class="kr-sample-fields">
                <TextField id={`kr-s-${s.id}-name`} label="Nome" value={s.name} onValue={(v) => setSample(s.id, (x) => ({ ...x, name: v }))} maxLength={40} />
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
              <button type="button" class="btn btn-secondary" aria-label={`Remover ${s.name || "esta conta"}`} onClick={() => removeSample(s.id)}>Remover</button>
            </fieldset>
          ))}
        </div>
        <div class="kg-actions">
          {form.samples.length < REQ_MAX_SAMPLES && <button type="button" class="btn btn-secondary" onClick={addSample}>Adicionar conta de exemplo</button>}
          <CsvImport label="Importar contas (CSV)" describedBy="kr-csv-hint" testId="roster" onText={importRoster} onError={(m) => { setRosterErrors([]); setRosterStatus(m); }} />
          <button type="button" class="btn btn-secondary" onClick={exportRoster} disabled={form.samples.length === 0}>Exportar contas (CSV)</button>
        </div>
        <p class="kg-hint" id="kr-csv-hint">CSV com a primeira linha nomeando as colunas: "name" (ou "nome") mais qualquer um de power, t1–t5, deads, kp. O mesmo nome atualiza aquela conta.</p>
        <p class="kg-status" role="status" aria-live="polite" data-roster-status>{rosterStatus}</p>
        {rosterErrors.length > 0 && (
          <ul class="kg-error" data-roster-errors>
            {rosterErrors.slice(0, 20).map((e) => <li key={e.line}>Linha {e.line}: {e.message}</li>)}
            {rosterErrors.length > 20 && <li>…e mais {rosterErrors.length - 20}.</li>}
          </ul>
        )}

        <p class="kr-summary" role="status" aria-live="polite" data-summary>{summary}</p>
        {results.length > 0 && formula.parsed?.ok && (
          <div class="kg-table-wrap" role="region" aria-labelledby="kr-results-cap" tabIndex={0}>
            <table class="kg-table kr-table" data-results>
              <caption id="kr-results-cap" class="kr-caption">Resultados dos exemplos</caption>
              <thead><tr><th scope="col">Conta</th><th scope="col" class="num">DKP</th><th scope="col" class="num">Meta</th><th scope="col" class="num"><abbr title="Porcentagem da meta">%</abbr></th><th scope="col">Resultado</th></tr></thead>
              <tbody>
                {results.map(({ s, r }) => (
                  <tr key={s.id} data-result={s.id}>
                    <th scope="row">{s.name || "Sem nome"}</th>
                    {r && r.ok ? (
                      <>
                        <td class="num" title={formatInt(r.dkp)}>{formatCompact(r.dkp)}</td>
                        <td class="num">{r.target === null ? "Sem faixa" : formatCompact(r.target)}</td>
                        <td class="num">{pct(r.percentOfTarget)}</td>
                        <td data-met={String(r.met)}>{r.met === null ? "—" : r.met ? "Passou" : "Abaixo"}</td>
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
        <h2 id="kr-compare-h">Comparar com outra fórmula (opcional)</h2>
        <p class="kg-note">Veja como muda o ranking das suas contas de exemplo com uma segunda fórmula. Ela não é publicada.</p>
        <SelectField
          id="kr-compare-preset"
          label="Preencher com um modelo"
          value={comparePreset}
          options={COMPARE_OPTIONS}
          onValue={(v) => { setComparePreset(v); const p = presetById(v); if (p) set("compare", p.formula); }}
        />
        <FormulaField id="kr-compare" label="Segunda fórmula" value={form.compare} onValue={(v) => { setComparePreset(""); set("compare", v); }} required={false} hint="Deixe em branco para pular." />
        {rankB && rankA.length > 0 && (
          <div class="kg-table-wrap" role="region" aria-labelledby="kr-compare-cap" tabIndex={0}>
            <table class="kg-table kr-table" data-compare>
              <caption id="kr-compare-cap" class="kr-caption">Ranking: fórmula do cartão x segunda fórmula</caption>
              <thead><tr><th scope="col">Conta</th><th scope="col" class="num">Posição atual</th><th scope="col" class="num">Posição com a segunda</th><th scope="col">Mudança</th></tr></thead>
              <tbody>
                {rankA.map((a, i) => {
                  const b = rankB[i]!;
                  const change = a.rank === null || b.rank === null ? "—" : b.rank < a.rank ? `Sobe ${a.rank - b.rank}` : b.rank > a.rank ? `Desce ${b.rank - a.rank}` : "Igual";
                  return (
                    <tr key={a.id}>
                      <th scope="row">{a.name || "Sem nome"}</th>
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
        <h2 id="kr-publish-h">Salvar e publicar</h2>
        <p class="kg-note">Publicar gera um link para a página Meus requisitos. Os jogadores abrem, digitam os próprios números e veem a meta e o progresso. O link leva só o cartão, nunca as contas de exemplo.</p>
        <div class="kg-actions">
          <button type="button" class="btn btn-primary" onClick={onPublish} data-publish>Publicar cartão</button>
          <button type="button" class="btn btn-secondary" onClick={onSave}>Salvar neste aparelho</button>
          <button type="button" class="btn btn-secondary" onClick={onNew}>Novo cartão</button>
        </div>
        {saveError && <p class="kg-error" role="alert">{saveError}</p>}
        <p class="kg-status" role="status" aria-live="polite">{status}</p>
        {link && (
          <div class="kr-link" data-link>
            <CopyText id="kr-link" label="Link para os seus jogadores" text={link} variant="link" copyLabel="Copiar link" hint="Quem tiver este link pode ler o cartão." />
            {linkLengthHint(link) === "long" && <p class="kg-error" data-long>Este link é longo ({link.length.toLocaleString("pt-BR")} caracteres) e pode ser cortado no Discord (2.000 por mensagem). Encurte as notas, ou poste-o no tópico de um canal ou num documento.</p>}
            <p><a href={link.replace(/^https?:\/\/[^/]+/, "")} target="_blank" rel="noopener">Ver como jogador</a></p>
          </div>
        )}
        <h3>Cartões salvos</h3>
        {saved.length === 0 ? (
          <p class="kg-note" data-saved-empty>Nenhum cartão salvo neste aparelho ainda.</p>
        ) : (
          <ul class="kr-saved" data-saved>
            {saved.map((c) => (
              <li key={c.id}>
                <span class="kr-saved-name">{cardTitle(c)}</span>
                <div class="kg-actions">
                  <button type="button" class="btn btn-secondary" aria-label={`Abrir ${cardTitle(c)}`} onClick={() => onOpen(c)}>Abrir</button>
                  <ConfirmAction label="Apagar" ariaLabel={`Apagar ${cardTitle(c)}`} question={`Apagar "${cardTitle(c)}"?`} onConfirm={() => onDelete(c)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
