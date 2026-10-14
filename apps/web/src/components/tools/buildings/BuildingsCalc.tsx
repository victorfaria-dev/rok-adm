import { buffedSeconds, cleanRequirement, formatDuration, upgradeCost, type Cite, type LevelCost, type UpgradeCost } from "@rokadm/planner/tools";
import { NumberField, SelectField } from "../kit/NumberField";
import { ResultRow, Results } from "../kit/Result";
import { ShareBar } from "../kit/ShareBar";
import { useToolInputs } from "../kit/useToolInputs";

export interface BuildingRow extends LevelCost { requirements: string | null }

export interface BuildingTable { id: string; name: string; rows: BuildingRow[]; cite: Cite }

export interface BuildingsCalcProps { tables: BuildingTable[] }

const fmt = (n: number) => n.toLocaleString("pt-BR");
const res = (n: number) => (n === 0 ? "Nenhum" : fmt(n));
const levels = (xs: number[]) => xs.join(", ");

/** F-81: resources, items and raw time from one level to another, any building. */
export default function BuildingsCalc({ tables }: BuildingsCalcProps) {
  const first = tables[0]!;
  const { values: v, set, shared, shareUrl, keepMine, useLink } = useToolInputs("buildings", { building: first.id, from: 9, to: 10, bonusPct: 0 });
  const table = tables.find((t) => t.id === v.building) ?? first;
  const max = table.rows.reduce((m, r) => Math.max(m, r.level), 0);
  const from = Math.min(Math.max(0, Math.floor(v.from)), max);
  const to = Math.min(Math.max(1, Math.floor(v.to)), max);

  let cost: UpgradeCost | null = null;
  let error: string | null = null;
  try {
    cost = upgradeCost(table.rows, from, to);
  } catch (e) {
    error = e instanceof RangeError ? "Escolha um nível alvo acima do seu nível atual." : "Não foi possível ler estes níveis.";
  }
  const target = table.rows.find((r) => r.level === to);
  const req = cleanRequirement(target?.requirements);
  const c = table.cite;
  const notes: string[] = [];
  if (cost?.skipped.length) notes.push(`Nível ${levels(cost.skipped)} fora da conta: essa linha da tabela de origem está ilegível. Confira no jogo.`);
  if (cost?.missingTime.length) notes.push(`Sem tempo bruto na tabela para o nível ${levels(cost.missingTime)}: o tempo mostrado não o inclui.`);
  const bonusNote = "Lido como tempo bruto ÷ (1 + bônus). O bônus é um número seu (medição pendente).";

  return (
    <div class="t-page-body" data-tool="buildings">
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Construção e níveis">
        <SelectField id="b-building" label="Construção" value={table.id} onChange={(x) => set({ building: x })}
          options={tables.map((t) => ({ value: t.id, label: t.name }))} />
        <SelectField id="b-from" label="Nível atual" value={from} onChange={(x) => set({ from: x })}
          options={[{ value: 0, label: "Ainda não construído" }, ...table.rows.map((r) => ({ value: r.level, label: `Nível ${r.level}` }))]} />
        <SelectField id="b-to" label="Nível alvo" value={to} onChange={(x) => set({ to: x })}
          options={table.rows.map((r) => ({ value: r.level, label: `Nível ${r.level}` }))} />
        <NumberField id="b-bonus" label="Seu bônus de velocidade de construção" suffix="%" value={v.bonusPct} max={1000} integer={false} pending
          onChange={(x) => set({ bonusPct: x })} help="Da tela de informações da Prefeitura. 0 mostra o tempo bruto." />
      </form>
      {error || !cost ? (
        <p class="t-error" role="alert" data-testid="b-error">{error}</p>
      ) : (
        <>
        {from === to ? <p class="t-note" data-testid="b-same">Você já está neste nível: nada a pagar.</p> : null}
        <Results title={`${table.name}: nível ${from} a ${to}`}>
          <ResultRow testId="b-food" label="Comida" value={res(cost.food)} cite={c} notes={notes} />
          <ResultRow testId="b-wood" label="Madeira" value={res(cost.wood)} cite={c} />
          <ResultRow testId="b-stone" label="Pedra" value={res(cost.stone)} cite={c} />
          <ResultRow testId="b-gold" label="Ouro" value={res(cost.gold)} cite={c} />
          <ResultRow testId="b-items" label="Itens" cite={c}
            value={cost.items.length ? cost.items.map((i) => `${i.name} ×${fmt(i.count)}`).join(", ") : "Nenhum"}
            notes={cost.unreadableExtra.length ? [`A célula de itens do nível ${levels(cost.unreadableExtra)} não é legível na tabela de origem.`] : []} />
          <ResultRow testId="b-time" label="Tempo bruto de construção" value={formatDuration(cost.seconds)} cite={c} />
          <ResultRow testId="b-time-buffed" label={`Tempo com bônus de velocidade de ${fmt(v.bonusPct)}%`} value={formatDuration(buffedSeconds(cost.seconds, v.bonusPct))}
            cite={c} pending={["bônus de velocidade de construção"]} notes={[bonusNote]} />
          <ResultRow testId="b-req" label={`Necessário para o nível ${to}`} value={req ?? "Nada listado"} cite={c} />
        </Results>
        </>
      )}
      <ShareBar shareUrl={shareUrl} shared={shared} keepMine={keepMine} useLink={useLink} />
    </div>
  );
}
