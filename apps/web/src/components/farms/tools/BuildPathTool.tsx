// F-66 "Build path" island: the farm's levels against the CH11 → CH17 → CH22 path. Recalculates live.
import { FARM_FOCUSES, buildPath, type BuildCheckField, type BuildStep, type BuildStepStatus, type FarmFocus } from "@rokadm/planner";
import type { JSX } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { FARM_LEVEL_RANGES, readFarms, updateFarm, type Farm, type FarmLevelField } from "../../../lib/farms-store";
import { RESOURCE_LABEL, errorOf, farmIdFromSearch, parseIntInRange, valueOf, type Parsed } from "../../../lib/farms-tools";
import { Sourced } from "../shared/Sourced";
import { SelectField, TextField } from "./Field";

export const LEVEL_LABEL: Record<BuildCheckField, string> = {
  cityHall: "Prefeitura",
  tradingPost: "Entreposto Comercial",
  goldmine: "Mina de Ouro",
  academy: "Academia",
  commanderLevel: "Nível do comandante de coleta",
};
const FIELDS = Object.keys(LEVEL_LABEL) as FarmLevelField[];

export const STATUS_TEXT: Record<BuildStepStatus, string> = {
  done: "Concluído",
  todo: "A fazer",
  unknown: "Informe seu nível para conferir",
  info: "Info",
};
const STATUS_ICON: Record<BuildStepStatus, string> = { done: "✓", todo: "!", unknown: "?", info: "i" };

const FOCUS_OPTIONS = FARM_FOCUSES.map((f) => ({ value: f, label: f === "general" ? "Todos os recursos" : RESOURCE_LABEL[f] }));

type LevelText = Record<FarmLevelField, string>;
const emptyText = (): LevelText => ({ cityHall: "", tradingPost: "", goldmine: "", academy: "", commanderLevel: "" });
const textOf = (f: Farm): LevelText => {
  const t = emptyText();
  for (const k of FIELDS) t[k] = f.levels[k] === null ? "" : String(f.levels[k]);
  return t;
};

function StatusMark({ status }: { status: BuildStepStatus }): JSX.Element {
  return (
    <span class={`ft-status ft-status-${status}`} data-step-status={status}>
      <span class="ft-icon" aria-hidden="true">{STATUS_ICON[status]}</span>
      {STATUS_TEXT[status]}
    </span>
  );
}

function levelLine(s: BuildStep): string | null {
  if (!s.check) return null;
  const need = `Precisa de ${LEVEL_LABEL[s.check.field]} ${s.check.min}.`;
  return s.current === null ? `${need} Você: não informado.` : `${need} Você: ${s.current}.`;
}

function StepItem({ s }: { s: BuildStep }): JSX.Element {
  const line = levelLine(s);
  return (
    <li class="ft-step" data-step={s.id}>
      <div class="ft-step-line">
        <StatusMark status={s.status} />
        <span class="ft-step-label">{s.label}</span>
      </div>
      {line && <p class="ft-step-level">{line}</p>}
      <p class="ft-step-detail">{s.detail}</p>
      <details class="ft-details">
        <summary>Fontes deste passo</summary>
        <Sourced confidence={s.confidence} facts={s.facts} gaps={s.gaps} hypothesis={s.hypothesis} />
      </details>
    </li>
  );
}

