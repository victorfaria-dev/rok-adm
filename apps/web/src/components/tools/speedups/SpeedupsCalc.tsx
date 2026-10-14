import {
  coverJob, formatDuration, mergeCites, parseDuration, speedupTotals, SPEEDUP_TYPES,
  type Cite, type JobType, type SpeedupCounts, type SpeedupType,
} from "@rokadm/planner/tools";
import { NumberField, SelectField } from "../kit/NumberField";
import { ResultRow, Results } from "../kit/Result";
import { ShareBar } from "../kit/ShareBar";
import { useToolInputs } from "../kit/useToolInputs";
import { DurationField } from "./DurationField";

export interface SpeedupsCalcProps {
  /** Alliance Center level → times you can be helped (A01 Alliance Center table). */
  helps: { level: number; helps: number }[];
  helpPct: number;
  cites: { durations: Cite; helps: Cite; helpPct: Cite };
}

/** Item durations as printed in item names ("Universal Speedup (5m)"): UI labels, in minutes. */
const DURATIONS: readonly { min: number; label: string }[] = [
  { min: 1, label: "1m" }, { min: 5, label: "5m" }, { min: 10, label: "10m" }, { min: 15, label: "15m" },
  { min: 30, label: "30m" }, { min: 60, label: "60m" }, { min: 180, label: "3h" }, { min: 480, label: "8h" },
  { min: 900, label: "15h" }, { min: 1440, label: "24h" }, { min: 4320, label: "3d" }, { min: 10080, label: "7d" },
];

const NAME: Record<SpeedupType, string> = { universal: "Universal", building: "Construção", research: "Pesquisa", training: "Treinamento", healing: "Cura" };
const INV_KEY: Record<SpeedupType, string> = {
  universal: "speedupUniversalMin", building: "speedupBuildingMin", research: "speedupResearchMin",
  training: "speedupTrainingMin", healing: "speedupHealingMin",
};
const JOBS: readonly JobType[] = ["building", "research", "training", "healing"];

const countKey = (t: SpeedupType, min: number): string => `${t}_${min}`;

function defaults(): Record<string, number | string> {
  const d: Record<string, number | string> = { editType: "universal", jobTime: "1d", jobType: "building", acLevel: 0 };
  for (const t of SPEEDUP_TYPES) {
    d[INV_KEY[t]] = 0;
    for (const x of DURATIONS) d[countKey(t, x.min)] = 0;
  }
  return d;
}

const fmt = (n: number) => n.toLocaleString("pt-BR");
const mins = (m: number) => formatDuration(m * 60);