export default function BuildPathTool(): JSX.Element {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState("");
  const [text, setText] = useState<LevelText>(emptyText);
  const [focus, setFocus] = useState<FarmFocus>("general");
  const [missing, setMissing] = useState(false);
  const [saved, setSaved] = useState("");

  const load = (f: Farm | undefined) => {
    setFarmId(f ? f.id : "");
    if (f) {
      setText(textOf(f));
      setFocus(f.role);
    }
    setSaved("");
  };

  useEffect(() => {
    const list = readFarms().farms;
    setFarms(list);
    const id = farmIdFromSearch(window.location.search);
    if (id) {
      const f = list.find((x) => x.id === id);
      if (f) load(f);
      else setMissing(true);
    }
  }, []);

  const parsed = Object.fromEntries(
    FIELDS.map((k) => [k, parseIntInRange(text[k], FARM_LEVEL_RANGES[k][0], FARM_LEVEL_RANGES[k][1])]),
  ) as Record<FarmLevelField, Parsed<number>>;
  const hasErrors = FIELDS.some((k) => errorOf(parsed[k]));
  const levels = Object.fromEntries(FIELDS.map((k) => [k, valueOf(parsed[k])])) as Record<FarmLevelField, number | null>;

  const path = useMemo(() => buildPath(levels, focus), [JSON.stringify(levels), focus]);
  const farm = farms.find((f) => f.id === farmId);

  const steps = path.stages.flatMap((s) => s.steps);
  const checkable = steps.filter((s) => s.status !== "info");
  const done = checkable.filter((s) => s.status === "done").length;
  const unknown = checkable.filter((s) => s.status === "unknown").length;
  const summary = hasErrors
    ? "Corrija os campos destacados para atualizar o caminho."
    : path.next
      ? `Próximo passo: ${path.next.label}. ${done} de ${checkable.length} passos conferidos concluídos.`
      : unknown > 0
        ? `Informe seus níveis para achar o próximo passo. ${done} de ${checkable.length} passos conferidos concluídos.`
        : `Todos os passos conferidos estão concluídos (${done} de ${checkable.length}).`;

  const setLevel = (k: FarmLevelField) => (v: string) => {
    setText((t) => ({ ...t, [k]: v }));
    setSaved("");
  };

  const save = () => {
    if (!farm || hasErrors) return;
    try {
      const s = updateFarm(farm.id, { levels: levels, role: focus });
      setFarms(s.farms);
      setSaved(`Salvo em ${farm.name}.`);
    } catch (e) {
      setSaved(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };

  const farmOptions = [{ value: "", label: "Informar níveis à mão" }, ...farms.map((f) => ({ value: f.id, label: f.name }))];

  return (
    <div class="ft">
      <form class="fm-card ft-form" aria-labelledby="bp-form-h" onSubmit={(e) => e.preventDefault()}>
        <h2 id="bp-form-h">Sua conta farm</h2>
        {missing && <p class="fm-note" data-missing>Essa conta farm não está salva neste navegador. Informe os níveis à mão.</p>}
        {farms.length > 0 ? (
          <SelectField id="bp-farm" label="Conta farm" value={farmId} options={farmOptions} onValue={(id) => load(farms.find((f) => f.id === id))} />
        ) : (
          <p class="fm-note">Nenhuma conta farm salva ainda. Informe os níveis à mão ou adicione uma em <a href="/farms/">Minhas contas farm</a>.</p>
        )}
        <div class="ft-fields">
          {FIELDS.map((k) => (
            <TextField
              key={k}
              id={`bp-${k}`}
              label={LEVEL_LABEL[k]}
              hint={`Nível ${FARM_LEVEL_RANGES[k][0]} a ${FARM_LEVEL_RANGES[k][1]}. Deixe em branco se não souber.`}
              value={text[k]}
              onValue={setLevel(k)}
              error={errorOf(parsed[k])}
            />
          ))}
          <SelectField id="bp-focus" label="Foco" hint="O que a conta farm mais coleta. Define os passos da Academia." value={focus} options={FOCUS_OPTIONS} onValue={(v) => { setFocus(v); setSaved(""); }} />
        </div>
        {farm && (
          <div class="fm-actions">
            <button type="button" class="btn btn-secondary" disabled={hasErrors} onClick={save} aria-describedby="bp-save-status">Salvar níveis em {farm.name}</button>
          </div>
        )}
        <p id="bp-save-status" class="ft-saved" role="status">{saved}</p>
      </form>

      <section class="ft-section" aria-labelledby="bp-next-h">
        <h2 id="bp-next-h">Próximo passo</h2>
        <p class="ft-live" aria-live="polite" data-summary>{summary}</p>
        {path.next && (
          <article class="fm-card ft-next" data-next={path.next.id}>
            <h3>{path.next.label}</h3>
            {levelLine(path.next) && <p>{levelLine(path.next)}</p>}
            <p>{path.next.detail}</p>
            <Sourced confidence={path.next.confidence} facts={path.next.facts} gaps={path.next.gaps} />
          </article>
        )}
      </section>

      <section class="ft-section" aria-labelledby="bp-path-h">
        <h2 id="bp-path-h">Caminho de construção</h2>
        <ol class="ft-steps" data-stages>
          {path.stages.map((stage) => (
            <li key={stage.id} data-stage={stage.id}>
              <h3>{stage.label}{stage.complete ? " (concluído)" : ""}</h3>
              <ol class="ft-steps">
                {stage.steps.map((s) => <StepItem key={s.id} s={s} />)}
              </ol>
            </li>
          ))}
        </ol>
      </section>

      <section class="fm-card" aria-labelledby="bp-tp-h">
        <h2 id="bp-tp-h">Desbloqueio do Entreposto Comercial: contestado</h2>
        <p>{path.tradingPostUnlock.text}</p>
        <Sourced confidence={path.tradingPostUnlock.confidence} facts={path.tradingPostUnlock.facts} gaps={path.tradingPostUnlock.gaps} />
      </section>
    </div>
  );
}