/** F-81: add up speedups by type and check them against a job's time (alliance helps included). */
export default function SpeedupsCalc({ helps, helpPct, cites }: SpeedupsCalcProps) {
  const { values: v, set, shared, shareUrl, keepMine, useLink } = useToolInputs("speedups", defaults(), Object.values(INV_KEY));

  const countsOf = (vals: Record<string, number | string>, t: SpeedupType): SpeedupCounts =>
    Object.fromEntries(DURATIONS.map((x) => [x.min, Number(vals[countKey(t, x.min)]) || 0]));
  const totals = speedupTotals(Object.fromEntries(SPEEDUP_TYPES.map((t) => [t, countsOf(v, t)])) as Record<SpeedupType, SpeedupCounts>);

  const editType = (SPEEDUP_TYPES as readonly string[]).includes(String(v.editType)) ? (v.editType as SpeedupType) : "universal";
  const jobType = (JOBS as readonly string[]).includes(String(v.jobType)) ? (v.jobType as JobType) : "building";
  const jobSeconds = parseDuration(String(v.jobTime)) ?? 0;
  const ac = helps.find((h) => h.level === Number(v.acLevel));
  const helpCount = ac?.helps ?? 0;
  const cover = coverJob({ jobSeconds, job: jobType, typedMinutes: totals[jobType], universalMinutes: totals.universal, helps: helpCount, pctPerHelp: helpPct });

  const setCount = (t: SpeedupType, min: number, n: number): void => {
    const next = { ...v, [countKey(t, min)]: n };
    set({ [countKey(t, min)]: n, [INV_KEY[t]]: speedupTotals({ [t]: countsOf(next, t) })[t] });
  };

  const durationNote = "Durações como aparecem no nome dos itens.";
  const helpNote = `Cada ajuda tira ${helpPct}% do tempo total da tarefa. Presume que não há mínimo por ajuda: nossos dados não trazem nenhum.`;

  return (
    <div class="t-page-body" data-tool="speedups">
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Quantidade de acelerações">
        <SelectField id="sp-type" label="Tipo de aceleração a preencher" value={editType} onChange={(x) => set({ editType: x })}
          options={SPEEDUP_TYPES.map((t) => ({ value: t, label: `${NAME[t]} (${mins(totals[t])})` }))}
          help="Escolha um tipo e digite quantos itens de cada duração você tem." />
        <div class="t-sp-grid">
          {DURATIONS.map((x) => (
            <NumberField key={`${editType}-${x.min}`} id={`sp-${editType}-${x.min}`} label={`${NAME[editType]} ${x.label}`}
              value={Number(v[countKey(editType, x.min)]) || 0} max={1000000} onChange={(n) => setCount(editType, x.min, n)} />
          ))}
        </div>
      </form>

      <Results title="Suas acelerações">
        {SPEEDUP_TYPES.map((t) => (
          <ResultRow key={t} testId={`sp-total-${t}`} label={`Acelerações (${NAME[t].toLowerCase()})`} value={mins(totals[t])} cite={cites.durations} />
        ))}
        <ResultRow testId="sp-total-all" label="Todas as acelerações juntas" value={mins(totals.total)} cite={cites.durations}
          notes={[durationNote, "Os totais por tipo ficam neste aparelho; o planejador de cura lê o seu total de cura."]} />
      </Results>

      <section class="t-sp-job" aria-labelledby="sp-job-h">
        <h2 id="sp-job-h">Compare com uma tarefa</h2>
        <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Tarefa a concluir">
          <DurationField id="sp-job-time" label="Tempo da tarefa" value={String(v.jobTime)} onChange={(text) => set({ jobTime: text })}
            help="Como aparece no jogo, por exemplo 2d 4h 30m." />
          <SelectField id="sp-job-type" label="Tipo de tarefa" value={jobType} onChange={(x) => set({ jobType: x })}
            options={JOBS.map((j) => ({ value: j, label: NAME[j] }))} />
          <SelectField id="sp-ac" label="Nível do seu Centro da Aliança" value={Number(v.acLevel) || 0} onChange={(x) => set({ acLevel: x })}
            options={[{ value: 0, label: "Sem ajudas da aliança" }, ...helps.map((h) => ({ value: h.level, label: `Nível ${h.level} (${h.helps} ajudas)` }))]}
            help="Define quantas vezes os aliados podem ajudar em uma tarefa." />
        </form>
      </section>

      <section class="t-results" aria-labelledby="sp-job-res-h">
        <h2 id="sp-job-res-h">Resultado da tarefa</h2>
        <dl aria-live="polite">
        <ResultRow testId="sp-helps" label="Tempo reduzido pelas ajudas da aliança"
          value={jobType === "training" ? "Nenhum: treinamento não recebe ajuda" : `${mins(cover.helped / 60)} (${fmt(helpCount)} ajudas)`}
          cite={mergeCites(cites.helps, cites.helpPct)} notes={[helpNote]} />
        <ResultRow testId="sp-remaining" label="Tempo restante para acelerar" value={formatDuration(cover.remaining)} cite={mergeCites(cites.helps, cites.helpPct)} />
        <ResultRow testId="sp-used" label={`Acelerações usadas (${NAME[jobType].toLowerCase()} primeiro, depois universal)`}
          value={`${mins(cover.typedUsedMin)} ${NAME[jobType].toLowerCase()} + ${mins(cover.universalUsedMin)} universal`} cite={cites.durations} />
        <ResultRow testId="sp-cover" label="Suas acelerações concluem a tarefa?"
          value={cover.covered ? `Sim, sobram ${mins(totals[jobType] + totals.universal - cover.typedUsedMin - cover.universalUsedMin)}` : `Não, faltam ${formatDuration(cover.shortfall)}`}
          cite={mergeCites(cites.durations, cites.helps, cites.helpPct)} />
        </dl>
      </section>
      <ShareBar shareUrl={shareUrl} shared={shared} keepMine={keepMine} useLink={useLink} />
    </div>
  );
}
